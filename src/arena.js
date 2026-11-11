// The venue: hexagonal cage, tiered bowl, and a crowd of thousands.
import * as THREE from 'three';

export const CAGE_R = 7.5;                       // vertex radius of the hexagon
export const CAGE_APOTHEM = CAGE_R * Math.cos(Math.PI / 6);
export const HEX_NORMALS = [...Array(6)].map((_, i) => {
  const a = i * Math.PI / 3;
  return { x: Math.sin(a), z: Math.cos(a) };
});

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function matTexture() {
  return canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#b9b4a8'; g.fillRect(0, 0, w, h);
    // canvas weave + scuffs
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${60 + Math.random() * 60},${55 + Math.random() * 50},${50 + Math.random() * 40},${Math.random() * 0.08})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(90,20,15,${0.03 + Math.random() * 0.06})`;
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 40, 0, 7); g.fill();
    }
    g.translate(w / 2, h / 2);
    // clock-face emblem
    g.strokeStyle = 'rgba(20,60,150,0.85)'; g.lineWidth = 14;
    g.beginPath(); g.arc(0, 0, 250, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 225, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 12; i++) {
      g.save(); g.rotate(i * Math.PI / 6);
      g.fillStyle = 'rgba(20,60,150,0.85)'; g.fillRect(-5, -222, 10, i % 3 ? 26 : 50); g.restore();
    }
    g.save(); g.rotate(-0.9); g.fillStyle = 'rgba(160,20,20,0.85)'; g.fillRect(-6, -190, 12, 200); g.restore();
    g.save(); g.rotate(1.2); g.fillStyle = 'rgba(15,25,60,0.9)'; g.fillRect(-8, -130, 16, 140); g.restore();
    g.fillStyle = 'rgba(15,25,60,0.92)'; g.textAlign = 'center';
    g.font = '900 78px Impact, Arial Black, sans-serif';
    g.fillText('ARENA', 0, -290); g.fillText('OF TIME', 0, 350);
    // hex border
    g.strokeStyle = 'rgba(15,25,60,0.8)'; g.lineWidth = 12; g.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = i * Math.PI / 3, r = 470;
      g[i ? 'lineTo' : 'moveTo'](Math.sin(a) * r, -Math.cos(a) * r);
    }
    g.stroke();
  });
}

function fenceTexture() {
  const t = canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(20,20,22,1)'; g.lineWidth = 7;
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h);
    g.moveTo(-w / 2, h / 2); g.lineTo(w / 2, h * 1.5); g.moveTo(w / 2, -h / 2); g.lineTo(w * 1.5, h / 2);
    g.stroke();
    g.strokeStyle = 'rgba(120,120,130,0.9)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function buildArena(scene) {
  const arena = { time: 0, hype: 0.25, fencePanels: [], posts: [], flashes: [], uniforms: { uTime: { value: 0 }, uHype: { value: 0.25 } } };
  const root = new THREE.Group(); scene.add(root);
  scene.fog = new THREE.FogExp2(0x05060c, 0.0075);

  // ---- lights
  scene.add(new THREE.HemisphereLight(0x8fa6d8, 0x1a1410, 0.55));
  const key = new THREE.SpotLight(0xfff1dc, 2.4, 0, 0.55, 0.55, 0);
  key.position.set(1.5, 17, 2.5); key.target.position.set(0, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 6; key.shadow.camera.far = 30; key.shadow.bias = -0.0004; key.shadow.radius = 4;
  scene.add(key, key.target);
  const rimA = new THREE.DirectionalLight(0x4f7dff, 1.5); rimA.position.set(-10, 7, -9); scene.add(rimA);
  const rimB = new THREE.DirectionalLight(0xff8a4a, 1.1); rimB.position.set(10, 6, -7); scene.add(rimB);
  const fill = new THREE.DirectionalLight(0xffffff, 0.55); fill.position.set(0, 5, 12); scene.add(fill);
  arena.keyLight = key;

  // ---- cage platform
  const plat = new THREE.Mesh(
    new THREE.CylinderGeometry(CAGE_R + 0.45, CAGE_R + 0.7, 1.0, 6),
    [new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.6, metalness: 0.3 }),
     new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 0.92 }),
     new THREE.MeshStandardMaterial({ color: 0x101114 })]);
  plat.position.y = -0.5; plat.rotation.y = Math.PI / 6; plat.receiveShadow = true; root.add(plat);

  const padMat = new THREE.MeshStandardMaterial({ color: 0x0c0d11, roughness: 0.55 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1c46c8, roughness: 0.5, emissive: 0x0a1c66, emissiveIntensity: 0.6 });
  const fenceTex = fenceTexture();
  for (let i = 0; i < 6; i++) {
    const a0 = (i - 0.5) * Math.PI / 3, a1 = (i + 0.5) * Math.PI / 3;
    const p0 = new THREE.Vector3(Math.sin(a0) * CAGE_R, 0, Math.cos(a0) * CAGE_R);
    const p1 = new THREE.Vector3(Math.sin(a1) * CAGE_R, 0, Math.cos(a1) * CAGE_R);
    const postMat = (i % 2 ? padMat : blueMat).clone(); postMat.transparent = true;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 2.5, 12), postMat); arena.posts.push(post);
    post.position.copy(p0).setY(1.25); root.add(post);
    const mid = p0.clone().add(p1).multiplyScalar(0.5), len = p0.distanceTo(p1);
    const tex = fenceTex.clone(); tex.needsUpdate = true; tex.repeat.set(len * 3.2, 2.3 * 3.2);
    const pm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.8, depthWrite: false });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.3), pm);
    panel.position.copy(mid).setY(1.15); panel.lookAt(0, 1.15, 0); panel.renderOrder = 5; root.add(panel);
    const railMat = padMat.clone(); railMat.transparent = true;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.2, 0.24), railMat);
    rail.position.copy(mid).setY(2.4); rail.lookAt(0, 2.4, 0); root.add(rail);
    arena.fencePanels.push({ panel, rail, n: HEX_NORMALS[i], shake: 0, base: panel.position.clone() });
  }

  // ---- floor + bowl
  const floor = new THREE.Mesh(new THREE.CircleGeometry(15.5, 64), new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.35, metalness: 0.4 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1; root.add(floor);

  const ROWS = 46, R0 = 15, DR = 1.05, DH = 0.64;
  const prof = [];
  for (let i = 0; i <= ROWS; i++) { prof.push(new THREE.Vector2(R0 + i * DR, i * DH - 0.4)); prof.push(new THREE.Vector2(R0 + (i + 1) * DR, i * DH - 0.4)); }
  prof.push(new THREE.Vector2(R0 + (ROWS + 1) * DR, ROWS * DH + 9));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), new THREE.MeshStandardMaterial({ color: 0x0d0e13, roughness: 0.95, side: THREE.DoubleSide }));
  root.add(bowl);
  const roof = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x030408, side: THREE.BackSide, fog: false }));
  roof.position.y = 12; root.add(roof);

  // ---- crowd (instanced)
  const seats = [];
  for (let i = 0; i < ROWS; i++) {
    const r = R0 + (i + 0.5) * DR, n = Math.floor(2 * Math.PI * r / 0.6);
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + i * 0.37;
      const aisle = ((a + Math.PI / 6) % (Math.PI / 3)) * r;        // arc distance inside 60° sector
      if (aisle < 0.9 || Math.random() < 0.035) continue;
      seats.push({ x: Math.sin(a) * r, y: i * DH - 0.4, z: Math.cos(a) * r, a, i });
    }
  }
  arena.attendance = seats.length;
  for (let i = seats.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [seats[i], seats[j]] = [seats[j], seats[i]]; }   // shuffled so the crowd can be thinned evenly
  const inject = (m) => {
    m.onBeforeCompile = (s) => {
      s.uniforms.uTime = arena.uniforms.uTime; s.uniforms.uHype = arena.uniforms.uHype;
      s.vertexShader = 'uniform float uTime;uniform float uHype;\n' + s.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         #ifdef USE_INSTANCING
         float ph = instanceMatrix[3].x*12.9898 + instanceMatrix[3].z*78.233;
         float f = fract(sin(ph)*43758.5453);
         transformed.y += abs(sin(uTime*(2.0+f*3.5)+ph)) * uHype * (0.15+f*0.5);
         #endif`);
    };
    return m;
  };
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.62, 0.3), inject(new THREE.MeshBasicMaterial()), seats.length);
  const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 0), inject(new THREE.MeshBasicMaterial()), seats.length);
  const d = new THREE.Object3D(), col = new THREE.Color();
  const shirts = [0x8a2a2a, 0x24407a, 0x777777, 0x222226, 0x9a8a4a, 0x356a45, 0xc8c8c8, 0x5a2a6a, 0xb05a20, 0x1a1a40];
  const skins = [0xe0b090, 0xc68a5e, 0x8a5a3a, 0xf0c8a8, 0x6a4028];
  seats.forEach((s, n) => {
    const dim = 0.05 + 0.2 * Math.exp(-s.i / 12) + Math.random() * 0.05;
    d.position.set(s.x, s.y + 0.45, s.z); d.rotation.set(0, s.a + Math.PI, 0); d.scale.setScalar(0.9 + Math.random() * 0.25); d.updateMatrix();
    bodies.setMatrixAt(n, d.matrix); bodies.setColorAt(n, col.setHex(shirts[(Math.random() * shirts.length) | 0]).multiplyScalar(dim));
    d.position.y = s.y + 0.92; d.updateMatrix();
    heads.setMatrixAt(n, d.matrix); heads.setColorAt(n, col.setHex(skins[(Math.random() * skins.length) | 0]).multiplyScalar(dim * 1.1));
  });
  bodies.frustumCulled = heads.frustumCulled = false; root.add(bodies, heads);
  arena.seats = seats;
  arena.setCrowd = (frac) => { bodies.count = heads.count = Math.max(1, Math.floor(seats.length * frac)); };

  // ---- camera flashes in the stands
  const fg = new THREE.BufferGeometry();
  const N = 60, fpos = new Float32Array(N * 3);
  fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const flashPts = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, map: canvasTex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(0.3, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  flashPts.frustumCulled = false; root.add(flashPts);
  arena.flashGeo = fg; arena.flashLife = new Float32Array(N);

  // ---- lighting truss, beams, jumbotron
  const truss = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.22, 6, 6), new THREE.MeshStandardMaterial({ color: 0x1c1d22, metalness: 0.8, roughness: 0.4 }));
  truss.rotation.x = Math.PI / 2; truss.rotation.z = Math.PI / 6; truss.position.y = 15; root.add(truss);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff4e0, fog: false });
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x9fbaff, transparent: true, opacity: 0.014, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  arena.beams = [];
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), lampMat);
    lamp.position.set(Math.sin(a) * 10.5, 14.7, Math.cos(a) * 10.5); root.add(lamp);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3.4, 16, 20, 1, true), beamMat);
    beam.position.set(Math.sin(a) * 6.3, 7.2, Math.cos(a) * 6.3);
    beam.lookAt(Math.sin(a) * 10.5, 15, Math.cos(a) * 10.5); beam.rotateX(Math.PI / 2); root.add(beam);
    arena.beams.push(beam);
  }
  // sweeping coloured beams far out over the crowd
  arena.sweeps = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.MeshBasicMaterial({ color: i % 2 ? 0x3d6bff : 0xff5a3a, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(5, 60, 16, 1, true), m);
    cone.geometry.translate(0, -30, 0);
    const pivot = new THREE.Object3D(); pivot.position.set(Math.sin(i * 0.785) * 30, 36, Math.cos(i * 0.785) * 30);
    pivot.add(cone); root.add(pivot); arena.sweeps.push(pivot);
  }
  const jc = document.createElement('canvas'); jc.width = 512; jc.height = 256;
  arena.jumboCanvas = jc; arena.jumboTex = new THREE.CanvasTexture(jc); arena.jumboTex.colorSpace = THREE.SRGBColorSpace;
  const jm = new THREE.MeshBasicMaterial({ map: arena.jumboTex, fog: false });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101116 });
  const jumbo = new THREE.Mesh(new THREE.BoxGeometry(7, 3.5, 7), [jm, jm, dark, dark, jm, jm]);
  jumbo.position.y = 12.2; root.add(jumbo);
  arena.setJumbo = (top, bottom, accent = '#3aa0ff') => {
    const g = jc.getContext('2d');
    g.fillStyle = '#04060c'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = accent; g.fillRect(0, 0, 512, 10); g.fillRect(0, 246, 512, 10);
    g.textAlign = 'center'; g.fillStyle = '#fff';
    g.font = '900 64px Impact, Arial Black, sans-serif'; g.fillText(top, 256, 120, 490);
    g.font = '700 38px Arial, sans-serif'; g.fillStyle = accent; g.fillText(bottom, 256, 190, 490);
    arena.jumboTex.needsUpdate = true;
  };
  arena.setJumbo('ARENA OF TIME', 'WORLD CHAMPIONSHIP');

  arena.rattle = (x, z) => {
    let best = null, bd = -1e9;
    for (const p of arena.fencePanels) { const dd = x * p.n.x + z * p.n.z; if (dd > bd) { bd = dd; best = p; } }
    if (best) best.shake = 1;
  };

  arena.update = (dt, camera) => {
    arena.time += dt;
    arena.uniforms.uTime.value = arena.time;
    arena.uniforms.uHype.value += (arena.hype - arena.uniforms.uHype.value) * Math.min(1, dt * 3);
    arena.hype += (0.22 - arena.hype) * Math.min(1, dt * 0.5);
    // fence panels between camera and cage fade out
    for (const p of arena.fencePanels) {
      const outside = camera.position.x * p.n.x + camera.position.z * p.n.z - CAGE_APOTHEM;
      const target = outside > -1.6 ? 0 : 1;
      p.panel.material.opacity += (target - p.panel.material.opacity) * Math.min(1, dt * 8);
      p.rail.material.opacity = p.panel.material.opacity; p.panel.visible = p.rail.visible = p.panel.material.opacity > 0.02;
      if (p.shake > 0.001) {
        p.shake *= Math.exp(-dt * 6);
        const o = Math.sin(arena.time * 60) * 0.09 * p.shake;
        p.panel.position.set(p.base.x + p.n.x * o, p.base.y, p.base.z + p.n.z * o);
      }
    }
    for (const post of arena.posts) { const dd = Math.hypot(camera.position.x - post.position.x, camera.position.z - post.position.z); const t = dd < 7.5 ? 0.1 : 1; post.material.opacity += (t - post.material.opacity) * Math.min(1, dt * 8); post.castShadow = false; }
    // flashes
    const pos = arena.flashGeo.attributes.position, life = arena.flashLife;
    for (let i = 0; i < life.length; i++) {
      life[i] -= dt;
      if (life[i] <= 0) {
        if (Math.random() < dt * (1.5 + arena.hype * 10)) {
          const s = seats[(Math.random() * seats.length) | 0];
          pos.setXYZ(i, s.x, s.y + 1.2, s.z); life[i] = 0.07 + Math.random() * 0.06;
        } else pos.setXYZ(i, 0, -50, 0);
      }
    }
    pos.needsUpdate = true;
    arena.sweeps.forEach((p, i) => { p.rotation.set(Math.sin(arena.time * 0.4 + i) * 0.5 + 0.5, 0, Math.cos(arena.time * 0.33 + i * 2) * 0.5); p.lookAt(Math.sin(arena.time * 0.3 + i) * 25, 0, Math.cos(arena.time * 0.25 + i * 1.7) * 25); p.rotateX(-Math.PI / 2); });
  };
  return arena;
}

// Keep a point inside the hexagon. Returns true if it touched the fence.
export function clampToCage(p, radius) {
  let hit = false;
  for (const n of HEX_NORMALS) {
    const d = p.x * n.x + p.z * n.z - (CAGE_APOTHEM - radius);
    if (d > 0) { p.x -= n.x * d; p.z -= n.z * d; hit = true; }
  }
  return hit;
}
