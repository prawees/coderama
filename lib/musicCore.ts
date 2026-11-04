/**
 * The game's music, written out as songs and played on small WebAudio instruments.
 *
 * Pure scheduling: given any BaseAudioContext (live or offline), a destination and a bar number,
 * it schedules that bar's notes. lib/music.ts runs it live; the offline render in the playtest
 * harness uses it to check levels and to export listenable files.
 */

export type TrackId =
  | 'title' | 'first_house' | 'sunrise' | 'wandering' | 'nightfall'
  | 'deep_mines' | 'the_void' | 'home';

type Inst = 'keys' | 'pluck' | 'mallet' | 'flute' | 'pad' | 'bass' | 'shaker' | 'kick' | 'bell';

/** A note in beats from the start of the bar */
interface Ev { at: number; midi: number; len: number; inst: Inst; vel: number }

export interface Song {
  bpm: number;
  beats: number;
  /** One chord symbol per bar */
  chords: string[];
  /** One melody string per bar, "F#5:1.5 E5:0.5 -:2" (note:beats, "-" is a rest) */
  melody: string[];
  lead: Inst;
  /** Accompaniment for one bar */
  comp: (c: Chord, bar: number, beats: number) => Ev[];
  /** Overall level of the song, so quiet pieces stay quiet */
  level: number;
}

