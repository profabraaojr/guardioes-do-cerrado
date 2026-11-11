// Chefe da Cidade de Pedra: DRAGA CLANDESTINA do garimpo ilegal, operada por um garimpeiro.
// Mecânica própria, em três etapas cooperativas:
//   1. Mangueiras: Piatã trava com sementes as duas mangueiras de sucção.
//   2. Vapor de mercúrio: a draga superaquece; Larinha dispersa a nuvem tóxica com o purificador.
//   3. Painel: com o vapor dissipado, Larinha desliga a draga no painel de controle.
// O garimpeiro se rende; o lodo da caverna é purificado; a passagem se abre.
(function () {
  const U = GC.U;

  GC.Ent.mangueira = class Mangueira extends GC.Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 14, h: 12 }, o)); this.hp = 4; this.hittable = true; this.flash = 0; this.boss = o.boss; }
    get jammed() { return this.hp <= 0; }
    hit(kind, d, g, proj) {
      if (kind !== 'seed' || this.jammed) return false;
      this.hp--; this.flash = 0.1; GC.Audio.play('metal'); g.fx.sparks(proj.x, proj.y, 4);
      if (this.jammed) { GC.Audio.play('neutralize'); g.fx.leaves(this.cx, this.y, 10); g.toast('Mangueira travada!'); }
      return true;
    }
    update(dt, g) {
      this.t += dt; this.flash -= dt;
      // sucção: puxa quem estiver perto enquanto funciona
      const p = g.player;
      if (!this.jammed && this.boss && this.boss.phaseIdx === 0 && Math.abs(p.cx - this.cx) < 70 && Math.abs(p.bottom - this.bottom) < 30 && p.state === 'normal') {
        p.x += Math.sign(this.cx - p.cx) * 26 * dt;
        if (Math.random() < 0.3) g.fx.dust(this.cx + (Math.random() - 0.5) * 60, this.bottom, 1);
      }
    }
    draw(ctx, cam) {
      const x = this.sx(cam), y = this.sy(cam), bx = Math.round(this.boss.x - cam.x) + 8;
      ctx.fillStyle = '#3a3a2a';
      for (let i = x; i < bx; i += 3) ctx.fillRect(i, y - 5 + Math.round(Math.sin(i * 0.2 + this.t * (this.jammed ? 0 : 8)) * 1), 3, 4);
      ctx.fillStyle = this.flash > 0 ? '#fff' : (this.jammed ? '#5a5e66' : '#8a7a4a'); ctx.fillRect(x - 7, y - 10, 14, 10);
      ctx.fillStyle = '#1b1a24'; ctx.fillRect(x - 5, y - 8, 10, 6);
      if (this.jammed) { ctx.fillStyle = '#5ec04a'; ctx.fillRect(x - 5, y - 12, 10, 3); ctx.fillStyle = '#f2c230'; ctx.fillRect(x - 2, y - 13, 2, 2); }
      else { ctx.fillStyle = 'rgba(120,100,60,0.6)'; ctx.fillRect(x - 4 + Math.round(Math.sin(this.t * 20) * 2), y - 7, 3, 3); }
      if (!this.jammed) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 7, y - 16, 14, 2); ctx.fillStyle = '#ffd040'; ctx.fillRect(x - 7, y - 16, Math.round(14 * this.hp / 4), 2); }
    }
  };

  GC.Antagonists.define('draga', {
    group: 'maquina', name: 'Draga clandestina', boss: true, guide: 'garimpoIlegal',
    desc: 'Draga de garimpo ilegal escondida na caverna, que lança lama com mercúrio e libera vapor tóxico.',
    resolve: 'Travar as mangueiras (Piatã), dispersar o vapor e desligar o painel (Larinha).'
  }, class Draga extends GC.BossBase {
    constructor(g, x, y, o) {
      super(g, x, y, o, 72, 46);
      this.bossName = 'Draga clandestina';
      this.vapor = 0; this.panelOpen = false; this.cool = 2; this.spawnT = 5; this.operator = { pose: 'alert', t: 0 };
      this.hoses = [];
      this.phases = [
        { id: 'hoses', label: 'Trave as mangueiras', enter() {} },
        { id: 'vapor', label: 'Disperse o vapor de mercúrio', enter(g) { this.vapor = 1; GC.Audio.play('engine'); g.say('larinha', 'Vapor de mercúrio! Troque para mim: o jato d’água condensa a nuvem.'); } },
        { id: 'panel', label: 'Desligue o painel da draga', enter(g) { this.panelOpen = true; this.interactable = true; g.say('larinha', 'O painel ficou acessível. Deixa comigo!'); } }
      ];
      this.prompt = 'Desligar a draga';
      this.gate = o.gate;
      if (o.gate && g.save.flags[o.gate]) { this.started = true; this.finished = true; this.state = 'off'; this.operator.gone = 9; }
    }
    start(g) {
      this.started = true;
      for (const dx of o_hoses) this.hoses.push(g.addEntity(new GC.Ent.mangueira(g, this.x + dx, this.bottom, { boss: this })));
      g.dialog('garimpo', () => this.setPhase(0, g));
      if (this.phaseIdx < 0 && g.save.flags['dlg_garimpo']) this.setPhase(0, g);
    }
    interact(g) {
      if (!this.panelOpen || this.finished) return;
      if (g.player.char !== 'larinha') { g.say('piata', 'Esse painel é coisa da Larinha.'); return; }
      this.interactable = false; this.shutdown(g);
    }
    shutdown(g) {
      GC.Audio.play('crash'); GC.Audio.play('neutralize');
      g.shake(5, 0.6); g.fx.steam(this.cx, this.y, 14);
      this.finish(g); this.state = 'off';
      g.save.stats.machines++;
      g.save.stats.contained = (g.save.stats.contained || 0) + 1;
      this.operator.pose = 'hands'; this.operator.leave = 1.6;
      g.say('garimpeiro', 'Para, para! Eu desligo tudo... Não precisava ser assim.');
      g.toast('Draga desligada. A polícia ambiental foi acionada.');
      g.entities.forEach((e) => { if (e instanceof GC.Ent.lodo && !e.dead) { e.hp = 0.01; e.hit('water', 1, g, { x: e.cx, y: e.y }); } });
      if (this.gate && g.gates[this.gate]) g.gates[this.gate].openUp(g);
      g.unlockGuide('garimpoIlegal', true);
      g.dialog('garimpo_fim');
    }
    update(dt, g) {
      this.t += dt; this.pt = (this.pt || 0) + dt;
      const p = g.player;
      if (this.operator.leave !== undefined) { this.operator.leave -= dt; if (this.operator.leave < 0) this.operator.gone = (this.operator.gone || 0) + dt; }
      if (!this.started) { if (p.cx > this.x - 150 && p.state !== 'dead') this.start(g); return; }
      if (this.finished || this.phaseIdx < 0) return;
      const P = this.phase.id;
      // lama com mercúrio em arco
      this.cool -= dt;
      if (this.cool <= 0 && p.state !== 'dead') {
        this.cool = P === 'hoses' ? 2.2 : 3.2;
        const dx = p.cx - (this.x + 10);
        g.addProjectile(new GC.Hazard(g, this.x + 10, this.y + 4, dx / 0.9, -250, 'sludge'));
        GC.Audio.play('fireball');
      }
      // lodo nasce da lama acumulada (no máximo dois)
      this.spawnT -= dt;
      if (P !== 'panel' && this.spawnT <= 0) {
        this.spawnT = 7;
        const n = g.entities.filter((e) => e instanceof GC.Ent.lodo && !e.dead).length;
        if (n < 2) g.addEntity(new GC.Ent.lodo(g, this.x - 30, this.bottom, {}));
      }
      if (P === 'hoses') {
        const left = this.hoses.filter((h) => !h.jammed).length;
        this.bar(g, (left + 1) / 3);
        if (left === 0) this.setPhase(1, g);
      } else if (P === 'vapor') {
        // nuvem tóxica à frente da draga
        const cloud = this.cloudBox();
        if (p.state !== 'dead' && U.overlap(cloud, p) && this.vapor > 0.15) p.hurt(1, null, g, 'Vapor de mercúrio! Disperse com o jato d’água.');
        for (const d of g.projectiles) if (d instanceof GC.Droplet && U.overlap({ x: d.x - 2, y: d.y - 2, w: 4, h: 4 }, cloud)) { d.dead = true; this.vapor -= 0.011; if (Math.random() < 0.2) g.fx.steam(d.x, d.y, 1); }
        this.vapor = Math.min(1, this.vapor + dt * 0.01);
        if (Math.random() < this.vapor * 0.5) g.fx.smoke(cloud.x + Math.random() * cloud.w, cloud.y + Math.random() * cloud.h, 1, false);
        this.bar(g, (this.vapor + 0.0) / 3 + 1 / 3);
        if (this.vapor <= 0) this.setPhase(2, g);
      } else if (P === 'panel') {
        this.bar(g, 0.12);
      }
    }
    cloudBox() { return { x: this.x - 110, y: this.y - 10, w: 104, h: this.h + 10 }; }
    hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    get hittable() { return false; }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), w = this.w, h = this.h;
      const off = this.state === 'off';
      const shake = !off && this.started ? Math.round(Math.sin(this.t * 40)) : 0;
      ctx.save(); ctx.translate(shake, 0);
      // flutuadores e casco remendado
      ctx.fillStyle = '#3a4656'; ctx.fillRect(x, y + h - 10, w, 10);
      ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x + 2, y + h - 10, w - 4, 2);
      ctx.fillStyle = off ? '#5a5e66' : '#7a6a3a'; ctx.fillRect(x + 6, y + 14, w - 12, h - 24);
      ctx.fillStyle = '#5a4a2a'; ctx.fillRect(x + 10, y + 20, 14, 8); ctx.fillRect(x + 40, y + 24, 10, 6);
      // motor e chaminé
      ctx.fillStyle = '#2a2d36'; ctx.fillRect(x + 44, y + 2, 12, 14);
      ctx.fillStyle = '#4a4e56'; ctx.fillRect(x + 48, y - 8, 5, 10);
      if (!off && Math.random() < 0.3) { /* fumaça desenhada pelo sistema de partículas */ }
      // painel de controle
      const panelGlow = this.panelOpen && !this.finished;
      ctx.fillStyle = '#22252e'; ctx.fillRect(x + 8, y + 26, 16, 10);
      ctx.fillStyle = panelGlow ? (Math.floor(this.t * 4) % 2 ? '#6ae8c8' : '#2a8a7a') : (off ? '#5ec04a' : '#a8241c'); ctx.fillRect(x + 10, y + 28, 12, 6);
      // garimpeiro operando
      const op = this.operator;
      if (!(op.gone > 1.5)) {
        ctx.globalAlpha = op.gone ? Math.max(0, 1 - op.gone / 1.5) : 1;
        const ox = x + 30 + (op.gone ? op.gone * 60 : 0);
        GC.Art.human(ctx, ox, y + 14, -1, this.t, 'garimpeiro', op.leave !== undefined ? (op.gone ? 'run' : 'hands') : 'alert', false);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      if (this.phaseIdx === 1 && this.vapor > 0) {
        const c = this.cloudBox();
        ctx.fillStyle = 'rgba(190,200,210,' + (0.22 * this.vapor) + ')';
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(Math.round(c.x - cam.x + 12 + i * 17), Math.round(c.y - cam.y + c.h / 2 + Math.sin(this.t * 2 + i) * 6), 16, 18, 0, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  });
  const o_hoses = [-92, -52];
})();

// o Colosso (entities/boss.js) também entra no registro de antagonistas
GC.Antagonists.define('boss', {
  group: 'maquina', name: 'Colosso', boss: true, guide: 'desmatamento',
  desc: 'Robô experimental de desmatamento do Projeto Horizonte, controlado pela rede NEXUS.',
  resolve: 'Drone de Larinha derruba os escudos; sementes de Piatã travam os três núcleos; purificador apaga as queimadas.'
}, GC.Ent.boss);
