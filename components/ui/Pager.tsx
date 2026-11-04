"use client";

import { useEffect, useRef, useState } from "react";

interface PagerProps {
  message: string | null;
  onClear: () => void;
}

/** The pager slides down with the new patient, then tucks itself away */
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
    <div className={`absolute top-14 left-1/2 -translate-x-1/2 z-[110] transition-transform duration-400 ${isVisible ? "translate-y-0" : "-translate-y-40"}`} data-testid="pager">
      <div
        className="rounded-[10px] border-[3px] border-[#3a2a2f] bg-[#6b4f78] p-2 pb-1.5 min-w-[220px] shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.2),inset_0_3px_0_0_rgba(255,255,255,0.25),0_3px_0_0_#3a2a2f] animate-[cozyWiggle_0.25s_ease-in-out_3]"
        onClick={() => { setIsVisible(false); setTimeout(() => clear.current(), 400); }}
      >
        <div className="bg-[#b8d8a0] border-2 border-[#3a2a2f] rounded-[4px] px-2 py-1.5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: "repeating-linear-gradient(transparent, transparent 1px, #233a1c 1px, #233a1c 2px)" }} />
          <p className="text-[#233a1c] text-[18px] leading-tight text-center whitespace-pre-wrap relative">{message}</p>
        </div>
        <div className="flex justify-between items-center mt-1.5 px-1">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd66b] border border-[#3a2a2f] animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#8a6f94] border border-[#3a2a2f]" />
          </div>
          <span className="w-10 h-3 rounded-[3px] bg-[#e06b72] border-2 border-[#3a2a2f]" />
        </div>
      </div>
    </div>
  );
}
