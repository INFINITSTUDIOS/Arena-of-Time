// Fight rules: rounds, time dilation (Focus), hit resolution, clinch, throws and submissions.
import { BASE_MOVES } from './characters.js';
import { clampToCage } from './arena.js';

const WORLD_SLOW = 0.3, SOLO_FOCUS = 0.62, DUEL_FOCUS = 0.45;
const ZONE_Y = { high: 1.55, mid: 1.15, low: 0.5 };

export class Match {
  constructor(fighters, controllers, fx, opts = {}) {
    this.f = fighters; this.ctl = controllers; this.fx = fx;
    this.roundsToWin = opts.roundsToWin || 2; this.roundTime = opts.roundTime || 99;
    this.round = 0; this.over = false; this.hitstop = 0; this.worldScale = 1;
    this.startRound();
  }

  startRound() {
    this.round++; this.phase = 'intro'; this.pt = 0; this.timer = this.roundTime; this.clinch = null; this.sub = null; this.said = 0; this.winner = null;
    this.f[0].reset(-1.9, 0, Math.PI / 2); this.f[1].reset(1.9, 0, -Math.PI / 2);
    this.fx.announce(this.round >= this.roundsToWin * 2 - 1 && this.round > 1 ? 'FINAL ROUND' : 'ROUND ' + this.round, 'round');
    this.fx.sound('bell');
  }

  opp(f) { return this.f[1 - f.idx]; }
  scaleFor(f) {
    const both = this.f[0].focusing && this.f[1].focusing;
    return (f.focusing ? (both ? DUEL_FOCUS : SOLO_FOCUS) : this.worldScale) * (f.fatigue > 0 ? 0.78 : 1) * (this.koSlow > 0 ? 0.3 : 1);
  }

  // ---------------------------------------------------------------- inputs
  // action: 'punch' | 'kick' | 'lmb' | 'rmb' | 'grapple' | 'dash' | 'focus' | 's1' | 's2' | 'adv' | 'chrono' | 'mash'
  input(f, action, arg) {
    if (this.phase !== 'fight') return false;
    if (action === 'focus') return this.toggleFocus(f);
    if (this.sub && (f === this.sub.a || f === this.sub.v)) { this.mash(f); return true; }
    if (this.clinch && this.clinch.mode === 'hold') {
      const c = this.clinch;
      if (f === c.a) {
        if (action === 'punch' || action === 'lmb') { c.mode = 'knees'; c.t = 0; c.n = 0; return true; }
        if (action === 'kick' || action === 'rmb') { this.beginThrow(); return true; }
        if (action === 'grapple') { this.beginSub(c.a, c.v); return true; }
      } else if (f === c.v && action === 'grapple' && c.t < 0.3) { this.breakClinch('ESCAPE'); return true; }
      return false;
    }
    if (!f.canAct) { if (action !== 'mash') f.buffer = { action, arg, at: performance.now() }; return false; }
    if (f.blind > 0 && arg && arg.zone && Math.random() < 0.6) arg = { ...arg, zone: ['high', 'mid', 'low'][(Math.random() * 3) | 0] };
    const zone = arg && arg.zone || f.intent.zone;
    switch (action) {
      case 'punch': f.startMove(BASE_MOVES.jab, zone); break;
      case 'lmb': f.startMove(BASE_MOVES.cross, zone); break;
      case 'kick': f.startMove(BASE_MOVES.front, zone); break;
      case 'rmb': f.startMove(BASE_MOVES.round, zone); break;
      case 'grapple': f.startMove(BASE_MOVES.grab, 'mid'); break;
      case 'dash': {
        if (f.dashCd > 0) return false;
        const from = { x: f.pos.x, z: f.pos.z };
        if (f.dash(arg.x, arg.z)) { this.fx.smoke(from.x, 1, from.z); this.fx.smoke(f.pos.x, 1, f.pos.z); this.fx.sound('teleport'); } else this.fx.sound('whoosh');
        return true;
      }
      case 's1': case 's2': case 'adv': {
        const m = f.char.moves[action]; f.startMove(m, zone);
        this.fx.callout(f, m.name, m.tier); if (m.uplinkBuff) f.uplink = m.uplinkBuff; break;
      }
      case 'chrono': {
        const m = BASE_MOVES.chrono;
        if (!f.focusing || f.mana < m.cost) return false;
        f.mana -= m.cost; f.startMove(m, 'high'); this.fx.callout(f, m.name, 'advanced'); break;
      }
      default: return false;
    }
    this.fx.sound(action === 'grapple' ? 'whoosh' : 'swing');
    return true;
  }

