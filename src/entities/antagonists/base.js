// Sistema de antagonistas: registro modular e classes-base.
//
// Três grupos:
//   'humano'   infratores em atividades criminosas específicas (garimpo ilegal, caça,
//              tráfico, descarte clandestino). Nunca recebem dano: são contidos.
//   'criatura' seres fictícios afetados pela contaminação. Sempre podem se recuperar.
//   'maquina'  robôs e equipamentos descontrolados do Projeto Horizonte. São desativados.
//
// Diretrizes fixas: o setor agropecuário e suas atividades legítimas nunca são
// antagonistas; animais silvestres nunca são inimigos.
//
// Para criar um antagonista novo:
//   GC.Antagonists.define('id', { group, name, desc, resolve }, Classe)
// e usar B.ent('id', x, y, opções) na fase. Nada no núcleo precisa mudar.
GC.Antagonists = (function () {
  const list = {};
  return {
    list,
    define(id, meta, K) {
      list[id] = Object.assign({ id }, meta);
      K.prototype.meta = list[id];
      GC.Ent[id] = K;
      return K;
    },
    byGroup(g) { return Object.values(list).filter((m) => m.group === g); }
  };
})();

// ——— Humano infrator ———
// Resistência (resolve) cai com ações não letais:
//   jato d'água: escorrega e fica atordoado
//   sementes: travam o equipamento ilegal (uma vez)
//   drone de análise: registra provas (uma vez por varredura)
// Ao zerar, rende-se, a polícia ambiental é acionada e ele deixa a área.
GC.Infrator = class Infrator extends GC.Thing {
  constructor(g, x, y, o, look) {
    super(g, x, y, Object.assign({ w: 12, h: 26 }, o));
    this.look = look;
    this.resolveMax = o.resolve || 3; this.resolve = this.resolveMax;
    this.x0 = o.x0 !== undefined ? o.x0 * 16 : this.x - 48; this.x1 = o.x1 !== undefined ? (o.x1 + 1) * 16 : this.x + 60;
    this.dir = -1; this.state = 'patrol'; this.st = 0; this.stun = 0; this.wetT = 0;
    this.hittable = true; this.wettable = true; this.scannable = true; this.scanned = 0; this.evidence = false;
    this.gearJammed = false; this.pose = 'walk'; this.cool = 1.5; this.alpha = 1; this.flash = 0;
    this.speed = o.speed || 26;
  }
  get active() { return !['surrender', 'leaving', 'gone'].includes(this.state); }
  sees(p) { return p.state !== 'dead' && Math.abs(p.cx - this.cx) < (this.sight || 120) && Math.abs(p.bottom - this.bottom) < 40 && Math.sign(p.cx - this.cx) === this.dir; }
  lose(n, g, why) {
    if (!this.active) return;
    this.resolve -= n; this.flash = 0.12;
    if (why) g.toast(why);
    if (this.resolve <= 0) this.surrender(g);
  }
  hit(kind, d, g, proj) {
    if (!this.active) return false;
    if (kind === 'seed') {
      if (!this.gearJammed && this.jamGear) { this.gearJammed = true; GC.Audio.play('metal'); g.fx.sparks(proj.x, proj.y, 5); this.jamGear(g); this.lose(1.5, g, this.gearMsg); }
      else { g.fx.burst(proj.x, proj.y, '#a8702e', 3); if (!this.toldSeed) { this.toldSeed = true; g.say(g.player.char, 'Sementes não são para pessoas. Melhor travar o equipamento ou chamar a fiscalização.'); } }
      return true;
    }
    if (kind === 'water') {
      this.wetT += 0.06;
      if (this.wetT > 0.6 && this.stun <= 0) { this.wetT = 0; this.stun = 1.8; this.state = 'stunned'; GC.Audio.play('splash'); g.fx.splashSmall(this.cx, this.bottom - 4); this.lose(1, g, null); this.onSlip && this.onSlip(g); }
      return true;
    }
    return false;
  }
  surrender(g) {
    this.state = 'surrender'; this.st = 1.8; this.pose = 'hands';
    this.hittable = false; this.wettable = false;
    GC.Audio.play('neutralize');
    g.save.stats.contained = (g.save.stats.contained || 0) + 1;
    if (this.meta.guide) g.unlockGuide(this.meta.guide, false);
    if (this.surrenderLine) g.say(this.look, this.surrenderLine);
    g.toast('Flagrante registrado. A polícia ambiental foi acionada.');
    this.onSurrender && this.onSurrender(g);
  }
  // comportamento comum: patrulha, alerta, ação própria (act) e atordoamento
  update(dt, g) {
    this.t += dt; this.flash -= dt; this.cool -= dt;
    if (this.scanned > 0 && !this.evidence && this.active) { this.evidence = true; g.fx.ring(this.cx, this.y + 10, '#6ae8c8'); this.lose(1, g, 'Drone: provas fotográficas registradas.'); }
    this.scanned = Math.max(0, this.scanned - dt);
    const p = g.player;
    switch (this.state) {
      case 'patrol':
        this.pose = 'walk';
        this.x += this.dir * this.speed * dt;
        if (this.x < this.x0) { this.x = this.x0; this.dir = 1; }
        if (this.x + this.w > this.x1) { this.x = this.x1 - this.w; this.dir = -1; }
        if (this.sees(p)) { this.state = 'alert'; this.st = 0.5; GC.Audio.play('warn'); }
        this.patrolTick && this.patrolTick(dt, g);
        break;
      case 'alert':
        this.pose = 'alert'; this.st -= dt; this.dir = p.cx < this.cx ? -1 : 1;
        if (this.st <= 0) { if (this.cool <= 0 && !this.gearJammed && this.act) { this.act(g); this.cool = this.actCool || 2.4; } this.state = this.sees(p) ? 'alert' : 'patrol'; this.st = 0.6; }
        break;
      case 'stunned':
        this.pose = 'slip'; this.stun -= dt;
        if (this.stun <= 0 && this.active) { this.state = 'patrol'; }
        break;
      case 'surrender':
        this.pose = 'hands'; this.st -= dt;
        if (this.st <= 0) { this.state = 'leaving'; this.dir = this.leaveDir || 1; }
        break;
      case 'leaving':
        this.pose = 'run'; this.x += this.dir * 90 * dt; this.alpha = Math.max(0, this.alpha - dt * 0.5);
        if (this.alpha <= 0) { this.state = 'gone'; this.dead = true; }
        break;
    }
    // empurrão (sem dano) ao encostar
    if (this.active && this.state !== 'stunned' && GC.U.overlap(this, p) && p.invuln <= 0 && p.state !== 'dead') {
      p.vx = (p.cx < this.cx ? -1 : 1) * 200; p.vy = -150; p.invuln = 0.4;
      if (p.state === 'climb' || p.state === 'vine') p.state = 'normal';
    }
  }
  drawResolve(ctx, cam) {
    if (!this.active || this.resolve >= this.resolveMax) return;
    const x = Math.round(this.cx - cam.x), y = Math.round(this.y - cam.y) - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 10, y, 20, 3);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(x - 9, y + 1, Math.round(18 * Math.max(0, this.resolve) / this.resolveMax), 1);
  }
  draw(ctx, cam) {
    ctx.globalAlpha = this.alpha;
    GC.Art.human(ctx, this.sx(cam), this.sy(cam), this.dir, this.t, this.look, this.pose, this.flash > 0);
    ctx.globalAlpha = 1;
    this.drawGear && this.drawGear(ctx, cam);
    this.drawResolve(ctx, cam);
  }
};

