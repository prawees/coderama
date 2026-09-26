/**
 * CODE RAMA - Restricted master palette + hand-shaded colour ramps.
 *
 * Every 2D sprite, UI frame, and the 3D cel-shader quantize to this palette so
 * the Pixi overworld and the R3F examination suite read as one universe.
 *
 * A "ramp" is a 4-step hand-picked shading set (never a hex multiplied by a
 * grayscale template): OUTLINE → SHADOW → MID → HIGHLIGHT. Skin ramps are
 * hue-shifted (shadows go warmer/redder, highlights go yellower), which is why
 * tinted grayscale always looked muddy and these do not.
 */

export interface Ramp {
  id: string;
  name: { en: string; th: string };
  outline: string;
  shadow: string;
  mid: string;
  highlight: string;
}

// ─── Master 32-colour palette (Stardew-adjacent, warm shadows) ──────────
export const MASTER_PALETTE = [
  '#0d0b14', '#1a1c2c', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7',
  '#f4f4f4', '#c2c3c7', '#94b0c2', '#566c86', '#333c57',
  '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#fbf236',
  '#a7f070', '#38b764', '#257179',
  '#3d2210', '#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac',
  '#d95763', '#ac3232', '#99e550', '#6abe30', '#d77bba', '#9badb7', '#000000',
  // Hospital palette sampled from the ER map and tileset art
  '#0b1626', '#132b43', '#254671', '#3f7fc0', '#71abdb', '#b5e2ff', '#c7dafa', '#eef4ff',
  '#93dbda', '#2f9e8f', '#dd363d', '#f3ecd2', '#b9c9df', '#6d82a3', '#71b4e8', '#f3f6ff',
] as const;

// ─── Skin ramps (human, hue-shifted) ────────────────────────────────────
export const SKIN_RAMPS: Ramp[] = [
  { id: 'skin_porcelain', name: { en: 'Porcelain', th: 'ขาวอมชมพู' }, outline: '#5a2e2e', shadow: '#d99a86', mid: '#f7c9b0', highlight: '#ffe9d6' },
  { id: 'skin_light',     name: { en: 'Light',     th: 'ขาวเหลือง' }, outline: '#5b3220', shadow: '#d69a6a', mid: '#f1c27d', highlight: '#ffe0b3' },
  { id: 'skin_tan',       name: { en: 'Tan',       th: 'สองสี' },     outline: '#4a2a14', shadow: '#b57548', mid: '#e0ac69', highlight: '#f5cf9a' },
  { id: 'skin_bronze',    name: { en: 'Bronze',    th: 'น้ำผึ้ง' },   outline: '#3a1e0c', shadow: '#8d5524', mid: '#c68642', highlight: '#e6a86d' },
  { id: 'skin_deep',      name: { en: 'Deep',      th: 'เข้ม' },      outline: '#20100a', shadow: '#5a3319', mid: '#8d5524', highlight: '#b8763a' },
  { id: 'skin_ebony',     name: { en: 'Ebony',     th: 'เข้มมาก' },   outline: '#140a06', shadow: '#2c170c', mid: '#4a2a14', highlight: '#6f4222' },
];

// ─── Hair ramps ─────────────────────────────────────────────────────────
export const HAIR_RAMPS: Ramp[] = [
  { id: 'hair_black',    name: { en: 'Black',    th: 'ดำ' },        outline: '#0d0b14', shadow: '#1a1c2c', mid: '#2b2d44', highlight: '#4a4e73' },
  { id: 'hair_brown',    name: { en: 'Brown',    th: 'น้ำตาล' },    outline: '#2a1608', shadow: '#5a3319', mid: '#8b4513', highlight: '#b86a2e' },
  { id: 'hair_auburn',   name: { en: 'Auburn',   th: 'น้ำตาลแดง' }, outline: '#3a0e0e', shadow: '#7a2a1e', mid: '#b13e53', highlight: '#ef7d57' },
  { id: 'hair_blonde',   name: { en: 'Blonde',   th: 'ทอง' },       outline: '#5b4310', shadow: '#c9a03a', mid: '#fcd53f', highlight: '#fff2a8' },
  { id: 'hair_silver',   name: { en: 'Silver',   th: 'เงิน' },      outline: '#333c57', shadow: '#566c86', mid: '#94b0c2', highlight: '#dfe9f0' },
  { id: 'hair_pink',     name: { en: 'Pink',     th: 'ชมพู' },      outline: '#5d275d', shadow: '#a04a8c', mid: '#d77bba', highlight: '#f7b4e0' },
];

