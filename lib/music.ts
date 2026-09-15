import { useERStore } from "./erStore";

export type TrackId = 'sunrise' | 'deep_mines' | 'first_house' | 'nightfall' | 'wandering' | 'the_void' | 'home';

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  public isMuted: boolean = false;
  private currentTrack: TrackId | null = null;
  private playing: boolean = false;
  private sequenceTimer: NodeJS.Timeout | null = null;

  // Track state
  private trackStep: number = 0;
  private activeOscillators: Set<OscillatorNode> = new Set();

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.setupRouting();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupRouting() {
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    const initialVol = useERStore.getState().musicVolume;
    this.masterGain.gain.value = initialVol; // Global volume

    // Listen for volume changes
    window.addEventListener('volumeChanged', (e: any) => {
       if (this.masterGain && this.ctx) {
          const newVol = e.detail.musicVolume;
          // Ramp to avoid clicks
          this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
          this.masterGain.gain.linearRampToValueAtTime(newVol, this.ctx.currentTime + 0.1);
       }
    });

    // Synthetic Reverb Impulse Response
    this.reverbNode = this.ctx.createConvolver();
    const length = this.ctx.sampleRate * 3.0; // 3 seconds reverb
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let i = 0; i < 2; i++) {
      const channel = impulse.getChannelData(i);
      for (let j = 0; j < length; j++) {
        channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 3); // Exponential decay white noise
      }
    }
    this.reverbNode.buffer = impulse;

    // Delay
    this.delayNode = this.ctx.createDelay(5.0);
    this.delayNode.delayTime.value = 0.75; // 750ms delay
    
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.3; // 30% feedback

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // Wet mix
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.4;
    
    const delayOutGain = this.ctx.createGain();
    delayOutGain.gain.value = 0.2;

    // Routing graph
    this.masterGain.connect(this.ctx.destination);
    
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);

    this.delayNode.connect(delayOutGain);
    delayOutGain.connect(this.masterGain);
    delayOutGain.connect(this.reverbNode); // Delay feeds into reverb too!
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.5, this.ctx!.currentTime + 0.5);
    }
  }

  private midiToFreq(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private playSynth(midiNote: number, type: 'pad' | 'pluck' | 'bass', durationSec: number = 2, vol: number = 1.0) {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    const freq = this.midiToFreq(midiNote);
    osc.frequency.value = freq;
    
    const now = this.ctx.currentTime;
    
    if (type === 'pad') {
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15 * vol, now + 1.5); // Slow attack
      gain.gain.setTargetAtTime(0, now + durationSec, 1.0); // Slow release
    } else if (type === 'pluck') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2 * vol, now + 0.05); // Fast attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec); // Exponential decay
    } else if (type === 'bass') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 * vol, now + 0.5);
      gain.gain.setTargetAtTime(0, now + durationSec, 0.5);
    }

    // Connect instrument to effects & dry master
    osc.connect(gain);
    gain.connect(this.masterGain!);
    gain.connect(this.reverbNode!);
    if (type === 'pluck') {
       gain.connect(this.delayNode!); // Plucks get delayed
    }

    osc.start(now);
    osc.stop(now + durationSec + 4.0); // Extra time for release tail
    
    this.activeOscillators.add(osc);
    osc.onended = () => this.activeOscillators.delete(osc);
  }
  public getCurrentTrack(): TrackId | null {
    return this.currentTrack;
  }

  public fadeToTrack(trackId: TrackId | null, durationSec: number = 3) {
    this.initContext();
    if (!this.ctx) return;
    if (this.isMuted) {
      if (trackId) this.playTrack(trackId);
      else this.stopTrack();
      return;
    }

    if (this.currentTrack === trackId && this.playing) return;

    if (this.masterGain) {
      const now = this.ctx.currentTime;
      // Fade out
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + durationSec);

      const newVol = useERStore.getState().musicVolume;
      setTimeout(() => {
        this.stopTrack();
        if (trackId) {
           this.playTrack(trackId);
           // Fade back in
           if (this.masterGain && this.ctx) {
             const startNow = this.ctx.currentTime;
             this.masterGain.gain.cancelScheduledValues(startNow);
             this.masterGain.gain.setValueAtTime(0.001, startNow);
             this.masterGain.gain.linearRampToValueAtTime(newVol, startNow + durationSec);
           }
        }
      }, durationSec * 1000);
    } else {
       if (trackId) this.playTrack(trackId);
       else this.stopTrack();
    }
  }
  public playTrack(trackId: TrackId) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    
    this.stopTrack();
    this.currentTrack = trackId;
    this.playing = true;
    this.trackStep = 0;

    this.runSequencer();
  }

  public stopTrack() {
    this.playing = false;
    this.currentTrack = null;
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    this.activeOscillators.clear();
  }

  // Define scales (MIDI note numbers, offset by root)
  // C4 is 60
  private scales = {
    majorPenta: [0, 2, 4, 7, 9], // e.g. C D E G A
    dorian: [0, 2, 3, 5, 7, 9, 10], // e.g. D E F G A B C
    lydian: [0, 2, 4, 6, 7, 9, 11], // e.g. G A B C# D E F#
    minor: [0, 2, 3, 5, 7, 8, 10], // e.g. A B C D E F G
    major: [0, 2, 4, 5, 7, 9, 11], // e.g. F G A Bb C D E
    phrygian: [0, 1, 3, 5, 7, 8, 10] // e.g. E F G A B C D
  };

  private runSequencer() {
    if (!this.playing || !this.currentTrack) return;

    let nextTickMs = 1000;
    
    // Track 1: Sunrise (C Major Pentatonic, sparse)
    if (this.currentTrack === 'sunrise') {
      nextTickMs = 2000 + Math.random() * 2000;
      const root = 60; // C4
      const scale = this.scales.majorPenta;
      const note = root + scale[Math.floor(Math.random() * scale.length)] + (Math.random() > 0.5 ? -12 : 0);
      
      this.playSynth(note, 'pad', 4.0, 0.6);
      if (Math.random() > 0.7) {
        this.playSynth(root - 24, 'bass', 6.0, 0.4); // C2 bass
      }
      if (Math.random() > 0.8) {
        this.playSynth(note + 12, 'pluck', 1.0, 0.3); // High pluck
      }
    }
    
    // Track 2: Deep Mines (D Dorian, eerie)
    else if (this.currentTrack === 'deep_mines') {
      nextTickMs = 3000 + Math.random() * 3000;
      const root = 62; // D4
      const scale = this.scales.dorian;
      
      if (Math.random() > 0.4) {
        const note = root + scale[Math.floor(Math.random() * scale.length)];
        this.playSynth(note, 'pad', 6.0, 0.5);
      }
      if (this.trackStep % 4 === 0) {
        this.playSynth(root - 24, 'bass', 8.0, 0.7); // Low D drone
      }
      if (Math.random() > 0.85) {
        const note = root + scale[Math.floor(Math.random() * scale.length)] + 12;
        this.playSynth(note, 'pluck', 0.5, 0.8); // Eerie bell
      }
    }
    
    // Track 3: First House (G Lydian, nostalgic)
    else if (this.currentTrack === 'first_house') {
      nextTickMs = 1500;
      const root = 67; // G4
      const scale = this.scales.lydian;
      
      // Simple arpeggiated movement
      const noteIndex = this.trackStep % scale.length;
      const note = root + scale[noteIndex];
      
      this.playSynth(note, 'pluck', 2.0, 0.4);
      if (this.trackStep % 8 === 0) {
        this.playSynth(root - 12, 'pad', 12.0, 0.5); // G3 chord base
      }
    }
    
    // Track 4: Nightfall (A Minor, slow swells)
    else if (this.currentTrack === 'nightfall') {
      nextTickMs = 4000;
      const root = 57; // A3
      const scale = this.scales.minor;
      
      const chords = [
        [0, 3, 7], // Am
        [5, 8, 12], // Dm (relative)
        [7, 10, 14], // Em
        [0, 3, 7]  // Am
      ];
      const chord = chords[Math.floor(this.trackStep / 2) % chords.length];
      
      chord.forEach(interval => {
        this.playSynth(root + interval, 'pad', 5.0, 0.3);
      });
      
      if (Math.random() > 0.6) {
        const highNote = root + scale[Math.floor(Math.random() * scale.length)] + 12;
        setTimeout(() => this.playSynth(highNote, 'pluck', 2.0, 0.5), Math.random() * 2000);
      }
    }
    
    // Track 5: Wandering (F Major, generative arpeggios)
    else if (this.currentTrack === 'wandering') {
      nextTickMs = 800; // Faster tempo
      const root = 65; // F4
      const scale = this.scales.major;
      
      const note = root + scale[Math.floor(Math.random() * scale.length)] - 12;
      this.playSynth(note, 'pluck', 1.0, 0.5);
      
      if (this.trackStep % 16 === 0) {
        this.playSynth(root - 24, 'pad', 8.0, 0.4);
      }
    }
    
    // Track 6: The Void (E Phrygian, detuned pads)
    else if (this.currentTrack === 'the_void') {
      nextTickMs = 5000 + Math.random() * 4000;
      const root = 52; // E3
      const scale = this.scales.phrygian;
      
      const note = root + scale[Math.floor(Math.random() * scale.length)];
      
      // Detuned dual pad
      this.playSynth(note, 'pad', 8.0, 0.4);
      // Play a slightly out of tune note to create an eerie beating effect
      const freq = this.midiToFreq(note) + 2; 
      if (this.ctx && !this.isMuted) {
         const osc = this.ctx.createOscillator();
         const gain = this.ctx.createGain();
         osc.type = 'triangle';
         osc.frequency.value = freq;
         gain.gain.setValueAtTime(0, this.ctx.currentTime);
         gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 2.0);
         gain.gain.setTargetAtTime(0, this.ctx.currentTime + 8.0, 1.0);
         osc.connect(gain);
         gain.connect(this.masterGain!);
         gain.connect(this.reverbNode!);
         osc.start();
         osc.stop(this.ctx.currentTime + 12);
         this.activeOscillators.add(osc);
      }
      
      if (this.trackStep % 2 === 0) {
        this.playSynth(root - 12, 'bass', 10.0, 0.6);
      }
    }
    
    // Track 7: Home (C Major, structured chords)
    else if (this.currentTrack === 'home') {
      nextTickMs = 2500;
      const root = 60; // C4
      
      // I - IV - vi - V
      const chords = [
        [0, 4, 7], // C
        [5, 9, 12], // F
        [9, 12, 16], // Am
        [7, 11, 14] // G
      ];
      const chord = chords[this.trackStep % chords.length];
      
      chord.forEach(interval => {
        this.playSynth(root + interval - 12, 'pad', 3.0, 0.3);
      });
      
      // Melody pluck playing chord tones randomly
      const melodyNote = root + chord[Math.floor(Math.random() * chord.length)];
      setTimeout(() => this.playSynth(melodyNote, 'pluck', 1.0, 0.4), 500);
      setTimeout(() => this.playSynth(melodyNote + (Math.random()>0.5?12:0), 'pluck', 1.0, 0.2), 1500);
    }
    
    this.trackStep++;
    this.sequenceTimer = setTimeout(() => this.runSequencer(), nextTickMs);
  }
}

export const music = new MusicEngine();
