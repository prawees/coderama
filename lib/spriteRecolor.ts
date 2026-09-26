/**
 * CODE RAMA - Palette swapping for the project's hand-drawn character art.
 *
 * The doctor sprite's colours fall into clean groups (measured in HSV):
 *   hair   hue 12-32, sat > 0.55, value 0.12-0.45
 *   skin   hue 12-38, sat 0.2-0.6, value > 0.55
 *   scrubs hue 190-230, sat > 0.35, value > 0.3
 * Each pixel in a group keeps its relative brightness and is re-mapped onto
 * a hand-picked ramp (shadow, mid, highlight) from lib/palettes.ts. Outline,
 * coat and trousers are untouched, so the shading of the original art stays.
 */
import { Ramp, SKIN_RAMPS, HAIR_RAMPS, SCRUB_RAMPS, getRamp } from './palettes';

export interface RecolorSpec { skin?: Ramp; hair?: Ramp; scrubs?: Ramp; }

type Part = 'hair' | 'skin' | 'scrubs' | null;
const RANGE: Record<Exclude<Part, null>, [number, number]> = { hair: [0.12, 0.45], skin: [0.55, 1.0], scrubs: [0.3, 0.85] };

function hsv(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255];
}
function classify(r: number, g: number, b: number): Part {
  const [h, s, v] = hsv(r, g, b);
  if (h >= 12 && h <= 32 && s > 0.55 && v >= 0.12 && v <= 0.45) return 'hair';
  if (h >= 12 && h <= 38 && s >= 0.2 && s <= 0.6 && v > 0.55) return 'skin';
  if (h >= 190 && h <= 230 && s > 0.35 && v > 0.3) return 'scrubs';
  return null;
}
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function onRamp(r: Ramp, t: number): number[] {
  const a = hex(r.shadow), m = hex(r.mid), b = hex(r.highlight);
  const [p, q, k] = t < 0.5 ? [a, m, t / 0.5] : [m, b, (t - 0.5) / 0.5];
  return [0, 1, 2].map((i) => Math.round(p[i] + (q[i] - p[i]) * k));
}

export function recolor(src: CanvasImageSource & { width: number; height: number }, spec: RecolorSpec): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const part = classify(d[i], d[i + 1], d[i + 2]);
    if (!part) continue;
    const ramp = spec[part];
    if (!ramp) continue;
    const [lo, hi] = RANGE[part];
    const t = Math.max(0, Math.min(1, (Math.max(d[i], d[i + 1], d[i + 2]) / 255 - lo) / (hi - lo)));
    const [r, g, b] = onRamp(ramp, t);
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!cache.has(src)) {
    cache.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
  }
  return cache.get(src)!;
}

/** Appearance (ramp ids from the store) to a recolour spec. */
export function specFromAppearance(a: { skinRamp?: string; hairRamp?: string; topRamp?: string } | undefined): RecolorSpec {
  return {
    skin: getRamp(a?.skinRamp, SKIN_RAMPS[1]),
    hair: getRamp(a?.hairRamp, HAIR_RAMPS[1]),
    scrubs: getRamp(a?.topRamp, SCRUB_RAMPS[2]),
  };
}

/** Ajarn Grump: salt-and-pepper silver hair, maroon scrubs under the white coat, weathered skin. */
export const GRUMP_SPEC: RecolorSpec = { hair: HAIR_RAMPS[4], scrubs: SCRUB_RAMPS[3], skin: SKIN_RAMPS[3] };

/** Bed patients get varied, realistic skin and hair. */
export function patientSpec(seed: string): RecolorSpec {
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { skin: SKIN_RAMPS[h % SKIN_RAMPS.length], hair: HAIR_RAMPS[(h >> 3) % 3 === 2 ? 4 : (h >> 3) % 2] };
}

export const SHEETS = {
  doctor: { src: '/assets/sprites/doctor.png', frameW: 64, frameH: 112, walk: { down: [0, 1, 2, 3, 4], left: [0, 1, 2, 3, 4], right: [0, 1, 2, 3, 4], up: [0, 1, 2, 3, 4] }, idle: 2 },
  nurse: { src: '/assets/sprites/nurse.png', frameW: 64, frameH: 112, walk: { down: [0, 1, 2], left: [0, 1, 2], right: [0, 1, 2], up: [0, 2] }, idle: 0 },
} as const;
export type SheetName = keyof typeof SHEETS;
export const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 } as const;

/** Portrait: head and shoulders from the front idle frame, as a data URL. */
export async function portrait(sheet: SheetName, spec?: RecolorSpec, scale = 3): Promise<string> {
  const s = SHEETS[sheet];
  const img = await loadImage(s.src);
  const src = spec ? recolor(img, spec) : img;
  const c = document.createElement('canvas');
  const cropH = Math.round(s.frameH * 0.5);
  c.width = s.frameW * scale; c.height = cropH * scale;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, s.idle * s.frameW, 0, s.frameW, cropH, 0, 0, c.width, c.height);
  return c.toDataURL();
}
