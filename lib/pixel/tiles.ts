import { PixelGrid, shade, mix, cozyShadow, rng } from "./grid";
import { C } from "./palette";

/**
 * Tiles (16x16) and props (multiples of 16) for the clinic world.
 * Three location themes share one layout: Rama Central (old public hospital,
 * teal tiles and worn wood), Korat (provincial, terracotta and plants) and
 * Lovely International (marble and gold).
 */
export type Theme = "rama" | "korat" | "lovely";

export interface ThemePalette {
  floorA: string; floorB: string; grout: string; // ward floor
  wood: string; woodDark: string; // staff-area planks
  wall: string; wallShade: string; trim: string; trimDark: string; // plaster + wainscot
  wallTop: string;
  quilt: string[]; // patient quilts
  accent: string;
}

export const THEMES: Record<Theme, ThemePalette> = {
  rama: {
    floorA: C.teal, floorB: "#b4ded2", grout: C.tealShade,
    wood: C.wood, woodDark: C.woodDark,
    wall: C.plaster, wallShade: C.plasterShade, trim: "#6f9e8f", trimDark: "#557e72",
    wallTop: "#4d3a3f",
    quilt: ["#d95763", "#e8b84f", "#7fa7d9", "#86c35f", "#c98ad1"],
    accent: "#5f9e8e",
  },
  korat: {
    floorA: C.terracotta, floorB: "#e39a6f", grout: C.terracottaShade,
    wood: "#c48a52", woodDark: "#93603a",
    wall: "#f2dfbf", wallShade: "#dcc39b", trim: "#a8673d", trimDark: "#81502f",
    wallTop: "#5a3b33",
    quilt: ["#e07a3a", "#6aa84f", "#5b7fbf", "#e8b84f", "#b3546b"],
    accent: "#a8673d",
  },
  lovely: {
    floorA: C.marble, floorB: "#e9e3d6", grout: C.marbleVein,
    wood: "#c99a6b", woodDark: "#9c7148",
    wall: "#fbf3e6", wallShade: "#eadcc4", trim: C.gold, trimDark: C.goldDeep,
    wallTop: "#6b5a4a",
    quilt: ["#f4c7d8", "#cfe3f2", "#f6e3b0", "#d8ecd0", "#e7d5f2"],
    accent: C.gold,
  },
};

const T = 16;

/* ---------------- ground ---------------- */

export function floorTile(theme: Theme, x: number, y: number): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(T, T);
  if (theme === "lovely") {
    // marble slabs with soft veins
    const r = rng(x * 92821 + y * 68917 + 7);
    g.rect(0, 0, 15, 15, (x + y) % 2 ? p.floorA : p.floorB);
    let vx = Math.floor(r() * 16), vy = 0;
    while (vy < 16) { g.set(vx, vy, p.grout); vx += r() < 0.5 ? -1 : 1; vy += 1 + (r() < 0.3 ? 1 : 0); }
    g.hline(0, 15, 15, mix(p.grout, p.floorA, 0.4)); g.vline(15, 0, 15, mix(p.grout, p.floorA, 0.4));
  } else {
    // 8px tiles with grout, alternating shades
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
      const alt = (tx + ty) % 2 === 0;
      g.rect(tx * 8, ty * 8, tx * 8 + 7, ty * 8 + 7, alt ? p.floorA : p.floorB);
      g.set(tx * 8 + 1, ty * 8 + 1, mix(alt ? p.floorA : p.floorB, "#ffffff", 0.35)); // glint
    }
    g.hline(0, 15, 7, p.grout); g.hline(0, 15, 15, p.grout);
    g.vline(7, 0, 15, p.grout); g.vline(15, 0, 15, p.grout);
  }
  return g;
}

export function woodTile(theme: Theme, x: number, y: number): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(T, T);
  const r = rng(x * 7349 + y * 1913 + 3);
  for (let row = 0; row < 4; row++) {
    const plank = mix(p.wood, (row + y) % 2 ? "#ffffff" : p.woodDark, 0.12);
    g.rect(0, row * 4, 15, row * 4 + 3, plank);
    g.hline(0, 15, row * 4 + 3, p.woodDark);
    const seam = (Math.floor(r() * 12) + row * 5 + x * 3) % 16;
    g.vline(seam, row * 4, row * 4 + 2, p.woodDark);
    // grain flecks
    for (let k = 0; k < 2; k++) g.set(Math.floor(r() * 16), row * 4 + 1 + Math.floor(r() * 2), shade(plank, 0.9));
  }
  return g;
}

