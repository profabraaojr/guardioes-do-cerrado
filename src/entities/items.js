// Objetos interativos do cenário: placas, marcos de trilha, coletáveis,
// gaiola, arbustos plantados, cipós, plantas observáveis e dispositivos
// do Projeto Horizonte (terminais, alavancas, barreiras e comportas).
GC.Ent = GC.Ent || {};

class Thing {
  constructor(g, x, y, o = {}) {
    this.g = g; this.o = o; this.id = o.id || null;
    this.w = o.w || 12; this.h = o.h || 16;
    this.x = x + 8 - this.w / 2; this.y = y - this.h;
    this.dead = false; this.t = Math.random() * 10;
  }
  get cx() { return this.x + this.w / 2; }
  get bottom() { return this.y + this.h; }
  update(dt) { this.t += dt; }
  draw() {}
  sx(cam) { return Math.round(this.cx - cam.x); }
  sy(cam) { return Math.round(this.bottom - cam.y); }
}
GC.Thing = Thing;

GC.Ent.sign = class Sign extends Thing {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 18, h: 24 }, o)); this.read = false; this.interactable = true; this.prompt = 'Ler'; }
  interact(g) {
    this.read = true;
    if (this.o.guide) g.unlockGuide(this.o.guide, true);
    g.showSign(this.o.title || 'Placa', this.o.text);
  }
  draw(ctx, cam) { GC.Art.sign(ctx, this.sx(cam), this.sy(cam), this.read); }
};

GC.Ent.checkpoint = class Checkpoint extends Thing {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 14, h: 28 }, o)); this.on = false; }
  update(dt, g) {
    super.update(dt);
    const cp = g.save.checkpoint;
    this.on = !!(cp && cp.id === this.id);
    if (!this.on && GC.U.overlap(this, g.player) && g.player.state !== 'dead') g.activateCheckpoint(this);
  }
  draw(ctx, cam) { GC.Art.checkpoint(ctx, this.sx(cam), this.sy(cam), this.on, this.t); }
};

GC.Ent.pickup = class Pickup extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 10, h: 12 }, o));
    this.kind = o.kind || 'seed';
    this.y -= o.lift || 0;
    if (this.id && g.save.collected.includes(this.id)) this.dead = true;
  }
  update(dt, g) {
    super.update(dt);
    if (g.player.state === 'dead' || !GC.U.overlap(this, g.player)) return;
    if (this.kind === 'fruit' && g.hearts >= g.save.maxHearts) return;
    this.dead = true;
    if (this.id) g.save.collected.push(this.id);
    g.collect(this);
  }
  draw(ctx, cam) {
    GC.Sheets.draw(ctx, 'itens', this.kind, this.t, this.cx - cam.x, this.bottom - cam.y + 1, false);
  }
};

// Gaiola de traficantes: a arara-canindé passa a acompanhar a dupla
GC.Ent.cage = class Cage extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 18, h: 24 }, o));
    this.open = !!g.save.allies.arara; this.interactable = !this.open; this.prompt = 'Libertar';
  }
  interact(g) {
    if (this.open) return;
    const guard = g.entities.find((e) => e instanceof GC.Ent.traficante && e.active);
    if (guard) { GC.Audio.play('deny'); g.toast('O traficante está vigiando a gaiola. Contenha-o sem violência primeiro.'); return; }
    this.open = true; this.interactable = false;
    GC.Audio.play('open'); GC.Audio.play('arara');
    g.fx.leaves(this.cx, this.y + 8, 10);
    g.save.allies.arara = true;
    g.save.stats.rescued++;
    g.spawnArara(this.cx, this.y + 10);
    g.unlockGuide('arara', true);
    g.dialog('arara');
  }
  draw(ctx, cam) {
    const x = this.sx(cam), y = this.sy(cam);
    if (!this.open) GC.Art.arara(ctx, x, y - 4, 1, this.t, false);
    GC.Art.cage(ctx, x, y, this.open, this.t);
  }
};

