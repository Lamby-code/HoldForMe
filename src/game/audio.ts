const MUSIC_STORAGE_KEY = 'holdforme_music_enabled_v1';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// 130 BPM sleek indie-electro / future-jazz groove with subtle 16th-note shuffle
// Full 40-bar evolving song structure (~74 seconds seamless loop, 640 steps)
const BPM = 130;
const BASE_STEP_SEC = 60 / BPM / 4; // ~0.1154s
const SWING_AMOUNT = 0.08;
const TOTAL_STEPS = 640; // 40 bars x 16 steps

type SectionKind = 'verse' | 'chorus' | 'bridge_soft' | 'bridge_build' | 'solo' | 'finale';

interface BarHarmony {
  bass: number;
  pad: readonly number[];
  arp: readonly number[];
  section: SectionKind;
  hasFill?: boolean;
  hasRiser?: boolean;
}

// 40-Bar Journey (Key of F minor / Ab major):
// 0-7:   Section A - Sparkling Hotel Lobby (Verse 1)
// 8-15:  Section B - Good Karma Lift (Chorus 1)
// 16-19: Section C1 - Dreamy Half-Time Lounge Breakdown (Bridge Soft)
// 20-23: Section C2 - Jazzy Lift & Snare Riser (Bridge Build)
// 24-31: Section D - Expressive Chiptune-Jazz Synth Solo
// 32-39: Section E - Grand Good Karma Finale Chorus (with harmony chimes & choir shimmer)
const BARS: readonly BarHarmony[] = [
  // --- SECTION A: Sparkling Hotel Lobby (Bars 0-7) ---
  { section: 'verse', bass: 41, pad: [53, 56, 60, 63, 67], arp: [65, 68, 72, 75, 79, 75, 72, 68] }, // 0: Fm9
  { section: 'verse', bass: 40, pad: [52, 56, 60, 65, 67], arp: [64, 68, 72, 77, 79, 77, 72, 68] }, // 1: Fm(maj7)/E
  { section: 'verse', bass: 39, pad: [51, 56, 60, 63, 67], arp: [63, 68, 72, 75, 79, 75, 72, 68] }, // 2: Fm7/Eb
  { section: 'verse', bass: 38, pad: [50, 56, 60, 65], arp: [62, 68, 72, 77, 80, 77, 72, 68] }, // 3: Dm7b5
  { section: 'verse', bass: 37, pad: [49, 53, 56, 60, 63], arp: [65, 68, 72, 75, 77, 75, 72, 68] }, // 4: Dbmaj9
  { section: 'verse', bass: 36, pad: [48, 55, 58, 63, 67], arp: [63, 67, 70, 75, 79, 75, 70, 67] }, // 5: Cm7
  { section: 'verse', bass: 34, pad: [46, 53, 56, 60, 65], arp: [65, 68, 72, 77, 80, 77, 72, 68] }, // 6: Bbm9
  { section: 'verse', bass: 36, pad: [48, 52, 56, 58, 61], arp: [64, 68, 70, 73, 76, 73, 70, 68], hasFill: true, hasRiser: true }, // 7: C7b9#5

  // --- SECTION B: Good Karma Chorus 1 (Bars 8-15) ---
  { section: 'chorus', bass: 37, pad: [49, 53, 56, 60, 63], arp: [68, 72, 75, 77, 80, 77, 75, 72] }, // 8: Dbmaj9
  { section: 'chorus', bass: 39, pad: [51, 55, 58, 60, 65], arp: [67, 70, 72, 77, 79, 77, 72, 70] }, // 9: Eb13
  { section: 'chorus', bass: 36, pad: [48, 55, 58, 62, 63], arp: [67, 70, 74, 75, 79, 75, 74, 70] }, // 10: Cm9
  { section: 'chorus', bass: 41, pad: [53, 56, 60, 63, 67], arp: [68, 72, 75, 79, 80, 79, 75, 72] }, // 11: Fm9
  { section: 'chorus', bass: 34, pad: [46, 53, 56, 60, 65], arp: [65, 68, 72, 77, 80, 77, 72, 68] }, // 12: Bbm9
  { section: 'chorus', bass: 36, pad: [48, 52, 56, 58, 63], arp: [64, 67, 70, 75, 76, 75, 70, 67] }, // 13: C7#9#5
  { section: 'chorus', bass: 37, pad: [49, 53, 58, 60, 63], arp: [68, 72, 75, 79, 82, 79, 75, 72] }, // 14: Dbmaj9 -> Eb
  { section: 'chorus', bass: 41, pad: [53, 56, 60, 63, 67], arp: [68, 72, 75, 77, 80, 77, 75, 72], hasFill: true }, // 15: Fm9

  // --- SECTION C1: Dreamy Jazzy Lounge Breakdown (Bars 16-19) ---
  { section: 'bridge_soft', bass: 34, pad: [46, 53, 56, 60, 65], arp: [68, 72, 77, 80, 84, 80, 77, 72] }, // 16: Bbm9
  { section: 'bridge_soft', bass: 39, pad: [51, 55, 58, 60, 65], arp: [67, 70, 75, 79, 82, 79, 75, 70] }, // 17: Eb13
  { section: 'bridge_soft', bass: 44, pad: [56, 60, 63, 67, 70], arp: [68, 72, 75, 79, 84, 79, 75, 72] }, // 18: Abmaj9
  { section: 'bridge_soft', bass: 37, pad: [49, 53, 56, 60, 63], arp: [65, 68, 72, 77, 80, 77, 72, 68] }, // 19: Dbmaj9

  // --- SECTION C2: Jazzy Lift & Snare Build (Bars 20-23) ---
  { section: 'bridge_build', bass: 43, pad: [55, 58, 61, 65, 68], arp: [67, 70, 73, 77, 80, 77, 73, 70] }, // 20: Gm7b5
  { section: 'bridge_build', bass: 36, pad: [48, 52, 56, 58, 61], arp: [64, 67, 70, 73, 79, 73, 70, 67] }, // 21: C7b9
  { section: 'bridge_build', bass: 41, pad: [53, 56, 60, 63, 67], arp: [68, 72, 75, 79, 84, 79, 75, 72] }, // 22: Fm9
  { section: 'bridge_build', bass: 36, pad: [48, 52, 58, 61, 63], arp: [67, 70, 73, 76, 82, 79, 76, 73], hasFill: true, hasRiser: true }, // 23: C7alt build

  // --- SECTION D: Expressive Chiptune-Jazz Synth Solo (Bars 24-31) ---
  { section: 'solo', bass: 41, pad: [53, 56, 60, 63, 67], arp: [65, 68, 72, 75, 79, 75, 72, 68] }, // 24: Fm9
  { section: 'solo', bass: 40, pad: [52, 56, 60, 65, 67], arp: [64, 68, 72, 77, 79, 77, 72, 68] }, // 25: Fm(maj7)/E
  { section: 'solo', bass: 39, pad: [51, 56, 60, 63, 67], arp: [63, 68, 72, 75, 79, 75, 72, 68] }, // 26: Fm7/Eb
  { section: 'solo', bass: 38, pad: [50, 56, 60, 65], arp: [62, 68, 72, 77, 80, 77, 72, 68] }, // 27: Dm7b5
  { section: 'solo', bass: 37, pad: [49, 53, 56, 60, 63], arp: [68, 72, 75, 77, 80, 77, 75, 72] }, // 28: Dbmaj9
  { section: 'solo', bass: 39, pad: [51, 55, 58, 60, 65], arp: [67, 70, 72, 77, 82, 77, 72, 70] }, // 29: Eb13
  { section: 'solo', bass: 36, pad: [48, 55, 58, 62, 63], arp: [67, 70, 74, 75, 79, 75, 74, 70] }, // 30: Cm9
  { section: 'solo', bass: 36, pad: [48, 52, 56, 58, 63], arp: [64, 67, 70, 75, 79, 75, 70, 67], hasFill: true, hasRiser: true }, // 31: C7#9#5

  // --- SECTION E: Grand Good Karma Finale Chorus (Bars 32-39) ---
  { section: 'finale', bass: 37, pad: [49, 53, 56, 60, 63], arp: [68, 72, 75, 77, 80, 77, 75, 72] }, // 32: Dbmaj9
  { section: 'finale', bass: 39, pad: [51, 55, 58, 60, 65], arp: [67, 70, 72, 77, 79, 77, 72, 70] }, // 33: Eb13
  { section: 'finale', bass: 36, pad: [48, 55, 58, 62, 63], arp: [67, 70, 74, 75, 79, 75, 74, 70] }, // 34: Cm9
  { section: 'finale', bass: 41, pad: [53, 56, 60, 63, 67], arp: [68, 72, 75, 79, 80, 79, 75, 72] }, // 35: Fm9
  { section: 'finale', bass: 34, pad: [46, 53, 56, 60, 65], arp: [65, 68, 72, 77, 80, 77, 72, 68] }, // 36: Bbm9
  { section: 'finale', bass: 36, pad: [48, 52, 56, 58, 63], arp: [64, 67, 70, 75, 76, 75, 70, 67] }, // 37: C7#9#5
  { section: 'finale', bass: 37, pad: [49, 53, 58, 60, 63], arp: [68, 72, 75, 79, 82, 79, 75, 72] }, // 38: Dbmaj9 -> Eb
  { section: 'finale', bass: 41, pad: [53, 56, 60, 63, 67], arp: [72, 75, 77, 80, 84, 80, 77, 75], hasFill: true }, // 39: Fm9 graceful return
];

