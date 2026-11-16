class SoundEffects {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType, volume: number, endFreq?: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  plateOn() {
    this.tone(520, 0.08, 'sine', 0.08, 660);
  }

  lapNext() {
    this.tone(330, 0.14, 'triangle', 0.09, 440);
  }

  death() {
    this.tone(220, 0.22, 'sawtooth', 0.08, 90);
  }

  win() {
    this.tone(440, 0.14, 'triangle', 0.08);
    setTimeout(() => this.tone(554.37, 0.14, 'triangle', 0.08), 80);
    setTimeout(() => this.tone(659.25, 0.24, 'triangle', 0.09), 160);
  }
}

export const sfx = new SoundEffects();
