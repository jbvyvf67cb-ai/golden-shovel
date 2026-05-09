// ============================================================
//  AUDIO — WebAudio sound effects + procedural ambient music
//  No external assets. Music is a slowly-evolving pad with
//  gentle wind/water-like noise and occasional bird chirps.
// ============================================================
'use strict';

const Audio = {
  ctx: null,
  musicGain: null,     // master gain for music layer (independent of mute)
  sfxGain: null,       // master gain for SFX
  musicNodes: [],      // active oscillators / nodes for music
  musicStarted: false,
  birdTimer: null,
  noiseSource: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0; // fade in later
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.ctx.destination);
    } catch(e) { /* no-op */ }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  // ----- SFX -----
  beep(freq, dur, type='sine', vol=0.12) {
    if (!this.ctx || GAME.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(this.sfxGain);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.start(); o.stop(this.ctx.currentTime + dur);
  },

  jump()       { this.beep(420, 0.10, 'square', 0.08); },
  doubleJump() { this.beep(620, 0.10, 'square', 0.08); },
  throwShovel(){ this.beep(280, 0.06, 'sawtooth', 0.06); },
  stomp()      { this.beep(180, 0.12, 'square', 0.1); },
  enemyHit()   { this.beep(700, 0.06, 'square', 0.1); setTimeout(()=>this.beep(440, 0.08, 'square', 0.08), 50); },
  blockBreak() { this.beep(800, 0.05, 'square', 0.08); setTimeout(()=>this.beep(500, 0.08, 'square', 0.06), 30); },
  collectWord(){ this.beep(880, 0.08, 'triangle', 0.1); setTimeout(()=>this.beep(1320, 0.08, 'triangle', 0.08), 80); },
  damage()     { this.beep(160, 0.18, 'sawtooth', 0.14); },
  bossHit()    { this.beep(220, 0.18, 'square', 0.14); setTimeout(()=>this.beep(330, 0.14, 'square', 0.10), 100); },
  bossDown()   { this.beep(330, 0.12, 'triangle', 0.12); setTimeout(()=>this.beep(440, 0.12, 'triangle', 0.12), 130); setTimeout(()=>this.beep(660, 0.18, 'triangle', 0.12), 260); },
  victory()    { [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.18, 'triangle', 0.12), i*120)); },
  click()      { this.beep(660, 0.04, 'square', 0.06); },
  shieldHit()  { this.beep(880, 0.05, 'sine', 0.05); },
  bossThrow()  { this.beep(140, 0.18, 'sine', 0.07); },

  // -------------------------------------------------------
  //  MUSIC — slow ambient nature pad
  //  Long sine pads on a pentatonic root + fifth + octave,
  //  pink-ish wind noise, occasional bird-call chirps.
  // -------------------------------------------------------
  startMusic() {
    if (!this.ctx || this.musicStarted) return;
    this.musicStarted = true;
    const ctx = this.ctx;
    const masterGain = this.musicGain;

    // Fade in the music layer
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(GAME.muted ? 0 : 0.18, ctx.currentTime + 3.0);

    // ----- soft pad chord (major pentatonic feel) -----
    // root C3, perfect fifth G3, octave C4, ninth D4
    const padFreqs = [130.81, 196.00, 261.63, 293.66];
    padFreqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      // tiny detune so pads beat slowly together
      o.detune.value = (i - 1) * 4;

      // slow vibrato via LFO
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      lfo.start();

      // amplitude shaping per voice
      const ag = ctx.createGain();
      ag.gain.value = 0.0;
      // each voice gently swells in & out on its own period (creates evolving texture)
      const ampLfo = ctx.createOscillator();
      ampLfo.frequency.value = 0.04 + i * 0.018;
      const ampLfoGain = ctx.createGain();
      ampLfoGain.gain.value = 0.045;
      ampLfo.connect(ampLfoGain);
      ampLfoGain.connect(ag.gain);
      ag.gain.value = 0.06; // base
      ampLfo.start();

      // gentle low-pass to soften the highs
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900 + i * 220;
      filter.Q.value = 0.6;

      o.connect(filter);
      filter.connect(ag);
      ag.connect(masterGain);
      o.start();

      this.musicNodes.push(o, lfo, ampLfo);
    });

    // ----- soft "wind" noise layer -----
    // Generate a long noise buffer once, loop it through a low-pass.
    const bufLen = ctx.sampleRate * 6;
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let lastV = 0;
    for (let i = 0; i < bufLen; i++) {
      // very pink-ish: low-passed white noise
      const v = (Math.random() * 2 - 1);
      lastV = lastV * 0.985 + v * 0.015;
      data[i] = lastV * 4.0;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 600;
    noiseFilter.Q.value = 0.4;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.06;
    // slow noise volume modulation -> "breeze coming and going"
    const breezeLfo = ctx.createOscillator();
    breezeLfo.frequency.value = 0.05;
    const breezeAmp = ctx.createGain();
    breezeAmp.gain.value = 0.04;
    breezeLfo.connect(breezeAmp);
    breezeAmp.connect(noiseGain.gain);
    breezeLfo.start();

    src.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    src.start();

    this.noiseSource = src;
    this.musicNodes.push(src, breezeLfo);

    // ----- occasional bird chirps -----
    const scheduleBird = () => {
      if (!this.ctx) return;
      // Every 8-22 seconds, soft bird call
      const next = 8000 + Math.random() * 14000;
      this.birdTimer = setTimeout(() => {
        if (!GAME.muted && this.musicStarted) this.bird();
        scheduleBird();
      }, next);
    };
    scheduleBird();
  },

  bird() {
    // a couple of quick descending chirps
    if (!this.ctx) return;
    const ctx = this.ctx;
    const baseFreq = 1800 + Math.random() * 800;
    const chirps = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < chirps; i++) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const g = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.12;
      o.frequency.setValueAtTime(baseFreq, t0);
      o.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, t0 + 0.12);
      g.gain.setValueAtTime(0.0, t0);
      g.gain.linearRampToValueAtTime(0.04, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
      o.connect(g);
      g.connect(this.musicGain);
      o.start(t0);
      o.stop(t0 + 0.16);
    }
  },

  setMuted(muted) {
    if (!this.ctx || !this.musicGain) return;
    const target = muted ? 0 : 0.18;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.3);
  },
};
