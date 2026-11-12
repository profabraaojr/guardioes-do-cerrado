// Fauna do Cerrado com comportamentos simples (sem colisão com o jogador):
//   fugitivo (ema, lobo-guará), pastador (veado-campeiro), bando (catetos),
//   escavador (tatu-canastra), voador de poleiro (tucanuçu), voo de ambiente (araras)
//   e enxames de insetos. Observar com calma registra a espécie no Guia de Campo.
(function () {
  const Thing = GC.Thing, U = GC.U;

  class Animal extends Thing {
    constructor(g, x, y, o, sheet, w, h) {
      super(g, x, y, Object.assign({ w, h }, o));
      this.sheet = sheet;
      this.x0 = o.x0 !== undefined ? o.x0 * 16 : this.x - 60; this.x1 = o.x1 !== undefined ? (o.x1 + 1) * 16 : this.x + 60;
      this.dir = o.dir || 1; this.mode = 'calm'; this.mt = 0; this.anim = 'idle';
      this.obsRange = o.obsRange || 90;
    }
    playerDist(g) { return Math.abs(g.player.cx - this.cx); }
    clampRange() { if (this.x < this.x0) { this.x = this.x0; return true; } if (this.x + this.w > this.x1) { this.x = this.x1 - this.w; return true; } return false; }
    draw(ctx, cam) { GC.Sheets.draw(ctx, this.sheet, this.anim, this.t, this.cx - cam.x, this.bottom - cam.y, this.dir < 0); }
  }

  // ——— foge correndo quando alguém se aproxima ———
  class Fugitivo extends Animal {
    constructor(g, x, y, o, sheet, w, h, cfg) { super(g, x, y, o, sheet, w, h); Object.assign(this, cfg); this.pause = 1; }
    update(dt, g) {
      this.t += dt;
      const p = g.player, d = this.playerDist(g), close = d < this.scare || (d < this.scare * 1.6 && p.runT > 0.15);
      if (close && this.mode !== 'flee') { this.mode = 'flee'; this.mt = 2.2; this.dir = p.cx < this.cx ? 1 : -1; this.onScare && this.onScare(g); }
      if (this.mode === 'flee') {
        this.anim = this.runAnim; this.x += this.dir * this.fast * dt; this.mt -= dt;
        if (this.clampRange()) { this.dir *= -1; this.mt = Math.min(this.mt, 0.4); }
        if (this.mt <= 0 && !close) { this.mode = 'calm'; this.pause = 1.5; }
      } else {
        if (this.pause > 0) { this.pause -= dt; this.anim = 'idle'; }
        else { this.anim = this.walkAnim; this.x += this.dir * this.slow * dt; if (this.clampRange()) { this.dir *= -1; this.pause = 1 + Math.random() * 2; } if (Math.random() < 0.004) this.pause = 1 + Math.random() * 2; }
      }
    }
  }
  GC.Ent.ema = class Ema extends Fugitivo {
    constructor(g, x, y, o) { super(g, x, y, o, 'ema', 24, 38, { scare: 70, fast: 130, slow: 18, runAnim: 'run', walkAnim: 'walk' }); this.observe = 'ema'; this.obsRange = 120; }
  };
  GC.Ent.lobo = class LoboGuara extends Fugitivo {
    constructor(g, x, y, o) { super(g, x, y, o, 'lobo', 30, 30, { scare: 95, fast: 95, slow: 16, runAnim: 'trot', walkAnim: 'trot' }); this.observe = 'loboGuara'; this.obsRange = 150; }
  };

  // ——— veado-campeiro: pasta, fica alerta e sai saltando ———
  GC.Ent.veado = class Veado extends Animal {
    constructor(g, x, y, o) { super(g, x, y, o, 'veado', 28, 26); this.observe = 'veadoCampeiro'; this.obsRange = 140; }
    update(dt, g) {
      this.t += dt;
      const p = g.player, d = this.playerDist(g);
      if (this.mode === 'run') {
        this.anim = 'run'; this.x += this.dir * 120 * dt; this.mt -= dt;
        if (this.clampRange()) this.dir *= -1;
        if (this.mt <= 0 && d > 90) this.mode = 'calm';
      } else if (d < 70 || (d < 140 && p.runT > 0.15)) { this.mode = 'run'; this.mt = 1.8; this.dir = p.cx < this.cx ? 1 : -1; }
      else if (d < 150) { this.mode = 'alert'; this.anim = 'alert'; this.dir = p.cx < this.cx ? -1 : 1; }
      else { this.mode = 'calm'; this.anim = 'graze'; }
    }
  };

  // ——— catetos: bando que fuça o chão e se afasta junto ———
  GC.Ent.catetos = class Catetos extends Animal {
    constructor(g, x, y, o) { super(g, x, y, o, 'cateto', 60, 16); this.observe = 'cateto'; this.obsRange = 100; this.members = [0, 18, 36].map((ox, k) => ({ ox, ph: k * 1.3 })); this.pause = 0; }
    update(dt, g) {
      this.t += dt;
      const p = g.player, d = this.playerDist(g);
      if (d < 64 && this.mode !== 'flee') { this.mode = 'flee'; this.mt = 1.6; this.dir = p.cx < this.cx ? 1 : -1; }
      if (this.mode === 'flee') { this.anim = 'walk'; this.x += this.dir * 70 * dt; this.mt -= dt; if (this.clampRange()) this.dir *= -1; if (this.mt <= 0) this.mode = 'calm'; }
      else if (this.pause > 0) { this.pause -= dt; this.anim = 'idle'; }
      else { this.anim = 'walk'; this.x += this.dir * 12 * dt; if (this.clampRange()) { this.dir *= -1; this.pause = 2; } if (Math.random() < 0.006) this.pause = 2 + Math.random() * 2; }
    }
    draw(ctx, cam) {
      for (const m of this.members) {
        const a = this.anim === 'idle' && Math.sin(this.t + m.ph) > 0.3 ? 'idle' : this.anim;
        GC.Sheets.draw(ctx, 'cateto', a, this.t + m.ph, this.x + m.ox + 8 - cam.x, this.bottom - cam.y + (m.ox === 18 ? 1 : 0), this.dir < 0);
      }
    }
  };

  // ——— tatu-canastra: anda devagar; cava e some quando incomodado ———
  GC.Ent.tatu = class Tatu extends Animal {
    constructor(g, x, y, o) { super(g, x, y, o, 'tatu', 26, 14); this.observe = 'tatuCanastra'; this.obsRange = 80; this.hide = 0; }
    update(dt, g) {
      this.t += dt;
      const d = this.playerDist(g);
      if (this.mode === 'dig') { this.anim = 'dig'; this.mt -= dt; if (this.mt <= 0) { this.mode = 'hidden'; this.hide = 6; } return; }
      if (this.mode === 'hidden') {
        this.hide -= dt;
        if (this.hide <= 0 && d > 80) { this.mode = 'calm'; this.x = this.x0 + Math.random() * (this.x1 - this.x0 - this.w); g.fx.dust(this.cx, this.bottom, 6); }
        return;
      }
      if (d < 50) { this.mode = 'dig'; this.mt = 0.6; this.t = 0; g.fx.dust(this.cx, this.bottom, 8); return; }
      this.anim = 'walk'; this.x += this.dir * 10 * dt;
      if (this.clampRange()) this.dir *= -1;
    }
    draw(ctx, cam) { if (this.mode !== 'hidden') super.draw(ctx, cam); else { ctx.fillStyle = '#7a3a1e'; ctx.fillRect(Math.round(this.cx - cam.x) - 6, Math.round(this.bottom - cam.y) - 1, 12, 1.5); } }
    get observe() { return this.mode === 'hidden' ? null : this._obs; }
    set observe(v) { this._obs = v; }
  };

  // ——— tucanuçu: pousa no alto e voa para outro poleiro ———
  GC.Ent.tucano = class Tucano extends Animal {
    constructor(g, x, y, o) {
      super(g, x, y, o, 'tucano', 20, 18); this.observe = 'tucanucu'; this.obsRange = 110;
      this.perches = (o.perches || [0, 8]).map((dx) => ({ x: x + dx * 16, y: y + (o.lift || -60) }));
      this.cur = 0; this.x = this.perches[0].x; this.y = this.perches[0].y - this.h; this.anim = 'perch'; this.from = null;
    }
    update(dt, g) {
      this.t += dt;
      const p = g.player;
      if (this.from) {
        this.mt += dt / 1.4; const k = Math.min(1, this.mt), A = this.from, B = this.perches[this.cur];
        this.x = U.lerp(A.x, B.x, k); this.y = U.lerp(A.y, B.y, k) - Math.sin(k * Math.PI) * 30 - this.h;
        this.dir = B.x > A.x ? 1 : -1; this.anim = 'fly';
        if (k >= 1) { this.from = null; this.anim = 'perch'; }
        return;
      }
      if (U.dist(p.cx, p.cy, this.cx, this.bottom) < 70) { this.from = this.perches[this.cur]; this.cur = (this.cur + 1) % this.perches.length; this.mt = 0; GC.Audio.play('arara'); }
    }
  };

  // ——— par de araras cruzando o céu (ambiente) ———
  GC.Ent.araraVoo = class AraraVoo extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 20, h: 12 }, o)); this.x0 = o.x0 * 16; this.x1 = o.x1 * 16; this.baseY = y - (o.lift || 120); this.px = this.x0; this.dir = 1; }
    update(dt) { this.t += dt; this.px += this.dir * 70 * dt; if (this.px > this.x1 + 80) this.dir = -1; if (this.px < this.x0 - 80) this.dir = 1; }
    draw(ctx, cam) {
      for (let k = 0; k < 2; k++) GC.Sheets.draw(ctx, 'arara', 'fly', this.t + k * 0.3, this.px - k * 22 * this.dir - cam.x, this.baseY + Math.sin(this.t * 1.5 + k) * 6 + k * 8 - cam.y, this.dir < 0);
    }
  };

  // ——— enxames de borboletas e libélulas ———
  GC.Ent.insetos = class Insetos extends Thing {
    constructor(g, x, y, o) {
      super(g, x, y, Object.assign({ w: 16, h: 16 }, o));
      const kinds = o.kind === 'libelula' ? ['libelula', 'libelula'] : ['amarela', 'azul', 'laranja', 'amarela'];
      this.list = kinds.map((k, i) => ({ k, ph: i * 1.7, r: 14 + i * 6, sp: 0.6 + i * 0.15 }));
      this.cx0 = x + 8; this.cy0 = y - (o.kind === 'libelula' ? 10 : 18);
    }
    draw(ctx, cam) {
      for (const b of this.list) {
        const x = this.cx0 + Math.sin(this.t * b.sp + b.ph) * b.r * 1.6, y = this.cy0 + Math.sin(this.t * b.sp * 1.7 + b.ph) * 8;
        GC.Sheets.draw(ctx, 'insetos', b.k, this.t + b.ph, x - cam.x, y - cam.y, Math.cos(this.t * b.sp + b.ph) < 0);
      }
    }
  };
})();
