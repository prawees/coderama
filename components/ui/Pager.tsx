"use client";

import { useEffect, useRef, useState } from "react";

interface PagerProps {
  message: string | null;
  onClear: () => void;
}

/** The pager shows the new patient in the message row under the HUD for a few seconds, then fades */
export function Pager({ message, onClear }: PagerProps) {
  const [isVisible, setIsVisible] = useState(false);
  // The parent re-renders every game minute; hold the callback in a ref so the timer is not reset.
  const clear = useRef(onClear);
  clear.current = onClear;

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      let inner: ReturnType<typeof setTimeout> | undefined;
      const timer = setTimeout(() => {
        setIsVisible(false);
        inner = setTimeout(() => clear.current(), 400);
      }, 4200);
      return () => { clearTimeout(timer); if (inner) clearTimeout(inner); };
    }
  }, [message]);

  if (!message && !isVisible) return null;

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} data-testid="pager">
      <div
        className="rounded-[10px] border-[3px] border-[#3a2a2f] bg-[#6b4f78] p-2 pb-1.5 shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.2),inset_0_3px_0_0_rgba(255,255,255,0.25),0_3px_0_0_#3a2a2f]"
        onClick={() => { setIsVisible(false); setTimeout(() => clear.current(), 400); }}
      >
        <div className="bg-[#b8d8a0] border-2 border-[#3a2a2f] rounded-[4px] px-2 py-1.5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: "repeating-linear-gradient(transparent, transparent 1px, #233a1c 1px, #233a1c 2px)" }} />
          <p className="text-[#233a1c] text-[18px] leading-tight text-center whitespace-pre-wrap relative">{message}</p>
        </div>
        {/* What to do about it, so the pager is never information without a next step */}
        <p className="mt-1 text-center text-[15px] leading-none text-[#fbf3e2]">แตะชื่อคนไข้ที่แถบเตียงด้านล่างเพื่อรับเคส</p>
      </div>
    </div>
  );
}
