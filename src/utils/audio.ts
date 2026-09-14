class KineticSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlayingRolling = false;
  private isMuted = false;

  constructor() {
    // Initialized lazily on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.gainNode) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.05);
    }
  }

  private lastAudioUpdateTime = 0;
  private lastReportedSpeed = 0;

  public updateRollingSound(speed: number) {
    if (this.isMuted) return;

    const nowSec = performance.now();
    if (nowSec - this.lastAudioUpdateTime < 50 && Math.abs(speed - this.lastReportedSpeed) < 0.1) {
      return;
    }
    this.lastAudioUpdateTime = nowSec;
    this.lastReportedSpeed = speed;

    this.initContext();
    if (!this.ctx) return;

    if (!this.isPlayingRolling) {
      this.startRollingLoop();
    }

    if (this.gainNode && this.filterNode) {
      const normalizedSpeed = Math.min(Math.max(speed / 8, 0), 1);
      const targetGain = normalizedSpeed * 0.06;
      const targetFreq = 180 + normalizedSpeed * 320;
      const now = this.ctx.currentTime;
      this.gainNode.gain.setTargetAtTime(targetGain, now, 0.05);
      this.filterNode.frequency.setTargetAtTime(targetFreq, now, 0.05);
    }
  }

  private startRollingLoop() {
    if (!this.ctx) return;

    // Create 1-second pinkish noise buffer
    const bufferSize = this.ctx.sampleRate * 1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Simple 1-pole lowpass for pinkish rumble
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    this.noiseNode = noise;
    this.filterNode = filter;
    this.gainNode = gain;
    this.isPlayingRolling = true;
  }

  public playPinClick(depthVelocity = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const freq = 400 + Math.random() * 150;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    const vol = Math.min(Math.max(depthVelocity * 0.03, 0.005), 0.04);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }
}

export const soundEngine = new KineticSoundEngine();
