"use client";

import { useEffect, useState, useRef } from "react";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { audio } from "@/lib/audio";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

interface MinigameOverlayProps {
  interventionName: string;
  onComplete: (success: boolean) => void;
}

export function MinigameOverlay({ interventionName, onComplete }: MinigameOverlayProps) {
  const [cursorPos, setCursorPos] = useState(0); // 0 to 100
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "success" | "fail">("idle");
  const directionRef = useRef(1); // 1 = right, -1 = left
  const lastTimeRef = useRef<number | null>(null);
  const isResolvedRef = useRef(false);
  
  // Speed in percentage units per second (framerate independent)
  const isCPR = interventionName.toLowerCase().includes('cpr');
  const speed = isCPR ? 180 : 120; // 180%/s for CPR (~0.55s traversal), 120%/s for standard (~0.83s traversal)
  
  const targetStart = isCPR ? 45 : 40; 
  const targetEnd = isCPR ? 55 : 60;   

  useEffect(() => {
    let animationFrameId: number;
    
    const loop = (timestamp: number) => {
      if (isResolvedRef.current) return;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaSeconds = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      setCursorPos((prev) => {
        let nextPos = prev + directionRef.current * speed * deltaSeconds;
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

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [speed]);

  const handleAction = () => {
    if (isResolvedRef.current) return;
    isResolvedRef.current = true;

    if (cursorPos >= targetStart && cursorPos <= targetEnd) {
      setFeedback("success");
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      audio.playClick();
      setTimeout(() => {
        onComplete(true);
      }, 400);
    } else {
      setFeedback("fail");
      Haptics.notification({ type: NotificationType.Error }).catch(() => {});
      setShake(true);
      setTimeout(() => {
        setShake(false);
        onComplete(false);
      }, 600);
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className={`w-[90%] max-w-md transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <PixelPanel 
          variant="dark" 
          className={`flex flex-col items-center p-8 gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 transition-colors ${
            feedback === 'success' ? 'border-[#00ff41] shadow-[0_0_50px_rgba(0,255,65,0.3)]' :
            feedback === 'fail' ? 'border-red-600 shadow-[0_0_50px_rgba(255,0,0,0.4)]' :
            'border-[#30363d] shadow-[0_0_50px_rgba(255,0,0,0.2)]'
          } bg-[#0a0a0c]`}
        >
          
          <div className="w-full flex justify-between items-center border-b-2 border-gray-800 pb-2">
            <span className="text-red-500 font-bold tracking-widest text-sm animate-pulse">DEFIB / MONITOR</span>
            <span className="text-[#00ff41] font-mono">{isCPR ? '120 BPM' : 'STABLE'}</span>
          </div>

          <h3 className="text-3xl text-white font-bold text-center tracking-wider drop-shadow-md">{interventionName}</h3>
          
          <p className={`text-sm font-mono px-4 py-1 rounded transition-colors ${
            feedback === 'success' ? 'text-[#00ff41] bg-[#00ff41]/20 font-bold' :
            feedback === 'fail' ? 'text-red-400 bg-red-950 font-bold' :
            'text-[#8b949e] bg-gray-900'
          }`}>
            {feedback === 'success' ? 'PERFECT TIMING!' : feedback === 'fail' ? 'MISSED TIMING!' : 'Target the Green Zone'}
          </p>

          {/* The Medical Bar */}
          <div 
            className={`w-full h-12 bg-[#050505] border-4 rounded-lg relative cursor-pointer overflow-hidden shadow-inner flex items-center transition-colors ${
              feedback === 'success' ? 'border-[#00ff41]' : feedback === 'fail' ? 'border-red-600' : 'border-[#30363d]'
            }`}
            onClick={handleAction}
          >
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            
            {/* Target Zone */}
            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-80"
              style={{ left: `${targetStart}%`, width: `${targetEnd - targetStart}%` }}
            />
            {/* Moving Cursor */}
            <div 
              className={`absolute top-0 bottom-0 w-1 shadow-[0_0_15px_#ffffff] transition-colors ${
                feedback === 'success' ? 'bg-[#00ff41]' : feedback === 'fail' ? 'bg-red-500' : 'bg-white'
              }`}
              style={{ left: `calc(${cursorPos}% - 2px)` }}
            />
            {/* ECG trace line following cursor */}
            <div 
              className="absolute top-1/2 h-[2px] bg-[#00ff41] shadow-[0_0_8px_#00ff41]"
              style={{ left: 0, width: `${cursorPos}%`, transform: 'translateY(-50%)' }}
            />
          </div>

          <p className="text-xs text-[#8b949e] mt-2 animate-pulse">
            {feedback === 'idle' ? '(Press SPACE or TAP the bar)' : 'Processing response...'}
          </p>
        </PixelPanel>
      </div>
    </div>
  );
}
