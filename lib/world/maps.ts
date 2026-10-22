import type { Theme } from "@/lib/pixel/tiles";

/**
 * World maps. Ground is a grid of characters; props sit on top with a footprint
 * (in tiles) that blocks movement when solid. Sprites taller than their footprint
 * overhang upward, so a bookshelf on one tile still looks two tiles tall.
 *
 * Ground legend:
 *   T wall top (solid)    F wall face (solid)    B bottom wall (solid)
 *   . ward floor tile     w wooden floor         D doorway (walkable, door trigger)
 *   g grass   f grass with flowers   p stepping-stone path   a asphalt   s asphalt with stripe
 */
export type MapId = "ER_MAIN" | "AMBULANCE_BAY";
export type Phase = "rama1" | "korat" | "lovely" | "rama2";

export type PropKind =
  | "window" | "clock" | "painting" | "notice" | "bed" | "desk" | "kettle" | "plant"
  | "bookshelf" | "vending" | "chair" | "rug" | "catbed" | "doormat" | "tree" | "bench"
  | "flowerbed" | "pond" | "ambulance" | "lamp" | "fence" | "signpost";

export interface Prop {
  kind: PropKind;
  x: number;
  y: number;
  w?: number; // footprint width in tiles (default 1)
  h?: number; // footprint height in tiles (default 1)
  solid?: boolean;
  variant?: string | number;
  /** drawn under characters regardless of y (rugs, mats) */
  flat?: boolean;
}

export type InteractKind = "bed" | "computer" | "kettle" | "notice" | "bookshelf" | "vending" | "pond" | "bench" | "ambulance" | "catbed" | "tree" | "window";

export interface Interactable {
  id: string;
  kind: InteractKind;
  x: number;
  y: number;
}

export interface Door {
  x: number;
  y: number;
  target: MapId;
  spawn: { x: number; y: number };
}

export interface WorldMap {
  id: MapId;
  width: number;
  height: number;
  ground: string[];
  props: Prop[];
  interactables: Interactable[];
  doors: Door[];
  /** named places NPCs like to walk to */
  spots: Record<string, { x: number; y: number }>;
  outdoor: boolean;
}

export function phaseForDay(day: number): Phase {
  if (day <= 10) return "rama1";
  if (day <= 15) return "korat";
  if (day <= 25) return "lovely";
  return "rama2";
}

export function themeForPhase(phase: Phase): Theme {
  return phase === "korat" ? "korat" : phase === "lovely" ? "lovely" : "rama";
}

export const LOCATION_NAMES: Record<Phase, { en: string; th: string }> = {
  rama1: { en: "Rama Central Hospital", th: "โรงพยาบาลรามาเซ็นทรัล" },
  korat: { en: "Korat Provincial Hospital", th: "โรงพยาบาลจังหวัดโคราช" },
  lovely: { en: "Lovely International Hospital", th: "โรงพยาบาลเลิฟลี่ อินเตอร์เนชั่นแนล" },
  rama2: { en: "Rama Central Hospital", th: "โรงพยาบาลรามาเซ็นทรัล" },
};

