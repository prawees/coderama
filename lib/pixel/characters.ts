import { PixelGrid, shade, cozyShadow, mix } from "./grid";
import { C } from "./palette";

/**
 * Procedural 16x24 characters with 4 directions and a 3-frame walk (stand, step, step).
 * Every NPC is a Look: skin, hair, outfit and accessories. The same Look always
 * produces the same sprite, so characters stay recognisable across days.
 */
export type Dir = "down" | "up" | "left" | "right";
export type HairStyle = "short" | "sidepart" | "spiky" | "curly" | "long" | "bob" | "bun" | "ponytail" | "receding" | "bald";
export type Outfit = "coat" | "nurse" | "scrubs" | "suit" | "casual" | "driver" | "blouse" | "gown";

export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  outfit: Outfit;
  main: string; // outfit main colour (scrubs, dress, jacket, shirt)
  accent: string; // inner shirt, tie, bow, cap band
  pants?: string;
  shoes?: string;
  glasses?: boolean;
  mustache?: boolean;
  beard?: boolean;
  cap?: "nurse" | "baseball" | null;
  stethoscope?: boolean;
  blush?: boolean;
  eyes?: string;
}

export const CHAR_W = 16;
export const CHAR_H = 24;

const EYE = "#2c2328";
const BLUSH = "#f2a0a0";

type Ctx = { g: PixelGrid; look: Look; dir: Dir; frame: number };

/* ---------------- body parts ---------------- */

function legs({ g, look, dir, frame }: Ctx) {
  const pants = look.pants ?? (look.outfit === "coat" ? "#4b4f63" : shade(look.main, 0.6));
  const shoes = look.shoes ?? "#4a3436";
  const pantsBack = shade(pants, 0.82);
  if (dir === "down" || dir === "up") {
    // frame 1 lifts the left foot, frame 2 the right one
    const lUp = frame === 1 ? 1 : 0;
    const rUp = frame === 2 ? 1 : 0;
    g.rect(5, 17, 7, 20 - lUp, pants);
    g.rect(8, 17, 10, 20 - rUp, dir === "down" ? pants : pantsBack);
    g.vline(7, 17, 20 - lUp, shade(pants, 0.9)); // inner seam
    g.rect(5, 21 - lUp, 7, 21 - lUp, shoes);
    g.rect(8, 21 - rUp, 10, 21 - rUp, shoes);
  } else {
    if (frame === 0) {
      g.rect(6, 17, 9, 20, pants);
      g.vline(6, 17, 20, pantsBack);
      g.rect(6, 21, 10, 21, shoes);
    } else {
      const front = frame === 1;
      // front leg forward, back leg behind
      g.rect(5, 17, 7, 20, front ? pantsBack : pants);
      g.rect(8, 17, 10, 20, front ? pants : pantsBack);
      g.rect(4, 21, 7, 21, shoes);
      g.rect(8, 21, 11, 21, shoes);
    }
  }
}

function torsoAndArms({ g, look, dir, frame }: Ctx) {
  const main = look.outfit === "coat" ? "#f7f2e8" : look.main;
  const mainShade = cozyShadow(main, 0.84);
  const shortSleeves = look.outfit === "casual" || look.outfit === "scrubs" || look.outfit === "gown" || look.outfit === "nurse";
  const sleeve = main;
  const hand = look.skin;

  if (dir === "down" || dir === "up") {
    g.rect(4, 11, 11, 16, main);
    g.vline(11, 12, 16, mainShade);
    g.hline(4, 11, 16, mainShade);
    // arms swing opposite to legs
    const lSwing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const rSwing = -lSwing;
    const arm = (x: number, swing: number) => {
      const top = 12 + swing;
      if (shortSleeves) {
        g.rect(x, top, x, top + 1, sleeve);
        g.rect(x, top + 2, x, top + 4, hand);
      } else {
        g.rect(x, top, x, top + 3, x === 12 ? mainShade : sleeve);
        g.set(x, top + 4, hand);
      }
    };
    arm(3, lSwing);
    arm(12, rSwing);
  } else {
    g.rect(5, 11, 10, 16, main);
    g.vline(5, 12, 16, mainShade);
    g.hline(5, 10, 16, mainShade);
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const ax = 7 + swing;
    if (shortSleeves) {
      g.rect(ax, 12, ax + 1, 13, shade(sleeve, 0.92));
      g.rect(ax, 14, ax + 1, 15, hand);
    } else {
      g.rect(ax, 12, ax + 1, 15, shade(sleeve, 0.92));
      g.rect(ax, 16, ax + 1, 16, hand);
    }
  }
}