export function grassTile(x: number, y: number, flowers = false): PixelGrid {
  const g = new PixelGrid(T, T);
  const r = rng(x * 15731 + y * 789221 + 11);
  g.rect(0, 0, 15, 15, C.grass);
  for (let i = 0; i < 14; i++) {
    const px = Math.floor(r() * 16), py = Math.floor(r() * 15);
    const light = r() < 0.5;
    g.set(px, py, light ? C.grassLight : C.grassDark);
    if (!light) g.set(px, py + 1, C.grassDark);
  }
  if (flowers) {
    const colours = [C.white, C.pink, C.sun, "#c8a6e8"];
    for (let i = 0; i < 4; i++) {
      const fx = 2 + Math.floor(r() * 12), fy = 2 + Math.floor(r() * 12);
      const c = colours[Math.floor(r() * colours.length)];
      g.set(fx, fy, c); g.set(fx - 1, fy, c); g.set(fx + 1, fy, c); g.set(fx, fy - 1, c); g.set(fx, fy + 1, c);
      g.set(fx, fy, C.sun === c ? "#f08a3a" : C.sun);
    }
  }
  return g;
}

export function pathTile(x: number, y: number): PixelGrid {
  const g = grassTile(x, y);
  const r = rng(x * 31 + y * 977 + 5);
  // stepping stones
  const stones = [[1, 1, 6, 5], [9, 2, 14, 7], [3, 9, 8, 14], [10, 10, 14, 14]];
  for (const [x0, y0, x1, y1] of stones) {
    const jitter = Math.floor(r() * 2);
    g.rect(x0 + jitter, y0, x1, y1, C.stone);
    g.hline(x0 + jitter, x1, y1, C.stoneShade);
    g.set(x0 + jitter, y0, C.grass); g.set(x1, y0, C.grass); g.set(x0 + jitter, y1, C.grassDark); g.set(x1, y1, C.grassDark);
    g.set(x0 + jitter + 1, y0 + 1, mix(C.stone, "#ffffff", 0.5));
  }
  return g;
}

export function asphaltTile(x: number, y: number, stripe = false): PixelGrid {
  const g = new PixelGrid(T, T);
  const r = rng(x * 3 + y * 101 + 77);
  g.rect(0, 0, 15, 15, "#8b8794");
  for (let i = 0; i < 10; i++) g.set(Math.floor(r() * 16), Math.floor(r() * 16), r() < 0.5 ? "#7d7986" : "#9a96a3");
  if (stripe) g.rect(0, 7, 15, 8, "#f2e3a0");
  return g;
}

/* ---------------- walls ---------------- */

/** Dark top edge of a wall (seen from above) */
export function wallTopTile(theme: Theme): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(T, T);
  g.rect(0, 0, 15, 15, p.wallTop);
  g.hline(0, 15, 15, shade(p.wallTop, 1.25));
  g.hline(0, 15, 0, shade(p.wallTop, 0.8));
  return g;
}

/** Wall face: plaster above, wainscot trim below */
export function wallFaceTile(theme: Theme, x: number): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(T, T);
  g.rect(0, 0, 15, 15, p.wall);
  g.rect(0, 0, 15, 1, p.wallShade); // shadow under the ceiling
  g.rect(0, 10, 15, 15, p.trim);
  g.hline(0, 15, 10, mix(p.trim, "#ffffff", 0.35));
  g.hline(0, 15, 15, p.trimDark);
  for (const vx of [3, 11]) g.vline((vx + x * 8) % 16, 11, 14, p.trimDark); // panel lines
  if (theme === "lovely") g.hline(0, 15, 9, C.gold);
  return g;
}

/** Window frame for a wall face; the glass is a separate white sprite tinted by the time of day */
export function windowFrame(theme: Theme): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(T, T);
  const frame = theme === "lovely" ? C.goldDeep : C.woodDark;
  g.rect(2, 1, 13, 10, frame);
  g.rect(3, 2, 12, 9, null); // glass is a separate tinted sprite
  g.vline(7, 2, 9, frame); g.vline(8, 2, 9, frame);
  g.hline(3, 12, 5, frame);
  g.rect(1, 10, 14, 11, shade(p.wall, 0.85)); // sill
  g.hline(1, 14, 10, C.cream);
  // tiny potted succulent on the sill
  g.rect(4, 8, 5, 9, C.terracotta); g.set(4, 7, C.leafLight); g.set(5, 7, C.leaf);
  return g;
}

