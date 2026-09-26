"use client";
import { useEffect, useRef } from 'react';
import { renderCharacterSheet, specFromAppearance, FRAME_W, FRAME_H } from '@/lib/pixelSprites';
import { migrateAppearance, PlayerAppearance } from '@/lib/erStore';

/** Palette-swap avatar preview: draws the idle "down" frame from the same sheet the overworld uses. */
export const PixiPreview = (props: Partial<PlayerAppearance> & Record<string, any>) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const sheet = renderCharacterSheet(specFromAppearance(migrateAppearance(props as PlayerAppearance) as any));
    const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(sheet, FRAME_W, 0, FRAME_W, FRAME_H, 0, 0, FRAME_W * 2, FRAME_H * 2);
  }, [props.skinRamp, props.hairRamp, props.topRamp, props.bottomRamp, props.shoeRamp, props.skinColor, props.hairColor, props.topColor, props.bottomColor, props.shoeColor, props.hairStyle, props.topStyle]);
  return <canvas ref={ref} width={FRAME_W * 2} height={FRAME_H * 2} className="w-12 h-16" style={{ imageRendering: 'pixelated' }} />;
};
