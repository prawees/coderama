"use client";

import { useEffect, useState } from "react";
import { drawCharacter, Look, Dir } from "@/lib/pixel/characters";

/** A character slowly turning on the spot, drawn as crisp SVG pixels */
export function SpritePreview({ look, className = "w-20 h-[7.5rem] mb-1" }: { look: Look; className?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 220);
    return () => clearInterval(id);
  }, []);
  const dirs: Dir[] = ["down", "right", "up", "left"];
  const dir = dirs[Math.floor(tick / 8) % 4];
  const frame = [1, 0, 2, 0][tick % 4];
  const g = drawCharacter(look, dir, frame);
  const rects: JSX.Element[] = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = g.get(x, y);
    if (c) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={c.slice(0, 7)} fillOpacity={c.length > 7 ? 0.2 : 1} />);
  }
  return <svg viewBox="0 0 16 24" className={className} shapeRendering="crispEdges">{rects}</svg>;
}
