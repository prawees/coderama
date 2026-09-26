"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { audio } from "@/lib/audio";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useERStore, ActiveCase } from "@/lib/erStore";
import { renderCharacterSheet, specFromAppearance, GRUMP_SPEC, ANN_SPEC, renderPatientChip, FRAME_W, FRAME_H, SHEET_COLS, SHEET_ROWS } from "@/lib/pixelSprites";
import { nearestRamp, SKIN_RAMPS, SCRUB_RAMPS } from "@/lib/palettes";
import { tNow } from "@/lib/i18n/useT";

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
          // Palette-swapped 16×16 patient chip (skin ramp + gown ramp), integer-scaled ×2
          const chip = renderPatientChip(
            nearestRamp(assignedCase.skinTone, SKIN_RAMPS),
            nearestRamp(assignedCase.shirtColor, SCRUB_RAMPS)
          );
          const chipTex = PIXI.Texture.from(chip);
          chipTex.source.scaleMode = 'nearest';
          const patientSprite = new PIXI.Sprite(chipTex);
          patientSprite.scale.set(SCALE);
          patientSprite.x = REAL_TILE / 2 - 16;
          patientSprite.y = 10;
          itemContainer.addChild(patientSprite);

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

      // Floor tileset (external) + procedurally palette-swapped character sheets (no tinting).
      PIXI.Assets.add({ alias: 'tileset', src: '/assets/tileset.jpg' });
      let textures: { tileset: PIXI.Texture };
      try {
        textures = await PIXI.Assets.load(['tileset']) as any;
      } catch (e) {
        console.error("Failed to load PixiEngine2D textures", e);
        return;
      }
      if (!isMounted) return;

      const sheetTexture = (canvas: HTMLCanvasElement) => {
        const tex = PIXI.Texture.from(canvas);
        tex.source.scaleMode = 'nearest';
        return tex;
      };
      const playerSheet = sheetTexture(renderCharacterSheet(specFromAppearance(appearance as any)));
      const annSheet = sheetTexture(renderCharacterSheet(ANN_SPEC));
      const grumpSheet = sheetTexture(renderCharacterSheet(GRUMP_SPEC));

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

      // Slice a 3×4 sheet into 4-frame walk cycles (L, idle, R, idle). Integer scale only.
      const sliceSheet = (texture: PIXI.Texture) => {
        const fw = texture.width / SHEET_COLS;
        const fh = texture.height / SHEET_ROWS;
        const frame = (col: number, row: number) => new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(col * fw, row * fh, fw, fh) });
        const cycle = (row: number) => [frame(0, row), frame(1, row), frame(2, row), frame(1, row)];
        return { down: cycle(0), left: cycle(1), right: cycle(2), up: cycle(3) };
      };

      const playerAnims = sliceSheet(playerSheet);
      const playerSprite = new PIXI.AnimatedSprite(playerAnims.down);
      playerSprite.animationSpeed = 0.12;
      playerSprite.anchor.set(0.5, 0.75); // feet at tile centre-bottom
      (playerSprite as any).__animations = playerAnims;
      playerSprite.scale.set(SCALE);
      playerSprite.x = REAL_TILE / 2;
      playerSprite.y = REAL_TILE / 2;
      playerContainer.addChild(playerSprite);

      world.addChild(playerContainer);

      // 5. Setup NPCs - bespoke sheets, no tint hacks
      const npcContainer = new PIXI.Container();

      const createNPC = (texture: PIXI.Texture, startX: number, startY: number) => {
         const animations = sliceSheet(texture);
         const sprite = new PIXI.AnimatedSprite(animations.down);
         sprite.animationSpeed = 0.06;
         sprite.anchor.set(0.5, 0.75);
         (sprite as any).__animations = animations;
         (sprite as any).__targetPos = { x: startX * REAL_TILE, y: startY * REAL_TILE };
         (sprite as any).__gridPos = { x: startX, y: startY };
         (sprite as any).__moveTimer = 0;
         sprite.x = startX * REAL_TILE;
         sprite.y = startY * REAL_TILE;
         sprite.scale.set(SCALE);
         return sprite;
      };

      const nurseAnn = createNPC(annSheet, 8, 5);
      const drGrump = createNPC(grumpSheet, 12, 3);
      
      // Nurse Ann Nameplate
      const nurseNameBadge = new PIXI.Container();
      const nurseBg = new PIXI.Graphics();
      nurseBg.roundRect(-24, -10, 48, 14, 4);
      nurseBg.fill({ color: 0x000000, alpha: 0.75 });
      nurseBg.stroke({ color: 0x38bdf8, width: 1 });
      const nurseTxt = new PIXI.Text({
        text: npcEmote ? `${tNow('npc.ann')} ${npcEmote}` : tNow('npc.ann'),
        style: { fontFamily: "VT323, Noto Sans Thai, monospace", fontSize: 12, fill: 0x73eff7 }
      });
      nurseTxt.anchor.set(0.5);
      nurseNameBadge.addChild(nurseBg);
      nurseNameBadge.addChild(nurseTxt);
      nurseNameBadge.y = -FRAME_H * 0.85;
      nurseNameBadge.scale.set(1 / SCALE);
      nurseAnn.addChild(nurseNameBadge);

      // Dr. Grump Nameplate
      const grumpNameBadge = new PIXI.Container();
      const grumpBg = new PIXI.Graphics();
      grumpBg.roundRect(-26, -10, 52, 14, 4);
      grumpBg.fill({ color: 0x000000, alpha: 0.75 });
      grumpBg.stroke({ color: 0xf87171, width: 1 });
      const grumpTxt = new PIXI.Text({
        text: tNow('npc.grump'),
        style: { fontFamily: "VT323, Noto Sans Thai, monospace", fontSize: 12, fill: 0xef7d57 }
      });
      grumpTxt.anchor.set(0.5);
      grumpNameBadge.addChild(grumpBg);
      grumpNameBadge.addChild(grumpTxt);
      grumpNameBadge.y = -FRAME_H * 0.85;
      grumpNameBadge.scale.set(1 / SCALE);
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
           promptText = tNow('engine.talk_ann');
         } else if (drGrump && Math.hypot(px - drGrump.x / REAL_TILE, py - drGrump.y / REAL_TILE) < 1.35) {
           promptText = tNow('engine.talk_grump');
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
               promptText = hasPatient ? tNow('engine.treat_bed', { n: bedIdx + 1 }) : tNow('engine.bed_empty', { n: bedIdx + 1 });
             } else if (targetItem.type === 'computer') {
               promptText = targetItem.id === 'leaderboard' ? tNow('engine.leaderboard') : tNow('engine.consults');
             } else if (targetItem.type === 'door') {
               promptText = targetItem.target === 'AMBULANCE_BAY' ? tNow('engine.enter_bay') : tNow('engine.enter_er');
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
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
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

      {/* Keyboard hint (desktop) */}
      <div className="absolute top-3 left-3 z-40 pointer-events-none hidden [@media(hover:hover)]:block">
        <span className="bg-pixel-ink/90 border-2 border-[#333c57] text-pixel-text-muted px-2 py-1 text-sm font-pixel">{tNow('engine.controls')}</span>
      </div>

      {/* VIRTUAL D-PAD OVERLAY - touch devices only */}
      <div className="absolute bottom-6 left-6 flex-col items-center z-50 pointer-events-auto hidden [@media(hover:none)]:flex">
        <button
          className="w-16 h-16 bg-[#333c57] border-4 border-pixel-ink active:bg-[#566c86] flex items-center justify-center text-white text-2xl font-bold mb-1"
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
      
      {/* INTERACT PROMPT (all) & ACTION BUTTON (touch only) */}
      <div className="absolute bottom-6 right-6 z-50 pointer-events-auto flex flex-col items-center gap-2">
        {nearbyPrompt && (
          <div className="bg-pixel-ink border-4 border-[#41a6f6] text-[#73eff7] px-3 py-1.5 text-lg tracking-wider pixel-shadow pointer-events-none whitespace-nowrap font-pixel animate-bounce">
            {nearbyPrompt}
          </div>
        )}
        <button
          className="w-20 h-20 bg-[#d95763] border-4 border-pixel-ink active:bg-[#ef7d57] flex-col items-center justify-center text-white text-xl font-bold font-pixel pixel-shadow hidden [@media(hover:none)]:flex"
          onClick={handleInteract}
        >
          <span>E</span>
          <span className="text-[10px] text-[#ffe9c9]">{tNow('engine.action')}</span>
        </button>
      </div>
    </div>
  );
}
