import { PixelGrid } from "./grid";

/**
 * The Code Rama logo: a heart with a rhythm strip running through it, and the name in chunky
 * pixel capitals. Made of pixels like everything else in the game, so it stays crisp at any
 * whole-number scale. Run scripts/export-logo.ts after changing it.
 */
const INK = "#3a2a2f", BERRY = "#d95763", BERRY_DARK = "#a93c4b", PINK = "#f7a8a8", WHITE = "#fff6e3",
  SUN = "#ffd66b", SUN_DARK = "#e8a23c", SHADOW = "#2b1a24", LEAF = "#86c35f";

const LETTERS: Record<string, string[]> = {
  C: [".####.", "##..##", "##....", "##....", "##....", "##..##", ".####."],
  O: [".####.", "##..##", "##..##", "##..##", "##..##", "##..##", ".####."],
  D: ["#####.", "##..##", "##..##", "##..##", "##..##", "##..##", "#####."],
  E: ["######", "##....", "##....", "#####.", "##....", "##....", "######"],
  R: ["#####.", "##..##", "##..##", "#####.", "##.##.", "##..##", "##..##"],
  A: [".####.", "##..##", "##..##", "######", "##..##", "##..##", "##..##"],
  M: ["##...##", "###.###", "#######", "##.#.##", "##...##", "##...##", "##...##"],
};

const HEART = [
  "  kkkk   kkkk  ",
  " krrrrk krrrrk ",
  "krpprrrkrrrrrrk",
  "krprrrrrrrrrrRk",
  "krrrrrrrrrrrrRk",
  "krrrrrrrrrrrrRk",
  "krrrrrrrrrrrRRk",
  " krrrrrrrrrRRk ",
  "  krrrrrrrRRk  ",
  "   krrrrrRRk   ",
  "    krrrRRk    ",
  "     krRRk     ",
  "      kRk      ",
  "       k       ",
];

/** Rhythm strip across the heart: flat, the spike, flat */
const TRACE: [number, number][] = [[1, 6], [2, 6], [3, 6], [4, 6], [5, 5], [5, 4], [6, 3], [6, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 8], [9, 7], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6]];

export function logoMark(): PixelGrid {
  const g = new PixelGrid(15, 14);
  g.stamp(0, 0, HEART, { k: INK, r: BERRY, R: BERRY_DARK, p: PINK });
  for (const [x, y] of TRACE) g.set(x, y, WHITE);
  return g;
}

function word(text: string, top: string, bottom: string) {
  const w = text.split("").reduce((n, ch) => n + LETTERS[ch][0].length + 1, -1);
  const g = new PixelGrid(w, 7);
  let x = 0;
  for (const ch of text) {
    const rows = LETTERS[ch];
    rows.forEach((row, y) => {
      for (let i = 0; i < row.length; i++) if (row[i] === "#") g.set(x + i, y, y >= 5 ? bottom : top);
    });
    x += rows[0].length + 1;
  }
  return g;
}

/** Where the parts sit inside the full logo, in logo pixels, for animating them */
export function logoLayout() {
  const mark = logoMark();
  const code = word("CODE", SUN, SUN_DARK), rama = word("RAMA", BERRY, BERRY_DARK);
  const textX = mark.w + 3, textW = code.w + 4 + rama.w;
  return { markW: mark.w, markH: mark.h, textX, textW, base: 14, W: textX + textW + 2, H: 16 };
}

/** The full logo. Letters carry a dark outline and a drop edge, so it reads on any background. */
export function logoGrid(withMark = true): PixelGrid {
  const code = word("CODE", SUN, SUN_DARK);
  const rama = word("RAMA", BERRY, BERRY_DARK);
  const mark = logoMark();
  const gap = 4;
  const textX = mark.w + 3, textW = code.w + gap + rama.w;
  const W = textX + textW + 2, H = 16;
  const g = new PixelGrid(W, H);

  const letters = new PixelGrid(W, H);
  letters.blit(code, textX + 1, 2);
  letters.blit(rama, textX + 1 + code.w + gap, 2);
  // Outline, then a heavier edge underneath
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (letters.get(x, y)) continue;
    let near = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (letters.get(x + dx, y + dy)) near = true;
    if (near) g.set(x, y, INK);
    else if (letters.get(x, y - 2)) g.set(x, y, SHADOW);
  }
  g.blit(letters, 0, 0);

  // A green rhythm strip under the name, picking up where the heart leaves off
  const base = 14, blip = textX + textW - 10;
  for (let x = textX + 1; x <= textX + textW; x++) if (x < blip || x > blip + 3) g.set(x, base, LEAF);
  for (const [dx, dy] of [[0, -1], [1, -2], [1, -3], [2, -2], [2, -1], [2, 0], [2, 1], [3, 0]]) g.set(blip + dx, base + dy, LEAF);

  if (withMark) g.blit(mark, 0, 0);
  return g;
}
