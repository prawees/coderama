"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { audio } from "@/lib/audio";
import { ActiveCase } from "@/lib/erStore";
import { textureFrom, textureFromLayer } from "@/lib/pixel/texture";
import { drawCharacter, drawCat, drawPatientInBed, Dir, Look } from "@/lib/pixel/characters";
import * as T from "@/lib/pixel/tiles";
import { hashString, mix } from "@/lib/pixel/grid";
import { HAIR_COLORS } from "@/lib/pixel/palette";
import { getMap, solidGrid, findPath, MapId, Phase, themeForPhase, WorldMap, Interactable } from "@/lib/world/maps";
import { composeStatic, propGrid, propPixelPos, isWallProp, TILE } from "@/lib/world/render";

/* ------------------------------------------------------------------ */
/* Public types                                                         */
/* ------------------------------------------------------------------ */

export interface WorldNpc {
  id: string;
  name: string;
  look: Look;
  map: MapId;
  home: { x: number; y: number };
  spots: string[];
  /** tiles per second */
  speed?: number;
}

export type WorldTarget =
  | { type: "npc"; id: string }
  | { type: "cat" }
  | { type: "bed"; id: string; bedIndex: number }
  | { type: "prop"; id: string; kind: Interactable["kind"] };

export interface WorldApi {
  emote: (who: string, kind: T.Emote) => void;
  sparkle: (who: string) => void;
  hold: (who: string, seconds: number) => void;
}

