import * as PIXI from "pixi.js";
import { PixelGrid, hexToRgb } from "./grid";

/** Browser-only: turn pixel grids into nearest-neighbour Pixi textures, cached by key. */
const cache = new Map<string, PIXI.Texture>();

export function gridToCanvas(g: PixelGrid): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = g.w;
  canvas.height = g.h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(g.w, g.h);
  for (let i = 0; i < g.data.length; i++) {
    const c = g.data[i];
    if (!c) continue;
    const [r, gg, b] = hexToRgb(c.slice(0, 7));
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = gg;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = c.length > 7 ? parseInt(c.slice(7, 9), 16) : 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function textureFrom(key: string, make: () => PixelGrid): PIXI.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = PIXI.Texture.from(gridToCanvas(make()));
  tex.source.scaleMode = "nearest";
  cache.set(key, tex);
  return tex;
}

/** Compose many grids onto one large canvas texture (used for static ground layers) */
export function textureFromLayer(key: string, w: number, h: number, draw: (blit: (g: PixelGrid, x: number, y: number) => void) => void): PIXI.Texture {
  const old = cache.get(key);
  if (old) return old;
  const big = new PixelGrid(w, h);
  draw((g, x, y) => big.blit(g, x, y));
  const tex = PIXI.Texture.from(gridToCanvas(big));
  tex.source.scaleMode = "nearest";
  cache.set(key, tex);
  return tex;
}
