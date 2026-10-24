"use client";

import { useEffect, useRef } from "react";
import { getMap } from "@/lib/world/maps";
import { composePreview } from "@/lib/world/render";
import { drawCharacter, drawCat } from "@/lib/pixel/characters";
import { NPCS } from "@/lib/npcs";
import { gridToCanvas } from "@/lib/pixel/texture";
import * as T from "@/lib/pixel/tiles";

/**
 * Title backdrop: the clinic courtyard at golden hour, with a few of the cast about,
 * drawn by the same renderer as the game and panned slowly behind the menu.
 */
export function TitleScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const map = getMap("AMBULANCE_BAY", "rama");
    const scene = composePreview(map, "rama");
    // cast in the courtyard
    const put = (g: ReturnType<typeof drawCharacter>, tx: number, ty: number) => scene.blit(g, tx * 16, ty * 16 - 8);
    put(drawCharacter(NPCS.ann.look, "right", 0), 6, 4);
    put(drawCharacter(NPCS.bob.look, "left", 0), 8, 4);
    put(drawCharacter(NPCS.suk.look, "down", 0), 9, 8);
    scene.blit(drawCat("#e8a25a", 3), 3 * 16, 7 * 16 - 2);
    scene.blit(T.emoteBubble("heart"), 6 * 16 + 2, 3 * 16 - 10);
    scene.blit(T.emoteBubble("note"), 8 * 16 + 2, 3 * 16 - 10);
    const src = gridToCanvas(scene);

    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const scale = Math.max(2, Math.ceil((canvas.height / src.height) * 1.05));
      const sw = src.width * scale, sh = src.height * scale;
      const t = (now - start) / 1000;
      const pan = (Math.sin(t / 9) * 0.5 + 0.5) * Math.max(0, sw - canvas.width);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#2b2133";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(src, -Math.round(pan), Math.round((canvas.height - sh) / 2), sw, sh);
      // golden hour wash
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(255,190,120,0.30)");
      grad.addColorStop(0.6, "rgba(255,170,110,0.12)");
      grad.addColorStop(1, "rgba(60,30,60,0.45)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ imageRendering: "pixelated" }} aria-hidden />;
}
