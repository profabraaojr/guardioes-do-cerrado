// Poderes especiais (tecla F / botão Poder).
//
// Piatã · Soco da Terra: golpe de curto alcance que racha rochas, quebra caixas e
//   danifica máquinas. Não atinge pessoas nem animais: o tremor no chão desequilibra
//   os infratores próximos e derruba o equipamento deles.
// Larinha · Feixe do Satélite: a EcoPack guia um feixe de luz que desce do céu sobre o
//   alvo mais próximo à frente. Danifica máquinas, purifica criaturas contaminadas,
//   quebra rochas e caixas e ofusca infratores, registrando provas.
//
// Regras fixas: nenhum poder fere pessoas, animais silvestres ou o próprio jogador.
GC.Powers = (function () {
  const U = GC.U, T = () => GC.T;
  const said = {};
  const once = (g, key, who, text) => { if (said[key]) return; said[key] = true; g.say(who, text); };

  function breakTile(g, tx, ty) {
    if (g.level.tile(tx, ty) !== T().CRACKED) return false;
    g.level.set(tx, ty, T().EMPTY);
    const x = tx * 16 + 8, y = ty * 16 + 8;
    g.fx.burst(x, y, '#b4886a', 10); g.fx.burst(x, y, '#e8c0a0', 6); g.fx.dust(x, y + 6, 6);
    return true;
  }
  function breakTilesIn(g, box) {
    let n = 0;
    for (let ty = Math.floor(box.y / 16); ty <= Math.floor((box.y + box.h - 1) / 16); ty++)
      for (let tx = Math.floor(box.x / 16); tx <= Math.floor((box.x + box.w - 1) / 16); tx++) if (breakTile(g, tx, ty)) n++;
    if (n) { GC.Audio.play('crash'); g.save.stats.rocks = (g.save.stats.rocks || 0) + n; }
    return n;
  }
  const boxOf = (e) => (e.hitbox ? e.hitbox() : e);

  // aplica o efeito de um poder a uma entidade; devolve true se houve efeito
  function affect(g, kind, e, at) {
    const E = GC.Ent;
    if (e.dead) return false;
    // animais, pessoas parceiras e decoração nunca são alvos
    if (e instanceof E.caixa) { e.smash(g); return true; }
    if (e instanceof GC.Machine) {
      const dmg = (kind === 'feixe' ? 3 : 2) * (e.scanned > 0 ? 2 : 1);
      e.hp -= dmg; e.flash = 0.15;
      g.fx.sparks(at.x, at.y, 10);
      GC.Audio.play('metal');
      if (e.hp <= 0) e.neutralize(g);
      return true;
    }
    if (e instanceof GC.Infrator && e.active) {
      if (kind === 'soco') {
        if (!e.gearJammed && e.jamGear) { e.gearJammed = true; e.jamGear(g); e.lose(1.5, g, 'O tremor derrubou o equipamento ilegal!'); }
        else e.lose(0.5, g, null);
        once(g, 'socoPessoa', 'piata', 'O soco é para máquinas e pedras. Com gente, basta tirar o equilíbrio.');
      } else {
        e.lose(1, g, 'Clarão do satélite: provas registradas.');
      }
      if (e.active) { e.stun = kind === 'feixe' ? 1.8 : 1.2; e.state = 'stunned'; }
      return true;
    }
    if (e instanceof E.lodo) {
      if (kind === 'feixe') { e.hp = 0.01; e.hit('water', 1, g, at); return true; }
      once(g, 'socoLodo', 'piata', 'O soco afunda no lodo. A luz da Larinha ou a água resolvem melhor.');
      return false;
    }
    if (e instanceof GC.Criatura) {
      if (kind === 'feixe') { e.cleanse(1.5, g); return true; }
      return false;
    }
    if (e instanceof E.mangueira) { if (!e.jammed) { e.hit('seed', 1, g, at); if (!e.jammed) e.hit('seed', 1, g, at); return true; } return false; }
    if (e instanceof E.armadilha) { return e.armed ? e.hit('seed', 1, g, at) : false; }
    if (e instanceof E.draga && e.phaseIdx === 1 && kind === 'feixe') { e.vapor = Math.max(0, e.vapor - 0.45); g.fx.steam(at.x, at.y, 12); return true; }
    if (e instanceof E.boss && e.state !== 'sleep' && e.state !== 'defeat') {
      if (kind === 'feixe') {
        if (!e.shieldsDown) { g.fx.sparks(at.x, e.y - 6, 12); once(g, 'feixeEscudo', 'larinha', 'Os escudos refletem a luz! Primeiro o drone, depois o feixe.'); return true; }
        let best = null, bd = 1e9;
        for (const v of e.valves) if (v.alive) { const d = Math.abs(e.x + v.dx - at.x); if (d < bd) { bd = d; best = v; } }
        if (best && bd < 40) { best.hp -= 2; best.flash = 0.2; GC.Audio.play('metal'); g.fx.sparks(e.x + best.dx, e.y - 4, 12); if (best.hp <= 0) e.valveDown(best, g); }
        return true;
      }
      e.stun = Math.max(e.stun, 0.7); g.shake(5, 0.3); g.fx.sparks(at.x, at.y, 12);
      once(g, 'socoColosso', 'piata', 'Ele cambaleou! Mas os núcleos lá em cima só travam com sementes.');
      return true;
    }
    return false;
  }

  function punch(g, p) {
    const f = p.facing;
    const box = { x: f > 0 ? p.cx + 2 : p.cx - 34, y: p.bottom - 28, w: 32, h: 28 };
    const at = { x: p.cx + f * 20, y: p.bottom - 14 };
    let hit = breakTilesIn(g, box) > 0;
    for (const e of g.entities) {
      if (e.dead || e === g.arara) continue;
      const b = boxOf(e);
      if (!U.overlap(box, b)) continue;
      if (affect(g, 'soco', e, at)) hit = true;
    }
    // tremor no chão: desequilibra infratores próximos sem tocá-los
    for (const e of g.entities) if (e instanceof GC.Infrator && e.active && Math.abs(e.cx - p.cx) < 56 && Math.abs(e.bottom - p.bottom) < 20 && !U.overlap(box, e)) { e.stun = 0.8; e.state = 'stunned'; }
    g.effect('brilho', 'impacto', at.x, at.y);
    g.fx.dust(at.x, p.bottom, 10);
    g.shake(hit ? GC.CFG.SHAKE_BLAST + 1 : GC.CFG.SHAKE_PUNCH, 0.2);
    GC.Audio.play(hit ? 'crash' : 'land');
    return hit;
  }

  // ——— alvo do feixe: o mais próximo à frente (nunca animais ou pessoas parceiras) ———
  function pickTarget(g, p) {
    const f = p.facing, cand = [];
    const add = (x, y, ref) => { const dx = (x - p.cx) * f; if (dx > -12 && dx < 250 && Math.abs(y - p.cy) < 140) cand.push({ x, y, ref, d: Math.abs(dx) + Math.abs(y - p.cy) * 0.5 }); };
    const E = GC.Ent;
    for (const e of g.entities) {
      if (e.dead) continue;
      if ((e instanceof GC.Machine) || (e instanceof GC.Infrator && e.active) || (e instanceof GC.Criatura) || (e instanceof E.lodo) || (e instanceof E.caixa) || (e instanceof E.mangueira && !e.jammed) || (e instanceof E.armadilha && e.armed)) add(e.cx, e.y + e.h / 2, e);
      else if (e instanceof E.boss && e.state !== 'sleep' && e.state !== 'defeat') {
        if (e.shieldsDown) { for (const v of e.valves) if (v.alive) add(e.x + v.dx, e.y, e); } else add(e.cx, e.y, e);
      } else if (e instanceof E.draga && e.phaseIdx === 1) { const c = e.cloudBox(); add(c.x + c.w / 2, c.y + c.h / 2, e); }
    }
    const L = g.level, tx0 = Math.floor(p.cx / 16);
    for (let k = 0; k < 16; k++) for (let ty = Math.floor(p.cy / 16) - 5; ty <= Math.floor(p.cy / 16) + 3; ty++) {
      const tx = tx0 + k * f;
      if (L.tile(tx, ty) === T().CRACKED) add(tx * 16 + 8, ty * 16 + 8, { tile: [tx, ty] });
    }
    cand.sort((a, b) => a.d - b.d);
    if (cand.length) return cand[0];
    return { x: p.cx + f * 110, y: p.cy, ref: null };
  }

  function groundBelow(g, x, y) {
    const L = g.level;
    for (let ty = Math.floor(y / 16); ty < L.h; ty++) { const t = GC.TP[L.tile(Math.floor(x / 16), ty)]; if (t.solid || t.water) return ty * 16; }
    return y + 40;
  }

  function beam(g, p) {
    const t = pickTarget(g, p);
    g.spawn(new GC.Ent.feixe(g, t.x - 8, groundBelow(g, t.x, t.y - 4), { target: t }));
    GC.Audio.play('observe');
  }

  return { punch, beam, affect, breakTilesIn };
})();

