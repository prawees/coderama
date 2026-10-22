"use client";

import { useEffect, useState, useRef } from "react";
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

  const zone = feedback === "success" ? "#86c35f" : feedback === "fail" ? "#e06b72" : "#3a2a2f";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1c1522]/75 font-pixel">
      <div className={`w-[90%] max-w-sm ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
        <div className="cozy-panel flex flex-col items-center p-4 gap-3">
          <div className="w-full flex justify-between items-center text-[15px] leading-none text-[#6b5258]">
            <span>{isCPR ? "CPR · 100-120/min" : "Steady hands"}</span>
            <span className="cozy-tag px-1.5 py-0.5">{isCPR ? "♥ 110" : "OK"}</span>
          </div>

          <h3 className="text-[30px] leading-none text-center">{interventionName}</h3>

          <p className={`text-[18px] leading-none px-3 py-1 rounded-[3px] border-2 border-[#3a2a2f] ${feedback === "success" ? "bg-[#c8ecb4]" : feedback === "fail" ? "bg-[#f6c3c6]" : "bg-[#fff6e3]"}`}>
            {feedback === "success" ? "Perfect timing!" : feedback === "fail" ? "Missed it!" : "Target the Green Zone"}
          </p>

          <div
            className="w-full h-12 rounded-[4px] border-[3px] relative cursor-pointer overflow-hidden bg-[#2a3a2a]"
            style={{ borderColor: zone }}
            onClick={handleAction}
          >
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(#86c35f 1px, transparent 1px), linear-gradient(90deg, #86c35f 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
            <div className="absolute top-0 bottom-0 bg-[#86c35f]/80 border-x-2 border-[#c8ecb4]" style={{ left: `${targetStart}%`, width: `${targetEnd - targetStart}%` }} />
            <div className="absolute top-1/2 h-[3px] bg-[#c8ecb4] -translate-y-1/2" style={{ left: 0, width: `${cursorPos}%` }} />
            <div
              className="absolute top-0 bottom-0 w-[5px] border-x border-[#3a2a2f]"
              style={{ left: `calc(${cursorPos}% - 2px)`, background: feedback === "success" ? "#86c35f" : feedback === "fail" ? "#e06b72" : "#ffd66b" }}
            />
          </div>

          <p className="text-[15px] leading-none text-[#6b5258]">
            {feedback === "idle" ? "Tap the bar or press Space" : "..."}
          </p>
        </div>
      </div>
    </div>
  );
}
