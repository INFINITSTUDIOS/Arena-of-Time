// Keyboard + mouse capture, and the human controller (movement, aiming, combo detection).
import * as THREE from 'three';
import { COMBOS } from './characters.js';

export const SCHEMES = {
  p1: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', punch: 'KeyF', kick: 'KeyR', grapple: 'KeyE', focus: 'KeyQ', block: 'ShiftLeft', dash: 'Space', mouse: true },
  p2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', punch: 'KeyJ', kick: 'KeyK', grapple: 'KeyL', focus: 'KeyU', block: 'KeyO', dash: 'Enter',
        lmb: 'KeyY', rmb: 'KeyH', zoneHigh: 'KeyI', zoneLow: 'KeyM' },
};

export class Input {
  constructor(el) {
    this.keys = new Set(); this.events = []; this.mouse = { x: innerWidth / 2, y: innerHeight / 2, seen: false };
    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code); this.events.push({ type: 'key', code: e.code });
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.seen = true; });
    el.addEventListener('mousedown', (e) => { e.preventDefault(); this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.seen = true; this.events.push({ type: 'mouse', button: e.button }); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  endFrame() { this.events.length = 0; }
}

const v3 = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export class HumanController {
  constructor(input, scheme, camera) { this.in = input; this.s = scheme; this.cam = camera; this.tokens = []; this.human = true; }

  screenY(x, y, z) { v3.set(x, y, z).project(this.cam); return (1 - v3.y) * 0.5 * innerHeight; }

  token(t) { const now = performance.now(); this.tokens.push({ t, at: now }); if (this.tokens.length > 8) this.tokens.shift(); }
  matchCombo(f) {
    const now = performance.now(), T = this.tokens, slowBonus = f.focusing ? 900 : 0;
    for (const c of COMBOS) {
      if (T.length < c.seq.length) continue;
      const tail = T.slice(-c.seq.length);
      if (tail.every((k, i) => k.t === c.seq[i]) && now - tail[0].at < 1300 + slowBonus) return c.key;
    }
    return null;
  }

  update(dt, f, opp, match) {
    const s = this.s, K = this.in.keys, cam = this.cam, I = f.intent;
    // camera-relative axes on the ground plane
    cam.getWorldDirection(v3); const fl = Math.hypot(v3.x, v3.z) || 1, fwx = v3.x / fl, fwz = v3.z / fl, rx = -fwz, rz = fwx;
    const h = (K.has(s.right) ? 1 : 0) - (K.has(s.left) ? 1 : 0), v = (K.has(s.up) ? 1 : 0) - (K.has(s.down) ? 1 : 0);
    I.mx = rx * h + fwx * v; I.mz = rz * h + fwz * v; I.block = K.has(s.block) || (s.mouse && K.has('ShiftRight'));
    const oppRight = (opp.pos.x - f.pos.x) * rx + (opp.pos.z - f.pos.z) * rz >= 0;

    // aim zone
    if (s.mouse) {
      const sc = opp.char.look.scale, my = this.in.mouse.y;
      const yHi = this.screenY(opp.pos.x, 1.36 * sc, opp.pos.z), yLo = this.screenY(opp.pos.x, 0.82 * sc, opp.pos.z);
      I.zone = my < yHi ? 'high' : my > yLo ? 'low' : 'mid';
    } else I.zone = K.has(s.zoneHigh) ? 'high' : K.has(s.zoneLow) ? 'low' : 'mid';

    for (const e of this.in.events) {
      let act = null, tok = null;
      if (e.type === 'key') {
        const c = e.code;
        if (c === s.left) this.token(oppRight ? 'b' : 'f'); else if (c === s.right) this.token(oppRight ? 'f' : 'b');
        else if (c === s.up) this.token('u'); else if (c === s.down) this.token('d');
        else if (c === s.punch) { act = 'punch'; tok = 'P'; } else if (c === s.kick) { act = 'kick'; tok = 'K'; }
        else if (c === s.grapple) act = 'grapple'; else if (c === s.focus) act = 'focus';
        else if (c === s.lmb) { act = 'lmb'; tok = 'L'; } else if (c === s.rmb) { act = 'rmb'; tok = 'R'; }
        else if (c === s.dash) act = 'dash';
      } else if (s.mouse) {
        if (e.button === 0) { act = 'lmb'; tok = 'L'; } else if (e.button === 2) { act = 'rmb'; tok = 'R'; }
      }
      if (!act) continue;
      const busy = match.clinch || match.sub;
      if (tok && !busy) {
        this.token(tok);
        const combo = this.matchCombo(f);
        if (combo && (combo !== 'chrono' || (f.focusing && f.mana >= 20))) { this.tokens.length = 0; match.input(f, combo, { zone: I.zone }); continue; }
      }
      if (act === 'dash') {
        let dx = I.mx, dz = I.mz;
        if (s.mouse && this.in.mouse.seen) {
          ndc.set(this.in.mouse.x / innerWidth * 2 - 1, -(this.in.mouse.y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam);
          if (ray.ray.intersectPlane(ground, v3)) { dx = v3.x - f.pos.x; dz = v3.z - f.pos.z; }
        }
        if (Math.hypot(dx, dz) < 0.15) { dx = f.pos.x - opp.pos.x; dz = f.pos.z - opp.pos.z; }
        match.input(f, 'dash', { x: dx, z: dz });
      } else match.input(f, act, { zone: I.zone });
    }
  }
}