function head({ g, look, dir }: Ctx) {
  const skin = look.skin;
  const skinShade = cozyShadow(skin, 0.86);
  if (dir === "down" || dir === "up") {
    g.rect(4, 3, 11, 10, skin);
    g.set(4, 3, null); g.set(11, 3, null); g.set(4, 10, null); g.set(11, 10, null);
    g.hline(5, 10, 10, skinShade); // jaw shadow
    if (dir === "down") {
      const eye = look.eyes ?? EYE;
      g.rect(6, 6, 6, 7, eye);
      g.rect(9, 6, 9, 7, eye);
      g.set(6, 6, mix(eye, "#ffffff", 0.35)); // tiny highlight
      g.set(9, 6, mix(eye, "#ffffff", 0.35));
      if (look.blush !== false) { g.set(5, 8, BLUSH); g.set(10, 8, BLUSH); }
    }
  } else {
    g.rect(5, 3, 11, 10, skin);
    g.set(5, 3, null); g.set(11, 3, null); g.set(5, 10, null); g.set(11, 10, null);
    g.hline(6, 10, 10, skinShade);
    g.set(12, 7, skin); // nose
    const eye = look.eyes ?? EYE;
    g.rect(10, 6, 10, 7, eye);
    g.set(10, 6, mix(eye, "#ffffff", 0.35));
    if (look.blush !== false) g.set(10, 8, BLUSH);
  }
}

/* ---------------- outfits ---------------- */

function outfitDetails({ g, look, dir }: Ctx) {
  const white = "#f7f2e8";
  const whiteShade = "#ddd3c2";
  const side = dir === "left" || dir === "right";
  switch (look.outfit) {
    case "coat": {
      if (dir === "down") {
        g.rect(7, 11, 8, 15, look.accent); // shirt or scrubs under the coat
        g.set(6, 11, whiteShade); g.set(9, 11, whiteShade);
        g.set(6, 12, whiteShade); g.set(9, 12, whiteShade);
        g.set(5, 14, whiteShade); g.set(10, 14, whiteShade); // pockets
        g.rect(4, 17, 6, 18, white); g.rect(9, 17, 11, 18, white); // coat tails, open in front
        g.hline(4, 6, 18, whiteShade); g.hline(9, 11, 18, whiteShade);
      } else if (dir === "up") {
        g.rect(4, 17, 11, 18, white);
        g.vline(7, 13, 18, whiteShade);
        g.hline(4, 11, 18, whiteShade);
      } else {
        g.rect(10, 11, 10, 14, look.accent);
        g.rect(5, 17, 10, 18, white);
        g.hline(5, 10, 18, whiteShade);
      }
      if (look.stethoscope !== false && dir !== "up") {
        const m = C.metalShade;
        if (dir === "down") { g.set(5, 11, m); g.set(5, 12, m); g.set(10, 11, m); g.set(10, 12, m); g.set(6, 13, m); g.set(6, 14, C.metal); }
        else { g.set(9, 11, m); g.set(9, 12, m); g.set(9, 13, C.metal); }
      }
      break;
    }
    case "nurse": {
      const skirt = look.main;
      if (!side) {
        g.rect(4, 17, 11, 18, skirt);
        g.hline(4, 11, 18, cozyShadow(skirt, 0.85));
        g.rect(5, 19, 10, 20, "#f1ece4"); // white stockings
        if (dir === "down") {
          g.rect(6, 13, 9, 18, white); // apron
          g.hline(6, 9, 18, whiteShade);
          g.set(7, 11, white); g.set(8, 11, white); // collar
        }
      } else {
        g.rect(5, 17, 10, 18, skirt);
        g.rect(6, 19, 9, 20, "#f1ece4");
        g.rect(8, 13, 10, 18, white);
      }
      break;
    }
    case "scrubs": {
      if (dir === "down") {
        g.set(7, 11, look.skin); g.set(8, 11, look.skin); g.set(7, 12, shade(look.main, 0.8)); g.set(8, 12, shade(look.main, 0.8));
        g.set(5, 13, shade(look.main, 0.85)); g.set(6, 13, shade(look.main, 0.85)); // chest pocket
        g.set(6, 12, look.accent); // pen
      } else if (side) {
        g.set(10, 11, look.skin);
      }
      break;
    }
    case "suit": {
      if (dir === "down") {
        g.rect(7, 11, 8, 12, "#f4f0e8");
        g.rect(7, 12, 8, 15, look.accent);
        g.set(7, 15, null); g.set(7, 15, look.accent);
        g.set(6, 11, shade(look.main, 1.25)); g.set(9, 11, shade(look.main, 1.25));
      } else if (side) {
        g.set(10, 11, "#f4f0e8"); g.rect(10, 12, 10, 14, look.accent);
      }
      break;
    }
    case "casual": {
      if (dir === "down") { g.set(7, 11, shade(look.main, 0.8)); g.set(8, 11, shade(look.main, 0.8)); g.rect(5, 13, 5, 13, look.accent); }
      break;
    }
    case "driver": {
      // vest over a shirt
      if (dir === "down") {
        g.rect(4, 12, 5, 16, look.accent); g.rect(10, 12, 11, 16, look.accent);
        g.set(7, 11, shade(look.main, 0.8)); g.set(8, 11, shade(look.main, 0.8));
      } else if (dir === "up") {
        g.rect(4, 12, 11, 16, look.accent);
      } else {
        g.rect(5, 12, 7, 16, look.accent);
      }
      break;
    }
    case "blouse": {
      const skirt = look.pants ?? "#4a4458";
      if (!side) {
        g.rect(5, 17, 10, 19, skirt);
        g.rect(5, 20, 7, 20, look.skin); g.rect(8, 20, 10, 20, look.skin);
        if (dir === "down") { g.set(7, 11, look.accent); g.set(8, 11, look.accent); g.set(6, 12, look.accent); g.set(9, 12, look.accent); }
      } else {
        g.rect(6, 17, 9, 19, skirt);
        g.rect(6, 20, 9, 20, look.skin);
        g.set(10, 11, look.accent);
      }
      break;
    }
    case "gown": {
      // hospital gown with little dots
      g.rect(4, 17, 11, 18, look.main);
      for (const [x, y] of [[5, 12], [9, 14], [6, 16], [10, 17]] as const) g.set(x, y, look.accent);
      break;
    }
  }
}

