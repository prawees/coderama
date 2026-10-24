import { useERStore } from "./erStore";
import { SONGS, TrackId, Bus, MIX, barSeconds, scheduleBar, makeNoise, makeReverb } from "./musicCore";

export type { TrackId };

/** One song playing through its own gain, so two can overlap during a crossfade */
interface Playing {
  id: TrackId;
  gain: GainNode;
  bar: number;
  nextBarAt: number;
  stopped: boolean;
}

const LOOKAHEAD = 1.2; // seconds of music scheduled ahead of the clock
const TICK_MS = 200;

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: Omit<Bus, "out"> | null = null;
  private playing: Playing[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  public isMuted = false;

  private init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx: AudioContext = new AC();
      this.ctx = ctx;
      // Gentle glue on the whole mix so no song ever clips on a phone speaker
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.3;
      this.master = ctx.createGain();
      this.master.gain.value = this.isMuted ? 0 : useERStore.getState().musicVolume;
      const makeup = ctx.createGain();
      makeup.gain.value = MIX.makeup;
      this.master.connect(makeup).connect(comp).connect(ctx.destination);
      const reverb = makeReverb(ctx);
      const wet = ctx.createGain();
      wet.gain.value = MIX.wet;
      reverb.connect(wet).connect(this.master);
      this.bus = { ctx, reverb, noise: makeNoise(ctx) };

      window.addEventListener("volumeChanged", (e: any) => this.setLevel(this.isMuted ? 0 : e.detail.musicVolume));
      // Browsers start audio suspended until the player touches the page (a reload straight into the hub)
      const wake = () => { if (this.ctx?.state === "suspended" && !document.hidden) this.ctx.resume(); };
      window.addEventListener("pointerdown", wake);
      window.addEventListener("keydown", wake);
      // A backgrounded phone throttles timers; pause rather than stutter
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend();
        else this.ctx.resume();
      });
    }
    if (this.ctx.state === "suspended" && !document.hidden) this.ctx.resume();
  }

  private setLevel(v: number) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(v, now + 0.3);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    this.setLevel(muted ? 0 : useERStore.getState().musicVolume);
  }

  public getCurrentTrack(): TrackId | null {
    const live = this.playing.filter((p) => !p.stopped);
    return live.length ? live[live.length - 1].id : null;
  }

  private tick = () => {
    if (!this.ctx || !this.bus) return;
    const horizon = this.ctx.currentTime + LOOKAHEAD;
    for (const p of this.playing) {
      if (p.stopped) continue;
      const song = SONGS[p.id];
      while (p.nextBarAt < horizon) {
        scheduleBar({ ...this.bus, out: p.gain }, song, p.bar, p.nextBarAt);
        p.bar++;
        p.nextBarAt += barSeconds(song);
      }
    }
  };

  private ensureTimer() {
    if (!this.timer) this.timer = setInterval(this.tick, TICK_MS);
  }

  private fadeOut(p: Playing, seconds: number) {
    if (!this.ctx || p.stopped) return;
    p.stopped = true;
    const now = this.ctx.currentTime;
    p.gain.gain.cancelScheduledValues(now);
    p.gain.gain.setValueAtTime(p.gain.gain.value, now);
    p.gain.gain.linearRampToValueAtTime(0.0001, now + seconds);
    // Notes already scheduled go silent when their path is cut
    setTimeout(() => {
      p.gain.disconnect();
      this.playing = this.playing.filter((x) => x !== p);
    }, seconds * 1000 + 200);
  }

  /** Crossfade to a song (or to silence with null). The old song fades while the new one rises. */
  public fadeToTrack(trackId: TrackId | null, durationSec = 3) {
    this.init();
    if (!this.ctx || !this.master) return;
    if (trackId && this.getCurrentTrack() === trackId) return;
    for (const p of this.playing) this.fadeOut(p, durationSec);
    if (!trackId) return;
    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(1, now + Math.max(0.05, durationSec));
    g.connect(this.master);
    this.playing.push({ id: trackId, gain: g, bar: 0, nextBarAt: now + 0.1, stopped: false });
    this.ensureTimer();
    this.tick();
  }

  public playTrack(trackId: TrackId) {
    this.fadeToTrack(trackId, 0.6);
  }

  public stopTrack() {
    for (const p of this.playing) this.fadeOut(p, 0.4);
  }
}

export const music = new MusicEngine();
