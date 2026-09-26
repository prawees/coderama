"use client";
import { useEffect, useState } from "react";
import { SHEETS, SheetName, DIR_ROW } from "@/lib/spriteRecolor";

/** Animated DOM sprite from the game's sprite sheets (title screen, cutscenes). */
export function SpriteWalker({ sheet, dir = 'down', scale = 2, walking = true, fps = 6, src }: {
  sheet: SheetName; dir?: keyof typeof DIR_ROW; scale?: number; walking?: boolean; fps?: number; src?: string;
}) {
  const s = SHEETS[sheet];
  const frames = s.walk[dir];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!walking) return;
    const id = setInterval(() => setI((x) => (x + 1) % frames.length), 1000 / fps);
    return () => clearInterval(id);
  }, [walking, fps, frames.length]);
  const col = walking ? frames[i] : s.idle;
  const cols = sheet === 'doctor' ? 5 : 3;
  return (
    <div style={{
      width: s.frameW * scale, height: s.frameH * scale,
      backgroundImage: `url(${src || s.src})`, backgroundRepeat: 'no-repeat',
      backgroundSize: `${s.frameW * cols * scale}px ${s.frameH * 4 * scale}px`,
      backgroundPosition: `-${col * s.frameW * scale}px -${DIR_ROW[dir] * s.frameH * scale}px`,
      imageRendering: 'pixelated',
    }} />
  );
}
