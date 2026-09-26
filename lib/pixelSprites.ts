/**
 * CODE RAMA - Palette-swap pixel sprite renderer.
 *
 * Replaces the old "grayscale template × hex tint" system. Every layer is
 * painted with 4 ramp tokens (K outline, S shadow, M midtone, H highlight)
 * that resolve to a hand-picked Ramp from lib/palettes.ts. Skin shadows are
 * warm, highlights cool-yellow - sprites read as human, not as tinted gray.
 *
 * Frame: 24×32 art pixels. Sheet: 3 cols (step-L, idle, step-R) × 4 rows
 * (down, left, right, up). Rendered 1:1 to a canvas, then integer-scaled in
 * Pixi with nearest-neighbour so pixel size stays uniform with the tileset.
 */
import {
  Ramp, SKIN_RAMPS, HAIR_RAMPS, SCRUB_RAMPS, BOTTOM_RAMPS, SHOE_RAMPS, getRamp,
} from './palettes';

export const FRAME_W = 24;
export const FRAME_H = 32;
export const SHEET_COLS = 3;
export const SHEET_ROWS = 4;
export type Dir = 'down' | 'left' | 'right' | 'up';
export const DIR_ROW: Record<Dir, number> = { down: 0, left: 1, right: 2, up: 3 };

type Tok = 'K' | 'S' | 'M' | 'H';

class Painter {
  private ctx: CanvasRenderingContext2D;
  private ox = 0; private oy = 0;
  constructor(ctx: CanvasRenderingContext2D) { this.ctx = ctx; }
  origin(x: number, y: number) { this.ox = x; this.oy = y; }
  px(x: number, y: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.ox + x, this.oy + y, 1, 1);
  }
  rect(x: number, y: number, w: number, h: number, color: string) {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.ox + x, this.oy + y, w, h);
  }
  /** Filled rect with 1px outline, shadow on left+bottom, highlight on top-right. */
  shaded(x: number, y: number, w: number, h: number, r: Ramp, opts: { hl?: boolean; sh?: boolean } = {}) {
    this.rect(x, y, w, h, r.outline);
    this.rect(x + 1, y + 1, w - 2, h - 2, r.mid);
    if (opts.sh !== false) {
      this.rect(x + 1, y + h - 2, w - 2, 1, r.shadow);      // bottom shadow
      this.rect(x + 1, y + 1, 1, h - 2, r.shadow);          // left shadow
    }
    if (opts.hl !== false) {
      this.rect(x + 2, y + 1, w - 4, 1, r.highlight);       // top highlight
      this.rect(x + w - 2, y + 2, 1, Math.max(0, h - 5), r.highlight); // right highlight
    }
  }
}

// ─── Character anatomy (24×32) ──────────────────────────────────────────
// Head 12×12 at (6,3). Torso 12×10 at (6,15). Arms 2×8. Legs 4×6. Shoes 4×2.

export interface CharacterSpec {
  skin: Ramp;
  hair: Ramp;
  top: Ramp;
  bottom: Ramp;
  shoes: Ramp;
  hairStyle: 'short' | 'long' | 'bun' | 'messy' | 'bald';
  topStyle: 'scrubs' | 'coat' | 'coat_crumpled';
  accessory?: 'clipboard' | 'cap' | 'stethoscope' | 'none';
  posture?: 'upright' | 'hunched';
  faceMood?: 'neutral' | 'grumpy' | 'smile';
}

