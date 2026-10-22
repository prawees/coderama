/**
 * Builds the app icon (app/icon.png): Kanom the clinic cat on a warm tile, 16px art at 4x.
 * Usage: npx tsx scripts/art/icon.ts
 */
import { writeFileSync } from "node:fs";
import { toPng } from "./sheet";
import { PixelGrid, hexToRgb } from "../../lib/pixel/grid";
import { drawCat } from "../../lib/pixel/characters";

const S = 16, SCALE = 4;
const g = new PixelGrid(S, S);
g.rect(0, 0, S - 1, S - 1, "#f6dfb4");
g.rect(0, 12, S - 1, S - 1, "#e8b67a");
const cat = drawCat("#e8a25a", 3);
g.blit(cat, Math.floor((S - cat.w) / 2), S - cat.h - 1);
const W = S * SCALE;
const px = new Uint8Array(W * W * 4);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
  const c = g.get(Math.floor(x / SCALE), Math.floor(y / SCALE)) ?? "#f6dfb4";
  const [r, gg, b] = hexToRgb(c.slice(0, 7));
  const i = (y * W + x) * 4; px[i] = r; px[i + 1] = gg; px[i + 2] = b; px[i + 3] = 255;
}
writeFileSync("app/icon.png", toPng(W, W, px));
console.log("wrote app/icon.png", cat.w, cat.h);
