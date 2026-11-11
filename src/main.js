// Arena of Time — boot, game flow, camera and the frame loop.
import * as THREE from 'three';
import { buildArena } from './arena.js';
import { ROSTER } from './characters.js';
import { Fighter } from './fighter.js';
import { buildFighter } from './fighterModel.js';
import { Match } from './match.js';
import { Input, HumanController, SCHEMES } from './input.js';
import { AIController } from './ai.js';
import { Effects } from './effects.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';
import { blankPose } from './anim.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030408);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
camera.position.set(0, 3, 12);

const arena = buildArena(scene), effects = new Effects(scene), audio = new Audio(), ui = new UI(), input = new Input(canvas);
const g = { state: 'title', mode: 'cpu', level: 'normal', picks: [0, 1], step: 0, sel: -1, match: null, fighters: [], attract: true, paused: false, focusVis: 0, orbit: 0, filter: '' };
const tmp = new THREE.Vector3();

// Quality steps down automatically on slow machines (or force with ?q=0..3 — 0 is lowest).
const QUALITY = [{ px: 0.5, shadow: false, crowd: 0.2 }, { px: 0.75, shadow: false, crowd: 0.5 }, { px: 1, shadow: true, crowd: 1 }, { px: 2, shadow: true, crowd: 1 }];
const forcedQ = new URLSearchParams(location.search).get('q');
let quality = forcedQ !== null ? Math.max(0, Math.min(3, +forcedQ)) : 3, slowFrames = 0, perfFrames = 0, perfTime = 0;
function applyQuality() {
  const q = QUALITY[quality];
  renderer.shadowMap.enabled = q.shadow; arena.keyLight.castShadow = q.shadow; arena.setCrowd(q.crowd);
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); });
  resize();
}
function watchPerf(ms) {
  if (forcedQ !== null || quality === 0 || document.hidden) return;
  perfFrames++; perfTime += ms;
  if (perfFrames >= 45) { if (perfTime / perfFrames > 38) { quality--; applyQuality(); } perfFrames = perfTime = 0; }
}
function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY[quality].px)); renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = 40; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------------------------------------------------------------- portraits
function makePortraits() {
  const ps = new THREE.Scene(); ps.background = new THREE.Color(0x0d1220);
  ps.add(new THREE.HemisphereLight(0xa8b8e0, 0x221a14, 0.9));
  const k = new THREE.DirectionalLight(0xfff0dc, 3.2); k.position.set(2, 3, 4); ps.add(k);
  const r = new THREE.DirectionalLight(0x3a7cff, 3); r.position.set(-3, 2, -3); ps.add(r);
  const r2 = new THREE.DirectionalLight(0xff5030, 1.6); r2.position.set(3, 1, -3); ps.add(r2);
  const pc = new THREE.PerspectiveCamera(32, 3 / 4, 0.1, 50);
  renderer.shadowMap.enabled = false; renderer.setPixelRatio(1); renderer.setSize(420, 560, false);
  for (const c of ROSTER) {
    const m = buildFighter(c), pp = blankPose(); if (c.stats.cape) { pp.lS = [-0.4, 0, 0.7]; pp.lE = [-0.6, 0, 0]; }
    ps.add(m.group); m.group.rotation.y = 0.32; m.group.updateMatrixWorld(true); m.apply(pp); m.group.updateMatrixWorld(true); m.dress(0, 0.9, false, false); m.aura.visible = false;
    const s = c.look.scale, wide = c.look.belly ? 1.35 : c.look.bulk > 1.25 ? 1.12 : 1;
    pc.position.set(0.25 * s, 1.5 * s, 2.25 * s * wide); pc.lookAt(0.02, 1.34 * s, 0);
    renderer.render(ps, pc);
    ui.portraits[c.id] = canvas.toDataURL('image/jpeg', 0.9);
    ps.remove(m.group);
    // optional hand-made / photographic portrait override
    const img = new Image(); img.onload = () => { ui.portraits[c.id] = img.src; document.querySelectorAll(`img[alt="${c.name}"]`).forEach((e) => (e.src = img.src)); };
    img.src = `assets/portraits/${c.id}.jpg`;
  }
  resize();
}

