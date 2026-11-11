// One combatant: state machine, movement and pose selection. Hit resolution lives in match.js.
import { buildFighter } from './fighterModel.js';
import { ANIMS, POSES, blankPose, mixPose, sampleAnim, dampPose } from './anim.js';
import { clampToCage } from './arena.js';

const NO_FACE = new Set(['down', 'ko', 'getup', 'thrown', 'subA', 'subV', 'tap', 'win']);
const UNTOUCHABLE = new Set(['down', 'ko', 'getup', 'thrown', 'subA', 'subV', 'tap', 'win', 'clinchA', 'clinchV']);

export class Fighter {
  constructor(char, idx, scene) {
    this.char = char; this.idx = idx; this.S = char.stats;
    this.model = buildFighter(char); scene.add(this.model.group);
    this.maxHp = Math.round(this.S.hp * 1.2); this.maxMana = Math.round(100 * this.S.mana);
    this.radius = this.S.radius || 0.36;
    this.pos = { x: 0, z: 0 }; this.kb = { x: 0, z: 0 };
    this.intent = { mx: 0, mz: 0, block: false, zone: 'mid' };
    this.pose = blankPose(); this.target = blankPose();
    this.wins = 0; this.time = Math.random() * 10;
    this.reset(0, 0, 0);
  }

  reset(x, z, facing) {
    this.pos.x = x; this.pos.z = z; this.kb.x = this.kb.z = 0; this.facing = facing;
    this.hp = this.maxHp; this.ghostHp = this.maxHp; this.mana = this.maxMana;
    this.state = 'idle'; this.t = 0; this.move = null; this.zone = 'mid';
    this.focusing = false; this.focusUsed = 0; this.fatigue = 0; this.manaDelay = 0;
    this.blind = 0; this.bleed = 0; this.slow = 0; this.uplink = 0;
    this.comboN = 0; this.secondWind = false; this.lift = 0; this.hidden = 0; this.dashCd = 0;
    this.blockT = 0; this.blockStun = 0; this.lastBlockZone = ''; this.spikeExt = 0; this.walk = 0; this.fenceCd = 0;
    this.buffer = null; this.intent.mx = this.intent.mz = 0; this.intent.block = false;
    this.pose = blankPose(); this.model.group.visible = true;
  }

  get canAct() { return this.state === 'idle' && this.blockStun <= 0; }
  get blocking() { return this.state === 'idle' && this.intent.block; }
  get u() { return this.move ? this.t / this.move.dur : 0; }
  get armored() { return this.state === 'attack' && this.move.armor; }
  get invulnerable() {
    if (UNTOUCHABLE.has(this.state) || this.hidden > 0) return true;
    if (this.state === 'dash' && this.t < 0.2) return true;
    if (this.state === 'attack' && this.move.invuln) { const u = this.u; return u >= this.move.invuln[0] && u <= this.move.invuln[1]; }
    return false;
  }

  startMove(move, zone) {
    this.state = 'attack'; this.t = 0; this.move = move; this.hitIdx = 0; this.tpIdx = 0;
    this.zone = move.hits[0].zone || zone || 'mid';
    this.frames = ANIMS[move.anim](this.zone);
    this.lungeLeft = move.lunge || 0;
  }
  stagger(stun, zone) { this.state = 'hit'; this.t = 0; this.stunT = stun; this.hitZone = zone; this.move = null; this.lift = 0; }
  knockdown() { this.state = 'down'; this.t = 0; this.move = null; this.lift = 0; }
  setState(s) { this.state = s; this.t = 0; this.move = null; }

  dash(dx, dz) {
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    this.dashCd = 0.55; this.state = 'dash'; this.t = 0; this.move = null;
    if (this.S.teleport) {
      this.pos.x += dx * 3.1; this.pos.z += dz * 3.1; clampToCage(this.pos, this.radius);
      this.hidden = 0.09; this.dashDur = 0.2; this.dashV = { x: 0, z: 0 };
      return true;                                    // caller spawns smoke
    }
    this.dashDur = 0.26; this.dashV = { x: dx * 8.5 * this.S.speed, z: dz * 8.5 * this.S.speed };
    return false;
  }

