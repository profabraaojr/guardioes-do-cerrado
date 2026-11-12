// Chefe: o COLOSSO, robô experimental de desmatamento do Projeto Horizonte (fictício).
// Visual de robótica, sem semelhança com maquinário agrícola.
// Cada guardião vence do seu jeito. Piatã: faz o robô bater na pedra (escudos caem),
// trava os núcleos com sementes e abafa o fogo com o Soco da Terra. Larinha: o drone
// desliga os escudos; o Feixe (ou o jato) trava os núcleos; o purificador apaga o fogo.
GC.Ent.boss = class Colosso extends GC.Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 112, h: 70 }, o));
    this.homeX = this.x;
    this.state = 'sleep'; this.st = 0; this.dir = -1; this.phase = 0;
    this.valves = [{ dx: 22, hp: 5 }, { dx: 52, hp: 5 }, { dx: 82, hp: 5 }].map((v) => Object.assign(v, { alive: true, flash: 0 }));
    this.hittable = true; this.scannable = true; this.scanned = 0;
    this.chain = null; this.stun = 0; this.oncaDone = false; this.flash = 0; this.treadT = 0;
    this.attacks = 0;
  }
  get alive() { return this.valves.filter((v) => v.alive).length; }
  valveBox(v) { return { x: this.x + v.dx - 10, y: this.y - 26, w: 20, h: 34 }; }
  hitbox() { return { x: this.x, y: this.y - 14, w: this.w, h: this.h + 14 }; }
  get shieldsDown() { return this.scanned > 0 || this.stun > 0; }

  wake(g) {
    this.state = 'intro'; this.st = 2.5;
    GC.Audio.play('engine');
    g.shake(4, 1);
  }

  hit(kind, d, g, proj) {
    if (this.state === 'sleep' || this.state === 'dead' || this.state === 'defeat') return false;
    for (const v of this.valves) {
      if (!v.alive || !GC.U.overlap(proj.box ? proj.box() : { x: proj.x - 2, y: proj.y - 2, w: 4, h: 4 }, this.valveBox(v))) continue;
      if (kind !== 'seed' && kind !== 'water') return false;
      if (!this.shieldsDown) {
        if (kind === 'seed' || Math.random() < 0.1) { GC.Audio.play('metal'); g.fx.sparks(proj.x, proj.y, 3); }
        if (!this.toldShield) { this.toldShield = true; g.say('larinha', g.player.char === 'larinha' ? 'Os núcleos têm escudo! Use o drone (Aliado) para desligar os escudos.' : 'Os núcleos têm escudo! Faz ele investir contra a pedra: na batida, os escudos caem.'); }
        return true;
      }
      // sementes travam; o jato provoca curto-circuito aos poucos
      if (kind === 'water') { v.hp -= 0.06; v.flash = 0.05; if (Math.random() < 0.1) g.fx.steam(proj.x, proj.y, 1); if (v.hp <= 0) this.valveDown(v, g); return true; }
      v.hp -= 1; v.flash = 0.1; g.hitStop = GC.CFG.HITSTOP_BOSS; // pausa curta de impacto
      GC.Audio.play('metal'); g.fx.sparks(proj.x, proj.y, 6);
      if (v.hp <= 0) this.valveDown(v, g);
      return true;
    }
    if (GC.U.overlap(proj.box ? proj.box() : { x: proj.x - 2, y: proj.y - 2, w: 4, h: 4 }, { x: this.x, y: this.y + 16, w: this.w, h: this.h - 16 })) {
      if (kind === 'seed') { GC.Audio.play('metal'); g.fx.sparks(proj.x, proj.y, 2); }
      return true;
    }
    return false;
  }

  valveDown(v, g) {
    v.alive = false;
    GC.Audio.play('neutralize'); GC.Audio.play('crash');
    g.fx.leaves(this.x + v.dx, this.y - 6, 18); g.fx.smoke(this.x + v.dx, this.y - 6, 8, true);
    g.shake(6, 0.5);
    this.state = 'stagger'; this.st = 1.6; this.chain = null;
    if (this.alive === 0) { this.state = 'defeat'; this.st = 4.5; g.bossDefeated(this); return; }
    if (this.alive === 1 && !this.oncaDone) { this.oncaDone = true; g.oncaArrives(this); }
  }

  update(dt, g) {
    if (this.state !== 'sleep' && this.state !== 'defeat') {
      const hp = this.valves.reduce((n, v) => n + Math.max(0, v.hp), 0);
      const labels = g.player.char === 'larinha' ? ['Derrube os escudos com o drone', 'Trave os núcleos com o Feixe', 'Último núcleo!'] : ['Faça o Colosso bater na pedra', 'Trave os núcleos com sementes', 'Último núcleo!'];
      g.bossBar = { name: 'Colosso', label: this.shieldsDown ? 'Escudos desligados: trave os núcleos!' : labels[3 - this.alive] || labels[0], value: hp / 15, step: 4 - this.alive, steps: 3 };
    } else if (this.state === 'defeat') g.bossBar = null;
    this.t += dt; this.flash -= dt; this.treadT += dt * Math.abs(this.vx || 0) / 30;
    this.scanned = Math.max(0, this.scanned - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.valves.forEach((v) => (v.flash -= dt));
    const A = g.level.arena, p = g.player;
    this.vx = 0;
    if (this.state === 'sleep') return;
    if (this.state === 'defeat') {
      this.st -= dt;
      if (Math.random() < 0.3) g.fx.sparks(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 2);
      if (Math.random() < 0.2) g.fx.leaves(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 1);
      return;
    }
    if (Math.random() < 0.1) g.fx.smoke(this.x + 22 + Math.random() * 60, this.y - 10, 1, true);
    if (this.stun > 0) { this.state = this.state === 'charge' ? 'idle' : this.state; return; }

    this.st -= dt;
    switch (this.state) {
      case 'intro':
        if (this.st <= 0) { this.state = 'idle'; this.st = 1.2; g.unlockGuide('desmatamento', true); }
        break;
      case 'stagger':
        if (this.st <= 0) { this.state = 'idle'; this.st = 0.8; }
        break;
      case 'idle':
        // volta lentamente para a posição de origem
        if (Math.abs(this.x - this.homeX) > 2) { this.vx = Math.sign(this.homeX - this.x) * 50; this.x += this.vx * dt; }
        if (this.st <= 0) this.pickAttack(g);
        break;
      case 'sweepWind':
        if (this.st <= 0) {
          this.state = 'sweep';
          this.chain = { x: this.x - 4, dir: -1, speed: 230 + (3 - this.alive) * 30 };
          GC.Audio.play('clank');
        }
        break;
      case 'sweep': {
        const c = this.chain;
        c.x += c.dir * c.speed * dt;
        if (Math.random() < 0.4) g.fx.dust(c.x, A.floor, 1);
        if (c.dir < 0 && c.x < A.x0 + 10) { c.dir = 1; GC.Audio.play('clank'); g.shake(2, 0.15); }
        if (c.dir > 0 && c.x > this.x - 4) { this.chain = null; this.state = 'idle'; this.st = 1.0; break; }
        const ball = { x: c.x - 10, y: A.floor - 14, w: 20, h: 14 };
        if (GC.U.overlap(ball, p)) p.hurt(1, c.x, g, 'Pule o cabo magnético!');
        break;
      }
      case 'flamesWind':
        if (this.st <= 0) {
          this.state = 'idle'; this.st = 1.6;
          const n = 2 + (3 - this.alive);
          for (let i = 0; i < n; i++) {
            const tx = A.x0 + 40 + Math.random() * (this.x - A.x0 - 60);
            const t = 1.1;
            g.addProjectile(new GC.Hazard(g, this.x + 52, this.y - 10, (tx - (this.x + 52)) / t, -330 + Math.random() * 40, 'fireball'));
          }
          GC.Audio.play('fireball');
        }
        break;
      case 'chargeWind':
        if (Math.random() < 0.5) g.fx.smoke(this.x + this.w - 10, this.bottom - 6, 1, true);
        if (this.st <= 0) { this.state = 'charge'; GC.Audio.play('engine'); }
        break;
      case 'charge':
        this.vx = -330;
        this.x += this.vx * dt;
        g.shake(1.5, 0.05);
        // derruba o que estiver na frente (fogo apagado pela poeira)
        if (this.x < A.x0 + 2) {
          this.x = A.x0 + 2; this.state = 'idle'; this.st = 0.6; this.stun = 3.6; // janela para travar os núcleos (sem drone, é a chance de Piatã)
          GC.Audio.play('crash'); g.shake(8, 0.6); g.fx.dust(this.x, this.bottom, 20);
          g.toast('O Colosso bateu e superaqueceu: os escudos caíram!');
        }
        break;
      case 'crash':
        if (Math.random() < 0.3) g.fx.steam(this.x + 20 + Math.random() * 70, this.y - 8, 1);
        if (this.st <= 0) { this.state = 'idle'; this.st = 0.6; }
        break;
      case 'drones':
        if (this.st <= 0) { this.state = 'idle'; this.st = 1.2; }
        break;
    }
    // contato com o corpo
    if (this.state !== 'intro' && GC.U.overlap({ x: this.x + 4, y: this.y + 8, w: this.w - 8, h: this.h - 8 }, p)) {
      p.hurt(1, this.cx, g, this.state === 'charge' ? 'Suba no paredão ou nos galhos para escapar da investida!' : null);
      if (this.state === 'charge' && p.state !== 'dead') p.vx = -260;
    }
  }

  get stunnedLabel() { return this.stun > 0; }

  pickAttack(g) {
    this.attacks++;
    const opts = ['sweep', 'flames', 'charge'];
    if (this.alive <= 2) opts.push('drones');
    let a = opts[Math.floor(Math.random() * opts.length)];
    if (this.attacks % 4 === 0) a = 'charge';
    if (a === this.lastAttack && Math.random() < 0.6) a = opts[(opts.indexOf(a) + 1) % opts.length];
    this.lastAttack = a;
    if (a === 'sweep') { this.state = 'sweepWind'; this.st = 0.9; GC.Audio.play('clank'); }
    if (a === 'flames') { this.state = 'flamesWind'; this.st = 0.8; }
    if (a === 'charge') { this.state = 'chargeWind'; this.st = 1.1; GC.Audio.play('engine'); }
    if (a === 'drones') {
      this.state = 'drones'; this.st = 1;
      const A = g.level.arena;
      const n = g.entities.filter((e) => e instanceof GC.Ent.sprayer && !e.dead).length;
      if (n < 2) for (let i = 0; i < 2 - n; i++) g.addEntity(new GC.Ent.sprayer(g, A.x0 + 60 + i * 200, A.floor - 100, { x0: A.tx0 + 2, x1: A.tx1 - 8 }));
    }
  }

  draw(ctx, cam, g) {
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), w = this.w, h = this.h;
    const A = g.level.arena;
    const shake = (this.state === 'chargeWind' || this.state === 'sweepWind') ? Math.round(Math.sin(this.t * 60)) : 0;
    const dead = this.state === 'defeat';
    const GL = dead ? '#4a4e58' : '#4ae0f0';           // linhas de energia
    // cabo magnético arrastado
    if (this.chain) {
      const c = this.chain, fy = Math.round(A.floor - cam.y);
      for (let cx = Math.round(c.x - cam.x); cx < x; cx += 5) { ctx.fillStyle = (cx / 5) % 2 ? '#3a3e4a' : '#5a606e'; ctx.fillRect(cx, fy - 4, 5, 3); }
      ctx.fillStyle = 'rgba(74,224,240,0.6)'; ctx.fillRect(Math.round(c.x - cam.x), fy - 3, x - Math.round(c.x - cam.x), 1);
      const bx = Math.round(c.x - cam.x);
      ctx.fillStyle = '#22252e'; ctx.beginPath(); ctx.arc(bx, fy - 8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4ae0f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, fy - 8, 5 + Math.sin(this.t * 20), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.save(); ctx.translate(shake, 0);
    // quatro patas hidráulicas
    const walking = this.state === 'charge' || Math.abs(this.vx || 0) > 1;
    for (let i = 0; i < 4; i++) {
      const lx = x + 8 + i * 26, lift = walking ? Math.round(Math.max(0, Math.sin(this.t * 14 + i * 1.6)) * 4) : 0;
      ctx.fillStyle = '#2a2d36'; ctx.fillRect(lx, y + h - 22, 10, 18 - lift);
      ctx.fillStyle = '#5a606e'; ctx.fillRect(lx + 2, y + h - 22, 3, 14 - lift);
      ctx.fillStyle = '#e8743a'; ctx.fillRect(lx + 2, y + h - 14 - lift, 6, 3);
      ctx.fillStyle = '#1a1c22'; ctx.fillRect(lx - 2, y + h - 4 - lift, 14, 4);
    }
    // corpo blindado
    const body = dead ? '#55585e' : (this.flash > 0 ? '#fff' : '#3a3e4a');
    ctx.fillStyle = '#22252e'; ctx.fillRect(x + 2, y + 12, w - 4, h - 32);
    ctx.fillStyle = body; ctx.fillRect(x + 4, y + 13, w - 8, h - 35);
    ctx.fillStyle = dead ? '#6a6e74' : '#5a606e'; ctx.fillRect(x + 4, y + 13, w - 8, 3);
    ctx.fillStyle = GL; ctx.fillRect(x + 10, y + 30, w - 20, 1); ctx.fillRect(x + 10, y + 30, 1, 10); ctx.fillRect(x + w - 11, y + 24, 1, 7);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = dead ? '#3a3a3e' : '#e8743a'; ctx.fillRect(x + 14 + i * 18, y + h - 27, 8, 2); }
    // cabeça-sensor em cúpula (sem cabine de operador)
    ctx.fillStyle = '#22252e'; ctx.beginPath(); ctx.arc(x + 82, y + 13, 15, Math.PI, 0); ctx.fill();
    ctx.fillStyle = dead ? '#55585e' : '#4a4e5a'; ctx.beginPath(); ctx.arc(x + 82, y + 13, 13, Math.PI, 0); ctx.fill();
    const eyeX = x + 76 + Math.round(Math.sin(this.t * 2) * 5);
    ctx.fillStyle = '#16181e'; ctx.fillRect(x + 70, y + 4, 24, 6);
    ctx.fillStyle = dead ? '#3a3a3e' : (this.shieldsDown ? '#ffb030' : '#ff3a2a'); ctx.fillRect(eyeX, y + 5, 8, 4);
    if (!dead) { ctx.fillStyle = 'rgba(255,80,50,0.25)'; ctx.fillRect(eyeX - 3, y + 4, 14, 6); }
    // garra frontal
    ctx.fillStyle = '#2a2d36'; ctx.fillRect(x - 10, y + 24, 16, 6); ctx.fillRect(x - 14, y + 20, 6, 22);
    ctx.fillStyle = '#5a606e'; ctx.fillRect(x - 14, y + 20, 2, 22); ctx.fillRect(x - 18, y + 20, 6, 3); ctx.fillRect(x - 18, y + 39, 6, 3);
    // emblema do Projeto Horizonte
    if (!dead) { ctx.fillStyle = '#16181e'; ctx.fillRect(x + 22, y + 18, 26, 14); GC.Art.logo(ctx, x + 31, y + 22, 2); }
    // núcleos de energia (pontos frágeis)
    for (const v of this.valves) {
      const vx = x + v.dx;
      ctx.fillStyle = '#22252e'; ctx.fillRect(vx - 6, y + 2, 12, 12);
      if (v.alive) {
        const glow = this.shieldsDown;
        ctx.fillStyle = v.flash > 0 ? '#fff' : (glow ? '#ffb030' : '#c86020'); ctx.fillRect(vx - 4, y - 8, 8, 10);
        ctx.fillStyle = '#ffe080'; ctx.fillRect(vx - 2, y - 6, 3, 3);
        ctx.fillStyle = GL; ctx.fillRect(vx - 5, y + 1, 10, 1);
        if (!this.shieldsDown) { ctx.strokeStyle = 'rgba(140,220,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(vx, y - 3, 9, Math.PI, 0); ctx.stroke(); ctx.fillStyle = 'rgba(140,220,255,0.18)'; ctx.fill(); }
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(vx - 6, y - 16, 12, 2);
        ctx.fillStyle = '#ffd040'; ctx.fillRect(vx - 6, y - 16, Math.round(12 * v.hp / 5), 2);
      } else {
        GC.Art.overgrown(ctx, vx, y + 2, 12, 10, this.t);
        ctx.fillStyle = '#f2c230'; ctx.fillRect(vx - 1, y - 10, 3, 3); ctx.fillStyle = '#3e8a34'; ctx.fillRect(vx, y - 7, 1, 7);
      }
    }
    if (this.scanned > 0) { ctx.strokeStyle = 'rgba(106,232,200,0.75)'; ctx.setLineDash([3, 3]); ctx.strokeRect(x - 18.5, y - 18.5, w + 28, h + 20); ctx.setLineDash([]); }
    if (dead) GC.Art.overgrown(ctx, x + w / 2, y + h, w - 10, Math.round(h * (1 - this.st / 4.5) * 0.8), this.t);
    ctx.restore();
  }
};