// Main Melody across all 40 bars: step -> [midi, durationSteps, optional slideFromMidi]
const LEAD_NOTES: Record<number, [number, number, number?]> = {
  // === SECTION A: Sparkling Hotel Lobby (Bars 0-7) ===
  0: [72, 2.5], 3: [75, 1.5], 6: [77, 3.0, 75], 10: [79, 2.0], 12: [80, 3.0],
  16: [79, 3.0, 80], 20: [76, 2.0], 22: [77, 2.5], 26: [79, 2.0], 28: [76, 3.0],
  32: [75, 3.0, 76], 36: [72, 2.0], 38: [75, 2.0], 40: [79, 3.5], 44: [77, 3.0],
  48: [74, 3.0, 75], 52: [77, 2.0], 54: [80, 3.5], 58: [79, 2.0], 60: [77, 3.0],
  64: [75, 3.0, 77], 68: [72, 2.0], 70: [75, 2.5], 74: [77, 2.5], 76: [80, 3.5],
  80: [79, 3.0, 80], 84: [75, 2.0], 86: [74, 2.0], 88: [75, 3.5], 92: [72, 3.0],
  96: [77, 2.5, 75], 100: [75, 2.0], 102: [72, 2.0], 104: [75, 3.0], 108: [77, 3.0],
  112: [76, 3.5, 77], 116: [79, 2.0], 118: [82, 2.5], 122: [80, 2.0], 124: [79, 3.0],

  // === SECTION B: Good Karma Chorus 1 (Bars 8-15) ===
  128: [80, 3.0, 79], 132: [84, 2.0], 134: [82, 2.5], 138: [80, 2.0], 140: [79, 3.0],
  144: [82, 3.0, 80], 148: [84, 2.0], 150: [87, 3.5], 154: [84, 2.0], 156: [82, 3.0],
  160: [84, 3.0, 82], 164: [79, 2.0], 166: [82, 2.5], 170: [80, 2.5], 172: [79, 3.0],
  176: [80, 3.5, 79], 180: [77, 2.0], 182: [75, 2.0], 184: [77, 3.5], 188: [79, 3.0],
  192: [80, 2.5, 79], 196: [84, 2.0], 198: [85, 3.0], 202: [84, 2.0], 204: [80, 3.0],
  208: [79, 3.0, 80], 212: [82, 2.0], 214: [84, 2.5], 218: [82, 2.0], 220: [79, 3.0],
  224: [80, 2.5], 228: [82, 2.5], 232: [84, 3.0, 82], 236: [87, 3.0],
  240: [84, 3.5, 87], 244: [80, 2.0], 246: [79, 2.5], 250: [77, 3.0],

  // === SECTION C: Dreamy Lounge Bridge (Bars 16-23, spacious wistful vibraphone-flute phrase) ===
  256: [77, 4.5, 75], 262: [80, 2.5], 266: [84, 4.0],
  272: [82, 4.0, 84], 278: [79, 2.5], 282: [75, 4.0],
  288: [79, 4.5, 77], 294: [80, 2.5], 298: [84, 4.5],
  304: [80, 5.0, 82], 312: [77, 3.5], 316: [75, 3.0],
  320: [77, 3.0], 324: [80, 2.5], 328: [82, 3.5, 80], 332: [80, 2.5],
  336: [79, 3.5, 80], 340: [76, 2.0], 342: [79, 2.5], 346: [82, 3.5], 350: [80, 2.0],
  352: [80, 3.5, 79], 356: [84, 2.5], 360: [87, 3.5], 364: [84, 2.5],
  368: [82, 2.0], 370: [84, 2.0], 372: [85, 2.0], 374: [84, 2.0], 376: [82, 2.5], 380: [79, 3.0],

  // === SECTION D: Expressive Chiptune-Jazz Synth Solo (Bars 24-31, agile & playful!) ===
  // Bar 24 (Fm9)
  384: [77, 1.5, 75], 386: [80, 1.2], 388: [84, 1.8], 390: [82, 1.2], 392: [80, 1.5], 394: [79, 1.2], 396: [77, 1.6], 398: [75, 1.4],
  // Bar 25 (Fm/E)
  400: [76, 2.0, 75], 403: [79, 1.5], 406: [84, 2.0], 409: [82, 1.2], 410: [80, 1.4], 412: [79, 2.0], 414: [76, 1.5],
  // Bar 26 (Fm/Eb)
  416: [75, 1.5], 418: [77, 1.2], 420: [79, 1.5], 422: [82, 1.8, 81], 424: [84, 2.0], 427: [87, 2.2], 430: [84, 1.6],
  // Bar 27 (Dm7b5)
  432: [86, 2.0, 87], 435: [84, 1.5], 438: [80, 1.8], 440: [77, 1.5], 442: [80, 1.5], 444: [82, 2.0], 446: [80, 1.5],
  // Bar 28 (Dbmaj9 - joyful climb)
  448: [84, 1.8, 82], 450: [80, 1.2], 452: [77, 1.4], 454: [80, 1.5], 456: [84, 1.8], 458: [87, 1.5], 460: [89, 2.5, 87],
  // Bar 29 (Eb13)
  464: [87, 1.8, 89], 467: [84, 1.4], 470: [82, 1.8], 472: [84, 1.4], 474: [87, 1.8], 476: [86, 1.5], 478: [84, 1.5],
  // Bar 30 (Cm9)
  480: [82, 2.0, 84], 483: [79, 1.4], 486: [75, 1.6], 488: [79, 1.4], 490: [82, 1.6], 492: [84, 2.0], 494: [82, 1.5],
  // Bar 31 (C7#9#5 - cheeky jazz turnaround into Finale)
  496: [83, 1.5, 82], 498: [82, 1.2], 500: [79, 1.5], 502: [76, 1.4], 504: [79, 1.4], 506: [82, 1.5], 508: [84, 1.5], 510: [87, 1.8],

  // === SECTION E: Grand Good Karma Finale Chorus (Bars 32-39) ===
  512: [80, 3.0, 79], 516: [84, 2.0], 518: [82, 2.5], 522: [80, 2.0], 524: [79, 3.0],
  528: [82, 3.0, 80], 532: [84, 2.0], 534: [87, 3.5], 538: [84, 2.0], 540: [82, 3.0],
  544: [84, 3.0, 82], 548: [79, 2.0], 550: [82, 2.5], 554: [80, 2.5], 556: [79, 3.0],
  560: [80, 3.5, 79], 564: [77, 2.0], 566: [75, 2.0], 568: [77, 3.5], 572: [79, 3.0],
  576: [80, 2.5, 79], 580: [84, 2.0], 582: [85, 3.0], 586: [84, 2.0], 588: [80, 3.0],
  592: [79, 3.0, 80], 596: [82, 2.0], 598: [84, 2.5], 602: [82, 2.0], 604: [79, 3.0],
  608: [80, 2.5], 612: [82, 2.5], 616: [84, 3.0, 82], 620: [87, 3.5],
  624: [89, 3.0, 87], 628: [84, 2.0], 630: [80, 2.5], 634: [79, 2.5], 637: [75, 2.5],
};