function paintBody(p: Painter, s: CharacterSpec, dir: Dir, step: -1 | 0 | 1) {
  const bob = step === 0 ? 0 : 1;
  const hunch = s.posture === 'hunched' ? 1 : 0;
  const skin = s.skin;
  const sideways = dir === 'left' || dir === 'right';

  // Legs (bottom ramp) + shoes
  const lUp = step === -1 ? 1 : 0;
  const rUp = step === 1 ? 1 : 0;
  if (sideways) {
    // Back leg (shadow), front leg (mid)
    p.rect(9, 25 - rUp, 5, 6, s.bottom.outline);
    p.rect(10, 26 - rUp, 3, 4, s.bottom.shadow);
    p.rect(9, 30 - rUp, 5, 2, s.shoes.outline); p.rect(10, 30 - rUp, 3, 1, s.shoes.shadow);
    p.rect(10, 25 - lUp, 5, 6, s.bottom.outline);
    p.rect(11, 26 - lUp, 3, 4, s.bottom.mid); p.rect(13, 26 - lUp, 1, 4, s.bottom.highlight);
    p.rect(10, 30 - lUp, 5, 2, s.shoes.outline); p.rect(11, 30 - lUp, 3, 1, s.shoes.mid);
  } else {
    p.shaded(7, 25 - lUp, 5, 6, s.bottom);
    p.shaded(12, 25 - rUp, 5, 6, s.bottom);
    p.rect(7, 30 - lUp, 5, 2, s.shoes.outline); p.rect(8, 30 - lUp, 3, 1, s.shoes.mid);
    p.rect(12, 30 - rUp, 5, 2, s.shoes.outline); p.rect(13, 30 - rUp, 3, 1, s.shoes.mid);
  }

  // Torso (top ramp)
  const ty = 15 + bob + hunch;
  if (sideways) {
    p.shaded(8, ty, 9, 10, s.top);
  } else {
    p.shaded(6, ty, 12, 10, s.top);
    if (s.topStyle !== 'scrubs') {
      // Lapels / coat opening
      p.rect(11, ty + 1, 2, 8, s.top.shadow);
      p.rect(11, ty + 1, 1, 8, s.top.highlight);
    } else {
      // V-neck
      p.px(11, ty + 1, skin.mid); p.px(12, ty + 1, skin.mid); p.px(11, ty + 2, s.top.shadow);
    }
    if (s.topStyle === 'coat_crumpled') {
      // Crease pixels: irregular shadow ticks
      p.px(7, ty + 4, s.top.shadow); p.px(8, ty + 6, s.top.shadow); p.px(15, ty + 3, s.top.shadow);
      p.px(16, ty + 7, s.top.shadow); p.px(9, ty + 8, s.top.shadow); p.px(14, ty + 5, s.top.shadow);
    }
  }

  // Arms (top ramp sleeves + skin hands)
  const swing = step; // arms opposite to legs
  if (sideways) {
    p.rect(11, ty + 2 + swing, 3, 7, s.top.outline);
    p.rect(12, ty + 3 + swing, 1, 5, s.top.mid);
    p.rect(12, ty + 8 + swing, 1, 1, skin.mid);
  } else {
    p.rect(4, ty + 1 - swing, 2, 8, s.top.outline); p.rect(4, ty + 2 - swing, 1, 6, s.top.mid);
    p.rect(4, ty + 8 - swing, 2, 1, skin.mid);
    p.rect(18, ty + 1 + swing, 2, 8, s.top.outline); p.rect(19, ty + 2 + swing, 1, 6, s.top.mid);
    p.rect(18, ty + 8 + swing, 2, 1, skin.mid);
  }

  // Neck
  p.rect(10, 14 + bob + hunch, 4, 2, skin.shadow);

  // Head
  const hy = 3 + bob + hunch;
  if (sideways) {
    p.rect(7, hy, 10, 12, skin.outline);
    p.rect(8, hy + 1, 8, 10, skin.mid);
    p.rect(8, hy + 1, 1, 10, skin.shadow); p.rect(8, hy + 10, 8, 1, skin.shadow);
    p.rect(9, hy + 1, 6, 1, skin.highlight);
    // Ear
    p.rect(9, hy + 5, 2, 3, skin.shadow); p.px(10, hy + 6, skin.mid);
    // Eye (facing left; sheet row 'right' is mirrored later)
    p.px(15, hy + 5, skin.outline); p.px(15, hy + 6, skin.outline);
    // Nose
    p.px(16, hy + 6, skin.shadow);
    if (dir === 'left') {
      if (s.faceMood === 'grumpy') p.px(15, hy + 8, skin.outline);
    }
  } else if (dir === 'down') {
    p.rect(6, hy, 12, 12, skin.outline);
    p.rect(7, hy + 1, 10, 10, skin.mid);
    p.rect(7, hy + 1, 1, 10, skin.shadow); p.rect(7, hy + 10, 10, 1, skin.shadow);
    p.rect(8, hy + 1, 8, 1, skin.highlight); p.px(16, hy + 2, skin.highlight);
    // Ears
    p.rect(6, hy + 5, 1, 3, skin.shadow); p.rect(17, hy + 5, 1, 3, skin.shadow);
    // Eyes
    p.rect(9, hy + 5, 2, 2, skin.outline); p.rect(13, hy + 5, 2, 2, skin.outline);
    p.px(9, hy + 5, '#f4f4f4'); p.px(13, hy + 5, '#f4f4f4');
    // Brows / mouth
    if (s.faceMood === 'grumpy') {
      p.px(8, hy + 4, skin.outline); p.px(9, hy + 3, skin.outline); p.px(10, hy + 4, skin.outline);
      p.px(13, hy + 4, skin.outline); p.px(14, hy + 3, skin.outline); p.px(15, hy + 4, skin.outline);
      p.rect(10, hy + 9, 4, 1, skin.outline); p.px(10, hy + 8, skin.outline); p.px(13, hy + 8, skin.outline);
      // Eye bags
      p.px(9, hy + 7, skin.shadow); p.px(10, hy + 7, skin.shadow); p.px(13, hy + 7, skin.shadow); p.px(14, hy + 7, skin.shadow);
    } else if (s.faceMood === 'smile') {
      p.rect(10, hy + 8, 4, 1, skin.outline); p.px(9, hy + 7, skin.outline); p.px(14, hy + 7, skin.outline);
    } else {
      p.rect(10, hy + 8, 3, 1, skin.shadow);
    }
    // Nose
    p.px(12, hy + 7, skin.shadow);
  } else {
    // up: back of head
    p.rect(6, hy, 12, 12, skin.outline);
    p.rect(7, hy + 1, 10, 10, skin.mid);
    p.rect(7, hy + 10, 10, 1, skin.shadow);
    p.rect(6, hy + 5, 1, 3, skin.shadow); p.rect(17, hy + 5, 1, 3, skin.shadow);
  }
}

