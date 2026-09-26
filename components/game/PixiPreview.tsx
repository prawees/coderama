"use client";
import { useEffect, useRef } from 'react';
import { loadImage, recolor, specFromAppearance, SHEETS } from '@/lib/spriteRecolor';
import { migrateAppearance, PlayerAppearance } from '@/lib/erStore';

/** Player preview: the real doctor sprite, palette-swapped with the chosen skin, hair and scrub ramps. */
export const PixiPreview = (props: Partial<PlayerAppearance> & { scale?: number } & Record<string, any>) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const scale = props.scale ?? 1;
  const s = SHEETS.doctor;
  useEffect(() => {
    let alive = true;
    (async () => {
      const img = await loadImage(s.src);
      if (!alive || !ref.current) return;
      const sheet = recolor(img, specFromAppearance(migrateAppearance(props as PlayerAppearance)));
      const ctx = ref.current.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, ref.current.width, ref.current.height);
      ctx.drawImage(sheet, s.idle * s.frameW, 0, s.frameW, s.frameH, 0, 0, s.frameW * scale, s.frameH * scale);
    })();
    return () => { alive = false; };
  }, [props.skinRamp, props.hairRamp, props.topRamp, props.skinColor, props.hairColor, props.topColor, scale]);
  return <canvas ref={ref} width={s.frameW * scale} height={s.frameH * scale} style={{ imageRendering: 'pixelated', width: s.frameW * scale, height: s.frameH * scale }} />;
};
