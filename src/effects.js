// Particle bursts (sparks, sweat, smoke, dust, irritant spray).
import * as THREE from 'three';

function dot() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

class Pool {
  constructor(scene, n, size, blending) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3).fill(-99); this.col = new Float32Array(n * 3); this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n); this.max = new Float32Array(n); this.grav = new Float32Array(n); this.base = new Float32Array(n * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: dot(), vertexColors: true, transparent: true, depthWrite: false, blending, sizeAttenuation: true }));
    this.pts.frustumCulled = false; this.pts.renderOrder = 10; scene.add(this.pts); this.geo = g;
  }
  emit(x, y, z, vx, vy, vz, life, r, g, b, grav) {
    const i = this.i; this.i = (i + 1) % this.n;
    this.pos.set([x, y, z], i * 3); this.vel.set([vx, vy, vz], i * 3); this.base.set([r, g, b], i * 3); this.life[i] = this.max[i] = life; this.grav[i] = grav;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt; const k = i * 3;
      if (this.life[i] <= 0) { this.pos[k + 1] = -99; continue; }
      this.vel[k + 1] -= this.grav[i] * dt;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.pos[k + 1] < 0.02) { this.pos[k + 1] = 0.02; this.vel[k + 1] *= -0.3; this.vel[k] *= 0.6; this.vel[k + 2] *= 0.6; }
      const a = this.life[i] / this.max[i];
      this.col[k] = this.base[k] * a; this.col[k + 1] = this.base[k + 1] * a; this.col[k + 2] = this.base[k + 2] * a;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}

export class Effects {
  constructor(scene) {
    this.glow = new Pool(scene, 500, 0.16, THREE.AdditiveBlending);
    this.soft = new Pool(scene, 500, 0.5, THREE.AdditiveBlending);
    this.shake = 0;
  }
  burst(pool, x, y, z, n, speed, life, c, grav = 6, up = 0.5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI, s = speed * (0.3 + Math.random());
      pool.emit(x, y, z, Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + up, Math.sin(a) * Math.cos(e) * s, life * (0.5 + Math.random() * 0.7), c[0], c[1], c[2], grav);
    }
  }
  spark(x, y, z, kind) {
    if (kind === 'hit') { this.burst(this.glow, x, y, z, 14, 4, 0.35, [1, 0.9, 0.6]); this.burst(this.soft, x, y, z, 2, 0.3, 0.12, [0.9, 0.8, 0.6], 0); }
    else if (kind === 'heavy') { this.burst(this.glow, x, y, z, 34, 6.5, 0.5, [1, 0.6, 0.25]); this.burst(this.glow, x, y, z, 14, 3, 0.6, [0.8, 0.9, 1], 9); this.burst(this.soft, x, y, z, 4, 0.5, 0.16, [1, 0.8, 0.5], 0); }
    else if (kind === 'block') this.burst(this.glow, x, y, z, 10, 3, 0.25, [0.6, 0.75, 1]);
    else if (kind === 'parry') { this.burst(this.glow, x, y, z, 40, 7, 0.55, [0.3, 0.8, 1], 2); this.burst(this.soft, x, y, z, 6, 0.6, 0.25, [0.2, 0.6, 1], 0); }
    else if (kind === 'blood') this.burst(this.glow, x, y, z, 16, 3, 0.7, [0.75, 0.03, 0.03], 9);
  }
  smoke(x, y, z) { for (let h = 0; h < 3; h++) this.burst(this.soft, x, 0.4 + h * 0.6, z, 9, 1.1, 0.5, [0.13, 0.13, 0.2], -0.6, 0); }
  dust(x, z) { for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; this.soft.emit(x, 0.1, z, Math.cos(a) * 3.2, 0.5, Math.sin(a) * 3.2, 0.55, 0.22, 0.2, 0.16, 0); } }
  spray(x, y, z, nx, nz) { for (let i = 0; i < 46; i++) { const s = 2 + Math.random() * 4; this.soft.emit(x, y, z, nx * s + (Math.random() - 0.5) * 1.6, (Math.random() - 0.4) * 1.4, nz * s + (Math.random() - 0.5) * 1.6, 0.5 + Math.random() * 0.6, 0.12, 0.42, 0.08, 0); } }
  update(dt) { this.glow.update(dt); this.soft.update(dt); this.shake *= Math.exp(-dt * 7); }
}
