"use client";

import { useEffect, useRef, useState } from "react";
import { useERStore } from "@/lib/erStore";
import { PIXEL_ASSETS, generateLayeredDoctorSprites, generatePatientSprite } from "@/lib/assets";
import { useRouter } from "next/navigation";
import { PixelButton } from "@/components/ui/PixelButton";

// Extended Map Data (0: Floor, 1: Wall, 2: Bed, 3: Desk, 4: Chair, 5: GlassDoor, 6: TriageFloor, 7: CoffeeMachine, 8: ORTable, 9: PharmacyCounter)
const MAP_COLS = 30;
const MAP_ROWS = 20;
const TILE_SIZE = 32;

// Map bedIndex to Grid Coordinates
const BED_COORDS = [
  { x: 1, y: 2 }, // Bed 0
  { x: 1, y: 8 }, // Bed 1
  { x: 9, y: 2 }, // Bed 2
  { x: 9, y: 8 }, // Bed 3
  { x: 24, y: 10 }, // Bed 4 (OR Table)
];

const MAP_DATA = [
  // 30 Cols
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,1,1,1,7,0,0,1,1,1,0,0,0,0,0,0,0,0,9,1],
  [1,2,0,0,0,1,0,0,0,2,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,9,1],
  [1,2,0,0,0,1,0,0,0,2,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,1],
  [1,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1], // Desk
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // Hallway
  [1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1],
  [1,2,0,0,0,1,0,0,0,2,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1], // Bottom ER beds
  [1,2,0,0,0,1,0,0,0,2,0,1,6,6,6,6,6,6,6,6,1,1,0,0,0,0,0,0,0,1], // Triage Area Start | OR Start
  [1,0,0,0,0,0,0,0,0,0,0,5,6,6,6,6,6,6,6,6,1,1,0,0,8,8,0,0,0,1], // Glass Door 1
  [1,0,0,0,0,0,0,0,0,0,0,5,6,4,6,4,6,4,6,4,1,1,0,0,8,8,0,0,0,1], // Glass Door 2
  [1,0,0,0,3,3,3,0,0,0,0,1,6,6,6,6,6,6,6,6,1,1,0,0,8,8,0,0,0,1], // Desk
  [1,0,0,0,0,0,0,0,0,0,0,1,6,4,6,4,6,4,6,4,1,1,0,0,8,8,0,0,0,1],
  [1,1,1,1,1,0,0,1,1,1,1,1,6,6,6,6,6,6,6,6,1,1,0,0,0,0,0,0,0,1], 
  [1,1,1,1,1,0,0,1,1,1,1,1,6,4,6,4,6,4,6,4,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,0,0,1,1,1,1,1,6,6,6,6,6,6,6,6,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,0,0,1,1,1,1,1,6,4,6,4,6,4,6,4,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,0,0,1,1,1,1,1,6,6,6,6,6,6,6,6,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const router = useRouter();
  const joystickDir = useRef<{x: number, y: number}>({x: 0, y: 0});
  const facingDir = useRef<'front' | 'back' | 'side' | 'side_flip'>('front');
  
  // React state for Interaction Prompt
  const [interactableEntity, setInteractableEntity] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({ 
        background: '#0d1117', 
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!isMounted) {
        app.destroy(true);
        return;
      }
      appRef.current = app;
      
      if (canvasRef.current) {
        canvasRef.current.appendChild(app.canvas);
      }

      // Camera Follow logic: we will set pivot and position in the ticker
      const world = new PIXI.Container();
      world.scale.set(1.5); // Fixed scale for RPG feel
      app.stage.addChild(world);

      // Load Textures
      const textures = {
        floor: await PIXI.Assets.load(PIXEL_ASSETS.Floor),
        wall: await PIXI.Assets.load(PIXEL_ASSETS.Wall),
        bed: await PIXI.Assets.load(PIXEL_ASSETS.BedEmpty),
        desk: await PIXI.Assets.load(PIXEL_ASSETS.Desk),
        chair: await PIXI.Assets.load(PIXEL_ASSETS.WaitingChair),
        glassDoor: await PIXI.Assets.load(PIXEL_ASSETS.GlassDoor),
        triageFloor: await PIXI.Assets.load(PIXEL_ASSETS.TriageFloor),
        coffeeMachine: await PIXI.Assets.load(PIXEL_ASSETS.CoffeeMachine),
        orTable: await PIXI.Assets.load(PIXEL_ASSETS.ORTable),
        pharmacyCounter: await PIXI.Assets.load(PIXEL_ASSETS.PharmacyCounter),
      };

      // Load Custom Layered Doctor Sprites
      const appearance = useERStore.getState().appearance;
      const docSprites = generateLayeredDoctorSprites(appearance);
      
      const playerTextures = {
        frontIdle: await PIXI.Assets.load(docSprites.frontIdle),
        frontWalk1: await PIXI.Assets.load(docSprites.frontWalk1),
        frontWalk2: await PIXI.Assets.load(docSprites.frontWalk2),
        backIdle: await PIXI.Assets.load(docSprites.backIdle),
        backWalk1: await PIXI.Assets.load(docSprites.backWalk1),
        backWalk2: await PIXI.Assets.load(docSprites.backWalk2),
        sideIdle: await PIXI.Assets.load(docSprites.sideIdle),
        sideWalk1: await PIXI.Assets.load(docSprites.sideWalk1),
        sideWalk2: await PIXI.Assets.load(docSprites.sideWalk2),
      };
      
      // Make textures crisp
      Object.values(textures).forEach(t => t.source.scaleMode = 'nearest');
      Object.values(playerTextures).forEach(t => t.source.scaleMode = 'nearest');

      // Draw Tilemap
      const mapContainer = new PIXI.Container();
      mapContainer.eventMode = 'static';
      for (let y = 0; y < MAP_ROWS; y++) {
        for (let x = 0; x < MAP_COLS; x++) {
          const tile = MAP_DATA[y][x];
          
          // Always lay down floor first
          const floorSprite = new PIXI.Sprite(tile === 6 ? textures.triageFloor : textures.floor);
          floorSprite.width = TILE_SIZE;
          floorSprite.height = TILE_SIZE;
          floorSprite.x = x * TILE_SIZE;
          floorSprite.y = y * TILE_SIZE;
          mapContainer.addChild(floorSprite);

          // Overlay solid objects
          if ([1, 2, 3, 4, 5, 7, 8, 9].includes(tile)) { 
            let tex = textures.wall;
            if (tile === 2) tex = textures.bed;
            else if (tile === 3) tex = textures.desk;
            else if (tile === 4) tex = textures.chair;
            else if (tile === 5) tex = textures.glassDoor;
            else if (tile === 7) tex = textures.coffeeMachine;
            else if (tile === 8) tex = textures.orTable;
            else if (tile === 9) tex = textures.pharmacyCounter;

            const objSprite = new PIXI.Sprite(tex);
            objSprite.width = TILE_SIZE;
            objSprite.height = TILE_SIZE;
            objSprite.x = x * TILE_SIZE;
            objSprite.y = y * TILE_SIZE;
            mapContainer.addChild(objSprite);
          }
        }
      }
      world.addChild(mapContainer);

      // Player Sprite
      const player = new PIXI.Sprite(playerTextures.frontIdle);
      player.width = TILE_SIZE;
      player.height = TILE_SIZE;
      player.anchor.set(0.5);
      
      let playerGridX = 5;
      let playerGridY = 11;
      player.x = (playerGridX * TILE_SIZE) + (TILE_SIZE / 2);
      player.y = (playerGridY * TILE_SIZE) + (TILE_SIZE / 2);
      
      world.addChild(player);

      // Patients Container
      const patientsContainer = new PIXI.Container();
      world.addChild(patientsContainer);

      // Floaters Container
      const floatersContainer = new PIXI.Container();
      world.addChild(floatersContainer);

      const spawnFloater = (text: string, color: string) => {
        const floater = new PIXI.Text({
           text,
           style: { fill: color, fontSize: 16, fontWeight: 'bold', stroke: { color: 0x000000, width: 3 } }
        });
        floater.anchor.set(0.5);
        floater.x = player.x;
        floater.y = player.y - 30;
        floatersContainer.addChild(floater);
      };

      // Subscribe to active cases
      const unsub = useERStore.subscribe((state, prevState) => {
        patientsContainer.removeChildren();
        
        state.activeCases.forEach(async (activeCase) => {
          if (activeCase.bedIndex !== undefined) {
            const coords = BED_COORDS[activeCase.bedIndex];
            
            // Dynamically generate and load patient texture based on cosmetic stats
            const patientSvg = generatePatientSprite({ skinTone: activeCase.skinTone, shirtColor: activeCase.shirtColor });
            const tex = await PIXI.Assets.load(patientSvg);
            tex.source.scaleMode = 'nearest';

            const patientSprite = new PIXI.Sprite(tex);
            patientSprite.width = TILE_SIZE;
            patientSprite.height = TILE_SIZE;
            patientSprite.x = coords.x * TILE_SIZE;
            patientSprite.y = coords.y * TILE_SIZE;
            
            // Add a flashing exclamation mark
            const alertText = new PIXI.Text({text: '!', style: { fill: 0xffffff, fontSize: 16, fontWeight: 'bold', stroke: { color: 0x000000, width: 3 } }});
            alertText.anchor.set(0.5);
            alertText.x = TILE_SIZE / 2;
            alertText.y = -10;
            patientSprite.addChild(alertText);
            
            patientsContainer.addChild(patientSprite);
          }
        });

        // Floating Text Logic (check against previous state)
        if (prevState) {
          if (state.xp > prevState.xp) {
            spawnFloater(`+${state.xp - prevState.xp} XP`, '#a3e635'); // success
          }
          if (state.currency > prevState.currency) {
            spawnFloater(`+$${state.currency - prevState.currency}`, '#facc15'); // gold
          }
          if (state.energy < prevState.energy) {
             spawnFloater(`-${prevState.energy - state.energy} NRG`, '#f87171'); // alert
          }
        }
      });

      const updateFacingDirection = (dx: number, dy: number) => {
        if (Math.abs(dx) > 0.1) {
          player.scale.x = dx > 0 ? 1 : -1;
        }
      };
      
      const checkForNearbyEntities = () => {
        const pX = Math.floor(player.x / TILE_SIZE);
        const pY = Math.floor(player.y / TILE_SIZE);
        
        let foundEntity: any = null;

        // 1. Check Coffee Machine (Tile 7)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const checkX = pX + dx;
            const checkY = pY + dy;
            if (checkY >= 0 && checkY < MAP_ROWS && checkX >= 0 && checkX < MAP_COLS) {
               if (MAP_DATA[checkY][checkX] === 7) {
                 foundEntity = "COFFEE_MACHINE";
               }
            }
          }
        }
        
        // 2. Check Patients (takes precedence over coffee)
        const activeCases = useERStore.getState().activeCases;
        for (const ac of activeCases) {
          if (ac.bedIndex !== undefined) {
             const bx = BED_COORDS[ac.bedIndex].x;
             const by = BED_COORDS[ac.bedIndex].y;
             const dist = Math.abs(pX - bx) + Math.abs(pY - by);
             if (dist <= 2) {
               foundEntity = ac;
               break;
             }
          }
        }
        
        setInteractableEntity(foundEntity);
      };

      let elapsed = 0;
      app.ticker.add((ticker) => {
        elapsed += ticker.deltaTime;
        
        // Pulse patients
        patientsContainer.children.forEach((c) => {
           c.scale.set(1 + Math.sin(elapsed * 0.1) * 0.1);
        });

        // Animate floaters
        floatersContainer.children.forEach((child) => {
           child.y -= 0.5 * ticker.deltaTime;
           child.alpha -= 0.01 * ticker.deltaTime;
           if (child.alpha <= 0) floatersContainer.removeChild(child);
        });
        // Continuous Movement
        const dx = joystickDir.current.x;
        const dy = joystickDir.current.y;
        
        if (dx !== 0 || dy !== 0) {
           const SPEED = 2.5;
           const newX = player.x + (dx * SPEED * ticker.deltaTime);
           const newY = player.y + (dy * SPEED * ticker.deltaTime);
           
           const checkCollision = (px: number, py: number) => {
             const halfW = TILE_SIZE/2 - 6; // Hitbox padding
             const halfH = TILE_SIZE/2 - 6;
             const corners = [
               { x: px - halfW, y: py - halfH },
               { x: px + halfW, y: py - halfH },
               { x: px - halfW, y: py + halfH },
               { x: px + halfW, y: py + halfH },
             ];
             for (let c of corners) {
               const gX = Math.floor(c.x / TILE_SIZE);
               const gY = Math.floor(c.y / TILE_SIZE);
               if (gX < 0 || gX >= MAP_COLS || gY < 0 || gY >= MAP_ROWS) return true;
               if ([1,2,3,4,5,7,8,9].includes(MAP_DATA[gY][gX])) return true;
             }
             return false;
           };

           if (!checkCollision(newX, player.y)) player.x = newX;
           if (!checkCollision(player.x, newY)) player.y = newY;

           // Determine facing direction
           if (Math.abs(dx) > Math.abs(dy)) {
             facingDir.current = dx > 0 ? 'side' : 'side_flip';
           } else {
             facingDir.current = dy > 0 ? 'front' : 'back';
           }

           // Handle Sprite Flipping for left walk
           player.scale.x = facingDir.current === 'side_flip' ? -1 : 1;

           // Animate Walk
           const isWalk1 = Math.floor(elapsed / 10) % 2 === 0;
           let walkFrame = playerTextures.frontWalk1;
           if (facingDir.current === 'back') walkFrame = isWalk1 ? playerTextures.backWalk1 : playerTextures.backWalk2;
           else if (facingDir.current.includes('side')) walkFrame = isWalk1 ? playerTextures.sideWalk1 : playerTextures.sideWalk2;
           else walkFrame = isWalk1 ? playerTextures.frontWalk1 : playerTextures.frontWalk2;
           
           if (player.texture !== walkFrame) player.texture = walkFrame;
           
           // Check patients periodically while walking
           if (Math.floor(elapsed) % 10 === 0) checkForNearbyEntities();
        } else {
           // Idle
           let idleFrame = playerTextures.frontIdle;
           if (facingDir.current === 'back') idleFrame = playerTextures.backIdle;
           else if (facingDir.current.includes('side')) idleFrame = playerTextures.sideIdle;
           
           if (player.texture !== idleFrame) player.texture = idleFrame;
        }

        // Camera Follow (Lerp for smoothness)
        const lerpSpeed = 0.1;
        world.pivot.x += (player.x - world.pivot.x) * lerpSpeed * ticker.deltaTime;
        world.pivot.y += (player.y - world.pivot.y) * lerpSpeed * ticker.deltaTime;
        world.position.set(app.screen.width / 2, app.screen.height / 2);
      });
      
      // Initial check
      checkForNearbyEntities();

    };

    initPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div ref={canvasRef} className="absolute inset-0 z-0 pointer-events-auto overflow-hidden bg-black" />
      
      {/* Virtual D-Pad */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 z-30 grid grid-cols-3 gap-2 pointer-events-auto opacity-70 select-none touch-none"
        style={{ bottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        <div />
        <button 
           className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center active:bg-gray-600 text-white font-bold text-2xl select-none touch-none"
           style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
           onPointerDown={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: -1}; }}
           onPointerUp={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
           onPointerLeave={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
        >▲</button>
        <div />
        <button 
           className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center active:bg-gray-600 text-white font-bold text-2xl select-none touch-none"
           style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
           onPointerDown={(e) => { e.preventDefault(); joystickDir.current = {x: -1, y: 0}; }}
           onPointerUp={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
           onPointerLeave={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
        >◀</button>
        <button 
           className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center active:bg-gray-600 text-white font-bold text-2xl select-none touch-none"
           style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
           onPointerDown={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 1}; }}
           onPointerUp={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
           onPointerLeave={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
        >▼</button>
        <button 
           className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center active:bg-gray-600 text-white font-bold text-2xl select-none touch-none"
           style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
           onPointerDown={(e) => { e.preventDefault(); joystickDir.current = {x: 1, y: 0}; }}
           onPointerUp={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
           onPointerLeave={(e) => { e.preventDefault(); joystickDir.current = {x: 0, y: 0}; }}
        >▶</button>
      </div>

      {interactableEntity && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          {interactableEntity === "COFFEE_MACHINE" ? (
             <PixelButton 
               className="pointer-events-auto animate-bounce py-4 px-8 text-xl"
               variant="success"
               onClick={() => {
                 const store = useERStore.getState();
                 if (store.currency >= 25 && store.energy < store.maxEnergy) {
                   store.buyGear(`coffee_${Date.now()}`, 25); 
                   const energyRestore = store.unlockedSkills.includes('CAFFEINE_ADDICT') ? 75 : 50;
                   store.restoreEnergy(energyRestore);
                 } else if (store.currency < 25) {
                   alert("Not enough cash!");
                 } else {
                   alert("Energy is already full!");
                 }
               }}
             >
               BUY ESPRESSO ($25)
             </PixelButton>
          ) : (
             <PixelButton 
               className="pointer-events-auto animate-bounce py-4 px-8 text-xl"
               variant="gold"
               onClick={() => router.push(`/simulator/play/${interactableEntity.caseDataId}?instanceId=${interactableEntity.id}`)}
             >
               TREAT PATIENT!
             </PixelButton>
          )}
        </div>
      )}
    </>
  );
}