export function windowGlass(): PixelGrid {
  const g = new PixelGrid(T, T);
  g.rect(3, 2, 12, 9, "#ffffff");
  // highlights stay bright after tinting
  g.set(4, 3, "#ffffff"); g.set(5, 3, "#ffffff");
  return g;
}

export function windowShine(): PixelGrid {
  const g = new PixelGrid(T, T);
  for (const [x, y] of [[4, 3], [5, 3], [4, 4], [9, 6], [10, 6], [9, 7]] as const) g.set(x, y, "#ffffffaa");
  return g;
}

/* ---------------- props ---------------- */

export function bed(theme: Theme, quilt: string): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(16, 32);
  const frame = theme === "lovely" ? "#d8c7a8" : theme === "korat" ? p.woodDark : C.metal;
  const frameDark = shade(frame, 0.8);
  g.rect(1, 1, 14, 6, frame); // headboard
  g.hline(1, 14, 1, mix(frame, "#ffffff", 0.3));
  g.hline(1, 14, 6, frameDark);
  g.rect(2, 7, 13, 28, "#fbf7ee"); // sheet
  g.rect(3, 8, 12, 12, "#ffffff"); // pillow
  g.hline(3, 12, 12, "#e6dfd2");
  g.rect(2, 16, 13, 28, quilt);
  const alt = mix(quilt, "#ffffff", 0.3);
  for (let y = 16; y <= 28; y++) for (let x = 2; x <= 13; x++) if (((x >> 2) + (y >> 2)) % 2 === 0) g.set(x, y, alt);
  g.hline(2, 13, 16, mix(quilt, "#ffffff", 0.6));
  g.hline(2, 13, 28, cozyShadow(quilt, 0.8));
  g.rect(1, 29, 2, 30, frameDark); g.rect(13, 29, 14, 30, frameDark); // legs
  g.outline(C.ink);
  return g;
}

export function deskComputer(screen: string): PixelGrid {
  const g = new PixelGrid(16, 24);
  g.rect(0, 12, 15, 15, C.woodLight); g.hline(0, 15, 12, mix(C.woodLight, "#ffffff", 0.3));
  g.rect(0, 16, 15, 21, C.wood); g.rect(2, 17, 6, 20, C.woodDark); g.set(4, 18, C.gold);
  g.rect(3, 2, 12, 10, "#4b4655"); // monitor
  g.rect(4, 3, 11, 8, screen);
  g.hline(5, 8, 4, mix(screen, "#ffffff", 0.6)); g.hline(5, 10, 6, mix(screen, "#ffffff", 0.4));
  g.rect(7, 10, 8, 11, "#4b4655");
  g.rect(11, 9, 13, 11, C.cream); g.set(12, 9, "#8b5a3c"); // coffee mug
  g.outline(C.ink);
  return g;
}

export function kettleStation(theme: Theme): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(32, 24);
  g.rect(0, 10, 31, 13, theme === "lovely" ? C.marble : C.woodLight);
  g.hline(0, 31, 10, "#ffffff");
  g.rect(0, 14, 31, 21, p.wood); g.vline(15, 14, 21, p.woodDark); g.vline(16, 14, 21, p.woodDark);
  g.set(13, 17, C.gold); g.set(18, 17, C.gold);
  // kettle
  g.rect(3, 4, 9, 9, C.berry); g.hline(4, 8, 3, C.berryDeep); g.set(10, 6, C.berry); g.set(11, 5, C.berry);
  g.set(4, 5, mix(C.berry, "#ffffff", 0.5));
  // steam
  g.set(5, 1, "#ffffffaa"); g.set(6, 0, "#ffffff88");
  // cups
  for (const cx of [14, 18]) { g.rect(cx, 7, cx + 2, 9, C.cream); g.set(cx + 3, 8, C.cream); }
  // jar of snacks
  g.rect(23, 4, 28, 9, C.glass); g.rect(24, 6, 27, 9, C.sun); g.hline(23, 28, 3, C.woodDark);
  g.outline(C.ink);
  return g;
}