  toggleFocus(f) {
    if (f.focusing) { this.endFocus(f); return true; }
    if (f.mana < 12 || f.fatigue > 0 || ['ko', 'tap', 'win', 'subA', 'subV'].includes(f.state)) { this.fx.sound('deny'); return false; }
    f.focusing = true; f.focusUsed = 0; this.fx.sound('focusOn'); return true;
  }
  endFocus(f) {
    if (!f.focusing) return;
    f.focusing = false; f.fatigue = 0.7 + Math.min(1.6, f.focusUsed / 45); f.manaDelay = 2.5; this.fx.sound('focusOff');
  }

  // ---------------------------------------------------------------- hits
  resolveHit(a, v, h) {
    if (this.phase !== 'fight') return;
    const dx = v.pos.x - a.pos.x, dz = v.pos.z - a.pos.z, dist = Math.hypot(dx, dz) || 1e-3, nx = dx / dist, nz = dz / dist;
    const reach = h.range * a.S.reach + (v.radius - 0.36) + (a.radius - 0.36);
    const m = a.move, zone = h.zone || a.zone;
    if (h.quake) { this.fx.shake(0.5); this.fx.sound('quake'); this.fx.dust(a.pos.x + nx * 0.6, a.pos.z + nz * 0.6); }
    if (h.spray) this.fx.spray(a.pos.x + nx * 0.5, 1.5, a.pos.z + nz * 0.5, nx, nz);
    if (dist > reach || v.state === 'ko') return;
    if (h.grab) {
      if (v.invulnerable || v.armored) return;
      return this.beginClinch(a, v);
    }
    if (v.invulnerable) { if (v.state === 'dash' || (v.state === 'attack')) this.fx.popup(v, 'DODGE', 'good'); return; }
    if (a.blind > 0 && Math.random() < 0.4) { this.fx.popup(a, 'MISS', 'bad'); return; }

    let dmg = h.dmg * a.S.power * (a.S.berserk ? 1 + 0.5 * (1 - a.hp / a.maxHp) : 1);
    const y = ZONE_Y[zone] * v.char.look.scale, px = v.pos.x - nx * 0.25, pz = v.pos.z - nz * 0.25;
    let partial = false;

    if (v.blocking && !h.unblockable) {
      let ok = v.S.cape || v.intent.zone === zone || v.uplink > 0 || (v.S.uplink && Math.random() < v.S.uplink);
      if (v.blind > 0 && Math.random() < 0.5) ok = false;
      if (ok) {
        if (v.focusing && v.blockT < 0.4) {                               // precise defence inside slowed time
          a.stagger(0.95, 'mid'); a.kb.x = -nx * 3; a.kb.z = -nz * 3; v.mana = Math.min(v.maxMana, v.mana + 10);
          this.fx.popup(v, 'PARRY!', 'focus'); this.fx.spark(px, y, pz, 'parry'); this.fx.sound('parry'); this.fx.hype(0.5); this.fx.hitstop(0.09);
          return;
        }
        const crush = a.S.guardCrush && m.type === 'punch';
        v.hp = Math.max(1, v.hp - dmg * (crush ? 0.4 : 0.08)); v.blockStun = crush ? 0.3 : 0.16;
        v.kb.x = nx * (crush ? 4 : 1.6); v.kb.z = nz * (crush ? 4 : 1.6);
        this.fx.spark(px, y, pz, 'block'); this.fx.sound('block'); if (crush) { this.fx.popup(v, 'GUARD CRUSH', 'bad'); this.fx.shake(0.25); }
        return;
      }
      dmg *= 0.6; partial = true;
    }
    const armored = v.armored;
    if (v.state === 'attack' && !armored) { dmg *= 1.25; this.fx.popup(a, 'COUNTER', 'good'); }
    if (a.focusing) { dmg *= 1.2; this.fx.popup(a, 'PRECISION', 'focus'); }
    if (zone === 'high') dmg *= 1.15; else if (zone === 'low') { dmg *= 0.85; v.slow = Math.max(v.slow, h.slow || 1.2); }
    v.comboN = v.state === 'hit' ? v.comboN + 1 : 1;
    dmg *= Math.pow(0.9, v.comboN - 1);
    const stun = (h.stun || 0.3) * Math.pow(0.86, v.comboN - 1) * (partial ? 0.6 : 1);
    if (v.comboN >= 3) this.fx.combo(a, v.comboN);

    v.hp -= dmg; a.mana = Math.min(a.maxMana, a.mana + 3);
    if (v.S.laugh) { v.mana = Math.min(v.maxMana, v.mana + 5); if (Math.random() < 0.6) this.fx.sound('laugh'); }
    if ((a.S.bleed && m.type === 'punch') || h.bleed) { v.bleed = Math.max(v.bleed, h.bleed || 3); this.fx.spark(px, y, pz, 'blood'); }
    if (h.blind) { v.blind = h.blind; this.fx.popup(v, 'BLINDED', 'bad'); }
    const kb = (h.kb || 1) * (v.S.heavy ? 0.4 : 1);
    v.kb.x = nx * kb; v.kb.z = nz * kb;
    const heavy = dmg >= 10;
    this.fx.spark(px, y, pz, heavy ? 'heavy' : 'hit'); this.fx.sound(heavy ? 'heavy' : 'hit'); this.fx.shake(Math.min(0.7, dmg / 40)); this.fx.hype(dmg / 30);
    if (heavy) this.fx.hitstop(0.07);

    if (v.hp <= 0) {
      if (v.char.id === 'eric' && !v.secondWind) { v.secondWind = true; v.hp = v.maxHp * 0.14; this.fx.popup(v, 'SECOND WIND', 'good'); v.knockdown(); return; }
      return this.ko(a, v);
    }
    if (armored) return;
    if (h.knockdown && !partial) { v.knockdown(); this.fx.sound('thud'); } else v.stagger(stun, zone);
    if (v.focusing && dmg >= 10) this.endFocus(v);
  }

