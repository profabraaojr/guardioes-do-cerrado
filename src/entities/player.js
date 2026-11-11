// O guardião: máquina de estados de movimentação, ferramentas e vitalidade.
GC.Player = class Player {
  constructor(g, x, y, char = 'piata') {
    this.g = g;
    this.setChar(char);
    this.w = 10; this.h = 22;
    this.x = x - this.w / 2; this.y = y - this.h;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.state = 'normal';
    this.onGround = false; this.onSlope = 0;
    this.coyote = 0; this.buffer = 0; this.jumpCut = false;
    this.invuln = 0; this.flash = 0; this.toxic = 0;
    this.seedCd = 0; this.sprayT = 0; this.spraying = false; this.firingT = 0;
    this.clingCd = 0; this.slideT = 0; this.dropThrough = 0;
    this.breath = GC.CFG.BREATH;
    this.t = 0; this.animT = 0; this.stillT = 0;
    this.lastSafe = { x: this.x, y: this.y };
    this.safeT = 0;
    this.toolUsedT = 99; this.runT = 0;
    this.swing = null;
    this.aim = 'fwd';
    this.deadT = 0;
  }
  setChar(c) { this.char = c; this.ph = GC.CHARACTERS[c].phys; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }

  setHeight(h) { this.y += this.h - h; this.h = h; }

  wet(L, px, py) {
    const T = GC.T, t = L.at(px, py);
    if (GC.TP[t].water) return t;
    if (t === T.FAKE) {
      const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const n = L.tile(tx + dx, ty + dy); if (GC.TP[n].water) return n; }
    }
    return 0;
  }

  climbableAt(L, side) {
    const tx = Math.floor((side > 0 ? this.x + this.w + 1 : this.x - 1) / 16);
    const a = GC.TP[L.tile(tx, Math.floor((this.y + 8) / 16))].climb;
    const b = GC.TP[L.tile(tx, Math.floor((this.y + this.h - 3) / 16))].climb;
    return { top: a, bot: b, any: a || b };
  }

  vineAt(L) {
    const T = GC.T;
    return L.at(this.cx, this.y + 4) === T.VINE || L.at(this.cx, this.y + this.h - 4) === T.VINE || L.at(this.cx, this.cy) === T.VINE;
  }

  update(dt, g) {
    const C = GC.CFG, I = GC.Input, L = g.level, U = GC.U, A = GC.Audio;
    this.t += dt; this.animT += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.seedCd -= dt; this.clingCd -= dt; this.dropThrough = Math.max(0, this.dropThrough - dt);
    this.firingT -= dt; this.toolUsedT += dt;

    if (this.state === 'dead') {
      this.deadT -= dt;
      if (this.deadT <= 0) g.respawn();
      return;
    }

    // preso em rede ou armadilha: aperte botões para se soltar
    if (this.netT > 0) {
      this.netT -= dt;
      if (I.pressed('jump') || I.pressed('left') || I.pressed('right') || I.pressed('tool')) this.netT -= 0.2;
      this.vx = 0; this.buffer = 0;
      this.vy = Math.min(this.vy + (this.state === 'swim' ? C.SWIM_GRAV : C.GRAVITY) * dt, this.state === 'swim' ? 60 : C.MAX_FALL);
      GC.Phys.move(this, dt, L);
      if (this.spraying) { this.spraying = false; A.spray(false); }
      return;
    }
    const lock = g.inputLocked;
    const left = !lock && I.down('left'), right = !lock && I.down('right');
    const up = !lock && I.down('up'), down = !lock && I.down('down');
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    if (!lock && I.pressed('jump')) this.buffer = C.BUFFER; else this.buffer -= dt;
    const jumpHeld = !lock && I.down('jump');

    const wetT = this.wet(L, this.cx, this.y + this.h * 0.5);
    const headWet = this.wet(L, this.cx, this.y + 3);
    const wasGround = this.onGround;
    const prevVy = this.vy;

    // água poluída fere enquanto houver contato
    const polluted = wetT === GC.T.POLLUTED || this.wet(L, this.cx, this.bottom - 2) === GC.T.POLLUTED;
    if (polluted) { this.toxic -= dt; if (this.toxic <= 0) { this.toxic = 0.8; this.hurt(1, null, g, 'Água contaminada! Limpe-a com o jato d\'água.'); } }
    else this.toxic = 0.25;

    switch (this.state) {
      case 'normal': {
        if (wetT && this.state !== 'swim') { this.enterSwim(g); break; }
        // deslizar
        if (this.onGround && down && (this.onSlope || (I.pressed('down') && Math.abs(this.vx) > 100))) { this.startSlide(dir || this.facing); break; }
        // agachar / andar abaixado (também sob tetos baixos)
        const lowCeil = this.h < 22 && GC.Phys.ceilingBlocked(this, L, 22);
        if (this.onGround && (down || lowCeil)) { if (this.h !== 14) this.setHeight(14); this.crouch = true; }
        else if (this.h !== 22 && !lowCeil) { this.setHeight(22); this.crouch = false; }
        const sneak = this.crouch && this.onGround && dir !== 0;
        const max = this.crouch && this.onGround ? C.SNEAK_MAX : this.ph.run;
        const acc = this.onGround ? C.RUN_ACC : C.AIR_ACC;
        if (dir) { this.vx = U.approach(this.vx, dir * max, acc * dt); if (!this.spraying) this.facing = dir; }
        else this.vx = U.approach(this.vx, 0, (this.onGround ? C.FRICTION : C.AIR_ACC * 0.35) * dt);
        this.sneaking = sneak;
        this.vy = Math.min(this.vy + C.GRAVITY * dt, C.MAX_FALL);
        this.coyote = this.onGround ? C.COYOTE : this.coyote - dt;
        if (this.buffer > 0 && this.coyote > 0 && !lowCeil) {
          const below = L.at(this.cx, this.bottom + 2);
          if (down && GC.TP[below].oneway) { this.dropThrough = 0.25; this.y += 1; }
          else { this.vy = -this.ph.jump; this.jumpCut = false; A.play('jump'); g.fx.dust(this.cx, this.bottom, 4); }
          this.buffer = 0; this.coyote = 0;
        }
        if (!jumpHeld && this.vy < 0 && !this.jumpCut) { this.vy *= C.JUMP_CUT; this.jumpCut = true; }
        this.dropThroughSync();
        GC.Phys.move(this, dt, L);
        if (!wasGround && this.onGround && prevVy > 220) { A.play('land'); g.fx.dust(this.cx, this.bottom, 5); g.effect('brilho', 'dust', this.cx, this.bottom - 8); }
        // agarrar paredão
        if (!this.onGround && this.vy > -80 && dir && this.clingCd <= 0 && this.climbableAt(L, dir).any) {
          this.state = 'climb'; this.climbSide = dir; this.facing = dir; this.vx = 0; this.vy = 0;
        }
        if (up && this.vineAt(L) && !this.onGround) { this.state = 'vine'; this.vx = 0; this.vy = 0; }
        else if (up && this.vineAt(L) && this.onGround && !g.nearInteractable) { this.state = 'vine'; this.vx = 0; this.vy = -10; }
        if (!this.onGround && !this.swingCd) {
          for (const c of g.cipos) if (c.canGrab(this)) { this.state = 'swing'; this.swing = c; c.attach(this); A.play('stroke'); break; }
        }
        break;
      }
      case 'slide': {
        if (wetT) { this.endSlide(L, true); this.enterSwim(g); break; }
        const blocked = GC.Phys.ceilingBlocked(this, L, 22);
        if (this.onSlope) {
          const downhill = -this.onSlope;
          this.vx = U.approach(this.vx, downhill * C.SLIDE_SPEED * 1.15, 700 * dt);
          this.facing = downhill;
          if (Math.random() < 0.5) g.fx.dust(this.cx - this.facing * 4, this.bottom, 1);
        } else if (this.slideT > 0) {
          this.slideT -= dt;
          this.vx = U.approach(this.vx, 0, 380 * dt);
          if (Math.random() < 0.4) g.fx.dust(this.cx - this.facing * 4, this.bottom, 1);
        } else if (blocked) {
          // terminou sob teto baixo: segue abaixado
          this.setHeight(14); this.crouch = true; this.state = 'normal'; break;
        }
        this.vy = Math.min(this.vy + C.GRAVITY * dt, C.MAX_FALL);
        GC.Phys.move(this, dt, L);
        const done = !this.onSlope && (this.slideT <= 0 || Math.abs(this.vx) < 25);
        const stopSlope = this.onSlope && !down;
        if (this.buffer > 0 && !blocked && this.onGround) {
          this.endSlide(L); this.vy = -this.ph.jump; this.jumpCut = false; this.buffer = 0; A.play('jump');
        } else if ((done || stopSlope || !this.onGround) && !blocked) {
          if (!(this.onSlope && down)) this.endSlide(L);
        }
        break;
      }
      case 'climb': {
        const side = this.climbSide;
        const c = this.climbableAt(L, side);
        this.vx = 0;
        this.vy = (down ? 1 : 0) * this.ph.climb - (up ? 1 : 0) * this.ph.climb;
        if (this.vy !== 0) this.animT += dt * 0.5;
        if (this.buffer > 0) {
          this.buffer = 0; this.state = 'normal';
          const wj = this.ph.wallJump ? 1 : 0.55;
          this.vx = -side * C.WALLJUMP_VX * wj; this.vy = -C.WALLJUMP_VY * wj; this.facing = -side; this.clingCd = 0.28; this.jumpCut = true;
          A.play('jump');
          break;
        }
        if (dir === -side) { this.state = 'normal'; this.clingCd = 0.25; break; }
        if (!c.top && c.bot && up) {
          // topo do paredão: impulso para subir na borda
          this.state = 'normal'; this.vy = -250; this.vx = side * 90; this.clingCd = 0.3; this.jumpCut = true;
          break;
        }
        if (!c.any) { this.state = 'normal'; break; }
        GC.Phys.move(this, dt, L);
        if (this.onGround && down) this.state = 'normal';
        if (wetT && !up) this.enterSwim(g);
        break;
      }
      case 'vine': {
        this.vx = dir * C.CLIMB_SPEED * 0.8;
        this.vy = (down ? 1 : 0) * C.CLIMB_SPEED - (up ? 1 : 0) * C.CLIMB_SPEED;
        if (dir) this.facing = dir;
        if (this.vx || this.vy) this.animT += dt * 0.5;
        GC.Phys.move(this, dt, L);
        if (this.buffer > 0) { this.buffer = 0; this.state = 'normal'; this.vy = -C.JUMP_V * 0.8; this.jumpCut = false; A.play('jump'); break; }
        if (!this.vineAt(L)) { this.state = 'normal'; if (up) { this.vy = -240; this.jumpCut = true; } }
        if (this.onGround && down) this.state = 'normal';
        break;
      }
      case 'swing': {
        const c = this.swing;
        if (dir) { c.pump(dir, dt); this.facing = dir; }
        const tip = c.tip();
        this.x = tip.x - this.w / 2; this.y = tip.y - 6;
        if (this.buffer > 0) {
          this.buffer = 0;
          const v = c.release();
          this.vx = v.x; this.vy = Math.min(v.y, 0) - 230; this.jumpCut = true;
          this.state = 'normal'; this.swing = null; this.swingCd = true;
          setTimeout(() => (this.swingCd = false), 350);
          A.play('jump');
        }
        break;
      }
      case 'swim': {
        this.vx = U.approach(this.vx, dir * C.SWIM_MAX, 520 * dt);
        if (dir) this.facing = dir;
        if (up) this.vy = U.approach(this.vy, -C.SWIM_MAX, 620 * dt);
        else if (down) this.vy = U.approach(this.vy, C.SWIM_MAX, 620 * dt);
        else this.vy += C.SWIM_GRAV * dt;
        const atSurface = !headWet;
        if (atSurface && !down && this.vy > 0) this.vy = U.approach(this.vy, 0, 1400 * dt);
        if (this.buffer > 0) {
          this.buffer = 0;
          if (atSurface) { this.vy = -C.JUMP_V * 0.9; this.jumpCut = false; A.play('splash'); g.fx.splash(this.cx, this.y + 6); }
          else { this.vy = -C.SWIM_STROKE; A.play('stroke'); g.fx.bubbles(this.cx, this.y + 4, 3); }
        }
        this.vy = U.clamp(this.vy, -C.JUMP_V, 130);
        GC.Phys.move(this, dt, L);
        if (!this.wet(L, this.cx, this.y + this.h * 0.5)) { this.state = 'normal'; if (this.vy > 0) this.vy = 0; }
        else if (dir && this.climbableAt(L, dir).any && up) { this.state = 'climb'; this.climbSide = dir; this.vy = 0; }
        // fôlego
        if (headWet) {
          this.breath -= dt / (g.save.allies.capivara ? 2 : 1);
          if (Math.random() < 0.04) g.fx.bubbles(this.cx + this.facing * 4, this.y + 4, 1);
          if (this.breath <= 0) { this.breath = 2.5; this.hurt(1, null, g, 'Sem fôlego! Volte à superfície.'); }
        }
        // reabastecer o cantil em água limpa
        if (wetT === GC.T.WATER) g.water = Math.min(C.WATER_TANK, g.water + C.WATER_REFILL * dt);
        break;
      }
    }
    if (!this.wet(L, this.cx, this.y + 3)) this.breath = Math.min(C.BREATH, this.breath + dt * 3);

    this.useTools(dt, g, dir, up, down);

    // interação e aliados
    if (!lock && (I.pressed('interact') || (I.pressed('up') && this.state === 'normal' && this.onGround))) g.interact();
    if (!lock && I.pressed('ally')) g.useAlly();

    // registro de posição segura para quedas em abismos
    this.safeT -= dt;
    if (this.state === 'normal' && this.onGround && !wetT && this.safeT <= 0 && this.invuln <= 0) {
      const l = L.at(this.x + 1, this.bottom + 2), r = L.at(this.x + this.w - 1, this.bottom + 2);
      if (GC.TP[l].solid && GC.TP[r].solid) { this.lastSafe = { x: this.x, y: this.y }; this.safeT = 0.25; }
    }
    if (this.y > L.pxH + 24) g.pitFall();

    // imobilidade (para observação da natureza)
    const still = Math.abs(this.vx) < 8 && (this.onGround || this.state === 'swim') && this.state !== 'slide';
    this.stillT = still ? this.stillT + dt : 0;
    this.runT = Math.abs(this.vx) > C.SNEAK_MAX + 12 ? this.runT + dt : 0;
  }

  dropThroughSync() { /* física lê this.dropThrough diretamente */ }

  enterSwim(g) {
    if (this.state === 'swim') return;
    if (this.vy > 120) { GC.Audio.play('splash'); g.fx.splash(this.cx, this.y + this.h * 0.4); }
    this.state = 'swim';
    this.vy *= 0.35;
  }
  startSlide(dir) {
    this.state = 'slide';
    this.slideT = GC.CFG.SLIDE_TIME;
    this.facing = dir;
    this.vx = dir * Math.max(Math.abs(this.vx), GC.CFG.SLIDE_SPEED * (this.onSlope ? 0.7 : 1));
    this.setHeight(12);
    GC.Audio.play('land');
  }
  endSlide(L, force) {
    if (!force && GC.Phys.ceilingBlocked(this, L, 22)) { this.setHeight(14); this.crouch = true; this.state = 'normal'; return; }
    this.setHeight(22); this.crouch = false;
    this.state = 'normal';
  }

  useTools(dt, g, dir, up, down) {
    const I = GC.Input, C = GC.CFG, A = GC.Audio;
    const lock = g.inputLocked;
    if (!lock && I.pressed('swap')) g.swapTool();
    const canUse = (this.state === 'normal' || (this.state === 'swim' && !this.wet(g.level, this.cx, this.y + 3))) && !lock;
    this.aim = up ? 'up' : (down && !this.onGround ? 'down' : 'fwd');
    const tool = g.tool;
    if (tool === 'seed') {
      if (canUse && I.down('tool') && this.seedCd <= 0) {
        this.seedCd = C.SEED_COOLDOWN;
        const f = this.facing;
        let vx = 330 * f, vy = -58;
        if (this.aim === 'up') { vx = 260 * f; vy = -205; }
        if (this.aim === 'down') { vx = 235 * f; vy = 230; }
        const oy = this.aim === 'up' ? 16 : this.aim === 'down' ? 10 : 13;
        g.addProjectile(new GC.Seed(g, this.cx + f * 10, this.bottom - oy, vx, vy));
        this.firingT = 0.1; this.toolUsedT = 0;
        A.play('seed');
      }
      if (this.spraying) { this.spraying = false; A.spray(false); }
    } else if (tool === 'water') {
      const want = canUse && I.down('tool');
      if (want && g.water > 0) {
        if (!this.spraying) { this.spraying = true; A.spray(true); }
        g.water = Math.max(0, g.water - C.WATER_USE * dt);
        this.sprayT -= dt;
        this.toolUsedT = 0;
        while (this.sprayT <= 0) {
          this.sprayT += 0.03;
          const f = this.facing;
          let ang = this.aim === 'up' ? -0.85 : this.aim === 'down' ? 0.7 : -0.12;
          ang += (Math.random() - 0.5) * 0.22;
          const sp = 250 + Math.random() * 50;
          g.addProjectile(new GC.Droplet(g, this.cx + f * 9, this.bottom - (this.aim === 'up' ? 16 : 13), Math.cos(ang) * sp * f, Math.sin(ang) * sp));
        }
      } else {
        if (this.spraying) { this.spraying = false; A.spray(false); }
        if (want && g.water <= 0 && I.pressed('tool')) { A.play('deny'); g.toast('Cantil vazio. Reabasteça em água limpa.'); }
      }
    }
  }

  hurt(n, fromX, g, msg) {
    if (this.invuln > 0 || this.state === 'dead' || g.victory) return false;
    g.hearts -= n;
    this.invuln = GC.CFG.INVULN; this.flash = 0.12;
    GC.Audio.play('hurt');
    g.shake(4, 0.2);
    if (msg) g.toast(msg);
    if (fromX !== null && fromX !== undefined && this.state !== 'swing') {
      const s = this.cx < fromX ? -1 : 1;
      if (this.state === 'climb' || this.state === 'vine') this.state = 'normal';
      if (this.state === 'slide') this.endSlide(g.level);
      this.vx = s * 170; this.vy = this.state === 'swim' ? -60 : -230;
    }
    if (g.hearts <= 0) this.die(g);
    return true;
  }

  die(g) {
    this.state = 'dead'; this.deadT = 1.4; this.vx = 0; this.vy = 0;
    if (this.spraying) { this.spraying = false; GC.Audio.spray(false); }
    g.fx.leaves(this.cx, this.cy, 16);
    g.save.stats.deaths++;
  }

  // escolhe a animação da folha conforme o estado (a lógica de movimento não muda)
  animFor(g) {
    const C = GC.CFG;
    if (this.state === 'dead') return ['death', 1.4 - this.deadT];
    if (g.victory) return ['victory', this.t];
    if (this.invuln > C.INVULN - 0.35) return ['hurt', this.t];
    switch (this.state) {
      case 'slide': return ['slide', this.t];
      case 'climb': case 'vine': return ['climb', this.animT];
      case 'swing': return ['jump', this.t];
      case 'swim': return ['swim', this.animT];
    }
    if (this.firingT > 0 || this.spraying) return ['tool', this.spraying ? 0.2 : 0.21 - this.firingT * 2];
    if (this.onGround) {
      if (this.crouch) return ['crouch', Math.abs(this.vx) > 8 ? this.animT : 0];
      if (Math.abs(this.vx) > 100) return ['run', this.animT];
      if (Math.abs(this.vx) > 10) return ['walk', this.animT];
      return ['idle', this.t];
    }
    return [this.vy < 0 ? 'jump' : 'fall', this.t];
  }

  draw(ctx, cam, g) {
    if (this.invuln > 0 && this.flash <= 0 && this.state !== 'dead' && Math.floor(this.invuln * 14) % 2 === 0) return;
    const [anim, t] = this.animFor(g);
    const opt = { white: this.flash > 0 };
    if (anim === 'tool') opt.frame = this.spraying ? 2 : (this.firingT > 0.05 ? 1 : 2);
    GC.Sheets.draw(ctx, this.char, anim, t, this.cx - cam.x, this.bottom - cam.y + (this.state === 'swim' ? 4 : 0), this.facing < 0, opt);
    const cx = this.cx - cam.x, by = this.bottom - cam.y;
    if (this.netT > 0) {
      ctx.strokeStyle = '#d8c89a'; ctx.lineWidth = 1;
      const x0 = Math.round(cx) - 9, y0 = Math.round(by) - 24;
      for (let i = 0; i <= 18; i += 3) { ctx.beginPath(); ctx.moveTo(x0 + i + 0.5, y0); ctx.lineTo(x0 + i + 0.5, y0 + 24); ctx.stroke(); }
      for (let j = 0; j <= 24; j += 4) { ctx.beginPath(); ctx.moveTo(x0, y0 + j + 0.5); ctx.lineTo(x0 + 18, y0 + j + 0.5); ctx.stroke(); }
    }
  }
};
