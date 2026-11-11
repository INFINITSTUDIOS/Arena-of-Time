// Pose library + keyframe sampling for the procedural fighter rig.
// Every joint value is [pitch(x), yaw(y), roll(z)] applied in YXZ order.
// Limbs hang along -Y; negative pitch swings a limb forward (+Z, toward the opponent).

export const JOINTS = ['spine', 'chest', 'head', 'lS', 'lE', 'rS', 'rE', 'lH', 'lK', 'rH', 'rK'];
const ROOT_KEYS = ['y', 'z', 'rx', 'ry', 'rz'];

export const STANCE = {
  root: { y: -0.07, z: 0, rx: 0.05, ry: -0.35, rz: 0 },
  spine: [0.08, 0, 0], chest: [0.08, 0, 0], head: [0, 0, 0],
  lS: [-0.75, 0, 0.25], lE: [-1.9, 0, 0], rS: [-0.45, 0, -0.3], rE: [-2.2, 0, 0],
  lH: [-0.42, 0, 0.08], lK: [0.6, 0, 0], rH: [0.22, 0, -0.08], rK: [0.5, 0, 0],
};

const aim = { high: -1.72, mid: -1.42, low: -1.0 };
const dip = { high: 0, mid: -0.04, low: -0.24 };
const kAim = { high: -2.2, mid: -1.65, low: -1.0 };

const PL = (z) => ({ root: { y: -0.07 + dip[z], z: 0.18, ry: -0.75, rx: 0.12 }, lS: [aim[z], 0.7, 0], lE: [-0.06, 0, 0], rS: [-0.5, 0, -0.3], rE: [-2.3, 0, 0] });
const PR = (z) => ({ root: { y: -0.1 + dip[z], z: 0.22, ry: 0.55, rx: 0.16 }, rS: [aim[z], -0.55, 0], rE: [-0.06, 0, 0], lS: [-0.6, 0, 0.3], lE: [-2.3, 0, 0], rH: [0.4, 0, -0.08], rK: [0.75, 0, 0] });
const WR = { root: { ry: -0.7 }, rS: [-0.2, 0, -0.5], rE: [-2.3, 0, 0] };
const FC = { root: { rx: -0.1, ry: -0.1 }, lH: [-1.6, 0, 0], lK: [1.9, 0, 0], rH: [0.05, 0, 0], rK: [0.2, 0, 0] };
const FK = (z) => ({ root: { rx: -0.25, ry: -0.1, z: 0.1 }, lH: [kAim[z] + 0.25, 0.1, 0], lK: [0.04, 0, 0], rH: [0.1, 0, 0], rK: [0.15, 0, 0], lS: [0.2, 0, 0.5], lE: [-0.8, 0, 0] });
const RC = { root: { ry: 0.5, rz: 0.1 }, rH: [-1.2, -0.3, -0.7], rK: [1.9, 0, 0], lH: [-0.1, 0, 0], lK: [0.2, 0, 0] };
const RK = (z) => ({ root: { ry: 1.1, rz: 0.26, rx: -0.1 }, rH: [kAim[z], -1.1, 0], rK: [0.05, 0, 0], lH: [0, 0, 0.1], lK: [0.15, 0, 0], rS: [0.4, 0, -0.5], rE: [-0.6, 0, 0], lS: [-1.0, 0, 0.3], lE: [-2.1, 0, 0] });
const CROUCH = { root: { y: -0.45, rx: 0.4, ry: 0 }, lH: [-1.3, 0, 0.2], lK: [1.9, 0, 0], rH: [-1.0, 0, -0.2], rK: [1.9, 0, 0] };
const TAU = Math.PI * 2;