export function pottedPlant(kind: "monstera" | "orchid" | "palm" | "snake"): PixelGrid {
  const g = new PixelGrid(16, 24);
  g.rect(4, 17, 11, 22, C.terracotta); g.hline(3, 12, 17, mix(C.terracotta, "#ffffff", 0.25)); g.hline(4, 11, 22, C.terracottaShade);
  g.vline(10, 18, 21, C.terracottaShade);
  if (kind === "monstera") {
    const leaves: [number, number][] = [[3, 8], [9, 6], [6, 3], [11, 11], [2, 13], [8, 12]];
    for (const [lx, ly] of leaves) {
      g.rect(lx, ly, lx + 4, ly + 3, C.leaf); g.set(lx + 1, ly + 1, C.leafLight); g.set(lx + 2, ly + 1, C.leafLight);
      g.set(lx + 2, ly + 3, C.leafDark); g.set(lx + 4, ly, null);
    }
    g.vline(7, 12, 16, C.leafDark); g.vline(8, 9, 16, C.leafDark);
  } else if (kind === "orchid") {
    g.vline(8, 6, 16, C.leafDark); g.rect(5, 14, 11, 16, C.leaf);
    for (const [fx, fy] of [[6, 5], [10, 7], [7, 9], [10, 3]] as const) {
      g.set(fx, fy, C.pink); g.set(fx - 1, fy, C.pink); g.set(fx + 1, fy, C.pink); g.set(fx, fy - 1, C.pink); g.set(fx, fy + 1, C.pinkDeep);
      g.set(fx, fy, "#ffffff");
    }
  } else if (kind === "palm") {
    for (const [lx, ly, len] of [[2, 6, 5], [9, 4, 5], [5, 2, 4], [10, 9, 4], [1, 11, 4]] as const) {
      for (let i = 0; i < len; i++) g.set(lx + i, ly + Math.floor(i / 2), C.leaf);
      for (let i = 0; i < len; i++) g.set(lx + i, ly + 1 + Math.floor(i / 2), C.leafDark);
    }
    g.vline(7, 8, 16, "#8b6b3c");
  } else {
    for (const sx of [5, 7, 9, 11]) { g.vline(sx, 6 + (sx % 3), 16, C.leafDark); g.vline(sx - 1, 8 + (sx % 2), 16, C.leaf); g.set(sx, 6 + (sx % 3), C.leafLight); }
  }
  g.outline(C.ink);
  return g;
}

export function bookshelf(): PixelGrid {
  const g = new PixelGrid(16, 32);
  g.rect(0, 0, 15, 30, C.woodDark); g.rect(1, 1, 14, 29, C.wood);
  const r = rng(42);
  for (const shelfY of [2, 11, 20]) {
    g.hline(1, 14, shelfY + 8, C.woodDark);
    let x = 2;
    while (x < 14) {
      const w = 1 + Math.floor(r() * 2);
      const h = 5 + Math.floor(r() * 3);
      const col = ["#d95763", "#5b7fbf", "#86c35f", "#e8b84f", "#c98ad1", "#f2efe6"][Math.floor(r() * 6)];
      g.rect(x, shelfY + 8 - h, Math.min(13, x + w - 1), shelfY + 7, col);
      g.set(x, shelfY + 8 - h, mix(col, "#ffffff", 0.4));
      x += w + (r() < 0.2 ? 1 : 0);
    }
  }
  g.outline(C.ink);
  return g;
}

export function noticeBoard(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(1, 2, 14, 12, "#c9955c"); g.rect(1, 2, 14, 2, C.woodDark); g.rect(1, 12, 14, 12, C.woodDark);
  g.vline(1, 2, 12, C.woodDark); g.vline(14, 2, 12, C.woodDark);
  g.rect(3, 4, 6, 8, C.paper); g.set(4, 4, C.berry);
  g.rect(8, 3, 12, 6, "#fff3a8"); g.set(10, 3, "#5b7fbf");
  g.rect(8, 8, 11, 11, "#cfe8f2"); g.set(9, 8, C.berry);
  g.hline(4, 5, 6, C.inkSoft); g.hline(9, 11, 5, C.inkSoft);
  g.outline(C.ink);
  return g;
}

export function wallClock(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(4, 2, 11, 9, C.cream);
  g.set(4, 2, null); g.set(11, 2, null); g.set(4, 9, null); g.set(11, 9, null);
  g.vline(7, 3, 6, C.ink); g.hline(7, 9, 6, C.ink);
  for (const [x, y] of [[7, 3], [10, 5], [7, 8], [5, 5]] as const) g.set(x, y, C.inkSoft);
  g.outline(C.woodDark);
  return g;
}