function erMain(theme: Theme): WorldMap {
  const plant = theme === "lovely" ? "orchid" : theme === "korat" ? "palm" : "monstera";
  const chairColor = theme === "lovely" ? "#d8b48a" : "#5fae5a";
  return {
    id: "ER_MAIN",
    width: 15,
    height: 11,
    outdoor: false,
    ground: [
      "TTTTTTTTTTTTTTT",
      "FFFFFFFFFFFFFFF",
      "...............",
      "...............",
      "...............",
      "...............",
      "wwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwww",
      "BBBBBBBDDBBBBBB",
    ],
    props: [
      { kind: "window", x: 1, y: 1 },
      { kind: "painting", x: 3, y: 1, variant: 1 },
      { kind: "window", x: 5, y: 1 },
      { kind: "clock", x: 7, y: 1 },
      { kind: "window", x: 9, y: 1 },
      { kind: "notice", x: 11, y: 1 },
      { kind: "window", x: 13, y: 1 },
      { kind: "bed", x: 2, y: 2, h: 2, solid: true, variant: 0 },
      { kind: "bed", x: 7, y: 2, h: 2, solid: true, variant: 1 },
      { kind: "bed", x: 12, y: 2, h: 2, solid: true, variant: 2 },
      { kind: "plant", x: 0, y: 2, solid: true, variant: "snake" },
      { kind: "plant", x: 14, y: 2, solid: true, variant: plant },
      { kind: "kettle", x: 0, y: 6, w: 2, solid: true },
      { kind: "desk", x: 3, y: 6, solid: true, variant: "#7fd1a8" },
      { kind: "desk", x: 4, y: 6, solid: true, variant: "#7fa7d9" },
      { kind: "catbed", x: 0, y: 8, flat: true },
      { kind: "bookshelf", x: 0, y: 9, solid: true },
      { kind: "rug", x: 6, y: 7, w: 3, h: 2, flat: true },
      { kind: "chair", x: 11, y: 6, solid: true, variant: chairColor },
      { kind: "chair", x: 12, y: 6, solid: true, variant: chairColor },
      { kind: "chair", x: 13, y: 6, solid: true, variant: chairColor },
      { kind: "vending", x: 14, y: 7, solid: true },
      { kind: "plant", x: 14, y: 9, solid: true, variant: plant },
      { kind: "plant", x: 10, y: 9, solid: true, variant: "monstera" },
      { kind: "doormat", x: 7, y: 9, w: 2, flat: true },
    ],
    interactables: [
      { id: "bed_1", kind: "bed", x: 2, y: 3 },
      { id: "bed_2", kind: "bed", x: 7, y: 3 },
      { id: "bed_3", kind: "bed", x: 12, y: 3 },
      { id: "leaderboard", kind: "computer", x: 3, y: 6 },
      { id: "consults", kind: "computer", x: 4, y: 6 },
      { id: "kettle", kind: "kettle", x: 0, y: 6 },
      { id: "kettle", kind: "kettle", x: 1, y: 6 },
      { id: "notice", kind: "notice", x: 11, y: 1 },
      { id: "bookshelf", kind: "bookshelf", x: 0, y: 9 },
      { id: "vending", kind: "vending", x: 14, y: 7 },
      { id: "catbed", kind: "catbed", x: 0, y: 8 },
      { id: "window", kind: "window", x: 5, y: 1 },
      { id: "window", kind: "window", x: 9, y: 1 },
    ],
    doors: [
      { x: 7, y: 10, target: "AMBULANCE_BAY", spawn: { x: 7, y: 2 } },
      { x: 8, y: 10, target: "AMBULANCE_BAY", spawn: { x: 8, y: 2 } },
    ],
    spots: {
      kettle: { x: 1, y: 7 },
      desk: { x: 3, y: 7 },
      bed1: { x: 3, y: 4 },
      bed2: { x: 8, y: 4 },
      bed3: { x: 11, y: 4 },
      window: { x: 5, y: 2 },
      notice: { x: 11, y: 2 },
      waiting: { x: 12, y: 7 },
      rug: { x: 7, y: 8 },
      shelf: { x: 1, y: 9 },
    },
  };
}