export const POSES = {
  stance: {},
  blockhigh: { root: { ry: -0.2 }, lS: [-1.25, 0, 0.1], lE: [-2.35, 0, 0], rS: [-1.25, 0, -0.1], rE: [-2.35, 0, 0], head: [0.2, 0, 0] },
  blockmid: { root: { ry: -0.2, rx: 0.16 }, lS: [-0.55, 0, -0.15], lE: [-2.0, 0, 0], rS: [-0.55, 0, 0.15], rE: [-2.0, 0, 0] },
  blocklow: { root: { ry: -0.2, y: -0.28, rx: 0.2 }, lS: [-0.6, 0, 0], lE: [-0.5, 0, 0], rS: [-0.4, 0, 0], rE: [-0.8, 0, 0], lH: [-1.0, 0, 0.1], lK: [1.3, 0, 0] },
  blockcape: { root: { ry: -0.55 }, lS: [-1.35, 0.55, 0], lE: [-0.4, 0, 0], rS: [-0.5, 0, -0.3], rE: [-2.2, 0, 0] },
  hithigh: { root: { rx: -0.3, ry: -0.1 }, chest: [-0.25, 0, 0], head: [-0.6, 0, 0.3], lS: [-0.3, 0, 0.4], lE: [-1.2, 0, 0], rS: [-0.3, 0, -0.4], rE: [-1.2, 0, 0] },
  hitmid: { root: { rx: 0.3, y: -0.12, z: -0.1 }, spine: [0.55, 0, 0], chest: [0.3, 0, 0], head: [0.3, 0, 0], lS: [-0.2, 0, 0.2], lE: [-1.6, 0, 0], rS: [-0.2, 0, -0.2], rE: [-1.6, 0, 0] },
  hitlow: { root: { y: -0.22, rz: 0.18 }, spine: [0.3, 0, 0], lH: [-0.7, 0, 0.1], lK: [1.3, 0, 0] },
  down: { root: { rx: -1.5, ry: 0, y: -0.8 }, head: [0.2, 0, 0], lS: [-0.2, 0, 1.2], lE: [-0.3, 0, 0], rS: [-0.2, 0, -1.2], rE: [-0.3, 0, 0], lH: [-0.15, 0, 0.2], lK: [0.2, 0, 0], rH: [-0.1, 0, -0.2], rK: [0.3, 0, 0] },
  getup: { root: { y: -0.5, rx: 0.5, ry: 0 }, lH: [-1.5, 0, 0.2], lK: [2.2, 0, 0], rH: [-0.3, 0, -0.1], rK: [1.9, 0, 0], lS: [-0.3, 0, 0.2], lE: [-0.6, 0, 0], rS: [0.2, 0, -0.2], rE: [-0.3, 0, 0] },
  win: { root: { ry: 0, y: 0 }, head: [-0.2, 0, 0], lS: [-2.9, 0, 0.4], lE: [-0.3, 0, 0], rS: [-2.9, 0, -0.4], rE: [-0.3, 0, 0], lH: [-0.05, 0, 0.12], lK: [0.1, 0, 0], rH: [-0.05, 0, -0.12], rK: [0.1, 0, 0] },
  clinchA: { root: { ry: 0, rx: 0.15 }, lS: [-1.5, -0.3, 0], lE: [-0.9, 0, 0], rS: [-1.5, 0.3, 0], rE: [-0.9, 0, 0] },
  clinchV: { root: { ry: 0, rx: 0.45, y: -0.1 }, spine: [0.3, 0, 0], head: [0.3, 0, 0], lS: [-0.8, 0, 0.3], lE: [-1.2, 0, 0], rS: [-0.8, 0, -0.3], rE: [-1.2, 0, 0] },
  knee: { root: { ry: 0, rx: -0.12 }, lS: [-1.3, -0.3, 0], lE: [-1.4, 0, 0], rS: [-1.3, 0.3, 0], rE: [-1.4, 0, 0], rH: [-1.75, 0, 0], rK: [2.1, 0, 0], lH: [0, 0, 0], lK: [0.1, 0, 0] },
  throwA: { root: { ry: 2.3, rx: 0.45, y: -0.18 }, lS: [-1.3, -0.4, 0], lE: [-1.2, 0, 0], rS: [-1.3, 0.4, 0], rE: [-1.2, 0, 0] },
  air: { root: { ry: 0 }, spine: [0.5, 0, 0], lH: [-1.2, 0, 0.2], lK: [1.5, 0, 0], rH: [-0.9, 0, -0.2], rK: [1.6, 0, 0], lS: [-0.5, 0, 0.9], lE: [-0.6, 0, 0], rS: [-0.5, 0, -0.9], rE: [-0.6, 0, 0] },
  subV: { root: { rx: 1.45, ry: 0, y: -0.78 }, head: [-0.5, 0, 0], lS: [-2.6, 0, 0.5], lE: [-0.4, 0, 0], rS: [-1.0, 0, -0.9], rE: [-1.2, 0, 0], lH: [0.1, 0, 0.15], lK: [0.2, 0, 0], rH: [0.1, 0, -0.15], rK: [0.4, 0, 0] },
  subA: { root: { y: -0.45, rx: 0.7, ry: 0 }, lH: [-1.6, 0, 0.4], lK: [2.3, 0, 0], rH: [-1.6, 0, -0.4], rK: [2.3, 0, 0], lS: [-1.0, -0.3, 0], lE: [-1.3, 0, 0], rS: [-1.0, 0.3, 0], rE: [-1.3, 0, 0] },
  dash: { root: { y: -0.16, rx: 0.3 } },
};