// ——— Criatura contaminada ———
// Recupera-se quando a contaminação é removida (onRecover cria a forma saudável).
GC.Criatura = class Criatura extends GC.Thing {
  constructor(g, x, y, o) {
    super(g, x, y, o);
    this.taint = o.taint || 1; this.hittable = true; this.wettable = true; this.flash = 0;
  }
  cleanse(n, g) {
    if (this.dead) return;
    this.taint -= n; this.flash = 0.06;
    if (this.taint <= 0) {
      this.dead = true; GC.Audio.play('grow');
      g.save.stats.recovered = (g.save.stats.recovered || 0) + 1;
      if (this.meta && this.meta.guide) g.unlockGuide(this.meta.guide, false);
      this.onRecover && this.onRecover(g);
    }
  }
  hurtOnTouch(g, msg, box) {
    const p = g.player;
    if (!this.dead && p.state !== 'dead' && GC.U.overlap(box || this, p)) p.hurt(1, this.cx, g, msg);
  }
};

// ——— Chefe ———
// Cada chefe declara fases [{ id, label, ... }] e informa o progresso à barra de chefe.
GC.BossBase = class BossBase extends GC.Thing {
  constructor(g, x, y, o, w, h) {
    super(g, x, y, Object.assign({ w, h }, o));
    this.phaseIdx = -1; this.started = false; this.finished = false;
  }
  get phase() { return this.phases[this.phaseIdx]; }
  setPhase(i, g) {
    this.phaseIdx = i; this.pt = 0;
    const P = this.phase;
    if (P && P.enter) P.enter.call(this, g);
  }
  bar(g, value) { g.bossBar = { name: this.bossName, label: this.phase ? this.phase.label : '', value: Math.max(0, Math.min(1, value)), step: this.phaseIdx + 1, steps: this.phases.length }; }
  finish(g) { this.finished = true; g.bossBar = null; }
};