  teleport(a, v, behind) {
    const dx = v.pos.x - a.pos.x, dz = v.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 1, s = behind ? 1 : -1;
    this.fx.smoke(a.pos.x, 1, a.pos.z);
    // "behind" = far side of the victim along the current line; alternate sides for multi-teleports
    const side = a.tpIdx % 2 ? 0.9 : 0;
    a.pos.x = v.pos.x + (dx / d) * 1.05 * s - (dz / d) * side; a.pos.z = v.pos.z + (dz / d) * 1.05 * s + (dx / d) * side;
    clampToCage(a.pos, a.radius);
    a.facing = Math.atan2(v.pos.x - a.pos.x, v.pos.z - a.pos.z); a.hidden = 0.07;
    this.fx.smoke(a.pos.x, 1, a.pos.z); this.fx.sound('teleport');
  }

  fenceHit(f, speed) {
    this.fx.rattle(f.pos.x, f.pos.z); this.fx.sound('fence');
    if (this.phase === 'fight' && f.state !== 'ko') { f.hp = Math.max(1, f.hp - 3); this.fx.popup(f, 'CAGE!', 'bad'); this.fx.shake(0.3); }
  }

  ko(a, v) {
    v.hp = 0; v.setState('ko'); v.kb.x *= 1.6; v.kb.z *= 1.6;
    this.endRound(a, 'K.O.'); this.koSlow = 1.4; this.fx.shake(0.9); this.fx.sound('ko');
  }