export const ANIMS = {
  jab: (z) => [[0, {}], [0.36, PL(z)], [0.55, PL(z)], [1, {}]],
  cross: (z) => [[0, {}], [0.2, WR], [0.42, PR(z)], [0.6, PR(z)], [1, {}]],
  front: (z) => [[0, {}], [0.25, FC], [0.46, FK(z)], [0.6, FK(z)], [1, {}]],
  round: (z) => [[0, {}], [0.28, RC], [0.5, RK(z)], [0.62, RK(z)], [1, {}]],
  lowkick: () => [[0, {}], [0.26, RC], [0.48, RK('low')], [0.62, RK('low')], [1, {}]],
  grab: () => { const g = { root: { z: 0.3, rx: 0.35, ry: 0, y: -0.15 }, lS: [-1.45, 0.3, 0], lE: [-0.3, 0, 0], rS: [-1.45, -0.3, 0], rE: [-0.3, 0, 0] }; return [[0, {}], [0.5, g], [0.7, g], [1, {}]]; },
  uppercut: () => { const u = { root: { y: 0.08, ry: 0.6, rx: -0.1 }, rS: [-2.5, -0.5, 0], rE: [-1.3, 0, 0], lS: [-0.5, 0, 0.3], lE: [-2.2, 0, 0] };
    return [[0, {}], [0.3, { root: { y: -0.32, ry: -0.5, rx: 0.3 }, rS: [0.3, 0, -0.2], rE: [-1.6, 0, 0] }], [0.5, u], [0.68, u], [1, {}]]; },
  hook: () => { const h = { root: { ry: -1.0, z: 0.15 }, lS: [0, -1.1, 1.45], lE: [-1.5, 0, 0] };
    return [[0, {}], [0.28, { root: { ry: 0.2 }, lS: [0, 0.4, 1.4], lE: [-1.4, 0, 0] }], [0.5, h], [0.66, h], [1, {}]]; },
  haymaker: () => { const h = { root: { ry: 0.95, z: 0.3, rx: 0.2 }, rS: [0, 1.3, -1.45], rE: [-1.0, 0, 0], lS: [-0.4, 0, 0.4], lE: [-2.0, 0, 0] };
    return [[0, {}], [0.4, { root: { ry: -1.05, y: -0.14 }, rS: [0, -0.7, -1.45], rE: [-1.3, 0, 0] }], [0.62, h], [0.78, h], [1, {}]]; },
  slap: () => { const h = { root: { ry: 0.8, z: 0.2 }, rS: [0, 1.2, -1.5], rE: [-0.5, 0, 0] };
    return [[0, {}], [0.3, { root: { ry: -0.8 }, rS: [0, -0.6, -1.5], rE: [-0.6, 0, 0] }], [0.5, h], [0.66, h], [1, {}]]; },
  spin: () => { const k = { root: { ry: 5.6, rz: 0.2 }, rH: [-1.8, 0.68, 0], rK: [0.05, 0, 0], lH: [0, 0, 0.1], lK: [0.15, 0, 0] };
    return [[0, {}], [0.3, { root: { ry: 2.6, y: -0.1 }, rH: [-0.6, 0, 0], rK: [1.5, 0, 0] }], [0.6, k], [0.74, k], [1, { root: { ry: TAU - 0.35 } }]]; },
  flurry: () => [[0, {}], [0.14, PL('high')], [0.24, PR('mid')], [0.34, PL('mid')], [0.44, PR('high')], [0.56, PL('high')], [0.7, WR], [0.82, PR('high')], [0.9, PR('high')], [1, {}]],
  hammer: () => { const d = { root: { y: -0.25, rx: 0.5, ry: 0 }, lS: [-1.1, 0.2, 0], lE: [-0.2, 0, 0], rS: [-1.1, -0.2, 0], rE: [-0.2, 0, 0] };
    return [[0, {}], [0.4, { root: { y: 0.05, rx: -0.25, ry: 0 }, lS: [-2.9, 0, 0.2], lE: [-0.5, 0, 0], rS: [-2.9, 0, -0.2], rE: [-0.5, 0, 0] }], [0.6, d], [0.78, d], [1, {}]]; },
  stomp: () => { const d = { root: { ry: 0, y: -0.26 }, lH: [-0.7, 0, 0.3], lK: [1.0, 0, 0], rH: [-0.5, 0, -0.3], rK: [1.0, 0, 0], lS: [-0.3, 0, 0.6], lE: [-0.5, 0, 0], rS: [-0.3, 0, -0.6], rE: [-0.5, 0, 0] };
    return [[0, {}], [0.4, { root: { ry: 0, rz: -0.18 }, lH: [-1.7, 0, 0.35], lK: [1.6, 0, 0], lS: [-1.0, 0, 1.0], rS: [-1.0, 0, -1.0] }], [0.62, d], [0.8, d], [1, {}]]; },
  headbutt: () => { const h = { root: { rx: 0.6, ry: 0, z: 0.3 }, head: [0.5, 0, 0], lS: [0.4, 0, 0.3], lE: [-0.5, 0, 0], rS: [0.4, 0, -0.3], rE: [-0.5, 0, 0] };
    return [[0, {}], [0.3, { root: { rx: -0.3, ry: 0 }, head: [-0.4, 0, 0], lS: [-1.2, 0.3, 0], lE: [-1, 0, 0], rS: [-1.2, -0.3, 0], rE: [-1, 0, 0] }], [0.5, h], [0.68, h], [1, {}]]; },
  tackle: () => { const t = { root: { y: -0.2, rx: 0.9, ry: -0.5, z: 0.3 }, lS: [-1.2, 0.5, 0], lE: [-1.6, 0, 0], rS: [0.4, 0, -0.3], rE: [-0.4, 0, 0], lH: [-1.0, 0, 0], lK: [1.0, 0, 0], rH: [0.6, 0, 0], rK: [0.3, 0, 0] };
    return [[0, {}], [0.25, CROUCH], [0.55, t], [0.72, t], [1, {}]]; },
  rise: () => { const u = { root: { y: 0.28, rx: -0.15, ry: 0.6 }, rS: [-2.8, -0.5, 0], rE: [-0.4, 0, 0], lH: [0.1, 0, 0], lK: [0.1, 0, 0], rH: [0.2, 0, 0], rK: [0.2, 0, 0] };
    return [[0, {}], [0.35, CROUCH], [0.55, u], [0.7, u], [1, {}]]; },
  spray: () => { const s = { root: { ry: 0.5, z: 0.2 }, rS: [-1.6, -0.5, 0], rE: [-0.05, 0, 0], head: [0.1, 0, -0.3] };
    return [[0, {}], [0.28, { rS: [-0.6, 0, -0.3], rE: [-2.0, 0, 0] }], [0.45, s], [0.78, s], [1, {}]]; },
  capesweep: () => [[0, {}], [0.15, { root: { ry: -0.9 }, lS: [-1.3, 1.0, 0], lE: [-0.3, 0, 0] }], [0.5, { root: { ry: 0.6, rz: -0.1 }, lS: [-1.3, -1.0, 0], lE: [-0.3, 0, 0] }], [0.62, PR('mid')], [0.76, PR('mid')], [1, {}]],
  thrust: () => { const t = { root: { ry: 0.9, y: -0.25, z: 0.45, rx: 0.25 }, rS: [-1.45, -0.9, 0], rE: [0, 0, 0], lS: [0.6, 0, 0.5], lE: [-0.2, 0, 0], lH: [-0.9, 0, 0], lK: [0.9, 0, 0], rH: [0.6, 0, 0], rK: [0.2, 0, 0] };
    return [[0, {}], [0.3, { root: { ry: -0.9, y: -0.15 }, rS: [-0.2, 0, -0.3], rE: [-2.2, 0, 0], lS: [-1.5, 0.9, 0], lE: [-0.1, 0, 0] }], [0.55, t], [0.72, t], [1, {}]]; },
  bash: () => { const b = { root: { ry: -0.9, z: 0.45, rx: 0.3 }, lS: [-1.5, 0.9, 0], lE: [-0.6, 0, 0] };
    return [[0, {}], [0.3, { root: { ry: -0.6, y: -0.15 }, lS: [-1.3, 0.6, 0], lE: [-1.3, 0, 0] }], [0.56, b], [0.74, b], [1, {}]]; },
  flop: () => { const a = { lS: [-0.5, 0, 1.3], lE: [-0.2, 0, 0], rS: [-0.5, 0, -1.3], rE: [-0.2, 0, 0], lH: [0.4, 0, 0.2], lK: [0.2, 0, 0], rH: [0.4, 0, -0.2], rK: [0.2, 0, 0] };
    return [[0, {}], [0.2, CROUCH], [0.42, { root: { rx: 0.9, ry: 0, y: 0 }, ...a }], [0.6, { root: { rx: 1.45, ry: 0, y: -0.6 }, ...a }], [0.82, { root: { rx: 1.45, ry: 0, y: -0.6 }, ...a }], [0.93, POSES.getup], [1, {}]]; },
  triple: () => [[0, {}], [0.24, PR('mid')], [0.36, {}], [0.44, RC], [0.52, RK('low')], [0.64, {}], [0.8, PR('high')], [0.9, PR('high')], [1, {}]],
};

