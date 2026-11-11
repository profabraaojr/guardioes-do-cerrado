// Projéteis (sementes, gotas, resíduos) e sistema de partículas.
GC.Seed = class Seed {
  constructor(g, x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = 1.2; this.dead = false; this.w = 4; this.h = 4;
    this.friendly = true;
  }
  update(dt, g) {
    this.vy += 140 * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    const L = g.level, T = GC.T;
    const t = L.at(this.x, this.y);
    if (t === T.DEGRADED || (GC.TP[t].solid)) {
      const tx = Math.floor(this.x / 16), ty = Math.floor(this.y / 16);
      if (t === T.DEGRADED) g.plantAt(tx, ty);
      else {
        // sementes que tocam o chão degradado vizinho também germinam
        const below = L.tile(tx, ty);
        if (below === T.DEGRADED) g.plantAt(tx, ty);
      }
      g.fx.burst(this.x - Math.sign(this.vx) * 2, this.y, '#a8702e', 4);
      this.dead = true; return;
    }
    if (GC.TP[t].water && t !== T.POLLUTED) { this.vx *= 0.9; this.vy *= 0.9; }
    for (const e of g.entities) {
      if (!e.hittable || e.dead) continue;
      if (GC.U.overlap(this.box(), e.hitbox ? e.hitbox() : e)) {
        if (e.hit && e.hit('seed', 1, g, this)) { this.dead = true; return; }
      }
    }
    if (this.life <= 0) this.dead = true;
  }
  box() { return { x: this.x - 2, y: this.y - 2, w: 4, h: 4 }; }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    ctx.fillStyle = '#7a4a1e'; ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = '#c8943e'; ctx.fillRect(x - 1, y - 2, 2, 1);
    ctx.fillStyle = '#6ec04a'; ctx.fillRect(x - Math.sign(this.vx) * 3, y - 1, 1, 2);
  }
};

GC.Droplet = class Droplet {
  constructor(g, x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = 0.42 + Math.random() * 0.08; this.dead = false; this.friendly = true;
  }
  update(dt, g) {
    this.vy += 520 * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    const L = g.level, T = GC.T;
    const t = L.at(this.x, this.y);
    if (t === T.POLLUTED) { g.cleanAt(Math.floor(this.x / 16), Math.floor(this.y / 16)); this.dead = true; g.fx.splashSmall(this.x, this.y); return; }
    if (t === T.WATER || GC.TP[t].solid) { this.dead = true; if (Math.random() < 0.3) g.fx.splashSmall(this.x, this.y); return; }
    for (const e of g.entities) {
      if (!e.wettable || e.dead) continue;
      if (GC.U.overlap({ x: this.x - 2, y: this.y - 2, w: 4, h: 4 }, e.hitbox ? e.hitbox() : e)) {
        if (e.hit && e.hit('water', 1, g, this)) { this.dead = true; return; }
      }
    }
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    ctx.fillStyle = 'rgba(150,215,250,0.9)'; ctx.fillRect(x - 1, y - 1, 3, 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y - 1, 1, 1);
  }
};

// Resíduos lançados por máquinas (lodo tóxico, resíduo químico, bolas de fogo)
GC.Hazard = class Hazard {
  constructor(g, x, y, vx, vy, kind) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.kind = kind; this.dead = false; this.life = 4; this.t = 0;
    this.grav = kind === 'pulse' ? 200 : 520;
  }
  update(dt, g) {
    this.t += dt;
    this.vy += this.grav * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    const L = g.level;
    if (GC.TP[L.at(this.x, this.y)].solid || GC.TP[L.at(this.x, this.y)].water) {
      if (this.kind === 'fireball') {
        const ty = Math.floor(this.y / 16);
        const fy = GC.TP[L.at(this.x, this.y)].water ? null : ty * 16;
        if (fy !== null) g.spawn(new GC.Fire(g, this.x, fy, { boss: true }));
        GC.Audio.play('fireball');
        g.fx.burst(this.x, this.y, '#f29a2e', 10);
      } else g.fx.burst(this.x, this.y, this.kind === 'sludge' ? '#5a4a5e' : '#4ae0f0', 6);
      this.dead = true; return;
    }
    const p = g.player;
    if (p.state !== 'dead' && GC.U.overlap({ x: this.x - 4, y: this.y - 4, w: 8, h: 8 }, p)) {
      const msg = this.kind === 'sludge' ? 'Resíduo tóxico!' : this.kind === 'pulse' ? 'Pulso elétrico do drone-sentinela!' : null;
      p.hurt(1, this.x, g, msg);
      this.dead = true;
    }
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    if (this.kind === 'fireball') {
      ctx.fillStyle = '#e8501e'; ctx.fillRect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = '#fce07a'; ctx.fillRect(x - 2, y - 2, 4, 4);
    } else if (this.kind === 'sludge') {
      ctx.fillStyle = '#4a3a52'; ctx.fillRect(x - 3, y - 3, 6, 6);
      ctx.fillStyle = '#7a5a8a'; ctx.fillRect(x - 2, y - 3, 2, 2);
    } else {
      // pulso elétrico (ciano), sem referência a insumos
      ctx.fillStyle = '#4ae0f0'; ctx.fillRect(x - 1, y - 4, 2, 3); ctx.fillRect(x, y - 1, 2, 3); ctx.fillRect(x - 1, y + 2, 2, 2);
      ctx.fillStyle = '#e8ffff'; ctx.fillRect(x, y - 2, 1, 2);
    }
  }
};

