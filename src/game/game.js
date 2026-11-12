// Núcleo da partida: estado da fase, câmera, regras, cooperação e renderização.
(function () {
  const Thing = GC.Thing, U = GC.U, C = GC.CFG;

  // ——— Gatilhos invisíveis e efeitos de cena ———
  GC.Ent.talk = class Talk extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 16, h: 64 }, o)); }
    update(dt, g) { if (!this.dead && g.player.cx > this.x && g.player.cx < this.x + 32 && Math.abs(g.player.bottom - this.bottom) < 80) { this.dead = true; g.dialog(this.o.id); } }
  };
  GC.Ent.bubbles = class Bubbles extends Thing {
    update(dt, g) { this.t += dt; if (Math.random() < dt * 3) g.fx.bubbles(this.x + 8, this.y + 10, 1); }
  };
  GC.Ent.arenaGate = class ArenaGate extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 16, h: (o.rows || 16) * 16 }, o)); this.tx = Math.floor(x / 16); this.ty1 = Math.floor(y / 16) - 1; g.arenaGate = this; }
    close(g) { for (let r = 0; r < this.o.rows; r++) g.level.set(this.tx, this.ty1 - r, GC.T.CLIFF); g.shake(5, 0.4); GC.Audio.play('crash'); g.fx.dust(this.x + 8, this.y + this.h, 12); }
    open(g) { for (let r = 0; r < this.o.rows; r++) g.level.set(this.tx, this.ty1 - r, GC.T.EMPTY); }
  };
  // A onça surge na batalha final
  GC.Ent.oncaCameo = class OncaCameo extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 36, h: 24 }, o)); this.vx = 260; this.vy = -380; this.state = 'leap'; this.st = 0; this.pose = 'walk'; }
    update(dt, g) {
      this.t += dt;
      if (this.state === 'leap') {
        this.vy += 1200 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.y + this.h >= g.level.arena.floor) { this.y = g.level.arena.floor - this.h; this.state = 'roar'; this.st = 1.6; this.pose = 'roar'; GC.Audio.play('roar'); g.shake(7, 0.8); g.fx.ring(this.cx, this.y + 8, '#f2c230'); g.fx.ring(this.cx, this.y + 8, '#ffffff'); }
      } else if (this.state === 'roar') {
        this.st -= dt; if (this.st <= 0) { this.state = 'leave'; this.pose = 'walk'; }
      } else { this.x -= 200 * dt; if (this.x < g.level.arena.x0 - 60) this.dead = true; }
    }
    draw(ctx, cam) { GC.Art.onca(ctx, this.sx(cam), this.sy(cam), this.state === 'leave' ? -1 : 1, this.t, this.pose, 1.2); }
  };
  // Ipê que floresce na recuperação da clareira
  GC.Ent.bloom = class Bloom extends Thing {
    constructor(g, x, y, o) { super(g, x, y, Object.assign({ w: 16, h: 40 }, o)); this.k = 0; this.delay = o.delay || 0; }
    update(dt, g) { this.t += dt; this.delay -= dt; if (this.delay <= 0) { if (this.k === 0) g.fx.leaves(this.cx, this.bottom - 20, 8); this.k = Math.min(1, this.k + dt * 0.8); if (this.k >= 1 && Math.random() < 0.05) g.fx.petals(this.cx, this.bottom - 40, 1); } }
    draw(ctx, cam) {
      if (this.k <= 0) return;
      ctx.save(); const x = this.sx(cam), y = this.sy(cam);
      ctx.translate(x, y); ctx.scale(this.k, this.k); ctx.translate(-x, -y);
      GC.Art.plant(ctx, this.o.kind || 'ipe', x, y, this.t); ctx.restore();
    }
  };

  GC.Game = class Game {
    constructor(levelId, save, char) {
      this.save = save;
      this.def = GC.Levels[levelId];
      this.level = new GC.Level(this.def);
      this.entities = []; this.projectiles = []; this.cipos = []; this.gates = {};
      this.fx = new GC.FX();
      this.time = 0;
      this.hearts = save.maxHearts;
      this.water = C.WATER_TANK;
      this.reveal = 0; this.allyCd = 0;
      this.cam = { x: 0, y: 0, shake: 0, shakeT: 0 };
      this.zone = null;
      this.obsT = 0; this.obsTarget = null;
      this.trail = [];
      this.autoClean = false; this.cleanT = 0;
      this.paused = false; this.victory = false; this.ended = false;
      this.boss = null; this.bossActive = false;
      this.darkA = 0; this.inputLocked = false; this.lockT = 0;
      this.queue = [];
      this.effects = [];
      for (const s of this.level.spawns) {
        const K = GC.Ent[s.type];
        if (!K) { console.warn('Entidade desconhecida:', s.type); continue; }
        const e = new K(this, s.x, s.y, s.o);
        this.entities.push(e);
        if (s.type === 'boss') this.boss = e;
      }
      // posição inicial: marco de trilha salvo ou início da fase
      const cp = save.checkpoint;
      const sx = cp ? cp.x : this.level.start.x + 8, sy = cp ? cp.y : this.level.start.y;
      this.player = new GC.Player(this, sx, sy, char || 'piata');
      // talks já vistos não se repetem
      this.entities.forEach((e) => { if (e instanceof GC.Ent.talk && save.flags['dlg_' + e.o.id]) e.dead = true; });
      if (save.allies.arara) this.spawnArara(sx, sy - 30);
      this.buildScenery();
      this.snapCamera();
      [this.darkCanvas, this.darkCtx] = U.makeCanvas(C.W, C.H);
    }

    // vegetação rasteira, flores e pedras espalhadas sobre a grama (apenas visual)
    buildScenery() {
      const L = this.level, T = GC.T, H = GC.U.hash;
      this.scenery = []; this.front = [];
      for (let tx = 0; tx < L.w; tx++) {
        const theme = L.theme[tx];
        if (theme === 'boss') continue;
        for (let ty = 1; ty < L.h; ty++) {
          if (L.tile(tx, ty) !== T.GRASS || GC.TP[L.tile(tx, ty - 1)].solid || L.tile(tx, ty - 1) !== T.EMPTY) continue;
          if (L.inDark(tx * 16 + 8, ty * 16 - 4)) continue;
          for (let k = 0; k < 2; k++) {
            const h = H(tx, ty, 7 + k), x = tx * 16 + 4 + k * 8 + H(tx, ty, 9 + k) * 4;
            let kind = null;
            if (h < 0.34) kind = 'tuft';
            else if (h < 0.42 && (theme === 'cerrado' || theme === 'pedra')) kind = 'capim';
            else if (h < 0.47) kind = 'flower';
            else if (h < 0.51) kind = 'shrub';
            else if (h < 0.54) kind = 'rock';
            if (kind) this.scenery.push({ kind, x, y: ty * 16, v: Math.floor(H(tx, ty, 3 + k) * GC.FLORA.variants[kind]) });
          }
          if (H(tx, ty, 21) < 0.07) this.front.push({ kind: 'front', x: tx * 16 + 8, y: ty * 16 + 3, v: H(tx, ty, 22) < 0.5 ? 0 : 1 });
        }
      }
    }
    drawScenery(ctx, cam, list) {
      for (const s of list) {
        if (s.x < cam.x - 20 || s.x > cam.x + GC.CFG.W + 20 || s.y < cam.y - 10 || s.y > cam.y + GC.CFG.H + 40) continue;
        GC.Sheets.draw(ctx, 'scenery', s.kind, 0, s.x - cam.x, s.y - cam.y, s.v === 1 && s.kind === 'tuft', { frame: s.v });
      }
    }

    get tool() { return GC.CHARACTERS[this.player.char].tool; }
    get partner() { return this.player.char === 'piata' ? 'larinha' : 'piata'; }

    // ——— Utilidades usadas pelas entidades ———
    spawn(e) { this.entities.push(e); return e; }
    addEntity(e) { this.entities.push(e); return e; }
    addProjectile(p) { this.projectiles.push(p); }
    shake(a, t) { this.cam.shake = Math.max(this.cam.shake, a); this.cam.shakeT = Math.max(this.cam.shakeT, t); }
    toast(m) { GC.HUD.toast(m); }
    say(who, text) { GC.HUD.speech(who, text); }
    hasGuide(k) { return this.save.guide.includes(k); }

    unlockGuide(key, card) {
      if (!GC.GUIDE[key] || this.hasGuide(key)) return false;
      this.save.guide.push(key);
      const G = GC.GUIDE[key];
      if (card) this.queue.push(() => this.openCard({ cat: 'Guia de Campo · ' + G.cat, title: G.name, sub: G.sci, text: G.text, tip: G.tip, icon: G.icon }));
      else this.toast('Novo registro no Guia de Campo: ' + G.name);
      this.persist();
      return true;
    }
    openCard(o) { this.paused = true; GC.HUD.showCard(o, () => { this.paused = false; GC.Input.clear(); }); }
    showSign(title, text) { this.queue.push(() => this.openCard({ cat: 'Placa', title, text })); }

    dialog(id, onDone) {
      const lines = GC.DIALOGS[id];
      if (!lines || this.save.flags['dlg_' + id]) { if (onDone) onDone(); return; }
      this.save.flags['dlg_' + id] = true;
      this.queue.push(() => { this.paused = true; GC.HUD.startDialog(lines, () => { this.paused = false; GC.Input.clear(); if (onDone) onDone(); }); });
    }

    trigger(name) {
      if (!name) return;
      const gate = this.gates[name];
      if (gate) gate.openUp(this);
      this.persist();
    }

    persist() { GC.Save.write(this.save); }

    // efeito animado de uma vez (brilho de coleta, poeira de pouso)
    effect(sheet, anim, x, y) { this.effects.push({ sheet, anim, x, y, t: 0, d: GC.Sheets.duration(sheet, anim) }); }

    collect(p) {
      const A = GC.Audio, S = this.save;
      this.effect('brilho', 'sparkle', p.cx, p.y + p.h / 2);
      if (p.kind === 'seed') { S.stats.seeds++; A.play('pickup'); }
      else if (p.kind === 'fruit') { this.hearts = Math.min(S.maxHearts, this.hearts + 1); A.play('heart'); this.toast('Fruto do Cerrado: +1 vitalidade'); }
      else if (p.kind === 'rare') {
        if (!S.rares.includes(p.id)) S.rares.push(p.id);
        A.play('rare'); this.fx.petals(p.cx, p.y, 10);
        this.toast('Semente rara encontrada (' + S.rares.length + '/5). Espécies raras ajudam a recuperar áreas degradadas.');
        this.persist();
      } else if (p.kind === 'heartUp') {
        S.maxHearts++; this.hearts = S.maxHearts; A.play('rare');
        this.toast('Muda de pequizeiro: vitalidade máxima aumentou!');
        this.persist();
      }
    }

    plantAt(tx, ty) {
      const L = this.level;
      if (L.tile(tx, ty) !== GC.T.DEGRADED) return;
      if (GC.TP[L.tile(tx, ty - 1)].solid) return;
      L.set(tx, ty, GC.T.GRASS);
      this.save.stats.planted++;
      this.spawn(new GC.Ent.bush(this, tx * 16, ty * 16, { tx, ty }));
      this.fx.leaves(tx * 16 + 8, ty * 16, 6);
    }

    cleanAt(tx, ty) {
      const L = this.level;
      if (L.tile(tx, ty) !== GC.T.POLLUTED) return;
      L.set(tx, ty, GC.T.WATER);
      this.save.stats.cleaned++;
      GC.Audio.play('extinguish');
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
      if (L.tile(tx + n[0], ty + n[1]) === GC.T.POLLUTED && Math.random() < 0.5) L.set(tx + n[0], ty + n[1], GC.T.WATER);
    }

    stepAutoClean(dt) {
      this.cleanT -= dt;
      if (this.cleanT > 0) return;
      this.cleanT = 0.14;
      const L = this.level, cand = [];
      const x0 = 200, x1 = 230;
      for (let ty = 10; ty < 25; ty++) for (let tx = x0; tx <= x1; tx++) if (L.tile(tx, ty) === GC.T.POLLUTED) {
        const near = [[1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => { const t = L.tile(tx + dx, ty + dy); return t === GC.T.WATER || t === GC.T.EMPTY; });
        if (near) cand.push([tx, ty]);
      }
      if (!cand.length) { this.autoClean = false; this.toast('O riacho está limpo outra vez.'); return; }
      const [tx, ty] = U.pick(cand);
      L.set(tx, ty, GC.T.WATER);
      this.fx.bubbles(tx * 16 + 8, ty * 16 + 8, 2);
    }

    activateCheckpoint(cp) {
      this.save.checkpoint = { id: cp.id, x: cp.cx, y: cp.bottom };
      this.hearts = Math.max(this.hearts, Math.min(this.save.maxHearts, this.hearts + 2));
      this.water = C.WATER_TANK;
      GC.Audio.play('checkpoint');
      this.fx.petals(cp.cx, cp.y + 4, 8);
      this.toast(GC.Save.write(this.save) ? 'Marco de trilha: progresso salvo.' : 'Marco de trilha alcançado (o navegador não permitiu salvar).');
    }

    interactTarget() {
      const p = this.player;
      let best = null, bd = 1e9;
      for (const e of this.entities) {
        if (!e.interactable || e.dead) continue;
        const dx = Math.abs(p.cx - e.cx), dy = Math.abs(p.bottom - e.bottom);
        if (dx < e.w / 2 + 14 && dy < 30 && dx < bd) { best = e; bd = dx; }
      }
      return best;
    }
    interact() { const e = this.interactTarget(); if (e) e.interact(this); }

    swapTool() {
      const p = this.player;
      if (!(p.state === 'normal' && p.onGround) && p.state !== 'swim') { GC.Audio.play('deny'); return; }
      if (this.swapCd > 0) return;
      this.swapCd = 0.4;
      const next = this.partner;
      p.setChar(next);
      if (p.spraying) { p.spraying = false; GC.Audio.spray(false); }
      this.trail = [];
      GC.Audio.play('swap');
      this.fx.leaves(p.cx, p.cy, 6);
      GC.HUD.reset();
    }

    useAlly() {
      const p = this.player;
      if (this.allyCd > 0) { GC.Audio.play('deny'); return; }
      if (p.char === 'piata') {
        this.reveal = C.REVEAL_TIME;
        this.allyCd = C.ALLY_COOLDOWN;
        GC.Audio.play('observe');
        this.fx.ring(p.cx, p.cy, '#f2d060');
        if (this.arara) { this.arara.scout(this); this.say('piata', 'A arara viu algo lá na frente. Fiquem de olho nas pedras que brilham.'); }
        else this.toast('Piatã lê os rastros: passagens escondidas brilham por alguns segundos.');
      } else {
        this.allyCd = C.ALLY_COOLDOWN - 2;
        GC.Audio.play('swap');
        this.spawn(new GC.Ent.drone(this, p.cx - 8, p.y));
      }
    }

    spawnArara(x, y) { this.arara = this.spawn(new GC.Ent.araraFriend(this, x - 8, y)); }

    tamanduaDig(spot) {
      const t = this.entities.find((e) => e instanceof GC.Ent.tamandua);
      if (t) t.goDig(spot, this);
      else { for (const [tx, ty] of spot.tiles) this.level.set(tx, ty, GC.T.EMPTY); }
    }

    pitFall() {
      const p = this.player;
      if (p.state === 'dead') return;
      p.invuln = 0;
      p.hurt(1, null, this, 'Cuidado com os barrancos!');
      if (p.state === 'dead') return;
      p.x = p.lastSafe.x; p.y = p.lastSafe.y; p.vx = 0; p.vy = 0; p.state = 'normal'; if (p.h !== 22) p.setHeight(22);
    }

    respawn() { if (this.onRespawn) this.onRespawn(); }

    // ——— Chefe ———
    startBoss() {
      this.bossActive = true;
      this.arenaGate && this.arenaGate.close(this);
      GC.Audio.music('boss');
      this.dialog('boss', () => this.boss.wake(this));
      if (this.save.flags['dlg_boss'] && this.boss.state === 'sleep' && !this.queue.length) this.boss.wake(this);
    }
    oncaArrives(boss) {
      const A = this.level.arena;
      this.spawn(new GC.Ent.oncaCameo(this, A.x0 - 40, A.floor - 60, {}));
      setTimeout(() => {
        boss.stun = 4.5;
        this.entities.forEach((e) => { if (e instanceof GC.Ent.sprayer && !e.dead) e.neutralize(this); });
        this.dialog('onca_boss');
      }, 700);
    }
    bossDefeated(boss) {
      this.victory = true;
      this.projectiles = [];
      this.entities.forEach((e) => { if ((e instanceof GC.Fire || e instanceof GC.Ent.sprayer) && !e.dead) { e.dead = true; this.fx.steam(e.cx, e.y, 6); } });
      GC.Audio.stopMusic();
      GC.Audio.play('victory');
      this.save.stats.machines++;
      setTimeout(() => {
        this.healed = true;
        GC.Audio.music('victory');
        const A = this.level.arena;
        for (let i = 0; i < 6; i++) this.spawn(new GC.Ent.bloom(this, A.x0 + 24 + i * 76, A.floor, { delay: i * 0.35, kind: i % 3 === 1 ? 'pequi' : 'ipe' }));
        this.arenaGate && this.arenaGate.open(this);
        if (!this.save.completed.includes(this.def.id)) this.save.completed.push(this.def.id);
        this.save.checkpoint = null;
        this.persist();
        setTimeout(() => this.dialog('victory', () => { this.ended = true; if (this.onEnd) this.onEnd(); }), 2600);
      }, 4200);
    }

    // ——— Câmera ———
    camTarget() {
      const p = this.player, A = this.level.arena;
      if (this.bossActive && A) return { x: A.x0, y: A.floor - C.H + 40 };
      return { x: p.cx - C.W / 2 + p.facing * 28, y: p.cy - C.H * 0.56 };
    }
    // Câmera de plataforma: zona morta horizontal com avanço na direção do movimento;
    // a vertical se ajusta ao pousar (no ar, só se o guardião sair da faixa livre).
    // Escalando, nadando ou em cipós, acompanha continuamente para não esconder o caminho.
    followCam(dt) {
      const p = this.player, cam = this.cam;
      const t = this.camTarget();
      if (this.bossActive && this.level.arena) {
        // arena desenhada para 480 de largura: centraliza e cobre o excedente com faixas
        const tx = t.x - (C.W - C.W_MIN) / 2;
        cam.x = U.lerp(cam.x, tx, Math.min(1, dt * 4)); cam.y = U.lerp(cam.y, t.y, Math.min(1, dt * 5));
        return;
      }
      const moving = Math.abs(p.vx) > 20;
      this.camLook = U.approach(this.camLook || 0, moving ? Math.sign(p.vx) * C.CAM_LOOK : p.facing * C.CAM_LOOK * 0.5, dt * 70);
      const want = p.cx + this.camLook, center = cam.x + C.W / 2, diff = want - center;
      let tx = cam.x;
      if (Math.abs(diff) > C.CAM_DEADZONE) tx = cam.x + diff - Math.sign(diff) * C.CAM_DEADZONE;
      cam.x = U.lerp(cam.x, tx, Math.min(1, dt * C.CAM_LERP_X));
      const follow = p.onGround || p.state === 'climb' || p.state === 'vine' || p.state === 'swim' || p.state === 'swing' || p.state === 'dead';
      if (follow || this.camRefY === undefined) this.camRefY = p.cy;
      const band = C.H * C.CAM_BAND, mid = cam.y + C.H * 0.56;
      if (p.cy < mid - band) this.camRefY = Math.min(this.camRefY, p.cy + band * 0.6);
      if (p.cy > mid + band * 0.8) this.camRefY = Math.max(this.camRefY, p.cy - band * 0.5);
      const ty = this.camRefY - C.H * 0.56;
      const ky = follow ? C.CAM_LERP_Y * (p.state === 'climb' || p.state === 'swim' ? 1.6 : 1) : C.CAM_LERP_Y * 1.4;
      cam.y = U.lerp(cam.y, ty, Math.min(1, dt * ky));
    }
    clampCam(c) {
      if (this.bossActive && this.level.arena) return; // na arena a câmera fica centrada (com faixas)
      c.x = U.clamp(c.x, 0, this.level.pxW - C.W);
      c.y = U.clamp(c.y, 0, this.level.pxH - C.H);
    }
    snapCamera() { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; this.camRefY = this.player.cy; this.camLook = 0; this.clampCam(this.cam); }

    // ——— Atualização ———
    update(dt) {
      GC.HUD.update(this, dt);
      if (this.queue.length && !this.paused && !GC.HUD.dialogOpen && !GC.HUD.cardOpen) this.queue.shift()();
      if (GC.HUD.dialogOpen) { if (GC.Input.pressed('confirm') || GC.Input.pressed('interact')) GC.HUD.advance(); return; }
      if (GC.HUD.cardOpen) { if (GC.Input.pressed('confirm') || GC.Input.pressed('interact') || GC.Input.pressed('pause')) GC.HUD.closeCard(); return; }
      if (this.paused) return;
      // hit stop: congela a simulação por alguns quadros ao acertar o chefe
      if (this.hitStop > 0) { this.hitStop--; return; }
      this.time += dt;
      this.save.stats.time += dt;
      this.swapCd = (this.swapCd || 0) - dt;
      this.reveal = Math.max(0, this.reveal - dt);
      this.allyCd = Math.max(0, this.allyCd - dt);

      const p = this.player;
      this.nearInteractable = this.interactTarget();
      p.update(dt, this);
      // rastro para o parceiro que acompanha
      if (p.state !== 'dead') {
        const last = this.trail[0];
        if (!last || Math.abs(last.x - p.cx) + Math.abs(last.y - p.bottom) > 1.2) {
          this.trail.unshift({ x: p.cx, y: p.bottom, f: p.facing, st: p.state, moving: true });
          if (this.trail.length > 40) this.trail.pop();
        }
      }

      for (const e of this.entities) if (!e.dead || e.keepUpdating !== false) e.update(dt, this);
      this.entities = this.entities.filter((e) => !(e.dead && !e.persistDead && !(e instanceof GC.Machine) && !(e instanceof GC.Ent.boss)));
      for (const pr of this.projectiles) pr.update(dt, this);
      this.projectiles = this.projectiles.filter((pr) => !pr.dead);
      this.fx.update(dt);
      for (const e of this.effects) e.t += dt;
      this.effects = this.effects.filter((e) => e.t < e.d);
      if (this.autoClean) this.stepAutoClean(dt);

      // zonas
      const z = this.level.zoneAt(p.cx);
      if (z && z !== this.zone) {
        this.zone = z;
        GC.HUD.banner(z.name, z.sub);
        if (z.guide) this.unlockGuide(z.guide, false);
        if (!this.bossActive && !this.victory) GC.Audio.music(z.music);
      }
      const dark = this.level.inDark(p.cx, p.cy);
      this.darkA = U.approach(this.darkA, dark ? 0.86 : 0, dt * 1.5);
      if (!this.bossActive && !this.victory && this.zone) GC.Audio.music(dark ? 'cave' : this.zone.music);
      GC.Soundscape.update(dt, dark ? 'caverna' : this.healed ? 'healed' : (this.zone ? this.zone.theme : 'cerrado'), this);

      // início do chefe
      const A = this.level.arena;
      if (A && !this.bossActive && !this.victory && p.cx > A.x0 + 64 && this.boss && this.boss.state === 'sleep') this.startBoss();

      // observação da natureza
      this.updateObserve(dt);

      // câmera
      this.followCam(dt);
      this.clampCam(this.cam);
      if (this.cam.shakeT > 0) this.cam.shakeT -= dt; else this.cam.shake = 0;
    }

    updateObserve(dt) {
      const p = this.player;
      let target = null, bd = 1e9;
      for (const e of this.entities) {
        if (!e.observe || e.dead || this.hasGuide(e.observe)) continue;
        const d = U.dist(p.cx, p.cy, e.cx, e.y + e.h / 2);
        if (d < (e.obsRange || 60) && d < bd) { target = e; bd = d; }
      }
      if (target && p.stillT > 0.15) {
        if (this.obsTarget !== target) { this.obsTarget = target; this.obsT = 0; }
        this.obsT += dt;
        if (this.obsT >= C.OBSERVE_TIME) {
          GC.Audio.play('observe');
          this.fx.ring(target.cx, target.y + target.h / 2, '#a8f080');
          this.unlockGuide(target.observe, true);
          if (target.onObserved) target.onObserved(this);
          this.obsT = 0; this.obsTarget = null;
        }
      } else { this.obsT = Math.max(0, this.obsT - dt * 2); if (this.obsT === 0) this.obsTarget = null; }
    }

    // ——— Renderização ———
    render(ctx) {
      const cam = { x: this.cam.x, y: this.cam.y };
      if (this.cam.shake > 0) { cam.x += (Math.random() - 0.5) * this.cam.shake * 2; cam.y += (Math.random() - 0.5) * this.cam.shake * 2; }
      cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
      const L = this.level;
      GC.Background.draw(ctx, L, cam, this.time, this.healed ? 'healed' : null);
      if (this.bossActive && !this.healed) {
        ctx.fillStyle = 'rgba(80,30,20,0.18)'; ctx.fillRect(0, 0, C.W, C.H);
        if (Math.random() < 0.4) this.fx.ember(cam.x + Math.random() * C.W, cam.y + C.H);
      }
      L.renderBack(ctx, cam, this.time);
      const insideFake = L.at(this.player.cx, this.player.cy) === GC.T.FAKE;
      L.renderTiles(ctx, cam, this.time, this.reveal > 0 || insideFake ? 1 : 0);
      this.drawScenery(ctx, cam, this.scenery);
      // entidades atrás (plantas, placas)
      for (const e of this.entities) if (e instanceof GC.Ent.plant || e instanceof GC.Ent.bloom) e.draw(ctx, cam, this);
      for (const e of this.entities) if (!(e instanceof GC.Ent.plant) && !(e instanceof GC.Ent.bloom) && e !== this.arara) e.draw(ctx, cam, this);
      this.drawPartner(ctx, cam);
      this.player.draw(ctx, cam, this);
      if (this.arara) this.arara.draw(ctx, cam, this);
      for (const pr of this.projectiles) pr.draw(ctx, cam);
      L.renderWater(ctx, cam, this.time);
      this.drawScenery(ctx, cam, this.front);
      for (const e of this.effects) GC.Sheets.draw(ctx, e.sheet, e.anim, e.t, e.x - cam.x, e.y - cam.y, false);
      this.fx.draw(ctx, cam);
      this.drawMarkers(ctx, cam);
      if (this.darkA > 0.01) this.drawDark(ctx, cam);
      if (this.reveal > 0) { ctx.fillStyle = 'rgba(255,220,120,' + (0.06 * Math.min(1, this.reveal)) + ')'; ctx.fillRect(0, 0, C.W, C.H); }
      if (this.player.state === 'dead') { ctx.fillStyle = 'rgba(20,10,10,' + (0.6 * (1 - this.player.deadT / 1.4)) + ')'; ctx.fillRect(0, 0, C.W, C.H); }
      // arena do chefe em tela larga: faixas laterais mantêm a área de 480 px
      if (this.bossActive && this.level.arena && C.W > C.W_MIN) { const bw = (C.W - C.W_MIN) / 2; ctx.fillStyle = '#0b0906'; ctx.fillRect(0, 0, bw, C.H); ctx.fillRect(C.W - bw, 0, bw, C.H); }
    }

    drawPartner(ctx, cam) {
      const p = this.player;
      if (p.state === 'dead') return;
      const tr = this.trail[Math.min(this.trail.length - 1, 22)];
      if (!tr || this.trail.length < 8) return;
      const moving = this.trail.length > 22 && Math.abs(this.trail[0].x - tr.x) > 4;
      const anim = tr.st === 'swim' ? 'swim' : (tr.st === 'climb' || tr.st === 'vine') ? 'climb' : moving ? 'walk' : 'idle';
      GC.Sheets.draw(ctx, this.partner, anim, this.time, tr.x - cam.x, tr.y - cam.y, tr.f < 0, { alpha: 0.92 });
    }

    drawMarkers(ctx, cam) {
      const p = this.player;
      // brilho verde sobre o que ainda não foi observado
      for (const e of this.entities) {
        if (!e.observe || e.dead || this.hasGuide(e.observe)) continue;
        const x = Math.round(e.cx - cam.x), y = Math.round(e.y - cam.y) - 8;
        if (x < -20 || x > C.W + 20) continue;
        const b = Math.round(Math.sin(this.time * 4) * 2);
        ctx.fillStyle = 'rgba(160,240,120,0.85)';
        ctx.fillRect(x - 1, y - 6 + b, 3, 3); ctx.fillRect(x - 3, y - 4 + b, 7, 1);
      }
      // progresso da observação
      if (this.obsTarget && this.obsT > 0) {
        const e = this.obsTarget, x = Math.round(e.cx - cam.x), y = Math.round(e.y - cam.y) - 18;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#a8f080'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.obsT / C.OBSERVE_TIME); ctx.stroke();
        ctx.fillStyle = '#e8ffd8'; ctx.fillRect(x - 3, y - 1, 6, 3); ctx.fillRect(x - 1, y - 2, 2, 1);
      }
      // aviso de interação
      const it = this.nearInteractable;
      if (it && p.state !== 'dead') {
        const x = Math.round(it.cx - cam.x), y = Math.round(it.y - cam.y) - 12 + Math.round(Math.sin(this.time * 6));
        ctx.fillStyle = 'rgba(20,20,28,0.8)'; ctx.fillRect(x - 6, y - 7, 13, 10);
        ctx.fillStyle = '#f4e8c8'; ctx.fillRect(x, y - 5, 1, 6); ctx.fillRect(x - 2, y - 3, 5, 1); ctx.fillRect(x - 1, y - 4, 3, 1);
      }
      // fôlego submerso
      if (p.breath < C.BREATH - 0.05 && p.state === 'swim') {
        const x = Math.round(p.cx - cam.x), y = Math.round(p.y - cam.y) - 8;
        const n = Math.ceil(p.breath / C.BREATH * 6);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i < n ? 'rgba(220,245,255,0.9)' : 'rgba(80,100,120,0.5)'; ctx.fillRect(x - 12 + i * 4, y, 3, 3); }
      }
    }

    drawDark(ctx, cam) {
      if (this.darkCanvas.width !== C.W) [this.darkCanvas, this.darkCtx] = U.makeCanvas(C.W, C.H); // largura mudou (tela larga)
      const d = this.darkCtx, p = this.player;
      d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, C.W, C.H);
      d.fillStyle = 'rgba(6,4,12,' + this.darkA + ')';
      d.fillRect(0, 0, C.W, C.H);
      d.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r) => {
        const g = d.createRadialGradient(x, y, r * 0.2, x, y, r);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = g; d.beginPath(); d.arc(x, y, r, 0, Math.PI * 2); d.fill();
      };
      // lanterna da EcoPack ilumina mais longe
      hole(p.cx - cam.x, p.cy - cam.y, p.char === 'larinha' ? 110 : 82);
      for (const e of this.entities) {
        if ((e instanceof GC.Ent.pickup && e.kind === 'rare') || e instanceof GC.Fire) hole(e.cx - cam.x, e.y - cam.y + 6, 30);
        if (e instanceof GC.Ent.plant && e.kind === 'art') hole(e.cx - cam.x, e.y - cam.y + 10, 40 + Math.sin(this.time * 2) * 4);
      }
      ctx.drawImage(this.darkCanvas, 0, 0);
    }
  };
})();