function paintHair(p: Painter, s: CharacterSpec, dir: Dir, step: -1 | 0 | 1) {
  if (s.hairStyle === 'bald') return;
  const bob = step === 0 ? 0 : 1;
  const hunch = s.posture === 'hunched' ? 1 : 0;
  const hy = 3 + bob + hunch;
  const h = s.hair;
  const sideways = dir === 'left' || dir === 'right';
  const x0 = sideways ? 7 : 6, w = sideways ? 10 : 12;

  // Cap of hair
  p.rect(x0, hy - 1, w, 1, h.outline);
  p.rect(x0 - 1, hy, w + 2, 1, h.outline);
  p.rect(x0, hy, w, 1, h.mid);
  p.rect(x0 - 1, hy + 1, w + 2, 3, h.outline);
  p.rect(x0, hy + 1, w, 3, h.mid);
  p.rect(x0 + 2, hy, w - 4, 1, h.highlight);
  p.rect(x0, hy + 3, w, 1, h.shadow);

  if (dir === 'down') {
    // Fringe
    p.rect(x0 + 1, hy + 4, 3, 1, h.mid); p.rect(x0 + w - 4, hy + 4, 3, 1, h.mid);
    p.px(x0 + 1, hy + 5, h.shadow); p.px(x0 + w - 2, hy + 5, h.shadow);
  }
  if (dir === 'up') {
    p.rect(x0, hy + 4, w, 4, h.mid); p.rect(x0 - 1, hy + 4, 1, 4, h.outline); p.rect(x0 + w, hy + 4, 1, 4, h.outline);
    p.rect(x0, hy + 8, w, 1, h.outline);
  }
  if (sideways) {
    p.rect(x0 - 1, hy + 4, 3, 3, h.mid); p.rect(x0 - 2, hy + 4, 1, 3, h.outline); p.px(x0 - 1, hy + 7, h.outline);
  }

  switch (s.hairStyle) {
    case 'long':
      p.rect(x0 - 1, hy + 4, 2, 9, h.outline); p.rect(x0, hy + 4, 1, 8, h.shadow);
      p.rect(x0 + w - 1, hy + 4, 2, 9, h.outline); p.rect(x0 + w - 1, hy + 4, 1, 8, h.mid);
      break;
    case 'bun':
      p.rect(x0 + w / 2 - 2, hy - 3, 4, 3, h.outline); p.rect(x0 + w / 2 - 1, hy - 2, 2, 1, h.mid);
      break;
    case 'messy':
      // Stray tufts - salt-and-pepper: alternate highlight pixels
      p.px(x0 - 2, hy + 1, h.outline); p.px(x0 - 1, hy - 1, h.outline); p.px(x0 + w, hy - 2, h.outline);
      p.px(x0 + w + 1, hy + 2, h.outline); p.px(x0 + 3, hy - 2, h.outline); p.px(x0 + w - 3, hy - 2, h.outline);
      for (let i = 0; i < w; i += 2) p.px(x0 + i, hy + 1 + (i % 4 === 0 ? 0 : 1), h.highlight);
      p.px(x0 + 1, hy + 2, h.highlight); p.px(x0 + w - 2, hy + 2, h.highlight);
      break;
    default: break;
  }
}