// Estação de reabastecimento de água (posto de brigada)
GC.Ent.station = class Station extends Thing {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 22, h: 30 }, o)); this.interactable = true; this.prompt = 'Reabastecer'; }
  interact(g) {
    g.water = GC.CFG.WATER_TANK; g.hearts = g.save.maxHearts;
    GC.Audio.play('heart');
    g.toast('Posto de brigada: água e vitalidade restauradas.');
    g.fx.splash(this.cx, this.y + 10);
  }
  draw(ctx, cam) {
    const x = this.sx(cam), y = this.sy(cam);
    ctx.fillStyle = '#7a3a24'; ctx.fillRect(x - 11, y - 22, 22, 22);
    ctx.fillStyle = '#c84a2a'; ctx.fillRect(x - 11, y - 22, 22, 4);
    ctx.fillStyle = '#f4e0b0'; ctx.fillRect(x - 7, y - 15, 14, 8);
    ctx.fillStyle = '#c84a2a'; ctx.fillRect(x - 5, y - 13, 10, 1); ctx.fillRect(x - 5, y - 10, 7, 1);
    ctx.fillStyle = '#3a5a8a'; ctx.fillRect(x + 6, y - 30, 6, 10); ctx.fillStyle = '#6ab0e8'; ctx.fillRect(x + 7, y - 29, 2, 8);
  }
};

// Arbusto plantado: vira plataforma de mão única
GC.Ent.bush = class Bush extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 16, h: 32 }, o));
    this.tx = o.tx; this.ty = o.ty; this.grow = 0;
    GC.Audio.play('grow');
  }
  update(dt, g) {
    super.update(dt);
    if (this.grow < 1) {
      this.grow = Math.min(1, this.grow + dt * 1.8);
      if (this.grow >= 1) { g.level.set(this.tx, this.ty - 2, GC.T.BUSH); g.fx.leaves(this.cx, this.y + 4, 8); }
    }
  }
  draw(ctx, cam) {
    const x = this.sx(cam), y = this.sy(cam);
    const h = Math.round(32 * GC.U.ease(this.grow));
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 1, y - h, 3, h);
    if (this.grow > 0.4) {
      const k = (this.grow - 0.4) / 0.6;
      const top = y - h;
      ctx.fillStyle = '#2e6e2a'; ctx.fillRect(Math.round(x - 12 * k), top, Math.round(24 * k), 6);
      ctx.fillStyle = '#4ea03c'; ctx.fillRect(Math.round(x - 11 * k), top - 2, Math.round(22 * k), 4);
      ctx.fillStyle = '#7ccc56'; ctx.fillRect(Math.round(x - 9 * k), top - 2, Math.round(18 * k), 1);
      if (k > 0.9) { ctx.fillStyle = '#f2c230'; ctx.fillRect(x - 6, top - 3, 2, 2); ctx.fillRect(x + 5, top - 3, 2, 2); }
    }
  }
};

// Cipó pendular
GC.Ent.cipo = class Cipo extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 8, h: 8 }, o));
    this.ax = x + 8; this.ay = y; this.len = o.len || 100;
    this.ang = 0.7; this.av = 0; this.holder = null; this.cool = 0;
    g.cipos.push(this);
  }
  tip() { return { x: this.ax + Math.sin(this.ang) * this.len, y: this.ay + Math.cos(this.ang) * this.len }; }
  canGrab(p) {
    if (this.cool > 0 || this.holder) return false;
    const t = this.tip();
    return Math.abs(p.cx - t.x) < 16 && t.y > p.y - 20 && t.y < p.y + p.h + 6;
  }
  attach(p) {
    this.holder = p;
    const t = this.tip();
    // converte a velocidade horizontal do jogador em velocidade angular
    this.av = GC.U.clamp(p.vx / this.len, -2.2, 2.2);
  }
  pump(dir, dt) { if (Math.sign(this.av) === dir || Math.abs(this.av) < 0.3) this.av += dir * 2.6 * dt; }
  release() {
    const v = { x: this.av * this.len * Math.cos(this.ang), y: -this.av * this.len * Math.sin(this.ang) };
    this.holder = null; this.cool = 0.4;
    return v;
  }
  update(dt) {
    super.update(dt);
    this.cool -= dt;
    const g = 1500 / this.len;
    this.av += -g * Math.sin(this.ang) * dt;
    this.av *= this.holder ? 0.999 : 0.9995;
    if (!this.holder && Math.abs(this.ang) < 0.15 && Math.abs(this.av) < 1.6) this.av = Math.sign(this.av || 1) * 1.6; // balanço contínuo
    this.ang = GC.U.clamp(this.ang + this.av * dt, -1.25, 1.25);
  }
  draw(ctx, cam) {
    const t = this.tip();
    const ax = this.ax - cam.x, ay = this.ay - cam.y;
    ctx.fillStyle = '#3e6e2a';
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      const px = ax + (t.x - this.ax) * k + Math.sin(k * Math.PI) * 3, py = ay + (t.y - this.ay) * k;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 3);
      if (i % 4 === 2) { ctx.fillStyle = '#6ab84a'; ctx.fillRect(Math.round(px) + 2, Math.round(py), 3, 2); ctx.fillStyle = '#3e6e2a'; }
    }
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(Math.round(ax) - 10, Math.round(ay) - 3, 20, 4);
  }
};

