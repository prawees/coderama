"use client";
import { useEffect, useState, useRef } from "react";
import { MapData } from "./Engine2D";

interface NurseNPCProps {
  mapData: MapData;
  scale: number;
  tileSize: number;
  onPositionChange?: (pos: {x: number, y: number}) => void;
  emote?: string | null;
}

export function NurseNPC({ mapData, scale, tileSize, onPositionChange, emote }: NurseNPCProps) {
  // Start at a random empty tile
  const [pos, setPos] = useState({ x: 8, y: 5 });
  const [dir, setDir] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [frame, setFrame] = useState(1);

  const canMoveTo = (newX: number, newY: number) => {
    if (newX < 0 || newY < 0 || newX >= mapData.width || newY >= mapData.height) return false;
    if (mapData.walls.some(w => w.x === newX && w.y === newY)) return false;
    if (mapData.interactables.some(i => i.x === newX && i.y === newY)) return false;
    return true;
  };

  useEffect(() => {
    const moveTimer = setInterval(() => {
      // 50% chance to stand still, or 100% chance if emote is active
      if (emote || Math.random() < 0.5) {
        setFrame(1);
        return;
      }

      const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
      const nextDir = directions[Math.floor(Math.random() * directions.length)];
      
      setDir(nextDir);
      
      let nextX = pos.x;
      let nextY = pos.y;
      
      if (nextDir === 'up') nextY -= 1;
      if (nextDir === 'down') nextY += 1;
      if (nextDir === 'left') nextX -= 1;
      if (nextDir === 'right') nextX += 1;

      if (canMoveTo(nextX, nextY)) {
        const newPos = { x: nextX, y: nextY };
        setPos(newPos);
        if (onPositionChange) onPositionChange(newPos);
        
        // Animation
        let animStep = 0;
        const animTimer = setInterval(() => {
          setFrame(f => (f === 1 ? (animStep % 2 === 0 ? 0 : 2) : 1));
          animStep++;
          if (animStep > 2) clearInterval(animTimer);
        }, 150);
      }
    }, 2000);

    return () => clearInterval(moveTimer);
  }, [pos, mapData, onPositionChange, emote]);

  const getSpriteOffset = () => {
    let row = 0;
    if (dir === 'down') row = 0;
    if (dir === 'left') row = 1;
    if (dir === 'right') row = 2;
    if (dir === 'up') row = 3;
    
    return {
      backgroundPosition: `-${frame * 100}% -${row * 100}%`,
      backgroundSize: '300% 400%'
    };
  };

  return (
    <div 
      className="absolute transition-all duration-300 ease-linear z-10"
      style={{
        width: tileSize * scale,
        height: tileSize * scale,
        left: pos.x * tileSize * scale,
        top: pos.y * tileSize * scale,
        backgroundImage: 'url(/assets/nurse.jpg)',
        ...getSpriteOffset()
      }}
    >
      {emote && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-black rounded-lg shadow-lg flex items-center justify-center animate-bounce z-20 font-bold text-black font-pixel">
          {emote}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b-2 border-r-2 border-black rotate-45" />
        </div>
      )}
    </div>
  );
}