function paintAccessory(p: Painter, s: CharacterSpec, dir: Dir, step: -1 | 0 | 1) {
  const bob = step === 0 ? 0 : 1;
  const hunch = s.posture === 'hunched' ? 1 : 0;
  const ty = 15 + bob + hunch;
  if (s.accessory === 'clipboard' && dir !== 'up') {
    const cx = dir === 'left' ? 12 : dir === 'right' ? 12 : 17;
    p.rect(cx, ty + 3, 5, 7, '#3d2210');
    p.rect(cx + 1, ty + 4, 3, 5, '#ffdbac');
    p.rect(cx + 1, ty + 3, 3, 1, '#c2c3c7');
    p.px(cx + 2, ty + 5, '#566c86'); p.px(cx + 2, ty + 7, '#566c86');
  }
  if (s.accessory === 'stethoscope' && dir === 'down') {
    p.rect(9, ty + 1, 1, 5, '#333c57'); p.rect(14, ty + 1, 1, 5, '#333c57');
    p.rect(9, ty + 6, 6, 1, '#333c57'); p.rect(14, ty + 6, 2, 2, '#c2c3c7'); p.px(14, ty + 6, '#f4f4f4');
  }
  if (s.accessory === 'cap') {
    const hy = 3 + bob + hunch;
    p.rect(6, hy - 2, 12, 2, '#f4f4f4'); p.rect(5, hy - 1, 14, 1, '#c2c3c7');
    p.rect(11, hy - 2, 2, 2, '#d95763');
  }
}

function paintFrame(ctx: CanvasRenderingContext2D, s: CharacterSpec, dir: Dir, step: -1 | 0 | 1, ox: number, oy: number) {
  const p = new Painter(ctx);
  p.origin(ox, oy);
  paintBody(p, s, dir, step);
  paintHair(p, s, dir, step);
  paintAccessory(p, s, dir, step);
}

