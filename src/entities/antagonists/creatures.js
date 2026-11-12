// Grupo 2: criaturas fictícias afetadas pela contaminação. Todas se recuperam.
(function () {
  const A = GC.Antagonists, U = GC.U;

  // o lodo do garimpo (definido em enemies.js) entra no registro como criatura
  A.define('lodo', {
    group: 'criatura', name: 'Lodo do garimpo', guide: 'garimpoIlegal',
    desc: 'Massa viva de lama e mercúrio que rasteja pelas cavernas.',
    resolve: 'Purificar com o jato d’água. Volta a ser uma perereca.'
  }, GC.Ent.lodo);

  // forma saudável: lambaris que voltam a nadar
  GC.Ent.lambaris = class Lambaris extends GC.Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 20, h: 10 }, o)); this.dir = 1; this.ox = this.x; }
    update(dt, g) { this.t += dt; this.x = this.ox + Math.sin(this.t * 0.8) * 30; this.dir = Math.cos(this.t * 0.8) > 0 ? 1 : -1; }
    draw(ctx, cam) {
      for (let i = 0; i < 4; i++) {
        const x = Math.round(this.x - cam.x + i * 6 - 9), y = Math.round(this.y - cam.y + Math.sin(this.t * 3 + i) * 3 + (i % 2) * 4);
        ctx.fillStyle = '#c8d8e0'; ctx.fillRect(x, y, 5, 2); ctx.fillStyle = '#f2c230'; ctx.fillRect(this.dir > 0 ? x - 1 : x + 5, y, 1, 2);
      }
    }
  };

  // ——— Cardume sombrio ———
  // Peixes escurecidos pela água contaminada. Avançam em quem nada perto.
  // Recuperação: quando a água ao redor fica limpa, voltam a ser lambaris.
  A.define('cardume', {
    group: 'criatura', name: 'Cardume sombrio',
    desc: 'Peixes deformados pela água contaminada que atacam em grupo.',
    resolve: 'Limpar a água ao redor com o purificador. Voltam a ser lambaris.'
  }, class Cardume extends GC.Criatura {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 22, h: 12, taint: 1 }, o)); this.home = { x: this.x, y: this.y }; this.dir = 1; this.vx = 0; this.vy = 0; }
    update(dt, g) {
      this.t += dt; this.flash -= dt;
      const L = g.level, p = g.player;
      const here = L.at(this.cx, this.y + 6);
      if (here === GC.T.WATER) this.cleanse(dt * 0.9, g);
      if (this.dead) return;
      const inWater = p.state === 'swim' && U.dist(p.cx, p.cy, this.cx, this.y + 6) < 110;
      const tx = inWater ? p.cx - this.w / 2 : this.home.x + Math.sin(this.t * 0.7) * 28;
      const ty = inWater ? p.cy - 6 : this.home.y + Math.sin(this.t * 1.3) * 6;
      this.vx = U.approach(this.vx, Math.sign(tx - this.x) * (inWater ? 70 : 25), 200 * dt);
      this.vy = U.approach(this.vy, Math.sign(ty - this.y) * (inWater ? 50 : 15), 200 * dt);
      const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
      if (GC.TP[L.at(nx + this.w / 2, ny + 6)].water) { this.x = nx; this.y = ny; }
      if (Math.abs(this.vx) > 2) this.dir = Math.sign(this.vx);
      this.hurtOnTouch(g, 'Cardume sombrio! Limpe a água para que se recupere.');
    }
    onRecover(g) { g.addEntity(new GC.Ent.lambaris(g, this.x - 8 + 8, this.y + 10, {})); g.toast('O cardume se recuperou: os lambaris voltaram a nadar.'); g.fx.bubbles(this.cx, this.y + 6, 8); }
    draw(ctx, cam) {
      if (this.dead) return;
      for (let i = 0; i < 5; i++) {
        const x = Math.round(this.x - cam.x + (i % 3) * 7), y = Math.round(this.y - cam.y + Math.floor(i / 3) * 5 + Math.sin(this.t * 6 + i) * 1.5);
        ctx.fillStyle = this.flash > 0 ? '#fff' : '#3a2e3e'; ctx.fillRect(x, y, 6, 3);
        ctx.fillStyle = '#5a4a5e'; ctx.fillRect(this.dir > 0 ? x - 2 : x + 6, y, 2, 3);
        ctx.fillStyle = '#d070f0'; ctx.fillRect(this.dir > 0 ? x + 4 : x + 1, y, 1, 1);
      }
    }
  });

  // forma saudável: borboletas amarelas
  GC.Ent.borboletas = class Borboletas extends GC.Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 10, h: 10 }, o)); this.life = 4; }
    update(dt) { this.t += dt; this.life -= dt; this.y -= 18 * dt; this.x += Math.sin(this.t * 3) * 20 * dt; if (this.life <= 0) this.dead = true; }
    draw(ctx, cam) {
      ctx.globalAlpha = Math.min(1, this.life);
      for (let i = 0; i < 3; i++) GC.Sheets.draw(ctx, 'insetos', ['amarela', 'laranja', 'azul'][i], this.t + i * 0.4, this.x - cam.x + i * 8, this.y - cam.y + Math.sin(this.t * 4 + i) * 4, false);
      ctx.globalAlpha = 1;
    }
  };

  // ——— Mariposas de fuligem ———
  // Insetos fictícios cobertos pela fuligem das queimadas. Voam em ondas.
  // Recuperação: o jato d'água lava a fuligem e revela borboletas.
  A.define('mariposas', {
    group: 'criatura', name: 'Mariposas de fuligem',
    desc: 'Enxame coberto de fuligem que surge perto dos focos de incêndio.',
    resolve: 'Lavar com o jato d’água. Voltam a ser borboletas.'
  }, class Mariposas extends GC.Criatura {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 22, h: 14, taint: 1 }, o)); this.baseY = this.y - 30; this.ox = this.x; this.y = this.baseY; }
    hit(kind, d, g) { if (kind !== 'water') return false; this.cleanse(0.12, g); g.fx.burst(this.cx, this.y + 6, '#3a3434', 2); return true; }
    update(dt, g) {
      this.t += dt; this.flash -= dt;
      if (this.dead) return;
      // sem focos de incêndio por perto, a fuligem assenta e elas se recuperam aos poucos
      if (!g.entities.some((f) => f instanceof GC.Fire && !f.dead && Math.abs(f.cx - this.cx) < 220)) { this.cleanse(dt * 0.22, g); if (this.dead) return; }
      const p = g.player;
      const near = Math.abs(p.cx - this.cx) < 140;
      this.ox = U.approach(this.ox, near ? p.cx - this.w / 2 : this.ox, 28 * dt);
      this.x = this.ox + Math.sin(this.t * 1.7) * 18;
      this.y = this.baseY + Math.sin(this.t * 2.6) * 14 + (near ? Math.max(-20, Math.min(20, p.cy - 30 - this.baseY)) : 0);
      this.hurtOnTouch(g, g.player.char === 'piata' ? 'Mariposas de fuligem! Apague o fogo: sem fumaça, a fuligem assenta.' : 'Mariposas de fuligem! Lave-as com o jato d’água.');
    }
    onRecover(g) { g.addEntity(new GC.Ent.borboletas(g, this.x, this.y, {})); g.toast('A fuligem saiu: eram borboletas!'); }
    draw(ctx, cam) {
      if (this.dead) return;
      for (let i = 0; i < 3; i++) {
        const x = this.x - cam.x + i * 8, y = this.y - cam.y + Math.sin(this.t * 5 + i * 2) * 3;
        GC.Sheets.draw(ctx, 'insetos', 'fuligem', this.t + i * 0.3, x, y, i % 2 === 1, { white: this.flash > 0 });
        if (Math.random() < 0.05) g_ash(ctx, x, y);
      }
    }
  });
  function g_ash(ctx, x, y) { ctx.fillStyle = 'rgba(80,70,70,0.6)'; ctx.fillRect(x + 1, y + 5, 1, 1); }

  // máquinas existentes também entram no registro (grupo 3)
  A.define('chainsaw', { group: 'maquina', name: 'Serra-robô', desc: 'Robô de corte que patrulha e avança quando detecta alguém.', resolve: 'Travar com sementes (dano dobrado após o drone).' }, GC.Ent.chainsaw);
  A.define('sprayer', { group: 'maquina', name: 'Drone-sentinela', desc: 'Drone de vigilância que dispara pulsos elétricos.', resolve: 'Travar com sementes; cai e fica inerte.' }, GC.Ent.sprayer);
  A.define('polluter', { group: 'maquina', name: 'Poluidor', desc: 'Robô que despeja resíduos no riacho do Carimã.', resolve: 'Travar com sementes e limpar a água com o purificador.' }, GC.Ent.polluter);
})();