// Plantas, cupinzeiros e painéis rupestres observáveis
GC.Ent.plant = class Plant extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 16, h: 40 }, o));
    this.kind = o.kind; this.observe = o.guide || o.kind;
  }
  draw(ctx, cam) { GC.Art.plant(ctx, this.kind, this.sx(cam), this.sy(cam), this.t); }
};

// Cupinzeiro que o tamanduá pode abrir (somente Piatã sabe chamá-lo)
GC.Ent.moundSpot = class MoundSpot extends Thing {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 40, h: 40 }, o)); this.interactable = true; this.prompt = 'Chamar tamanduá'; this.tiles = o.tiles; }
  interact(g) {
    if (!g.save.allies.tamandua) { g.toast('Observe o tamanduá-bandeira que passeia por aqui antes.'); GC.Audio.play('deny'); return; }
    if (g.player.char !== 'piata') g.say('piata', 'Isso! Ele confia em você. Fica quietinha que ele mesmo abre a toca.');
    this.interactable = false;
    g.tamanduaDig(this);
  }
};

// ——— Dispositivos do Projeto Horizonte ———
GC.Ent.terminal = class Terminal extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 14, h: 22 }, o));
    this.interactable = true; this.prompt = 'Acessar terminal'; this.done = !!(o.flag && g.save.flags[o.flag]);
    if (this.done) this.interactable = false;
  }
  interact(g) {
    if (this.done) return;
    if (g.player.char !== 'larinha') { g.say('piata', 'Cheio de fios e senhas. Do meu jeito: Soco da Terra no gerador (Poder).'); return; }
    if (this.o.needs && !g.save.flags[this.o.needs]) { g.say('larinha', this.o.needsMsg || 'O sistema está sem energia. Falta liberar outra trava.'); return; }
    this.done = true; this.interactable = false;
    GC.Audio.play('open');
    if (this.o.flag) g.save.flags[this.o.flag] = true;
    g.trigger(this.o.opens);
    if (this.o.say) g.say('larinha', this.o.say);
  }
  // Piatã não tem a senha: o Soco da Terra derruba o gerador do equipamento ilegal
  force(g) {
    if (this.done) return false;
    if (this.o.needs && !g.save.flags[this.o.needs]) { g.say('piata', this.o.needsMsgPiata || 'Ainda tem outra trava segurando. Primeiro ela.'); return true; }
    this.done = true; this.interactable = false; this.broken = true;
    GC.Audio.play('crash'); g.fx.sparks(this.cx, this.y + 6, 16); g.fx.smoke(this.cx, this.y, 4, true);
    if (this.o.flag) g.save.flags[this.o.flag] = true;
    g.trigger(this.o.opens);
    g.say('piata', this.o.forceSay || 'Gerador fora do ar!');
    return true;
  }
  draw(ctx, cam) {
    const x = this.sx(cam), y = this.sy(cam);
    ctx.fillStyle = '#3a3e48'; ctx.fillRect(x - 6, y - 22, 12, 22);
    ctx.fillStyle = '#22262e'; ctx.fillRect(x - 4, y - 19, 8, 7);
    ctx.fillStyle = this.done ? '#5ec04a' : (Math.floor(this.t * 3) % 2 ? '#ff5a3a' : '#a83a2a'); ctx.fillRect(x - 3, y - 18, 6, 5);
    ctx.fillStyle = '#8a8e96'; ctx.fillRect(x - 4, y - 9, 8, 1); ctx.fillRect(x - 4, y - 7, 8, 1);
    GC.Art.logo(ctx, x - 3, y - 27);
  }
};