export function painting(seed: number): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(2, 2, 13, 10, C.gold); g.rect(3, 3, 12, 9, C.sky);
  g.rect(3, 7, 12, 9, C.grass); // hills
  g.set(5, 6, C.grass); g.set(6, 6, C.grass); g.set(9, 6, C.grassDark); g.set(10, 5, C.grassDark);
  g.rect(9 + (seed % 2), 4, 10 + (seed % 2), 4, C.sun);
  g.outline(C.ink);
  return g;
}

export function vendingMachine(): PixelGrid {
  const g = new PixelGrid(16, 32);
  g.rect(1, 1, 14, 29, "#d95763"); g.rect(2, 2, 13, 3, "#ffffff");
  g.rect(2, 5, 10, 20, "#cfe8f2");
  const cans = ["#e8b84f", "#5b7fbf", "#86c35f", "#f2efe6", "#e07a3a"];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) g.rect(3 + col * 2, 6 + row * 4, 3 + col * 2, 8 + row * 4, cans[(row + col) % cans.length]);
  g.rect(11, 6, 13, 9, "#4b4655"); g.set(12, 7, "#86c35f");
  g.rect(3, 23, 10, 26, "#4b4655");
  g.hline(1, 14, 29, C.berryDeep);
  g.outline(C.ink);
  return g;
}

export function waitingChair(color: string): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(2, 2, 13, 7, color); g.hline(2, 13, 2, mix(color, "#ffffff", 0.35));
  g.rect(2, 8, 13, 11, shade(color, 0.85));
  g.vline(3, 12, 14, C.metalShade); g.vline(12, 12, 14, C.metalShade);
  g.outline(C.ink);
  return g;
}

export function rug(theme: Theme): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(48, 32);
  const base = theme === "lovely" ? "#e9d3b0" : theme === "korat" ? "#c7564a" : "#d9a15a";
  const border = theme === "lovely" ? C.goldDeep : shade(base, 0.7);
  g.rect(1, 1, 46, 30, base);
  g.rect(1, 1, 46, 2, border); g.rect(1, 29, 46, 30, border); g.vline(1, 1, 30, border); g.vline(46, 1, 30, border);
  // diamond pattern
  for (let y = 5; y < 28; y++) for (let x = 5; x < 43; x++) {
    const dx = Math.abs(((x - 5) % 12) - 6), dy = Math.abs(((y - 5) % 12) - 6);
    if (dx + dy === 5) g.set(x, y, p.accent === C.gold ? C.gold : mix(base, "#ffffff", 0.45));
    if (dx + dy === 1) g.set(x, y, border);
  }
  // fringe
  for (let x = 2; x < 46; x += 2) { g.set(x, 0, C.cream); g.set(x, 31, C.cream); }
  return g;
}

export function catBed(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(1, 6, 14, 13, "#c7564a"); g.rect(3, 7, 12, 11, "#f4c7d8");
  g.hline(1, 14, 6, mix("#c7564a", "#ffffff", 0.3));
  g.set(9, 8, C.white); g.set(6, 10, C.white); // little paw prints on the cushion
  g.outline(C.ink);
  return g;
}

export function doorMat(): PixelGrid {
  const g = new PixelGrid(32, 16);
  g.rect(2, 4, 29, 13, "#a8673d");
  for (let x = 3; x < 29; x += 2) g.vline(x, 5, 12, "#93603a");
  g.rect(8, 7, 23, 10, "#e8b84f");
  g.outline(C.ink);
  return g;
}

/** Open doorway in the bottom wall, with light spilling in */
export function doorway(theme: Theme): PixelGrid {
  const p = THEMES[theme];
  const g = new PixelGrid(32, 16);
  g.rect(0, 0, 31, 15, mix(C.grassLight, "#ffffff", 0.3));
  g.rect(0, 0, 1, 15, p.trimDark); g.rect(30, 0, 31, 15, p.trimDark);
  return g;
}

/* ---------------- outdoors ---------------- */