export function blankPose() {
  const p = { root: { ...STANCE.root } };
  for (const j of JOINTS) p[j] = [...STANCE[j]];
  return p;
}

const sm = (k) => k * k * (3 - 2 * k);

// Write lerp(a,b,k) of two partial poses into `out` (missing keys fall back to STANCE).
export function mixPose(out, a, b, k) {
  const ar = a.root || {}, br = b.root || {};
  for (const key of ROOT_KEYS) {
    const va = ar[key] ?? STANCE.root[key], vb = br[key] ?? STANCE.root[key];
    out.root[key] = va + (vb - va) * k;
  }
  for (const j of JOINTS) {
    const va = a[j] || STANCE[j], vb = b[j] || STANCE[j], o = out[j];
    o[0] = va[0] + (vb[0] - va[0]) * k; o[1] = va[1] + (vb[1] - va[1]) * k; o[2] = va[2] + (vb[2] - va[2]) * k;
  }
  return out;
}

export function sampleAnim(out, frames, u) {
  u = Math.min(1, Math.max(0, u));
  let i = 0;
  while (i < frames.length - 2 && frames[i + 1][0] <= u) i++;
  const [t0, p0] = frames[i], [t1, p1] = frames[i + 1];
  return mixPose(out, p0, p1, sm(Math.min(1, Math.max(0, (u - t0) / Math.max(1e-5, t1 - t0)))));
}

// Exponentially ease `cur` toward `target` (handles full-turn spins on root yaw).
export function dampPose(cur, target, k) {
  let d = target.root.ry - cur.root.ry;
  while (d > Math.PI) { cur.root.ry += Math.PI * 2; d -= Math.PI * 2; }
  while (d < -Math.PI) { cur.root.ry -= Math.PI * 2; d += Math.PI * 2; }
  for (const key of ROOT_KEYS) cur.root[key] += (target.root[key] - cur.root[key]) * k;
  for (const j of JOINTS) { const c = cur[j], t = target[j]; c[0] += (t[0] - c[0]) * k; c[1] += (t[1] - c[1]) * k; c[2] += (t[2] - c[2]) * k; }
}