GC.Ent.lever = class Lever extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 12, h: 16 }, o));
    this.on = !!(o.flag && g.save.flags[o.flag]); this.interactable = !this.on; this.prompt = 'Puxar alavanca';
  }
  interact(g) {
    if (this.on) return;
    this.on = true; this.interactable = false;
    GC.Audio.play('clank');
    if (this.o.flag) g.save.flags[this.o.flag] = true;
    g.trigger(this.o.opens);
    if (this.o.say) g.say(g.player.char, this.o.say);
  }
  // Larinha alcança a alavanca alta com a garra do drone
  pullByDrone(g) { if (this.on) return; this.interact(g); g.fx.ring(this.cx, this.y, '#6ae8c8'); }
  draw(ctx, cam) {
    const x = this.sx(cam), y = this.sy(cam);
    ctx.fillStyle = '#4a4e56'; ctx.fillRect(x - 6, y - 5, 12, 5);
    ctx.fillStyle = '#8a8e96';
    const a = this.on ? 0.7 : -0.7;
    for (let i = 0; i < 12; i++) ctx.fillRect(Math.round(x + Math.sin(a) * i), Math.round(y - 5 - Math.cos(a) * i), 2, 1);
    ctx.fillStyle = this.on ? '#5ec04a' : '#e8501e'; ctx.fillRect(Math.round(x + Math.sin(a) * 12) - 1, Math.round(y - 5 - Math.cos(a) * 12) - 1, 4, 4);
  }
};

// Barreira/comporta: ocupa tiles sólidos até ser aberta
GC.Ent.gate = class Gate extends Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 16, h: (o.rows || 4) * 16 }, o));
    this.tx = Math.floor(x / 16); this.ty0 = Math.floor(y / 16) - (o.rows || 4); this.rows = o.rows || 4;
    this.open = !!(o.flag && g.save.flags[o.flag]); this.k = this.open ? 1 : 0;
    this.kind = o.kind || 'fence';
    this.apply(g);
    g.gates[o.name] = this;
  }
  apply(g) { for (let r = 0; r < this.rows; r++) g.level.set(this.tx, this.ty0 + r, this.open ? GC.T.EMPTY : GC.T.GATE); }
  openUp(g) {
    if (this.open) return;
    this.open = true; this.apply(g);
    if (this.o.flag) g.save.flags[this.o.flag] = true;
    GC.Audio.play('engine'); g.shake(3, 0.4);
    g.fx.sparks(this.cx, this.y + this.h / 2, 16);
  }
  close(g) { this.open = false; this.k = 0; this.apply(g); GC.Audio.play('crash'); g.shake(5, 0.4); }
  update(dt, g) { super.update(dt); this.k = GC.U.approach(this.k, this.open ? 1 : 0, dt * 1.5); }
  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    const off = Math.round(this.h * this.k);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - 4, 24, this.h + 4); ctx.clip();
    if (this.kind === 'fence') {
      ctx.fillStyle = '#5a5e66'; ctx.fillRect(x + 2, y + off, 3, this.h); ctx.fillRect(x + 11, y + off, 3, this.h);
      for (let i = 0; i < this.h; i += 6) { ctx.fillStyle = this.open ? '#6a6e76' : (Math.floor(this.t * 8 + i) % 3 ? '#8ae8ff' : '#e0f8ff'); ctx.fillRect(x + 5, y + off + i, 6, 1); }
    } else {
      ctx.fillStyle = '#4a4e56'; ctx.fillRect(x, y + off, 16, this.h);
      ctx.fillStyle = '#c8a030'; for (let i = 0; i < this.h; i += 12) ctx.fillRect(x, y + off + i, 16, 4);
      ctx.fillStyle = '#2a2e36'; for (let i = 6; i < this.h; i += 12) ctx.fillRect(x, y + off + i, 16, 2);
    }
    ctx.restore();
    if (!this.open) GC.Art.logo(ctx, x + 5, y - 7);
  }
};

// Personagem de apoio: conversa ao interagir
GC.Ent.npc = class Npc extends Thing {
  constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 14, h: 26 }, o)); this.interactable = true; this.prompt = 'Conversar'; this.dir = o.dir || -1; }
  interact(g) {
    const first = !g.save.flags['dlg_' + this.o.dialog];
    g.dialog(this.o.dialog, () => { (this.o.guides || []).forEach((k) => g.unlockGuide(k, false)); });
    if (!first) g.say(this.o.who, this.o.repeat || 'Boa trilha, meninos!');
    this.dir = g.player.cx < this.cx ? -1 : 1;
  }
  draw(ctx, cam) { GC.Art.villager(ctx, this.sx(cam), this.sy(cam), this.dir, this.t, this.o.look || 'cida'); }
};
