// Fauna nativa. Nenhum animal é vilão: os perigos surgem quando o território
// é desrespeitado. Observar com calma registra a espécie no Guia de Campo.
(function () {
  const Thing = GC.Thing, U = GC.U, Art = GC.Art;

  // Animal que perambula num trecho do chão
  class Walker extends Thing {
    constructor(g, x, y, o, w, h) {
      super(g, x, y, Object.assign({ w, h }, o));
      this.x0 = (o.x0 !== undefined ? o.x0 * 16 : this.x - 40); this.x1 = (o.x1 !== undefined ? o.x1 * 16 : this.x + 40);
      this.dir = 1; this.speed = o.speed || 20; this.pause = 0; this.moving = false;
      this.obsRange = o.obsRange || 70;
    }
    wander(dt) {
      if (this.pause > 0) { this.pause -= dt; this.moving = false; return; }
      this.moving = true;
      this.x += this.dir * this.speed * dt;
      if (this.x < this.x0) { this.x = this.x0; this.dir = 1; this.pause = 1 + Math.random() * 2; }
      if (this.x + this.w > this.x1) { this.x = this.x1 - this.w; this.dir = -1; this.pause = 1 + Math.random() * 2; }
      if (Math.random() < 0.003) this.pause = 1 + Math.random() * 2.5;
    }
  }

  GC.Ent.seriema = class Seriema extends Walker {
    constructor(g, x, y, o) { super(g, x, y, o, 14, 30); this.observe = 'seriema'; this.speed = 34; this.callT = 3; }
    update(dt, g) {
      super.update(dt); this.wander(dt);
      // foge quando alguém corre perto
      const p = g.player;
      if (Math.abs(p.cx - this.cx) < 50 && p.runT > 0.2) { this.dir = p.cx < this.cx ? 1 : -1; this.speed = 80; this.pause = 0; }
      else this.speed = U.approach(this.speed, 34, 40 * dt);
      this.callT -= dt;
      if (this.callT <= 0 && Math.abs(p.cx - this.cx) < 260) { GC.Audio.play('seriema'); this.callT = 7 + Math.random() * 6; }
    }
    draw(ctx, cam) { GC.Sheets.draw(ctx, 'seriema', this.callT > 6.2 ? 'call' : this.moving ? 'walk' : 'idle', this.t, this.cx - cam.x, this.bottom - cam.y, this.dir < 0); }
  };

  GC.Ent.tamandua = class Tamandua extends Walker {
    constructor(g, x, y, o) { super(g, x, y, o, 30, 16); this.observe = 'tamandua'; this.speed = 14; this.task = null; }
    onObserved(g) {
      if (!g.save.allies.tamandua) { g.save.allies.tamandua = true; g.dialog('tamandua'); }
    }
    goDig(spot, g) { this.task = { spot, phase: 'walk', t: 0 }; }
    update(dt, g) {
      super.update(dt);
      if (!this.task) { this.wander(dt); return; }
      const k = this.task, target = k.spot.cx - this.w / 2 - 14;
      if (k.phase === 'walk') {
        this.moving = true; this.dir = Math.sign(target - this.x) || 1;
        this.x += this.dir * 60 * dt;
        if (Math.abs(target - this.x) < 2) { k.phase = 'dig'; k.t = 2.2; this.dir = 1; GC.Audio.play('dig'); }
      } else if (k.phase === 'dig') {
        this.moving = false; k.t -= dt;
        if (Math.random() < 0.4) g.fx.burst(this.x + this.w + 2, this.bottom - 4, '#b4703e', 2);
        if (k.t <= 0) {
          for (const [tx, ty] of k.spot.tiles) g.level.set(tx, ty, GC.T.EMPTY);
          g.fx.dust(k.spot.cx, k.spot.bottom - 10, 14);
          g.unlockGuide('cupinzeiro', true);
          g.say('piata', 'Ele só abriu a toca antiga ao lado. O cupinzeiro se refaz em poucos dias.');
          this.task = null; this.x0 = this.x - 60; this.x1 = this.x + 60;
        }
      }
    }
    draw(ctx, cam) { GC.Sheets.draw(ctx, 'tamandua', this.task && this.task.phase === 'dig' ? 'dig' : this.moving ? 'walk' : 'idle', this.t, this.cx - cam.x, this.bottom - cam.y, this.dir < 0); }
  };

  GC.Ent.capivara = class Capivara extends Walker {
    constructor(g, x, y, o) { super(g, x, y, o, 26, 16); this.observe = 'capivara'; this.speed = 10; }
    onObserved(g) { if (!g.save.allies.capivara) { g.save.allies.capivara = true; g.dialog('capivara'); } }
    update(dt) { super.update(dt); this.wander(dt); }
    draw(ctx, cam) { Art.capivara(ctx, this.sx(cam), this.sy(cam), this.dir, this.t, this.moving); }
  };

  // Ariranhas nadando em grupo
  GC.Ent.ariranha = class Ariranha extends Thing {
    constructor(g, x, y, o) {
      super(g, x, y, Object.assign({ w: 22, h: 8 }, o));
      this.observe = 'ariranha'; this.obsRange = 110;
      this.x0 = o.x0 * 16; this.x1 = o.x1 * 16; this.baseY = this.y; this.n = o.n || 3; this.ph = Math.random() * 6;
      this.dir = 1;
    }
    update(dt) {
      super.update(dt);
      this.x += this.dir * 28 * dt;
      if (this.x < this.x0) this.dir = 1;
      if (this.x > this.x1) this.dir = -1;
    }
    draw(ctx, cam) {
      for (let i = 0; i < this.n; i++) {
        const ox = -i * 20 * this.dir, oy = Math.sin(this.t * 2 + i * 1.7 + this.ph) * 10;
        Art.ariranha(ctx, Math.round(this.cx + ox - cam.x), Math.round(this.bottom + oy - cam.y), this.dir, this.t + i);
      }
    }
  };

  // Jacaré tomando sol: reage a quem chega correndo ou perto demais
  GC.Ent.jacare = class Jacare extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 44, h: 8 }, o)); this.observe = 'jacare'; this.obsRange = 120; this.state = 'bask'; this.st = 0; this.open = 0; this.dir = o.dir || -1; this.cool = 0; }
    update(dt, g) {
      super.update(dt);
      const p = g.player;
      const dx = Math.abs(p.cx - this.cx), dy = Math.abs(p.bottom - this.bottom);
      this.cool -= dt;
      const careless = p.runT > 0.1 || p.state === 'swim' || p.toolUsedT < 0.2;
      if (this.state === 'bask') {
        this.open = U.approach(this.open, 0.15 + Math.sin(this.t) * 0.1, dt);
        if (this.cool <= 0 && dy < 28 && (dx < 26 || (dx < 54 && careless))) { this.state = 'warn'; this.st = 0.55; GC.Audio.play('growl'); this.dir = p.cx < this.cx ? -1 : 1; }
      } else if (this.state === 'warn') {
        this.open = U.approach(this.open, 1, dt * 4); this.st -= dt;
        if (this.st <= 0) {
          this.state = 'snap'; this.st = 0.25; GC.Audio.play('snap');
          if (dx < 40 && dy < 30) p.hurt(1, this.cx, g, 'O jacaré se defendeu. Mantenha distância de quem toma sol.');
        }
      } else if (this.state === 'snap') {
        this.open = U.approach(this.open, 0, dt * 6); this.st -= dt;
        if (this.st <= 0) { this.state = 'bask'; this.cool = 1.6; }
      }
    }
    draw(ctx, cam) { Art.jacare(ctx, this.sx(cam), this.sy(cam), this.dir, this.t, this.open); }
  };

  // Sucuri nadando: contato empurra o jogador
  GC.Ent.sucuri = class Sucuri extends Thing {
    constructor(g, x, y, o) {
      super(g, x, y, Object.assign({ w: 12, h: 8 }, o));
      this.observe = 'sucuri'; this.obsRange = 100;
      this.x0 = o.x0 * 16; this.x1 = o.x1 * 16; this.y0 = o.y0 * 16; this.y1 = o.y1 * 16;
      this.trail = []; this.dir = 1; this.ph = 0;
    }
    update(dt, g) {
      super.update(dt);
      this.ph += dt;
      this.x += this.dir * 32 * dt;
      if (this.x < this.x0) this.dir = 1;
      if (this.x > this.x1) this.dir = -1;
      this.y = (this.y0 + this.y1) / 2 + Math.sin(this.ph * 0.9) * (this.y1 - this.y0) / 2;
      this.trail.unshift({ x: this.cx, y: this.y + 4 });
      if (this.trail.length > 70) this.trail.pop();
      const p = g.player;
      for (let i = 0; i < this.trail.length; i += 6) {
        const s = this.trail[i];
        if (Math.abs(p.cx - s.x) < 9 && s.y > p.y - 4 && s.y < p.bottom + 4) { p.hurt(1, s.x, g, 'A sucuri se defende quando é cercada. Dê espaço a ela.'); break; }
      }
    }
    draw(ctx, cam) {
      for (let i = this.trail.length - 1; i >= 0; i -= 2) {
        const s = this.trail[i];
        const w = i < 6 ? 6 : Math.max(3, 6 - i / 18);
        ctx.fillStyle = (Math.floor(i / 6) % 3 === 0) ? '#2e3a1e' : '#6a7a3a';
        ctx.fillRect(Math.round(s.x - cam.x - w / 2), Math.round(s.y - cam.y - w / 2), Math.ceil(w), Math.ceil(w));
      }
      const h = this.trail[0];
      if (h) {
        const x = Math.round(h.x - cam.x), y = Math.round(h.y - cam.y);
        ctx.fillStyle = '#6a7a3a'; ctx.fillRect(x - 4 + this.dir * 3, y - 3, 8, 6);
        ctx.fillStyle = '#e8d040'; ctx.fillRect(x + this.dir * 5, y - 2, 1, 1);
      }
    }
  };

  // Território da onça com filhotes
  GC.Ent.onca = class OncaTerritory extends Thing {
    constructor(g, x, y, o) {
      super(g, x, y, Object.assign({ w: 40, h: 26 }, o));
      this.observe = 'onca'; this.obsRange = 130;
      this.zx0 = o.zx0 * 16; this.zx1 = o.zx1 * 16;
      this.meter = 0; this.pose = 'stand'; this.warned = false; this.charge = 0; this.passed = false; this.dir = -1;
      this.homeX = this.x;
    }
    update(dt, g) {
      super.update(dt);
      const p = g.player;
      const inside = p.cx > this.zx0 && p.cx < this.zx1 && p.state !== 'dead';
      if (this.charge > 0) {
        this.charge -= dt; this.pose = 'walk';
        this.x += this.dir * 220 * dt;
        if (this.charge <= 0) { this.x = this.homeX; }
        return;
      }
      if (inside) {
        const loud = (p.runT > 0.08 && !p.sneaking) || p.toolUsedT < 0.1 || p.state === 'slide' || (!p.onGround && p.state === 'normal' && p.vy < -200);
        if (loud) this.meter += dt * 1.6; else this.meter = Math.max(0, this.meter - dt * 0.5);
        this.dir = p.cx < this.cx ? -1 : 1;
        if (this.meter > 0.5 && !this.warned) { this.warned = true; this.pose = 'roar'; GC.Audio.play('growl'); g.toast('A onça está alerta. Ande devagar: segure ↓ enquanto se move.'); }
        if (this.meter < 0.3) { this.warned = false; this.pose = 'crouch'; }
        if (this.meter > 1.3) {
          // investida de advertência: afasta sem ferir
          this.meter = 0; this.charge = 0.35; this.warned = false;
          GC.Audio.play('roar'); g.shake(5, 0.3);
          p.x = this.zx0 - 24; p.y = p.lastSafe.y; p.vx = 0; p.vy = 0;
          g.toast('A onça protegeu seus filhotes e você recuou. Tente atravessar com calma.');
        }
      } else {
        this.meter = Math.max(0, this.meter - dt);
        this.pose = 'stand';
        if (p.cx >= this.zx1 && !this.passed) {
          this.passed = true;
          if (!g.save.allies.onca) { g.save.allies.onca = true; g.unlockGuide('onca', true); g.dialog('onca'); }
        }
      }
    }
    draw(ctx, cam) {
      const x = this.sx(cam), y = this.sy(cam);
      // rocha de onde a família observa a trilha
      ctx.fillStyle = '#9a5a40'; ctx.fillRect(x - 34, y - 12, 74, 12);
      ctx.fillStyle = '#b8745a'; ctx.fillRect(x - 32, y - 12, 70, 2);
      ctx.fillStyle = '#7a4430'; ctx.fillRect(x - 34, y - 3, 74, 3);
      Art.onca(ctx, x, y - 12, this.dir, this.t, this.pose, 1);
      Art.onca(ctx, x - 26, y - 12, 1, this.t * 1.3, Math.sin(this.t * 2) > 0 ? 'walk' : 'crouch', 0.5);
      Art.onca(ctx, x + 28, y - 12, -1, this.t * 1.1 + 1, 'crouch', 0.45);
      if (this.meter > 0.05) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 15, y - 48, 30, 4);
        ctx.fillStyle = this.meter > 0.9 ? '#e8501e' : '#f2c230'; ctx.fillRect(x - 14, y - 47, Math.round(28 * Math.min(1, this.meter / 1.3)), 2);
      }
    }
  };

  // A arara resgatada acompanha a dupla
  GC.Ent.araraFriend = class AraraFriend extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 10, h: 10 }, o)); this.px = x; this.py = y; this.mode = 'follow'; this.mt = 0; }
    scout(g) { this.mode = 'scout'; this.mt = 2.2; GC.Audio.play('arara'); }
    update(dt, g) {
      super.update(dt);
      const p = g.player;
      let tx = p.cx - p.facing * 16, ty = p.y - 18 + Math.sin(this.t * 2) * 4;
      if (this.mode === 'scout') { this.mt -= dt; tx = p.cx + p.facing * 120; ty = p.y - 50; if (this.mt <= 0) this.mode = 'follow'; }
      this.px = U.lerp(this.px, tx, Math.min(1, dt * (this.mode === 'scout' ? 2.5 : 3)));
      this.py = U.lerp(this.py, ty, Math.min(1, dt * 3));
      this.dir = tx > this.px ? 1 : -1;
    }
    draw(ctx, cam) { GC.Sheets.draw(ctx, 'arara', 'fly', this.t, this.px - cam.x, this.py - cam.y + 6, this.dir < 0); }
  };

  // Drone de análise da EcoPack
  GC.Ent.drone = class Drone extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 10, h: 6 }, o)); this.px = x; this.py = y; this.life = 6; this.dir = g.player.facing; }
    update(dt, g) {
      super.update(dt);
      this.life -= dt;
      const p = g.player;
      const tx = this.life > 0.8 ? p.cx + this.dir * 70 : p.cx, ty = this.life > 0.8 ? p.y - 30 : p.y;
      this.px = U.lerp(this.px, tx, Math.min(1, dt * 3)); this.py = U.lerp(this.py, ty + Math.sin(this.t * 6) * 2, Math.min(1, dt * 3));
      if (this.life > 0.8) for (const e of g.entities) {
        if (e.scannable && !e.dead && U.dist(this.px, this.py, e.cx, e.y + e.h / 2) < 230) { if (!e.scanned) { g.fx.ring(e.cx, e.y + e.h / 2, '#6ae8c8'); } e.scanned = Math.max(e.scanned || 0, 1.5); }
      }
      // garra do drone: puxa alavancas que Larinha não alcança
      if (this.life > 0.8) for (const e of g.entities) if (e instanceof GC.Ent.lever && !e.on && U.dist(this.px, this.py, e.cx, e.y + 4) < 150) e.pullByDrone(g);
      if (this.life <= 0) this.dead = true;
    }
    draw(ctx, cam) {
      const x = Math.round(this.px - cam.x), y = Math.round(this.py - cam.y);
      if (this.life > 0.8) {
        ctx.strokeStyle = 'rgba(106,232,200,' + (0.25 + 0.15 * Math.sin(this.t * 8)) + ')';
        ctx.beginPath(); ctx.arc(x, y, 30 + (this.t * 60) % 120, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#3e6676'; ctx.fillRect(x - 5, y - 2, 10, 4);
      ctx.fillStyle = '#6ae8c8'; ctx.fillRect(x - 1, y - 1, 2, 2);
      const r = Math.sin(this.t * 50) > 0;
      ctx.fillStyle = 'rgba(220,230,235,0.8)'; ctx.fillRect(x - 8, y - 4, r ? 6 : 3, 1); ctx.fillRect(x + (r ? 2 : 5), y - 4, r ? 6 : 3, 1);
    }
  };

  // Perereca que surge quando o lodo é purificado
  GC.Ent.perereca = class Perereca extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 8, h: 6 }, o)); this.observe = 'perereca'; this.obsRange = 60; this.dir = Math.random() < 0.5 ? 1 : -1; this.hop = 0; }
    update(dt, g) {
      super.update(dt);
      this.hop -= dt;
      if (this.hop <= 0) { this.hop = 1.2 + Math.random(); }
      if (this.hop > 0.9) { const nx = this.x + this.dir * 30 * dt; if (!g.level.solidAt(nx + (this.dir > 0 ? this.w : 0), this.bottom - 2) && g.level.solidAt(nx + this.w / 2, this.bottom + 2)) this.x = nx; else this.dir *= -1; }
    }
    draw(ctx, cam) { GC.Art.perereca(ctx, this.sx(cam), this.sy(cam), this.dir, this.hop > 0.9 ? (1.2 - this.hop) * 3 : 0); }
  };
})();