/** Render a full 3×4 sheet for a character. Returns a canvas (nearest-neighbour ready). */
export function renderCharacterSheet(spec: CharacterSpec): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = FRAME_W * SHEET_COLS;
  c.height = FRAME_H * SHEET_ROWS;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const steps: (-1 | 0 | 1)[] = [-1, 0, 1];
  (['down', 'left', 'up'] as Dir[]).forEach((dir) => {
    steps.forEach((step, col) => paintFrame(ctx, spec, dir, step, col * FRAME_W, DIR_ROW[dir] * FRAME_H));
  });
  // Right row = mirrored left row (pixel-exact)
  const leftRow = ctx.getImageData(0, DIR_ROW.left * FRAME_H, c.width, FRAME_H);
  const right = ctx.createImageData(c.width, FRAME_H);
  for (let col = 0; col < SHEET_COLS; col++) {
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const src = ((y * c.width) + col * FRAME_W + x) * 4;
        const dst = ((y * c.width) + col * FRAME_W + (FRAME_W - 1 - x)) * 4;
        right.data[dst] = leftRow.data[src]; right.data[dst + 1] = leftRow.data[src + 1];
        right.data[dst + 2] = leftRow.data[src + 2]; right.data[dst + 3] = leftRow.data[src + 3];
      }
    }
  }
  ctx.putImageData(right, 0, DIR_ROW.right * FRAME_H);
  return c;
}

// ─── Presets ─────────────────────────────────────────────────────────────
export interface PlayerAppearanceV2 {
  skinRamp: string; hairRamp: string; topRamp: string; bottomRamp: string; shoeRamp: string;
  hairStyle: string; topStyle: string;
}

export function specFromAppearance(a: Partial<PlayerAppearanceV2>): CharacterSpec {
  const hs = (a.hairStyle || 'short').replace('hair_1', 'short').replace('hair_2', 'long') as CharacterSpec['hairStyle'];
  const ts = (a.topStyle || 'scrubs').replace('top_1', 'scrubs').replace('top_2', 'coat') as CharacterSpec['topStyle'];
  return {
    skin: getRamp(a.skinRamp, SKIN_RAMPS[1]),
    hair: getRamp(a.hairRamp, HAIR_RAMPS[0]),
    top: getRamp(a.topRamp, SCRUB_RAMPS[1]),
    bottom: getRamp(a.bottomRamp, BOTTOM_RAMPS[0]),
    shoes: getRamp(a.shoeRamp, SHOE_RAMPS[0]),
    hairStyle: (['short', 'long', 'bun', 'messy', 'bald'] as const).includes(hs as any) ? hs : 'short',
    topStyle: (['scrubs', 'coat', 'coat_crumpled'] as const).includes(ts as any) ? ts : 'scrubs',
    accessory: 'stethoscope',
    posture: 'upright',
    faceMood: 'neutral',
  };
}

/** Ajarn Grump: disheveled senior attending. Salt-and-pepper messy hair, crumpled coat, clipboard, hunched. */
export const GRUMP_SPEC: CharacterSpec = {
  skin: SKIN_RAMPS[2],
  hair: HAIR_RAMPS[4],           // silver ramp; 'messy' style scatters highlights → salt-and-pepper
  top: SCRUB_RAMPS[0],           // white coat
  bottom: BOTTOM_RAMPS[0],
  shoes: SHOE_RAMPS[2],
  hairStyle: 'messy',
  topStyle: 'coat_crumpled',
  accessory: 'clipboard',
  posture: 'hunched',
  faceMood: 'grumpy',
};

/** Nurse Ann: teal scrubs, neat bun, nurse cap, warm smile. */
export const ANN_SPEC: CharacterSpec = {
  skin: SKIN_RAMPS[1],
  hair: HAIR_RAMPS[0],
  top: SCRUB_RAMPS[1],
  bottom: BOTTOM_RAMPS[1],
  shoes: SHOE_RAMPS[1],
  hairStyle: 'bun',
  topStyle: 'scrubs',
  accessory: 'cap',
  posture: 'upright',
  faceMood: 'smile',
};

/** Bed-ridden patient torso+head (12×10) for the overworld beds. */
export function renderPatientChip(skin: Ramp, gown: Ramp): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d')!; const p = new Painter(ctx);
  p.shaded(3, 1, 10, 8, skin);
  p.rect(5, 4, 2, 2, skin.outline); p.rect(9, 4, 2, 2, skin.outline);
  p.rect(2, 9, 12, 6, gown.outline); p.rect(3, 10, 10, 4, gown.mid); p.rect(3, 13, 10, 1, gown.shadow);
  return c;
}
