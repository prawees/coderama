"use client";

import { useEffect, useMemo, useRef } from "react";
import { logoGrid, logoMark } from "@/lib/pixel/logo";

/** The logo at a whole-number scale, so its pixels stay square and match the game's */
export function PixelLogo({ scale = 3, markOnly = false, className = "" }: { scale?: number; markOnly?: boolean; className?: string }) {
  const grid = useMemo(() => (markOnly ? logoMark() : logoGrid()), [markOnly]);
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
  return (
    <canvas ref={ref} width={grid.w} height={grid.h} role="img" aria-label="Code Rama" data-testid="logo" className={className}
      style={{ width: grid.w * scale, height: "auto", imageRendering: "pixelated", maxWidth: "100%" }} />
  );
}
