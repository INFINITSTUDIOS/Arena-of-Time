// Roster + move data. Times in `hits[].t` are fractions of the move duration.
// zone: 'high' | 'mid' | 'low'; omitted = wherever the attacker is aiming.

export const BASE_MOVES = {
  jab:   { name: 'Jab', anim: 'jab', dur: 0.30, type: 'punch', lunge: 0.15, hits: [{ t: 0.36, dmg: 4, range: 1.3, stun: 0.42, kb: 1.0 }] },
  cross: { name: 'Power Cross', anim: 'cross', dur: 0.46, type: 'punch', lunge: 0.3, hits: [{ t: 0.42, dmg: 8, range: 1.4, stun: 0.46, kb: 2.4 }] },
  front: { name: 'Push Kick', anim: 'front', dur: 0.48, type: 'kick', lunge: 0.2, hits: [{ t: 0.46, dmg: 6, range: 1.65, stun: 0.36, kb: 5 }] },
  round: { name: 'Roundhouse', anim: 'round', dur: 0.62, type: 'kick', lunge: 0.25, hits: [{ t: 0.5, dmg: 11, range: 1.65, stun: 0.5, kb: 3.2 }] },
  grab:  { name: 'Grapple', anim: 'grab', dur: 0.5, type: 'grapple', lunge: 0.5, hits: [{ t: 0.5, grab: true, range: 1.15 }] },
  chrono:{ name: 'Time Breaker', anim: 'uppercut', dur: 0.72, type: 'punch', tier: 'advanced', cost: 20, needFocus: true, lunge: 0.45,
           hits: [{ t: 0.5, dmg: 21, range: 1.45, stun: 0.8, kb: 5, knockdown: true, unblockable: true, zone: 'high' }] },
};

const flurry = (n, dmg, from = 0.15, to = 0.75, extra = {}) =>
  [...Array(n)].map((_, i) => ({ t: from + (to - from) * i / Math.max(1, n - 1), dmg, range: 1.4, stun: 0.4, kb: 0.8, ...extra }));

