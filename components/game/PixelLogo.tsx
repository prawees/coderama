"use client";

import { useEffect, useMemo, useRef } from "react";
import { logoGrid, logoLayout, logoMark } from "@/lib/pixel/logo";
import type { PixelGrid } from "@/lib/pixel/grid";

function Pixels({ grid, scale, className = "", style }: { grid: PixelGrid; scale: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, grid.w, grid.h);
    for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) {
      const px = grid.get(x, y);
      if (px) { c.fillStyle = px; c.fillRect(x, y, 1, 1); }
    }
  }, [grid]);
  return <canvas ref={ref} width={grid.w} height={grid.h} className={className} style={{ width: grid.w * scale, height: grid.h * scale, imageRendering: "pixelated", ...style }} />;
}

/**
 * The logo at a whole-number scale, so its pixels stay square and match the game's.
 * Animated: the heart beats lub-dub, the name bumps on the beat, and a spark runs along the rhythm strip.
 */
export function PixelLogo({ scale = 3, markOnly = false, animated = false, className = "" }: { scale?: number; markOnly?: boolean; animated?: boolean; className?: string }) {
  const still = useMemo(() => (markOnly ? logoMark() : logoGrid()), [markOnly]);
  const word = useMemo(() => logoGrid(false), []);
  const mark = useMemo(() => logoMark(), []);
  const L = useMemo(() => logoLayout(), []);
  if (!animated || markOnly) {
    return (
      <span role="img" aria-label="Code Rama" data-testid="logo" className={`inline-block max-w-full ${className}`}>
        <Pixels grid={still} scale={scale} style={{ maxWidth: "100%", height: "auto" }} />
      </span>
    );
  }
  return (
    <span role="img" aria-label="Code Rama" data-testid="logo" className={`relative inline-block ${className}`} style={{ width: L.W * scale, height: L.H * scale }}>
      <span className="absolute inset-0 animate-[logoBump_1.4s_ease-out_infinite]"><Pixels grid={word} scale={scale} /></span>
      <span className="absolute top-0 left-0 animate-[heartbeat_1.4s_ease-out_infinite]" style={{ transformOrigin: "50% 55%" }}><Pixels grid={mark} scale={scale} /></span>
      <span className="absolute overflow-hidden" style={{ left: (L.textX + 1) * scale, top: (L.base - 1) * scale, width: L.textW * scale, height: scale * 3 }}>
        <span className="absolute top-0 animate-[ecgSpark_1.4s_linear_infinite]" style={{ width: scale * 3, height: scale * 3, left: 0, background: "radial-gradient(circle, #f4ffd8 35%, rgba(200,255,150,0) 70%)" }} />
      </span>
    </span>
  );
}
