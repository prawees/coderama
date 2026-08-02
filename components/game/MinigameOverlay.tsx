"use client";

import { useEffect, useState, useRef } from "react";
import { PixelPanel } from "@/components/ui/PixelPanel";

interface MinigameOverlayProps {
  interventionName: string;
  onComplete: (success: boolean) => void;
}

export function MinigameOverlay({ interventionName, onComplete }: MinigameOverlayProps) {
  const [cursorPos, setCursorPos] = useState(0); // 0 to 100
  const directionRef = useRef(1); // 1 = right, -1 = left
  const speed = 2; // how much it moves per frame
  const targetStart = 40; // Green zone start (percentage)
  const targetEnd = 60;   // Green zone end

  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      setCursorPos((prev) => {
        let nextPos = prev + directionRef.current * speed;
        if (nextPos >= 100) {
          nextPos = 100;
          directionRef.current = -1;
        } else if (nextPos <= 0) {
          nextPos = 0;
          directionRef.current = 1;
        }
        return nextPos;
      });
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleAction = () => {
    if (cursorPos >= targetStart && cursorPos <= targetEnd) {
      onComplete(true);
    } else {
      onComplete(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cursorPos]); // Re-bind to capture latest cursorPos on space press

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <PixelPanel variant="dark" className="w-[90%] max-w-md flex flex-col items-center p-6 gap-6 shadow-2xl border-4 border-pixel-gold">
        <h2 className="text-xl text-pixel-gold text-center">PERFORMING INTERVENTION:</h2>
        <h3 className="text-2xl text-pixel-alert text-center animate-pulse">{interventionName}</h3>
        
        <p className="text-sm text-gray-400">Stop the cursor in the green zone!</p>

        {/* The Bar */}
        <div 
          className="w-full h-8 bg-gray-900 border-2 border-gray-600 rounded relative cursor-pointer overflow-hidden"
          onClick={handleAction}
        >
          {/* Target Zone */}
          <div 
            className="absolute top-0 bottom-0 bg-pixel-success opacity-80"
            style={{ left: `${targetStart}%`, width: `${targetEnd - targetStart}%` }}
          />
          {/* Moving Cursor */}
          <div 
            className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_8px_white]"
            style={{ left: `calc(${cursorPos}% - 4px)` }}
          />
        </div>

        <p className="text-xs text-gray-500 mt-2">(Press SPACE or TAP the bar)</p>
      </PixelPanel>
    </div>
  );
}