// ---------------------------------------------------------------- fx bridge
function screenOf(x, y, z) { tmp.set(x, y, z).project(camera); return [(tmp.x + 1) * 0.5 * innerWidth, (1 - tmp.y) * 0.5 * innerHeight]; }
const fx = {
  announce: (t, k) => { if (!g.attract) ui.announce(t, k); },
  sound: (n) => { if (!g.attract) audio.play(n); },
  callout: (f, name, tier) => { if (!g.attract) { ui.callout(f.idx, name, tier); audio.play('special'); } },
  combo: (f, n) => { if (!g.attract) ui.callout(f.idx, n + ' HIT COMBO', 'combo', ' '); },
  popup: (f, text, kind) => { if (g.attract) return; const [x, y] = screenOf(f.pos.x, 2.0 * f.char.look.scale + Math.random() * 0.3, f.pos.z); ui.popup(x + (Math.random() - 0.5) * 60, y, text, kind); },
  spark: (x, y, z, k) => effects.spark(x, y, z, k), smoke: (x, y, z) => effects.smoke(x, y, z), dust: (x, z) => effects.dust(x, z), spray: (...a) => effects.spray(...a),
  shake: (v) => { effects.shake = Math.max(effects.shake, v); }, hitstop: (s) => { if (g.match) g.match.hitstop = s; },
  hype: (v) => { arena.hype = Math.min(2, arena.hype + v); }, rattle: (x, z) => arena.rattle(x, z),
  matchOver: (winner, how) => {
    if (g.attract) { setTimeout(() => g.attract && startAttract(), 600); return; }
    const lines = { eric: 'Clean hands. Heavy hands.', shredder: 'The ref saw nothing. The spikes are already back in.', titan: 'Nobody checked the gloves. Nobody dared.', ragnar: 'He is still screaming at the rafters.',
      smiles: 'He has not stopped laughing.', diablo: 'A bow, a flourish, and the cape goes back on.', osaka: 'The mat will need replacing.', kyoto: 'He was gone before the bell finished ringing.' };
    setTimeout(() => { if (g.state === 'fight') { g.state = 'result'; ui.result(winner, how, lines[winner.char.id]); ui.hint(null); } }, 1200);
  },
};

// ---------------------------------------------------------------- matches
function clearFighters() {
  for (const f of g.fighters) {
    scene.remove(f.model.group);
    f.model.group.traverse((o) => { if (o.material && o.geometry && o.geometry.type === 'CapsuleGeometry') o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); });
  }
  g.fighters = [];
}
function startMatch(i0, i1, attract = false) {
  clearFighters();
  g.attract = attract; g.paused = false;
  g.fighters = [new Fighter(ROSTER[i0], 0, scene), new Fighter(ROSTER[i1], 1, scene)];
  const ctl = attract ? [new AIController('normal'), new AIController('normal')]
    : [new HumanController(input, SCHEMES.p1, camera), g.mode === 'versus' ? new HumanController(input, SCHEMES.p2, camera) : new AIController(g.level)];
  g.match = new Match(g.fighters, ctl, fx, { roundsToWin: attract ? 1 : 2 });
  g.ctl = ctl;
  arena.setJumbo(ROSTER[i0].name.toUpperCase() + '  vs  ' + ROSTER[i1].name.toUpperCase(), attract ? 'TONIGHT — LIVE' : 'CHAMPIONSHIP BOUT');
  if (!attract) {
    g.state = 'fight'; g.picks = [i0, i1]; ui.screen(null); ui.el.hud.classList.remove('hidden'); ui.setupHud(g.fighters, 2);
    ui.hint(g.mode === 'cpu' ? '<kbd>WASD</kbd> move · <b>Mouse</b> aim head / body / legs · <b>L-click</b> cross · <b>R-click</b> roundhouse · <kbd>F</kbd> jab · <kbd>R</kbd> push kick · <kbd>Shift</kbd> block · <kbd>Space</kbd> dash · <kbd>E</kbd> grapple · <kbd>Q</kbd> Focus · <kbd>Esc</kbd> moves'
      : 'P1 <kbd>WASD</kbd> + mouse · P2 arrows <kbd>J</kbd><kbd>K</kbd><kbd>L</kbd><kbd>Y</kbd><kbd>H</kbd> · <kbd>Esc</kbd> for the full move list');
    camera.position.set(0, 2.4, 9);
  }
}
function startAttract() {
  const a = (Math.random() * ROSTER.length) | 0; let b = (Math.random() * ROSTER.length) | 0; if (b === a) b = (a + 1) % ROSTER.length;
  startMatch(a, b, true);
}
function toTitle() { g.state = 'title'; ui.screen('title'); ui.el.hud.classList.add('hidden'); ui.hint(null); ui.prompt(null); ui.subMeter(null); ui.reticle(false); startAttract(); }

