// Ameaças artificiais do Projeto Horizonte e focos de incêndio.
// Nada é destruído com violência: as máquinas são travadas por sementes,
// cobertas pela vegetação e ficam inertes; o lodo é purificado.
(function () {
  const Thing = GC.Thing, U = GC.U, Art = GC.Art;

  function touchDamage(e, g, msg) {
    const p = g.player;
    if (p.state !== 'dead' && U.overlap(e.hitbox ? e.hitbox() : e, p)) p.hurt(1, e.cx, g, msg);
  }

  GC.Ent.fire = GC.Fire = class Fire extends Thing {
    constructor(g, x, y, o = {}) {
      super(g, x - 8, y, Object.assign({ w: 14, h: 16 }, o));
      this.hp = 1; this.wettable = true; this.seed = Math.random() * 10; this.spread = o.boss ? 6 : 0; this.boss = !!o.boss;
      this.size = 0.4;
    }
    hit(kind, d, g) {
      if (kind !== 'water') return false;
      this.hp -= 0.11;
      if (Math.random() < 0.3) g.fx.steam(this.cx, this.y + 4, 1);
      if (this.hp <= 0 && !this.dead) {
        this.dead = true; GC.Audio.play('extinguish'); g.fx.steam(this.cx, this.y + 6, 10);
        g.save.stats.fires++; g.unlockGuide('queimada', false);
      }
      return true;
    }
    update(dt, g) {
      super.update(dt);
      this.size = U.approach(this.size, 1, dt * 1.5);
      if (Math.random() < 0.15) g.fx.ember(this.cx + (Math.random() - 0.5) * 8, this.y + 2);
      if (Math.random() < 0.05) g.fx.smoke(this.cx, this.y, 1, true);
      this.hp = Math.min(1, this.hp + dt * 0.05);
      touchDamage(this, g, g.player.char === 'piata' ? 'Fogo! Abafe com o Soco da Terra (Poder).' : 'Fogo! Apague com o purificador (Usar).');
      if (this.boss) {
        this.spread -= dt;
        if (this.spread <= 0) {
          this.spread = 7;
          const fires = g.entities.filter((e) => e instanceof GC.Fire && !e.dead).length;
          if (fires < 7) {
            const nx = this.cx + (Math.random() < 0.5 ? -24 : 24);
            const A = g.level.arena;
            if (A && nx > A.x0 + 16 && nx < A.x1 - 16 && g.level.solidAt(nx, this.bottom + 2) && !g.level.waterAt(nx, this.bottom - 4)) g.spawn(new GC.Fire(g, nx, this.bottom, { boss: true }));
          }
        }
      }
    }
    hitbox() { return { x: this.x + 2, y: this.y + 4, w: this.w - 4, h: this.h - 4 }; }
    draw(ctx, cam) {
      const s = this.size * (0.6 + this.hp * 0.4), x = this.cx - cam.x, y = this.bottom - cam.y;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      GC.Sheets.draw(ctx, 'fogo', 'burn', this.t + this.seed, 0, 0, false);
      ctx.restore();
    }
  };

  class Machine extends Thing {
    constructor(g, x, y, o, w, h, hp) {
      super(g, x, y, Object.assign({ w, h }, o));
      this.hp = hp; this.maxHp = hp; this.flash = 0; this.hittable = true; this.wettable = true; this.scannable = true; this.scanned = 0;
    }
    hit(kind, d, g, proj) {
      if (this.dead) return false;
      let dmg = kind === 'seed' ? 1 : 0.08;
      if (this.scanned > 0) dmg *= 2;
      this.hp -= dmg; this.flash = 0.08;
      if (kind === 'seed') { GC.Audio.play('metal'); g.fx.sparks(proj.x, proj.y, 4); }
      else if (Math.random() < 0.2) g.fx.sparks(proj.x, proj.y, 1);
      if (this.hp <= 0) this.neutralize(g);
      return true;
    }
    neutralize(g) {
      this.dead = true; this.hittable = false; this.wettable = false;
      GC.Audio.play('neutralize');
      g.fx.leaves(this.cx, this.y + this.h / 2, 12);
      g.save.stats.machines++;
      g.addEntity(new GC.Ent.pickup(g, this.cx - 8, this.bottom, { kind: 'seed' }));
    }
    tick(dt) { this.t += dt; this.flash -= dt; this.scanned = Math.max(0, this.scanned - dt); }
    drawHp(ctx, cam) {
      if (this.dead || (this.scanned <= 0 && this.hp >= this.maxHp)) return;
      const x = Math.round(this.cx - cam.x), y = Math.round(this.y - cam.y) - 6;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 11, y, 22, 3);
      ctx.fillStyle = this.scanned > 0 ? '#6ae8c8' : '#e8b030'; ctx.fillRect(x - 10, y + 1, Math.round(20 * Math.max(0, this.hp) / this.maxHp), 1);
      if (this.scanned > 0) { ctx.strokeStyle = 'rgba(106,232,200,0.7)'; ctx.strokeRect(Math.round(this.x - cam.x) - 1.5, Math.round(this.y - cam.y) - 1.5, this.w + 3, this.h + 3); }
    }
  }
  GC.Machine = Machine;

  GC.Ent.chainsaw = class ChainsawBot extends Machine {
    constructor(g, x, y, o) {
      super(g, x, y, o, 22, 22, 3);
      this.x0 = o.x0 * 16; this.x1 = (o.x1 + 1) * 16; this.dir = -1; this.alert = false;
    }
    update(dt, g) {
      this.tick(dt);
      if (this.dead) return;
      const p = g.player;
      const sees = Math.abs(p.cx - this.cx) < 110 && Math.abs(p.bottom - this.bottom) < 30 && p.state !== 'dead';
      this.alert = sees;
      const sp = sees ? 70 : 28;
      if (sees) this.dir = p.cx < this.cx ? -1 : 1;
      this.x += this.dir * sp * dt;
      if (this.x < this.x0) { this.x = this.x0; this.dir = 1; }
      if (this.x + this.w > this.x1) { this.x = this.x1 - this.w; this.dir = -1; }
      if (Math.random() < 0.05) g.fx.smoke(this.cx - this.dir * 6, this.y - 2, 1, true);
      touchDamage(this, g, 'Cuidado com a serra-robô!');
    }
    draw(ctx, cam) {
      const anim = this.dead ? 'off' : this.alert ? 'attack' : 'walk';
      GC.Sheets.draw(ctx, 'serra', anim, this.t, this.cx - cam.x, this.bottom - cam.y, this.dir < 0, { white: this.flash > 0 });
      this.drawHp(ctx, cam);
    }
  };

  GC.Ent.sprayer = class Sprayer extends Machine {
    constructor(g, x, y, o) {
      super(g, x, y, o, 20, 10, 2);
      this.x0 = o.x0 * 16; this.x1 = o.x1 * 16; this.dir = 1; this.baseY = this.y; this.cool = 1;
    }
    update(dt, g) {
      this.tick(dt);
      if (this.dead) { this.vy = (this.vy || 0) + 600 * dt; this.y += this.vy * dt; if (g.level.solidAt(this.cx, this.bottom)) { this.gone = true; } return; }
      this.x += this.dir * 40 * dt;
      if (this.x < this.x0) this.dir = 1;
      if (this.x > this.x1) this.dir = -1;
      this.y = this.baseY + Math.sin(this.t * 2) * 6;
      this.cool -= dt;
      const p = g.player;
      if (this.cool <= 0 && Math.abs(p.cx - this.cx) < 40 && p.y > this.y) {
        this.cool = 1.3;
        g.addProjectile(new GC.Hazard(g, this.cx, this.bottom + 2, (Math.random() - 0.5) * 30, 60, 'pulse'));
      }
      touchDamage(this, g, null);
    }
    neutralize(g) { super.neutralize(g); this.vy = 0; }
    draw(ctx, cam) {
      if (this.gone) return;
      GC.Sheets.draw(ctx, 'drone', this.dead ? 'off' : 'fly', this.t, this.cx - cam.x, this.bottom - cam.y + 2, this.dir < 0, { white: this.flash > 0 });
      if (this.dead) return;
      this.drawHp(ctx, cam);
    }
  };

  GC.Ent.polluter = class Polluter extends Machine {
    constructor(g, x, y, o) { super(g, x, y, o, 24, 30, 6); this.dir = -1; this.cool = 1.5; }
    update(dt, g) {
      this.tick(dt);
      if (this.dead) return;
      const p = g.player;
      this.dir = p.cx < this.cx ? -1 : 1;
      if (Math.random() < 0.08) g.fx.smoke(this.cx + 1, this.y - 6, 1, true);
      this.cool -= dt;
      if (this.cool <= 0 && Math.abs(p.cx - this.cx) < 210 && p.state !== 'dead') {
        this.cool = 2;
        const dx = p.cx - this.cx, t = 0.9;
        g.addProjectile(new GC.Hazard(g, this.cx, this.y + 4, dx / t, -260, 'sludge'));
      }
      touchDamage(this, g, null);
    }
    neutralize(g) {
      super.neutralize(g);
      g.autoClean = true;
      if (g.player.char === 'larinha') g.say('larinha', 'Desligou! Sem novos resíduos, o riacho começa a se limpar. Meu jato acelera o processo.');
      else g.say('larinha', 'Desligou! Sem novos resíduos, o riacho se limpa sozinho. Espera um pouco antes de nadar.');
    }
    draw(ctx, cam) {
      Art.polluter(ctx, this.sx(cam), this.sy(cam), this.dir, this.t, this);
      if (!this.dead) Art.logo(ctx, this.sx(cam) - 3, this.sy(cam) - 22);
      this.drawHp(ctx, cam);
    }
  };

  GC.Ent.lodo = class Lodo extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 18, h: 12 }, o)); this.hp = 3; this.flash = 0; this.hittable = true; this.wettable = true; this.dir = -1; this.size = 1; this.told = false; }
    hit(kind, d, g, proj) {
      if (this.dead) return false;
      if (kind === 'seed') {
        g.fx.burst(proj.x, proj.y, '#5a4a5e', 3);
        if (!this.told) { this.told = true; g.say('piata', 'As sementes afundam nesse lodo. Melhor pular por cima: desligando a draga, ele se desfaz.'); }
        return true;
      }
      this.hp -= 0.12; this.flash = 0.06;
      this.size = 0.5 + 0.5 * Math.max(0, this.hp) / 3;
      if (this.hp <= 0) {
        this.dead = true; GC.Audio.play('neutralize');
        g.fx.splash(this.cx, this.y + 4);
        g.save.stats.cleaned++;
        g.addEntity(new GC.Ent.perereca(g, this.cx - 8, this.bottom, {}));
        g.toast('O lodo do garimpo foi purificado. Uma perereca reapareceu!');
      }
      return true;
    }
    update(dt, g) {
      this.t += dt; this.flash -= dt;
      if (this.dead) return;
      const p = g.player;
      if (Math.abs(p.cx - this.cx) < 130 && Math.abs(p.bottom - this.bottom) < 40) this.dir = p.cx < this.cx ? -1 : 1;
      const nx = this.x + this.dir * 16 * dt;
      const ahead = this.dir > 0 ? nx + this.w : nx;
      if (g.level.solidAt(ahead, this.bottom + 2) && !g.level.solidAt(ahead, this.bottom - 4)) this.x = nx; else this.dir *= -1;
      touchDamage(this, g, 'Lodo tóxico do garimpo! Purifique com água.');
    }
    draw(ctx, cam) { if (!this.dead) Art.lodo(ctx, this.sx(cam), this.sy(cam), this.dir, this.t, { size: this.size, flash: this.flash }); }
  };
})();