/* ---------------- hair & headwear ---------------- */

function hairDown(g: PixelGrid, look: Look) {
  const h = look.hair;
  const base = () => { g.hline(5, 10, 2, h); g.hline(4, 11, 3, h); g.hline(4, 11, 4, h); };
  switch (look.hairStyle) {
    case "short": base(); g.set(4, 5, h); g.set(11, 5, h); break;
    case "sidepart": base(); g.hline(4, 6, 5, h); g.set(11, 5, h); g.set(5, 1, h); g.set(6, 1, h); break;
    case "spiky": base(); g.set(5, 1, h); g.set(7, 1, h); g.set(8, 0, h); g.set(8, 1, h); g.set(10, 1, h); g.set(4, 5, h); g.set(11, 5, h); break;
    case "curly":
      g.hline(5, 10, 1, h); g.hline(4, 11, 2, h); g.rect(3, 3, 12, 4, h);
      g.set(3, 5, h); g.set(4, 5, h); g.set(11, 5, h); g.set(12, 5, h); g.set(3, 6, h); g.set(12, 6, h);
      g.set(5, 1, null); g.set(10, 1, null); g.set(3, 3, null); g.set(12, 3, null);
      break;
    case "long": base(); g.rect(3, 4, 4, 13, h); g.rect(11, 4, 12, 13, h); g.set(5, 5, h); g.set(10, 5, h); break;
    case "bob": base(); g.hline(4, 11, 5, h); g.rect(3, 4, 4, 9, h); g.rect(11, 4, 12, 9, h); g.set(6, 5, null); g.set(9, 5, null); break;
    case "bun": base(); g.rect(6, 0, 9, 1, h); g.set(4, 5, h); g.set(11, 5, h); break;
    case "ponytail": base(); g.set(4, 5, h); g.set(11, 5, h); g.rect(12, 5, 12, 8, h); break;
    case "receding": g.rect(4, 4, 4, 6, h); g.rect(11, 4, 11, 6, h); g.set(5, 3, h); g.set(10, 3, h); break;
    case "bald": break;
  }
}

function hairUp(g: PixelGrid, look: Look) {
  const h = look.hair;
  const back = (x0: number, y0: number, x1: number, y1: number) => g.rect(x0, y0, x1, y1, h);
  switch (look.hairStyle) {
    case "short": case "sidepart": back(4, 2, 11, 9); g.set(4, 2, null); g.set(11, 2, null); break;
    case "spiky": back(4, 2, 11, 9); g.set(5, 1, h); g.set(8, 0, h); g.set(8, 1, h); g.set(10, 1, h); break;
    case "curly": back(3, 2, 12, 9); g.hline(5, 10, 1, h); break;
    case "long": back(3, 2, 12, 14); g.set(3, 2, null); g.set(12, 2, null); break;
    case "bob": back(3, 2, 12, 10); g.set(3, 2, null); g.set(12, 2, null); break;
    case "bun": back(4, 2, 11, 9); back(6, 0, 9, 1); break;
    case "ponytail": back(4, 2, 11, 9); back(7, 10, 8, 14); g.set(7, 10, look.accent); g.set(8, 10, look.accent); break;
    case "receding": back(4, 5, 11, 9); break;
    case "bald": break;
  }
}