// ---------------------------------------------------------------- menus
const $ = (s) => document.querySelector(s);
function openSelect() { g.state = 'select'; g.step = 0; g.sel = -1; ui.screen('select'); ui.buildSelect((i) => { g.sel = i; audio.play('ui'); ui.markSelect(i, g.step === 1 && g.mode === 'versus' ? g.picks[0] : -1); }); selTitle(); ui.detail(ROSTER[0]); }
function selTitle() { $('#selTitle').textContent = g.step === 0 ? 'PLAYER 1 — CHOOSE YOUR FIGHTER' : g.mode === 'versus' ? 'PLAYER 2 — CHOOSE YOUR FIGHTER' : 'CHOOSE YOUR OPPONENT'; }
function confirmSel() {
  if (g.sel < 0) return;
  g.picks[g.step] = g.sel;
  if (g.step === 0) { g.step = 1; g.sel = -1; selTitle(); ui.markSelect(-1, g.picks[0]); } else startMatch(g.picks[0], g.picks[1]);
}
document.querySelectorAll('#title [data-mode]').forEach((b) => (b.onclick = () => { audio.init(); audio.play('ui'); g.mode = b.dataset.mode; openSelect(); }));
document.querySelectorAll('#title [data-level]').forEach((b) => (b.onclick = () => { g.level = b.dataset.level; document.querySelectorAll('#title [data-level]').forEach((x) => x.classList.toggle('on', x === b)); }));
$('#title [data-help]').onclick = () => ui.help(null);
$('#selGo').onclick = confirmSel;
$('#selRandom').onclick = () => { g.sel = (Math.random() * ROSTER.length) | 0; ui.markSelect(g.sel, -1); confirmSel(); };
$('#selBack').onclick = () => { if (g.step === 1) { g.step = 0; g.sel = -1; selTitle(); ui.markSelect(-1, -1); } else { g.state = 'title'; ui.screen('title'); } };
$('#grid').ondblclick = confirmSel;
$('#resume').onclick = () => setPaused(false);
$('#pauseHelp').onclick = () => ui.help(g.fighters[0].char);
$('#quit').onclick = toTitle; $('#tomenu').onclick = toTitle;
$('#rematch').onclick = () => startMatch(g.picks[0], g.picks[1]);
$('#reselect').onclick = openSelect;
$('#mute').onclick = (e) => { audio.init(); audio.setMuted(!audio.muted); e.target.textContent = audio.muted ? '🔇' : '🔊'; e.target.blur(); };
function setPaused(p) { if (g.state !== 'fight') return; g.paused = p; ui.screen(p ? 'pause' : null); ui.el.help.classList.add('hidden'); }
addEventListener('keydown', (e) => {
  audio.init();
  if (e.code === 'Escape') { if (!ui.el.help.classList.contains('hidden')) ui.el.help.classList.add('hidden'); else setPaused(!g.paused); }
  if (e.code === 'Enter' && g.state === 'select') confirmSel();
});
addEventListener('mousedown', () => audio.init());
addEventListener('blur', () => { if (g.state === 'fight' && !g.match.over) setPaused(true); });

// ---------------------------------------------------------------- camera
const camPos = new THREE.Vector3(0, 3, 12), camLook = new THREE.Vector3(0, 1.2, 0);
function updateCamera(dt) {
  const [a, b] = g.fighters;
  if (g.state === 'title' || g.state === 'select') {
    g.orbit += dt * 0.12; const r = 13.5 + Math.sin(g.orbit * 0.7) * 2.5;
    camPos.set(Math.sin(g.orbit) * r, 4.2 + Math.sin(g.orbit * 0.5) * 1.6, Math.cos(g.orbit) * r);
    camLook.set((a.pos.x + b.pos.x) * 0.25, 1.6, (a.pos.z + b.pos.z) * 0.25);
    camera.position.lerp(camPos, Math.min(1, dt * 2)); camera.lookAt(camLook); return;
  }
  const mx = (a.pos.x + b.pos.x) / 2, mz = (a.pos.z + b.pos.z) / 2;
  let ax = b.pos.x - a.pos.x, az = b.pos.z - a.pos.z; const sep = Math.hypot(ax, az) || 1; ax /= sep; az /= sep;
  let px = -az, pz = ax;
  if ((camera.position.x - mx) * px + (camera.position.z - mz) * pz < 0) { px = -px; pz = -pz; }
  const tall = Math.max(a.char.look.scale, b.char.look.scale);
  let D = Math.min(12, Math.max(5.4, 4.5 + sep * 0.9)) * (1 - 0.2 * g.focusVis) * (0.9 + 0.1 * tall);
  camPos.set(mx + px * D, 1.9 + sep * 0.1 + (tall - 1) * 0.8, mz + pz * D);
  const cr = Math.hypot(camPos.x, camPos.z); if (cr > 14) { camPos.x *= 14 / cr; camPos.z *= 14 / cr; }
  const k = 1 - Math.exp(-4.5 * dt);
  camera.position.lerp(camPos, k);
  tmp.set(mx, 1.15 * tall + Math.max(a.lift, b.lift) * 0.4, mz); camLook.lerp(tmp, 1 - Math.exp(-7 * dt));
  camera.lookAt(camLook);
  const want = 40 - 7 * g.focusVis; if (Math.abs(camera.fov - want) > 0.05) { camera.fov += (want - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); }
  if (effects.shake > 0.01) { const s = effects.shake * 0.22; camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s; camera.rotateZ((Math.random() - 0.5) * s * 0.12); }
}

