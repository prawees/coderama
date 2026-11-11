/**
 * Dev helper: render pixel grids to a PNG contact sheet for quick visual checks.
 * Usage: npx tsx scripts/art/sheet.ts <module-with-default-export> <out.png> [scale]
 * The module's default export returns { cols, cells: PixelGrid[][] | PixelGrid[], bg? }.
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { PixelGrid, hexToRgb } from "../../lib/pixel/grid";

function crc32(buf: Buffer) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function toPng(w: number, h: number, rgba: Uint8Array) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

export function renderSheet(rows: PixelGrid[][], scale: number, bg = "#3b4a5a", pad = 2) {
  const cellW = Math.max(...rows.flat().map((g) => g.w));
  const cellH = Math.max(...rows.map((r) => Math.max(...r.map((g) => g.h))));
  const cols = Math.max(...rows.map((r) => r.length));
  const W = (cols * (cellW + pad) + pad) * scale;
  const H = (rows.length * (cellH + pad) + pad) * scale;
  const out = new Uint8Array(W * H * 4);
  const [br, bgc, bb] = hexToRgb(bg);
  for (let i = 0; i < W * H; i++) { out[i * 4] = br; out[i * 4 + 1] = bgc; out[i * 4 + 2] = bb; out[i * 4 + 3] = 255; }
  rows.forEach((row, ri) => row.forEach((g, ci) => {
    const ox = (pad + ci * (cellW + pad)) * scale, oy = (pad + ri * (cellH + pad)) * scale;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const c = g.get(x, y); if (!c) continue;
      const [r, gg, b] = hexToRgb(c.slice(0, 7));
      const a = c.length > 7 ? parseInt(c.slice(7, 9), 16) / 255 : 1;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const i = ((oy + y * scale + sy) * W + ox + x * scale + sx) * 4;
        out[i] = out[i] * (1 - a) + r * a; out[i + 1] = out[i + 1] * (1 - a) + gg * a; out[i + 2] = out[i + 2] * (1 - a) + b * a;
      }
    }
  }));
  return toPng(W, H, out);
}

const [, , modPath, outPath, scaleArg] = process.argv;
if (modPath) {
  import(modPath).then((m) => {
    const { rows, bg } = m.default();
    writeFileSync(outPath, renderSheet(rows, Number(scaleArg || 4), bg));
    console.log("wrote", outPath);
  });
}
