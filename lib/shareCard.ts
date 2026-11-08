import { getMap, themeForPhase, Phase, LOCATION_NAMES } from "@/lib/world/maps";
import { composePreview } from "@/lib/world/render";
import { drawCharacter, drawCat, drawPatientInBed, Look } from "@/lib/pixel/characters";
import { PixelGrid } from "@/lib/pixel/grid";
import { gridToCanvas } from "@/lib/pixel/texture";
import { icon } from "@/lib/pixel/icons";
import { emoteBubble } from "@/lib/pixel/tiles";
import { logoGrid } from "@/lib/pixel/logo";

/**
 * Instagram Story cards, drawn straight onto a 1080x1920 canvas with the game's own pixel art.
 * Nothing is captured from the page, so a card cannot pick up a half-loaded font, a clipped panel
 * or whatever was on screen. Everything sits between SAFE_TOP and SAFE_BOTTOM, clear of the
 * Instagram header and reply bar, and every text box shrinks its text until it fits.
 */
export const CARD_W = 1080;
export const CARD_H = 1920;
const SAFE_TOP = 250;
const SAFE_BOTTOM = 1590;
const M = 64; // side margin

// A soft palette: warm brown lines rather than black, and pastel fills
const INK = "#5c4340", CREAM = "#fff8ea", PAPER = "#fff3df", BROWN = "#9a6a4a", RED = "#e8737f", SUN = "#ffe08a",
  SHADE = "#f2dfc0", GREEN = "#5fa96a", SCREEN = "#43355a", MINT = "#a5ecc0", PINK = "#ffb3b8", PLUM = "#5b4468",
  BLUSH = "#ffe6e2", BUTTER = "#fff0c9", SAGE = "#e4f4d8", ROSE = "#f9c9cf";

export interface CardPlayer { name: string; rank: string; look: Look }

export type CardSpec =
  | { kind: "shift"; day: number; phase: Phase; player: CardPlayer; title: string; line: string; saved: number; streak: number;
      treated: number; dx: string[]; chapter?: { title: string; n: number; total: number; position: number; next?: string } }
  | { kind: "case"; phase: Phase; player: CardPlayer; patient: string; by?: string; quote: string; stars: number; verdict: string;
      vitals: { label: string; value: string; bad?: boolean }[] }
  | { kind: "chapter"; day: number; phase: Phase; player: CardPlayer; host?: Look; title: string; promo?: string; saved: number; stars: number;
      patients: number; type: { title: string; line: string }; chaptersDone: number };

const BODY_FONT = `Itim, Tahoma, "Noto Sans Thai", sans-serif`;

/** Thai and Latin live in separate font files, and a canvas will not wait for either unless asked */
async function loadFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  const wait = Promise.all([
    document.fonts.load(`48px Itim`, "กำไม่ปี้ญู"),
    document.fonts.load(`48px Itim`, "Code Rama 0123"),
  ]).catch(() => undefined);
  await Promise.race([wait, new Promise((r) => setTimeout(r, 3000))]);
  await document.fonts.ready;
}