export function frangipaniTree(): PixelGrid {
  const g = new PixelGrid(32, 48);
  // trunk with branches
  g.rect(14, 26, 17, 44, "#8b6a4f"); g.vline(17, 27, 44, "#6e5240");
  g.rect(11, 22, 13, 27, "#8b6a4f"); g.rect(18, 20, 20, 26, "#8b6a4f");
  g.hline(12, 19, 45, "#6e5240");
  // canopy clumps
  const clumps: [number, number, number][] = [[6, 14, 7], [16, 10, 8], [25, 15, 6], [11, 22, 6], [21, 22, 6], [16, 4, 5]];
  for (const [cx, cy, rad] of clumps) for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
    if (x * x + y * y <= rad * rad) g.set(cx + x, cy + y, y < -rad / 3 ? C.leafLight : y > rad / 2 ? C.leafDark : C.leaf);
  }
  // flowers: white with yellow centres
  const r = rng(9);
  for (let i = 0; i < 16; i++) {
    const fx = 3 + Math.floor(r() * 26), fy = 2 + Math.floor(r() * 24);
    if (!g.get(fx, fy)) continue;
    g.set(fx, fy, C.sun); g.set(fx - 1, fy, C.white); g.set(fx + 1, fy, C.white); g.set(fx, fy - 1, C.white); g.set(fx, fy + 1, "#f6d0dc");
  }
  g.outline(C.ink);
  return g;
}

export function bench(): PixelGrid {
  const g = new PixelGrid(32, 16);
  g.rect(2, 2, 29, 5, C.woodLight); g.hline(2, 29, 2, mix(C.woodLight, "#ffffff", 0.35));
  g.rect(2, 7, 29, 10, C.wood); g.hline(2, 29, 10, C.woodDark);
  g.rect(4, 11, 5, 14, C.woodDark); g.rect(26, 11, 27, 14, C.woodDark);
  g.outline(C.ink);
  return g;
}

export function flowerBed(seed: number): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(1, 6, 14, 14, "#8b6a4f"); g.hline(1, 14, 6, "#a8826a");
  const r = rng(seed + 3);
  const colours = [C.pink, C.sun, C.white, C.berry, "#c8a6e8"];
  for (let i = 0; i < 6; i++) {
    const fx = 2 + Math.floor(r() * 11), fy = 2 + Math.floor(r() * 7);
    g.vline(fx, fy + 1, 8, C.leafDark);
    const c = colours[Math.floor(r() * colours.length)];
    g.set(fx, fy, c); g.set(fx - 1, fy, c); g.set(fx + 1, fy, c); g.set(fx, fy - 1, c);
  }
  g.outline(C.ink);
  return g;
}

export function pond(): PixelGrid {
  const g = new PixelGrid(32, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = (x - 15.5) / 14, dy = (y - 15.5) / 12;
    const d = dx * dx + dy * dy;
    if (d <= 1) g.set(x, y, d > 0.75 ? C.stone : d > 0.6 ? "#5fa8c4" : C.water);
  }
  for (const [x, y] of [[10, 12], [11, 12], [18, 18], [19, 18], [20, 18]] as const) g.set(x, y, C.waterLight);
  // lily pads and a koi
  g.rect(20, 10, 23, 12, C.leaf); g.set(22, 11, C.leafLight); g.set(21, 9, C.pink);
  g.rect(9, 18, 12, 19, "#f08a3a"); g.set(13, 18, "#ffffff"); g.set(8, 18, "#f08a3a"); g.set(8, 19, "#f08a3a");
  g.outline(C.ink);
  return g;
}

export function ambulance(): PixelGrid {
  const g = new PixelGrid(48, 32);
  // body, three-quarter view from above-right
  g.rect(2, 6, 45, 25, "#fbf7ee");
  g.rect(2, 6, 45, 8, "#e9e1d2"); // roof edge
  g.rect(30, 9, 44, 17, "#bfe6ef"); g.vline(37, 9, 17, "#e9e1d2"); // windscreen + door window
  g.rect(2, 18, 45, 20, "#e07a3a"); // stripe
  g.rect(8, 10, 12, 16, "#5fae5a"); g.rect(6, 12, 14, 14, "#5fae5a"); // green plus emblem
  g.rect(18, 9, 21, 9, C.berry); g.rect(23, 9, 26, 9, "#5b7fbf"); // light bar
  // wheels
  for (const wx of [8, 36]) { g.rect(wx, 24, wx + 6, 28, "#4b4655"); g.rect(wx + 2, 25, wx + 4, 27, C.metal); }
  g.hline(2, 45, 25, "#d8cfbe");
  g.outline(C.ink);
  return g;
}

