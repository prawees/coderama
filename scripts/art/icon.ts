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
function render(scale: number) {
  const W = S * scale;
  const px = new Uint8Array(W * W * 4);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const c = g.get(Math.floor(x / scale), Math.floor(y / scale)) ?? "#f6dfb4";
    const [r, gg, b] = hexToRgb(c.slice(0, 7));
    const i = (y * W + x) * 4; px[i] = r; px[i + 1] = gg; px[i + 2] = b; px[i + 3] = 255;
  }
  return toPng(W, W, px);
}
writeFileSync("app/icon.png", render(SCALE));
// Home screen icons for the web app manifest
writeFileSync("public/icon-192.png", render(12));
writeFileSync("public/icon-512.png", render(32));
console.log("wrote app/icon.png and public/icon-192.png, icon-512.png");