/** Break where a Thai reader expects a line to break, never inside a word or a stacked vowel */
function pieces(text: string): string[] {
  const Seg = (Intl as any).Segmenter;
  if (Seg) return Array.from(new Seg("th", { granularity: "word" }).segment(text) as Iterable<{ segment: string }>).map((s) => s.segment);
  return text.split(/(\s+)/);
}

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const p of pieces(text)) {
    // Closing punctuation stays with its word, even if that runs a hair over
    if (c.measureText(cur + p).width <= maxW || !cur.trim() || /^[\s"'”’).,!?…]+$/.test(p)) { cur += p; continue; }
    lines.push(cur.trim());
    cur = p.trimStart();
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

/** The biggest size at which the text fits the box. At the smallest size, whatever is left is cut with an ellipsis. */
function fit(c: CanvasRenderingContext2D, text: string, o: { w: number; h: number; size: number; min?: number; font?: string; lead?: number }) {
  const font = o.font ?? BODY_FONT, lead = o.lead ?? 1.25, min = o.min ?? 28;
  for (let size = o.size; ; size -= 2) {
    c.font = `${size}px ${font}`;
    const lines = wrap(c, text, o.w);
    const widest = Math.max(...lines.map((l) => c.measureText(l).width), 0);
    const maxLines = Math.max(1, Math.floor(o.h / (size * lead)));
    if (lines.length <= maxLines && widest <= o.w) return { size, lines, font, lead };
    if (size <= min) {
      const kept = lines.slice(0, maxLines);
      if (lines.length > maxLines) {
        let last = kept[maxLines - 1];
        while (last && c.measureText(last + "...").width > o.w) last = Array.from(last).slice(0, -1).join("");
        kept[maxLines - 1] = last + "...";
      }
      return { size, lines: kept, font, lead };
    }
  }
}

interface TextOpts { x: number; y: number; w: number; h: number; size: number; min?: number; color?: string; align?: CanvasTextAlign; font?: string; lead?: number; shadow?: string; shadowOff?: number; valign?: "top" | "middle" }

function text(c: CanvasRenderingContext2D, s: string, o: TextOpts) {
  const f = fit(c, s, o);
  const lh = f.size * f.lead;
  const blockH = f.lines.length * lh;
  const top = o.valign === "top" ? o.y : o.y + (o.h - blockH) / 2;
  c.font = `${f.size}px ${f.font}`;
  c.textAlign = o.align ?? "center";
  c.textBaseline = "middle";
  const ax = c.textAlign === "left" ? o.x : c.textAlign === "right" ? o.x + o.w : o.x + o.w / 2;
  f.lines.forEach((l, i) => {
    const y = top + lh * i + lh / 2;
    if (o.shadow) { c.fillStyle = o.shadow; c.fillText(l, ax, y + (o.shadowOff ?? 6)); }
    c.fillStyle = o.color ?? INK;
    c.fillText(l, ax, y);
  });
  return f;
}

/** A soft panel: rounded in pixel steps, with a warm outline and a gentle lower edge */
function panel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = CREAM, edge = SHADE, u = 8) {
  const box = (bx: number, by: number, bw: number, bh: number, col: string, n: number) => {
    c.fillStyle = col;
    c.fillRect(bx + n * 2, by, bw - n * 4, bh);
    c.fillRect(bx + n, by + n, bw - n * 2, bh - n * 2);
    c.fillRect(bx, by + n * 2, bw, bh - n * 4);
  };
  box(x, y + u, w, h, "rgba(91,68,104,0.22)", u);
  box(x, y, w, h, INK, u);
  box(x + u, y + u, w - u * 2, h - u * 2, edge, u);
  box(x + u, y + u, w - u * 2, h - u * 3, fill, u);
}

/** A little ribbon label that sits on the top edge of a panel */
function ribbon(c: CanvasRenderingContext2D, label: string, cx: number, y: number) {
  c.font = `38px ${BODY_FONT}`;
  const w = Math.min(760, c.measureText(label).width + 72), h = 62;
  panel(c, cx - w / 2, y - h / 2, w, h, ROSE, "#efb3bb", 6);
  text(c, label, { x: cx - w / 2 + 24, y: y - h / 2 + 4, w: w - 48, h: h - 14, size: 38, min: 24, color: "#7a4450", lead: 1.05 });
}

function blit(c: CanvasRenderingContext2D, g: PixelGrid, x: number, y: number, scale: number) {
  c.imageSmoothingEnabled = false;
  c.drawImage(gridToCanvas(g), Math.round(x), Math.round(y), g.w * scale, g.h * scale);
}

/** The place the shift happened, filling the frame in big chunky pixels, under a wash that sets the mood */
function backdrop(c: CanvasRenderingContext2D, phase: Phase, mood: "night" | "gold") {
  const theme = themeForPhase(phase);
  const map = getMap(mood === "gold" ? "AMBULANCE_BAY" : "ER_MAIN", theme);
  const g = composePreview(map, theme);
  const scale = Math.ceil(CARD_H / g.h);
  c.fillStyle = PLUM;
  c.fillRect(0, 0, CARD_W, CARD_H);
  blit(c, g, Math.round((CARD_W - g.w * scale) / 2), Math.round((CARD_H - g.h * scale) / 2), scale);
  // Dusk rather than night: the room stays visible and the edges fade to plum, not black
  const wash = c.createLinearGradient(0, 0, 0, CARD_H);
  if (mood === "gold") {
    wash.addColorStop(0, "rgba(140,96,150,0.62)");
    wash.addColorStop(0.3, "rgba(255,200,160,0.20)");
    wash.addColorStop(0.65, "rgba(255,210,170,0.14)");
    wash.addColorStop(1, "rgba(120,84,130,0.72)");
  } else {
    wash.addColorStop(0, "rgba(112,84,130,0.72)");
    wash.addColorStop(0.32, "rgba(255,190,170,0.16)");
    wash.addColorStop(0.68, "rgba(255,190,170,0.14)");
    wash.addColorStop(1, "rgba(104,76,118,0.78)");
  }
  c.fillStyle = wash;
  c.fillRect(0, 0, CARD_W, CARD_H);
}

/** A soft plum plate, so a heading reads on any wall */
function plate(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const n = 12;
  c.fillStyle = "rgba(91,68,104,0.82)";
  c.fillRect(x + n * 2, y, w - n * 4, h);
  c.fillRect(x + n, y + n, w - n * 2, h - n * 2);
  c.fillRect(x, y + n * 2, w, h - n * 4);
}

/** A warm glow behind the hero, with hearts and twinkles kept inside the open space above the stats */
function sparkles(c: CanvasRenderingContext2D, cx: number, top: number, bottom: number, spread: number) {
  const cy = (top + bottom) / 2, half = (bottom - top) / 2;
  const glow = c.createRadialGradient(cx, cy, 20, cx, cy, spread * 1.25);
  glow.addColorStop(0, "rgba(255,240,205,0.65)");
  glow.addColorStop(1, "rgba(255,240,205,0)");
  c.fillStyle = glow;
  c.fillRect(cx - spread * 1.3, cy - spread * 1.3, spread * 2.6, spread * 2.6);
  [[-1.05, -0.15], [1.12, -0.5], [-0.62, 0.55]].forEach(([dx, dy], i) => {
    const t = i % 2 ? 8 : 12;
    c.fillStyle = i % 2 ? SUN : CREAM;
    const x = Math.round(cx + dx * spread), y = Math.round(cy + dy * half);
    c.fillRect(x - t / 2, y - t * 1.5, t, t * 3);
    c.fillRect(x - t * 1.5, y - t / 2, t * 3, t);
  });
  ([[-0.86, -0.68, 5], [0.8, -0.72, 4], [-1.08, 0.5, 3]] as const).forEach(([dx, dy, sc]) => {
    blit(c, icon("heart"), cx + dx * spread, cy + dy * half, sc);
  });
}

function hero(c: CanvasRenderingContext2D, look: Look, cx: number, foot: number, scale: number) {
  const g = drawCharacter(look, "down", 0);
  c.fillStyle = "rgba(91,68,104,0.25)";
  const sw = g.w * scale * 0.8;
  c.fillRect(cx - sw / 2, foot - scale, sw, scale * 2);
  blit(c, g, cx - (g.w * scale) / 2, foot - g.h * scale, scale);
}

function stars(c: CanvasRenderingContext2D, n: number, cx: number, y: number, scale: number, of = 3) {
  const w = 12 * scale, gap = scale * 2, total = of * w + (of - 1) * gap;
  for (let i = 0; i < of; i++) blit(c, icon(i < n ? "star" : "starEmpty"), cx - total / 2 + i * (w + gap), y, scale);
}

/** Three little cushions, each with its own pastel */
function statRow(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stats: { value: string; label: string; color?: string; fill?: string }[]) {
  const gap = 14, cw = (w - gap * (stats.length - 1)) / stats.length;
  stats.forEach((s, i) => {
    const px = x + i * (cw + gap);
    panel(c, px, y, cw, h, s.fill ?? CREAM, SHADE);
    text(c, s.value, { x: px + 16, y: y + 20, w: cw - 32, h: h * 0.52, size: 104, min: 44, color: s.color ?? RED, lead: 1.05 });
    text(c, s.label, { x: px + 14, y: y + 18 + h * 0.52, w: cw - 28, h: h * 0.34, size: 36, min: 24, color: BROWN, lead: 1.1 });
  });
}

/** Chapter progress as hearts: full for the shifts done */
function pips(c: CanvasRenderingContext2D, right: number, y: number, total: number, filled: number) {
  const sc = total > 6 ? 3 : 4, hw = 11 * sc, gap = total > 6 ? 5 : 8;
  const w = total * hw + (total - 1) * gap;
  for (let i = 0; i < total; i++) blit(c, icon(i < filled ? "heart" : "heartEmpty"), right - w + i * (hw + gap), y, sc);
}

function footer(c: CanvasRenderingContext2D, url?: string) {
  const h = 124, y = SAFE_BOTTOM - h, x = M, w = CARD_W - M * 2;
  panel(c, x, y, w, h, CREAM, SHADE);
  blit(c, logoGrid(), x + 24, y + 18, 5);
  text(c, url || "เกม ER น่ารักๆ ของ นศพ. ไทย", { x: x + 440, y: y + 12, w: w - 468, h: h - 36, size: 38, min: 24, color: BROWN, align: "right", lead: 1.1 });
}

/** The cat, with something to say about it all */
function kitty(c: CanvasRenderingContext2D, x: number, foot: number, scale: number) {
  blit(c, drawCat("#e8a25a", 3), x, foot - 16 * scale, scale);
  blit(c, emoteBubble("heart"), x + scale * 7, foot - 16 * scale - 15 * (scale - 3), scale - 3);
}

function drawShift(c: CanvasRenderingContext2D, s: Extract<CardSpec, { kind: "shift" }>, url?: string) {
  backdrop(c, s.phase, "night");
  const statsY = 1050;
  plate(c, M + 70, SAFE_TOP - 22, CARD_W - (M + 70) * 2, 204);
  let y = SAFE_TOP - 12;
  text(c, `จบเวรวันที่ ${s.day}`, { x: M, y, w: CARD_W - M * 2, h: 78, size: 70, color: CREAM, shadow: PLUM, shadowOff: 5, lead: 1.05 });
  y += 78;
  text(c, s.player.rank, { x: M, y, w: CARD_W - M * 2, h: 62, size: 54, min: 30, color: SUN, shadow: PLUM, shadowOff: 4, lead: 1.1 });
  y += 62;
  text(c, LOCATION_NAMES[s.phase].th, { x: M, y, w: CARD_W - M * 2, h: 42, size: 34, min: 24, color: CREAM, shadow: PLUM, shadowOff: 3, lead: 1.1 });
  y += 78;

  // The name this shift earned is the point of the card
  const bannerH = 272;
  panel(c, M, y, CARD_W - M * 2, bannerH);
  ribbon(c, "ฉายาเวรนี้", CARD_W / 2, y + 4);
  text(c, s.title, { x: M + 40, y: y + 42, w: CARD_W - M * 2 - 80, h: 142, size: 132, min: 56, color: RED, shadow: BLUSH, shadowOff: 7, lead: 1.05 });
  text(c, s.line, { x: M + 40, y: y + 182, w: CARD_W - M * 2 - 80, h: 62, size: 42, min: 26, color: INK, lead: 1.15 });

  sparkles(c, CARD_W / 2, y + bannerH + 24, statsY - 24, 270);
  hero(c, s.player.look, CARD_W / 2, statsY - 4, 13);
  kitty(c, CARD_W / 2 + 150, statsY - 2, 10);

  statRow(c, M, statsY, CARD_W - M * 2, 216, [
    { value: String(s.saved), label: "คนไข้ที่ช่วยไว้", fill: BLUSH },
    { value: String(s.treated), label: "คนไข้เวรนี้", color: "#a9743f", fill: BUTTER },
    { value: String(s.streak), label: "ทำดีติดกัน (เคส)", color: GREEN, fill: SAGE },
  ]);

  const infoY = statsY + 216 + 16, infoH = SAFE_BOTTOM - 124 - 16 - infoY;
  panel(c, M, infoY, CARD_W - M * 2, infoH);
  if (s.chapter) {
    text(c, `บท ${s.chapter.n} ${s.chapter.title}`, { x: M + 40, y: infoY + 14, w: 400, h: 56, size: 40, min: 26, align: "left", color: INK, lead: 1.1 });
    pips(c, CARD_W - M - 40, infoY + 26, s.chapter.total, s.chapter.position);
    if (s.chapter.next) text(c, s.chapter.next, { x: M + 40, y: infoY + 68, w: CARD_W - M * 2 - 80, h: infoH - 88, size: 36, min: 24, color: BROWN, align: "left", lead: 1.15 });
  } else {
    text(c, s.dx.join("  ·  ") || "เวรต่อไปรออยู่น้า", { x: M + 40, y: infoY + 12, w: CARD_W - M * 2 - 80, h: infoH - 36, size: 36, min: 24, color: BROWN, lead: 1.15 });
  }
  footer(c, url);
}

function ecg(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const mid = y + h / 2, u = 6;
  c.fillStyle = MINT;
  const beat = [0, 0, 0, -1, -2, -1, 0, 0, 1, -8, 3, 0, 0, -1, -2, -2, -1, 0, 0, 0];
  for (let i = 0, px = x; px < x + w; i++, px += u) {
    const v = beat[i % beat.length] * (h / 20);
    c.fillRect(px, mid + v - u / 2, u, u);
    const prev = beat[(i + beat.length - 1) % beat.length] * (h / 20);
    const top = Math.min(prev, v), bot = Math.max(prev, v);
    if (bot - top > u) c.fillRect(px, mid + top, u, bot - top);
  }
}

function drawCase(c: CanvasRenderingContext2D, s: Extract<CardSpec, { kind: "case" }>, url?: string) {
  backdrop(c, s.phase, "night");
  let y = SAFE_TOP;
  plate(c, M, y - 12, CARD_W - M * 2, 144);
  text(c, "เคสนี้ ถ้าเป็นคุณจะทำไงดี", { x: M, y, w: CARD_W - M * 2, h: 130, size: 96, min: 56, color: SUN, shadow: PLUM, shadowOff: 6, lead: 1.05 });
  y += 150;

  // Bedside monitor
  const monH = 290;
  panel(c, M, y, CARD_W - M * 2, monH, SCREEN, "#352947");
  const cols = s.vitals.slice(0, 4), cw = (CARD_W - M * 2 - 48) / Math.max(1, cols.length);
  cols.forEach((v, i) => {
    const x = M + 24 + i * cw;
    text(c, v.label, { x, y: y + 22, w: cw, h: 46, size: 36, min: 24, color: "#cfc3dc", lead: 1.1 });
    text(c, v.value, { x, y: y + 68, w: cw, h: 86, size: 72, min: 34, color: v.bad ? PINK : MINT, lead: 1.05 });
  });
  ecg(c, M + 32, y + 166, CARD_W - M * 2 - 64, 90);
  y += monH + 24;

  // Who they are, in their own words
  const qH = 330;
  panel(c, M, y, CARD_W - M * 2, qH);
  blit(c, drawPatientInBed("#d19a6e", "#3a2a2f", "#7fb6c9"), M + 28, y + 40, 10);
  const tx = M + 28 + 160 + 28, tw = CARD_W - M - 40 - tx;
  text(c, s.patient, { x: tx, y: y + 24, w: tw, h: 70, size: 58, min: 32, align: "left", color: INK, lead: 1.1 });
  if (s.by) text(c, s.by, { x: tx, y: y + 94, w: tw, h: 40, size: 32, min: 24, color: BROWN, align: "left", lead: 1.1 });
  text(c, `"${s.quote}"`, { x: tx, y: y + 136, w: tw, h: qH - 172, size: 44, min: 28, align: "left", valign: "top", color: INK, lead: 1.25 });
  y += qH + 20;

  // How this doctor did, without giving the answer away
  const scoreH = SAFE_BOTTOM - 124 - 20 - y;
  panel(c, M, y, CARD_W - M * 2, scoreH, PAPER);
  stars(c, s.stars, CARD_W / 2, y + 30, 9);
  text(c, s.verdict, { x: M + 48, y: y + 140, w: CARD_W - M * 2 - 96, h: scoreH - 170, size: 60, min: 30, color: RED, lead: 1.2 });
  blit(c, drawCat("#e8a25a", 3), CARD_W - M - 170, y + 22, 6); // napping beside the stars
  blit(c, icon("heart"), M + 90, y + 56, 4);
  footer(c, url);
}

function drawChapter(c: CanvasRenderingContext2D, s: Extract<CardSpec, { kind: "chapter" }>, url?: string) {
  backdrop(c, s.phase, "gold");
  const statsY = 996;

  const y = SAFE_TOP + 4, bannerH = 320, inner = CARD_W - M * 2 - 80;
  panel(c, M, y, CARD_W - M * 2, bannerH);
  ribbon(c, s.promo ? "เย้ เลื่อนขั้นแล้ว!" : "บทใหม่มาแล้ว!", CARD_W / 2, y + 4);
  text(c, s.promo ?? s.title, { x: M + 40, y: y + 42, w: inner, h: 142, size: 120, min: 52, color: RED, shadow: BLUSH, shadowOff: 7, lead: 1.05 });
  text(c, s.player.rank, { x: M + 40, y: y + 186, w: inner, h: 60, size: 50, min: 28, color: INK, lead: 1.1 });
  text(c, LOCATION_NAMES[s.phase].th, { x: M + 40, y: y + 246, w: inner, h: 42, size: 34, min: 24, color: BROWN, lead: 1.1 });

  sparkles(c, CARD_W / 2 - 20, y + bannerH + 24, statsY - 24, 300);
  if (s.host) hero(c, s.host, CARD_W / 2 + 210, statsY - 8, 11);
  hero(c, s.player.look, CARD_W / 2 - 30, statsY - 4, 14);
  kitty(c, CARD_W / 2 - 370, statsY - 2, 10);

  statRow(c, M, statsY, CARD_W - M * 2, 196, [
    { value: String(s.saved), label: "คนไข้ที่ช่วยไว้", fill: BLUSH },
    { value: String(s.patients), label: "เคสที่เจอ", color: "#a9743f", fill: BUTTER },
    { value: String(s.stars), label: "ดาวในสมุดเคส", color: GREEN, fill: SAGE },
  ]);

  // What kind of doctor this is, in a line people want to post
  const py = statsY + 196 + 16, h = SAFE_BOTTOM - 124 - 16 - py;
  panel(c, M, py, CARD_W - M * 2, h);
  text(c, `${s.player.rank} เป็นหมอสไตล์...`, { x: M + 40, y: py + 14, w: inner, h: 46, size: 36, min: 24, color: BROWN, lead: 1.1 });
  text(c, `"${s.type.title}"`, { x: M + 40, y: py + 58, w: inner, h: 92, size: 80, min: 40, color: RED, lead: 1.1 });
  text(c, s.type.line, { x: M + 40, y: py + 150, w: inner, h: h - 174, size: 36, min: 24, color: INK, lead: 1.15 });
  footer(c, url);
}

/** Draws a card on a new canvas. Waits for the fonts, so call it ahead of the tap that shares. */
export async function renderCard(spec: CardSpec): Promise<HTMLCanvasElement> {
  await loadFonts();
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const c = canvas.getContext("2d")!;
  const url = process.env.NEXT_PUBLIC_SHARE_URL;
  if (spec.kind === "shift") drawShift(c, spec, url);
  else if (spec.kind === "case") drawCase(c, spec, url);
  else drawChapter(c, spec, url);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no image"))), "image/png"));
}

export type ShareResult = "shared" | "cancelled" | "unavailable" | "failed";

/**
 * Opens the phone's share sheet with just the picture, which is what lets Instagram offer "Story".
 * Must run from the tap itself, so the image is made beforehand.
 */
export async function shareBlob(blob: Blob, filename: string): Promise<ShareResult> {
  const { Capacitor } = await import("@capacitor/core");
  try {
    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
      const data = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(blob);
      });
      const { uri } = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
      await Share.share({ files: [uri] });
      return "shared";
    }
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return "shared";
    }
    return "unavailable";
  } catch (e: any) {
    const msg = String(e?.name ?? "") + String(e?.message ?? "");
    return /abort|cancel/i.test(msg) ? "cancelled" : "failed";
  }
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
