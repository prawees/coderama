"use client";

import { useEffect, useState } from "react";

interface PagerProps {
  message: string | null;
  onClear: () => void;
}

export function Pager({ message, onClear }: PagerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      // Auto clear after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClear, 500); // wait for exit animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message && !isVisible) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-transform duration-500 ${isVisible ? 'translate-y-0' : '-translate-y-48'}`}>
      <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-2 shadow-2xl flex flex-col items-center min-w-[250px] relative">
        <div className="absolute -top-6 w-2 h-6 bg-gray-900 left-4 rounded-t-sm"></div>
        {/* Pager Screen */}
        <div className="bg-[#9ea791] border-2 border-gray-900 w-full rounded p-2 min-h-[60px] flex items-center shadow-inner relative overflow-hidden mt-1">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'repeating-linear-gradient(transparent, transparent 1px, #000 1px, #000 2px)' }}></div>
          <p className="font-mono text-black text-sm leading-tight animate-pulse z-10 w-full text-center whitespace-pre-wrap">
            {message}
          </p>
        </div>
        
        {/* Pager Buttons */}
        <div className="flex gap-2 mt-2 w-full justify-between px-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-600 shadow-sm border border-gray-900"></div>
            <div className="w-3 h-3 rounded-full bg-gray-600 shadow-sm border border-gray-900"></div>
          </div>
          <button 
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClear, 500);
            }}
            className="w-12 h-4 bg-pixel-alert border-2 border-gray-900 rounded-sm active:bg-red-700 active:translate-y-[1px] transition-all"
          ></button>
        </div>
      </div>
    </div>
  );
}
