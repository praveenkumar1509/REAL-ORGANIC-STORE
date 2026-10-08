/**
 * Real Organics - Procedural Nature Audio Synthesizer
 * Uses Web Audio API to create authentic organic ambient sounds:
 * - Gentle morning breeze / rustling farm leaves
 * - Natural birdsong chirps
 * - Subtle organic wooden percussion feedback for clicks
 */

class NatureAudioSystem {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.isMuted = true;
    this.masterGain = null;
    this.ambientGain = null;
    this.windNode = null;
    this.birdTimer = null;
  }

  init() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      this.ambientGain = this.audioCtx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.setupWindAmbience();
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  setupWindAmbience() {
    if (!this.audioCtx) return;

    // Pink/Brown noise generator for gentle rustling foliage & breeze
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate soft foliage and warm valley breeze
    const bandpass = this.audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(420, this.audioCtx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.audioCtx.currentTime);

    // Subtle LFO for breathing wind movement
    const lfo = this.audioCtx.createOscillator();
    const lfoGain = this.audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.18, this.audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(160, this.audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    lfo.start();

    whiteNoise.connect(bandpass);
    bandpass.connect(this.ambientGain);
    whiteNoise.start();
    this.windNode = whiteNoise;
  }

  playBirdChirp() {
    if (!this.audioCtx || this.isMuted) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    const baseFreq = 2200 + Math.random() * 1200;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 800, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 200, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 1000, now + 0.24);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  scheduleBirdsong() {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    if (this.isMuted) return;

    const nextTime = 4000 + Math.random() * 8000;
    this.birdTimer = setTimeout(() => {
      this.playBirdChirp();
      if (Math.random() > 0.4) {
        setTimeout(() => this.playBirdChirp(), 220);
      }
      this.scheduleBirdsong();
    }, nextTime);
  }

  playWoodClick() {
    if (!this.audioCtx || this.isMuted) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Audio context might be sleeping
    }
  }

  toggleSound() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      this.ambientGain.gain.setTargetAtTime(0.08, this.audioCtx.currentTime, 0.5);
      this.scheduleBirdsong();
      this.playWoodClick();
      return true; // sound is ON
    } else {
      this.ambientGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.2);
      if (this.birdTimer) clearTimeout(this.birdTimer);
      return false; // sound is OFF
    }
  }
}

window.natureAudio = new NatureAudioSystem();
