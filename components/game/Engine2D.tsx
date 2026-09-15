"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { audio } from "@/lib/audio";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { NurseNPC } from "./NurseNPC";
import { DrGrumpNPC } from "./DrGrumpNPC";
import { useERStore, ActiveCase } from "@/lib/erStore";
import { motion } from "framer-motion";

export interface Vector2 { x: number; y: number; }
type Direction = 'up' | 'down' | 'left' | 'right';

export interface MapData {
  width: number;
  height: number;
  walls: Vector2[]; // Coordinates of impassable tiles
  interactables: {
    x: number;
    y: number;
    id: string;
    type: 'bed' | 'door' | 'computer' | 'prop';
    target?: string; // For doors
    variant?: string; // For props
  }[];
}

interface Engine2DProps {
  mapData: MapData;
  onInteract: (id: string, type: string) => void;
  onDoor: (target: string) => void;
  activeCases: ActiveCase[];
  clockMinutes?: number;
  era?: string;
  npcEmote?: string | null;
  currentDay?: number;
}

const TILE_SIZE = 32;
const SCALE = 2; // 64px per tile

function ParticleMotes() {
  const motes = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40 mix-blend-screen opacity-30">
      {motes.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          initial={{
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            opacity: Math.random() * 0.5 + 0.2
          }}
          animate={{
            x: `+=${Math.random() * 100 - 50}`,
            y: `+=${Math.random() * 100 - 50}`,
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

export function Engine2D({ mapData, onInteract, onDoor, activeCases, clockMinutes = 120, era = 'MED_Y5', npcEmote, currentDay = 1 }: Engine2DProps) {
  const { appearance } = useERStore();
  const [pos, setPos] = useState<Vector2>({ x: 5, y: 5 });
  const [dir, setDir] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [frame, setFrame] = useState(0);
  
  // Track NPC positions for interaction
  const [nursePos, setNursePos] = useState<Vector2>({ x: 8, y: 5 });
  const [grumpPos, setGrumpPos] = useState<Vector2>({ x: 12, y: 3 });

  // Map Filter style based on era
  let filterStyle = "";
  if (era === 'MED_Y6') filterStyle = "contrast(0.9) sepia(0.3) brightness(0.8) hue-rotate(-10deg)"; // Korat (Dusty/Overwhelmed)
  else if (era === 'INTERN') filterStyle = "brightness(1.1) contrast(1.1) saturate(1.2) hue-rotate(10deg)"; // Lovely Hospital (Clean/Cold)
  else if (era === 'RESIDENT') filterStyle = "contrast(1.1) saturate(0.9)"; // Chaos Rama

  // Seasonal Overrides
  let season = null;
  if (currentDay === 3) {
    season = 'pm25';
    filterStyle = "sepia(0.8) contrast(0.8) brightness(0.7) blur(0.5px)";
  } else if (currentDay === 5) {
    season = 'songkran';
    filterStyle = "brightness(1.2) saturate(1.5) hue-rotate(20deg)";
  } else if (currentDay === 7) {
    season = 'loykrathong';
    filterStyle = "brightness(0.6) contrast(1.2) sepia(0.4)";
  }

  // Dynamic Lighting based on shift time
  // Shift is 480 mins. 0 = Morning, 240 = Midday, 480 = Evening/Night
  let lightingOverlay = "rgba(0, 0, 0, 0)";
  let blendMode: any = "normal";
  if (clockMinutes < 120) {
    // Morning (warm, soft)
    const opacity = 0.2 * (1 - clockMinutes / 120);
    lightingOverlay = `rgba(255, 180, 50, ${opacity})`;
    blendMode = "overlay";
  } else if (clockMinutes > 300) {
    // Evening (cool, dark)
    const opacity = Math.min(0.4, 0.4 * ((clockMinutes - 300) / 180));
    lightingOverlay = `rgba(10, 20, 50, ${opacity})`;
    blendMode = "multiply";
  }

  const moveInterval = useRef<NodeJS.Timeout | null>(null);
  const animInterval = useRef<NodeJS.Timeout | null>(null);

  // Check collision
  const canMoveTo = (newX: number, newY: number) => {
    if (newX < 0 || newY < 0 || newX >= mapData.width || newY >= mapData.height) return false;
    if (mapData.walls.some(w => w.x === newX && w.y === newY)) return false;
    return true;
  };

  const attemptMove = useCallback((d: Direction) => {
    setDir(d);
    setPos(prev => {
      let newX = prev.x;
      let newY = prev.y;
      if (d === 'up') newY -= 1;
      if (d === 'down') newY += 1;
      if (d === 'left') newX -= 1;
      if (d === 'right') newX += 1;
      
      if (canMoveTo(newX, newY)) {
        // Check for door transition immediately
        const door = mapData.interactables.find(i => i.x === newX && i.y === newY && i.type === 'door');
        if (door && door.target) {
          onDoor(door.target);
        }
        return { x: newX, y: newY };
      } else {
        // Haptic feedback on collision
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        audio.playBump();
        return prev;
      }
    });
  }, [mapData, onDoor]);

  const startMoving = useCallback((d: Direction) => {
    if (isMoving) return;
    setIsMoving(true);
    attemptMove(d);
    moveInterval.current = setInterval(() => attemptMove(d), 200);
    animInterval.current = setInterval(() => setFrame(f => (f + 1) % 3), 150);
  }, [attemptMove, isMoving]);

  const stopMoving = useCallback(() => {
    setIsMoving(false);
    setFrame(1); // Reset to standing frame (middle column)
    if (moveInterval.current) clearInterval(moveInterval.current);
    if (animInterval.current) clearInterval(animInterval.current);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') startMoving('up');
      if (e.key === 'ArrowDown' || e.key === 's') startMoving('down');
      if (e.key === 'ArrowLeft' || e.key === 'a') startMoving('left');
      if (e.key === 'ArrowRight' || e.key === 'd') startMoving('right');
      if (e.key === ' ' || e.key === 'Enter') handleInteract();
    };
    const handleKeyUp = () => stopMoving();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startMoving, stopMoving]);

  const handleInteract = () => {
    // Check tile directly in front of player based on facing direction
    let targetX = pos.x;
    let targetY = pos.y;
    if (dir === 'up') targetY -= 1;
    if (dir === 'down') targetY += 1;
    if (dir === 'left') targetX -= 1;
    if (dir === 'right') targetX += 1;

    const interactable = mapData.interactables.find(i => i.x === targetX && i.y === targetY);
    if (interactable) {
      Haptics.impact({ style: ImpactStyle.Medium });
      onInteract(interactable.id, interactable.type);
      return;
    }

    // Check NPC
    if (targetX === nursePos.x && targetY === nursePos.y) {
      Haptics.impact({ style: ImpactStyle.Medium });
      onInteract('nurse_npc', 'npc');
      return;
    }

    if (targetX === grumpPos.x && targetY === grumpPos.y) {
      Haptics.impact({ style: ImpactStyle.Medium });
      onInteract('grump_npc', 'npc');
      return;
    }
  };

  // Sprite mapping: Assuming a standard 3x4 sprite sheet layout (Down, Left, Right, Up)
  const getSpriteOffset = () => {
    let row = 0;
    if (dir === 'down') row = 0;
    if (dir === 'left') row = 1;
    if (dir === 'right') row = 2;
    if (dir === 'up') row = 3;
    
    // Frames: 0=Left foot, 1=Stand, 2=Right foot
    // To cycle 1 -> 0 -> 1 -> 2
    let col = frame; 
    
    return {
      backgroundPosition: `-${col * 100}% -${row * 100}%`,
      backgroundSize: '300% 400%' // 3 cols, 4 rows
    };
  };

  // Day/Night lighting logic
  // Shift starts at 0 (8 AM) and goes to 540 (5 PM)
  const getLightingOverlay = () => {
    if (clockMinutes < 120) {
      // 8 AM - 10 AM (Morning) - Warm golden light
      return 'rgba(255, 210, 120, 0.15)';
    } else if (clockMinutes < 300) {
      // 10 AM - 1 PM (Midday) - Bright
      return 'rgba(255, 255, 255, 0)';
    } else if (clockMinutes < 420) {
      // 1 PM - 3 PM (Afternoon) - Slight orange tint
      return 'rgba(255, 140, 50, 0.15)';
    } else {
      // 3 PM - 5 PM (Evening/Night) - Deep blue
      const intensity = Math.min(0.6, ((clockMinutes - 420) / 120) * 0.6);
      return `rgba(15, 20, 60, ${intensity})`;
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden touch-none select-none">
      {/* CAMERA CONTAINER - Centers on player */}
      <div 
        className="absolute transition-transform duration-200 ease-linear"
        style={{
          width: mapData.width * TILE_SIZE * SCALE,
          height: mapData.height * TILE_SIZE * SCALE,
          left: `calc(50% - ${(pos.x + 0.5) * TILE_SIZE * SCALE}px)`,
          top: `calc(50% - ${(pos.y + 0.5) * TILE_SIZE * SCALE}px)`,
          backgroundImage: 'url(/assets/tileset.jpg)', // Base floor map
          backgroundSize: '100px 100px', // Fallback pattern size if full map isn't drawn yet
          filter: filterStyle,
        }}
      >
        {/* Render Interactables */}
        {mapData.interactables.map((item, idx) => {
          const bedIndex = item.type === 'bed' ? parseInt(item.id.replace('bed_', '')) - 1 : -1;
          const activeCase = activeCases.find(c => c.bedIndex === bedIndex);

          // Aesthetic overrides based on type
          let bgClass = "bg-gray-800 border-gray-600";
          let innerContent = null;

          if (item.type === 'bed') {
            bgClass = "bg-[#f8f9fa] border-[#cbd5e1] shadow-md rounded-sm";
            innerContent = (
              <div className="absolute inset-0 flex flex-col">
                {/* Pillow */}
                <div className="h-1/4 w-3/4 mx-auto mt-1 bg-white border-b-2 border-gray-200 rounded-sm shadow-sm" />
                {/* Mattress / Sheet */}
                <div className="flex-1 bg-blue-50/50" />
                {/* Folded blanket */}
                <div className="h-1/3 w-full bg-[#3b82f6] border-t-2 border-blue-400 opacity-80" />
              </div>
            );
          } else if (item.type === 'computer') {
            bgClass = "bg-[#475569] border-[#334155] rounded-sm";
            innerContent = (
              <div className="absolute inset-1 flex flex-col justify-end items-center pb-1">
                 {/* Monitor base */}
                 <div className="w-1/2 h-1 bg-gray-900 rounded-sm" />
                 {/* Monitor screen */}
                 <div className="absolute top-1 w-3/4 h-3/5 bg-black border-2 border-gray-300 rounded-sm flex items-center justify-center">
                    <div className="w-full h-full bg-[#00ff41] animate-pulse opacity-50" />
                 </div>
              </div>
            );
          } else if (item.type === 'door') {
            bgClass = "bg-[#8b4513] border-[#5c2e0b] shadow-inner";
            innerContent = (
              <>
                {/* Door panels */}
                <div className="absolute top-1 bottom-1 left-1 right-1 border border-[#5c2e0b] opacity-50 flex flex-col gap-1 p-1">
                  <div className="flex-1 border border-[#5c2e0b]" />
                  <div className="flex-1 border border-[#5c2e0b]" />
                </div>
                {/* Doorknob */}
                <div className="absolute right-1 top-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-sm -translate-y-1/2" />
              </>
            );
          } else if (item.type === 'prop') {
            if (item.variant === 'green_chair') {
              bgClass = "bg-[#22c55e] border-[#166534] shadow-md rounded-t-lg rounded-b-sm";
              innerContent = (
                <div className="absolute bottom-1 w-3/4 h-1/2 bg-[#16a34a] border-t-2 border-[#15803d] rounded-sm shadow-inner" />
              );
            } else if (item.variant === 'm150_box') {
              bgClass = "bg-[#eab308] border-[#854d0e] shadow-sm rounded-sm";
              innerContent = (
                <div className="flex items-center justify-center h-full w-full opacity-80 font-pixel text-[8px] text-red-700 font-bold">M</div>
              );
            } else if (item.variant === 'mama_cup') {
              bgClass = "bg-[#ef4444] border-[#991b1b] rounded-full shadow-sm scale-50";
              innerContent = (
                <div className="absolute inset-1 bg-yellow-200 rounded-full border border-yellow-400" />
              );
            }
          }

          return (
            <div
              key={idx}
              className={`absolute border-4 flex items-center justify-center text-white shadow-xl ${bgClass} rounded-md overflow-hidden`}
              style={{
                width: TILE_SIZE * SCALE,
                height: TILE_SIZE * SCALE,
                left: item.x * TILE_SIZE * SCALE,
                top: item.y * TILE_SIZE * SCALE,
              }}
            >
              {innerContent}
              {item.type === 'bed' && activeCase && (
                <>
                  {/* Patient Sprite (Tucked in bed) */}
                  <div className="absolute inset-0 flex items-start justify-center pt-2 pointer-events-none z-10">
                    <div className="relative w-[28px] h-[40px] flex flex-col items-center">
                      {/* Head on pillow */}
                      <div 
                        className="w-[16px] h-[16px] rounded-full shadow-sm border border-black z-20"
                        style={{ backgroundColor: activeCase.skinTone || '#f1c27d' }}
                      />
                      {/* Body under blanket */}
                      <div 
                        className="w-[24px] h-[24px] -mt-1 rounded-t-lg border-x-2 border-t-2 border-black z-10 shadow-sm"
                        style={{ backgroundColor: activeCase.shirtColor || '#1f6feb' }}
                      />
                    </div>
                  </div>
                  
                  {/* Status Particles (Zzz) */}
                  <motion.div 
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-white font-pixel text-xs z-20 font-bold drop-shadow-md"
                    animate={{ y: [0, -10, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Zzz
                  </motion.div>
                  
                  {/* Expiration warning icon */}
                  {Date.now() > activeCase.expiresAt - 60000 && (
                    <motion.div 
                      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white shadow-[0_0_15px_red] z-30"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      !
                    </motion.div>
                  )}
                  
                  {/* Premium ECG Monitor Prop */}
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-900 border-2 border-gray-700 rounded flex items-center justify-center overflow-hidden shadow-lg z-20">
                    <div className="w-full h-[2px] bg-green-400 animate-pulse drop-shadow-[0_0_2px_rgba(0,255,0,0.8)]" />
                  </div>
                </>
              )}
            </div>
          );
        })}
        
        {/* Render Walls (Debug) */}
        {mapData.walls.map((wall, idx) => (
          <div
            key={`wall-${idx}`}
            className="absolute bg-gray-800 opacity-50"
            style={{
              width: TILE_SIZE * SCALE,
              height: TILE_SIZE * SCALE,
              left: wall.x * TILE_SIZE * SCALE,
              top: wall.y * TILE_SIZE * SCALE,
            }}
          />
        ))}

        {/* NPC Sprites */}
        <NurseNPC mapData={mapData} scale={SCALE} tileSize={TILE_SIZE} onPositionChange={setNursePos} emote={npcEmote} />
        <DrGrumpNPC mapData={mapData} scale={SCALE} tileSize={TILE_SIZE} onPositionChange={setGrumpPos} />
        
        {/* Particle Motes (Dust in the air) */}
        <ParticleMotes />
        
        {/* Map Filter Layer */}
        <div 
          className="absolute inset-0 pointer-events-none z-30 transition-all duration-1000"
          style={{
            backgroundColor: lightingOverlay,
            mixBlendMode: blendMode,
            backdropFilter: filterStyle
          }}
        />
        
        {/* Seasonal Particles Layer */}
        {season === 'pm25' && (
          <div className="absolute inset-0 pointer-events-none z-40 bg-[url(/assets/noise.png)] opacity-30 animate-pulse" />
        )}
        {season === 'songkran' && (
          <div className="absolute inset-0 pointer-events-none z-40">
             {Array.from({length: 10}).map((_, i) => (
               <div key={i} className="absolute w-2 h-4 bg-blue-400 rounded-full opacity-50 blur-[1px] animate-rain" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${0.5 + Math.random()}s` }} />
             ))}
          </div>
        )}
        {season === 'loykrathong' && (
          <div className="absolute inset-0 pointer-events-none z-40">
             {Array.from({length: 5}).map((_, i) => (
               <div key={i} className="absolute w-4 h-4 bg-yellow-400 rounded-full opacity-80 blur-md animate-float-up" style={{ left: `${Math.random() * 100}%`, top: '100%', animationDelay: `${Math.random() * 5}s`, animationDuration: `${5 + Math.random() * 5}s` }} />
             ))}
          </div>
        )}

        {/* Avatar Layer */}
        <div 
          className="absolute transition-all duration-200 ease-linear z-10"
          style={{
            width: TILE_SIZE * SCALE,
            height: TILE_SIZE * SCALE,
            left: pos.x * TILE_SIZE * SCALE,
            top: pos.y * TILE_SIZE * SCALE,
            backgroundImage: 'url(/assets/doctor.jpg)',
            filter: `hue-rotate(${appearance?.topColor === '#1f6feb' ? 0 : 180}deg)`,
            ...getSpriteOffset()
          }}
        />
      </div>

      {/* VIRTUAL D-PAD OVERLAY */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center opacity-70 z-50 pointer-events-auto">
        <button 
          className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl mb-1"
          onTouchStart={() => startMoving('up')} onTouchEnd={stopMoving}
          onMouseDown={() => startMoving('up')} onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
        >↑</button>
        <div className="flex gap-1">
          <button 
            className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl"
            onTouchStart={() => startMoving('left')} onTouchEnd={stopMoving}
            onMouseDown={() => startMoving('left')} onMouseUp={stopMoving}
            onMouseLeave={stopMoving}
          >←</button>
          <button 
            className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl"
            onTouchStart={() => startMoving('down')} onTouchEnd={stopMoving}
            onMouseDown={() => startMoving('down')} onMouseUp={stopMoving}
            onMouseLeave={stopMoving}
          >↓</button>
          <button 
            className="w-16 h-16 bg-gray-700 border-4 border-gray-900 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-xl"
            onTouchStart={() => startMoving('right')} onTouchEnd={stopMoving}
            onMouseDown={() => startMoving('right')} onMouseUp={stopMoving}
            onMouseLeave={stopMoving}
          >→</button>
        </div>
      </div>
      
      {/* Day/Night Lighting Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-multiply transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: getLightingOverlay() }}
      />
      
      {/* INTERACT BUTTON */}
      <div className="absolute bottom-8 right-8 z-50 pointer-events-auto">
        <button 
          className="w-24 h-24 bg-red-600 border-4 border-red-800 active:bg-red-400 rounded-full flex items-center justify-center text-white text-lg font-bold font-pixel shadow-xl shadow-red-900/50"
          onClick={handleInteract}
        >
          A
        </button>
      </div>
    </div>
  );
}
