"use client";

import { useMemo } from "react";
import { icon } from "@/lib/pixel/icons";

/** Crisp pixel-art icon rendered as SVG rects */
export function PixelIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const g = useMemo(() => icon(name), [name]);
  const rects = useMemo(() => {
    const out: JSX.Element[] = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const c = g.get(x, y);
      if (c) out.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={c.slice(0, 7)} />);
    }
    return out;
  }, [g]);
  return (
    <svg
      viewBox={`0 0 ${g.w} ${g.h}`}
      width={size}
      height={(size * g.h) / g.w}
      className={`inline-block shrink-0 ${className}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  );
}
