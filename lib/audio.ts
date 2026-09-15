import { useERStore } from './erStore';

class AudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private ambientOsc: OscillatorNode | null = null;
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
    }
  }

  public stopAmbientHum() {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      setTimeout(() => {
        if (this.ambientOsc) {
          this.ambientOsc.stop();
          this.ambientOsc.disconnect();
          this.ambientOsc = null;
        }
        if (this.ambientOsc2) {
          this.ambientOsc2.stop();
          this.ambientOsc2.disconnect();
          this.ambientOsc2 = null;
        }
        if (this.ambientFilter) {
          this.ambientFilter.disconnect();
          this.ambientFilter = null;
        }
        if (this.ambientGain) {
          this.ambientGain.disconnect();
          this.ambientGain = null;
        }
      }, 1100);
    }
  }

  private ambientOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private currentIntensity: number = 0;

  public playAmbientHum(intensity: number = 0) {
    this.initContext();
    if (!this.ctx || this.isMuted || this.ambientOsc) return;

    this.currentIntensity = intensity;

    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    this.ambientFilter = this.ctx.createBiquadFilter();

    // Base sub-bass sine wave
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

    // Higher gritty sawtooth wave for intensity
    this.ambientOsc2.type = 'sawtooth';
    this.ambientOsc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

    // Low pass filter to keep the sawtooth muffled unless intense
    this.ambientFilter.type = 'lowpass';
    const filterFreq = 100 + (intensity * 1000); // 0 -> 100Hz, 1 -> 1100Hz
    this.ambientFilter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    
    // Mix the two
    this.ambientOsc.connect(this.ambientGain);
    this.ambientOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);

    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.03 + (intensity * 0.05), this.ctx.currentTime + 2); // Fade in

    this.ambientGain.connect(this.ctx.destination);

    this.ambientOsc.start();
    this.ambientOsc2.start();
  }

  public setAmbientIntensity(intensity: number) {
    if (!this.ctx || !this.ambientFilter || !this.ambientGain) return;
    this.currentIntensity = intensity;
    const filterFreq = 100 + (intensity * 1000);
    this.ambientFilter.frequency.linearRampToValueAtTime(filterFreq, this.ctx.currentTime + 1);
    this.ambientGain.gain.linearRampToValueAtTime(0.03 + (intensity * 0.05), this.ctx.currentTime + 1);
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
    this.playTone(800, 'square', 0.05, 0.05);
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
    this.playTone(150, 'square', 0.1, 0.1);
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
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // Dissonant sawtooth buzzer
    this.playTone(300, 'sawtooth', 0.4, 0.15);
    this.playTone(315, 'sawtooth', 0.4, 0.15);
  }

  public playPager() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // Repeating high pitch pulse
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.playTone(1200, 'triangle', 0.1, 0.1), i * 200);
    }
  }

  public playCashRegister() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // Arpeggio up for cha-ching
    const notes = [880, 1108.73, 1318.51, 1760]; // A5, C#6, E6, A6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.15, 0.15), i * 60);
    });
  }

  public playShiftStart() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // Suspenseful 8-bit FNAF descending chimes
    // Notes in Hz: C4, G3, D#3, C3
    const notes = [261.63, 196.00, 155.56, 130.81];
    
    notes.forEach((freq, i) => {
      // Long haunting square waves
      setTimeout(() => {
        this.playTone(freq, 'square', 1.5, 0.1);
        // Add a slight detuned sawtooth for eerie dissonance
        this.playTone(freq * 0.98, 'sawtooth', 1.5, 0.05);
      }, i * 800);
    });
  }

  public playShiftEnd() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // Relief ascending 6AM chimes
    const notes = [196.00, 261.63, 329.63, 392.00]; // G3, C4, E4, G4
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 1.5, 0.1);
      }, i * 800);
    });
  }

  public playDialogueBark(pitch: number = 800) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Randomize pitch slightly for variation
    const variedPitch = pitch + (Math.random() * 50 - 25);
    
    osc.type = 'square'; // Classic retro text blip
    osc.frequency.setValueAtTime(variedPitch, this.ctx.currentTime);
    
    const sfxVolume = useERStore.getState().sfxVolume;

    // Very short, snappy envelope
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03 * sfxVolume, this.ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

export const audio = new AudioEngine();