// Sparkling upper-register counter-chime sparkles in Chorus / Solo / Finale
const COUNTER_SPARKLES: Record<number, number> = {
  // Chorus 1 accents
  142: 92, 143: 91, 158: 94, 159: 91, 190: 92, 191: 89, 238: 94, 239: 96,
  // Bridge dreamy vibraphone chimes
  269: 92, 270: 89, 271: 87, 301: 91, 302: 89, 303: 87, 365: 92, 366: 94, 367: 96,
  // Finale cascading sparkles
  526: 92, 527: 96, 542: 94, 543: 96, 558: 91, 559: 94, 590: 96, 591: 92,
  622: 96, 623: 94, 636: 92, 637: 89, 638: 87, 639: 84,
};

class SoundEffects {
  private ctx: AudioContext | null = null;
  private masterComp: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private sidechainGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbWet: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private schedulerId: number | null = null;
  private nextStepTime = 0;
  private currentStep = 0;
  private musicRunning = false;
  private musicDucked = false;

  public muted = false;
  public musicEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MUSIC_STORAGE_KEY);
        if (stored === 'false') {
          this.musicEnabled = false;
        }
      } catch {
        // ignore storage restrictions
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createStudioReverbBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 1.4;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, 2.65);
        const white = Math.random() * 2 - 1;
        lp = lp * 0.72 + white * 0.28;
        data[i] = lp * env * 0.65;
      }
    }
    return buffer;
  }

  private ensureMusicBus(ctx: AudioContext): GainNode {
    if (!this.masterComp) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-14, ctx.currentTime);
      comp.knee.setValueAtTime(18, ctx.currentTime);
      comp.ratio.setValueAtTime(3.6, ctx.currentTime);
      comp.attack.setValueAtTime(0.008, ctx.currentTime);
      comp.release.setValueAtTime(0.14, ctx.currentTime);
      comp.connect(ctx.destination);
      this.masterComp = comp;
    }

    if (!this.musicGain) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.connect(this.masterComp);
      this.musicGain = gain;
    }

    if (!this.musicFilter) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(9800, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
      filter.connect(this.musicGain);
      this.musicFilter = filter;
    }

    if (!this.sidechainGain) {
      const sc = ctx.createGain();
      sc.gain.setValueAtTime(1, ctx.currentTime);
      sc.connect(this.musicFilter);
      this.sidechainGain = sc;
    }

    if (!this.reverbNode) {
      const convolver = ctx.createConvolver();
      convolver.buffer = this.createStudioReverbBuffer(ctx);
      const wet = ctx.createGain();
      wet.gain.setValueAtTime(0.32, ctx.currentTime);
      convolver.connect(wet);
      wet.connect(this.musicFilter);
      this.reverbNode = convolver;
      this.reverbWet = wet;
    }

    if (!this.delayNode) {
      const delay = ctx.createDelay(1.0);
      delay.delayTime.setValueAtTime(BASE_STEP_SEC * 3, ctx.currentTime);

      const fb = ctx.createGain();
      fb.gain.setValueAtTime(0.28, ctx.currentTime);

      const dFilter = ctx.createBiquadFilter();
      dFilter.type = 'lowpass';
      dFilter.frequency.setValueAtTime(3200, ctx.currentTime);

      const wet = ctx.createGain();
      wet.gain.setValueAtTime(0.24, ctx.currentTime);

      delay.connect(dFilter);
      dFilter.connect(fb);
      fb.connect(delay);
      dFilter.connect(wet);
      wet.connect(this.musicFilter);
      if (this.reverbNode) {
        wet.connect(this.reverbNode);
      }

      this.delayNode = delay;
      this.delayFeedback = fb;
      this.delayWet = wet;
    }

    return this.musicGain;
  }

  private ensureNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const length = Math.floor(ctx.sampleRate * 1.2);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  private getTargetMusicVolume(): number {
    if (!this.musicEnabled || this.muted) return 0.0001;
    return this.musicDucked ? 0.14 : 0.3;
  }

  private updateMusicGain(rampSeconds = 0.25) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const target = this.getTargetMusicVolume();
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(Math.max(0.0001, this.musicGain.gain.value), now);
    this.musicGain.gain.exponentialRampToValueAtTime(target, now + rampSeconds);
  }

  startMusic() {
    if (!this.musicEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.ensureMusicBus(ctx);
    this.updateMusicGain(0.35);

    if (this.musicRunning) return;
    this.musicRunning = true;
    this.nextStepTime = ctx.currentTime + 0.06;

    this.schedulerId = window.setInterval(() => {
      this.scheduleAhead();
    }, 25);
  }

  stopMusic() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.musicRunning = false;
    this.updateMusicGain(0.18);
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    try {
      localStorage.setItem(MUSIC_STORAGE_KEY, String(enabled));
    } catch {
      // ignore storage errors
    }
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  setMusicDucked(ducked: boolean) {
    if (this.musicDucked === ducked) return;
    this.musicDucked = ducked;
    if (this.musicFilter && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicFilter.frequency.setTargetAtTime(ducked ? 1600 : 9800, now, 0.09);
    }
    if (this.reverbWet && this.ctx) {
      this.reverbWet.gain.setTargetAtTime(ducked ? 0.42 : 0.32, this.ctx.currentTime, 0.09);
    }
    if (this.delayWet && this.delayFeedback && this.ctx) {
      const now = this.ctx.currentTime;
      this.delayWet.gain.setTargetAtTime(ducked ? 0.16 : 0.24, now, 0.09);
      this.delayFeedback.gain.setTargetAtTime(ducked ? 0.2 : 0.28, now, 0.09);
    }
    if (this.musicRunning) {
      this.updateMusicGain(0.2);
    }
  }

  private getStepDuration(step: number): number {
    return step % 2 === 0
      ? BASE_STEP_SEC * (1 + SWING_AMOUNT)
      : BASE_STEP_SEC * (1 - SWING_AMOUNT);
  }

  private scheduleAhead() {
    if (!this.ctx || !this.musicFilter || !this.musicRunning || !this.musicEnabled) return;
    if (this.ctx.state !== 'running') return;

    if (this.nextStepTime < this.ctx.currentTime - 0.2) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }

    const lookahead = 0.12;
    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.getStepDuration(this.currentStep);
      this.currentStep = (this.currentStep + 1) % TOTAL_STEPS;
    }
  }

  private triggerSidechainPump(time: number, depth = 0.32) {
    if (!this.sidechainGain) return;
    const g = this.sidechainGain.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(1, time);
    g.linearRampToValueAtTime(depth, time + 0.014);
    g.exponentialRampToValueAtTime(1.0, time + BASE_STEP_SEC * 2.8);
  }

  private connectWithOptionalPan(
    ctx: AudioContext,
    source: AudioNode,
    dest: AudioNode,
    pan: number
  ) {
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, ctx.currentTime);
      source.connect(panner);
      panner.connect(dest);
    } else {
      source.connect(dest);
    }
  }

  /**
   * Shimmering hotel-lobby music-box / FM bell pluck with subtle stereo drift.
   */
  private playBellPluck(
    ctx: AudioContext,
    dest: AudioNode,
    midi: number,
    time: number,
    velocity = 1,
    pan = 0
  ) {
    const freq = midiToFreq(midi);
    const dur = BASE_STEP_SEC * 3.4;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2, time);

    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, time);
    g1.gain.linearRampToValueAtTime(0.072 * velocity, time + 0.006);
    g1.gain.exponentialRampToValueAtTime(0.0008, time + dur);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, time);
    g2.gain.linearRampToValueAtTime(0.022 * velocity, time + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.0005, time + 0.11);

    osc1.connect(g1);
    osc2.connect(g2);
    this.connectWithOptionalPan(ctx, g1, dest, pan);
    this.connectWithOptionalPan(ctx, g2, dest, pan);

    if (this.reverbNode) g1.connect(this.reverbNode);
    if (this.delayNode) g1.connect(this.delayNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur + 0.03);
    osc2.stop(time + 0.14);
  }

  /**
   * Warm syncopated Rhodes electric-piano chord stab for jazzy lounge bounce.
   */
  private playRhodesStab(
    ctx: AudioContext,
    dest: AudioNode,
    notes: readonly number[],
    time: number,
    durSec: number,
    velocity = 0.8
  ) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(850, time + durSec);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(0.085 * velocity, time + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0008, time + durSec + 0.04);

    filter.connect(env);
    env.connect(dest);
    if (this.reverbNode) env.connect(this.reverbNode);

    const perVoice = 1 / Math.sqrt(notes.length);
    for (const midi of notes) {
      const freq = midiToFreq(midi);
      const osc = ctx.createOscillator();
      const vGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      vGain.gain.setValueAtTime(perVoice, time);
      osc.connect(vGain);
      vGain.connect(filter);
      osc.start(time);
      osc.stop(time + durSec + 0.06);
    }
  }

  /**
   * Lush sidechained supersaw / warm pad chord.
   */
  private playLushPad(
    ctx: AudioContext,
    dest: AudioNode,
    notes: readonly number[],
    time: number,
    durSec: number,
    intensity: 'soft' | 'bright' | 'finale'
  ) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(intensity === 'finale' ? 1.5 : 1.1, time);
    const startCut = intensity === 'finale' ? 3400 : intensity === 'bright' ? 2700 : 1250;
    const endCut = intensity === 'finale' ? 1750 : intensity === 'bright' ? 1450 : 700;
    filter.frequency.setValueAtTime(startCut, time);
    filter.frequency.exponentialRampToValueAtTime(endCut, time + durSec);

    const env = ctx.createGain();
    const peak = intensity === 'finale' ? 0.145 : intensity === 'bright' ? 0.125 : 0.08;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(peak, time + 0.06);
    env.gain.setValueAtTime(peak * 0.85, time + durSec * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0008, time + durSec + 0.08);

    filter.connect(env);
    env.connect(dest);
    if (this.reverbNode) env.connect(this.reverbNode);

    const perVoice = 1 / Math.sqrt(notes.length);
    for (const midi of notes) {
      const freq = midiToFreq(midi);
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = intensity === 'soft' ? 'triangle' : 'sawtooth';
      oscB.type = 'sawtooth';
      oscA.frequency.setValueAtTime(freq * 0.9965, time);
      oscB.frequency.setValueAtTime(freq * 1.0035, time);

      const vGain = ctx.createGain();
      vGain.gain.setValueAtTime(perVoice * 0.55, time);

      oscA.connect(vGain);
      oscB.connect(vGain);
      vGain.connect(filter);

      oscA.start(time);
      oscB.start(time);
      oscA.stop(time + durSec + 0.1);
      oscB.stop(time + durSec + 0.1);
    }
  }

  /**
   * Dreamy airy vocal-formant "ooh/aah" choir shimmer pad for Solo & Finale warmth.
   */
  private playChoirShimmer(
    ctx: AudioContext,
    dest: AudioNode,
    notes: readonly number[],
    time: number,
    durSec: number
  ) {
    // Bandpass formant filter centered around warm "ooh/aah" vocal resonance (~1150 Hz)
    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(1150, time);
    formant.Q.setValueAtTime(2.4, time);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(0.065, time + 0.25);
    env.gain.setValueAtTime(0.055, time + durSec * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0008, time + durSec + 0.15);

    formant.connect(env);
    env.connect(dest);
    if (this.reverbNode) env.connect(this.reverbNode);

    // Use upper 3 notes shifted +12 for airy angelic choir glow
    const choirNotes = notes.slice(-3);
    const perVoice = 1 / Math.sqrt(choirNotes.length);
    for (const midi of choirNotes) {
      const freq = midiToFreq(midi + 12);
      const osc = ctx.createOscillator();
      const vGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      vGain.gain.setValueAtTime(perVoice * 0.5, time);
      osc.connect(vGain);
      vGain.connect(formant);
      osc.start(time);
      osc.stop(time + durSec + 0.18);
    }
  }

  /**
   * Warm deep gliding sub-Moog synth bass.
   */
  private playWarmBass(
    ctx: AudioContext,
    dest: AudioNode,
    midi: number,
    time: number,
    durSec: number,
    octaveJump = false,
    punchy = false
  ) {
    const freq = midiToFreq(octaveJump ? midi + 12 : midi);

    const sub = ctx.createOscillator();
    const body = ctx.createOscillator();
    sub.type = 'sine';
    body.type = punchy ? 'sawtooth' : 'triangle';
    sub.frequency.setValueAtTime(freq, time);
    body.frequency.setValueAtTime(freq * (punchy ? 1 : 2), time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(punchy ? 2.4 : 0.8, time);
    filter.frequency.setValueAtTime(octaveJump ? 860 : punchy ? 720 : 460, time);
    filter.frequency.exponentialRampToValueAtTime(210, time + durSec);

    const gain = ctx.createGain();
    const peak = octaveJump ? 0.19 : 0.27;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + durSec);

    const bodyMix = ctx.createGain();
    bodyMix.gain.setValueAtTime(punchy ? 0.42 : 0.32, time);

    sub.connect(filter);
    body.connect(bodyMix);
    bodyMix.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    sub.start(time);
    body.start(time);
    sub.stop(time + durSec + 0.02);
    body.stop(time + durSec + 0.02);
  }

  /**
   * Sweet gliding indie-electro lead (adapts timbre by section: flute-bell, chorus supersynth, solo jazz-chip, or finale).
   */
  private playLead(
    ctx: AudioContext,
    dest: AudioNode,
    midi: number,
    time: number,
    durSec: number,
    section: SectionKind,
    slideFrom?: number
  ) {
    const targetFreq = midiToFreq(midi);
    const startFreq = slideFrom !== undefined ? midiToFreq(slideFrom) : targetFreq;
    const isSolo = section === 'solo';
    const isBig = section === 'chorus' || section === 'finale';
    const isSoft = section === 'bridge_soft';

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = isSolo ? 'square' : 'triangle';
    osc2.type = isBig ? 'sawtooth' : isSolo ? 'triangle' : 'sine';

    osc1.frequency.setValueAtTime(startFreq, time);
    osc2.frequency.setValueAtTime(startFreq * (isBig ? 1.0035 : isSolo ? 0.997 : 2.0), time);
    if (slideFrom !== undefined) {
      const glideTime = isSolo ? 0.04 : 0.055;
      osc1.frequency.exponentialRampToValueAtTime(targetFreq, time + glideTime);
      osc2.frequency.exponentialRampToValueAtTime(
        targetFreq * (isBig ? 1.0035 : isSolo ? 0.997 : 2.0),
        time + glideTime
      );
    }

    if (durSec > 0.22) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(isSolo ? 6.2 : 5.5, time);
      lfoGain.gain.setValueAtTime(0.001, time);
      lfoGain.gain.linearRampToValueAtTime(targetFreq * 0.006, time + 0.13);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfo.start(time);
      lfo.stop(time + durSec + 0.03);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(
      isSolo ? 3800 : isBig ? 3500 : isSoft ? 2100 : 2600,
      time
    );
    filter.Q.setValueAtTime(isSolo ? 2.1 : 1.1, time);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(isBig ? 0.3 : isSolo ? 0.45 : 0.16, time);

    const env = ctx.createGain();
    const peak = isSolo ? 0.095 : isBig ? 0.125 : isSoft ? 0.095 : 0.11;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(peak, time + 0.014);
    env.gain.setValueAtTime(peak * 0.82, time + durSec * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0008, time + durSec + 0.04);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(env);
    env.connect(dest);

    if (this.reverbNode) env.connect(this.reverbNode);
    if (this.delayNode) env.connect(this.delayNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + durSec + 0.06);
    osc2.stop(time + durSec + 0.06);

    // In the Grand Finale, gently double the melody with a shimmering crystalline octave chime
    if (section === 'finale' && durSec >= BASE_STEP_SEC * 2.4) {
      this.playBellPluck(ctx, dest, midi + 12, time, 0.48, 0.25);
    }
  }

  /**
   * Smooth airy filtered white-noise riser sweep leading into big section transitions.
   */
  private playAirRiser(ctx: AudioContext, dest: AudioNode, time: number, durSec: number) {
    const src = ctx.createBufferSource();
    src.buffer = this.ensureNoiseBuffer(ctx);
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(2.5, time);
    bp.frequency.setValueAtTime(450, time);
    bp.frequency.exponentialRampToValueAtTime(4800, time + durSec);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.075, time + durSec * 0.92);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + durSec);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    if (this.reverbNode) gain.connect(this.reverbNode);

    src.start(time);
    src.stop(time + durSec + 0.02);
  }

  /**
   * Pitched electro-tom hit for crisp turnaround fills.
   */
  private playElectroTom(ctx: AudioContext, dest: AudioNode, startHz: number, time: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startHz, time);
    osc.frequency.exponentialRampToValueAtTime(startHz * 0.52, time + 0.09);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    osc.connect(gain);
    gain.connect(dest);
    if (this.reverbNode) gain.connect(this.reverbNode);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  /**
   * Crisp modern indie-electro breakbeat drums with dynamic section patterns and transition fills.
   */
  private playElectroDrums(
    ctx: AudioContext,
    dest: AudioNode,
    stepInBar: number,
    time: number,
    bar: BarHarmony
  ) {
    const { section, hasFill, hasRiser } = bar;
    const isBig = section === 'chorus' || section === 'solo' || section === 'finale';
    const isSoftBridge = section === 'bridge_soft';
    const isBuild = section === 'bridge_build';

    // Airy riser sweep across the final 8 steps of transition bars
    if (hasRiser && stepInBar === 8) {
      this.playAirRiser(ctx, dest, time, BASE_STEP_SEC * 8);
    }

    // Bridge build snare roll on bar 23 (steps 8..15)
    if (isBuild && hasFill && stepInBar >= 8) {
      const ramp = (stepInBar - 7) / 8;
      const src = ctx.createBufferSource();
      src.buffer = this.ensureNoiseBuffer(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1600 + ramp * 1400, time);
      bp.Q.setValueAtTime(1.4, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05 + ramp * 0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.065);
      src.connect(bp);
      bp.connect(gain);
      gain.connect(dest);
      src.start(time);
      src.stop(time + 0.075);
      return;
    }

    // Crisp pitched electro-tom turnaround fill on last 4 steps of fill bars
    if (hasFill && stepInBar >= 12) {
      const tomPitches = [250, 200, 155, 118];
      this.playElectroTom(ctx, dest, tomPitches[stepInBar - 12], time);
      if (stepInBar === 12) {
        // Snare accent on beat 4 before tom cascade
        const src = ctx.createBufferSource();
        src.buffer = this.ensureNoiseBuffer(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2200, time);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.14, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
        src.connect(bp);
        bp.connect(g);
        g.connect(dest);
        src.start(time);
        src.stop(time + 0.1);
      }
      return;
    }

    // Kick drum (drops out in dreamy soft bridge for huge dynamic contrast!)
    if (!isSoftBridge) {
      const isKick =
        stepInBar === 0 ||
        stepInBar === 6 ||
        stepInBar === 10 ||
        (isBig && stepInBar === 14) ||
        (section === 'finale' && stepInBar === 3);
      if (isKick) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(148, time);
        osc.frequency.exponentialRampToValueAtTime(44, time + 0.07);
        const peak = stepInBar === 0 || stepInBar === 10 ? 0.34 : 0.22;
        gain.gain.setValueAtTime(peak, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.13);

        if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10) {
          this.triggerSidechainPump(time, isBig ? 0.28 : 0.48);
        }
      }
    }

    // Snare / Rimshot / Finger-snap on beats 2 & 4 (half-time step 8 only during soft bridge!)
    const isSnareHit = isSoftBridge ? stepInBar === 8 : stepInBar === 4 || stepInBar === 12;
    if (isSnareHit) {
      const src = ctx.createBufferSource();
      src.buffer = this.ensureNoiseBuffer(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(isBig ? 2350 : 1850, time);
      bp.Q.setValueAtTime(1.2, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isBig ? 0.16 : isSoftBridge ? 0.08 : 0.11, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + (isBig ? 0.12 : 0.075));
      src.connect(bp);
      bp.connect(gain);
      gain.connect(dest);
      if (this.reverbNode) gain.connect(this.reverbNode);
      src.start(time);
      src.stop(time + 0.14);

      const rim = ctx.createOscillator();
      const rGain = ctx.createGain();
      rim.type = 'triangle';
      rim.frequency.setValueAtTime(isBig ? 235 : 440, time);
      rim.frequency.exponentialRampToValueAtTime(isBig ? 130 : 240, time + 0.032);
      rGain.gain.setValueAtTime(isSoftBridge ? 0.085 : 0.11, time);
      rGain.gain.exponentialRampToValueAtTime(0.001, time + 0.042);
      rim.connect(rGain);
      rGain.connect(dest);
      rim.start(time);
      rim.stop(time + 0.05);
    }

    // Silky shuffled hi-hats / brushed lounge shaker
    const isOpenHat = !isSoftBridge && (stepInBar === 14 || (isBig && stepInBar === 6));
    const isClosedHat = isSoftBridge
      ? stepInBar % 4 === 2
      : stepInBar % 2 === 0 || stepInBar === 3 || stepInBar === 11 || stepInBar === 15;
    if (isOpenHat || isClosedHat) {
      const src = ctx.createBufferSource();
      src.buffer = this.ensureNoiseBuffer(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(isOpenHat ? 7200 : 9000, time);
      const gain = ctx.createGain();
      const dur = isOpenHat ? 0.095 : 0.022;
      const peak = isOpenHat ? 0.05 : isSoftBridge ? 0.024 : stepInBar % 4 === 2 ? 0.034 : 0.018;
      gain.gain.setValueAtTime(peak, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      src.connect(hp);
      hp.connect(gain);
      gain.connect(dest);
      src.start(time);
      src.stop(time + dur + 0.01);
    }
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.musicFilter || !this.sidechainGain) return;
    const ctx = this.ctx;
    const dryDest = this.musicFilter;
    const scDest = this.sidechainGain;

    const barIdx = Math.floor(step / 16);
    const stepInBar = step % 16;
    const bar = BARS[barIdx];
    const { section } = bar;

    // 1. Dynamic Modern Electro Drums & Transition Fills
    this.playElectroDrums(ctx, dryDest, stepInBar, time, bar);

    // 2. Lush Sidechained Supersaw / Warm Pads + Angelic Choir Shimmer in Solo & Finale
    if (stepInBar === 0) {
      const padIntensity =
        section === 'finale'
          ? 'finale'
          : section === 'chorus' || section === 'solo'
            ? 'bright'
            : 'soft';
      this.playLushPad(ctx, scDest, bar.pad, time, BASE_STEP_SEC * 15.2, padIntensity);

      if (section === 'solo' || section === 'finale') {
        this.playChoirShimmer(ctx, scDest, bar.pad, time, BASE_STEP_SEC * 15.0);
      }
    } else if ((section === 'chorus' || section === 'finale') && stepInBar === 6) {
      this.playLushPad(
        ctx,
        scDest,
        bar.pad,
        time,
        BASE_STEP_SEC * 9.0,
        section === 'finale' ? 'finale' : 'bright'
      );
    }

    // 3. Jazzy Syncopated Rhodes Chord Stabs (Verse, Bridge & Solo groove spice)
    const isRhodesStep =
      (section === 'bridge_soft' && (stepInBar === 0 || stepInBar === 6 || stepInBar === 12)) ||
      ((section === 'verse' || section === 'bridge_build' || section === 'solo') &&
        (stepInBar === 3 || stepInBar === 10));
    if (isRhodesStep) {
      this.playRhodesStab(
        ctx,
        scDest,
        bar.pad,
        time,
        BASE_STEP_SEC * (section === 'bridge_soft' ? 4.2 : 2.2),
        section === 'bridge_soft' ? 0.9 : 0.65
      );
    }

    // 4. Stereo-Drifting Music-Box / FM Bell Arpeggio
    if (stepInBar % 2 === 0) {
      const arpIdx = (stepInBar / 2) % bar.arp.length;
      const arpNote = bar.arp[arpIdx];
      const vel = stepInBar % 4 === 0 ? 1.0 : 0.72;
      const pan = Math.sin(step * 0.35) * 0.42;
      this.playBellPluck(ctx, scDest, arpNote, time, vel, pan);
    }

    // 5. Deep Warm Sub-Moog Bass (gentle sustained root in soft bridge; bouncy groove everywhere else)
    if (section === 'bridge_soft') {
      if (stepInBar === 0) {
        this.playWarmBass(ctx, dryDest, bar.bass, time, BASE_STEP_SEC * 14.5, false, false);
      }
    } else {
      const punchy = section === 'solo' || section === 'finale';
      if (stepInBar === 0) {
        this.playWarmBass(ctx, dryDest, bar.bass, time, BASE_STEP_SEC * 5.2, false, punchy);
      } else if (stepInBar === 6) {
        this.playWarmBass(ctx, dryDest, bar.bass, time, BASE_STEP_SEC * 3.5, false, punchy);
      } else if (stepInBar === 10) {
        this.playWarmBass(ctx, dryDest, bar.bass, time, BASE_STEP_SEC * 3.8, false, punchy);
      } else if (stepInBar === 14) {
        this.playWarmBass(ctx, dryDest, bar.bass, time, BASE_STEP_SEC * 1.6, true, punchy);
      } else if (section === 'solo' && stepInBar === 3) {
        this.playWarmBass(ctx, dryDest, bar.bass, time, BASE_STEP_SEC * 1.3, true, true);
      }
    }

    // 6. Expressive Main Lead / Chiptune-Jazz Solo
    const lead = LEAD_NOTES[step];
    if (lead) {
      const [midi, durSteps, slideFrom] = lead;
      this.playLead(ctx, dryDest, midi, time, durSteps * BASE_STEP_SEC, section, slideFrom);
    }

    // 7. Sparkling High-Register Counter-Chimes
    const sparkle = COUNTER_SPARKLES[step];
    if (sparkle !== undefined) {
      this.playBellPluck(ctx, dryDest, sparkle, time, 0.72, (step % 2 === 0 ? 1 : -1) * 0.5);
    }
  }

  private tone(freq: number, duration: number, type: OscillatorType, volume: number, endFreq?: number) {
    if (this.muted) return;
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
