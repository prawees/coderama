import { useERStore } from './erStore';

class AudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private ambientGain: GainNode | null = null;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAmbientHum();
      this.stopRain();
    }
  }

  private ambientNoise: AudioBufferSourceNode | null = null;
  private beepTimer: ReturnType<typeof setTimeout> | null = null;
  private currentIntensity = 0;

  public stopAmbientHum() {
    if (this.beepTimer) { clearTimeout(this.beepTimer); this.beepTimer = null; }
    if (this.ambientGain && this.ctx) {
      const g = this.ambientGain, src = this.ambientNoise;
      g.gain.cancelScheduledValues(this.ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      setTimeout(() => { try { src?.stop(); } catch {} g.disconnect(); }, 1100);
      this.ambientGain = null;
      this.ambientNoise = null;
    }
  }

  /** The room under the music: soft air and, now and then, a monitor down the corridor */
  public playAmbientHum(intensity: number = 0) {
    this.initContext();
    if (!this.ctx || this.isMuted || this.ambientGain) return;
    const ctx = this.ctx;
    this.currentIntensity = intensity;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let lp = 0;
    for (let i = 0; i < len; i++) { lp = lp * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = lp; }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.25 * useERStore.getState().sfxVolume, ctx.currentTime + 2);
    src.connect(filt).connect(g).connect(ctx.destination);
    src.start();
    this.ambientNoise = src;
    this.ambientGain = g;
    const beep = () => {
      if (!this.ambientGain || !this.ctx) return;
      const t = this.ctx.currentTime;
      for (const k of [0, 0.5]) this.chime(960, t + k, 0.012, 0.09, 'sine');
      this.beepTimer = setTimeout(beep, (7 - this.currentIntensity * 3 + Math.random() * 5) * 1000);
    };
    this.beepTimer = setTimeout(beep, 4000);
  }

  public setAmbientIntensity(intensity: number) {
    this.currentIntensity = intensity;
  }

  private rainGain: GainNode | null = null;
  private rainSrc: AudioBufferSourceNode | null = null;
  private rainLevel = 1;
  private dripTimer: ReturnType<typeof setTimeout> | null = null;

  private rainVolume() {
    return 0.22 * this.rainLevel * useERStore.getState().sfxVolume;
  }

  /** Rain on the roof: a soft high hiss and now and then a drip from the gutter. Level 1 outside, lower indoors. */
  public playRain(level = 1) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    if (this.rainGain) { this.setRainLevel(level); return; }
    this.rainLevel = level;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    // pink noise, Paul Kellet's economy filter
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 800;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(this.rainVolume(), ctx.currentTime + 3);
    src.connect(hp).connect(lp).connect(g).connect(ctx.destination);
    src.start();
    this.rainSrc = src;
    this.rainGain = g;
    const drip = () => {
      if (!this.rainGain || !this.ctx) return;
      this.chime(1300 + Math.random() * 900, this.ctx.currentTime, 0.012 * this.rainLevel, 0.07);
      this.dripTimer = setTimeout(drip, 700 + Math.random() * 2600);
    };
    this.dripTimer = setTimeout(drip, 1500);
  }

  public setRainLevel(level: number) {
    this.rainLevel = level;
    if (!this.rainGain || !this.ctx) return;
    const g = this.rainGain.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(this.rainVolume(), t + 0.8);
  }

  public stopRain() {
    if (this.dripTimer) { clearTimeout(this.dripTimer); this.dripTimer = null; }
    if (this.rainGain && this.ctx) {
      const g = this.rainGain, src = this.rainSrc;
      g.gain.cancelScheduledValues(this.ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
      setTimeout(() => { try { src?.stop(); } catch {} g.disconnect(); }, 1600);
      this.rainGain = null;
      this.rainSrc = null;
    }
  }

  /** A soft struck tone with a natural decay, the building block of the cosy sounds */
  private chime(freq: number, at: number, vol: number, decay: number, type: OscillatorType = 'sine') {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const v = vol * useERStore.getState().sfxVolume;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    o.connect(g).connect(ctx.destination);
    o.start(at);
    o.stop(at + decay + 0.05);
  }

  /** Bell: fundamental plus a quieter inharmonic partial */
  private bell(freq: number, at: number, vol: number, decay = 1.2) {
    this.chime(freq, at, vol, decay);
    this.chime(freq * 2.76, at, vol * 0.25, decay * 0.4);
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Scale by master SFX volume
    const sfxVolume = useERStore.getState().sfxVolume;
    const finalVol = vol * sfxVolume;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Envelope to avoid popping
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(finalVol, this.ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private menuInterval: NodeJS.Timeout | null = null;
  private menuPlaying: boolean = false;

  public playMenuChiptune() {
    this.initContext();
    if (!this.ctx || this.isMuted || this.menuPlaying) return;
    this.menuPlaying = true;

    // A more relaxing RPG village theme melody (C Major Pentatonic / Folk style)
    // Format: [Frequency, Duration in ms]
    const melody = [
      [261.63, 400], // C4
      [293.66, 400], // D4
      [329.63, 800], // E4
      [392.00, 400], // G4
      [329.63, 400], // E4
      [261.63, 800], // C4
      [261.63, 400], // C4
      [293.66, 400], // D4
      [329.63, 400], // E4
      [293.66, 400], // D4
      [261.63, 800], // C4
      [0, 800],      // Rest
    ];
    let noteIndex = 0;
    
    const playNextNote = () => {
      if (!this.ctx || this.isMuted || !this.menuPlaying) return;
      
      const [freq, duration] = melody[noteIndex];
      const durationSec = duration / 1000;
      
      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle'; // Softer than square
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime); 
        gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.05); // Soft attack
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSec - 0.05); // Fade out
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + durationSec);
      }
      
      noteIndex = (noteIndex + 1) % melody.length;
      this.menuInterval = setTimeout(playNextNote, duration) as any;
    };

    playNextNote();
  }

  public stopMenuChiptune() {
    this.menuPlaying = false;
    if (this.menuInterval) {
      clearTimeout(this.menuInterval as any);
      this.menuInterval = null;
    }
  }

  public playClick() {
    // a light wooden tick
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.chime(1250, t, 0.05, 0.05, 'triangle');
    this.chime(620, t, 0.03, 0.04, 'sine');
  }


  public playPAChime() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const ctx = this.ctx;
    
    // Ding-dong PA system chime (C5 then G4)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const sfxVolume = useERStore.getState().sfxVolume;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1 * sfxVolume, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01 * sfxVolume, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(523.25, now, 1.0); // C5
    playNote(392.00, now + 0.6, 1.5); // G4
  }

  public playBump() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.chime(160, t, 0.12, 0.12, 'sine');
    this.chime(95, t + 0.01, 0.1, 0.14, 'sine');
  }


  public playFootstep() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // A very soft thud/pat using a low sine wave and quick decay
    const sfxVolume = useERStore.getState().sfxVolume;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.05); // pitch drop for thud

    gain.gain.setValueAtTime(0.3 * sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playBuzzer() {
    // a gentle "not quite": two falling woody notes
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.chime(330, t, 0.07, 0.18, 'triangle');
    this.chime(262, t + 0.12, 0.07, 0.25, 'triangle');
  }


  public playPager() {
    // the pager: two bright dings, twice
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [0, 0.16, 0.5, 0.66].forEach((k, i) => this.bell(i % 2 ? 1568 : 1319, t + k, 0.07, 0.35));
  }


  public playCashRegister() {
    // coins into the jar
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [1319, 1568, 2093, 2637].forEach((f, i) => this.bell(f, t + i * 0.07, 0.06, 0.6));
  }


  public playShiftStart() {
    // a warm rising chime: the day begins
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.bell(f, t + i * 0.18, 0.08, 1.6));
    this.chime(261.63, t, 0.05, 2.4, 'triangle');
  }


  public playShiftEnd() {
    // settling home: a falling chime that lands softly
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [1046.5, 783.99, 659.25, 523.25].forEach((f, i) => this.bell(f, t + i * 0.22, 0.07, 1.8));
    this.chime(196, t + 0.66, 0.05, 2.6, 'triangle');
  }


  /** A letter or a gift: paper, then a little shimmer */
  public playSparkle() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [1568, 1976, 2349, 3136].forEach((f, i) => this.bell(f, t + 0.05 + i * 0.09, 0.045, 0.9));
  }

  public playDialogueBark(pitch: number = 800) {
    // a soft voice blip, pitched per speaker
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const f = pitch * (0.97 + Math.random() * 0.06);
    this.chime(f, this.ctx.currentTime, 0.035, 0.06, 'triangle');
  }

}

export const audio = new AudioEngine();
