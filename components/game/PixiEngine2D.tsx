"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { audio } from "@/lib/audio";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useERStore, ActiveCase } from "@/lib/erStore";
import { tNow } from "@/lib/i18n/useT";
import { ER_MAP, INTERACTABLES, NPC_ROUTES, blockedAt, distToRect, Interactable } from "@/lib/erMap";
import { SHEETS, SheetName, DIR_ROW, loadImage, recolor, RecolorSpec, specFromAppearance, GRUMP_SPEC, patientSpec } from "@/lib/spriteRecolor";

export interface Vector2 { x: number; y: number; }
type Direction = 'up' | 'down' | 'left' | 'right';

/** Kept for older imports (lib/maps.ts). The overworld now uses lib/erMap.ts. */
export interface MapData {
  width: number; height: number; walls: Vector2[];
  interactables: { x: number; y: number; id: string; type: 'bed' | 'door' | 'computer' | 'prop'; target?: string; variant?: string }[];
}

interface Engine2DProps {
  onInteract: (id: string, type: string) => void;
  activeCases: ActiveCase[];
  clockMinutes?: number;
  npcEmote?: string | null;
  isFastForwarding?: boolean;
  paused?: boolean;
}

const SPEED = 190;          // px per second
const TALK_RANGE = 70;
const USE_RANGE = 46;

interface Actor {
  sprite: PIXI.AnimatedSprite;
  anims: Record<Direction, PIXI.Texture[]>;
  idle: Record<Direction, PIXI.Texture>;
  dir: Direction;
  shadow: PIXI.Graphics;
  tag?: PIXI.Container;
  route?: { x: number; y: number }[];
  routeIdx?: number;
  wait?: number;
}

function cssFont(): string {
  if (typeof window === 'undefined') return 'monospace';
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-pixel-body').trim();
  const thai = getComputedStyle(document.documentElement).getPropertyValue('--font-thai').trim();
  return [v, thai, 'monospace'].filter(Boolean).join(', ');
}

async function sheetTextures(name: SheetName, spec?: RecolorSpec) {
  const s = SHEETS[name];
  const img = await loadImage(s.src);
  const base = PIXI.Texture.from(spec ? recolor(img, spec) : img);
  base.source.scaleMode = 'nearest';
  const frame = (col: number, row: number) => new PIXI.Texture({ source: base.source, frame: new PIXI.Rectangle(col * s.frameW, row * s.frameH, s.frameW, s.frameH) });
  const dirs: Direction[] = ['down', 'left', 'right', 'up'];
  const anims = {} as Record<Direction, PIXI.Texture[]>;
  const idle = {} as Record<Direction, PIXI.Texture>;
  for (const d of dirs) {
    anims[d] = s.walk[d].map((c) => frame(c, DIR_ROW[d]));
    idle[d] = frame(s.idle, DIR_ROW[d]);
  }
  return { anims, idle };
}

function makeTag(text: string, color: number, font: string): PIXI.Container {
  const c = new PIXI.Container();
  const label = new PIXI.Text({ text, style: { fontFamily: font, fontSize: 18, fill: 0xffffff } });
  label.anchor.set(0.5);
  const w = Math.ceil(label.width) + 12, h = 20;
  const bg = new PIXI.Graphics();
  bg.rect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4).fill({ color: 0x0b1626 });
  bg.rect(-w / 2, -h / 2, w, h).fill({ color });
  c.addChild(bg, label);
  return c;
}

function makeActor(tex: { anims: Record<Direction, PIXI.Texture[]>; idle: Record<Direction, PIXI.Texture> }, x: number, y: number): Actor {
  const sprite = new PIXI.AnimatedSprite(tex.anims.down);
  sprite.anchor.set(0.5, 1);
  sprite.animationSpeed = 0.14;
  sprite.x = x; sprite.y = y;
  sprite.texture = tex.idle.down;
  const shadow = new PIXI.Graphics().ellipse(0, 0, 18, 6).fill({ color: 0x0b1626, alpha: 0.28 });
  shadow.x = x; shadow.y = y - 2;
  return { sprite, anims: tex.anims, idle: tex.idle, dir: 'down', shadow };
}