GC.FX = class FX {
  constructor() { this.p = []; }
  add(o) { if (this.p.length < 700) this.p.push(Object.assign({ vx: 0, vy: 0, grav: 0, life: 0.5, size: 1, drag: 0 }, o, { max: o.life || 0.5 })); }
  dust(x, y, n) { for (let i = 0; i < n; i++) this.add({ x: x + (Math.random() - 0.5) * 8, y: y - 1, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 30, life: 0.35, color: 'rgba(200,170,130,0.8)', size: 2 }); }
  splash(x, y) { for (let i = 0; i < 14; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 140, vy: -60 - Math.random() * 140, grav: 600, life: 0.6, color: 'rgba(200,235,255,0.9)', size: 2 }); }
  splashSmall(x, y) { for (let i = 0; i < 3; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 60, grav: 500, life: 0.3, color: 'rgba(200,235,255,0.9)', size: 1 }); }
  bubbles(x, y, n) { for (let i = 0; i < n; i++) this.add({ x: x + (Math.random() - 0.5) * 6, y, vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 20, life: 0.9, color: 'rgba(220,245,255,0.8)', size: 2, type: 'bubble' }); }
  leaves(x, y, n) { const c = ['#5ec04a', '#3e8a34', '#f2c230', '#8ad050']; for (let i = 0; i < n; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 120, grav: 160, drag: 1.5, life: 1.2, color: c[i % 4], size: 2, type: 'leaf' }); }
  burst(x, y, color, n) { for (let i = 0; i < n; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.7) * 120, grav: 300, life: 0.35, color, size: 1 + (Math.random() < 0.4 ? 1 : 0) }); }
  sparks(x, y, n) { for (let i = 0; i < n; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.8) * 160, grav: 400, life: 0.3, color: Math.random() < 0.5 ? '#ffe070' : '#ff9030', size: 1 }); }
  smoke(x, y, n, dark) { for (let i = 0; i < n; i++) this.add({ x: x + (Math.random() - 0.5) * 6, y, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 25, life: 1.1, color: dark ? 'rgba(50,40,40,0.55)' : 'rgba(200,200,200,0.45)', size: 3 + (Math.random() * 3 | 0), type: 'smoke' }); }
  steam(x, y, n) { for (let i = 0; i < n; i++) this.add({ x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 30, life: 0.8, color: 'rgba(235,240,245,0.6)', size: 3, type: 'smoke' }); }
  petals(x, y, n) { const c = ['#f2c230', '#f8dc60', '#e86a9a', '#f4f0e0']; for (let i = 0; i < n; i++) this.add({ x: x + (Math.random() - 0.5) * 40, y: y - Math.random() * 20, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 40, grav: 40, drag: 0.6, life: 2.2, color: c[i % 4], size: 2, type: 'leaf' }); }
  ember(x, y) { this.add({ x, y, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, life: 1.6, color: Math.random() < 0.5 ? '#ff9a3a' : '#ffd06a', size: 1, type: 'ember' }); }
  ring(x, y, color) { this.add({ x, y, life: 0.6, color, size: 1, type: 'ring' }); }
  update(dt) {
    for (const q of this.p) {
      q.life -= dt;
      q.vy += q.grav * dt;
      if (q.drag) { q.vx *= 1 - q.drag * dt; q.vy *= 1 - q.drag * dt * 0.5; }
      if (q.type === 'leaf') q.vx += Math.sin(q.life * 8) * 30 * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    this.p = this.p.filter((q) => q.life > 0);
  }
  draw(ctx, cam) {
    for (const q of this.p) {
      const x = Math.round(q.x - cam.x), y = Math.round(q.y - cam.y);
      const a = Math.min(1, q.life / q.max * 1.5);
      if (q.type === 'ring') {
        const r = (1 - q.life / q.max) * 40;
        ctx.globalAlpha = a; ctx.strokeStyle = q.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = q.type === 'smoke' ? a * 0.8 : a;
      ctx.fillStyle = q.color;
      const s = q.type === 'smoke' ? Math.round(q.size + (1 - q.life / q.max) * 4) : q.size;
      ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s);
    }
    ctx.globalAlpha = 1;
  }
};