// ——— Feixe de luz vindo do céu ———
GC.Ent.feixe = class Feixe extends GC.Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 24, h: 16 }, o));
    this.tx = x + 8; this.gy = y; this.phase = 'lock'; this.pt = 0; this.target = o.target; this.flash = 0;
  }
  update(dt, g) {
    this.t += dt; this.pt += dt;
    const R = this.target && this.target.ref;
    if (this.phase === 'lock') {
      if (R && !R.tile && !R.dead && !(R instanceof GC.Ent.boss) && !(R instanceof GC.Ent.draga)) { this.tx = GC.U.lerp(this.tx, R.cx, Math.min(1, dt * 10)); this.gy = Math.min(this.gy, R.bottom); }
      if (this.pt >= 0.55) { this.phase = 'strike'; this.pt = 0; this.apply(g); }
    } else if (this.phase === 'strike') {
      if (Math.random() < 0.6) g.fx.add({ x: this.tx + (Math.random() - 0.5) * 18, y: this.gy - Math.random() * 60, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 60, life: 0.5, color: Math.random() < 0.5 ? '#bff8ff' : '#fff2a0', size: 1 });
      if (this.pt >= 0.42) { this.phase = 'fade'; this.pt = 0; }
    } else if (this.pt >= 0.35) this.dead = true;
  }
  apply(g) {
    const zone = { x: this.tx - 18, y: this.gy - 260, w: 36, h: 262 };
    const at = { x: this.tx, y: this.gy - 10 };
    GC.Powers.breakTilesIn(g, { x: this.tx - 12, y: this.gy - 48, w: 24, h: 48 });
    if (this.target && this.target.ref && this.target.ref.tile) { const [tx, ty] = this.target.ref.tile; GC.Powers.breakTilesIn(g, { x: tx * 16, y: ty * 16, w: 16, h: 16 }); }
    let any = false;
    for (const e of g.entities) {
      if (e.dead || e === this) continue;
      const b = e.hitbox ? e.hitbox() : e;
      if (e instanceof GC.Ent.boss) { if (Math.abs(this.tx - e.cx) < e.w / 2 + 16) { GC.Powers.affect(g, 'feixe', e, at); any = true; } continue; }
      if (e instanceof GC.Ent.draga) { if (e.phaseIdx === 1) { const c = e.cloudBox(); if (this.tx > c.x - 16 && this.tx < c.x + c.w + 16) any = GC.Powers.affect(g, 'feixe', e, at) || any; } continue; }
      if (GC.U.overlap(zone, b)) any = GC.Powers.affect(g, 'feixe', e, at) || any;
    }
    g.shake(GC.CFG.SHAKE_BEAM, 0.25); this.flash = 0.12;
    GC.Audio.play('engine');
    g.fx.ring(this.tx, this.gy - 2, '#bff8ff'); g.fx.ring(this.tx, this.gy - 2, '#fff2a0');
    void any;
  }
  draw(ctx, cam) {
    const x = this.tx - cam.x, gy = this.gy - cam.y, top = -cam.y - 400;
    if (this.phase === 'lock') {
      // mira no chão e linha-guia tremulante vinda do céu
      const r = 10 - this.pt * 6, a = this.t * 6;
      ctx.strokeStyle = 'rgba(106,232,248,0.9)'; ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) { const ang = a + k * Math.PI / 2; ctx.beginPath(); ctx.arc(x, gy - 2, r, ang, ang + 0.8); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x - 0.5, gy - 3, 1, 1);
      if (Math.floor(this.t * 20) % 2) { ctx.fillStyle = 'rgba(160,240,255,0.45)'; ctx.fillRect(x - 0.5, Math.max(top, -40), 1, gy - Math.max(top, -40)); }
      return;
    }
    const k = this.phase === 'strike' ? 1 : 1 - this.pt / 0.35;
    const flick = 0.85 + Math.sin(this.t * 60) * 0.15;
    const yTop = -10;
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(255,220,120,0.25)'; ctx.fillRect(x - 14 * flick, yTop, 28 * flick, gy - yTop);
    ctx.fillStyle = 'rgba(106,232,248,0.55)'; ctx.fillRect(x - 9 * flick, yTop, 18 * flick, gy - yTop);
    ctx.fillStyle = 'rgba(210,252,255,0.85)'; ctx.fillRect(x - 5, yTop, 10, gy - yTop);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, yTop, 4, gy - yTop);
    for (let i = 0; i < 6; i++) { const yy = (this.t * 300 + i * 40) % (gy - yTop) + yTop; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 7, yy, 14, 0.5); }
    // clarão no chão
    ctx.fillStyle = 'rgba(255,255,220,0.8)'; ctx.beginPath(); ctx.ellipse(x, gy - 1, 18 * flick, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(106,232,248,0.6)'; ctx.beginPath(); ctx.ellipse(x, gy - 1, 26 * flick, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (this.flash > 0) { this.flash -= 1 / 60; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(cam.x - cam.x, 0, GC.CFG.W, GC.CFG.H); }
  }
};