export function lampPost(): PixelGrid {
  const g = new PixelGrid(16, 32);
  g.vline(7, 6, 29, "#4b4655"); g.vline(8, 6, 29, "#5f5a6a");
  g.rect(5, 1, 10, 5, "#4b4655"); g.rect(6, 2, 9, 4, "#fff1b8");
  g.rect(5, 29, 10, 30, "#4b4655");
  g.outline(C.ink);
  return g;
}

export function fence(): PixelGrid {
  const g = new PixelGrid(16, 16);
  for (const px of [1, 7, 13]) { g.rect(px, 3, px + 1, 14, C.cream); g.set(px, 2, C.cream); }
  g.hline(0, 15, 6, "#e6dccb"); g.hline(0, 15, 11, "#e6dccb");
  g.outline(C.ink);
  return g;
}

export function signpost(): PixelGrid {
  const g = new PixelGrid(32, 24);
  g.rect(2, 2, 29, 12, C.wood); g.rect(3, 3, 28, 11, C.woodLight);
  g.vline(7, 13, 22, C.woodDark); g.vline(24, 13, 22, C.woodDark);
  // little heart-and-plus logo instead of words
  g.rect(13, 5, 18, 9, C.berry); g.set(13, 5, null); g.set(18, 5, null); g.set(15, 5, null); g.set(16, 5, null);
  g.rect(15, 6, 16, 8, C.white); g.hline(14, 17, 7, C.white);
  g.outline(C.ink);
  return g;
}

/** A red Thai post box by the door. Letters from patients arrive here. */
export function postbox(): PixelGrid {
  const g = new PixelGrid(16, 27);
  const red = "#d9504a", light = "#ef7b68", dark = "#a8343a";
  // domed cap
  g.rect(5, 1, 10, 1, red); g.rect(4, 2, 11, 3, red); g.rect(3, 4, 12, 5, red);
  g.hline(6, 8, 2, light); g.hline(5, 6, 3, light);
  g.hline(2, 13, 6, dark);
  // pillar
  g.rect(3, 7, 12, 22, red);
  g.vline(4, 7, 21, light);
  g.vline(11, 7, 22, dark); g.vline(12, 7, 22, dark);
  // letter slot with a little lip
  g.rect(5, 9, 10, 10, C.ink); g.hline(5, 10, 11, dark);
  // a little envelope badge
  g.rect(5, 14, 10, 18, C.white);
  g.stamp(5, 14, ["X    X", " X  X ", "  XX  "], { X: C.inkSoft });
  // plinth
  g.rect(2, 23, 13, 25, "#6b5f6f"); g.hline(2, 13, 23, "#8a7f8e");
  g.outline(C.ink);
  return g;
}

/** Floating paper krathong for Loy Krathong night: banana leaf, marigold, candle */
export function krathong(): PixelGrid {
  const g = new PixelGrid(12, 11);
  g.rect(1, 7, 10, 8, C.leafDark); g.rect(2, 6, 9, 6, C.leaf); g.set(1, 6, C.leafLight); g.set(10, 6, C.leafLight);
  g.rect(3, 4, 8, 5, "#f3a63b"); g.set(4, 4, C.sun); g.set(7, 4, C.sun);
  g.vline(5, 1, 3, C.cream); g.vline(6, 2, 3, C.cream);
  g.set(5, 0, "#ffd66b"); g.set(6, 1, "#fff1b8");
  g.outline(C.ink);
  return g;
}

/** Paper sky lantern drifting up on festival nights */
export function skyLantern(): PixelGrid {
  const g = new PixelGrid(7, 9);
  g.rect(1, 1, 5, 6, "#ffb45c"); g.rect(2, 0, 4, 0, "#ffb45c");
  g.rect(2, 2, 4, 5, "#ffe08a"); g.set(3, 3, "#fff6d0");
  g.hline(2, 4, 7, "#c96d2c");
  g.set(3, 8, "#ffd66b");
  return g;
}

/** One bulb of a string of fairy lights */
export function fairyBulb(color: string): PixelGrid {
  const g = new PixelGrid(3, 4);
  g.set(1, 0, "#4b4655");
  g.rect(0, 1, 2, 2, color); g.set(1, 3, color); g.set(0, 1, mix(color, "#ffffff", 0.5));
  return g;
}

