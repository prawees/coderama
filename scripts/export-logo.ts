// Writes the logo as PNG files: npx tsx scripts/export-logo.ts
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";
import { logoGrid, logoMark } from "../lib/pixel/logo";
import { hexToRgb, PixelGrid } from "../lib/pixel/grid";

function crc(buf: Buffer) {
  let c = ~0;
  for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
}
function png(g: PixelGrid, scale: number, pad = 0) {
  const W = (g.w + pad * 2) * scale, H = (g.h + pad * 2) * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    const row = y * (W * 4 + 1) + 1;
    for (let x = 0; x < W; x++) {
      const px = g.get(Math.floor(x / scale) - pad, Math.floor(y / scale) - pad);
      if (!px) continue;
      const [r, b, c] = hexToRgb(px);
      raw.set([r, b, c, 255], row + x * 4);
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(W, 0); head.writeUInt32BE(H, 4); head[8] = 8; head[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

writeFileSync("public/logo.png", png(logoGrid(), 8, 1));
writeFileSync("public/logo-mark.png", png(logoMark(), 16, 1));
writeFileSync("public/favicon.png", png(logoMark(), 4, 1));
console.log("wrote public/logo.png, public/logo-mark.png, public/favicon.png");
