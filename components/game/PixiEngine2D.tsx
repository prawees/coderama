"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { audio } from "@/lib/audio";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useERStore, ActiveCase } from "@/lib/erStore";

export interface Vector2 { x: number; y: number; }
type Direction = 'up' | 'down' | 'left' | 'right';

export interface MapData {
  width: number;
  height: number;
  walls: Vector2[];
  interactables: {
    x: number;
    y: number;
    id: string;
    type: 'bed' | 'door' | 'computer' | 'prop';
    target?: string;
    variant?: string;
  }[];
}

interface Engine2DProps {
  mapData: MapData;
  onInteract: (id: string, type: string) => void;
  onDoor: (target: string) => void;
  activeCases: ActiveCase[];
  clockMinutes?: number;
  spawnPos?: { x: number; y: number };
  era?: string;
  npcEmote?: string | null;
  currentDay?: number;
  isFastForwarding?: boolean;
}

const TILE_SIZE = 32;
const SCALE = 2;
const REAL_TILE = TILE_SIZE * SCALE;

export function PixiEngine2D({ mapData, onInteract, onDoor, activeCases, clockMinutes = 120, spawnPos, era = 'MED_Y5', npcEmote, currentDay = 1, isFastForwarding = false }: Engine2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const interactablesContainerRef = useRef<PIXI.Container | null>(null);
  const prevPromptRef = useRef<string | null>(null);
  const [nearbyPrompt, setNearbyPrompt] = useState<string | null>(null);
  const { appearance } = useERStore();

  // We manage position locally in Pixi for smoothness, but keep a React state for interactions
  const playerPosRef = useRef(spawnPos || { x: 3, y: 5 });

  // Virtual D-Pad controls - we set keys directly to bypass React render loop latency
  const handleMoveDown = useCallback((d: Direction) => {
      if (!appRef.current) return;
      const app = appRef.current as any;
      if (!app.__keys) app.__keys = {};
      app.__keys[d] = true;
  }, []);

  const handleMoveUp = useCallback((d?: Direction) => {
     if (!appRef.current) return;
     const app = appRef.current as any;
     if (!app.__keys) app.__keys = {};
     if (typeof d === 'string') {
        app.__keys[d] = false;
     } else {
        app.__keys = {};
     }
  }, []);

  const handleInteract = useCallback(() => {
     const app = appRef.current as any;
     if (!app) return;
     const facingDir = app.__facingDir || 'down';
     
     // Check tile in front
     let targetX = Math.round(playerPosRef.current.x);
     let targetY = Math.round(playerPosRef.current.y);
     if (facingDir === 'up') targetY -= 1;
     if (facingDir === 'down') targetY += 1;
     if (facingDir === 'left') targetX -= 1;
     if (facingDir === 'right') targetX += 1;

     // 1. Check NPCs (Nurse Ann & Dr. Grump)
     const nurse = app.__npcs?.nurse;
     const grump = app.__npcs?.grump;

     if (nurse) {
       const nPos = (nurse as any).__gridPos || { x: Math.round(nurse.x / REAL_TILE), y: Math.round(nurse.y / REAL_TILE) };
       const dist = Math.hypot(playerPosRef.current.x - nurse.x / REAL_TILE, playerPosRef.current.y - nurse.y / REAL_TILE);
       if ((Math.abs(nPos.x - targetX) <= 0.6 && Math.abs(nPos.y - targetY) <= 0.6) || dist < 1.3) {
         Haptics.impact({ style: ImpactStyle.Medium }).catch(()=>{});
         onInteract('nurse_ann', 'npc');
         return;
       }
     }

     if (grump) {
       const gPos = (grump as any).__gridPos || { x: Math.round(grump.x / REAL_TILE), y: Math.round(grump.y / REAL_TILE) };
       const dist = Math.hypot(playerPosRef.current.x - grump.x / REAL_TILE, playerPosRef.current.y - grump.y / REAL_TILE);
       if ((Math.abs(gPos.x - targetX) <= 0.6 && Math.abs(gPos.y - targetY) <= 0.6) || dist < 1.3) {
         Haptics.impact({ style: ImpactStyle.Medium }).catch(()=>{});
         onInteract('grump_npc', 'npc');
         return;
       }
     }

     // 2. Check Map Interactables
     let interactable = mapData.interactables.find(i => i.x === targetX && i.y === targetY);
     if (!interactable) {
       interactable = mapData.interactables.find(i => Math.hypot(i.x - playerPosRef.current.x, i.y - playerPosRef.current.y) < 1.25);
     }

     if (interactable) {
       Haptics.impact({ style: ImpactStyle.Medium }).catch(()=>{});
       onInteract(interactable.id, interactable.type);
       return;
     }
  }, [mapData, onInteract]);

  useEffect(() => {
    if (appRef.current) {
       (appRef.current as any).__isFastForwarding = isFastForwarding;
    }
  }, [isFastForwarding]);

  // Helper to render rich pixel art interactables and patients
  const drawInteractables = useCallback((container: PIXI.Container, map: MapData, cases: ActiveCase[]) => {
    container.removeChildren();

    map.interactables.forEach(item => {
      const itemContainer = new PIXI.Container();
      itemContainer.x = item.x * REAL_TILE;
      itemContainer.y = item.y * REAL_TILE;

      if (item.type === 'bed') {
        const bedG = new PIXI.Graphics();
        // Metal Headboard
        bedG.rect(2, 2, REAL_TILE - 4, 8);
        bedG.fill({ color: 0x475569 });
        // Clean Mattress
        bedG.rect(4, 10, REAL_TILE - 8, REAL_TILE - 14);
        bedG.fill({ color: 0xffffff });
        bedG.stroke({ color: 0xcbd5e1, width: 2 });
        // Pillow
        bedG.rect(10, 12, REAL_TILE - 20, 12);
        bedG.fill({ color: 0xf1f5f9 });
        bedG.stroke({ color: 0xe2e8f0, width: 1 });
        // Folded Blanket
        bedG.rect(4, 28, REAL_TILE - 8, REAL_TILE - 32);
        bedG.fill({ color: 0x1d4ed8 });
        bedG.stroke({ color: 0x1e40af, width: 2 });
        // Top Sheet Fold
        bedG.rect(4, 28, REAL_TILE - 8, 4);
        bedG.fill({ color: 0x60a5fa });

        itemContainer.addChild(bedG);

        // Check if patient is in this bed
        const bedIndex = parseInt(item.id.replace('bed_', '')) - 1;
        const assignedCase = cases.find(c => c.bedIndex === bedIndex);

        if (assignedCase) {
          const patientG = new PIXI.Graphics();
          const skinHex = parseInt((assignedCase.skinTone || '#f1c27d').replace('#', ''), 16);
          const shirtHex = parseInt((assignedCase.shirtColor || '#1f6feb').replace('#', ''), 16);

          // Head on pillow
          patientG.circle(REAL_TILE / 2, 18, 7);
          patientG.fill({ color: skinHex });
          patientG.stroke({ color: 0x000000, width: 1 });

          // Torso under blanket
          patientG.rect(REAL_TILE / 2 - 8, 24, 16, 12);
          patientG.fill({ color: shirtHex });

          itemContainer.addChild(patientG);

          // Status Badge / Expiration Alert
          const isCritical = Date.now() > assignedCase.expiresAt - 60000;
          const statusBadge = new PIXI.Graphics();
          if (isCritical) {
            statusBadge.circle(REAL_TILE / 2, -6, 8);
            statusBadge.fill({ color: 0xef4444 });
            statusBadge.stroke({ color: 0xffffff, width: 2 });
            const alertText = new PIXI.Text({
              text: "!",
              style: { fontFamily: "monospace", fontSize: 13, fontWeight: "bold", fill: 0xffffff }
            });
            alertText.anchor.set(0.5);
            alertText.x = REAL_TILE / 2;
            alertText.y = -6;
            itemContainer.addChild(statusBadge);
            itemContainer.addChild(alertText);
          } else {
            statusBadge.circle(REAL_TILE / 2, -6, 7);
            statusBadge.fill({ color: 0x16a34a });
            statusBadge.stroke({ color: 0xffffff, width: 1.5 });
            const heartText = new PIXI.Text({
              text: "♥",
              style: { fontFamily: "monospace", fontSize: 10, fill: 0xffffff }
            });
            heartText.anchor.set(0.5);
            heartText.x = REAL_TILE / 2;
            heartText.y = -6;
            itemContainer.addChild(statusBadge);
            itemContainer.addChild(heartText);
          }
        }
      } else if (item.type === 'computer') {
        const compG = new PIXI.Graphics();
        // Desk
        compG.rect(2, 40, REAL_TILE - 4, REAL_TILE - 42);
        compG.fill({ color: 0x334155 });
        // Monitor bezel
        compG.rect(8, 8, REAL_TILE - 16, 28);
        compG.fill({ color: 0x0f172a });
        compG.stroke({ color: 0x64748b, width: 2 });
        // Screen glow
        const screenColor = item.id === 'leaderboard' ? 0x059669 : 0x2563eb;
        compG.rect(12, 12, REAL_TILE - 24, 20);
        compG.fill({ color: screenColor });
        compG.rect(14, 18, REAL_TILE - 28, 3);
        compG.fill({ color: 0xffffff, alpha: 0.6 });
        // Stand
        compG.rect(REAL_TILE / 2 - 3, 36, 6, 6);
        compG.fill({ color: 0x64748b });

        itemContainer.addChild(compG);
      } else if (item.type === 'door') {
        const doorG = new PIXI.Graphics();
        doorG.rect(0, 0, REAL_TILE, REAL_TILE);
        doorG.fill({ color: 0x78350f });
        doorG.stroke({ color: 0x451a03, width: 3 });
        doorG.rect(6, 6, REAL_TILE - 12, (REAL_TILE - 16) / 2);
        doorG.fill({ color: 0x92400e });
        doorG.rect(6, REAL_TILE / 2 + 2, REAL_TILE - 12, (REAL_TILE - 16) / 2);
        doorG.fill({ color: 0x92400e });
        doorG.circle(REAL_TILE - 10, REAL_TILE / 2, 3);
        doorG.fill({ color: 0xfacc15 });

        itemContainer.addChild(doorG);
      } else if (item.type === 'prop') {
        const propG = new PIXI.Graphics();
        if (item.variant === 'green_chair') {
          propG.rect(6, 6, REAL_TILE - 12, REAL_TILE - 12);
          propG.fill({ color: 0x15803d });
          propG.stroke({ color: 0x166534, width: 2 });
          propG.rect(10, 10, REAL_TILE - 20, 14);
          propG.fill({ color: 0x22c55e });
        } else if (item.variant === 'm150_box') {
          propG.rect(10, 14, REAL_TILE - 20, REAL_TILE - 24);
          propG.fill({ color: 0xeab308 });
          propG.stroke({ color: 0xa16207, width: 2 });
          const mText = new PIXI.Text({
            text: "M",
            style: { fontFamily: "monospace", fontSize: 13, fontWeight: "bold", fill: 0xb91c1c }
          });
          mText.anchor.set(0.5);
          mText.x = REAL_TILE / 2;
          mText.y = REAL_TILE / 2 + 2;
          itemContainer.addChild(propG);
          itemContainer.addChild(mText);
        } else if (item.variant === 'mama_cup') {
          propG.circle(REAL_TILE / 2, REAL_TILE / 2, 12);
          propG.fill({ color: 0xdc2626 });
          propG.stroke({ color: 0x991b1b, width: 2 });
          propG.circle(REAL_TILE / 2, REAL_TILE / 2, 8);
          propG.fill({ color: 0xfef08a });
        } else {
          propG.rect(4, 4, REAL_TILE - 8, REAL_TILE - 8);
          propG.fill({ color: 0x22c55e });
        }
        if (item.variant !== 'm150_box') itemContainer.addChild(propG);
      }

      container.addChild(itemContainer);
    });
  }, []);

  // Update beds whenever activeCases change
  useEffect(() => {
    if (interactablesContainerRef.current) {
      drawInteractables(interactablesContainerRef.current, mapData, activeCases);
    }
  }, [activeCases, drawInteractables, mapData]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let isMounted = true;
    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        resizeTo: containerRef.current!,
        backgroundColor: 0x0a0c10,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!isMounted) {
        app.destroy(true);
        return;
      }

      appRef.current = app;
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      const safeHair = appearance?.hairStyle === 'hair_short' ? 'hair_1' : (appearance?.hairStyle || 'hair_1');
      const safeTop = appearance?.topStyle === 'top_scrubs' ? 'top_1' : (appearance?.topStyle || 'top_1');

      // Load Layer Assets
      PIXI.Assets.add({ alias: 'tileset', src: '/assets/tileset.jpg' });
      PIXI.Assets.add({ alias: 'body', src: '/assets/layers/body.png' });
      PIXI.Assets.add({ alias: 'hair', src: `/assets/layers/${safeHair}.png` });
      PIXI.Assets.add({ alias: 'top', src: `/assets/layers/${safeTop}.png` });
      PIXI.Assets.add({ alias: 'bottom', src: '/assets/layers/bottom_1.png' });
      PIXI.Assets.add({ alias: 'shoes', src: '/assets/layers/shoes_1.png' });
      PIXI.Assets.add({ alias: 'nurse', src: '/assets/nurse_sprite.png' });
      
      let textures;
      try {
        textures = await PIXI.Assets.load(['tileset', 'body', 'hair', 'top', 'bottom', 'shoes', 'nurse']);
      } catch (e) {
        console.error("Failed to load PixiEngine2D textures", e);
        return;
      }
      if (!isMounted) return;

      // Create main game container (Camera)
      const world = new PIXI.Container();
      app.stage.addChild(world);

      // 1. Draw Floor
      const floor = new PIXI.TilingSprite({
         texture: textures.tileset,
         width: mapData.width * REAL_TILE,
         height: mapData.height * REAL_TILE
      });
      world.addChild(floor);

      // 2. Draw Walls
      mapData.walls.forEach(w => {
         const wall = new PIXI.Graphics();
         wall.rect(0, 0, REAL_TILE, REAL_TILE);
         wall.fill({ color: 0x1e293b, alpha: 0.95 });
         wall.stroke({ color: 0x334155, width: 2 });
         wall.x = w.x * REAL_TILE;
         wall.y = w.y * REAL_TILE;
         world.addChild(wall);
      });

      // 3. Draw Interactables Layer (Beds, Computers, Doors, Props, Patients)
      const interactablesLayer = new PIXI.Container();
      interactablesContainerRef.current = interactablesLayer;
      drawInteractables(interactablesLayer, mapData, activeCases);
      world.addChild(interactablesLayer);

      // 4. Setup Layered Player Container
      const playerContainer = new PIXI.Container();
      // If spawnPos is provided, update the player pos ref for the new map!
      if (spawnPos) {
        playerPosRef.current = spawnPos;
      }
      playerContainer.x = playerPosRef.current.x * REAL_TILE;
      playerContainer.y = playerPosRef.current.y * REAL_TILE;
      playerContainer.scale.set(SCALE);

      const createLayerSprite = (texture: PIXI.Texture, hexColor: string) => {
        const frameWidth = texture.width / 3;
        const frameHeight = texture.height / 4;
        const getFrames = (row: number) => {
           return [
             new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(0, row * frameHeight, frameWidth, frameHeight) }),
             new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(frameWidth, row * frameHeight, frameWidth, frameHeight) }),
             new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(frameWidth * 2, row * frameHeight, frameWidth, frameHeight) }),
             new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(frameWidth, row * frameHeight, frameWidth, frameHeight) })
           ];
        };
        const animations = {
          down: getFrames(0), left: getFrames(1), right: getFrames(2), up: getFrames(3)
        };
        const sprite = new PIXI.AnimatedSprite(animations.down);
        sprite.animationSpeed = 0.1;
        sprite.anchor.set(0.5, 0.5);
        sprite.tint = parseInt((hexColor || '#ffffff').replace('#', ''), 16);
        // Store animations array on sprite for easy swapping in ticker
        (sprite as any).__animations = animations;
        return sprite;
      };

      const bodySprite = createLayerSprite(textures.body, appearance?.skinColor);
      const bottomSprite = createLayerSprite(textures.bottom, appearance?.bottomColor);
      const shoesSprite = createLayerSprite(textures.shoes, appearance?.shoeColor);
      const topSprite = createLayerSprite(textures.top, appearance?.topColor);
      const hairSprite = createLayerSprite(textures.hair, appearance?.hairColor);

      playerContainer.addChild(bodySprite);
      playerContainer.addChild(bottomSprite);
      playerContainer.addChild(shoesSprite);
      playerContainer.addChild(topSprite);
      playerContainer.addChild(hairSprite);

      world.addChild(playerContainer);

      // 5. Setup NPCs
      const npcContainer = new PIXI.Container();
      
      const createNPC = (texture: PIXI.Texture, startX: number, startY: number, tintHex?: number) => {
         const frameWidth = texture.width / 3;
         const frameHeight = texture.height / 4;
         const getFrames = (row: number) => {
            return [
              new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(0, row * frameHeight, frameWidth, frameHeight) }),
              new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(frameWidth, row * frameHeight, frameWidth, frameHeight) }),
              new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(frameWidth * 2, row * frameHeight, frameWidth, frameHeight) }),
              new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(frameWidth, row * frameHeight, frameWidth, frameHeight) })
            ];
         };
         const animations = {
           down: getFrames(0), left: getFrames(1), right: getFrames(2), up: getFrames(3)
         };
         const sprite = new PIXI.AnimatedSprite(animations.down);
         sprite.animationSpeed = 0.05;
         sprite.anchor.set(0.5, 0.5);
         if (tintHex) sprite.tint = tintHex;
         (sprite as any).__animations = animations;
         (sprite as any).__targetPos = { x: startX * REAL_TILE, y: startY * REAL_TILE };
         (sprite as any).__gridPos = { x: startX, y: startY };
         (sprite as any).__moveTimer = 0;
         sprite.x = startX * REAL_TILE;
         sprite.y = startY * REAL_TILE;
         const targetHeight = REAL_TILE * 1.25; // slightly taller than a tile
         const targetScale = targetHeight / frameHeight;
         sprite.scale.set(targetScale);
         return sprite;
      };

      const nurseAnn = createNPC(textures.nurse, 8, 5);
      const drGrump = createNPC(textures.nurse, 12, 3, 0xffcccc); // Red tint for grump
      
      // Nurse Ann Nameplate
      const nurseNameBadge = new PIXI.Container();
      const nurseBg = new PIXI.Graphics();
      nurseBg.roundRect(-24, -10, 48, 14, 4);
      nurseBg.fill({ color: 0x000000, alpha: 0.75 });
      nurseBg.stroke({ color: 0x38bdf8, width: 1 });
      const nurseTxt = new PIXI.Text({
        text: npcEmote ? `Ann ${npcEmote}` : "Ann",
        style: { fontFamily: "monospace", fontSize: 9, fill: 0x38bdf8, fontWeight: "bold" }
      });
      nurseTxt.anchor.set(0.5);
      nurseNameBadge.addChild(nurseBg);
      nurseNameBadge.addChild(nurseTxt);
      nurseNameBadge.y = -REAL_TILE * 0.6;
      nurseAnn.addChild(nurseNameBadge);

      // Dr. Grump Nameplate
      const grumpNameBadge = new PIXI.Container();
      const grumpBg = new PIXI.Graphics();
      grumpBg.roundRect(-26, -10, 52, 14, 4);
      grumpBg.fill({ color: 0x000000, alpha: 0.75 });
      grumpBg.stroke({ color: 0xf87171, width: 1 });
      const grumpTxt = new PIXI.Text({
        text: "Aj. Grump",
        style: { fontFamily: "monospace", fontSize: 9, fill: 0xfca5a5, fontWeight: "bold" }
      });
      grumpTxt.anchor.set(0.5);
      grumpNameBadge.addChild(grumpBg);
      grumpNameBadge.addChild(grumpTxt);
      grumpNameBadge.y = -REAL_TILE * 0.6;
      drGrump.addChild(grumpNameBadge);

      npcContainer.addChild(nurseAnn);
      npcContainer.addChild(drGrump);
      world.addChild(npcContainer);

      (app as any).__npcs = { nurse: nurseAnn, grump: drGrump };

      // Initialize keys and direction state
      (app as any).__keys = (app as any).__keys || {};
      (app as any).__facingDir = (app as any).__facingDir || 'down';
      
      // Ticker Loop
      app.ticker.add((ticker) => {
         const isFF = (app as any).__isFastForwarding;
         const speedMultiplier = isFF ? 15 : 1;
         const speed = 4 * speedMultiplier; 

         const keys = (app as any).__keys || {};
         let moveDir: Direction | null = null;
         
         // Priority mapping for native polling
         if (keys['up'] || keys['ArrowUp'] || keys['w']) moveDir = 'up';
         else if (keys['down'] || keys['ArrowDown'] || keys['s']) moveDir = 'down';
         else if (keys['left'] || keys['ArrowLeft'] || keys['a']) moveDir = 'left';
         else if (keys['right'] || keys['ArrowRight'] || keys['d']) moveDir = 'right';

         if (moveDir) {
            (app as any).__facingDir = moveDir;
            playerContainer.children.forEach((child) => {
               const sprite = child as PIXI.AnimatedSprite;
               if (!sprite.playing) sprite.play();
               const anims = (sprite as any).__animations;
               if (anims && sprite.textures !== anims[moveDir as Direction]) {
                  sprite.textures = anims[moveDir as Direction];
                  sprite.play();
               }
            });

            const bodySprite = playerContainer.children[0] as PIXI.AnimatedSprite;
            if (bodySprite) {
               const frame = bodySprite.currentFrame;
               const prevFrame = (app as any).__prevFrame;
               if (frame !== prevFrame && (frame === 0 || frame === 2)) {
                  audio.playFootstep();
               }
               (app as any).__prevFrame = frame;
            }

            let nextX = playerContainer.x;
            let nextY = playerContainer.y;

            if (moveDir === 'up') nextY -= speed * ticker.deltaTime;
            if (moveDir === 'down') nextY += speed * ticker.deltaTime;
            if (moveDir === 'left') nextX -= speed * ticker.deltaTime;
            if (moveDir === 'right') nextX += speed * ticker.deltaTime;

            // AABB Sliding Collision
            const halfTile = REAL_TILE / 2;
            const hitRadius = REAL_TILE * 0.35; // Slightly smaller than half tile to allow sliding

            const isPointBlocked = (x: number, y: number) => {
                const tx = Math.floor(x / REAL_TILE);
                const ty = Math.floor(y / REAL_TILE);
                if (tx < 0 || ty < 0 || tx >= mapData.width || ty >= mapData.height) return true;
                return mapData.walls.some(w => w.x === tx && w.y === ty);
            };

            // Check X collision independent of Y
            if (
               isPointBlocked(nextX - hitRadius + halfTile, playerContainer.y + halfTile) || 
               isPointBlocked(nextX + hitRadius + halfTile, playerContainer.y + halfTile)
            ) {
               nextX = playerContainer.x; 
            }
            
            // Check Y collision independent of X
            if (
               isPointBlocked(playerContainer.x + halfTile, nextY - hitRadius + halfTile) || 
               isPointBlocked(playerContainer.x + halfTile, nextY + hitRadius + halfTile)
            ) {
               nextY = playerContainer.y; 
            }
            
            playerContainer.x = nextX;
            playerContainer.y = nextY;
            playerPosRef.current = { x: nextX / REAL_TILE, y: nextY / REAL_TILE };
               
            // Check Door Trigger (center point)
            const tileX = Math.floor((nextX + halfTile) / REAL_TILE);
            const tileY = Math.floor((nextY + halfTile) / REAL_TILE);
            const door = mapData.interactables.find(i => i.x === tileX && i.y === tileY && i.type === 'door');
            if (door && door.target && (app as any).__canDoor !== false) {
               (app as any).__canDoor = false; // debounce
               onDoor(door.target);
               setTimeout(() => { if (app) (app as any).__canDoor = true; }, 1000);
            }
         } else {
            playerContainer.children.forEach((child) => {
               const sprite = child as PIXI.AnimatedSprite;
               sprite.stop();
               sprite.currentFrame = 1; // Stand still
            });
         }
         
         // Smooth Camera Lerp Clamped to Map Dimensions
         const mapPixelWidth = mapData.width * REAL_TILE;
         const mapPixelHeight = mapData.height * REAL_TILE;

         let targetCamX = (app.screen.width / 2) - playerContainer.x;
         let targetCamY = (app.screen.height / 2) - playerContainer.y;

         if (mapPixelWidth > app.screen.width) {
           targetCamX = Math.min(0, Math.max(targetCamX, app.screen.width - mapPixelWidth));
         } else {
           targetCamX = (app.screen.width - mapPixelWidth) / 2;
         }

         if (mapPixelHeight > app.screen.height) {
           targetCamY = Math.min(0, Math.max(targetCamY, app.screen.height - mapPixelHeight));
         } else {
           targetCamY = (app.screen.height - mapPixelHeight) / 2;
         }

         world.x += (targetCamX - world.x) * 0.12 * ticker.deltaTime;
         world.y += (targetCamY - world.y) * 0.12 * ticker.deltaTime;

         // Proximity Prompt Calculation
         let promptText: string | null = null;
         const px = playerPosRef.current.x;
         const py = playerPosRef.current.y;

         if (nurseAnn && Math.hypot(px - nurseAnn.x / REAL_TILE, py - nurseAnn.y / REAL_TILE) < 1.35) {
           promptText = "TALK: NURSE ANN";
         } else if (drGrump && Math.hypot(px - drGrump.x / REAL_TILE, py - drGrump.y / REAL_TILE) < 1.35) {
           promptText = "TALK: DR. GRUMP";
         } else {
           const facing = (app as any).__facingDir || 'down';
           let fx = Math.round(px);
           let fy = Math.round(py);
           if (facing === 'up') fy -= 1;
           if (facing === 'down') fy += 1;
           if (facing === 'left') fx -= 1;
           if (facing === 'right') fx += 1;

           let targetItem = mapData.interactables.find(i => i.x === fx && i.y === fy);
           if (!targetItem) {
             targetItem = mapData.interactables.find(i => Math.hypot(i.x - px, i.y - py) < 1.25);
           }

           if (targetItem) {
             if (targetItem.type === 'bed') {
               const bedIdx = parseInt(targetItem.id.replace('bed_', '')) - 1;
               const hasPatient = activeCases.some(c => c.bedIndex === bedIdx);
               promptText = hasPatient ? `TREAT PATIENT (BED ${bedIdx + 1})` : `BED ${bedIdx + 1} (EMPTY)`;
             } else if (targetItem.type === 'computer') {
               promptText = targetItem.id === 'leaderboard' ? "VIEW LEADERBOARD" : "VIEW CONSULTS";
             } else if (targetItem.type === 'door') {
               promptText = targetItem.target === 'AMBULANCE_BAY' ? "ENTER AMBULANCE BAY" : "ENTER ER";
             }
           }
         }

         if (promptText !== prevPromptRef.current) {
           prevPromptRef.current = promptText;
           setNearbyPrompt(promptText);
         }

         // NPC AI Loop
         npcContainer.children.forEach((child) => {
            const npc = child as PIXI.AnimatedSprite;
            const target = (npc as any).__targetPos;
            const anims = (npc as any).__animations;
            
            // Move towards target
            const dx = target.x - npc.x;
            const dy = target.y - npc.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 2) {
               // Walking
               const walkSpeed = (2 * speedMultiplier) * ticker.deltaTime;
               if (dist < walkSpeed) {
                  npc.x = target.x;
                  npc.y = target.y;
               } else {
                  npc.x += (dx / dist) * walkSpeed;
                  npc.y += (dy / dist) * walkSpeed;
               }
               
               if (!npc.playing) npc.play();
               npc.animationSpeed = 0.05 * speedMultiplier;
               
               // Direction
               let newDir: Direction = 'down';
               if (Math.abs(dx) > Math.abs(dy)) {
                  newDir = dx > 0 ? 'right' : 'left';
               } else {
                  newDir = dy > 0 ? 'down' : 'up';
               }
               
               if (npc.textures !== anims[newDir]) {
                  npc.textures = anims[newDir];
                  npc.play();
               }
            } else {
               // Arrived / Idle
               npc.stop();
               npc.currentFrame = 1;
               
               (npc as any).__moveTimer += ticker.deltaTime * speedMultiplier;
               if ((npc as any).__moveTimer > 120) { // Wait roughly 2 seconds (60fps * 2)
                  (npc as any).__moveTimer = 0;
                  
                  // Pick a new adjacent valid tile
                  if (Math.random() > 0.3) { // 70% chance to move
                     const dirs: Direction[] = ['up', 'down', 'left', 'right'];
                     const pickDir = dirs[Math.floor(Math.random() * dirs.length)];
                     const gridPos = (npc as any).__gridPos;
                     let nx = gridPos.x;
                     let ny = gridPos.y;
                     if (pickDir === 'up') ny -= 1;
                     if (pickDir === 'down') ny += 1;
                     if (pickDir === 'left') nx -= 1;
                     if (pickDir === 'right') nx += 1;
                     
                     // Check bounds and walls
                     const isWall = mapData.walls.some(w => w.x === nx && w.y === ny);
                     const isInteractable = mapData.interactables.some(i => i.x === nx && i.y === ny);
                     
                     if (!isWall && !isInteractable && nx >= 0 && ny >= 0 && nx < mapData.width && ny < mapData.height) {
                        (npc as any).__gridPos = { x: nx, y: ny };
                        (npc as any).__targetPos = { x: nx * REAL_TILE, y: ny * REAL_TILE };
                     }
                  }
               }
            }
         });

         // Note: camera lerping is calculated smoothly above
      });
    };

    initPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [mapData, appearance]); // Only rebuild when mapData or appearance changes

  // Keyboard controls effect - direct native polling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appRef.current) {
         (appRef.current as any).__keys = (appRef.current as any).__keys || {};
         (appRef.current as any).__keys[e.key] = true;
      }
      if (e.key === ' ' || e.key === 'Enter') {
         // Debounce interaction
         if (!(window as any).__interactDebounce) {
            (window as any).__interactDebounce = true;
            handleInteract();
            setTimeout(() => { (window as any).__interactDebounce = false; }, 300);
         }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (appRef.current) {
         (appRef.current as any).__keys = (appRef.current as any).__keys || {};
         (appRef.current as any).__keys[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInteract]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden touch-none select-none">
      
      {/* Canvas Mount Point */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* VIRTUAL D-PAD OVERLAY */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center opacity-70 z-50 pointer-events-auto">
        <button 
          className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl mb-1"
          onTouchStart={() => handleMoveDown('up')} onTouchEnd={() => handleMoveUp()}
          onMouseDown={() => handleMoveDown('up')} onMouseUp={() => handleMoveUp()}
          onMouseLeave={() => handleMoveUp()}
        >↑</button>
        <div className="flex gap-1">
          <button 
            className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl"
            onTouchStart={() => handleMoveDown('left')} onTouchEnd={() => handleMoveUp()}
            onMouseDown={() => handleMoveDown('left')} onMouseUp={() => handleMoveUp()}
            onMouseLeave={() => handleMoveUp()}
          >←</button>
          <button 
            className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl"
            onTouchStart={() => handleMoveDown('down')} onTouchEnd={() => handleMoveUp()}
            onMouseDown={() => handleMoveDown('down')} onMouseUp={() => handleMoveUp()}
            onMouseLeave={() => handleMoveUp()}
          >↓</button>
          <button 
            className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl"
            onTouchStart={() => handleMoveDown('right')} onTouchEnd={() => handleMoveUp()}
            onMouseDown={() => handleMoveDown('right')} onMouseUp={() => handleMoveUp()}
            onMouseLeave={() => handleMoveUp()}
          >→</button>
        </div>
      </div>
      
      {/* INTERACT PROMPT & BUTTON */}
      <div className="absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col items-center gap-2">
        {nearbyPrompt && (
          <div className="bg-black/90 border-2 border-[#58a6ff] text-[#58a6ff] px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider shadow-lg animate-bounce pointer-events-none whitespace-nowrap font-pixel">
            {nearbyPrompt}
          </div>
        )}
        <button 
          className="w-20 h-20 md:w-24 md:h-24 bg-red-600 border-4 border-red-800 active:bg-red-400 rounded-full flex flex-col items-center justify-center text-white text-xl font-bold font-pixel shadow-xl shadow-red-900/50"
          onClick={handleInteract}
        >
          <span>A</span>
          <span className="text-[10px] text-red-200">ACTION</span>
        </button>
      </div>
    </div>
  );
}