// ─── Scrub / top ramps ──────────────────────────────────────────────────
export const SCRUB_RAMPS: Ramp[] = [
  { id: 'scrub_white',  name: { en: 'White Coat', th: 'เสื้อกาวน์' }, outline: '#566c86', shadow: '#c2c3c7', mid: '#f4f4f4', highlight: '#ffffff' },
  { id: 'scrub_teal',   name: { en: 'ER Teal',    th: 'เขียวหมอ' },   outline: '#123c40', shadow: '#257179', mid: '#38b764', highlight: '#7ee0a0' },
  { id: 'scrub_navy',   name: { en: 'Navy',       th: 'กรมท่า' },     outline: '#141a3a', shadow: '#29366f', mid: '#3b5dc9', highlight: '#6f95ee' },
  { id: 'scrub_maroon', name: { en: 'Maroon',     th: 'แดงเลือดหมู' }, outline: '#3a0e14', shadow: '#7a1f2c', mid: '#b13e53', highlight: '#e3697c' },
  { id: 'scrub_pink',   name: { en: 'Pink',       th: 'ชมพู' },       outline: '#5d275d', shadow: '#a04a8c', mid: '#d77bba', highlight: '#f7b4e0' },
  { id: 'scrub_neon',   name: { en: 'Neon Lime',  th: 'เขียวสะท้อนแสง' }, outline: '#2e5a12', shadow: '#6abe30', mid: '#99e550', highlight: '#d9ff9e' },
];

export const BOTTOM_RAMPS: Ramp[] = [
  { id: 'pants_charcoal', name: { en: 'Charcoal', th: 'เทาเข้ม' },  outline: '#0d0b14', shadow: '#1a1c2c', mid: '#333c57', highlight: '#566c86' },
  { id: 'pants_teal',     name: { en: 'Teal',     th: 'เขียวหมอ' }, outline: '#123c40', shadow: '#257179', mid: '#2f9a8a', highlight: '#5cc9b6' },
  { id: 'pants_navy',     name: { en: 'Navy',     th: 'กรมท่า' },   outline: '#141a3a', shadow: '#29366f', mid: '#3b5dc9', highlight: '#6f95ee' },
  { id: 'pants_white',    name: { en: 'White',    th: 'ขาว' },      outline: '#566c86', shadow: '#c2c3c7', mid: '#f4f4f4', highlight: '#ffffff' },
];

export const SHOE_RAMPS: Ramp[] = [
  { id: 'shoes_black', name: { en: 'Black Clogs', th: 'รองเท้าดำ' }, outline: '#000000', shadow: '#0d0b14', mid: '#1a1c2c', highlight: '#333c57' },
  { id: 'shoes_white', name: { en: 'White Sneakers', th: 'ผ้าใบขาว' }, outline: '#566c86', shadow: '#c2c3c7', mid: '#f4f4f4', highlight: '#ffffff' },
  { id: 'shoes_brown', name: { en: 'Brown Leather', th: 'หนังน้ำตาล' }, outline: '#2a1608', shadow: '#5a3319', mid: '#8b4513', highlight: '#b86a2e' },
];

export const ALL_RAMPS: Record<string, Ramp> = Object.fromEntries(
  [...SKIN_RAMPS, ...HAIR_RAMPS, ...SCRUB_RAMPS, ...BOTTOM_RAMPS, ...SHOE_RAMPS].map((r) => [r.id, r])
);

export function getRamp(id: string | undefined, fallback: Ramp): Ramp {
  return (id && ALL_RAMPS[id]) || fallback;
}

// ─── Migration: old hex-tint appearance → nearest ramp ──────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function dist(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a); const [r2, g2, b2] = hexToRgb(b);
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}
export function nearestRamp(hex: string | undefined, ramps: Ramp[]): Ramp {
  if (!hex || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return ramps[0];
  return ramps.reduce((best, r) => (dist(hex, r.mid) < dist(hex, best.mid) ? r : best), ramps[0]);
}

/** Snap any colour to the master palette (used by the 3D cel-shader LUT too). */
export function quantizeToPalette(hex: string): string {
  return MASTER_PALETTE.reduce((best, p) => (dist(hex, p) < dist(hex, best) ? p : best), MASTER_PALETTE[0]);
}