// ——— Caixa de suprimentos do Projeto Horizonte (quebrável) ———
GC.Ent.caixa = class Caixa extends GC.Thing {
  constructor(g, x, y, o) {
    super(g, x, y, Object.assign({ w: 16, h: 16 }, o));
    this.tx = Math.floor(x / 16); this.ty = Math.floor(y / 16) - 1;
    this.hittable = false;
    if (o.id && g.save.collected.includes(o.id)) { this.dead = true; return; }
    g.level.set(this.tx, this.ty, GC.T.GATE);
  }
  smash(g) {
    if (this.dead) return;
    this.dead = true;
    g.level.set(this.tx, this.ty, GC.T.EMPTY);
    if (this.o.id) g.save.collected.push(this.o.id);
    g.fx.burst(this.cx, this.y + 8, '#a8683a', 14); g.fx.burst(this.cx, this.y + 8, '#c8ccd8', 6);
    GC.Audio.play('crash');
    const drops = this.o.drop || ['seed'];
    drops.forEach((k, i) => g.addEntity(new GC.Ent.pickup(g, this.x + (i - (drops.length - 1) / 2) * 10 - 3, this.bottom, { kind: k, lift: 4 })));
    g.save.stats.crates = (g.save.stats.crates || 0) + 1;
  }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y;
    ctx.fillStyle = '#16101c'; ctx.fillRect(x - 0.5, y - 0.5, 17, 17);
    ctx.fillStyle = '#9a6234'; ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = '#b87a44'; ctx.fillRect(x, y, 16, 1.5);
    ctx.fillStyle = '#6e4220'; ctx.fillRect(x, y + 7.5, 16, 1); ctx.fillRect(x + 7.5, y, 1, 16);
    ctx.fillStyle = '#5a606e'; ctx.fillRect(x, y + 1.5, 16, 1); ctx.fillRect(x, y + 13.5, 16, 1);
    ctx.fillStyle = '#d0d4da'; ctx.fillRect(x + 1, y + 2, 0.5, 0.5); ctx.fillRect(x + 14.5, y + 2, 0.5, 0.5);
    ctx.fillStyle = '#16181e'; ctx.fillRect(x + 4, y + 4, 8, 6);
    GC.Art.logo(ctx, x + 4.5, y + 5, 1);
  }
};
