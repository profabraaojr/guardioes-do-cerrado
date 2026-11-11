// Grupo 1: humanos em atividades criminosas específicas.
// Cada um tem equipamento ilegal próprio, comportamento e padrão de ataque não letal.
(function () {
  const A = GC.Antagonists, U = GC.U;

  // Rede lançada (imobiliza por instantes, sem dano)
  GC.Net = class Net {
    constructor(g, x, y, vx, vy) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.dead = false; this.life = 2; this.t = 0; }
    update(dt, g) {
      this.t += dt; this.vy += 380 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
      if (GC.TP[g.level.at(this.x, this.y)].solid || this.life <= 0) { this.dead = true; return; }
      const p = g.player;
      if (p.state !== 'dead' && U.overlap({ x: this.x - 6, y: this.y - 6, w: 12, h: 12 }, p)) {
        this.dead = true; p.netT = 1.3; p.vx = 0; GC.Audio.play('snap');
        g.toast('Enredado! Aperte os botões para se soltar.');
      }
    }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), s = 5 + Math.round(Math.sin(this.t * 10));
      ctx.strokeStyle = '#d8c89a'; ctx.lineWidth = 1;
      for (let i = -s; i <= s; i += 3) { ctx.beginPath(); ctx.moveTo(x + i + 0.5, y - s); ctx.lineTo(x + i + 0.5, y + s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - s, y + i + 0.5); ctx.lineTo(x + s, y + i + 0.5); ctx.stroke(); }
    }
  };

  // ——— Traficante de animais silvestres ———
  // Vigia a gaiola da arara, lança redes. Fraquezas: jato d'água no píer molhado
  // (escorrega), sementes travam o lançador de redes, drone registra provas.
  A.define('traficante', {
    group: 'humano', name: 'Traficante de animais', guide: 'trafico',
    desc: 'Captura aves para vender ilegalmente. Vigia a gaiola e lança redes.',
    resolve: 'Escorregar com o jato d’água, travar o lançador de redes com sementes ou registrar provas com o drone.'
  }, class Traficante extends GC.Infrator {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ resolve: 3 }, o), 'traficante'); this.sight = 130; this.actCool = 2.6; this.gearMsg = 'Lançador de redes travado pelas sementes!'; this.surrenderLine = 'Tá bom, tá bom! Eu solto os bichos!'; this.leaveDir = 1; }
    act(g) {
      const p = g.player, dx = p.cx - this.cx, t = 0.6;
      g.addProjectile(new GC.Net(g, this.cx + this.dir * 8, this.y + 8, dx / t, -160));
      GC.Audio.play('stroke'); this.pose = 'throw'; this.throwT = 0.3;
    }
    jamGear() {}
    onSurrender(g) { g.toast('A gaiola pode ser aberta agora.'); }
    drawGear(ctx, cam) {
      if (!this.active) return;
      const p = GC.Art.P(ctx, this.sx(cam), this.sy(cam), this.dir);
      p(this.gearJammed ? '#6a6e7a' : '#4a5a3a', 4, -16, 8, 3); p('#2a2d36', 10, -17, 3, 5);
      if (this.gearJammed) { p('#5ec04a', 6, -18, 2, 2); p('#f2c230', 9, -18, 1, 1); }
    }
  });

  // ——— Caçador ilegal ———
  // Espalha armadilhas pelo caminho dos animais. Desarmar armadilhas com sementes
  // reduz a resistência; água e drone também funcionam.
  GC.Ent.armadilha = class Armadilha extends GC.Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 14, h: 6 }, o)); this.hittable = true; this.armed = true; this.hold = 0; this.owner = o.owner || null; }
    hitbox() { return { x: this.x - 2, y: this.y - 14, w: this.w + 4, h: this.h + 14 }; }
    hit(kind, d, g, proj) {
      if (kind !== 'seed' || !this.armed) return false;
      this.armed = false; GC.Audio.play('clank'); g.fx.sparks(this.cx, this.y, 4); g.fx.leaves(this.cx, this.y, 4);
      g.save.stats.traps = (g.save.stats.traps || 0) + 1;
      if (this.owner && this.owner.active) this.owner.lose(0.75, g, 'Armadilha desarmada.');
      else g.toast('Armadilha desarmada.');
      return true;
    }
    update(dt, g) {
      this.t += dt;
      const p = g.player;
      if (this.armed && p.state !== 'dead' && p.onGround && U.overlap(this, p)) {
        this.armed = false; p.netT = 1.1; p.hurt(1, null, g, 'Armadilha de caça! Ela teria ferido um animal.');
        GC.Audio.play('snap');
      }
      if (!this.armed) { this.fade = (this.fade || 0) + dt; if (this.fade > 3) this.dead = true; }
    }
    draw(ctx, cam) {
      const x = this.sx(cam), y = this.sy(cam);
      ctx.fillStyle = '#5a5e66'; ctx.fillRect(x - 7, y - 2, 14, 2);
      if (this.armed) { for (let i = 0; i < 6; i++) { ctx.fillStyle = '#8a8e96'; ctx.fillRect(x - 6 + i * 2, y - 5 + (i % 2), 1, 3); } ctx.fillStyle = '#c8302a'; ctx.fillRect(x - 1, y - 3, 2, 1); }
      else { ctx.fillStyle = '#8a8e96'; ctx.fillRect(x - 6, y - 4, 12, 2); ctx.fillStyle = '#5ec04a'; ctx.fillRect(x - 2, y - 6, 1, 3); ctx.fillRect(x + 3, y - 5, 1, 2); }
    }
  };
  A.define('cacador', {
    group: 'humano', name: 'Caçador ilegal', guide: 'cacaIlegal',
    desc: 'Arma armadilhas na trilha dos animais e patrulha a área.',
    resolve: 'Desarmar as armadilhas com sementes, escorregar com o jato d’água ou registrar provas com o drone.'
  }, class Cacador extends GC.Infrator {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ resolve: 3 }, o), 'cacador'); this.sight = 100; this.trapT = 2; this.surrenderLine = 'Acabou pra mim. Vou responder pelo que fiz.'; this.leaveDir = -1; }
    update(dt, g) { if (this.active && this.state !== 'stunned') this.trapTick(dt, g); super.update(dt, g); }
    trapTick(dt, g) {
      this.trapT -= dt;
      const mine = g.entities.filter((e) => e instanceof GC.Ent.armadilha && e.armed && e.owner === this).length;
      if (this.trapT <= 0 && mine < 3) {
        this.trapT = 5; this.pose = 'crouch';
        g.addEntity(new GC.Ent.armadilha(g, Math.round(this.cx - 8 + this.dir * 14), this.bottom, { owner: this }));
      }
    }
    act(g) { this.dir = g.player.cx < this.cx ? -1 : 1; this.state = 'patrol'; this.speed = 52; setTimeout(() => (this.speed = 26), 1200); }
  });

  // ——— Descartador clandestino de resíduos ———
  // Despeja tambores de resíduo perto da vereda; os tambores rolam pela trilha.
  GC.Ent.barril = class Barril extends GC.Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 12, h: 12 }, o)); this.vx = o.vx || -70; this.vy = 0; this.rot = 0; }
    update(dt, g) {
      this.t += dt; this.vy += 900 * dt;
      this.x += this.vx * dt; this.rot += this.vx * dt / 6;
      this.y += this.vy * dt;
      const L = g.level;
      if (GC.TP[L.at(this.cx, this.bottom)].solid) { this.y = Math.floor(this.bottom / 16) * 16 - this.h; this.vy = 0; }
      if (GC.TP[L.at(this.cx, this.bottom - 2)].water) { this.dead = true; g.fx.splash(this.cx, this.y); return; }
      if (GC.TP[L.at(this.vx < 0 ? this.x - 1 : this.x + this.w + 1, this.y + 6)].solid || this.t > 8) { this.dead = true; g.fx.burst(this.cx, this.y + 6, '#6a5a4a', 8); return; }
      const p = g.player;
      if (p.state !== 'dead' && U.overlap(this, p)) { p.hurt(1, this.cx, g, 'Tambor de resíduo! Pule por cima.'); }
    }
    draw(ctx, cam) {
      const x = this.sx(cam), y = this.sy(cam), band = Math.floor(this.rot) % 2;
      ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x - 6, y - 12, 12, 12);
      ctx.fillStyle = '#3a4656'; ctx.fillRect(x - 6, y - 12 + (band ? 3 : 7), 12, 2);
      ctx.fillStyle = '#c8c040'; ctx.fillRect(x - 2, y - 8, 4, 4);
      ctx.fillStyle = '#1b1a24'; ctx.fillRect(x - 1, y - 7, 2, 2);
    }
  };
  A.define('descartador', {
    group: 'humano', name: 'Descartador clandestino', guide: 'descarteIrregular',
    desc: 'Despeja tambores de resíduo industrial perto de uma vereda.',
    resolve: 'Travar a rampa da caminhonete com sementes, escorregar com o jato d’água ou registrar provas com o drone.'
  }, class Descartador extends GC.Infrator {
    constructor(g, x, y, o) {
      super(g, x, y, Object.assign({ resolve: 3, x0: (x / 16) - 1, x1: (x / 16) + 2 }, o), 'descartador');
      this.vanX = x + 40; this.dumpT = 1.5; this.sight = 150; this.gearMsg = 'Rampa da caminhonete travada!'; this.surrenderLine = 'Eu só ia jogar aqui porque é escondido... Errei.'; this.leaveDir = 1; this.speed = 14;
    }
    patrolTick(dt, g) { this.tickDump(dt, g); }
    act(g) { this.tickDump(1, g); }
    tickDump(dt, g) {
      if (this.gearJammed) return;
      this.dumpT -= dt;
      if (this.dumpT <= 0) { this.dumpT = 2.4; g.addEntity(new GC.Ent.barril(g, this.vanX - 30, this.bottom - 14, { vx: -80 })); GC.Audio.play('clank'); this.pose = 'throw'; }
    }
    jamGear() {}
    hitbox() { return { x: this.x, y: this.y, w: this.vanX + 30 - this.x, h: this.h }; }
    drawGear(ctx, cam) {
      const anim = this.gearJammed ? 'jammed' : (this.dumpT > 1.9 ? 'dump' : 'idle');
      GC.Sheets.draw(ctx, 'van', anim, anim === 'dump' ? 2.4 - this.dumpT : this.t, this.vanX - 4 - cam.x, this.bottom - cam.y, false);
      return;
      const x = Math.round(this.vanX - cam.x), y = this.sy(cam);
      // caminhonete sem placa
      ctx.fillStyle = '#5a5e66'; ctx.fillRect(x - 24, y - 22, 40, 16); ctx.fillRect(x + 10, y - 30, 16, 24);
      ctx.fillStyle = '#7a7e86'; ctx.fillRect(x - 24, y - 22, 40, 2);
      ctx.fillStyle = '#2a3a4a'; ctx.fillRect(x + 14, y - 27, 9, 7);
      ctx.fillStyle = '#1b1a24'; ctx.beginPath(); ctx.arc(x - 14, y - 4, 5, 0, Math.PI * 2); ctx.arc(x + 16, y - 4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this.gearJammed ? '#5ec04a' : '#8a8e96'; ctx.fillRect(x - 32, y - 14, 10, 2); // rampa
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x + 21, y - 10, 5, 3); ctx.fillStyle = '#1b1a24'; ctx.fillRect(x + 22, y - 9, 3, 1); // placa coberta
    }
  });
})();
