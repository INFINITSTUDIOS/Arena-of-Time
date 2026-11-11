// Everything is synthesised with WebAudio — no sound files.
export class Audio {
  constructor() { this.ctx = null; this.muted = false; this.hype = 0.2; this.slow = 0; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // crowd bed: two detuned noise bands
    this.crowdGain = c.createGain(); this.crowdGain.gain.value = 0.05; this.crowdLP = c.createBiquadFilter(); this.crowdLP.type = 'lowpass'; this.crowdLP.frequency.value = 2200;
    this.crowdSrc = [];
    for (const [f, q] of [[420, 0.7], [900, 0.9], [1700, 1.2]]) {
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = 0.7 + Math.random() * 0.4;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      s.connect(bp).connect(this.crowdLP); s.start(); this.crowdSrc.push(s);
    }
    this.crowdLP.connect(this.crowdGain).connect(this.master);
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.8; }
  update(dt, hype, slow) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.crowdGain.gain.setTargetAtTime(0.035 + Math.min(1.6, hype) * 0.13, t, 0.15);
    this.crowdLP.frequency.setTargetAtTime(slow > 0.5 ? 380 : 2200, t, 0.08);
    for (const s of this.crowdSrc) s.playbackRate.setTargetAtTime(slow > 0.5 ? 0.42 : 0.85, t, 0.1);
    this.rate = slow > 0.5 ? 0.6 : 1;
  }
  tone(freq, to, dur, type = 'sine', vol = 0.3, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(), r = this.rate || 1;
    o.type = type; o.frequency.setValueAtTime(freq * r, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, to * r), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  burst(freq, q, dur, vol = 0.4, type = 'bandpass', delay = 0, sweepTo = 0) {
    const c = this.ctx, t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), r = this.rate || 1;
    s.buffer = this.noise; s.playbackRate.value = r; f.type = type; f.frequency.setValueAtTime(freq * r, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo * r, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'swing': this.burst(900, 1.5, 0.12, 0.12, 'bandpass', 0, 2600); break;
      case 'whoosh': this.burst(500, 1.2, 0.25, 0.2, 'bandpass', 0, 2000); break;
      case 'hit': this.burst(1400, 0.8, 0.08, 0.5, 'lowpass'); this.tone(150, 60, 0.12, 'sine', 0.5); break;
      case 'heavy': this.burst(900, 0.7, 0.16, 0.7, 'lowpass'); this.tone(120, 38, 0.3, 'sine', 0.8); this.burst(3000, 2, 0.05, 0.25); break;
      case 'block': this.burst(600, 1, 0.07, 0.4, 'lowpass'); this.tone(240, 120, 0.06, 'triangle', 0.2); break;
      case 'parry': this.tone(1250, 1180, 0.5, 'sine', 0.3); this.tone(1870, 1800, 0.4, 'sine', 0.2); this.burst(5000, 3, 0.05, 0.3); break;
      case 'bell': for (const [f, v] of [[640, 0.3], [962, 0.2], [1610, 0.12], [2250, 0.07]]) this.tone(f, f * 0.995, 1.8, 'sine', v); break;
      case 'focusOn': this.tone(700, 90, 0.7, 'sine', 0.3); this.burst(4000, 1, 0.6, 0.15, 'bandpass', 0, 200); break;
      case 'focusOff': this.tone(110, 520, 0.35, 'sine', 0.2); break;
      case 'teleport': this.burst(300, 2, 0.22, 0.3, 'bandpass', 0, 5000); this.tone(1800, 300, 0.15, 'sine', 0.1); break;
      case 'fence': for (let i = 0; i < 5; i++) this.burst(2600 + i * 400, 6, 0.09, 0.22, 'bandpass', i * 0.045); this.tone(90, 50, 0.2, 'sine', 0.4); break;
      case 'thud': this.tone(95, 40, 0.25, 'sine', 0.6); this.burst(400, 0.7, 0.1, 0.3, 'lowpass'); break;
      case 'slam': case 'quake': this.tone(70, 28, 0.55, 'sine', 0.9); this.burst(300, 0.6, 0.3, 0.6, 'lowpass'); break;
      case 'ko': this.tone(90, 25, 1.2, 'sine', 0.9); this.burst(700, 0.6, 0.4, 0.7, 'lowpass'); this.play('bell'); break;
      case 'laugh': for (let i = 0; i < 5; i++) this.tone(520 - i * 45 + Math.random() * 40, 380 - i * 30, 0.09, 'sawtooth', 0.12, i * 0.12); break;
      case 'tap': for (let i = 0; i < 4; i++) this.tone(180, 90, 0.06, 'triangle', 0.4, i * 0.11); this.play('bell'); break;
      case 'deny': this.tone(110, 90, 0.12, 'square', 0.08); break;
      case 'grab': this.burst(300, 1, 0.14, 0.4, 'lowpass'); break;
      case 'crowdRoar': this.burst(800, 0.5, 2.6, 0.35, 'bandpass', 0, 1300); this.burst(1500, 0.6, 2.2, 0.2, 'bandpass', 0.1); break;
      case 'special': this.tone(330, 660, 0.16, 'triangle', 0.14); this.tone(495, 990, 0.2, 'triangle', 0.1, 0.05); break;
      case 'ui': this.tone(880, 1100, 0.05, 'triangle', 0.1); break;
    }
  }
}
