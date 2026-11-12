"use client";

import { useEffect, useRef } from "react";

/** A moving rhythm strip for the bedside monitor: sinus at the patient's rate, chaotic when there is no pulse */
export function EcgStrip({ hr, pulseless }: { hr: number; pulseless: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = 240, H = 56;
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext("2d")!;
    const trace = new Array(W).fill(H / 2);
    const qrs = [0, -2, -3, -2, 0, 0, 2, -20, 8, 0, 0, 0, -3, -5, -6, -5, -3, 0];
    const period = Math.max(qrs.length + 2, Math.round(3600 / Math.max(30, Math.min(220, hr || 80))));
    let raf = 0, x = 0, beat = 0, last = performance.now(), acc = 0;
    const draw = (now: number) => {
      acc += Math.min(0.05, (now - last) / 1000) * 60; last = now;
      while (acc >= 1) {
        acc -= 1;
        const t = now / 1000 + x * 0.013;
        const v = pulseless ? Math.sin(t * 31) * 8 + Math.sin(t * 47) * 6 + Math.sin(t * 13) * 4 : (qrs[beat % period] ?? 0);
        beat += 1;
        trace[x] = H / 2 + 6 + v;
        x = (x + 1) % W;
      }
      c.fillStyle = "#1b2320"; c.fillRect(0, 0, W, H);
      c.fillStyle = pulseless ? "#ff8a8a" : "#9be38a";
      for (let i = 0; i < W; i++) {
        if (i >= x && i < x + 10) continue;
        const a = trace[(i + W - 1) % W], b = trace[i];
        c.fillRect(i, Math.round(Math.min(a, b)), 1, Math.max(1, Math.round(Math.abs(a - b))));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [hr, pulseless]);
  return <canvas ref={ref} className="w-full h-[70px] rounded-[3px]" style={{ imageRendering: "pixelated" }} data-testid="ecg-strip" />;
}