// ---------------------------------------------------------------- per-frame HUD overlays
const ZY = { high: 1.58, mid: 1.12, low: 0.5 };
function updateOverlays(dt) {
  const m = g.match, [a, b] = g.fighters;
  if (g.state !== 'fight') { ui.vision(0, 0, 0, 0, false, 0); ui.reticle(false); if (g.filter) { canvas.style.filter = g.filter = ''; } return; }
  ui.hud(m);
  const solo = g.mode === 'cpu', me = a, foe = b;
  const focusers = solo ? (me.focusing ? [me] : []) : g.fighters.filter((f) => f.focusing);
  const used = focusers.reduce((s, f) => Math.max(s, f.focusUsed), 0);
  g.focusVis += ((focusers.length ? 1 : 0) - g.focusVis) * Math.min(1, dt * 7);
  let cx, cy;
  if (solo) [cx, cy] = screenOf(foe.pos.x, 1.2 * foe.char.look.scale, foe.pos.z); else [cx, cy] = screenOf((a.pos.x + b.pos.x) / 2, 1.2, (a.pos.z + b.pos.z) / 2);
  const deep = Math.min(1, used / 55);
  const blind = solo ? Math.min(1, me.blind) : Math.min(1, Math.max(a.blind, b.blind)) * 0.6;
  ui.vision(g.focusVis * (0.6 + 0.4 * deep), cx, cy, 58 - 30 * deep, solo && foe.focusing && !me.focusing, blind * 0.9);
  const filter = (blind > 0.02 ? `blur(${(blind * 7).toFixed(1)}px) ` : '') + (g.focusVis > 0.05 ? `saturate(${(1 - 0.45 * g.focusVis).toFixed(2)}) contrast(${(1 + 0.12 * g.focusVis).toFixed(2)})` : '');
  if (filter !== g.filter) canvas.style.filter = g.filter = filter;

  if (solo && m.phase === 'fight' && !m.sub) {
    const z = me.intent.zone, [rx, ry] = screenOf(foe.pos.x, ZY[z] * foe.char.look.scale + foe.lift, foe.pos.z);
    ui.reticle(me.blind <= 0, rx, ry, z, me.focusing);
  } else ui.reticle(false);

  // context prompts
  let prompt = null;
  if (m.clinch && m.clinch.mode === 'hold') {
    const c = m.clinch, hA = g.ctl[c.a.idx].human, hV = g.ctl[c.v.idx].human, p2 = c.a.idx === 1;
    if (hA) prompt = `CLINCH! &nbsp; <kbd>${p2 ? 'J' : 'F'}</kbd> Knees &nbsp; <kbd>${p2 ? 'K' : 'R'}</kbd> Throw &nbsp; <kbd>${p2 ? 'L' : 'E'}</kbd> Submission hold`;
    else if (hV && c.t < 0.3) prompt = `<kbd>${c.v.idx === 1 ? 'L' : 'E'}</kbd> BREAK FREE!`;
  }
  ui.prompt(prompt);
  if (m.sub) {
    const hA = g.ctl[m.sub.a.idx].human, hV = g.ctl[m.sub.v.idx].human;
    const key = (f) => (f.idx === 1 ? '<kbd>L</kbd>' : '<kbd>E</kbd> / CLICK');
    ui.subMeter(m.sub.meter, hA && hV ? `MASH! ${m.sub.a.char.name} ${key(m.sub.a)} vs ${m.sub.v.char.name} ${key(m.sub.v)}` : hA ? `MASH ${key(m.sub.a)} — MAKE THEM TAP!` : hV ? `MASH ${key(m.sub.v)} — ESCAPE!` : '');
  } else ui.subMeter(null);
}

// ---------------------------------------------------------------- loop
let last = performance.now();
function frame(now) {
  watchPerf(now - last);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const m = g.match;
  if (m && !g.paused) {
    m.update(dt);
    const ws = m.hitstop > 0 ? 0 : m.worldScale * (m.koSlow > 0 ? 0.3 : 1);
    effects.update(dt * ws); arena.update(dt * ws, camera);
    updateCamera(dt); updateOverlays(dt);
    audio.update(dt, g.attract ? 0.15 : arena.hype, 1 - m.worldScale);
  }
  renderer.render(scene, camera);
  input.endFrame();
  requestAnimationFrame(frame);
}

makePortraits(); applyQuality();
document.getElementById('attendance').textContent = `Tonight's attendance: ${arena.attendance.toLocaleString()}`;
toTitle();
requestAnimationFrame(frame);
window.__aot = { g, ROSTER, startMatch, ui, arena, camera, input, renderer, scene };
