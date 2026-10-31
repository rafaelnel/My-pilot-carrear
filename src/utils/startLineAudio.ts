import { MotorsportCategory } from '../types';

class StartLineAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private idleOsc1: OscillatorNode | null = null;
  private idleOsc2: OscillatorNode | null = null;
  private idleGain: GainNode | null = null;
  private idleFilter: BiquadFilterNode | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public stopAll(): void {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
      } catch {
        // ignore already stopped
      }
      try {
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
    this.idleOsc1 = null;
    this.idleOsc2 = null;
    this.idleGain = null;
    this.idleFilter = null;
  }

  /**
   * Starts subtle grid idle rumble when cars line up on the grid
   */
  public startGridIdle(volumePercent: number, category: MotorsportCategory = 'f1'): void {
    const ctx = this.ensureContext();
    if (!ctx || volumePercent <= 0) return;

    this.stopAll();

    const now = ctx.currentTime;
    const masterVol = Math.min(1, Math.max(0, volumePercent / 100)) * 0.22;
    const baseFreq = category === 'kart' ? 68 : category === 'f3' ? 78 : category === 'f2' ? 86 : 95;

    // Subtle confirmation telemetry beep
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(587.33, now); // D5
    chimeOsc.frequency.setValueAtTime(880, now + 0.08); // A5
    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.exponentialRampToValueAtTime(masterVol * 0.45, now + 0.02);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chimeOsc.start(now);
    chimeOsc.stop(now + 0.25);

    // Continuous low engine idle rumble
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

    // RPM idle flutter LFO
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(11, now);
    lfoGain.gain.setValueAtTime(4.5, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.Q.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(masterVol * 0.65, now + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    this.idleOsc1 = osc1;
    this.idleOsc2 = osc2;
    this.idleGain = gain;
    this.idleFilter = filter;
    this.activeNodes.push(osc1, osc2, lfo, lfoGain, filter, gain, chimeOsc, chimeGain);
  }

  /**
   * Plays the official FIA red light beep + raises engine revving pitch for each light (1..5)
   */
  public playRedLightStep(lightCount: number, volumePercent: number, category: MotorsportCategory = 'f1'): void {
    const ctx = this.ensureContext();
    if (!ctx || volumePercent <= 0) return;

    const now = ctx.currentTime;
    const masterVol = Math.min(1, Math.max(0, volumePercent / 100)) * 0.32;
    const baseFreq = category === 'kart' ? 72 : category === 'f3' ? 84 : category === 'f2' ? 92 : 104;

    // 1. FIA Gantry Red Light Beep (784Hz / G5 + harmonic)
    const beepOsc = ctx.createOscillator();
    const beepSub = ctx.createOscillator();
    const beepGain = ctx.createGain();

    beepOsc.type = 'square';
    beepSub.type = 'sine';
    beepOsc.frequency.setValueAtTime(784, now);
    beepSub.frequency.setValueAtTime(1568, now);

    beepGain.gain.setValueAtTime(0.0001, now);
    beepGain.gain.linearRampToValueAtTime(masterVol * 0.65, now + 0.012);
    beepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

    beepOsc.connect(beepGain);
    beepSub.connect(beepGain);
    beepGain.connect(ctx.destination);

    beepOsc.start(now);
    beepSub.start(now);
    beepOsc.stop(now + 0.2);
    beepSub.stop(now + 0.2);
    this.activeNodes.push(beepOsc, beepSub, beepGain);

    // 2. Step up engine RPM revving on the grid as lights 1..5 turn on
    const revStepFreq = baseFreq + lightCount * 22;
    if (this.idleOsc1 && this.idleOsc2 && this.idleFilter && this.idleGain) {
      this.idleOsc1.frequency.exponentialRampToValueAtTime(revStepFreq, now + 0.18);
      this.idleOsc2.frequency.exponentialRampToValueAtTime(revStepFreq * 1.98, now + 0.18);
      this.idleFilter.frequency.exponentialRampToValueAtTime(320 + lightCount * 95, now + 0.2);
      this.idleGain.gain.linearRampToValueAtTime(Math.min(0.32, masterVol * (0.65 + lightCount * 0.1)), now + 0.18);
    } else {
      // Short standalone rev pulse if idle wasn't running
      const revOsc = ctx.createOscillator();
      const revFilter = ctx.createBiquadFilter();
      const revGain = ctx.createGain();
      revOsc.type = 'sawtooth';
      revOsc.frequency.setValueAtTime(revStepFreq * 0.85, now);
      revOsc.frequency.exponentialRampToValueAtTime(revStepFreq * 1.15, now + 0.25);

      revFilter.type = 'lowpass';
      revFilter.frequency.setValueAtTime(420 + lightCount * 80, now);

      revGain.gain.setValueAtTime(0.001, now);
      revGain.gain.linearRampToValueAtTime(masterVol * 0.5, now + 0.05);
      revGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      revOsc.connect(revFilter);
      revFilter.connect(revGain);
      revGain.connect(ctx.destination);
      revOsc.start(now);
      revOsc.stop(now + 0.44);
      this.activeNodes.push(revOsc, revFilter, revGain);
    }
  }

  /**
   * Plays high-immersion engine acceleration roar + gear upshifts + tire launch burst when lights go out!
   */
  public playLightsOutAcceleration(volumePercent: number, category: MotorsportCategory = 'f1'): void {
    const ctx = this.ensureContext();
    if (!ctx || volumePercent <= 0) return;

    // Stop pre-launch idle so the full-throttle acceleration roar takes over cleanly
    this.stopAll();

    const now = ctx.currentTime;
    const masterVol = Math.min(1, Math.max(0, volumePercent / 100)) * 0.4;
    const pitchMult = category === 'kart' ? 0.78 : category === 'f3' ? 0.88 : category === 'f2' ? 0.94 : 1.05;

    // 1. Lights-Out Green Signal High Tone
    const greenOsc = ctx.createOscillator();
    const greenGain = ctx.createGain();
    greenOsc.type = 'triangle';
    greenOsc.frequency.setValueAtTime(1174.66, now); // D6 launch tone
    greenGain.gain.setValueAtTime(0.001, now);
    greenGain.gain.linearRampToValueAtTime(masterVol * 0.55, now + 0.015);
    greenGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    greenOsc.connect(greenGain);
    greenGain.connect(ctx.destination);
    greenOsc.start(now);
    greenOsc.stop(now + 0.3);

    // 2. Multi-Oscillator Racing Engine Acceleration with 3 Gear Upshifts (1.65s duration)
    const engOsc1 = ctx.createOscillator(); // Fundamental cylinder firing
    const engOsc2 = ctx.createOscillator(); // Exhaust harmonic
    const engOsc3 = ctx.createOscillator(); // Turbo / high-RPM whine
    const engFilter = ctx.createBiquadFilter();
    const engGain = ctx.createGain();

    engOsc1.type = 'sawtooth';
    engOsc2.type = 'sawtooth';
    engOsc3.type = 'triangle';

    // RPM Acceleration Curve:
    // Launch (0.0s -> 0.52s: 1st Gear) -> Shift 1 (0.54s) -> 2nd Gear (0.54s -> 1.05s) -> Shift 2 (1.07s) -> 3rd Gear (1.07s -> 1.62s)
    const f0 = 145 * pitchMult;
    const f1Peak = 390 * pitchMult;
    const f2Drop = 265 * pitchMult;
    const f2Peak = 520 * pitchMult;
    const f3Drop = 370 * pitchMult;
    const f3Peak = 680 * pitchMult;

    [
      { osc: engOsc1, mult: 1 },
      { osc: engOsc2, mult: 1.5 },
      { osc: engOsc3, mult: 3.0 },
    ].forEach(({ osc, mult }) => {
      osc.frequency.setValueAtTime(f0 * mult, now);
      // 1st gear pull
      osc.frequency.exponentialRampToValueAtTime(f1Peak * mult, now + 0.52);
      // Upshift to 2nd gear
      osc.frequency.setValueAtTime(f2Drop * mult, now + 0.55);
      osc.frequency.exponentialRampToValueAtTime(f2Peak * mult, now + 1.05);
      // Upshift to 3rd gear
      osc.frequency.setValueAtTime(f3Drop * mult, now + 1.08);
      osc.frequency.exponentialRampToValueAtTime(f3Peak * mult, now + 1.6);
    });

    engFilter.type = 'bandpass';
    engFilter.frequency.setValueAtTime(450 * pitchMult, now);
    engFilter.frequency.exponentialRampToValueAtTime(1650 * pitchMult, now + 1.45);
    engFilter.Q.setValueAtTime(1.15, now);

    // Envelope with crisp gear-shift torque dips and distance fade-out as cars speed away up the straight
    engGain.gain.setValueAtTime(0.001, now);
    engGain.gain.linearRampToValueAtTime(masterVol * 0.95, now + 0.08);
    // 1st -> 2nd shift dip
    engGain.gain.setValueAtTime(masterVol * 0.92, now + 0.51);
    engGain.gain.linearRampToValueAtTime(masterVol * 0.45, now + 0.54);
    engGain.gain.linearRampToValueAtTime(masterVol * 0.9, now + 0.58);
    // 2nd -> 3rd shift dip
    engGain.gain.setValueAtTime(masterVol * 0.85, now + 1.04);
    engGain.gain.linearRampToValueAtTime(masterVol * 0.4, now + 1.07);
    engGain.gain.linearRampToValueAtTime(masterVol * 0.8, now + 1.11);
    // Fade out as pack enters Turn 1
    engGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);

    engOsc1.connect(engFilter);
    engOsc2.connect(engFilter);
    engOsc3.connect(engFilter);
    engFilter.connect(engGain);
    engGain.connect(ctx.destination);

    engOsc1.start(now);
    engOsc2.start(now);
    engOsc3.start(now);
    engOsc1.stop(now + 1.66);
    engOsc2.stop(now + 1.66);
    engOsc3.stop(now + 1.66);

    // 3. Tire Traction / Exhaust Roar Burst on Launch (Filtered White Noise)
    const bufferSize = Math.floor(ctx.sampleRate * 0.45);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(950, now);
    noiseFilter.Q.setValueAtTime(1.8, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(masterVol * 0.38, now + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + 0.44);

    this.activeNodes.push(
      greenOsc,
      greenGain,
      engOsc1,
      engOsc2,
      engOsc3,
      engFilter,
      engGain,
      whiteNoise,
      noiseFilter,
      noiseGain
    );
  }
}

export const startLineAudio = new StartLineAudioEngine();