export function raindrop(): PixelGrid {
  const g = new PixelGrid(1, 4);
  g.set(0, 0, "#cfe8f6"); g.set(0, 1, "#b5dcf0"); g.set(0, 2, "#9ccbe6"); g.set(0, 3, "#9ccbe6");
  return g;
}

export function splash(): PixelGrid {
  const g = new PixelGrid(5, 2);
  g.set(0, 1, "#b5dcf0"); g.set(4, 1, "#b5dcf0"); g.set(1, 0, "#cfe8f6"); g.set(3, 0, "#cfe8f6");
  return g;
}

/* ---------------- UI-in-world bits ---------------- */

export type Emote = "heart" | "note" | "dots" | "alert" | "sleep" | "sweat" | "star" | "angry" | "mail";

export function emoteBubble(kind: Emote): PixelGrid {
  const g = new PixelGrid(12, 12);
  g.rect(1, 1, 10, 8, C.white);
  g.set(1, 1, null); g.set(10, 1, null); g.set(1, 8, null); g.set(10, 8, null);
  g.set(4, 9, C.white); g.set(5, 9, C.white); g.set(4, 10, C.white);
  const red = C.berry;
  switch (kind) {
    case "heart":
      g.stamp(3, 3, ["XX XX", "XXXXX", " XXX ", "  X  "], { X: red });
      g.set(3, 3, mix(red, "#ffffff", 0.5));
      break;
    case "note": g.stamp(3, 2, ["  XXX", "  X X", "  X X", "XXX X", "XX   "], { X: "#5b7fbf" }); break;
    case "dots": for (const x of [3, 5, 7]) g.set(x, 5, C.inkSoft); break;
    case "alert": g.vline(5, 2, 5, red); g.vline(6, 2, 5, red); g.set(5, 7, red); g.set(6, 7, red); break;
    case "sleep": g.stamp(3, 2, ["XXXX", "  X ", " X  ", "XXXX"], { X: "#5b7fbf" }); g.set(8, 6, "#5b7fbf"); g.set(9, 6, "#5b7fbf"); break;
    case "sweat": g.set(7, 3, "#7cc6df"); g.rect(6, 4, 8, 6, "#7cc6df"); g.set(7, 7, "#7cc6df"); break;
    case "star": g.stamp(2, 2, ["   X   ", "  XXX  ", "XXXXXXX", " XXXXX ", " X   X "], { X: C.gold }); break;
    case "angry": g.stamp(3, 2, ["X   X", " X X ", "     ", " X X ", "X   X"], { X: red }); break;
    case "mail":
      g.rect(2, 2, 9, 7, C.paper);
      g.stamp(2, 2, ["XXXXXXXX", "XX    XX", "X X  X X", "X  XX  X", "X      X", "XXXXXXXX"], { X: C.woodDark });
      g.set(5, 5, red); g.set(6, 5, red);
      break;
  }
  g.outline(C.ink);
  return g;
}

/** Sparkle and petal particles */
export function sparkle(): PixelGrid {
  const g = new PixelGrid(5, 5);
  g.set(2, 0, "#ffffff"); g.set(2, 4, "#ffffff"); g.set(0, 2, "#ffffff"); g.set(4, 2, "#ffffff");
  g.set(2, 1, C.sun); g.set(1, 2, C.sun); g.set(3, 2, C.sun); g.set(2, 3, C.sun); g.set(2, 2, "#ffffff");
  return g;
}

export function petal(): PixelGrid {
  const g = new PixelGrid(3, 3);
  g.set(1, 0, C.white); g.set(0, 1, C.white); g.set(1, 1, "#f6d0dc"); g.set(2, 1, C.white); g.set(1, 2, C.white);
  return g;
}

export function butterfly(frame: number): PixelGrid {
  const g = new PixelGrid(7, 5);
  const w = frame ? 1 : 2;
  g.vline(3, 1, 3, C.ink);
  g.rect(3 - w - 1, 0, 2, 2, C.sun); g.rect(4, 0, 4 + w, 2, C.sun);
  g.set(3 - w - 1, 3, "#f08a3a"); g.set(4 + w, 3, "#f08a3a");
  return g;
}

export function firefly(): PixelGrid {
  const g = new PixelGrid(3, 3);
  g.set(1, 1, "#fff6a8"); g.set(0, 1, "#fff6a855"); g.set(2, 1, "#fff6a855"); g.set(1, 0, "#fff6a855"); g.set(1, 2, "#fff6a855");
  return g;
}