function courtyard(theme: Theme): WorldMap {
  return {
    id: "AMBULANCE_BAY",
    width: 15,
    height: 11,
    outdoor: true,
    ground: [
      "TTTTTTTTTTTTTTT",
      "FFFFFFFDDFFFFFF",
      "gggfgggppggfggg",
      "gggggggppgggggg",
      "gfggggpppgggggg",
      "ggggggppggggfgg",
      "ggggggppgggggfg",
      "gggggggppgggggg",
      "aaaaaaaaaaaaaaa",
      "ssssssassssssss",
      "aaaaaaaaaaaaaaa",
    ],
    props: [
      { kind: "window", x: 2, y: 1 },
      { kind: "window", x: 5, y: 1 },
      { kind: "window", x: 10, y: 1 },
      { kind: "window", x: 13, y: 1 },
      { kind: "tree", x: 1, y: 5, w: 2, solid: true },
      { kind: "bench", x: 3, y: 6, w: 2, solid: true },
      { kind: "pond", x: 11, y: 3, w: 2, h: 2, solid: true },
      { kind: "flowerbed", x: 5, y: 2, solid: true, variant: 1 },
      { kind: "flowerbed", x: 10, y: 2, solid: true, variant: 2 },
      { kind: "flowerbed", x: 13, y: 6, solid: true, variant: 3 },
      { kind: "lamp", x: 9, y: 5, solid: true },
      { kind: "signpost", x: 3, y: 3, w: 2, solid: true },
      { kind: "fence", x: 0, y: 7, solid: true },
      { kind: "fence", x: 1, y: 7, solid: true },
      { kind: "fence", x: 13, y: 7, solid: true },
      { kind: "fence", x: 14, y: 7, solid: true },
      { kind: "ambulance", x: 10, y: 9, w: 3, solid: true },
    ],
    interactables: [
      { id: "pond", kind: "pond", x: 11, y: 3 },
      { id: "pond", kind: "pond", x: 12, y: 3 },
      { id: "pond", kind: "pond", x: 11, y: 4 },
      { id: "pond", kind: "pond", x: 12, y: 4 },
      { id: "bench", kind: "bench", x: 3, y: 6 },
      { id: "bench", kind: "bench", x: 4, y: 6 },
      { id: "tree", kind: "tree", x: 1, y: 5 },
      { id: "tree", kind: "tree", x: 2, y: 5 },
      { id: "ambulance", kind: "ambulance", x: 10, y: 9 },
      { id: "ambulance", kind: "ambulance", x: 11, y: 9 },
      { id: "ambulance", kind: "ambulance", x: 12, y: 9 },
    ],
    doors: [
      { x: 7, y: 1, target: "ER_MAIN", spawn: { x: 7, y: 9 } },
      { x: 8, y: 1, target: "ER_MAIN", spawn: { x: 8, y: 9 } },
    ],
    spots: {
      bench: { x: 3, y: 7 },
      pond: { x: 10, y: 4 },
      tree: { x: 3, y: 5 },
      ambulance: { x: 11, y: 8 },
      path: { x: 7, y: 5 },
      flowers: { x: 13, y: 5 },
    },
  };
}

const cache = new Map<string, WorldMap>();

export function getMap(id: MapId, theme: Theme): WorldMap {
  const key = `${id}:${theme}`;
  if (!cache.has(key)) cache.set(key, id === "ER_MAIN" ? erMain(theme) : courtyard(theme));
  return cache.get(key)!;
}

/** Solid tiles: walls, bottom wall, and solid prop footprints */
export function solidGrid(map: WorldMap): boolean[][] {
  const solid = map.ground.map((row) => [...row].map((ch) => ch === "T" || ch === "F" || ch === "B"));
  // doorways in the face row are walkable
  map.ground.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "D") solid[y][x] = false; }));
  for (const p of map.props) {
    if (!p.solid) continue;
    for (let dy = 0; dy < (p.h ?? 1); dy++) for (let dx = 0; dx < (p.w ?? 1); dx++) {
      const yy = p.y + dy, xx = p.x + dx;
      if (solid[yy]) solid[yy][xx] = true;
    }
  }
  return solid;
}

/** Breadth-first path on the tile grid (4-way). Returns tiles after the start, or null. */
export function findPath(solid: boolean[][], from: { x: number; y: number }, to: { x: number; y: number }, blocked?: (x: number, y: number) => boolean): { x: number; y: number }[] | null {
  const h = solid.length, w = solid[0].length;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  if (!inside(to.x, to.y) || solid[to.y][to.x]) return null;
  const prev = new Map<number, number>();
  const key = (x: number, y: number) => y * w + x;
  const queue = [key(from.x, from.y)];
  prev.set(queue[0], -1);
  while (queue.length) {
    const k = queue.shift()!;
    const x = k % w, y = Math.floor(k / w);
    if (x === to.x && y === to.y) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!inside(nx, ny) || solid[ny][nx] || prev.has(key(nx, ny))) continue;
      if (blocked && blocked(nx, ny) && !(nx === to.x && ny === to.y)) continue;
      prev.set(key(nx, ny), k);
      queue.push(key(nx, ny));
    }
  }
  const end = key(to.x, to.y);
  if (!prev.has(end)) return null;
  const path: { x: number; y: number }[] = [];
  let k = end;
  while (k !== key(from.x, from.y)) { path.unshift({ x: k % w, y: Math.floor(k / w) }); k = prev.get(k)!; if (k === -1) break; }
  return path;
}
