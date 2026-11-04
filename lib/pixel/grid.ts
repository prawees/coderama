/**
 * A tiny pixel canvas that works without the DOM, so art can be generated,
 * tested and previewed in Node as well as turned into textures in the browser.
 * Colours are "#rrggbb" strings; null is transparent.
 */
export type Px = string | null;

export class PixelGrid {
  readonly w: number;
  readonly h: number;
  readonly data: Px[];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Array(w * h).fill(null);
  }

  get(x: number, y: number): Px {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.data[y * this.w + x];
  }

  set(x: number, y: number, c: Px) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = c;
  }

  /** Inclusive rectangle */
  rect(x0: number, y0: number, x1: number, y1: number, c: Px) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c);
    return this;
  }

  hline(x0: number, x1: number, y: number, c: Px) { return this.rect(x0, y, x1, y, c); }
  vline(x: number, y0: number, y1: number, c: Px) { return this.rect(x, y0, x, y1, c); }

  /** Paint only where something is already drawn */
  recolor(from: Px, to: Px) {
    for (let i = 0; i < this.data.length; i++) if (this.data[i] === from) this.data[i] = to;
    return this;
  }

  /** Stamp a string pattern; each char maps through the key (space = skip) */
  stamp(x0: number, y0: number, rows: string[], key: Record<string, Px>) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === " " || !(ch in key)) continue;
        this.set(x0 + x, y0 + y, key[ch]);
      }
    });
    return this;
  }

  /** Draw another grid on top */
  blit(src: PixelGrid, x0 = 0, y0 = 0) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c) this.set(x0 + x, y0 + y, c);
    }
    return this;
  }

  /** Add a 1px outline around every opaque region (4-neighbour) */
  outline(c: string) {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, c);
    return this;
  }

  mirrored(): PixelGrid {
    const g = new PixelGrid(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.set(this.w - 1 - x, y, this.get(x, y));
    return g;
  }

  clone(): PixelGrid {
    const g = new PixelGrid(this.w, this.h);
    g.data.splice(0, g.data.length, ...this.data);
    return g;
  }

  /** Shift everything by (dx, dy), clipping */
  shifted(dx: number, dy: number): PixelGrid {
    const g = new PixelGrid(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.set(x + dx, y + dy, this.get(x, y));
    return g;
  }
}

/* ---------- colour helpers ---------- */

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Multiply brightness (f < 1 darkens) */
export function shade(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * f, g * f, b * f);
}

/** Linear mix of two colours */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Warm, hue-shifted shadow: darker and nudged toward purple, which reads cosier than plain black */
export function cozyShadow(hex: string, amount = 0.72): string {
  return mix(shade(hex, amount), "#3d2a4a", 0.18);
}

/** Small deterministic PRNG so tiles and faces are stable between renders */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