function setWalking(a: Actor, dir: Direction | null) {
  if (dir) {
    if (a.dir !== dir || !a.sprite.playing) { a.dir = dir; a.sprite.textures = a.anims[dir]; a.sprite.play(); }
  } else if (a.sprite.playing || a.sprite.texture !== a.idle[a.dir]) {
    a.sprite.stop(); a.sprite.texture = a.idle[a.dir];
  }
}

export function PixiEngine2D({ onInteract, activeCases, clockMinutes = 120, npcEmote, isFastForwarding = false, paused = false }: Engine2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const bedLayerRef = useRef<PIXI.Container | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef<Actor | null>(null);
  const npcs = useRef<Record<string, Actor>>({});
  const targetRef = useRef<{ id: string; type: string; rect?: Interactable['rect'] } | null>(null);
  const casesRef = useRef(activeCases);
  const pausedRef = useRef(paused);
  const ffRef = useRef(isFastForwarding);
  const [prompt, setPrompt] = useState<string | null>(null);
  const promptRef = useRef<string | null>(null);
  const appearance = useERStore((s) => s.appearance);

  const clockMinutesRef = useRef(clockMinutes);
  clockMinutesRef.current = clockMinutes;
  casesRef.current = activeCases;
  pausedRef.current = paused;
  ffRef.current = isFastForwarding;

  const interact = useCallback(() => {
    const t = targetRef.current;
    if (!t || pausedRef.current) return;
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    onInteract(t.id, t.type);
  }, [onInteract]);

  // Occupied beds: patient head on the pillow, blanket, and a status bubble.
  const drawBeds = useCallback(async () => {
    const layer = bedLayerRef.current;
    if (!layer) return;
    layer.removeChildren();
    const blanketImg = await loadImage('/assets/props/blanket_blue.png');
    const docImg = await loadImage(SHEETS.doctor.src);
    for (const bed of INTERACTABLES.filter((i) => i.type === 'bed')) {
      const c = casesRef.current.find((x) => x.bedIndex === bed.bedIndex);
      if (!c) continue;
      const g = new PIXI.Container();
      g.x = bed.rect.x; g.y = bed.rect.y;
      // Head: front idle frame of the base character, recoloured per patient, cropped at the shoulders.
      const s = SHEETS.doctor;
      const head = recolor(docImg, patientSpec(c.id));
      const crop = document.createElement('canvas'); crop.width = s.frameW; crop.height = 44;
      const cx = crop.getContext('2d')!; cx.imageSmoothingEnabled = false;
      cx.drawImage(head, s.idle * s.frameW, 6, s.frameW, 44, 0, 0, s.frameW, 44);
      const headTex = PIXI.Texture.from(crop); headTex.source.scaleMode = 'nearest';
      const headSpr = new PIXI.Sprite(headTex);
      headSpr.anchor.set(0.5, 0); headSpr.x = bed.rect.w / 2; headSpr.y = 4;
      const blanketTex = PIXI.Texture.from(blanketImg); blanketTex.source.scaleMode = 'nearest';
      const blanket = new PIXI.Sprite(blanketTex);
      blanket.width = bed.rect.w - 14; blanket.height = 104; blanket.x = 7; blanket.y = 44;
      g.addChild(headSpr, blanket);
      // Status bubble
      const critical = Date.now() > c.expiresAt - 60000;
      const bubble = new PIXI.Graphics();
      const col = critical ? 0xd95763 : 0xffd866;
      bubble.rect(-14, -16, 28, 26).fill({ color: 0x0b1626 });
      bubble.rect(-12, -14, 24, 22).fill({ color: col });
      bubble.rect(-4, 10, 8, 6).fill({ color: 0x0b1626 }); bubble.rect(-2, 8, 4, 5).fill({ color: col });
      const mark = new PIXI.Text({ text: critical ? '!!' : '!', style: { fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', fill: 0x0b1626 } });
      mark.anchor.set(0.5); mark.y = -3;
      const b = new PIXI.Container(); b.addChild(bubble, mark); b.x = bed.rect.w / 2; b.y = -30;
      (b as any).__bob = true;
      g.addChild(b);
      layer.addChild(g);
    }
  }, []);

  useEffect(() => { drawBeds(); }, [activeCases, drawBeds]);

  useEffect(() => {
    if (!containerRef.current) return;
    let alive = true;
    const app = new PIXI.Application();
    (async () => {
      await app.init({ resizeTo: containerRef.current!, background: 0x1b2d4f, antialias: false, resolution: window.devicePixelRatio || 1, autoDensity: true });
      if (!alive) { app.destroy(true); return; }
      appRef.current = app;
      containerRef.current!.appendChild(app.canvas);
      app.canvas.style.imageRendering = 'pixelated';
      const font = cssFont();

      const world = new PIXI.Container();
      app.stage.addChild(world);

      const mapTex = PIXI.Texture.from(await loadImage(ER_MAP.src));
      mapTex.source.scaleMode = 'nearest';
      world.addChild(new PIXI.Sprite(mapTex));

      const bedLayer = new PIXI.Container();
      world.addChild(bedLayer);
      bedLayerRef.current = bedLayer;
      drawBeds();

      const highlight = new PIXI.Graphics();
      world.addChild(highlight);

      const actors = new PIXI.Container();
      actors.sortableChildren = true;
      world.addChild(actors);

      const [pTex, annTex, grumpTex] = await Promise.all([
        sheetTextures('doctor', specFromAppearance(appearance as any)),
        sheetTextures('nurse'),
        sheetTextures('doctor', GRUMP_SPEC),
      ]);
      if (!alive) return;

      const p = makeActor(pTex, ER_MAP.spawn.x, ER_MAP.spawn.y);
      player.current = p;
      // Dev-only hook for automated playtests (position, held keys, pause state).
      if (process.env.NODE_ENV !== 'production') (window as any).__er = { player: p, keys, paused: pausedRef, npcs };
      const ann = makeActor(annTex, NPC_ROUTES.nurse_ann[0].x, NPC_ROUTES.nurse_ann[0].y);
      ann.route = NPC_ROUTES.nurse_ann; ann.routeIdx = 0; ann.wait = 1;
      ann.tag = makeTag(npcEmote ? `${tNow('npc.ann')} ${npcEmote}` : tNow('npc.ann'), 0x257179, font);
      const grump = makeActor(grumpTex, NPC_ROUTES.grump_npc[0].x, NPC_ROUTES.grump_npc[0].y);
      grump.route = NPC_ROUTES.grump_npc; grump.routeIdx = 0; grump.wait = 2;
      grump.tag = makeTag(tNow('npc.grump'), 0xac3232, font);
      npcs.current = { nurse_ann: ann, grump_npc: grump };
      for (const a of [p, ann, grump]) { actors.addChild(a.shadow, a.sprite); if (a.tag) actors.addChild(a.tag); }

      // Evening light
      const dusk = new PIXI.Graphics().rect(0, 0, ER_MAP.width, ER_MAP.height).fill({ color: 0x29366f });
      dusk.alpha = 0; world.addChild(dusk);

      let t = 0;
      app.ticker.add((tk) => {
        const dt = Math.min(0.05, tk.deltaMS / 1000);
        t += dt;
        const k = keys.current;
        let dx = 0, dy = 0;
        if (!pausedRef.current) {
          if (k.ArrowLeft || k.a || k.A || k.left) dx -= 1;
          if (k.ArrowRight || k.d || k.D || k.right) dx += 1;
          if (k.ArrowUp || k.w || k.W || k.up) dy -= 1;
          if (k.ArrowDown || k.s || k.S || k.down) dy += 1;
        }
        const s = p.sprite;
        if (dx || dy) {
          const len = Math.hypot(dx, dy); const step = SPEED * dt;
          const nx = s.x + (dx / len) * step, ny = s.y + (dy / len) * step;
          if (!blockedAt(nx, s.y)) s.x = nx;
          if (!blockedAt(s.x, ny)) s.y = ny;
          setWalking(p, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
          if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) audio.playFootstep();
          // Walk bobbing and shadow scaling
          s.pivot.y = Math.floor(Math.abs(Math.sin(t * 18)) * 3);
          p.shadow.scale.set(1 - (s.pivot.y * 0.05));
        } else {
          setWalking(p, null);
          s.pivot.y = 0;
          p.shadow.scale.set(1);
        }

        // NPC patrol
        for (const a of Object.values(npcs.current)) {
          if (!a.route) continue;
          if ((a.wait || 0) > 0) { a.wait! -= dt * (ffRef.current ? 6 : 1); setWalking(a, null); }
          else {
            const tgt = a.route[a.routeIdx!];
            const ddx = tgt.x - a.sprite.x, ddy = tgt.y - a.sprite.y, dist = Math.hypot(ddx, ddy);
            if (dist < 4) { a.routeIdx = (a.routeIdx! + 1) % a.route.length; a.wait = 1.5 + Math.random() * 3; }
            else {
              const step = 80 * dt * (ffRef.current ? 4 : 1);
              const nx = a.sprite.x + (ddx / dist) * step, ny = a.sprite.y + (ddy / dist) * step;
              const nearPlayer = Math.hypot(nx - s.x, ny - s.y) < 34;
              if (!nearPlayer && !blockedAt(nx, ny)) { a.sprite.x = nx; a.sprite.y = ny; }
              else { a.routeIdx = (a.routeIdx! + 1) % a.route.length; a.wait = 0.8; }
              setWalking(a, Math.abs(ddx) > Math.abs(ddy) ? (ddx < 0 ? 'left' : 'right') : (ddy < 0 ? 'up' : 'down'));
            }
          }
        }

        // Depth sort, shadows, tags
        for (const a of [p, ...Object.values(npcs.current)]) {
          a.sprite.zIndex = a.sprite.y; a.shadow.x = a.sprite.x; a.shadow.y = a.sprite.y - 2; a.shadow.zIndex = a.sprite.y - 1;
          if (a.tag) { a.tag.x = a.sprite.x; a.tag.y = a.sprite.y - 124; a.tag.zIndex = 99999; }
        }

        // Nearest interaction target
        let best: { id: string; type: string; rect?: Interactable['rect']; d: number; label: string } | null = null;
        for (const [id, a] of Object.entries(npcs.current)) {
          const d = Math.hypot(a.sprite.x - s.x, a.sprite.y - s.y);
          if (d < TALK_RANGE && (!best || d < best.d)) best = { id, type: 'npc', d, label: tNow(id === 'nurse_ann' ? 'engine.talk_ann' : 'engine.talk_grump') };
        }
        for (const it of INTERACTABLES) {
          const d = distToRect(s.x, s.y - 6, it.rect);
          if (d < USE_RANGE && (!best || d < best.d)) {
            const occupied = it.type === 'bed' && casesRef.current.some((c) => c.bedIndex === it.bedIndex);
            const label = it.type === 'bed' ? (occupied ? tNow('engine.treat_bed', { n: (it.bedIndex ?? 0) + 1 }) : tNow('engine.bed_empty', { n: (it.bedIndex ?? 0) + 1 })) : tNow(it.promptKey);
            best = { id: it.id, type: it.type, rect: it.rect, d, label };
          }
        }
        targetRef.current = best;
        highlight.clear();
        if (best?.rect) {
          const r = best.rect, pulse = 0.55 + 0.45 * Math.round((Math.sin(t * 6) + 1) * 2) / 4;
          highlight.rect(r.x - 4, r.y - 4, r.w + 8, r.h + 8).stroke({ color: 0xffd866, width: 4, alpha: pulse });
        }
        const lbl = best?.label ?? null;
        if (lbl !== promptRef.current) { promptRef.current = lbl; setPrompt(lbl); }

        // Bubbles bob in 2 px steps
        bedLayer.children.forEach((g) => g.children.forEach((ch) => { if ((ch as any).__bob) ch.y = -30 + (Math.floor(t * 3) % 2) * 2; }));

        // Evening tint after 15:00
        const cm = clockMinutesRef.current;
        dusk.alpha = cm > 420 ? Math.min(0.22, (cm - 420) / 600) : 0;

        // Camera: follow and clamp; centre the map when it is smaller than the view
        const vw = app.screen.width, vh = app.screen.height;
        let cx = vw / 2 - s.x, cy = vh / 2 - (s.y - 50);
        cx = ER_MAP.width > vw ? Math.min(0, Math.max(cx, vw - ER_MAP.width)) : (vw - ER_MAP.width) / 2;
        cy = ER_MAP.height > vh ? Math.min(0, Math.max(cy, vh - ER_MAP.height)) : (vh - ER_MAP.height) / 2;
        world.x += (cx - world.x) * Math.min(1, dt * 8);
        world.y += (cy - world.y) * Math.min(1, dt * 8);
        world.x = Math.round(world.x); world.y = Math.round(world.y);
      });
    })();

    return () => {
      alive = false;
      bedLayerRef.current = null;
      if (appRef.current) { appRef.current.destroy(true, { children: true }); appRef.current = null; }
    };
    // Rebuild only when the player's look or the Ann emote changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearance, npcEmote]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keys.current[e.key] = true;
      if (['e', 'E', 'Enter', ' '].includes(e.key)) { e.preventDefault(); if (!e.repeat) interact(); }
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    const blur = () => { keys.current = {}; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [interact]);

  const pad = (d: Direction, label: string) => (
    <motion.button 
      whileTap={{ scale: 0.9, backgroundColor: "#3f7fc0" }}
      className="w-16 h-16 bg-[#2c4a73]/80 border-4 border-pixel-ink/80 text-white text-3xl flex items-center justify-center backdrop-blur-sm shadow-xl touch-manipulation"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keys.current[d] = true; }} 
      onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keys.current[d] = false; }} 
      onPointerCancel={(e) => { keys.current[d] = false; }}
    >{label}</motion.button>
  );

  return (
    <div className="relative w-full h-full bg-[#1b2d4f] overflow-hidden touch-none select-none">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute top-3 left-3 z-40 pointer-events-none hidden [@media(hover:hover)]:block">
        <span className="bg-pixel-ink/90 border-2 border-[#2c4a73] text-pixel-text-muted px-2 py-1 text-base">{tNow('engine.controls')}</span>
      </div>

      <AnimatePresence>
        {prompt && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="bg-pixel-ink border-4 border-[#ffd866] text-[#ffe9c9] px-6 py-2 text-2xl pixel-shadow whitespace-nowrap">{prompt}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgraded Mobile Touch controls */}
      <div className="absolute bottom-8 left-8 z-50 flex flex-col items-center gap-2 hidden [@media(hover:none)]:flex">
        {pad('up', '↑')}
        <div className="flex gap-2">
          {pad('left', '←')}
          <div className="w-16 h-16 bg-transparent" />
          {pad('right', '→')}
        </div>
        {pad('down', '↓')}
      </div>
      
      <div className="absolute bottom-8 right-8 z-50 hidden [@media(hover:none)]:block">
        <motion.button 
          whileTap={{ scale: 0.85 }}
          animate={prompt ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px #ffd866", "0 0 20px #ffd866", "0 0 0px #ffd866"] } : {}}
          transition={prompt ? { repeat: Infinity, duration: 1.5 } : {}}
          onClick={interact} 
          className={`w-24 h-24 rounded-full border-4 border-pixel-ink text-white text-3xl flex items-center justify-center font-bold shadow-2xl backdrop-blur-sm touch-manipulation ${prompt ? 'bg-[#ffd866] text-pixel-ink' : 'bg-[#d95763]/90'}`}
        >
          {prompt ? '!' : 'A'}
        </motion.button>
      </div>
    </div>
  );
}