export const ROSTER = [
  {
    id: 'eric', name: 'Eric', title: 'The All-American',
    blurb: 'A normal-looking but seriously buff American kid. No tricks, no cheating — just heart.',
    gimmick: 'HEART — fights clean. Mana recovers 50% faster, and once per round he gets a Second Wind when nearly beaten.',
    stats: { hp: 100, power: 1.0, speed: 1.0, anim: 1.0, reach: 1.0, grapple: 1.0, mana: 1.15 },
    bars: { Power: 6, Speed: 6, Health: 6, Grapple: 6 },
    look: { scale: 1.0, bulk: 1.12, skin: 0xd9a27c, trunks: 0x1d3fa8, trim: 0xffffff, gloves: [0xc8102e, 0xc8102e], gloveSize: 1.15 },
    moves: {
      s1: { name: 'Liberty Hook', anim: 'hook', dur: 0.6, type: 'punch', lunge: 0.35, hits: [{ t: 0.5, dmg: 15, range: 1.4, stun: 0.62, kb: 4, zone: 'high' }] },
      s2: { name: 'Home Run Kick', anim: 'spin', dur: 0.82, type: 'kick', lunge: 0.3, hits: [{ t: 0.62, dmg: 17, range: 1.75, stun: 0.6, kb: 7, knockdown: true, zone: 'mid' }] },
      adv: { name: 'Star-Spangled Barrage', anim: 'flurry', dur: 1.25, type: 'punch', lunge: 0.6,
             hits: [...flurry(4, 5, 0.14, 0.56), { t: 0.82, dmg: 13, range: 1.5, stun: 0.7, kb: 7, knockdown: true, zone: 'high' }] },
    },
  },
  {
    id: 'shredder', name: 'Shredder', title: 'The Back-Alley Butcher',
    blurb: 'Scrawny, twitchy and frightening. Steel spikes slide out of his knuckles when the ref is not looking.',
    gimmick: 'KNUCKLE SPIKES — every punch that lands opens a wound that keeps bleeding.',
    stats: { hp: 86, power: 0.9, speed: 1.22, anim: 1.18, reach: 1.02, grapple: 0.8, mana: 1.0, bleed: true },
    bars: { Power: 5, Speed: 9, Health: 4, Grapple: 3 },
    look: { scale: 0.99, bulk: 0.74, skin: 0xcfc3b4, trunks: 0x18181b, trim: 0x7a0c0c, gloves: [0x1a1a1c, 0x1a1a1c], gloveSize: 0.9 },
    moves: {
      s1: { name: 'Spike Flurry', anim: 'flurry', dur: 0.8, type: 'punch', lunge: 0.5, hits: flurry(4, 4, 0.16, 0.78) },
      s2: { name: 'Shin Shredder', anim: 'lowkick', dur: 0.5, type: 'kick', lunge: 0.25, hits: [{ t: 0.48, dmg: 12, range: 1.6, stun: 0.55, kb: 2, zone: 'low', slow: 2.2 }] },
      adv: { name: 'The Impaler', anim: 'uppercut', dur: 0.85, type: 'punch', lunge: 0.6,
             hits: [{ t: 0.52, dmg: 23, range: 1.45, stun: 0.8, kb: 5, knockdown: true, zone: 'mid', bleed: 6 }] },
    },
  },
  {
    id: 'titan', name: 'Titan', title: 'Seven-and-a-Half Feet of Bad News',
    blurb: '7\'6" and absurdly strong, if a little slow. His oversized gloves carry illegal weighted inserts.',
    gimmick: 'WEIGHTED GLOVES — punches smash through guards: blocked punches still deal heavy damage.',
    stats: { hp: 134, power: 1.38, speed: 0.8, anim: 0.87, reach: 1.22, grapple: 1.25, mana: 0.9, guardCrush: true, radius: 0.45 },
    bars: { Power: 10, Speed: 3, Health: 8, Grapple: 7 },
    look: { scale: 1.27, bulk: 1.32, skin: 0xcfa283, trunks: 0x1b1d22, trim: 0x39414d, gloves: [0x2a2b2f, 0x2a2b2f], gloveSize: 1.75 },
    moves: {
      s1: { name: 'Hammerfall', anim: 'hammer', dur: 0.95, type: 'punch', lunge: 0.4, hits: [{ t: 0.6, dmg: 18, range: 1.55, stun: 0.8, kb: 3, knockdown: true, zone: 'high' }] },
      s2: { name: 'Earthshaker', anim: 'stomp', dur: 1.0, type: 'kick', hits: [{ t: 0.62, dmg: 11, range: 2.7, stun: 0.6, kb: 4, knockdown: true, zone: 'low', quake: true }] },
      adv: { name: 'Loaded Haymaker', anim: 'haymaker', dur: 1.2, type: 'punch', lunge: 0.8, armor: true,
             hits: [{ t: 0.62, dmg: 30, range: 1.7, stun: 1.0, kb: 10, knockdown: true, zone: 'high', unblockable: true }] },
    },
  },
  {
    id: 'ragnar', name: 'Ragnar', title: 'The Berserker',
    blurb: 'A savage Viking in wolf pelts who gets more dangerous the more you hurt him.',
    gimmick: 'BERSERK — damage climbs as his health drops (up to +50%), and his specials cannot be interrupted.',
    stats: { hp: 108, power: 1.05, speed: 0.98, anim: 0.96, reach: 1.05, grapple: 1.1, mana: 0.9, berserk: true, radius: 0.4 },
    bars: { Power: 8, Speed: 5, Health: 7, Grapple: 6 },
    look: { scale: 1.08, bulk: 1.3, skin: 0xb9856a, trunks: 0x3a2618, trim: 0x8a8d92, gloves: [0x4a3524, 0x4a3524], gloveSize: 1.05 },
    moves: {
      s1: { name: 'Skull Splitter', anim: 'headbutt', dur: 0.6, type: 'punch', lunge: 0.45, armor: true, hits: [{ t: 0.5, dmg: 15, range: 1.25, stun: 0.9, kb: 2, zone: 'high' }] },
      s2: { name: 'Shield-Breaker Charge', anim: 'tackle', dur: 0.85, type: 'kick', lunge: 2.4, armor: true, hits: [{ t: 0.6, dmg: 14, range: 1.3, stun: 0.6, kb: 8, knockdown: true, zone: 'mid' }] },
      adv: { name: 'Berserker Fury', anim: 'flurry', dur: 1.4, type: 'punch', lunge: 0.8, armor: true,
             hits: [...flurry(5, 4, 0.12, 0.6), { t: 0.84, dmg: 14, range: 1.4, stun: 0.9, kb: 6, knockdown: true, zone: 'high' }] },
    },
  },
  {
    id: 'smiles', name: 'Mr. Smiles', title: 'The Laughing Lunatic',
    blurb: 'A psychotic clown with a painted grin and mismatched gloves who laughs while being punched.',
    gimmick: 'LAUGH IT OFF — gains mana every time he is hit. One glove hides a chemical irritant that blurs your vision.',
    stats: { hp: 104, power: 1.04, speed: 1.08, anim: 1.08, reach: 1.0, grapple: 0.9, mana: 1.1, laugh: true },
    bars: { Power: 6, Speed: 7, Health: 5, Grapple: 4 },
    look: { scale: 1.02, bulk: 1.08, skin: 0xd2a070, trunks: 0xc8202a, trim: 0x1c8fd0, gloves: [0xf2c200, 0x4fd04a], gloveSize: 1.15 },
    moves: {
      s1: { name: 'Pie in the Face', anim: 'slap', dur: 0.55, type: 'punch', lunge: 0.3, hits: [{ t: 0.5, dmg: 10, range: 1.4, stun: 0.8, kb: 1.5, zone: 'high' }] },
      s2: { name: 'Jack-in-the-Box', anim: 'rise', dur: 0.8, type: 'punch', lunge: 0.35, hits: [{ t: 0.55, dmg: 16, range: 1.4, stun: 0.6, kb: 4, knockdown: true, zone: 'high' }] },
      adv: { name: 'Laughing Gas', anim: 'spray', dur: 0.9, type: 'punch', lunge: 0.4,
             hits: [{ t: 0.45, dmg: 12, range: 1.9, stun: 0.7, kb: 2, zone: 'high', blind: 5.5, spray: true }] },
    },
  },
  {
    id: 'diablo', name: 'El Diablo Rojo', title: 'The Crimson Matador',
    blurb: 'A flamboyant Spanish matador who taunts with a crimson cape and fights with theatrical elegance.',
    gimmick: 'RIGID CAPE — a hidden frame turns the cape into a shield: his block covers high, mid and low at once.',
    stats: { hp: 94, power: 1.0, speed: 1.1, anim: 1.06, reach: 1.06, grapple: 0.85, mana: 1.0, cape: true },
    bars: { Power: 6, Speed: 7, Health: 5, Grapple: 4 },
    look: { scale: 1.03, bulk: 0.98, skin: 0xc99670, trunks: 0x15151a, trim: 0xd4a017, gloves: [0x1c6fd8, 0x1c6fd8], gloveSize: 0.95 },
    moves: {
      s1: { name: 'Veronica', anim: 'capesweep', dur: 0.72, type: 'punch', lunge: 0.2, invuln: [0.05, 0.55], hits: [{ t: 0.62, dmg: 13, range: 1.6, stun: 0.75, kb: 3, zone: 'mid' }] },
      s2: { name: 'Estocada', anim: 'thrust', dur: 0.7, type: 'punch', lunge: 1.7, hits: [{ t: 0.55, dmg: 18, range: 1.5, stun: 0.6, kb: 5, zone: 'mid' }] },
      adv: { name: 'Capa de Hierro', anim: 'bash', dur: 1.0, type: 'punch', lunge: 0.9, invuln: [0, 0.5],
             hits: [{ t: 0.56, dmg: 25, range: 1.6, stun: 0.9, kb: 9, knockdown: true, zone: 'mid', unblockable: true }] },
    },
  },
  {
    id: 'osaka', name: 'Osaka', title: 'The 500-Pound Avalanche',
    blurb: 'A colossal sumo wrestler whose signature is flattening opponents beneath his enormous body.',
    gimmick: 'HYDRAULIC BELT — a hidden compression rig amplifies his throws and submissions by 60%, and he barely budges when hit.',
    stats: { hp: 142, power: 1.18, speed: 0.75, anim: 0.9, reach: 1.02, grapple: 1.6, mana: 0.9, heavy: true, radius: 0.55 },
    bars: { Power: 8, Speed: 2, Health: 10, Grapple: 10 },
    look: { scale: 1.1, bulk: 1.72, belly: 0.4, skin: 0xcf9c78, trunks: 0x1a1c22, trim: 0x30343c, gloves: [0x2b2d33, 0x2b2d33], gloveSize: 1.3 },
    moves: {
      s1: { name: 'Harite Barrage', anim: 'flurry', dur: 0.95, type: 'punch', lunge: 0.7, hits: flurry(4, 5, 0.16, 0.78, { kb: 2.4 }) },
      s2: { name: 'Shiko Stomp', anim: 'stomp', dur: 0.95, type: 'kick', hits: [{ t: 0.62, dmg: 10, range: 2.4, stun: 0.6, kb: 3, knockdown: true, zone: 'low', quake: true }] },
      adv: { name: 'Hydraulic Crush', anim: 'flop', dur: 1.5, type: 'grapple', lunge: 1.9, leap: 1.5, armor: true,
             hits: [{ t: 0.6, dmg: 33, range: 1.5, stun: 1.2, kb: 0.5, knockdown: true, zone: 'high', unblockable: true, quake: true }] },
    },
  },
  {
    id: 'kyoto', name: 'Kyoto', title: 'The Silent Blade',
    blurb: 'A masked Japanese assassin who never speaks and seems to teleport around his opponents.',
    gimmick: 'WIRED MASK — an off-site tactical team feeds him your moves: his dodge is a teleport, and his guard often corrects itself.',
    stats: { hp: 88, power: 0.95, speed: 1.18, anim: 1.14, reach: 1.0, grapple: 0.9, mana: 1.1, teleport: true, uplink: 0.4 },
    bars: { Power: 5, Speed: 9, Health: 4, Grapple: 5 },
    look: { scale: 1.0, bulk: 0.92, skin: 0xc8a182, trunks: 0x2b2a2e, trim: 0x6a4428, gloves: [0x3a3d44, 0x3a3d44], gloveSize: 1.0 },
    moves: {
      s1: { name: 'Shadow Step', anim: 'cross', dur: 0.62, type: 'punch', teleports: [0.12], hits: [{ t: 0.55, dmg: 13, range: 1.45, stun: 0.6, kb: 3, zone: 'mid' }] },
      s2: { name: 'Crescent Moon', anim: 'spin', dur: 0.7, type: 'kick', lunge: 0.3, hits: [{ t: 0.6, dmg: 15, range: 1.7, stun: 0.6, kb: 5, zone: 'high', knockdown: true }] },
      adv: { name: 'Tactical Uplink', anim: 'triple', dur: 1.3, type: 'punch', teleports: [0.08, 0.36, 0.64], uplinkBuff: 7, invuln: [0, 0.2],
             hits: [{ t: 0.24, dmg: 7, range: 1.5, stun: 0.5, kb: 0.5, zone: 'mid' }, { t: 0.52, dmg: 7, range: 1.5, stun: 0.5, kb: 0.5, zone: 'low' },
                    { t: 0.8, dmg: 14, range: 1.5, stun: 0.8, kb: 6, knockdown: true, zone: 'high' }] },
    },
  },
];

for (const c of ROSTER) for (const k of ['s1', 's2', 'adv']) c.moves[k].tier = k === 'adv' ? 'advanced' : 'special';

export const COMBOS = [
  { key: 'adv', seq: ['f', 'b', 'f', 'L'], label: '→ ← → + Left Click' },
  { key: 'chrono', seq: ['d', 'd', 'R'], label: '↓ ↓ + Right Click (during Focus)' },
  { key: 's1', seq: ['b', 'f', 'P'], label: '← → + Punch key' },
  { key: 's2', seq: ['d', 'u', 'K'], label: '↓ ↑ + Kick key' },
];
