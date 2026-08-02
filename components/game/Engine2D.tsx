"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { audio } from "@/lib/audio";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { NurseNPC } from "./NurseNPC";

interface Vector2 { x: number; y: number; }
type Direction = 'up' | 'down' | 'left' | 'right';

export interface MapData {
  width: number;
  height: number;
  walls: Vector2[]; // Coordinates of impassable tiles
  interactables: {
    x: number;
    y: number;
    id: string;
    type: 'bed' | 'door';
    target?: string; // For doors
  }[];
}

interface Engine2DProps {
  mapData: MapData;
  onInteract: (id: string, type: string) => void;
  onDoor: (target: string) => void;
  activeCaseIds: string[]; // Beds that have active cases
}

const TILE_SIZE = 32;
const SCALE = 2; // 64px per tile

export function Engine2D({ mapData, onInteract, onDoor, activeCaseIds }: Engine2DProps) {
  const [pos, setPos] = useState<Vector2>({ x: 5, y: 5 });
  const [dir, setDir] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [frame, setFrame] = useState(0);
  
  // Track NPC positions for interaction
  const [nursePos, setNursePos] = useState<Vector2>({ x: 8, y: 5 });

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
      }
      return prev;
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
        }}
      >
        {/* Render Interactables (Beds) */}
        {mapData.interactables.map((item, idx) => (
          <div
            key={idx}
            className={`absolute border-2 flex items-center justify-center font-bold text-white shadow-lg ${item.type === 'bed' ? 'bg-blue-800 border-blue-400' : 'bg-green-800 border-green-400'}`}
            style={{
              width: TILE_SIZE * SCALE,
              height: TILE_SIZE * SCALE,
              left: item.x * TILE_SIZE * SCALE,
              top: item.y * TILE_SIZE * SCALE,
            }}
          >
            {item.type === 'bed' ? 'BED' : 'DOOR'}
            {item.type === 'bed' && activeCaseIds.includes(item.id) && (
              <div className="absolute -top-4 -right-4 w-6 h-6 bg-red-600 rounded-full animate-bounce border-2 border-white flex items-center justify-center text-xs">!</div>
            )}
          </div>
        ))}
        
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
        <NurseNPC mapData={mapData} scale={SCALE} tileSize={TILE_SIZE} onPositionChange={setNursePos} />
        
        {/* Player Sprite */}
        <div 
          className="absolute transition-all duration-200 ease-linear z-10"
          style={{
            width: TILE_SIZE * SCALE,
            height: TILE_SIZE * SCALE,
            left: pos.x * TILE_SIZE * SCALE,
            top: pos.y * TILE_SIZE * SCALE,
            backgroundImage: 'url(/assets/doctor.jpg)',
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