function hairSide(g: PixelGrid, look: Look) {
  const h = look.hair;
  const base = () => { g.hline(6, 10, 2, h); g.hline(5, 11, 3, h); g.hline(5, 11, 4, h); g.rect(5, 5, 6, 7, h); };
  switch (look.hairStyle) {
    case "short": base(); break;
    case "sidepart": base(); g.set(11, 5, h); g.set(7, 1, h); break;
    case "spiky": base(); g.set(6, 1, h); g.set(8, 0, h); g.set(8, 1, h); g.set(10, 1, h); break;
    case "curly": g.hline(6, 10, 1, h); g.rect(4, 2, 11, 4, h); g.rect(4, 5, 6, 8, h); break;
    case "long": base(); g.rect(4, 5, 7, 14, h); g.set(4, 4, h); break;
    case "bob": base(); g.rect(4, 5, 6, 9, h); g.set(11, 5, h); break;
    case "bun": base(); g.rect(4, 0, 7, 2, h); break;
    case "ponytail": base(); g.rect(3, 5, 4, 11, h); g.set(5, 5, look.accent); break;
    case "receding": g.rect(5, 4, 6, 7, h); break;
    case "bald": break;
  }
}

function headwear({ g, look, dir }: Ctx) {
  if (look.cap === "nurse") {
    if (dir === "left" || dir === "right") { g.hline(6, 10, 1, "#ffffff"); g.hline(6, 10, 2, look.accent); }
    else { g.hline(5, 10, 1, "#ffffff"); g.hline(5, 10, 2, "#ffffff"); g.set(7, 1, look.accent); g.set(8, 1, look.accent); }
  } else if (look.cap === "baseball") {
    const cap = look.accent;
    if (dir === "left" || dir === "right") { g.rect(5, 1, 10, 3, cap); g.hline(10, 13, 4, shade(cap, 0.75)); }
    else { g.rect(4, 1, 11, 3, cap); if (dir === "down") g.hline(4, 11, 4, shade(cap, 0.75)); }
  }
}

function faceExtras({ g, look, dir }: Ctx) {
  const frame = "#3b3138";
  if (dir === "down") {
    if (look.glasses) for (const [x, y] of [[5, 6], [7, 6], [8, 6], [10, 6], [5, 7], [7, 7], [8, 7], [10, 7]] as const) g.set(x, y, frame);
    if (look.mustache) g.hline(6, 9, 9, look.hair);
    if (look.beard) { g.hline(5, 10, 9, look.hair); g.hline(6, 9, 10, look.hair); g.set(4, 8, look.hair); g.set(11, 8, look.hair); }
  } else if (dir === "left" || dir === "right") {
    if (look.glasses) { g.set(9, 6, frame); g.set(11, 6, frame); g.set(9, 7, frame); g.set(11, 7, frame); g.set(8, 6, frame); }
    if (look.mustache) g.hline(10, 11, 9, look.hair);
    if (look.beard) { g.hline(7, 11, 9, look.hair); g.hline(8, 10, 10, look.hair); }
  }
}

/** Darken the hair where it meets the face, and the collar under the chin, for depth without hard lines */
function innerShading(g: PixelGrid, look: Look) {
  const hairShade = cozyShadow(look.hair, 0.78);
  for (let y = 0; y < CHAR_H - 1; y++) for (let x = 0; x < CHAR_W; x++) {
    if (g.get(x, y) === look.hair && g.get(x, y + 1) === look.skin) g.set(x, y, hairShade);
  }
}

/* ---------------- public API ---------------- */