  // ---------------------------------------------------------------- grappling
  beginClinch(a, v) {
    this.endFocus(a); this.endFocus(v);
    const dx = v.pos.x - a.pos.x, dz = v.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 1;
    const gap = a.radius + v.radius + 0.02;
    v.pos.x = a.pos.x + dx / d * gap; v.pos.z = a.pos.z + dz / d * gap; clampToCage(v.pos, v.radius);
    a.setState('clinchA'); v.setState('clinchV'); v.kb.x = v.kb.z = 0;
    this.clinch = { a, v, t: 0, mode: 'hold', n: 0, pose: null };
    this.fx.popup(a, 'CLINCH', 'good'); this.fx.sound('grab');
  }
  breakClinch(text) {
    const { a, v } = this.clinch; this.clinch = null;
    const dx = v.pos.x - a.pos.x, dz = v.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 1;
    a.setState('idle'); v.setState('idle'); a.kb.x = -dx / d * 3; a.kb.z = -dz / d * 3; v.kb.x = dx / d * 3; v.kb.z = dz / d * 3;
    if (text) this.fx.popup(v, text, 'good');
  }
  beginThrow() {
    const c = this.clinch; c.mode = 'throw'; c.t = 0; c.pose = 'throwA';
    const { a, v } = c, dx = v.pos.x - a.pos.x, dz = v.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 1;
    c.from = { x: v.pos.x, z: v.pos.z };
    c.to = { x: a.pos.x - dx / d * 1.7 - dz / d * 0.6, z: a.pos.z - dz / d * 1.7 + dx / d * 0.6 }; clampToCage(c.to, v.radius);
    this.fx.sound('whoosh');
  }
  beginSub(a, v) {
    this.clinch = null;
    a.setState('subA'); v.setState('subV');
    a.pos.x = v.pos.x - Math.sin(v.facing) * 0.05; a.pos.z = v.pos.z - Math.cos(v.facing) * 0.05; a.facing = v.facing; a.lift = 0.22;
    this.sub = { a, v, meter: 20 + 46 * (1 - v.hp / v.maxHp), t: 0 };
    this.fx.callout(a, 'SUBMISSION HOLD', 'special'); this.fx.sound('grab');
  }
  mash(f) {
    const s = this.sub; if (!s) return;
    if (f === s.a) s.meter += 3.6 * Math.sqrt(s.a.S.grapple);
    else s.meter -= 2.6 + 4.2 * (s.v.hp / s.v.maxHp);
  }
  updateGrapple(dt) {
    const c = this.clinch;
    if (c) {
      const { a, v } = c; c.t += dt * this.scaleFor(a);
      if (c.mode === 'hold') { if (c.t > 1.25) this.beginThrow(); }
      else if (c.mode === 'knees') {
        const ph = c.t % 0.36; c.pose = ph > 0.12 && ph < 0.3 ? 'knee' : null;
        if (c.t > 0.2 + c.n * 0.36) {
          c.n++; v.hp -= 4.2 * a.S.power * a.S.grapple; a.mana = Math.min(a.maxMana, a.mana + 2);
          this.fx.spark(v.pos.x, 1.0, v.pos.z, 'hit'); this.fx.sound('hit'); this.fx.shake(0.2);
          if (v.hp <= 0) { this.clinch = null; a.setState('idle'); return this.ko(a, v); }
          if (c.n >= 3) { this.breakClinch(); v.stagger(0.5, 'mid'); }
        }
      } else if (c.mode === 'throw') {
        if (c.t > 0.22 && v.state !== 'thrown') { v.setState('thrown'); }
        if (v.state === 'thrown') {
          const k = Math.min(1, (c.t - 0.22) / 0.6);
          v.pos.x = c.from.x + (c.to.x - c.from.x) * k; v.pos.z = c.from.z + (c.to.z - c.from.z) * k; v.lift = Math.sin(k * Math.PI) * 1.25;
          if (k >= 1) {
            this.clinch = null; v.lift = 0; a.setState('idle');
            v.hp -= 13 * a.S.power * a.S.grapple;
            this.fx.spark(v.pos.x, 0.3, v.pos.z, 'heavy'); this.fx.dust(v.pos.x, v.pos.z); this.fx.sound('slam'); this.fx.shake(0.7); this.fx.hype(0.6); this.fx.popup(a, a.S.heavy ? 'HYDRAULIC SLAM' : 'SLAM!', 'good');
            if (v.hp <= 0) return this.ko(a, v);
            v.knockdown();
          }
        }
      }
    }
    const s = this.sub;
    if (s) {
      s.t += dt;
      s.meter += 5.5 * s.a.S.grapple * dt;
      s.v.hp = Math.max(1, s.v.hp - 2.6 * s.a.S.grapple * dt);
      if (s.meter >= 100) {
        this.sub = null; s.v.setState('tap'); s.a.lift = 0; this.fx.sound('tap'); this.endRound(s.a, 'TAP OUT!');
      } else if (s.meter <= 0 || s.t > 10) {
        this.sub = null; s.a.lift = 0; s.a.stagger(0.7, 'high'); s.v.setState('getup');
        const fx = Math.sin(s.v.facing), fz = Math.cos(s.v.facing); s.a.pos.x -= fx * 0.9; s.a.pos.z -= fz * 0.9; s.a.kb.x = -fx * 3; s.a.kb.z = -fz * 3;
        this.fx.popup(s.v, 'ESCAPED!', 'good');
      }
    }
  }