// ---------- notes and chords ----------

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteToMidi(n: string): number {
  const m = n.match(/^([A-G])([#b]?)(-?\d)$/);
  if (!m) throw new Error(`bad note ${n}`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

export interface Chord { root: number; third: number; fifth: number; seventh: number | null; bass: number }

const QUAL: Record<string, [number, number, number | null]> = {
  '': [4, 7, null], m: [3, 7, null], '7': [4, 7, 10], maj7: [4, 7, 11], m7: [3, 7, 10],
  sus4: [5, 7, null], sus2: [2, 7, null], add9: [4, 7, 14], dim: [3, 6, null], '6': [4, 7, 9],
};

/** "F#m7/C#" -> pitch classes as semitones above C */
export function parseChord(sym: string): Chord {
  const [main, slash] = sym.split('/');
  const m = main.match(/^([A-G])([#b]?)(.*)$/);
  if (!m || !(m[3] in QUAL)) throw new Error(`bad chord ${sym}`);
  const root = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  const [third, fifth, seventh] = QUAL[m[3]];
  let bass = root;
  if (slash) {
    const b = slash.match(/^([A-G])([#b]?)$/)!;
    bass = (PC[b[1]] + (b[2] === '#' ? 1 : b[2] === 'b' ? -1 : 0) + 12) % 12;
  }
  return { root, third, fifth, seventh, bass };
}

/** Lowest MIDI note with pitch class pc at or above `from` */
const above = (pc: number, from: number) => from + ((pc - from) % 12 + 12) % 12;

function parseLine(line: string, inst: Inst, vel: number): Ev[] {
  const out: Ev[] = [];
  let t = 0;
  for (const tok of line.trim().split(/\s+/)) {
    if (!tok) continue;
    const [n, d] = tok.split(':');
    const len = Number(d);
    if (n !== '-') out.push({ at: t, midi: noteToMidi(n), len, inst, vel });
    t += len;
  }
  return out;
}

// ---------- accompaniment patterns ----------

const ev = (at: number, midi: number, len: number, inst: Inst, vel: number): Ev => ({ at, midi, len, inst, vel });

/** Broken chord in eighths: 1 5 8 10 12 10 8 5, on the given instrument */
function arp(c: Chord, beats: number, inst: Inst, low: number, vel: number): Ev[] {
  const r = above(c.root, low);
  const shape = [r, r + c.fifth, r + 12, r + 12 + c.third, r + 12 + c.fifth, r + 12 + c.third, r + 12, r + c.fifth];
  const out: Ev[] = [];
  for (let i = 0; i < beats * 2; i++) out.push(ev(i * 0.5, shape[i % shape.length], 1.2, inst, vel * (i % 2 ? 0.75 : 1)));
  return out;
}

/** Travis-style fingerpicking: alternating bass on the beat, chord tones between */
function fingerpick(c: Chord, beats: number, vel: number): Ev[] {
  const b = above(c.bass, 40);
  const r = above(c.root, 55);
  const top = [r + c.third, r + c.fifth, r + 12, r + c.fifth];
  const out: Ev[] = [];
  for (let i = 0; i < beats; i++) {
    out.push(ev(i, i % 2 ? b + 7 : b, 0.9, 'pluck', vel));
    out.push(ev(i + 0.5, top[i % top.length], 0.6, 'pluck', vel * 0.7));
  }
  return out;
}

/** Waltz: low root on one, chord on two and three */
function waltz(c: Chord, vel: number): Ev[] {
  const b = above(c.bass, 41);
  const r = above(c.root, 60);
  const stab = [r, r + c.third, r + c.fifth];
  const out: Ev[] = [ev(0, b, 1.5, 'bass', vel)];
  for (const at of [1, 2]) for (const n of stab) out.push(ev(at, n, 0.8, 'keys', vel * 0.55));
  return out;
}

function padChord(c: Chord, beats: number, vel: number, low = 52): Ev[] {
  const r = above(c.root, low);
  const tones = [r, r + c.third, r + c.fifth];
  if (c.seventh !== null) tones.push(r + c.seventh);
  return tones.map((n) => ev(0, n, beats, 'pad', vel));
}

function bassLine(c: Chord, beats: number, vel: number, walk = false): Ev[] {
  const b = above(c.bass, 36);
  if (beats === 3) return [ev(0, b, 2, 'bass', vel), ev(2, b + 7, 1, 'bass', vel * 0.8)];
  return walk
    ? [ev(0, b, 1.5, 'bass', vel), ev(1.5, b, 0.5, 'bass', vel * 0.6), ev(2, b + 7, 1.5, 'bass', vel * 0.85), ev(3.5, b + 5, 0.5, 'bass', vel * 0.6)]
    : [ev(0, b, 2, 'bass', vel), ev(2, b + 7, 2, 'bass', vel * 0.85)];
}

function shakers(beats: number, vel: number): Ev[] {
  const out: Ev[] = [];
  for (let i = 0; i < beats * 2; i++) out.push(ev(i * 0.5, 0, 0.1, 'shaker', vel * (i % 2 ? 1 : 0.55)));
  return out;
}

function pulse(c: Chord, beats: number, vel: number, sixteenths = false): Ev[] {
  const b = above(c.bass, 38);
  const step = sixteenths ? 0.25 : 0.5;
  const out: Ev[] = [];
  for (let t = 0; t < beats; t += step) out.push(ev(t, b, step * 0.9, 'bass', vel * (t % 1 === 0 ? 1 : 0.7)));
  return out;
}

// ---------- the songs ----------

export const SONGS: Record<TrackId, Song> = {
  // Title: the Code Rama theme. Piano arpeggios, flute tune, D major.
  title: {
    bpm: 84, beats: 4, lead: 'flute', level: 0.7,
    chords: ['D', 'A/C#', 'Bm', 'G', 'D', 'A7', 'G', 'A', 'Bm7', 'F#m', 'G', 'D', 'Em', 'A', 'D', 'D'],
    melody: [
      'F#5:1.5 E5:0.5 D5:1 A4:1', 'E5:1.5 F#5:0.5 E5:1 C#5:1', 'D5:1.5 C#5:0.5 B4:1 F#4:1', 'G4:1 A4:1 B4:1 D5:1',
      'F#5:1.5 E5:0.5 D5:1 A5:1', 'G5:1.5 F#5:0.5 E5:2', 'D5:1 E5:1 G5:1 F#5:1', 'E5:3 -:1',
      'F#5:1 G5:1 A5:2', 'A5:1 G5:0.5 F#5:0.5 C#5:2', 'D5:1 E5:1 B5:1.5 A5:0.5', 'F#5:3 -:1',
      'G5:1.5 F#5:0.5 E5:1 D5:1', 'C#5:1 D5:1 E5:1 A4:1', 'D5:4', '-:4',
    ],
    comp: (c, bar, beats) => [
      ...arp(c, beats, 'keys', 50, 0.5),
      ...bassLine(c, beats, 0.7),
      ...(bar % 4 === 0 ? padChord(c, beats * 4, 0.35) : []),
      ...(bar % 8 === 7 ? [ev(3, above(c.root, 84), 2, 'bell', 0.25)] : []),
    ],
  },

  // Off duty in the ER: a cosy guitar-and-flute home theme, G major
  first_house: {
    bpm: 88, beats: 4, lead: 'flute', level: 0.8,
    chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am7', 'D7', 'C', 'D', 'Bm', 'Em', 'C', 'D', 'G', 'G'],
    melody: [
      'B4:1 D5:1 G5:1.5 F#5:0.5', 'E5:2 B4:2', 'C5:1 E5:1 G5:1 E5:1', 'D5:3 -:1',
      'B4:1 D5:1 G5:1 A5:1', 'B5:2 G5:2', 'A5:1 G5:1 E5:1 C5:1', 'D5:3 -:1',
      'E5:1 G5:1 C6:1.5 B5:0.5', 'A5:2 F#5:2', 'D5:1 F#5:1 B5:1 A5:1', 'G5:2 E5:2',
      'E5:1 G5:1 C5:1 E5:1', 'D5:1 F#5:1 A5:1 C5:1', 'B4:4', '-:4',
    ],
    comp: (c, _bar, beats) => [...fingerpick(c, beats, 0.55), ...bassLine(c, beats, 0.5), ...padChord(c, beats, 0.12)],
  },

  // Morning on shift: marimba tune over picked guitar and a soft shaker, C major
  sunrise: {
    bpm: 92, beats: 4, lead: 'mallet', level: 1.2,
    chords: ['C', 'G/B', 'Am', 'F', 'C', 'G', 'F6', 'C', 'Am', 'Em', 'F', 'C', 'Dm7', 'G', 'Cadd9', 'C'],
    melody: [
      'E5:1 G5:1 E5:0.5 D5:0.5 C5:1', 'D5:1 B4:1 G4:2', 'A4:1 C5:1 E5:1 D5:0.5 C5:0.5', 'C5:2 A4:2',
      'E5:1 G5:1 C6:1 B5:0.5 A5:0.5', 'G5:2 D5:2', 'F5:1 E5:1 D5:1 C5:0.5 A4:0.5', 'C5:3 -:1',
      'A5:1 G5:0.5 E5:0.5 C5:2', 'B4:1 E5:1 G5:2', 'A5:1 G5:1 F5:1 E5:1', 'E5:2 G5:2',
      'F5:1 E5:1 D5:1 A4:1', 'B4:1 D5:1 G5:1 F5:1', 'E5:2 D5:1 C5:1', 'C5:3 -:1',
    ],
    comp: (c, _bar, beats) => [...fingerpick(c, beats, 0.5), ...bassLine(c, beats, 0.45), ...shakers(beats, 0.18)],
  },

  // Afternoon on shift: an easy waltz, F major
  wandering: {
    bpm: 108, beats: 3, lead: 'flute', level: 0.92,
    chords: ['F', 'C', 'Bb', 'F', 'Gm', 'C', 'F', 'C', 'Dm', 'Am', 'Bb', 'F', 'Bb', 'C', 'F', 'F'],
    melody: [
      'C5:1 F5:1 A5:1', 'G5:2 F5:1', 'D5:1 F5:1 Bb5:1', 'A5:3',
      'G5:1 A5:1 Bb5:1', 'G5:2 E5:1', 'F5:1 A5:1 G5:1', 'E5:2 -:1',
      'D5:1 F5:1 A5:1', 'C5:1 E5:1 A5:1', 'Bb5:1 A5:1 G5:1', 'A5:2 F5:1',
      'D5:1 F5:1 Bb5:1', 'G5:1 A5:1 E5:1', 'F5:3', '-:3',
    ],
    comp: (c) => waltz(c, 0.55),
  },

  // Evening on shift: slow piano and a wistful flute, A minor
  nightfall: {
    bpm: 72, beats: 4, lead: 'flute', level: 0.8,
    chords: ['Am7', 'Fmaj7', 'Cmaj7', 'G', 'Am7', 'Dm7', 'Esus4', 'E', 'Am7', 'Fmaj7', 'Cmaj7', 'G', 'Am7', 'Dm7', 'E7', 'Am'],
    melody: [
      'E5:2 C5:1 B4:1', 'A4:2 C5:1 E5:1', 'G5:2 E5:1 D5:1', 'D5:3 -:1',
      'E5:1.5 G5:0.5 A5:1 G5:1', 'F5:2 E5:1 D5:1', 'E5:2 D5:1 B4:1', 'B4:2 G#4:2',
      'A5:2 G5:1 E5:1', 'F5:1 E5:1 C5:2', 'G5:1 A5:1 B5:1 G5:1', 'D5:4',
      'C5:1 E5:1 A5:1 G5:1', 'F5:1.5 E5:0.5 D5:2', 'E5:1 B4:1 D5:1 C5:1', 'A4:3 -:1',
    ],
    comp: (c, _bar, beats) => [...arp(c, beats, 'keys', 45, 0.42), ...bassLine(c, beats, 0.45), ...padChord(c, beats, 0.16)],
  },

  // Patients waiting: steady and alert without grating, D minor
  deep_mines: {
    bpm: 100, beats: 4, lead: 'mallet', level: 1.1,
    chords: ['Dm', 'Bb', 'C', 'Am', 'Dm', 'Gm7', 'C', 'A', 'Dm', 'Gm', 'Bb', 'A', 'Dm', 'Gm', 'Bb', 'A'],
    melody: [
      'D5:1.5 E5:0.5 F5:2', '-:4', 'E5:1.5 F5:0.5 G5:2', 'E5:4',
      'D5:1.5 E5:0.5 F5:1 A5:1', 'G5:2 F5:2', 'E5:1 G5:1 C5:2', 'C#5:4',
      'A5:1.5 G5:0.5 F5:2', 'G5:1.5 F5:0.5 D5:2', 'F5:1 E5:1 D5:1 F5:1', 'E5:4',
      'A4:1 D5:1 F5:1 A5:1', 'Bb5:2 G5:2', 'F5:1 E5:1 D5:1 F5:1', 'E5:2 C#5:2',
    ],
    comp: (c, _bar, beats) => [
      ...pulse(c, beats, 0.45),
      ...padChord(c, beats, 0.16, 50),
      ev(0, 0, 0.2, 'kick', 0.35), ev(2, 0, 0.2, 'kick', 0.3),
      ...shakers(beats, 0.12),
    ],
  },

  // A full department: driving, minor, still musical, E minor
  the_void: {
    bpm: 118, beats: 4, lead: 'pluck', level: 1.0,
    chords: ['Em', 'C', 'D', 'B7', 'Em', 'Cmaj7', 'Am', 'B7', 'C', 'D', 'Em', 'Em', 'C', 'Am', 'B7', 'B7'],
    melody: [
      'E5:0.5 G5:0.5 B5:1 A5:1 G5:1', 'E5:2 G5:2', 'F#5:0.5 A5:0.5 D5:1 E5:1 F#5:1', 'D#5:4',
      'E5:0.5 G5:0.5 B5:1 A5:1 G5:1', 'C6:2 B5:2', 'A5:1 G5:1 E5:1 C5:1', 'B4:4',
      'G5:1 E5:1 C5:1 E5:1', 'F#5:1 D5:1 A4:1 D5:1', 'E5:1 G5:1 B5:2', '-:4',
      'G5:1.5 F#5:0.5 E5:2', 'A5:1.5 G5:0.5 E5:2', 'F#5:1 D#5:1 B4:2', '-:4',
    ],
    comp: (c, _bar, beats) => [
      ...pulse(c, beats, 0.5),
      ...padChord(c, beats, 0.18, 50),
      ev(0, 0, 0.2, 'kick', 0.4), ev(1, 0, 0.2, 'kick', 0.3), ev(2, 0, 0.2, 'kick', 0.4), ev(3, 0, 0.2, 'kick', 0.3),
      ...shakers(beats, 0.16),
    ],
  },

  // The walk home after a shift: piano and flute, C major, resolving
  home: {
    bpm: 72, beats: 4, lead: 'flute', level: 0.85,
    chords: ['C', 'Am', 'F', 'G', 'C', 'E7', 'Am', 'Am/G', 'F', 'G', 'Em', 'Am', 'Dm7', 'G', 'C', 'C'],
    melody: [
      'G4:1 C5:1 E5:2', 'D5:1 C5:1 A4:2', 'A4:1 C5:1 F5:1 E5:1', 'D5:3 -:1',
      'E5:1 G5:1 C6:2', 'B5:1 G#5:1 E5:2', 'A5:1.5 G5:0.5 E5:1 C5:1', 'C5:3 -:1',
      'A4:1 C5:1 F5:1.5 E5:0.5', 'D5:1 G5:1 B4:2', 'E5:1 G5:1 B5:1 G5:1', 'A5:3 -:1',
      'F5:1 E5:1 D5:1 A4:1', 'B4:1 D5:1 G5:1 F5:1', 'E5:1 D5:1 C5:2', '-:4',
    ],
    comp: (c, _bar, beats) => [...arp(c, beats, 'keys', 48, 0.45), ...bassLine(c, beats, 0.45), ...padChord(c, beats, 0.12)],
  },
};

// ---------- mix ----------

/** Make-up gain after the music volume (about +8 dB) and the reverb return, shared by live and offline */
export const MIX = { makeup: 2.5, wet: 0.35 };

// ---------- instruments ----------

export interface Bus {
  ctx: BaseAudioContext;
  out: AudioNode;
  reverb: AudioNode;
  noise: AudioBuffer;
}

export function makeNoise(ctx: BaseAudioContext): AudioBuffer {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** A warm room: decaying noise, darkened so the tail never hisses */
export function makeReverb(ctx: BaseAudioContext, seconds = 2.2): ConvolverNode {
  const len = Math.floor(ctx.sampleRate * seconds);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      lp = lp * 0.82 + (Math.random() * 2 - 1) * 0.18;
      d[i] = lp * Math.pow(1 - t, 2.4) * (i < ctx.sampleRate * 0.01 ? i / (ctx.sampleRate * 0.01) : 1);
    }
  }
  const c = ctx.createConvolver();
  c.buffer = ir;
  return c;
}

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const PAN: Record<Inst, number> = { keys: 0.2, pluck: -0.25, mallet: 0.15, flute: 0, pad: 0, bass: 0, shaker: 0.3, kick: 0, bell: -0.1 };
const SEND: Record<Inst, number> = { keys: 0.3, pluck: 0.25, mallet: 0.35, flute: 0.4, pad: 0.45, bass: 0.05, shaker: 0.15, kick: 0, bell: 0.6 };

function voiceOut(bus: Bus, inst: Inst): GainNode {
  const { ctx } = bus;
  const g = ctx.createGain();
  const p = ctx.createStereoPanner();
  p.pan.value = PAN[inst];
  g.connect(p);
  p.connect(bus.out);
  const s = ctx.createGain();
  s.gain.value = SEND[inst];
  p.connect(s);
  s.connect(bus.reverb);
  return g;
}

/** Play one note. Times are in seconds on the context clock. */
export function play(bus: Bus, inst: Inst, midi: number, t: number, dur: number, vel: number) {
  const { ctx } = bus;
  const out = voiceOut(bus, inst);
  const f = hz(midi);
  const end = (x: number) => x + 0.05;

  if (inst === 'keys') {
    // Soft electric piano: sine carrier with a decaying FM bite
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const mg = ctx.createGain();
    const amp = ctx.createGain();
    car.frequency.value = f;
    mod.frequency.value = f * 2;
    mg.gain.setValueAtTime(f * 1.1, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
    mod.connect(mg).connect(car.frequency);
    const decay = Math.min(2.4, 0.6 + dur * 0.8);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.18 * vel, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    car.connect(amp).connect(out);
    car.start(t); mod.start(t); car.stop(end(t + decay)); mod.stop(end(t + decay));
  } else if (inst === 'pluck') {
    // Nylon guitar: bright attack that closes quickly
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    o1.type = 'triangle'; o2.type = 'sawtooth';
    o1.frequency.value = f; o2.frequency.value = f;
    const mix = ctx.createGain(); mix.gain.value = 0.35;
    o2.connect(mix);
    lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(Math.min(6000, f * 8), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 0.25);
    const decay = Math.min(1.6, 0.5 + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o1.connect(lp); mix.connect(lp); lp.connect(amp).connect(out);
    o1.start(t); o2.start(t); o1.stop(end(t + decay)); o2.stop(end(t + decay));
  } else if (inst === 'mallet') {
    // Marimba: round fundamental and a quick wooden overtone
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const a1 = ctx.createGain();
    const a2 = ctx.createGain();
    o1.frequency.value = f; o2.frequency.value = f * 4;
    a1.gain.setValueAtTime(0.0001, t);
    a1.gain.exponentialRampToValueAtTime(0.22 * vel, t + 0.005);
    a1.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    a2.gain.setValueAtTime(0.0001, t);
    a2.gain.exponentialRampToValueAtTime(0.06 * vel, t + 0.003);
    a2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o1.connect(a1).connect(out); o2.connect(a2).connect(out);
    o1.start(t); o2.start(t); o1.stop(end(t + 0.9)); o2.stop(end(t + 0.1));
  } else if (inst === 'flute') {
    // Flute: soft attack, delayed vibrato, a breath of noise at the start
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const amp = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f;
    const o2g = ctx.createGain(); o2g.gain.value = 0.25;
    lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(f * 0.004, t + Math.min(0.5, dur * 0.6));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const rel = 0.18;
    const sus = Math.max(0.05, dur - 0.04);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.13 * vel, t + 0.07);
    amp.gain.setValueAtTime(0.13 * vel, t + sus);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + sus + rel);
    o.connect(amp); o2.connect(o2g).connect(amp); amp.connect(out);
    const br = ctx.createBufferSource(); br.buffer = bus.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.02 * vel, t + 0.03);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    br.connect(bp).connect(bg).connect(out);
    for (const x of [o, o2, lfo]) { x.start(t); x.stop(end(t + sus + rel)); }
    br.start(t); br.stop(t + 0.2);
  } else if (inst === 'pad') {
    // Warm strings: two detuned saws, dark filter, slow swell
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.3;
    const amp = ctx.createGain();
    const atk = Math.min(1.2, dur * 0.3);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.05 * vel, t + atk);
    amp.gain.setValueAtTime(0.05 * vel, t + dur);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.2);
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(end(t + dur + 1.2));
    }
    lp.connect(amp).connect(out);
  } else if (inst === 'bass') {
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const amp = ctx.createGain();
    o2.type = 'triangle';
    o.frequency.value = f; o2.frequency.value = f;
    const o2g = ctx.createGain(); o2g.gain.value = 0.4;
    const rel = 0.12;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.28 * vel, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.25);
    amp.gain.setValueAtTime(0.16 * vel, t + Math.max(0.26, dur - 0.05));
    amp.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.26, dur - 0.05) + rel);
    o.connect(amp); o2.connect(o2g).connect(amp); amp.connect(out);
    o.start(t); o2.start(t); o.stop(end(t + dur + rel)); o2.stop(end(t + dur + rel));
  } else if (inst === 'shaker') {
    const src = ctx.createBufferSource(); src.buffer = bus.noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.005);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(hp).connect(amp).connect(out);
    src.start(t, Math.random() * 0.5); src.stop(t + 0.08);
  } else if (inst === 'kick') {
    // A soft felt thump, felt more than heard
    const o = ctx.createOscillator();
    const amp = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.005);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(amp).connect(out);
    o.start(t); o.stop(t + 0.25);
  } else if (inst === 'bell') {
    for (const [ratio, lvl, dec] of [[1, 0.1, 2.6], [2.76, 0.04, 1.2], [5.4, 0.015, 0.5]] as const) {
      const o = ctx.createOscillator();
      const a = ctx.createGain();
      o.frequency.value = f * ratio;
      a.gain.setValueAtTime(0.0001, t);
      a.gain.exponentialRampToValueAtTime(lvl * vel, t + 0.004);
      a.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(a).connect(out);
      o.start(t); o.stop(end(t + dec));
    }
  }
}

/** Seconds in one bar of a song */
export const barSeconds = (s: Song) => (60 / s.bpm) * s.beats;

/**
 * Schedule bar `bar` (counting from 0, looping) of a song starting at time t0.
 * Every third time through, the tune rests and the accompaniment carries on alone.
 */
export function scheduleBar(bus: Bus, song: Song, bar: number, t0: number) {
  const n = song.chords.length;
  const i = bar % n;
  const pass = Math.floor(bar / n);
  const spb = 60 / song.bpm;
  const chord = parseChord(song.chords[i]);
  // a touch of human timing so the parts breathe
  const sway = () => (Math.random() - 0.5) * 0.012;
  const evs = song.comp(chord, i, song.beats);
  if (pass % 3 !== 2) {
    evs.push(...parseLine(song.melody[i], song.lead, 0.9));
    // the second time through, the piano doubles the tune softly an octave down
    if (pass % 3 === 1 && song.lead === 'flute') {
      evs.push(...parseLine(song.melody[i], 'keys', 0.35).map((e) => ({ ...e, midi: e.midi - 12 })));
    }
  }
  for (const e of evs) {
    play(bus, e.inst, e.midi, t0 + e.at * spb + (e.inst === 'kick' ? 0 : sway()), e.len * spb, e.vel * song.level);
  }
}