export function drawCharacter(look: Look, dir: Dir, frame: number): PixelGrid {
  // Left is drawn as a mirrored right so both sides match exactly
  if (dir === "left") return drawCharacter(look, "right", frame).mirrored();
  const g = new PixelGrid(CHAR_W, CHAR_H);
  const ctx: Ctx = { g, look, dir, frame };

  // soft ground shadow
  g.hline(5, 10, 23, "#00000022");
  legs(ctx);
  torsoAndArms(ctx);
  outfitDetails(ctx);
  head(ctx);
  if (dir === "down") hairDown(g, look);
  else if (dir === "up") hairUp(g, look);
  else hairSide(g, look);
  headwear(ctx);
  faceExtras(ctx);
  innerShading(g, look);

  const out = g;
  const shadowRow = out.data.slice(23 * CHAR_W, 24 * CHAR_W);
  for (let x = 0; x < CHAR_W; x++) out.set(x, 23, null);
  out.outline(C.ink);
  shadowRow.forEach((c, x) => { if (c && !out.get(x, 23)) out.set(x, 23, c); });
  return out;
}

/** All frames for a look: dir -> [stand, stepA, stepB] */
export function characterFrames(look: Look): Record<Dir, PixelGrid[]> {
  const dirs: Dir[] = ["down", "up", "left", "right"];
  const out = {} as Record<Dir, PixelGrid[]>;
  for (const d of dirs) out[d] = [0, 1, 2].map((f) => drawCharacter(look, d, f));
  return out;
}

/* ---------------- the clinic cat ---------------- */

/** 16x16 cat. frame 0/1 = walk, 2 = sit, 3 = sleep (loaf). Faces right; mirror for left. */
export function drawCat(fur: string, frame: number): PixelGrid {
  const g = new PixelGrid(16, 16);
  const dark = cozyShadow(fur, 0.75);
  const belly = mix(fur, "#ffffff", 0.55);
  if (frame === 3) {
    // loaf: tucked paws, eyes closed
    g.rect(3, 9, 12, 13, fur);
    g.rect(9, 6, 13, 10, fur); // head
    g.set(9, 5, fur); g.set(13, 5, fur); // ears
    g.hline(10, 11, 8, dark); g.set(13, 8, dark); // closed eyes
    g.hline(3, 12, 13, dark);
    for (const x of [4, 6]) g.set(x, 9, dark);
    g.rect(1, 11, 3, 12, fur); // tail curled
  } else if (frame === 2) {
    // sitting
    g.rect(5, 8, 10, 14, fur);
    g.rect(7, 4, 12, 9, fur);
    g.set(7, 3, fur); g.set(12, 3, fur);
    g.set(9, 6, EYE); g.set(11, 6, EYE);
    g.set(10, 7, "#e48a9a");
    g.rect(6, 11, 8, 14, belly);
    g.rect(2, 12, 4, 14, fur); g.set(2, 11, fur);
    for (const y of [9, 11]) g.set(5, y, dark);
  } else {
    // walking, tail up
    g.rect(3, 8, 11, 11, fur);
    g.rect(10, 4, 14, 9, fur);
    g.set(10, 3, fur); g.set(14, 3, fur);
    g.set(12, 6, EYE); g.set(14, 6, EYE);
    g.set(15, 7, "#e48a9a");
    g.hline(4, 10, 11, belly);
    const step = frame === 1;
    g.rect(4, 12, 4, step ? 13 : 14, fur); g.rect(6, 12, 6, step ? 14 : 13, fur);
    g.rect(9, 12, 9, step ? 13 : 14, fur); g.rect(11, 12, 11, step ? 14 : 13, fur);
    g.rect(1, 4, 2, 8, fur); g.set(2, 3, fur); // tail
    for (const x of [5, 7, 9]) g.set(x, 8, dark); // stripes
  }
  g.outline(C.ink);
  return g;
}

/* ---------------- patients in bed ---------------- */

/** Head-and-shoulders peeking out of a quilt, drawn over a bed sprite. 16x12. */
export function drawPatientInBed(skin: string, hair: string, quilt: string): PixelGrid {
  const g = new PixelGrid(16, 12);
  g.rect(5, 0, 10, 5, skin);
  g.set(5, 0, null); g.set(10, 0, null);
  g.hline(5, 10, 0, hair); g.hline(4, 11, 1, hair); g.set(4, 2, hair); g.set(11, 2, hair);
  g.set(6, 3, EYE); g.set(9, 3, EYE);
  g.set(5, 4, BLUSH); g.set(10, 4, BLUSH);
  // quilt with a patchwork square pattern
  g.rect(1, 6, 14, 11, quilt);
  const alt = mix(quilt, "#ffffff", 0.35);
  for (let y = 6; y <= 11; y++) for (let x = 1; x <= 14; x++) if (((x >> 2) + (y >> 2)) % 2 === 0) g.set(x, y, alt);
  g.hline(1, 14, 6, mix(quilt, "#ffffff", 0.6)); // folded edge
  return g;
}
