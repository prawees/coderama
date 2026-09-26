/**
 * CODE RAMA - ER overworld map, authored on top of public/assets/maps/er_main.png
 * (the project's hand-painted ER floor plan, 1024 x 1024 px).
 *
 * Coordinates are image pixels. Blocked rects are walls and furniture; the
 * player's feet hitbox may not overlap them. Interactables are hit zones the
 * player can stand next to and press E.
 */
export interface Rect { x: number; y: number; w: number; h: number; }
export type InteractType = 'bed' | 'computer' | 'rest' | 'coffee';
export interface Interactable { id: string; type: InteractType; rect: Rect; promptKey: string; bedIndex?: number; }

export const ER_MAP = {
  src: '/assets/maps/er_main.png',
  width: 1024,
  height: 1024,
  spawn: { x: 512, y: 520 },
};

const R = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

export const BLOCKED: Rect[] = [
  // Outer frame
  R(0, 0, 1024, 14), R(0, 1010, 1024, 14), R(0, 0, 14, 1024), R(1010, 0, 14, 1024),
  // Top ward: back wall, beds, bedside tables, IV poles, curtain rails, dividers
  R(0, 0, 1024, 122),
  R(105, 118, 97, 162), R(360, 118, 97, 162), R(598, 118, 97, 162), R(845, 118, 97, 162),
  R(45, 122, 62, 82), R(200, 122, 60, 82), R(455, 122, 60, 82), R(698, 122, 58, 82), R(940, 122, 60, 82),
  R(300, 122, 55, 80), R(540, 122, 55, 80), R(785, 122, 55, 80),
  R(262, 40, 20, 230), R(512, 40, 20, 230), R(760, 40, 20, 230),
  R(258, 238, 30, 72), R(508, 242, 28, 68), R(755, 238, 30, 72),
  R(22, 260, 44, 44),
  R(0, 294, 355, 26), R(668, 294, 152, 26), R(925, 294, 99, 26),
  // Middle band: staff room wall, cart, curtains, right rooms
  R(0, 318, 355, 138), R(205, 425, 150, 86),
  R(418, 310, 195, 150),
  R(668, 318, 152, 138), R(668, 428, 150, 82),
  R(876, 310, 50, 150), R(925, 318, 99, 190),
  // Black band between corridor and ER bay (two openings at x 205-310 and 715-820)
  R(0, 565, 205, 38), R(310, 565, 405, 38), R(820, 565, 204, 38),
  // ER bay: walls, nurses' station, carts, curtain poles
  R(0, 600, 205, 145), R(310, 600, 405, 118), R(820, 600, 204, 145),
  R(405, 715, 262, 88),
  R(28, 712, 72, 110), R(940, 712, 58, 110), R(102, 722, 52, 68),
  R(320, 680, 20, 330), R(686, 680, 20, 330),
  // ER bay beds, bedside tables, IV poles
  R(105, 822, 97, 188), R(462, 822, 97, 188), R(822, 822, 97, 188),
  R(28, 935, 70, 75), R(355, 935, 72, 75), R(925, 935, 72, 75),
  R(205, 888, 48, 122), R(560, 888, 48, 80), R(770, 890, 52, 120),
];

export const INTERACTABLES: Interactable[] = [
  { id: 'bed_1', type: 'bed', rect: R(105, 822, 97, 188), promptKey: 'engine.treat_bed', bedIndex: 0 },
  { id: 'bed_2', type: 'bed', rect: R(462, 822, 97, 188), promptKey: 'engine.treat_bed', bedIndex: 1 },
  { id: 'bed_3', type: 'bed', rect: R(822, 822, 97, 188), promptKey: 'engine.treat_bed', bedIndex: 2 },
  { id: 'consults', type: 'computer', rect: R(460, 715, 120, 88), promptKey: 'engine.consults' },
  { id: 'leaderboard', type: 'computer', rect: R(28, 712, 72, 110), promptKey: 'engine.leaderboard' },
  { id: 'coffee', type: 'coffee', rect: R(612, 730, 58, 70), promptKey: 'engine.coffee' },
  { id: 'staff_room', type: 'rest', rect: R(78, 350, 76, 106), promptKey: 'engine.staff_room' },
];

/** Straight-line patrol routes (checked against BLOCKED at runtime). */
export const NPC_ROUTES: Record<'nurse_ann' | 'grump_npc', { x: number; y: number }[]> = {
  nurse_ann: [{ x: 760, y: 790 }, { x: 760, y: 520 }, { x: 900, y: 520 }, { x: 760, y: 520 }, { x: 760, y: 790 }, { x: 700, y: 835 }],
  grump_npc: [{ x: 250, y: 520 }, { x: 120, y: 520 }, { x: 250, y: 520 }, { x: 250, y: 790 }, { x: 380, y: 520 }],
};

export const FEET = { w: 30, h: 14 };

export function blockedAt(x: number, y: number): boolean {
  const fx = x - FEET.w / 2, fy = y - FEET.h;
  if (fx < 0 || fy < 0 || fx + FEET.w > ER_MAP.width || y > ER_MAP.height) return true;
  return BLOCKED.some((r) => fx < r.x + r.w && fx + FEET.w > r.x && fy < r.y + r.h && y > r.y);
}

/** Distance from a point to the nearest edge of a rect (0 when inside). */
export function distToRect(px: number, py: number, r: Rect): number {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}