interface ClinicWorldProps {
  mapId: MapId;
  phase: Phase;
  npcs: WorldNpc[];
  playerLook: Look;
  activeCases: ActiveCase[];
  /** Unread letters wait in the postbox; it shows an envelope bubble */
  mail?: boolean;
  clockMinutes: number;
  onShift: boolean;
  paused: boolean;
  fastForward?: boolean;
  spawn?: { x: number; y: number };
  language: "en" | "th";
  onInteract: (target: WorldTarget) => void;
  onDoor: (target: MapId, spawn: { x: number; y: number }) => void;
  describe: (target: WorldTarget) => string | null;
  onApi?: (api: WorldApi) => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const CAT_FUR = "#e8a25a";

/** Sky colour by time of day (minutes since 08:00: 0 dawn, 600 night), on or off shift */
function skyColor(minutes: number): string {
  const stops: [number, string][] = [[0, "#ffd9b8"], [90, "#a9dcf0"], [360, "#a9dcf0"], [450, "#ffc58a"], [540, "#e08a8a"], [600, "#2e3566"]];
  for (let i = 1; i < stops.length; i++) {
    if (minutes <= stops[i][0]) {
      const [m0, c0] = stops[i - 1];
      const [m1, c1] = stops[i];
      return mix(c0, c1, (minutes - m0) / (m1 - m0));
    }
  }
  return stops[stops.length - 1][1];
}

/** Multiply-tint for the whole scene: warm morning, neutral midday, golden afternoon, blue night */
function sceneTint(minutes: number, outdoor: boolean): { color: number; alpha: number } {
  const strength = outdoor ? 1 : 0.7;
  if (minutes < 90) return { color: 0xffd8b0, alpha: (0.28 - (minutes / 90) * 0.24) * strength };
  if (minutes < 380) return { color: 0xffffff, alpha: 0 };
  if (minutes < 520) return { color: 0xffb070, alpha: ((minutes - 380) / 140) * 0.32 * strength };
  if (minutes < 600) return { color: 0xb090d0, alpha: (0.32 + ((minutes - 520) / 80) * 0.1) * strength };
  return { color: 0x5c64a8, alpha: 0.52 * strength };
}

const hex = (c: string) => parseInt(c.slice(1, 7), 16);

/* ------------------------------------------------------------------ */
/* Actors                                                               */
/* ------------------------------------------------------------------ */

interface Actor {
  id: string;
  sprite: PIXI.Sprite;
  pos: { x: number; y: number }; // tile-centre coordinates
  dir: Dir;
  path: { x: number; y: number }[];
  animT: number;
  frame: number;
  wait: number;
  hold: number;
  textures: Record<Dir, PIXI.Texture[]>;
  speed: number;
  emote?: { sprite: PIXI.Sprite; t: number };
}

function charTextures(key: string, look: Look): Record<Dir, PIXI.Texture[]> {
  const out = {} as Record<Dir, PIXI.Texture[]>;
  for (const d of ["down", "up", "left", "right"] as Dir[]) {
    out[d] = [0, 1, 2].map((f) => textureFrom(`char:${key}:${d}:${f}`, () => drawCharacter(look, d, f)));
  }
  return out;
}

function catTextures(): Record<Dir, PIXI.Texture[]> {
  const right = [0, 1, 2, 3].map((f) => textureFrom(`cat:r:${f}`, () => drawCat(CAT_FUR, f)));
  const left = [0, 1, 2, 3].map((f) => textureFrom(`cat:l:${f}`, () => drawCat(CAT_FUR, f).mirrored()));
  return { right, left, down: right, up: left };
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function ClinicWorld(props: ClinicWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const [prompt, setPrompt] = useState<string | null>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);

  // Create the Pixi app once
  useEffect(() => {
    if (!containerRef.current) return;
    let alive = true;
    const app = new PIXI.Application();
    (async () => {
      await app.init({
        resizeTo: containerRef.current!,
        background: 0x2a2030,
        antialias: false,
        roundPixels: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });
      if (!alive) { app.destroy(true); return; }
      containerRef.current!.appendChild(app.canvas);
      app.canvas.style.imageRendering = "pixelated";
      const engine = createEngine(app, propsRef, setPrompt);
      engineRef.current = engine;
      engine.load(propsRef.current.mapId, propsRef.current.phase, propsRef.current.spawn);
      propsRef.current.onApi?.(engine.api);
    })();
    return () => {
      alive = false;
      engineRef.current?.dispose();
      engineRef.current = null;
      try { app.destroy(true, { children: true }); } catch { /* app may not have finished init */ }
    };
  }, []);

  // Rebuild the scene when the map or location changes
  useEffect(() => {
    engineRef.current?.load(props.mapId, props.phase, props.spawn);
  }, [props.mapId, props.phase]);

  // Patients and NPC roster updates
  useEffect(() => { engineRef.current?.refreshBeds(); }, [props.activeCases]);
  useEffect(() => { engineRef.current?.refreshMail(); }, [props.mail]);
  useEffect(() => { engineRef.current?.refreshNpcs(); }, [props.npcs]);
  useEffect(() => { engineRef.current?.refreshPlayer(); }, [props.playerLook]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const map: Record<string, Dir> = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
      if (map[k]) { engineRef.current?.press(map[k], true); e.preventDefault(); }
      if (k === " " || k === "enter" || k === "e") { engineRef.current?.interact(); e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const map: Record<string, Dir> = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
      if (map[k]) engineRef.current?.press(map[k], false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const press = useCallback((d: Dir, on: boolean) => engineRef.current?.press(d, on), []);
  const releaseAll = useCallback(() => engineRef.current?.releaseAll(), []);

  const padBtn = "w-11 h-11 flex items-center justify-center text-lg cozy-key active:translate-y-[2px]";

  return (
    <div className="relative w-full h-full overflow-hidden touch-none select-none" style={{ background: "#2a2030" }}>
      <div ref={containerRef} className="absolute inset-0 z-0" data-testid="world" />

      {/* D-pad (keyboard and tap-to-walk also work) */}
      <div className="absolute bottom-3 left-3 z-30 grid grid-cols-3 gap-1 opacity-90" onMouseLeave={releaseAll}>
        <div />
        <button aria-label="up" className={padBtn} onPointerDown={() => press("up", true)} onPointerUp={releaseAll} onPointerLeave={releaseAll}>▲</button>
        <div />
        <button aria-label="left" className={padBtn} onPointerDown={() => press("left", true)} onPointerUp={releaseAll} onPointerLeave={releaseAll}>◀</button>
        <div />
        <button aria-label="right" className={padBtn} onPointerDown={() => press("right", true)} onPointerUp={releaseAll} onPointerLeave={releaseAll}>▶</button>
        <div />
        <button aria-label="down" className={padBtn} onPointerDown={() => press("down", true)} onPointerUp={releaseAll} onPointerLeave={releaseAll}>▼</button>
        <div />
      </div>

      {/* Action button with a parchment prompt */}
      <div className="absolute bottom-3 right-3 z-30 flex flex-col items-end gap-2">
        {prompt && (
          <div className="cozy-tag px-2.5 py-1 text-sm leading-none whitespace-nowrap animate-[cozyBob_1.4s_ease-in-out_infinite] pointer-events-none" data-testid="world-prompt">
            {prompt}
          </div>
        )}
        <button
          aria-label="action"
          data-testid="action"
          className="w-16 h-16 cozy-action text-2xl active:translate-y-[2px]"
          onClick={() => engineRef.current?.interact()}
        >
          A
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Engine (plain TS, owns all Pixi objects)                             */
/* ------------------------------------------------------------------ */

function createEngine(
  app: PIXI.Application,
  propsRef: React.MutableRefObject<ClinicWorldProps>,
  setPrompt: (s: string | null) => void
) {
  let map: WorldMap;
  let solid: boolean[][] = [];
  let scale = 3;

  const root = new PIXI.Container(); // scaled world
  app.stage.addChild(root);
  let ground: PIXI.Sprite | null = null;
  const glassLayer = new PIXI.Container();
  const beamLayer = new PIXI.Container();
  const actors = new PIXI.Container();
  actors.sortableChildren = true;
  const fx = new PIXI.Container();
  const tint = new PIXI.Graphics();
  tint.blendMode = "multiply";
  root.addChild(glassLayer, beamLayer, actors, fx, tint);

  const keys: Partial<Record<Dir, boolean>> = {};
  let player: Actor;
  let cat: Actor | null = null;
  let catMode: "sleep" | "wander" | "sit" = "sleep";
  let catModeT = 0;
  const npcActors = new Map<string, Actor>();
  const bedSprites: { sprite: PIXI.Container; index: number; x: number; y: number }[] = [];
  let postboxSprite: PIXI.Container | null = null;
  const glassSprites: PIXI.Sprite[] = [];
  const particles: { s: PIXI.Sprite; vx: number; vy: number; life: number; sway?: number; t: number; kind: string }[] = [];
  let lastPrompt: string | null = null;
  let pendingInteract: WorldTarget | null = null;
  let doorCooldown = 0;
  let lastTintKey = "";
  let elapsed = 0;

  /* ---------- building ---------- */

  function makeActor(id: string, textures: Record<Dir, PIXI.Texture[]>, x: number, y: number, speed: number): Actor {
    const sprite = new PIXI.Sprite(textures.down[0]);
    sprite.anchor.set(0.5, 1);
    const a: Actor = { id, sprite, pos: { x, y }, dir: "down", path: [], animT: 0, frame: 0, wait: Math.random() * 2, hold: 0, textures, speed };
    place(a);
    actors.addChild(sprite);
    return a;
  }

  function place(a: Actor) {
    a.sprite.x = Math.round(a.pos.x * TILE);
    a.sprite.y = Math.round((a.pos.y + 0.5) * TILE);
    a.sprite.zIndex = a.sprite.y + 0.5;
    if (a.emote) { a.emote.sprite.x = a.sprite.x; a.emote.sprite.y = a.sprite.y - a.sprite.height - 2; a.emote.sprite.zIndex = 10000; }
  }

  function load(mapId: MapId, phase: Phase, spawn?: { x: number; y: number }) {
    const theme = themeForPhase(phase);
    map = getMap(mapId, theme);
    solid = solidGrid(map);

    // clear
    for (const layer of [glassLayer, beamLayer, actors, fx]) layer.removeChildren().forEach((c) => c.destroy());
    if (ground) { root.removeChild(ground); ground.destroy(); }
    npcActors.clear();
    bedSprites.length = 0;
    postboxSprite = null;
    glassSprites.length = 0;
    particles.length = 0;
    cat = null;

    // ground + flat + wall props as one texture
    const tex = textureFromLayer(`ground:${map.id}:${theme}`, map.width * TILE, map.height * TILE, (blit) => {
      const g = composeStatic({ ...map, props: map.props.filter((p) => p.kind !== "window") }, theme);
      blit(g, 0, 0);
    });
    ground = new PIXI.Sprite(tex);
    root.addChildAt(ground, 0);

    // windows: tinted glass under the frame
    for (const p of map.props.filter((q) => q.kind === "window")) {
      const glass = new PIXI.Sprite(textureFrom("glass", T.windowGlass));
      glass.x = p.x * TILE; glass.y = p.y * TILE;
      glassLayer.addChild(glass);
      glassSprites.push(glass);
      const frame = new PIXI.Sprite(textureFrom(`window:${theme}`, () => T.windowFrame(theme)));
      frame.x = p.x * TILE; frame.y = p.y * TILE;
      glassLayer.addChild(frame);
      const shine = new PIXI.Sprite(textureFrom("shine", T.windowShine));
      shine.x = p.x * TILE; shine.y = p.y * TILE;
      glassLayer.addChild(shine);
    }

    // sunbeams through the top windows (indoors)
    if (!map.outdoor) {
      for (const p of map.props.filter((q) => q.kind === "window")) {
        const beam = new PIXI.Graphics();
        const x0 = p.x * TILE + 3, x1 = p.x * TILE + 13, y0 = (p.y + 1) * TILE - 4;
        beam.poly([x0, y0, x1, y0, x1 + 22, y0 + 52, x0 + 22, y0 + 52]).fill({ color: 0xfff1c9, alpha: 0.13 });
        beam.blendMode = "add";
        beamLayer.addChild(beam);
      }
    }

    // standing props
    for (const p of map.props) {
      if (p.flat || isWallProp(p)) continue;
      if (p.kind === "bed") {
        const c = new PIXI.Container();
        const g = propGrid(p, theme);
        const pos = propPixelPos(p, g);
        const s = new PIXI.Sprite(textureFrom(`prop:bed:${theme}:${p.variant}`, () => g));
        c.addChild(s);
        c.x = pos.x; c.y = pos.y;
        c.zIndex = pos.y + g.h;
        actors.addChild(c);
        bedSprites.push({ sprite: c, index: Number(p.variant ?? 0), x: p.x, y: p.y });
        continue;
      }
      if (p.kind === "postbox") {
        const c = new PIXI.Container();
        const g = propGrid(p, theme);
        const pos = propPixelPos(p, g);
        c.addChild(new PIXI.Sprite(textureFrom("prop:postbox", () => g)));
        c.x = pos.x; c.y = pos.y;
        c.zIndex = pos.y + g.h;
        actors.addChild(c);
        postboxSprite = c;
        continue;
      }
      const g = propGrid(p, theme);
      const pos = propPixelPos(p, g);
      const s = new PIXI.Sprite(textureFrom(`prop:${p.kind}:${theme}:${p.variant ?? ""}`, () => g));
      s.x = pos.x; s.y = pos.y;
      s.zIndex = pos.y + g.h;
      actors.addChild(s);
    }

    // player
    const start = spawn ?? (map.id === "ER_MAIN" ? { x: 7, y: 5 } : { x: 7, y: 3 });
    player = makeActor("player", playerTextures(), start.x + 0.5, start.y + 0.5, 4.2);
    player.dir = map.id === "ER_MAIN" && spawn ? "up" : "down";

    // npcs and cat
    refreshNpcs();
    spawnCat();
    refreshBeds();
    refreshMail();

    // ambient particles
    if (map.outdoor) {
      for (let i = 0; i < 2; i++) spawnButterfly();
    } else {
      for (let i = 0; i < 10; i++) spawnMote(true);
    }

    lastTintKey = "";
    // a beat after walking through a door, so a held key doesn't carry you across the new room
    (Object.keys(keys) as Dir[]).forEach((k) => (keys[k] = false));
    doorCooldown = 0.45;
    layout();
  }

  function playerTextures() {
    const look = propsRef.current.playerLook;
    return charTextures(`player:${hashString(JSON.stringify(look))}`, look);
  }

  function refreshPlayer() {
    if (!player) return;
    player.textures = playerTextures();
    player.sprite.texture = player.textures[player.dir][0];
  }

  function refreshNpcs() {
    if (!map) return;
    const wanted = propsRef.current.npcs.filter((n) => n.map === map.id);
    for (const [id, a] of npcActors) {
      if (!wanted.some((n) => n.id === id)) { a.sprite.destroy(); a.emote?.sprite.destroy(); npcActors.delete(id); }
    }
    for (const n of wanted) {
      if (npcActors.has(n.id)) continue;
      const tex = charTextures(`npc:${n.id}`, n.look);
      const a = makeActor(n.id, tex, n.home.x + 0.5, n.home.y + 0.5, n.speed ?? 1.8);
      npcActors.set(n.id, a);
    }
  }

  function spawnCat() {
    const inside = map.id === "ER_MAIN";
    const bedProp = map.props.find((p) => p.kind === "catbed");
    const start = inside && bedProp ? { x: bedProp.x, y: bedProp.y } : { x: 4, y: 4 };
    cat = makeActor("cat", catTextures(), start.x + 0.5, start.y + 0.5, 1.4);
    catMode = inside ? "sleep" : "wander";
    catModeT = 6 + Math.random() * 6;
  }

  function refreshBeds() {
    if (!map) return;
    const theme = themeForPhase(propsRef.current.phase);
    const cases = propsRef.current.activeCases;
    for (const b of bedSprites) {
      while (b.sprite.children.length > 1) b.sprite.removeChildAt(1).destroy();
      const c = cases.find((x) => x.bedIndex === b.index);
      if (!c) continue;
      const hair = [HAIR_COLORS.black, HAIR_COLORS.brown, HAIR_COLORS.grey, HAIR_COLORS.black][hashString(c.id) % 4];
      const quilt = T.THEMES[theme].quilt[b.index % T.THEMES[theme].quilt.length];
      const skin = c.skinTone || "#e8b089";
      const pt = new PIXI.Sprite(textureFrom(`patient:${skin}:${hair}:${quilt}`, () => drawPatientInBed(skin, hair, quilt)));
      pt.y = 7;
      b.sprite.addChild(pt);
      const critical = Date.now() > c.expiresAt - 60_000;
      const bubble = new PIXI.Sprite(textureFrom(`emote:${critical ? "sweat" : "alert"}`, () => T.emoteBubble(critical ? "sweat" : "alert")));
      bubble.anchor.set(0.5, 1);
      bubble.x = 8; bubble.y = -1;
      (bubble as any).__bob = true;
      b.sprite.addChild(bubble);
    }
  }

  function refreshMail() {
    if (!postboxSprite) return;
    while (postboxSprite.children.length > 1) postboxSprite.removeChildAt(1).destroy();
    if (!propsRef.current.mail) return;
    const bubble = new PIXI.Sprite(textureFrom("emote:mail", () => T.emoteBubble("mail")));
    bubble.anchor.set(0.5, 1);
    bubble.x = 8; bubble.y = -1;
    (bubble as any).__bob = true;
    postboxSprite.addChild(bubble);
  }

  /* ---------- particles ---------- */

  function spawnMote(initial = false) {
    const beams = map.props.filter((q) => q.kind === "window");
    if (!beams.length) return;
    const w = beams[Math.floor(Math.random() * beams.length)];
    const s = new PIXI.Sprite(PIXI.Texture.WHITE);
    s.width = 1; s.height = 1; s.tint = 0xfff6d8; s.alpha = 0;
    s.x = w.x * TILE + 4 + Math.random() * 20;
    s.y = (w.y + 1) * TILE + (initial ? Math.random() * 40 : 0);
    fx.addChild(s);
    particles.push({ s, vx: 1.2 + Math.random(), vy: 2 + Math.random() * 2, life: 6 + Math.random() * 4, t: 0, kind: "mote" });
  }

  function spawnButterfly() {
    const s = new PIXI.Sprite(textureFrom("butterfly:0", () => T.butterfly(0)));
    s.anchor.set(0.5);
    s.x = (2 + Math.random() * (map.width - 4)) * TILE;
    s.y = (3 + Math.random() * 4) * TILE;
    s.zIndex = 9000;
    fx.addChild(s);
    particles.push({ s, vx: 0, vy: 0, life: Infinity, t: Math.random() * 10, kind: "butterfly" });
  }

  function spawnPetal() {
    const tree = map.props.find((p) => p.kind === "tree");
    if (!tree) return;
    const s = new PIXI.Sprite(textureFrom("petal", T.petal));
    s.x = tree.x * TILE + Math.random() * 32;
    s.y = (tree.y - 2) * TILE + Math.random() * 16;
    fx.addChild(s);
    particles.push({ s, vx: 3 + Math.random() * 3, vy: 6 + Math.random() * 4, life: 5, sway: Math.random() * 6, t: 0, kind: "petal" });
  }

  function spawnFirefly() {
    const s = new PIXI.Sprite(textureFrom("firefly", T.firefly));
    s.x = Math.random() * map.width * TILE;
    s.y = (2 + Math.random() * 6) * TILE;
    s.blendMode = "add";
    fx.addChild(s);
    particles.push({ s, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4, life: 6, t: 0, kind: "firefly" });
  }

  function burst(x: number, y: number, n = 8) {
    for (let i = 0; i < n; i++) {
      const s = new PIXI.Sprite(textureFrom("sparkle", T.sparkle));
      s.anchor.set(0.5);
      s.x = x; s.y = y;
      s.zIndex = 10001;
      fx.addChild(s);
      const a = (i / n) * Math.PI * 2;
      particles.push({ s, vx: Math.cos(a) * 28, vy: Math.sin(a) * 28 - 10, life: 0.7, t: 0, kind: "sparkle" });
    }
  }

  /* ---------- emotes ---------- */

  function actorById(who: string): Actor | null {
    if (who === "player") return player;
    if (who === "cat") return cat;
    return npcActors.get(who) ?? null;
  }

  function showEmote(who: string, kind: T.Emote) {
    const a = actorById(who);
    if (!a) return;
    a.emote?.sprite.destroy();
    const s = new PIXI.Sprite(textureFrom(`emote:${kind}`, () => T.emoteBubble(kind)));
    s.anchor.set(0.5, 1);
    actors.addChild(s);
    a.emote = { sprite: s, t: 0 };
    place(a);
  }

  /* ---------- movement ---------- */

  function blockedAt(x: number, y: number) {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (ty < 0 || tx < 0 || ty >= map.height || tx >= map.width) return true;
    return solid[ty][tx];
  }

  /** Soft bodies: nobody walks through anybody */
  function bumps(a: Actor, x: number, y: number) {
    for (const o of [player, cat, ...npcActors.values()]) {
      if (!o || o === a) continue;
      const r = o === cat || a === cat ? 0.5 : 0.62;
      const dNow = Math.hypot(o.pos.x - a.pos.x, o.pos.y - a.pos.y);
      const dNext = Math.hypot(o.pos.x - x, o.pos.y - y);
      if (dNext < r && dNext < dNow) return true; // allow stepping away when overlapping
    }
    return false;
  }

  function tryMove(a: Actor, dx: number, dy: number) {
    if (bumps(a, a.pos.x + dx, a.pos.y + dy)) {
      // try sliding along one axis
      if (dx && !bumps(a, a.pos.x + dx, a.pos.y)) dy = 0;
      else if (dy && !bumps(a, a.pos.x, a.pos.y + dy)) dx = 0;
      else return;
    }
    const r = 0.3;
    const nx = a.pos.x + dx;
    if (!blockedAt(nx + Math.sign(dx) * r, a.pos.y + 0.25) && !blockedAt(nx + Math.sign(dx) * r, a.pos.y - 0.1)) a.pos.x = nx;
    const ny = a.pos.y + dy;
    if (!blockedAt(a.pos.x - r + 0.05, ny + Math.sign(dy) * r + 0.1) && !blockedAt(a.pos.x + r - 0.05, ny + Math.sign(dy) * r + 0.1)) a.pos.y = ny;
  }

  function followPath(a: Actor, dt: number): boolean {
    const next = a.path[0];
    if (!next) return false;
    const tx = next.x + 0.5, ty = next.y + 0.5;
    const dx = tx - a.pos.x, dy = ty - a.pos.y;
    const dist = Math.hypot(dx, dy);
    const step = a.speed * dt;
    if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? "right" : "left";
    else if (dist > 0.01) a.dir = dy > 0 ? "down" : "up";
    if (dist <= step) { a.pos.x = tx; a.pos.y = ty; a.path.shift(); }
    else { a.pos.x += (dx / dist) * step; a.pos.y += (dy / dist) * step; }
    return true;
  }

  function animate(a: Actor, moving: boolean, dt: number, frames = 3) {
    if (moving) {
      a.animT += dt * (a.speed * 2.2);
      a.frame = Math.floor(a.animT) % 4; // 0 1 0 2
    } else {
      a.animT = 0;
      a.frame = 0;
    }
    const seq = [1, 0, 2, 0];
    const f = moving ? seq[a.frame] : 0;
    const tex = a.textures[a.dir][Math.min(f, frames - 1)];
    if (a.sprite.texture !== tex) a.sprite.texture = tex;
    // a tiny hop on step frames reads as a bouncy walk
    a.sprite.pivot.y = moving && f !== 0 ? 1 : 0;
  }

  function occupied(x: number, y: number, except?: Actor) {
    for (const a of [player, cat, ...npcActors.values()]) {
      if (!a || a === except) continue;
      if (Math.floor(a.pos.x) === x && Math.floor(a.pos.y) === y) return true;
    }
    return false;
  }

  function npcBrain(a: Actor, def: WorldNpc | undefined, dt: number) {
    if (a.hold > 0) { a.hold -= dt; animate(a, false, dt); return; }
    if (propsRef.current.paused) { animate(a, false, dt); return; }
    const ff = propsRef.current.fastForward ? 3 : 1;
    const nextTile = a.path[0];
    const waiting = nextTile && occupied(nextTile.x, nextTile.y, a);
    if (waiting) { a.wait += dt; if (a.wait > 1.2) { a.path = []; a.wait = 0.5; } }
    const moved = waiting ? false : followPath(a, dt * ff);
    if (!moved) {
      a.wait -= dt * ff;
      if (a.wait <= 0 && def) {
        a.wait = 2.5 + Math.random() * 4;
        const roll = Math.random();
        let target: { x: number; y: number } | null = null;
        if (roll < 0.35 && def.spots.length) {
          const s = map.spots[def.spots[Math.floor(Math.random() * def.spots.length)]];
          if (s) target = s;
        } else if (roll < 0.85) {
          for (let tries = 0; tries < 6 && !target; tries++) {
            const tx = def.home.x + Math.floor(Math.random() * 7) - 3;
            const ty = def.home.y + Math.floor(Math.random() * 5) - 2;
            if (solid[ty]?.[tx] === false) target = { x: tx, y: ty };
          }
        } else if (Math.random() < 0.6) {
          showEmote(a.id, (["note", "dots", "star"] as T.Emote[])[Math.floor(Math.random() * 3)]);
        }
        if (target) {
          const p = findPath(solid, { x: Math.floor(a.pos.x), y: Math.floor(a.pos.y) }, target, (x, y) => occupied(x, y, a));
          if (p) a.path = p.slice(0, 8);
        }
      }
    }
    animate(a, moved, dt * ff);
  }

  function catBrain(a: Actor, dt: number) {
    catModeT -= dt;
    if (catModeT <= 0) {
      const r = Math.random();
      catMode = r < 0.45 ? "wander" : r < 0.75 ? "sit" : "sleep";
      catModeT = 5 + Math.random() * 8;
      if (catMode === "sleep") {
        const bedProp = map.props.find((p) => p.kind === "catbed");
        if (bedProp) a.path = findPath(solid, { x: Math.floor(a.pos.x), y: Math.floor(a.pos.y) }, { x: bedProp.x, y: bedProp.y }) ?? [];
        if (Math.random() < 0.5) showEmote("cat", "sleep");
      }
    }
    if (a.hold > 0) a.hold -= dt;
    let moving = false;
    if (a.hold <= 0 && !propsRef.current.paused) {
      moving = followPath(a, dt);
      if (!moving && catMode === "wander") {
        a.wait -= dt;
        if (a.wait <= 0) {
          a.wait = 1.5 + Math.random() * 3;
          const tx = Math.floor(a.pos.x) + Math.floor(Math.random() * 7) - 3;
          const ty = Math.floor(a.pos.y) + Math.floor(Math.random() * 5) - 2;
          if (solid[ty]?.[tx] === false) a.path = (findPath(solid, { x: Math.floor(a.pos.x), y: Math.floor(a.pos.y) }, { x: tx, y: ty }) ?? []).slice(0, 6);
        }
      }
    }
    const facing: Dir = a.dir === "left" || a.dir === "up" ? "left" : "right";
    let f = 2;
    if (moving) { a.animT += dt * 5; f = Math.floor(a.animT) % 2; }
    else if (catMode === "sleep") f = 3;
    const tex = a.textures[facing][f];
    if (a.sprite.texture !== tex) a.sprite.texture = tex;
  }

  /* ---------- interaction ---------- */

  function frontTile() {
    const [dx, dy] = DIRS[player.dir];
    return { x: Math.floor(player.pos.x) + dx, y: Math.floor(player.pos.y) + dy };
  }

  function bedIndexFor(i: Interactable) {
    return parseInt(i.id.replace("bed_", "")) - 1;
  }

  function targetNearPlayer(): WorldTarget | null {
    const f = frontTile();
    const px = player.pos.x, py = player.pos.y;
    // NPCs and cat: in front, or very close
    let best: { t: WorldTarget; d: number } | null = null;
    for (const [id, a] of npcActors) {
      const dFront = Math.hypot(a.pos.x - (f.x + 0.5), a.pos.y - (f.y + 0.5));
      const d = Math.min(dFront, Math.hypot(a.pos.x - px, a.pos.y - py) * 1.2);
      if (d < 1.0 && (!best || d < best.d)) best = { t: { type: "npc", id }, d };
    }
    if (cat) {
      const dFront = Math.hypot(cat.pos.x - (f.x + 0.5), cat.pos.y - (f.y + 0.5));
      const d = Math.min(dFront, Math.hypot(cat.pos.x - px, cat.pos.y - py) * 1.2);
      if (d < 1.0 && (!best || d < best.d)) best = { t: { type: "cat" }, d };
    }
    if (best) return best.t;
    const asTarget = (i: Interactable): WorldTarget => (i.kind === "bed" ? { type: "bed", id: i.id, bedIndex: bedIndexFor(i) } : { type: "prop", id: i.id, kind: i.kind });
    const front = map.interactables.find((i) => i.x === f.x && i.y === f.y);
    if (front) return asTarget(front);
    // beds can be used from beside them too
    const near = map.interactables.find((i) => Math.hypot(i.x + 0.5 - px, i.y + 0.5 - py) < 1.05);
    return near ? asTarget(near) : null;
  }

  function faceToward(a: Actor, x: number, y: number) {
    const dx = x - a.pos.x, dy = y - a.pos.y;
    a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  function interact() {
    if (propsRef.current.paused) return;
    const t = targetNearPlayer();
    if (!t) { audio.playBump(); return; }
    fire(t);
  }

  function fire(t: WorldTarget) {
    if (t.type === "npc") {
      const a = npcActors.get(t.id);
      if (a) { a.path = []; a.hold = 5; faceToward(a, player.pos.x, player.pos.y); faceToward(player, a.pos.x, a.pos.y); animate(a, false, 0); }
    } else if (t.type === "cat" && cat) {
      cat.path = []; cat.hold = 4; faceToward(player, cat.pos.x, cat.pos.y);
    }
    propsRef.current.onInteract(t);
  }

  /** Tap to walk: walk to the tile, or next to the thing that was tapped and use it */
  function onTap(e: PIXI.FederatedPointerEvent) {
    if (propsRef.current.paused) return;
    const local = root.toLocal(e.global);
    const tx = Math.floor(local.x / TILE), ty = Math.floor(local.y / TILE);
    const from = { x: Math.floor(player.pos.x), y: Math.floor(player.pos.y) };

    // what is there?
    let target: WorldTarget | null = null;
    let goal: { x: number; y: number } | null = null;
    for (const [id, a] of npcActors) {
      if (Math.abs(a.pos.x - (local.x / TILE)) < 0.7 && Math.abs(a.pos.y - 0.2 - (local.y / TILE)) < 1.0) { target = { type: "npc", id }; goal = { x: Math.floor(a.pos.x), y: Math.floor(a.pos.y) }; }
    }
    if (!target && cat && Math.abs(cat.pos.x - local.x / TILE) < 0.7 && Math.abs(cat.pos.y - local.y / TILE) < 0.7) {
      target = { type: "cat" }; goal = { x: Math.floor(cat.pos.x), y: Math.floor(cat.pos.y) };
    }
    if (!target) {
      const it = map.interactables.find((i) => i.x === tx && i.y === ty) ?? (map.interactables.find((i) => i.kind === "bed" && i.x === tx && i.y === ty + 1));
      if (it) { target = it.kind === "bed" ? { type: "bed", id: it.id, bedIndex: bedIndexFor(it) } : { type: "prop", id: it.id, kind: it.kind }; goal = { x: it.x, y: it.y }; }
    }

    if (target && goal) {
      // already adjacent: use it now
      if (Math.abs(goal.x - from.x) + Math.abs(goal.y - from.y) <= 1) { faceToward(player, goal.x + 0.5, goal.y + 0.5); fire(target); return; }
      const options = [[0, 1], [0, -1], [-1, 0], [1, 0]]
        .map(([dx, dy]) => ({ x: goal!.x + dx, y: goal!.y + dy }))
        .filter((p) => solid[p.y]?.[p.x] === false)
        .map((p) => ({ p, path: findPath(solid, from, p) }))
        .filter((o) => o.path)
        .sort((a, b) => a.path!.length - b.path!.length);
      if (options[0]) { player.path = options[0].path!; pendingInteract = target; (player as any).__goal = goal; }
      return;
    }
    const p = findPath(solid, from, { x: tx, y: ty });
    if (p) { player.path = p; pendingInteract = null; }
  }

  /* ---------- per-frame ---------- */

  function layout() {
    const h = app.screen.height;
    // about eleven tiles tall: enough room to see the ward, close enough to read faces
    scale = Math.max(2, Math.min(4, Math.round(h / (11 * TILE))));
    root.scale.set(scale);
  }

  function updatePrompt() {
    const t = propsRef.current.paused ? null : targetNearPlayer();
    const text = t ? propsRef.current.describe(t) : null;
    if (text !== lastPrompt) { lastPrompt = text; setPrompt(text); }
  }

  function updateLighting() {
    const p = propsRef.current;
    const key = `${Math.floor(p.clockMinutes / 10)}:${map.id}`;
    if (key === lastTintKey) return;
    lastTintKey = key;
    const sky = hex(skyColor(p.clockMinutes));
    for (const g of glassSprites) g.tint = sky;
    const t = sceneTint(p.clockMinutes, map.outdoor);
    tint.clear();
    tint.rect(0, 0, map.width * TILE, map.height * TILE).fill({ color: t.color, alpha: t.alpha });
    // sunbeams only while the sun is up
    const beamsOn = p.clockMinutes < 450;
    beamLayer.visible = beamsOn;
  }

  const tick = (ticker: PIXI.Ticker) => {
    if (!map || !player) return;
    const dt = Math.min(ticker.deltaMS / 1000, 0.05);
    elapsed += dt;
    const p = propsRef.current;

    // player
    let moving = false;
    if (!p.paused && doorCooldown <= 0.05) {
      const dir: Dir | null = keys.up ? "up" : keys.down ? "down" : keys.left ? "left" : keys.right ? "right" : null;
      if (dir) {
        player.path = []; pendingInteract = null;
        player.dir = dir;
        const [dx, dy] = DIRS[dir];
        const before = { ...player.pos };
        tryMove(player, dx * player.speed * dt, dy * player.speed * dt);
        moving = before.x !== player.pos.x || before.y !== player.pos.y;
        if (!moving && Math.floor(elapsed * 4) !== Math.floor((elapsed - dt) * 4)) { /* pushing against a wall */ }
      } else if (player.path.length) {
        moving = followPath(player, dt);
        if (!player.path.length && pendingInteract) {
          const goal = (player as any).__goal as { x: number; y: number } | undefined;
          if (goal) faceToward(player, goal.x + 0.5, goal.y + 0.5);
          const t = pendingInteract; pendingInteract = null;
          fire(t);
        }
      }
    }
    animate(player, moving, dt);
    if (moving && player.frame !== (player as any).__lastStep && (player.frame === 1 || player.frame === 3)) audio.playFootstep();
    (player as any).__lastStep = player.frame;

    // doors
    doorCooldown -= dt;
    if (doorCooldown <= 0 && !p.paused) {
      const tx = Math.floor(player.pos.x), ty = Math.floor(player.pos.y);
      const door = map.doors.find((d) => d.x === tx && d.y === ty);
      if (door) { doorCooldown = 1; p.onDoor(door.target, door.spawn); }
    }

    // npcs and cat
    for (const [id, a] of npcActors) npcBrain(a, p.npcs.find((n) => n.id === id), dt);
    if (cat) catBrain(cat, dt);

    for (const a of [player, cat, ...npcActors.values()]) {
      if (!a) continue;
      place(a);
      if (a.emote) {
        a.emote.t += dt;
        const pop = Math.min(1, a.emote.t * 6);
        a.emote.sprite.scale.set(pop);
        a.emote.sprite.y -= Math.sin(Math.min(a.emote.t, 0.3) * 10) * 2;
        if (a.emote.t > 2.2) { a.emote.sprite.destroy(); a.emote = undefined; }
      }
    }

    // bed bubbles bob
    for (const b of bedSprites) for (const c of b.sprite.children) if ((c as any).__bob) c.y = -1 - Math.abs(Math.sin(elapsed * 3)) * 3;
    if (postboxSprite) for (const c of postboxSprite.children) if ((c as any).__bob) c.y = -1 - Math.abs(Math.sin(elapsed * 3)) * 3;

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t += dt;
      if (q.kind === "butterfly") {
        q.s.texture = textureFrom(`butterfly:${Math.floor(q.t * 8) % 2}`, () => T.butterfly(Math.floor(q.t * 8) % 2));
        q.s.x += Math.cos(q.t * 0.9) * 10 * dt + Math.sin(q.t * 3.1) * 6 * dt;
        q.s.y += Math.sin(q.t * 1.3) * 7 * dt;
        q.s.x = Math.max(8, Math.min(map.width * TILE - 8, q.s.x));
        q.s.y = Math.max(TILE * 2.5, Math.min(TILE * 7.5, q.s.y));
        continue;
      }
      q.s.x += (q.vx + (q.sway ? Math.sin(q.t * 3) * q.sway : 0)) * dt;
      q.s.y += q.vy * dt;
      if (q.kind === "mote") q.s.alpha = Math.min(0.8, q.t * 0.6, (q.life - q.t) * 0.6);
      if (q.kind === "firefly") q.s.alpha = 0.5 + Math.sin(q.t * 4) * 0.5;
      if (q.kind === "sparkle") { q.vy += 60 * dt; q.s.alpha = 1 - q.t / q.life; }
      if (q.t > q.life) {
        q.s.destroy();
        particles.splice(i, 1);
        if (q.kind === "mote" && beamLayer.visible) spawnMote();
      }
    }
    if (map.outdoor && Math.random() < dt * 0.8) spawnPetal();
    if (map.outdoor && p.clockMinutes > 520 && Math.random() < dt * 1.5) spawnFirefly();
    if (!map.outdoor && beamLayer.visible && particles.filter((q) => q.kind === "mote").length < 10) spawnMote();
    beamLayer.alpha = 0.85 + Math.sin(elapsed * 0.7) * 0.15;

    updateLighting();
    updatePrompt();

    // camera: follow the player, clamp to the map, whole pixels only
    const vw = app.screen.width / scale, vh = app.screen.height / scale;
    const mw = map.width * TILE, mh = map.height * TILE;
    let cx = player.pos.x * TILE - vw / 2;
    let cy = player.pos.y * TILE - vh / 2;
    cx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, cx));
    cy = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, cy));
    const curX = -root.x / scale, curY = -root.y / scale;
    const nx = curX + (cx - curX) * Math.min(1, dt * 8);
    const ny = curY + (cy - curY) * Math.min(1, dt * 8);
    root.x = -Math.round(nx * scale);
    root.y = -Math.round(ny * scale);
  };

  app.ticker.add(tick);
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointertap", onTap);
  const onResize = () => { layout(); app.stage.hitArea = app.screen; };
  app.renderer.on("resize", onResize);

  const api: WorldApi = {
    emote: showEmote,
    sparkle: (who) => { const a = actorById(who); if (a) burst(a.sprite.x, a.sprite.y - 14); },
    hold: (who, s) => { const a = actorById(who); if (a) { a.hold = s; a.path = []; } },
  };

  // Read-only hook for automated playtests: where everyone is on screen, in CSS pixels
  if (typeof window !== "undefined") {
    (window as any).__codeRamaWorld = {
      actors: () => [player, cat, ...npcActors.values()].filter(Boolean).map((a) => {
        const g = a!.sprite.getGlobalPosition();
        return { id: a!.id, x: g.x, y: g.y - 10 * scale, tile: { x: Math.floor(a!.pos.x), y: Math.floor(a!.pos.y) } };
      }),
      tileToScreen: (x: number, y: number) => ({ x: root.x + (x + 0.5) * TILE * scale, y: root.y + (y + 0.5) * TILE * scale }),
      map: () => map?.id,
    };
  }

  return {
    load,
    refreshBeds,
    refreshMail,
    refreshNpcs,
    refreshPlayer,
    interact,
    api,
    press: (d: Dir, on: boolean) => { keys[d] = on; if (on) { player.path = []; pendingInteract = null; } },
    releaseAll: () => { (Object.keys(keys) as Dir[]).forEach((k) => (keys[k] = false)); },
    dispose: () => { app.ticker.remove(tick); app.renderer.off("resize", onResize); },
  };
}