  // ---------------------------------------------------------------- flow
  endRound(winner, text) {
    if (this.phase !== 'fight') return;
    this.phase = 'end'; this.pt = 0; this.winner = winner; this.endText = text;
    this.f.forEach((f) => { f.focusing = false; f.intent.block = false; f.intent.mx = f.intent.mz = 0; });
    this.clinch = null; this.sub = null;
    for (const f of this.f) {
      f.lift = 0;
      if (['clinchA', 'clinchV', 'thrown', 'subA'].includes(f.state)) f.setState('idle');
      else if (f.state === 'subV') f.setState('getup');
    }
    this.fx.announce(text, 'ko'); this.fx.hype(1.5); this.fx.sound('crowdRoar');
    if (winner) winner.wins++;
  }

  update(dtReal) {
    if (this.over) dtReal = Math.min(dtReal, 0.05);
    if (this.hitstop > 0) { this.hitstop -= dtReal; return; }
    const F = this.f;
    this.koSlow = Math.max(0, (this.koSlow || 0) - dtReal);
    const anyFocus = F[0].focusing || F[1].focusing;
    this.worldScale += ((anyFocus ? WORLD_SLOW : 1) - this.worldScale) * Math.min(1, dtReal * 14);
    this.pt += dtReal;

    if (this.phase === 'intro') {
      if (this.pt > 1.5 && this.said === 0) { this.said = 1; this.fx.announce('FIGHT!', 'fight'); }
      if (this.pt > 2.1) { this.phase = 'fight'; this.pt = 0; }
    } else if (this.phase === 'fight') {
      this.timer -= dtReal * this.worldScale;
      if (this.timer <= 0) {
        const r0 = F[0].hp / F[0].maxHp, r1 = F[1].hp / F[1].maxHp;
        this.endRound(r0 >= r1 ? F[0] : F[1], 'TIME!');
      }
      for (const f of F) {
        // mana + focus upkeep in real time so a full bar always buys the same number of seconds
        if (f.focusing) { const d = 19 * dtReal; f.mana -= d; f.focusUsed += d; if (f.mana <= 0) { f.mana = 0; this.endFocus(f); } }
        else {
          f.fatigue = Math.max(0, f.fatigue - dtReal); f.manaDelay -= dtReal;
          if (f.manaDelay <= 0) f.mana = Math.min(f.maxMana, f.mana + 5.5 * (f.char.id === 'eric' ? 1.5 : 1) * dtReal);
        }
        this.ctl[f.idx].update(dtReal, f, this.opp(f), this);
        if (f.buffer && f.canAct) { const b = f.buffer; f.buffer = null; if (performance.now() - b.at < 260) this.input(f, b.action, b.arg); }
      }
      this.updateGrapple(dtReal * this.worldScale);
    } else if (this.phase === 'end') {
      if (this.pt > 1.3 && this.winner && this.winner.state !== 'win' && ['idle', 'subA', 'hit', 'attack', 'dash'].includes(this.winner.state)) this.winner.setState('win');
      if (this.pt > 4.2) {
        if (this.winner && this.winner.wins >= this.roundsToWin) { if (!this.over) { this.over = true; this.fx.matchOver(this.winner, this.endText); } }
        else this.startRound();
      }
    }

    for (const f of F) f.update(dtReal * this.scaleFor(f), this.opp(f), this);
    // body separation
    const a = F[0], b = F[1];
    if (!this.clinch && !this.sub && a.lift < 0.4 && b.lift < 0.4) {
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 1e-3, min = a.radius + b.radius;
      if (d < min) {
        const push = (min - d) / 2, wa = a.S.heavy ? 0.3 : 1, wb = b.S.heavy ? 0.3 : 1, tot = wa + wb;
        a.pos.x -= dx / d * push * 2 * wa / tot; a.pos.z -= dz / d * push * 2 * wa / tot;
        b.pos.x += dx / d * push * 2 * wb / tot; b.pos.z += dz / d * push * 2 * wb / tot;
        clampToCage(a.pos, a.radius); clampToCage(b.pos, b.radius);
      }
    } else if (this.clinch && this.clinch.mode !== 'throw') {
      const { a: A, v } = this.clinch; v.pos.x += (A.pos.x + Math.sin(A.facing) * (A.radius + v.radius) - v.pos.x) * 0.3; v.pos.z += (A.pos.z + Math.cos(A.facing) * (A.radius + v.radius) - v.pos.z) * 0.3;
    }
    for (const f of F) { f.ghostHp += (Math.max(0, f.hp) - f.ghostHp) * Math.min(1, dtReal * 2.5); f.render(); }
  }
}