  update(dt, opp, match) {
    this.time += dt; this.t += dt;
    this.dashCd -= dt; this.blockStun -= dt; this.fenceCd -= dt;
    this.blind = Math.max(0, this.blind - dt); this.slow = Math.max(0, this.slow - dt); this.uplink = Math.max(0, this.uplink - dt);
    if (this.hidden > 0) this.hidden -= dt;
    if (this.bleed > 0 && match.phase === 'fight') { this.bleed -= dt; this.hp = Math.max(1, this.hp - 2.2 * dt); }

    const dx = opp.pos.x - this.pos.x, dz = opp.pos.z - this.pos.z, dist = Math.hypot(dx, dz) || 1e-3;
    const fx = dx / dist, fz = dz / dist;
    let vx = 0, vz = 0, damp = 18, walking = false;
    const tgt = this.target;

    switch (this.state) {
      case 'idle': {
        const I = this.intent;
        if (I.block) {
          if (this.lastBlockZone !== I.zone) { this.lastBlockZone = I.zone; this.blockT = 0; }
          this.blockT += dt;
          mixPose(tgt, POSES.stance, this.S.cape ? POSES.blockcape : POSES['block' + I.zone] || POSES.blockmid, 1);
        } else { this.lastBlockZone = ''; mixPose(tgt, POSES.stance, POSES.stance, 0); if (this.S.cape) { tgt.lS[0] = -0.4; tgt.lS[2] = 0.7; tgt.lE[0] = -0.6; } }
        const sp = 3.0 * this.S.speed * (I.block ? 0.45 : 1) * (this.slow > 0 ? 0.6 : 1);
        const ml = Math.hypot(I.mx, I.mz);
        if (ml > 0.01 && this.blockStun <= 0) { vx = I.mx / Math.max(1, ml) * sp; vz = I.mz / Math.max(1, ml) * sp; walking = true; }
        if (walking) {
          this.walk += dt * 9 * this.S.speed; const s = Math.sin(this.walk);
          tgt.lH[0] += s * 0.4; tgt.rH[0] -= s * 0.4; tgt.lK[0] += Math.max(0, -s) * 0.5; tgt.rK[0] += Math.max(0, s) * 0.5;
          tgt.root.y += Math.abs(Math.cos(this.walk)) * 0.025;
        } else { tgt.root.y += Math.sin(this.time * 3) * 0.012; tgt.lS[0] += Math.sin(this.time * 3) * 0.03; tgt.rS[0] += Math.sin(this.time * 3 + 1) * 0.03; }
        break;
      }
      case 'attack': {
        const m = this.move; this.t += dt * (this.S.anim - 1);
        const u = Math.min(1, this.t / m.dur), firstHit = m.hits[0].t;
        sampleAnim(tgt, this.frames, u); damp = 34;
        if (this.lungeLeft > 0 && u < firstHit) {
          const step = Math.min(this.lungeLeft, (m.lunge / (firstHit * m.dur)) * dt * this.S.anim);
          const room = Math.max(0, dist - (this.radius + opp.radius) - 0.05);
          const mv = Math.min(step, room); vx = fx * mv / dt; vz = fz * mv / dt; this.lungeLeft -= step;
        }
        if (m.leap) this.lift = m.leap * Math.sin(Math.PI * Math.min(1, u / firstHit));
        while (m.teleports && this.tpIdx < m.teleports.length && u >= m.teleports[this.tpIdx]) { match.teleport(this, opp, this.tpIdx % 2 === 0); this.tpIdx++; }
        while (this.hitIdx < m.hits.length && u >= m.hits[this.hitIdx].t) { const h = m.hits[this.hitIdx++]; match.resolveHit(this, opp, h); if (this.state !== 'attack') break; }
        if (this.state === 'attack' && u >= 1) { this.state = 'idle'; this.move = null; this.lift = 0; }
        break;
      }
      case 'hit': mixPose(tgt, POSES.stance, POSES['hit' + this.hitZone], 1); damp = 26; if (this.t >= this.stunT) { this.state = 'idle'; this.comboN = 0; } break;
      case 'down': mixPose(tgt, POSES.stance, POSES.down, 1); damp = 11; if (this.t >= 1.05) this.setState('getup'); break;
      case 'ko': mixPose(tgt, POSES.stance, POSES.down, 1); damp = 9; break;
      case 'getup': mixPose(tgt, POSES.stance, POSES.getup, 1); damp = 10; if (this.t >= 0.5) { this.state = 'idle'; this.comboN = 0; } break;
      case 'dash': mixPose(tgt, POSES.stance, POSES.dash, 1); vx = this.dashV.x; vz = this.dashV.z; if (this.t >= this.dashDur) this.state = 'idle'; break;
      case 'clinchA': mixPose(tgt, POSES.stance, match.clinch && match.clinch.pose ? POSES[match.clinch.pose] : POSES.clinchA, 1); damp = 20; break;
      case 'clinchV': mixPose(tgt, POSES.stance, POSES.clinchV, 1); break;
      case 'thrown': mixPose(tgt, POSES.stance, POSES.air, 1); tgt.root.rx = -Math.PI * 2 * Math.min(1, this.t / 0.6); damp = 40; break;
      case 'subA': mixPose(tgt, POSES.stance, POSES.subA, 1); tgt.root.rx += Math.sin(this.time * 7) * 0.05; damp = 10; break;
      case 'subV': case 'tap':
        mixPose(tgt, POSES.stance, POSES.subV, 1); damp = 10;
        if (this.state === 'tap' || (match.sub && match.sub.meter > 70)) { tgt.lS[0] = -2.2 + Math.sin(this.time * 26) * 0.35; damp = 30; }
        else { tgt.rH[0] += Math.sin(this.time * 9) * 0.25; tgt.spine[1] = Math.sin(this.time * 8) * 0.15; }
        break;
      case 'win': mixPose(tgt, POSES.stance, POSES.win, 1); tgt.root.y += Math.abs(Math.sin(this.time * 5)) * 0.06; damp = 8; break;
    }
    dampPose(this.pose, tgt, 1 - Math.exp(-damp * dt));

    // integrate
    const kbs = Math.hypot(this.kb.x, this.kb.z);
    this.pos.x += (vx + this.kb.x) * dt; this.pos.z += (vz + this.kb.z) * dt;
    const k = Math.exp(-7 * dt); this.kb.x *= k; this.kb.z *= k;
    if (clampToCage(this.pos, this.radius) && kbs > 3.5 && this.fenceCd <= 0) { this.fenceCd = 0.6; match.fenceHit(this, kbs); this.kb.x *= -0.3; this.kb.z *= -0.3; }

    if (!NO_FACE.has(this.state)) {
      let d = Math.atan2(dx, dz) - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * (1 - Math.exp(-12 * dt));
    }
    const wantSpikes = this.state === 'attack' && this.move.type === 'punch' ? 1 : 0;
    this.spikeExt += (wantSpikes - this.spikeExt) * Math.min(1, dt * 22);
  }

  render() {
    const g = this.model.group;
    g.visible = this.hidden <= 0;
    g.position.set(this.pos.x, this.lift, this.pos.z); g.rotation.y = this.facing;
    this.model.apply(this.pose);
    this.model.dress(this.time, this.spikeExt, this.blocking || (this.state === 'attack' && this.move.invuln), this.focusing);
  }
}
