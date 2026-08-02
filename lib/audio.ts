class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

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
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Envelope to avoid popping
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playClick() {
    this.playTone(800, 'square', 0.05, 0.05);
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

    // Arpeggio up
    const notes = [600, 800, 1200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.1, 0.05), i * 100);
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
}

export const audio = new AudioEngine();
