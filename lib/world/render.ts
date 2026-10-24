import { PixelGrid } from "@/lib/pixel/grid";
import * as T from "@/lib/pixel/tiles";
import type { Theme } from "@/lib/pixel/tiles";
import type { Prop, WorldMap } from "./maps";

/** Pure (DOM-free) map rendering helpers shared by the game and the preview script. */
export const TILE = 16;

export function groundTile(map: WorldMap, theme: Theme, x: number, y: number): PixelGrid {
  const ch = map.ground[y]?.[x] ?? "g";
  switch (ch) {
    case "T": return T.wallTopTile(theme);
    case "B": return T.wallTopTile(theme);
    case "F": return T.wallFaceTile(theme, x);
    case ".": return T.floorTile(theme, x, y);
    case "w": return T.woodTile(theme, x, y);
    case "g": return T.grassTile(x, y);
    case "f": return T.grassTile(x, y, true);
    case "p": return T.pathTile(x, y);
    case "a": return T.asphaltTile(x, y);
    case "s": return T.asphaltTile(x, y, true);
    case "D": return map.outdoor ? doorInWall(theme) : T.woodTile(theme, x, y);
    default: return T.grassTile(x, y);
  }
}

function doorInWall(theme: Theme): PixelGrid {
  // open double door seen in the outside wall: dark interior with a warm glow
  const p = T.THEMES[theme];
  const g = T.wallFaceTile(theme, 0);
  g.rect(1, 1, 14, 15, "#6b4a3a");
  g.rect(2, 2, 13, 15, "#f6dca8");
  g.rect(2, 2, 13, 3, "#e9c58a");
  g.vline(1, 1, 15, p.trimDark); g.vline(14, 1, 15, p.trimDark);
  return g;
}

/** Sprite for a prop (window glass excluded; it is tinted separately at runtime) */
export function propGrid(p: Prop, theme: Theme): PixelGrid {
  const pal = T.THEMES[theme];
  switch (p.kind) {
    case "window": return T.windowFrame(theme);
    case "clock": return T.wallClock();
    case "painting": return T.painting(Number(p.variant ?? 0));
    case "notice": return T.noticeBoard();
    case "bed": return T.bed(theme, pal.quilt[Number(p.variant ?? 0) % pal.quilt.length]);
    case "desk": return T.deskComputer(String(p.variant ?? "#7fa7d9"));
    case "kettle": return T.kettleStation(theme);
    case "plant": return T.pottedPlant((p.variant as "monstera" | "orchid" | "palm" | "snake") ?? "monstera");
    case "bookshelf": return T.bookshelf();
    case "vending": return T.vendingMachine();
    case "chair": return T.waitingChair(String(p.variant ?? "#5fae5a"));
    case "rug": return T.rug(theme);
    case "catbed": return T.catBed();
    case "doormat": return T.doorMat();
    case "tree": return T.frangipaniTree();
    case "bench": return T.bench();
    case "flowerbed": return T.flowerBed(Number(p.variant ?? 0));
    case "pond": return T.pond();
    case "ambulance": return T.ambulance();
    case "lamp": return T.lampPost();
    case "fence": return T.fence();
    case "signpost": return T.signpost();
    case "postbox": return T.postbox();
  }
}

/** Pixel position of a prop sprite: bottom-aligned to its footprint, centred horizontally */
export function propPixelPos(p: Prop, g: PixelGrid): { x: number; y: number } {
  const fw = (p.w ?? 1) * TILE, fh = (p.h ?? 1) * TILE;
  return { x: p.x * TILE + Math.floor((fw - g.w) / 2), y: p.y * TILE + fh - g.h };
}

/** Wall-mounted props sit on the wall face instead of the floor */
export function isWallProp(p: Prop) {
  return p.kind === "window" || p.kind === "clock" || p.kind === "painting" || p.kind === "notice";
}

export function wallPropPos(p: Prop): { x: number; y: number } {
  return { x: p.x * TILE, y: p.y * TILE };
}

/** Static layer: ground plus flat and wall-mounted props (everything that never overlaps characters) */
export function composeStatic(map: WorldMap, theme: Theme): PixelGrid {
  const g = new PixelGrid(map.width * TILE, map.height * TILE);
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) g.blit(groundTile(map, theme, x, y), x * TILE, y * TILE);
  for (const p of map.props) {
    if (p.flat) { const s = propGrid(p, theme); const pos = propPixelPos(p, s); g.blit(s, pos.x, pos.y); }
    else if (isWallProp(p)) {
      if (p.kind === "window") g.blit(glassFor(map.outdoor), p.x * TILE, p.y * TILE);
      const s = propGrid(p, theme); const pos = wallPropPos(p); g.blit(s, pos.x, pos.y);
    }
  }
  return g;
}

function glassFor(outdoor: boolean): PixelGrid {
  // preview only: a pale sky. In game the glass sprite is tinted by time of day.
  const g = T.windowGlass().clone();
  g.recolor("#ffffff", outdoor ? "#cfe3ea" : "#bfe6ef");
  return g;
}

/** Full preview including standing props, sorted by their bottom edge */
export function composePreview(map: WorldMap, theme: Theme): PixelGrid {
  const g = composeStatic(map, theme);
  const standing = map.props.filter((p) => !p.flat && !isWallProp(p)).sort((a, b) => (a.y + (a.h ?? 1)) - (b.y + (b.h ?? 1)));
  for (const p of standing) { const s = propGrid(p, theme); const pos = propPixelPos(p, s); g.blit(s, pos.x, pos.y); }
  return g;
}
