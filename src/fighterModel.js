// Procedural, jointed fighter models. Each one is assembled from primitives with
// PBR materials and canvas-painted skin (tattoos, stripes, embroidery).
import * as THREE from 'three';
import { JOINTS } from './anim.js';

const SPH = new THREE.SphereGeometry(1, 24, 16);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20);
const CONE = new THREE.ConeGeometry(1, 1, 14);
const TOR = new THREE.TorusGeometry(1, 0.28, 10, 24);
export const HIP_Y = 0.965;

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

function paint(base, o = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = typeof base === 'number' ? hex(base) : base; g.fillRect(0, 0, 256, 256);
  if (o.stripes) { const n = o.bands || 10; for (let i = 0; i < n; i++) { g.fillStyle = o.stripes[i % o.stripes.length]; g.fillRect(0, i * 256 / n, 256, 256 / n + 1); } }
  // pores / mottling
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = Math.random() < 0.5 ? `rgba(255,220,200,${Math.random() * 0.05})` : `rgba(60,20,10,${Math.random() * 0.06})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  if (o.tattoo) {
    g.lineCap = 'round';
    for (let i = 0; i < o.tattoo; i++) {
      g.strokeStyle = `rgba(${o.ink || '18,34,44'},${0.45 + Math.random() * 0.3})`; g.lineWidth = 2 + Math.random() * 5;
      const x = Math.random() * 256, y = Math.random() * 256, r = 8 + Math.random() * 30;
      g.beginPath(); g.arc(x, y, r, Math.random() * 6, Math.random() * 6 + 2 + Math.random() * 3); g.stroke();
      g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + r, y - r, x - r, y + r * 2, x + r * 1.5, y + r); g.stroke();
    }
  }
  if (o.scars) for (let i = 0; i < o.scars; i++) {
    g.strokeStyle = `rgba(120,30,25,${0.35 + Math.random() * 0.3})`; g.lineWidth = 1.5 + Math.random() * 2;
    const x = Math.random() * 256, y = Math.random() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60); g.stroke();
  }
  if (o.gold) {
    g.strokeStyle = 'rgba(232,186,60,0.95)'; g.lineWidth = 3;
    for (let i = 0; i < 46; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = 6 + Math.random() * 16; g.beginPath(); g.arc(x, y, r, 0, 3 + Math.random() * 3); g.stroke(); g.beginPath(); g.arc(x + r, y, r * 0.5, 2, 6); g.stroke(); }
  }
  if (o.fur) for (let i = 0; i < 5000; i++) {
    const v = 40 + Math.random() * 150; g.strokeStyle = `rgba(${v + 30},${v + 10},${v - 20},0.5)`; g.lineWidth = 1;
    const x = Math.random() * 256, y = Math.random() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 6, y + 5 + Math.random() * 9); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const TM = (base, po = {}, o = {}) => new THREE.MeshStandardMaterial({ map: paint(base, po), roughness: 0.6, ...o });

function add(parent, geo, mat, p = [0, 0, 0], s = [1, 1, 1], r = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(p[0], p[1], p[2]);
  if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(s[0], s[1], s[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  m.castShadow = true; parent.add(m); return m;
}
function joint(parent, x, y, z) {
  const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.order = 'YXZ'; parent.add(o); return o;
}
function limb(parent, len, r, mat) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 14), mat);
  m.position.y = -len / 2; m.castShadow = true; parent.add(m); return m;
}

export function buildFighter(char) {
  const L = char.look, id = char.id, b = L.bulk;
  const bw = 0.6 + 0.4 * b, ba = 0.5 + 0.5 * b, gs = L.gloveSize || 1;
  const group = new THREE.Group(), rig = new THREE.Group();
  rig.scale.setScalar(L.scale); group.add(rig);

  const skinPaint = { titan: { tattoo: 16 }, osaka: { tattoo: 26 }, ragnar: { tattoo: 6, ink: '110,28,20', scars: 10 }, shredder: { scars: 14 }, smiles: { tattoo: 4, ink: '20,120,150' } }[id] || {};
  const skin = TM(L.skin, skinPaint, { roughness: 0.48 });
  const face = M(L.skin, { roughness: 0.52 });
  const trunks = M(L.trunks, { roughness: 0.8 });
  const trim = M(L.trim, { roughness: 0.5, metalness: id === 'ragnar' || id === 'titan' ? 0.7 : 0.1 });
  const steel = M(0x9aa0a8, { metalness: 0.95, roughness: 0.28 });
  const iron = M(0x2e3036, { metalness: 0.85, roughness: 0.45 });
  const leather = M(0x3a2a1e, { roughness: 0.75 });
  const black = M(0x0c0c0e, { roughness: 0.6 });
  const gold = M(0xd9a520, { metalness: 0.9, roughness: 0.3 });
  let torsoM = skin, upArmM = skin, foreArmM = skin, thighM = skin, shinM = skin, headM = face, footM = skin;

  if (id === 'smiles') {
    upArmM = foreArmM = TM('#e8891c', { stripes: ['#e8891c', '#1c8fd0', '#c8202a', '#f2c200', '#1c4fa8'], bands: 12 });
    thighM = shinM = TM('#e8891c', { stripes: ['#e8891c', '#a8201a', '#f2c200', '#a8201a', '#2040a0'], bands: 14 });
    headM = M(0xf4f1ea, { roughness: 0.6 }); footM = M(0xb81c1c);
  } else if (id === 'diablo') {
    torsoM = upArmM = foreArmM = TM('#a01420', { gold: true }, { roughness: 0.55 });
    thighM = shinM = M(0x121217, { roughness: 0.6 }); footM = M(0x08080a, { roughness: 0.3 });
  } else if (id === 'kyoto') {
    torsoM = M(0x14171e, { roughness: 0.45, metalness: 0.35 });
    foreArmM = M(0x3a3e46, { metalness: 0.8, roughness: 0.4 });
    thighM = shinM = M(0x3c3f45, { roughness: 0.85 }); headM = black; footM = M(0x15151a);
  } else if (id === 'osaka') {
    foreArmM = iron; shinM = iron; footM = M(0x4a4030, { roughness: 0.8 });
  } else if (id === 'titan') { footM = black; shinM = skin; }
  else if (id === 'ragnar') { shinM = TM('#4a3524', { fur: true }, { roughness: 0.95 }); footM = leather; }
  else if (id === 'shredder') { footM = black; }
  else if (id === 'eric') { footM = M(0xf0f0f0); }

  // ---- skeleton
  const J = {};
  J.root = joint(rig, 0, HIP_Y, 0);
  add(J.root, SPH, trunks, [0, -0.02, 0], [0.2 * bw, 0.155, 0.16 * bw]);
  J.spine = joint(J.root, 0, 0.06, 0);
  add(J.spine, SPH, torsoM, [0, 0.13, 0], [0.172 * bw, 0.2, 0.128 * bw]);
  if (L.belly) add(J.spine, SPH, torsoM, [0, 0.1, 0.1], [L.belly * 1.08, L.belly * 0.95, L.belly]);
  else if (b > 0.9 && torsoM === skin) for (let r = 0; r < 3; r++) for (const sx of [-1, 1]) add(J.spine, SPH, skin, [sx * 0.043 * bw, 0.06 + r * 0.072, 0.1 * bw], [0.04 * bw, 0.032, 0.024]);
  J.chest = joint(J.spine, 0, 0.27, 0);
  add(J.chest, SPH, torsoM, [0, 0.13, 0.005], [0.238 * bw, 0.2, 0.152 * bw]);
  if (torsoM === skin) for (const sx of [-1, 1]) add(J.chest, SPH, skin, [sx * 0.1 * bw, 0.155, 0.075 * bw], [0.118 * bw, 0.082, 0.06 * bw]);
  add(J.chest, SPH, torsoM, [0, 0.27, -0.02], [0.17 * bw, 0.08, 0.1 * bw]);                 // traps
  add(J.chest, CYL, headM === face ? skin : headM, [0, 0.335, 0], [0.068 * ba, 0.1, 0.068 * ba]);
  J.head = joint(J.chest, 0, 0.38, 0);
  add(J.head, SPH, headM, [0, 0.125, 0.008], [0.104, 0.13, 0.118]);
  add(J.head, SPH, headM, [0, 0.065, 0.03], [0.086, 0.082, 0.092]);
  if (id !== 'kyoto') {
    add(J.head, SPH, headM, [0, 0.105, 0.122], [0.02, 0.028, 0.024]);
    for (const sx of [-1, 1]) {
      add(J.head, SPH, M(0xf2f2f2, { roughness: 0.2 }), [sx * 0.04, 0.14, 0.098], [0.02, 0.012, 0.012]);
      add(J.head, SPH, M(id === 'smiles' ? 0x8a1010 : 0x1a1208, { roughness: 0.2 }), [sx * 0.04, 0.14, 0.108], 0.0085);
      add(J.head, BOX, M(id === 'smiles' ? 0x1c3fa8 : 0x2a1a10), [sx * 0.04, 0.162, 0.104], [0.045, 0.011, 0.02], [0, 0, sx * -0.28]);
      add(J.head, SPH, headM, [sx * 0.105, 0.12, 0], [0.016, 0.03, 0.022]);
    }
    add(J.head, BOX, M(id === 'smiles' ? 0x1c3fa8 : 0x6a3028), [0, 0.062, 0.114], [0.05, 0.012, 0.014]);
  }
  const sx0 = 0.238 * bw + 0.055;
  const arm = (s, glove) => {
    const S = joint(J.chest, s * sx0, 0.2, 0);
    add(S, SPH, upArmM, [0, 0, 0], 0.1 * ba);
    limb(S, 0.3, 0.064 * ba, upArmM);
    const E = joint(S, 0, -0.3, 0);
    limb(E, 0.26, 0.053 * ba, foreArmM);
    const fist = add(E, SPH, M(glove, { roughness: 0.42 }), [0, -0.31, 0.005], [0.07 * gs, 0.085 * gs, 0.076 * gs]);
    return [S, E, fist];
  };
  let lFist, rFist;
  [J.lS, J.lE, lFist] = arm(1, L.gloves[0]);
  [J.rS, J.rE, rFist] = arm(-1, L.gloves[1]);
  const leg = (s) => {
    const H = joint(J.root, s * 0.105 * bw, -0.04, 0);
    limb(H, 0.43, 0.084 * ba, thighM);
    const K = joint(H, 0, -0.43, 0);
    limb(K, 0.41, 0.058 * ba, shinM);
    add(K, BOX, footM, [0, -0.455, 0.06], [0.1 * ba, 0.08, 0.26]);
    return [H, K];
  };
  [J.lH, J.lK] = leg(1); [J.rH, J.rK] = leg(-1);

  const model = { group, rig, J, spikes: [], cape: null, lFist, rFist, tmpQ: new THREE.Quaternion(), tmpQ2: new THREE.Quaternion() };
  const waist = (mat, y = 0.07, sc = 1) => add(J.root, TOR, mat, [0, y, 0], [0.18 * bw * sc, 0.15 * bw * sc, 0.09], [Math.PI / 2, 0, 0]);
  const skirt = (mat, top, h, r0, r1) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 18, 1, true), mat); mat.side = THREE.DoubleSide; m.position.y = top - h / 2; m.castShadow = true; J.root.add(m); return m; };

  // ---- per-character dressing
  if (id === 'eric') {
    add(J.head, SPH, M(0x6b4423, { roughness: 0.9 }), [0, 0.165, -0.012], [0.108, 0.1, 0.12]);
    waist(M(0xffffff));
    for (const s of [-1, 1]) add(J.root, BOX, M(0xffffff), [s * 0.2 * bw, -0.04, 0], [0.012, 0.16, 0.06]);
    add(J.root, SPH, trunks, [0.1 * bw, -0.13, 0], [0.105 * ba, 0.13, 0.11 * ba]); add(J.root, SPH, trunks, [-0.1 * bw, -0.13, 0], [0.105 * ba, 0.13, 0.11 * ba]);
    for (const [E] of [[J.lE], [J.rE]]) add(E, CYL, M(0xffffff), [0, -0.22, 0], [0.054 * ba * gs, 0.05, 0.054 * ba * gs]);
  }
  if (id === 'shredder') {
    for (let i = 0; i < 6; i++) add(J.head, CONE, M(0x8a0c0c, { roughness: 0.6 }), [0, 0.27 - Math.abs(i - 2.5) * 0.012, 0.09 - i * 0.04], [0.016, 0.1, 0.03], [-0.2 + i * 0.12, 0, 0]);
    for (const s of [-1, 1]) add(J.head, SPH, M(0x1a1014), [s * 0.04, 0.14, 0.092], [0.03, 0.024, 0.014]);
    waist(trim);
    for (const [E, s] of [[J.lE, 1], [J.rE, -1]]) {
      add(E, CYL, iron, [0, -0.2, 0], [0.056 * ba, 0.06, 0.056 * ba]);
      for (let i = -1; i <= 1; i++) { const sp = add(E, CONE, steel, [i * 0.032, -0.4, 0.02], [0.012, 0.17, 0.012], [Math.PI, 0, 0]); sp.userData.baseY = -0.4; model.spikes.push(sp); }
    }
    add(J.chest, TOR, steel, [0, 0.3, 0], [0.1, 0.1, 0.03], [Math.PI / 2.3, 0, 0]);
  }
  if (id === 'titan') {
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) add(J.head, BOX, M(0x2a1c26), [s * (0.052 + k * 0.022), 0.115, 0.1 - k * 0.012], [0.011, 0.07, 0.012], [0, 0, s * -0.45]);
    add(J.chest, SPH, leather, [sx0 - 0.02, 0.235, 0], [0.13 * ba, 0.085, 0.13 * ba]);                       // pauldron
    add(J.chest, CYL, steel, [sx0 - 0.02, 0.29, 0.07], [0.035, 0.012, 0.035], [1.2, 0, 0]);
    add(J.chest, BOX, leather, [0.06, 0.12, 0.0], [0.05, 0.02, 0.36 * bw], [0, 0, -0.75]);
    add(J.chest, TOR, steel, [0, 0.24, 0.05], [0.12, 0.15, 0.02], [1.15, 0, 0]);                            // chain
    add(J.chest, new THREE.OctahedronGeometry(1), steel, [0, 0.1, 0.17 * bw], [0.04, 0.05, 0.015]);
    waist(M(0x2c3540), 0.06, 1.05); skirt(trunks, 0.02, 0.26, 0.2 * bw, 0.23 * bw);
    for (const fist of [lFist, rFist]) { add(fist, BOX, M(0xe0b000, { roughness: 0.4 }), [0, 0.55, 0], [2.1, 0.22, 2.1]); add(fist, SPH, steel, [0, -0.55, 0.5], [0.5, 0.4, 0.4]); }
  }
  if (id === 'ragnar') {
    const hair = M(0x4a1c14, { roughness: 0.95 }), fur = TM('#8a7458', { fur: true }, { roughness: 1 });
    add(J.head, SPH, hair, [0, 0.16, -0.025], [0.112, 0.105, 0.12]);
    add(J.head, SPH, hair, [0, -0.02, -0.09], [0.12, 0.24, 0.07]);
    for (const s of [-1, 1]) { add(J.head, CYL, hair, [s * 0.085, -0.06, 0.05], [0.02, 0.26, 0.02], [0.15, 0, 0]); add(J.head, SPH, steel, [s * 0.085, -0.19, 0.07], 0.022); }
    add(J.head, SPH, M(0x40180f, { roughness: 1 }), [0, 0.02, 0.07], [0.085, 0.1, 0.07]);                   // beard
    add(J.head, BOX, M(0x8a1810), [0.03, 0.15, 0.112], [0.008, 0.08, 0.01], [0, 0, 0.3]);                  // scar
    for (const s of [-1, 1]) { add(J.chest, SPH, fur, [s * sx0 * 0.95, 0.27, -0.02], [0.2 * ba, 0.13, 0.2 * ba]); add(J.chest, SPH, fur, [s * sx0 * 0.5, 0.28, -0.1], [0.18, 0.12, 0.14]); }
    add(J.chest, SPH, fur, [0, 0.1, -0.16 * bw], [0.24 * bw, 0.3, 0.06]);
    add(J.chest, BOX, leather, [0, 0.1, 0.012], [0.05, 0.02, 0.4 * bw], [0.0, Math.PI / 2, 0.7]).scale.set(0.5 * bw, 0.05, 0.33 * bw);
    add(J.chest, CYL, steel, [0, 0.14, 0.16 * bw], [0.05, 0.02, 0.05], [Math.PI / 2, 0, 0]);
    waist(leather, 0.06, 1.08); add(J.root, CYL, steel, [0, 0.06, 0.17 * bw], [0.045, 0.02, 0.045], [Math.PI / 2, 0, 0]);
    skirt(M(0x2e2018, { roughness: 0.9 }), 0.03, 0.34, 0.2 * bw, 0.24 * bw);
    for (const E of [J.lE, J.rE]) { add(E, CYL, fur, [0, -0.14, 0], [0.075 * ba, 0.16, 0.075 * ba]); add(E, CYL, leather, [0, -0.23, 0], [0.058 * ba, 0.05, 0.058 * ba]); }
  }
  if (id === 'smiles') {
    const o1 = M(0xf06a10, { roughness: 1 }), o2 = M(0xf7a020, { roughness: 1 });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, ring = i % 3, r = 0.13 + ring * 0.03;
      add(J.head, SPH, i % 2 ? o1 : o2, [Math.sin(a) * r, 0.17 + Math.cos(a * 2 + ring) * 0.05 + ring * 0.035, -0.03 + Math.cos(a) * r * 0.75 - 0.03], 0.075 + (i % 4) * 0.01);
    }
    add(J.head, SPH, o1, [0, 0.29, -0.02], 0.12);
    add(J.head, SPH, M(0xd01818, { roughness: 0.3 }), [0, 0.105, 0.135], 0.026);
    for (const s of [-1, 1]) { add(J.head, BOX, M(0x1c3fa8), [s * 0.04, 0.115, 0.108], [0.012, 0.07, 0.01]); add(J.head, BOX, M(0xc81818), [s * 0.066, 0.06, 0.09], [0.008, 0.06, 0.01], [0, 0, s * 0.5]); }
    add(J.head, new THREE.TorusGeometry(1, 0.2, 8, 16, Math.PI), M(0xb01414), [0, 0.075, 0.1], [0.045, 0.03, 0.03], [0.2, 0, Math.PI]);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; add(J.chest, SPH, M(i % 2 ? 0xc8202a : 0xf2a000, { roughness: 0.8 }), [Math.sin(a) * 0.15, 0.33, Math.cos(a) * 0.14], [0.055, 0.03, 0.055]); }
    add(J.spine, BOX, M(0x1c3fa8), [0, 0.2, 0.125 * bw], [0.05, 0.48, 0.03]);
    for (let i = 0; i < 4; i++) add(J.spine, SPH, gold, [0, 0.03 + i * 0.12, 0.142 * bw], 0.016);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 0.21 + k * 0.035; add(J.root, SPH, M((i + k) % 2 ? 0xc8202a : 0x1c8fd0, { roughness: 0.85 }), [Math.sin(a) * r, 0.02 - k * 0.11, Math.cos(a) * r * 0.85], [0.07, 0.065, 0.07]); }
    for (const E of [J.lE, J.rE]) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(E, SPH, M(0xc8202a, { roughness: 0.85 }), [Math.sin(a) * 0.06, -0.22, Math.cos(a) * 0.06], 0.03); }
    rFist.material.emissive = new THREE.Color(0x1c8a18); rFist.material.emissiveIntensity = 0.5;
    add(J.rE, CYL, iron, [0.03, -0.25, 0.05], [0.012, 0.07, 0.012]);                                        // irritant nozzle
  }
  if (id === 'diablo') {
    const hair = M(0x17120f, { roughness: 0.85 });
    add(J.head, SPH, hair, [0, 0.17, -0.015], [0.11, 0.1, 0.122]); add(J.head, SPH, hair, [0, 0.21, 0.04], [0.085, 0.05, 0.08]);
    add(J.head, BOX, hair, [0, 0.082, 0.118], [0.06, 0.008, 0.012]); add(J.head, SPH, hair, [0, 0.02, 0.085], [0.03, 0.035, 0.02]);
    for (const s of [-1, 1]) { add(J.chest, SPH, gold, [s * sx0, 0.27, 0], [0.11, 0.045, 0.1]); add(J.chest, BOX, gold, [s * 0.07, 0.1, 0.15 * bw], [0.018, 0.34, 0.012]); }
    add(J.chest, BOX, M(0xf4f0e6), [0, 0.2, 0.15 * bw], [0.07, 0.16, 0.012]);
    waist(M(0xb8141c), 0.06, 1.05);
    for (const K of [J.lK, J.rK]) add(K, CYL, footM, [0, -0.27, 0], [0.066, 0.3, 0.07]);
    for (const H of [J.lH, J.rH]) add(H, BOX, gold, [H === J.lH ? 0.085 : -0.085, -0.2, 0], [0.012, 0.4, 0.03]);
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xc0101c, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x30040a });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.95, 4, 6), capeMat); back.position.set(0, -0.12, -0.2); back.rotation.x = 0.16; back.castShadow = true; J.chest.add(back);
    const cape = new THREE.Group(); cape.position.set(0, -0.3, 0); J.lE.add(cape);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.1, 8, 8), capeMat); sheet.position.set(0.3, -0.5, 0.04); sheet.castShadow = true; cape.add(sheet);
    add(cape, CYL, M(0x5a3a1c), [0.3, 0.02, 0.04], [0.012, 0.95, 0.012], [0, 0, Math.PI / 2]);
    for (const dx of [-0.16, 0.76]) add(cape, CYL, steel, [dx, -0.5, 0.045], [0.008, 1.1, 0.008]);          // the "illegal" rigid frame
    model.cape = cape; model.capeSheet = sheet; model.capeBase = sheet.geometry.attributes.position.array.slice();
  }
  if (id === 'osaka') {
    for (let i = 0; i < 4; i++) add(J.head, SPH, M(0x1a1a1e, { roughness: 0.9 }), [0, 0.265 + i * 0.035, -0.02 + i * 0.008], 0.034 - i * 0.004);
    add(J.head, BOX, M(0x8a2018), [0.045, 0.16, 0.105], [0.008, 0.07, 0.01], [0, 0, 0.25]);
    add(J.head, SPH, face, [0, 0.03, 0.02], [0.105, 0.07, 0.1]);                                            // jowls
    for (const s of [-1, 1]) { add(J.chest, BOX, leather, [s * 0.13 * bw, 0.1, 0.02], [0.07, 0.5, 0.33 * bw]); add(J.chest, CYL, steel, [s * 0.13 * bw, 0.22, 0.17 * bw], [0.018, 0.015, 0.018], [Math.PI / 2, 0, 0]); }
    add(J.chest, SPH, skin, [0, 0.02, 0.1 * bw], [0.2 * bw, 0.13, 0.12 * bw]);
    const belt = add(J.root, TOR, M(0x16181e, { roughness: 0.5, metalness: 0.5 }), [0, 0.08, 0.03], [0.4, 0.38, 0.22], [Math.PI / 2, 0, 0]);
    add(J.root, BOX, iron, [0, 0.08, -0.36], [0.26, 0.18, 0.14]);                                           // hydraulic unit
    for (const s of [-1, 1]) add(J.root, CYL, steel, [s * 0.2, 0.08, -0.33], [0.035, 0.26, 0.035], [0, 0, 1.2 * s]);
    model.device = add(J.root, SPH, new THREE.MeshStandardMaterial({ color: 0x30ff60, emissive: 0x30ff60, emissiveIntensity: 2 }), [0, 0.15, -0.44], 0.022);
    skirt(trunks, 0.04, 0.4, 0.4, 0.42); add(J.root, BOX, trunks, [0, -0.22, 0.4], [0.24, 0.42, 0.03]);
    for (const E of [J.lE, J.rE]) for (let i = 0; i < 3; i++) add(E, TOR, steel, [0, -0.06 - i * 0.08, 0], [0.058 * ba, 0.058 * ba, 0.03], [Math.PI / 2, 0, 0]);
    for (const K of [J.lK, J.rK]) { add(K, BOX, iron, [0, -0.2, 0.05], [0.17, 0.34, 0.12]); add(K, SPH, iron, [0, 0, 0.06], [0.1, 0.09, 0.08]); for (let i = 0; i < 3; i++) add(K, CYL, steel, [0, -0.08 - i * 0.11, 0.115], [0.014, 0.012, 0.014], [Math.PI / 2, 0, 0]); }
  }
  if (id === 'kyoto') {
    const cloth = M(0x15233a, { roughness: 0.9, side: THREE.DoubleSide });
    add(J.head, BOX, face, [0, 0.142, 0.094], [0.15, 0.03, 0.05]);                                         // eye slit
    for (const s of [-1, 1]) { add(J.head, SPH, M(0xf0f0f0), [s * 0.04, 0.142, 0.118], [0.018, 0.009, 0.006]); add(J.head, SPH, M(0x100806), [s * 0.04, 0.142, 0.122], 0.006); }
    const hood = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.66), cloth);
    hood.scale.set(0.145, 0.165, 0.16); hood.position.set(0, 0.13, -0.015); hood.rotation.x = -1.2; hood.castShadow = true; J.head.add(hood);
    model.led = add(J.head, SPH, new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 3 }), [0.1, 0.13, 0.05], 0.009);
    add(J.head, CYL, iron, [0.105, 0.17, 0.02], [0.004, 0.07, 0.004]);
    add(J.chest, SPH, cloth, [0, 0.27, -0.01], [0.3 * bw, 0.1, 0.19 * bw]);
    const cloak = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8, 3, 4), cloth); cloak.position.set(0, -0.1, -0.19); cloak.rotation.x = 0.2; cloak.castShadow = true; J.chest.add(cloak);
    for (const s of [-1, 1]) add(J.chest, BOX, leather, [s * 0.09, 0.12, 0.15 * bw], [0.03, 0.34, 0.012], [0, 0, s * 0.35]);
    for (let r = 0; r < 3; r++) add(J.spine, BOX, M(0x1c2029, { metalness: 0.5, roughness: 0.4 }), [0, 0.05 + r * 0.085, 0.118 * bw], [0.2, 0.07, 0.02]);
    waist(M(L.trim, { roughness: 0.7 }), 0.06, 1.06); add(J.root, CYL, gold, [0, 0.06, 0.165 * bw], [0.04, 0.015, 0.04], [Math.PI / 2, 0, 0]);
    for (const E of [J.lE, J.rE]) add(E, BOX, steel, [0, -0.14, 0.04], [0.06, 0.18, 0.025]);
    add(J.root, BOX, M(0x8a1418), [-0.12, -0.14, 0.12], [0.07, 0.3, 0.012]);
  }
  if (id !== 'titan' && id !== 'ragnar' && id !== 'osaka' && id !== 'eric' && id !== 'kyoto' && id !== 'diablo' && id !== 'smiles') {
    for (const s of [-1, 1]) add(J.root, SPH, trunks, [s * 0.1 * bw, -0.13, 0], [0.1 * ba, 0.12, 0.105 * ba]);
  }

  // focus aura
  const aura = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.72, 40), new THREE.MeshBasicMaterial({ color: 0x3aa8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  aura.rotation.x = -Math.PI / 2; aura.position.y = 0.03; group.add(aura); model.aura = aura;
  const glow = new THREE.PointLight(0x3a9cff, 0, 6, 0); glow.position.y = 1.2; group.add(glow); model.glow = glow;

  model.apply = (pose) => {
    const r = pose.root;
    J.root.position.set(0, HIP_Y + r.y, r.z); J.root.rotation.set(r.rx, r.ry, r.rz);
    for (const j of JOINTS) { const v = pose[j]; J[j].rotation.set(v[0], v[1], v[2]); }
    let yaw = Math.atan2(Math.sin(r.ry), Math.cos(r.ry));
    J.head.rotation.y += Math.max(-1.2, Math.min(1.2, -yaw * 0.85));
  };
  // spikes: 0 retracted .. 1 extended.  cape: hang it in world space.
  model.dress = (time, spikeExt, rigid, focus) => {
    for (const sp of model.spikes) { sp.scale.y = 0.02 + 0.17 * spikeExt; sp.position.y = -0.33 - 0.085 * spikeExt; sp.visible = spikeExt > 0.03; }
    if (model.cape) {
      model.cape.parent.getWorldQuaternion(model.tmpQ).invert();
      group.getWorldQuaternion(model.tmpQ2);
      model.cape.quaternion.copy(model.tmpQ).multiply(model.tmpQ2);
      const pos = model.capeSheet.geometry.attributes.position, base = model.capeBase;
      for (let i = 0; i < pos.count; i++) { const y = base[i * 3 + 1], x = base[i * 3]; pos.setZ(i, rigid ? 0 : Math.sin(time * 3.5 + x * 5 + y * 4) * 0.07 * (0.6 - y)); }
      pos.needsUpdate = true;
    }
    if (model.led) model.led.material.emissiveIntensity = 2 + Math.sin(time * 9) * 1.5;
    if (model.device) model.device.material.emissiveIntensity = 1.5 + Math.sin(time * 5) * 1;
    aura.material.opacity += ((focus ? 0.75 : 0) - aura.material.opacity) * 0.2;
    aura.rotation.z = time * 2; aura.scale.setScalar(1 + Math.sin(time * 6) * 0.08);
    glow.intensity = aura.material.opacity * 2.2;
  };
  return model;
}
