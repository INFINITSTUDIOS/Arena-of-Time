// CPU opponent. Drives a Fighter through the same intent/input interface as a human.
const LEVELS = {
  easy:   { react: 0.30, block: 0.25, read: 0.40, dodge: 0.05, think: 0.55, aggr: 0.50, focus: 0.10, mash: 4.0, tech: 0.10, combo: 0.2, special: 0.6 },
  normal: { react: 0.20, block: 0.45, read: 0.60, dodge: 0.10, think: 0.36, aggr: 0.70, focus: 0.22, mash: 6.5, tech: 0.30, combo: 0.5, special: 1.0 },
  hard:   { react: 0.13, block: 0.68, read: 0.80, dodge: 0.15, think: 0.24, aggr: 0.85, focus: 0.38, mash: 9.0, tech: 0.55, combo: 0.8, special: 1.3 },
};
const ZONES = ['high', 'mid', 'low'];
const rnd = Math.random;
const pick = (w) => { let t = 0; for (const k in w) t += w[k]; let r = rnd() * t; for (const k in w) { r -= w[k]; if (r <= 0) return k; } };

export class AIController {
  constructor(level = 'normal') { this.L = LEVELS[level] || LEVELS.normal; this.think = 0.4; this.plan = null; this.seen = null; this.seenT = 0; this.mashT = 0; this.strafe = 1; this.focusT = 0; this.focusLen = 2; this.hold = 0; }

  update(dt, f, opp, match) {
    const L = this.L, I = f.intent, pdt = dt * match.scaleFor(f);
    I.mx = I.mz = 0;
    const dx = opp.pos.x - f.pos.x, dz = opp.pos.z - f.pos.z, dist = Math.hypot(dx, dz) || 1e-3, nx = dx / dist, nz = dz / dist;

    if (match.sub && (match.sub.a === f || match.sub.v === f)) {
      this.mashT -= dt; if (this.mashT <= 0) { this.mashT = (0.7 + rnd() * 0.6) / L.mash; match.input(f, 'mash'); }
      return;
    }
    if (match.clinch) {
      const c = match.clinch;
      if (c.a === f && c.mode === 'hold' && c.t > 0.38) {
        const weak = opp.hp / opp.maxHp;
        match.input(f, pick({ grapple: weak < 0.5 ? 3 * f.S.grapple : 0.5, kick: 2 * f.S.grapple, punch: 1.6 }));
      } else if (c.v === f && c.mode === 'hold' && !this.tried) { this.tried = true; if (rnd() < L.tech) match.input(f, 'grapple'); }
      return;
    }
    this.tried = false;

    // ---- focus (time-slow) management
    if (f.focusing) {
      this.focusT += dt;
      if (f.mana < 6 || this.focusT > this.focusLen || dist > 4.5) match.input(f, 'focus');
    } else if (f.mana > 40 && f.fatigue <= 0 && dist < 3) {
      const want = L.focus * (opp.focusing ? 5 : 1) * (f.hp / f.maxHp < 0.4 ? 1.6 : 1);
      if (rnd() < want * dt) { this.focusT = 0; this.focusLen = 1.4 + rnd() * 2.2; match.input(f, 'focus'); }
    }

    // ---- defence
    I.block = false;
    if (opp.state === 'attack') {
      if (this.seen !== opp.move || opp.t < this.seenT) {
        this.seen = opp.move; this.plan = null;
        const sharp = (f.blind > 0 ? 0.4 : 1) * (f.focusing ? 1.5 : 1), r = rnd();
        const delay = L.react * (0.6 + rnd() * 0.8);
        if (dist < 3.2) {
          if (opp.move.type === 'grapple' || opp.move.hits[0].unblockable) { if (r < L.block * sharp + L.dodge) this.plan = { type: 'dash', delay }; }
          else if (r < L.block * sharp) this.plan = { type: 'block', delay, zone: rnd() < L.read * sharp ? opp.zone : ZONES[(rnd() * 3) | 0] };
          else if (r < L.block * sharp + L.dodge) this.plan = { type: 'dash', delay };
        }
      }
      this.seenT = opp.t;
      if (this.plan) {
        this.plan.delay -= pdt;
        if (this.plan.delay <= 0) {
          if (this.plan.type === 'block') { I.block = true; I.zone = this.plan.zone; this.hold = 0.12; }
          else { if (f.canAct) match.input(f, 'dash', { x: -nx + nz * this.strafe, z: -nz - nx * this.strafe }); this.plan = null; }
        }
      }
      if (I.block) return;
    } else {
      this.seen = null;
      if (this.hold > 0 && this.plan && this.plan.type === 'block') { this.hold -= pdt; I.block = true; I.zone = this.plan.zone; return; }
      this.plan = null;
    }

    if (!f.canAct) return;
    // ---- spacing
    const want = 1.12 * f.S.reach + (f.radius - 0.36) + (opp.radius - 0.36);
    if (dist > want + 0.2) { I.mx = nx + nz * 0.25 * this.strafe; I.mz = nz - nx * 0.25 * this.strafe; }
    else if (dist < want - 0.45) { I.mx = -nx * 0.6; I.mz = -nz * 0.6; }
    else { I.mx = nz * 0.35 * this.strafe; I.mz = -nx * 0.35 * this.strafe; }

    this.think -= pdt;
    if (opp.state === 'hit' && rnd() < L.combo * dt * 12) this.think = 0;
    if (this.think > 0) return;
    this.think = L.think * (0.6 + rnd() * 0.9);
    if (rnd() < 0.2) this.strafe = -this.strafe;

    const M = f.char.moves, sp = L.special, downed = ['down', 'getup', 'ko'].includes(opp.state);
    if (downed) return;
    const reachOf = (m) => m.hits[0].range * f.S.reach + (m.lunge || 0) * 0.8 + (opp.radius - 0.36) + (f.radius - 0.36);
    if (dist > want + 0.6) {
      const w = { wait: 6 };
      if (dist < reachOf(M.s2)) w.s2 = sp; if (dist < reachOf(M.adv)) w.adv = 0.5 * sp; if (dist < reachOf(M.s1)) w.s1 = sp;
      if (M.s1.teleports) w.s1 = (w.s1 || 0) + sp; if (M.adv.teleports) w.adv = (w.adv || 0) + 0.4 * sp;
      if (dist > 3 && f.dashCd <= 0) w.dash = 1.2;
      const a = pick(w);
      if (a === 'dash') match.input(f, 'dash', { x: nx, z: nz }); else if (a !== 'wait') match.input(f, a, {});
      return;
    }
    const w = { punch: 3, lmb: 3, kick: 1.8, rmb: 2.5, grapple: 1.1 * f.S.grapple + (opp.blocking ? 2.2 : 0), s1: sp, s2: sp, adv: 0.45 * sp, wait: 4 * (1 - L.aggr) };
    if (f.focusing && f.mana > 26) w.chrono = 1.4;
    if (dist > 1.25 * f.S.reach + 0.2) { w.punch = 0; w.grapple *= 0.3; }
    const a = pick(w);
    if (a === 'wait') return;
    let zone = pick({ high: 4, mid: 3.5, low: 2.5 });
    if (opp.blocking && rnd() < L.read) { const open = ZONES.filter((z) => z !== opp.intent.zone); zone = open[(rnd() * 2) | 0]; }
    match.input(f, a, { zone });
  }
}
