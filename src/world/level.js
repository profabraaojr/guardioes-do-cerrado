// Estrutura de fase: mapa de tiles, camada decorativa, zonas e entidades.
// As fases são descritas por um construtor (DSL) em world/levels/*.js.
GC.Levels = GC.Levels || {};

GC.Level = class Level {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.w = def.width;
    this.h = def.height;
    this.map = new Uint8Array(this.w * this.h);
    this.deco = new Uint8Array(this.w * this.h);
    this.zones = [];
    this.spawns = [];
    this.darkRects = [];
    this.arena = null;
    this.start = { x: 4, y: 20 };
    this.theme = new Array(this.w).fill('rio');
    def.build(this.builder());
    this.zones.sort((a, b) => a.x0 - b.x0);
    for (let x = 0; x < this.w; x++) { const z = this.zoneAtTile(x); this.theme[x] = z ? z.theme : 'rio'; }
    // linha da superfície de cada coluna (só para o fundo de terra dos túneis)
    this.surface = new Int16Array(this.w).fill(this.h);
    for (let x = 0; x < this.w; x++) for (let y = 0; y < this.h; y++) if (GC.TP[this.map[y * this.w + x]].solid) { this.surface[x] = y; break; }
    this.pxW = this.w * 16;
    this.pxH = this.h * 16;
  }

  builder() {
    const L = this, T = GC.T;
    const inb = (x, y) => x >= 0 && y >= 0 && x < L.w && y < L.h;
    const B = {
      set(x, y, t) { if (inb(x, y)) L.map[y * L.w + x] = t; },
      fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) B.set(x, y, t); },
      ground(x0, x1, top, t = T.GRASS, under = T.DIRT) {
        for (let x = x0; x <= x1; x++) { B.set(x, top, t); for (let y = top + 1; y < L.h; y++) B.set(x, y, under); }
      },
      clear(x0, y0, x1, y1) { B.fill(x0, y0, x1, y1, T.EMPTY); },
      water(x0, y0, x1, y1, t = T.WATER) { B.fill(x0, y0, x1, y1, t); },
      deco(x0, y0, x1, y1, d) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) L.deco[y * L.w + x] = d; },
      // rampa descendo para a direita, a partir do topo (x,y)
      slopeDown(x, y, n) { for (let i = 0; i < n; i++) { B.set(x + i, y + i, T.SLOPE_L); for (let yy = y + i + 1; yy < L.h; yy++) B.set(x + i, yy, T.DIRT); } },
      // rampa subindo para a direita; (x,y) é o tile mais baixo
      slopeUp(x, y, n) { for (let i = 0; i < n; i++) { B.set(x + i, y - i, T.SLOPE_R); for (let yy = y - i + 1; yy < L.h; yy++) B.set(x + i, yy, T.DIRT); } },
      zone(o) { L.zones.push(Object.assign({ theme: 'rio', music: 'cerrado', ambient: 'day' }, o)); },
      dark(x0, y0, x1, y1) { L.darkRects.push({ x: x0 * 16, y: y0 * 16, w: (x1 - x0 + 1) * 16, h: (y1 - y0 + 1) * 16 }); },
      // entidades: x em tiles; y é a linha do chão em que a entidade se apoia
      ent(type, x, y, o = {}) { L.spawns.push({ type, x: x * 16, y: y * 16, o }); },
      startAt(x, y) { L.start = { x: x * 16, y: y * 16 }; },
      arena(x0, x1, floor) { L.arena = { x0: x0 * 16, x1: (x1 + 1) * 16, floor: floor * 16, tx0: x0, tx1: x1 }; }
    };
    return B;
  }

  tile(tx, ty) {
    if (tx < 0 || tx >= this.w) return GC.T.ROCK;
    if (ty < 0 || ty >= this.h) return GC.T.EMPTY;
    return this.map[ty * this.w + tx];
  }
  set(tx, ty, t) { if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.map[ty * this.w + tx] = t; }
  decoAt(tx, ty) { return (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) ? 0 : this.deco[ty * this.w + tx]; }
  tp(tx, ty) { return GC.TP[this.tile(tx, ty)]; }
  at(px, py) { return this.tile(Math.floor(px / 16), Math.floor(py / 16)); }
  solidAt(px, py) { return GC.TP[this.at(px, py)].solid; }
  waterAt(px, py) { return GC.TP[this.at(px, py)].water; }
  zoneAtTile(tx) { let z = null; for (const zz of this.zones) if (tx >= zz.x0 && tx <= zz.x1) z = zz; return z; }
  zoneAt(px) { return this.zoneAtTile(Math.floor(px / 16)); }
  inDark(px, py) { return this.darkRects.some((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h); }

  // ——— Renderização ———
  renderBack(ctx, cam, time) {
    const S = 16, x0 = Math.max(0, Math.floor(cam.x / S)), x1 = Math.min(this.w - 1, Math.floor((cam.x + GC.CFG.W) / S));
    const y0 = Math.max(0, Math.floor(cam.y / S)), y1 = Math.min(this.h - 1, Math.floor((cam.y + GC.CFG.H) / S));
    const ox = Math.round(cam.x), oy = Math.round(cam.y);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const d = this.deco[ty * this.w + tx];
      const sx = tx * S - ox, sy = ty * S - oy;
      const tex = GC.Tiles.get(this.theme[tx]);
      if (!d && ty > this.surface[tx] && !GC.TP[this.map[ty * this.w + tx]].solid) {
        ctx.drawImage(tex.dirt[(GC.U.hash(tx, ty) * 4) | 0], sx, sy, S, S);
        ctx.fillStyle = 'rgba(28,10,6,0.62)'; ctx.fillRect(sx, sy, S, S);
        continue;
      }
      if (!d) continue;
      if (d === GC.D.CAVE) ctx.drawImage(tex.cave[GC.U.hash(tx, ty) < 0.5 ? 0 : 1], sx, sy, S, S);
      else if (d === GC.D.ART) ctx.drawImage(tex.art[(GC.U.hash(tx, ty, 3) * 3) | 0], sx, sy, S, S);
      else if (d === GC.D.FALLS) {
        // queda d'água: faixas animadas em meio pixel do mundo (1 px de arte)
        ctx.fillStyle = 'rgba(150,215,245,0.82)'; ctx.fillRect(sx, sy, S, S);
        for (let i = 0; i < 8; i++) {
          const lx = (i * 2 + ((tx * 7) % 3) * 0.5) % S;
          const off = ((time * 170 + i * 19 + tx * 31) % 32) - 16;
          ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.8)' : 'rgba(210,240,255,0.7)';
          ctx.fillRect(sx + lx, sy + off, 0.5, 7 + (i % 3) * 2);
        }
        ctx.fillStyle = 'rgba(60,130,190,0.45)'; ctx.fillRect(sx + ((tx * 5) % 13), sy, 1, S);
      }
    }
  }

  renderTiles(ctx, cam, time, reveal) {
    const S = 16, T = GC.T, TP = GC.TP;
    const x0 = Math.max(0, Math.floor(cam.x / S)), x1 = Math.min(this.w - 1, Math.floor((cam.x + GC.CFG.W) / S));
    const y0 = Math.max(0, Math.floor(cam.y / S)), y1 = Math.min(this.h - 1, Math.floor((cam.y + GC.CFG.H) / S));
    const ox = Math.round(cam.x), oy = Math.round(cam.y);
    const H = GC.U.hash;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = this.map[ty * this.w + tx];
      if (t === T.EMPTY || t === T.WATER || t === T.POLLUTED || t === T.BUSH || t === T.GATE) continue;
      const sx = tx * S - ox, sy = ty * S - oy;
      const tex = GC.Tiles.get(this.theme[tx]);
      const v4 = (H(tx, ty) * 4) | 0, v2 = v4 & 1;
      const up = this.tile(tx, ty - 1);
      const upOpen = !TP[up].solid && !TP[up].slope && up !== T.FAKE;
      const im = (img) => ctx.drawImage(img, sx, sy, S, S);
      switch (t) {
        case T.GRASS:
          im(upOpen ? tex.dirt[v4] : tex.dirt[v4]);
          if (upOpen) ctx.drawImage(tex.grassTop[v4], sx, sy - 2, S, 12);
          break;
        case T.DIRT: im(this.tile(tx, ty - 1) === T.GRASS && (ty * 7 + tx) % 3 === 0 ? tex.dirtTop[v2] : tex.dirt[v4]); break;
        case T.ROCK: im(tex.rock[v4]); if (upOpen) { ctx.fillStyle = GC.THEMES[this.theme[tx]].rock[1]; ctx.fillRect(sx, sy, S, 1); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(sx, sy, S, 0.5); } break;
        case T.CLIFF: im(tex.cliff[v4]); if (upOpen) ctx.drawImage(tex.grassTop[v4], sx, sy - 2, S, 12); break;
        case T.SAND: im(tex.sand[v2]); break;
        case T.CRACKED: im(tex.cracked[v2]); break;
        case T.DEGRADED: im(tex.degraded[v2]); break;
        case T.MOUND: im(tex.mound[v2]); break;
        case T.PLANK: im(tex.plank[0]); break;
        case T.BRANCH: im(tex.branch[0]); break;
        case T.VINE: im(tex.vine[v2]); break;
        case T.FAKE: {
          const near = reveal > 0;
          ctx.globalAlpha = near ? 0.35 : 1;
          im(tex.rock[v4]);
          ctx.globalAlpha = 1;
          if (near) {
            ctx.fillStyle = 'rgba(255,230,120,' + (0.5 + 0.5 * Math.sin(time * 8 + tx + ty)) + ')';
            ctx.fillRect(sx + ((tx * 5 + (time * 10 | 0)) % 14), sy + ((ty * 7) % 14), 2, 2);
            ctx.strokeStyle = 'rgba(255,220,100,0.6)'; ctx.lineWidth = 0.5; ctx.strokeRect(sx + 0.5, sy + 0.5, S - 1, S - 1);
          }
          continue;
        }
        case T.SLOPE_R: case T.SLOPE_L: {
          const g = GC.THEMES[this.theme[tx]].grass, TS = GC.Tiles.SIZE;
          for (let i = 0; i < TS; i++) {
            const h = t === T.SLOPE_R ? i + 1 : TS - i;
            ctx.drawImage(tex.dirt[v4], i, TS - h, 1, h, sx + i / 2, sy + (TS - h) / 2, 0.5, h / 2);
            ctx.fillStyle = g[2]; ctx.fillRect(sx + i / 2, sy + (TS - h) / 2, 0.5, 3.5);
            ctx.fillStyle = g[0]; ctx.fillRect(sx + i / 2, sy + (TS - h) / 2, 0.5, 2.5);
            ctx.fillStyle = g[1]; ctx.fillRect(sx + i / 2, sy + (TS - h) / 2, 0.5, 1);
          }
          continue;
        }
      }
      // contornos onde o tile encontra o vazio
      if (TP[t].solid) {
        const solidN = (nx, ny) => { const n = this.tile(nx, ny); return TP[n].solid || TP[n].slope || n === T.FAKE; };
        ctx.fillStyle = 'rgba(30,12,10,0.55)';
        if (!solidN(tx - 1, ty)) ctx.fillRect(sx, sy, 0.5, S);
        if (!solidN(tx + 1, ty)) ctx.fillRect(sx + S - 0.5, sy, 0.5, S);
        if (!solidN(tx, ty + 1)) ctx.fillRect(sx, sy + S - 0.5, S, 0.5);
        // sombra suave sob a borda de grama (volume, sem escurecer a tela)
        if (t !== T.GRASS && !solidN(tx, ty - 1) === false && this.tile(tx, ty - 1) === T.GRASS) { ctx.fillStyle = 'rgba(40,10,0,0.12)'; ctx.fillRect(sx, sy, S, 2); }
      }
    }
  }

  renderWater(ctx, cam, time) {
    const S = 16, T = GC.T, K = GC.CFG.SCALE;
    const x0 = Math.max(0, Math.floor(cam.x / S)), x1 = Math.min(this.w - 1, Math.floor((cam.x + GC.CFG.W) / S));
    const y0 = Math.max(0, Math.floor(cam.y / S)), y1 = Math.min(this.h - 1, Math.floor((cam.y + GC.CFG.H) / S));
    const ox = Math.round(cam.x), oy = Math.round(cam.y);
    const isW = (t) => t === T.WATER || t === T.POLLUTED;
    // 1) reflexo: espelha o cenário logo acima de cada trecho de superfície limpa
    for (let ty = y0; ty <= y1; ty++) {
      let tx = x0;
      while (tx <= x1) {
        const t = this.map[ty * this.w + tx];
        const up = this.tile(tx, ty - 1);
        if (t !== T.WATER || isW(up) || GC.TP[up].solid) { tx++; continue; }
        let end = tx;
        while (end + 1 <= x1 && this.map[ty * this.w + end + 1] === T.WATER && !isW(this.tile(end + 1, ty - 1)) && !GC.TP[this.tile(end + 1, ty - 1)].solid) end++;
        let depth = 0; while (depth < 3 && this.tile(tx, ty + depth) === T.WATER) depth++;
        const surfY = (ty * S - oy) * K, h = Math.min(depth * S, 26) * K, xs = (tx * S - ox) * K, w = (end - tx + 1) * S * K;
        if (surfY - h > 0 && w > 0) {
          // uma única cópia da faixa acima da superfície; as fatias saem do canvas auxiliar
          const R = Level.reflectBuf || (Level.reflectBuf = GC.U.makeCanvas(GC.CFG.W * K + 64, 64));
          const bw = Math.min(w, R[0].width), bh = Math.min(h, R[0].height);
          R[1].clearRect(0, 0, bw, bh);
          R[1].drawImage(ctx.canvas, xs, surfY - 2 - bh, bw, bh, 0, 0, bw, bh);
          ctx.save();
          ctx.setTransform(1, 0, 0, -1, 0, surfY * 2);
          ctx.globalAlpha = 0.26;
          for (let r = 0; r < bh; r += 4) {
            const wob = Math.round(Math.sin(r * 0.18 + time * 3) * (1 + r / 24));
            ctx.drawImage(R[0], 0, bh - r - 4, bw, 4, xs + wob, surfY - 2 - r - 4, bw, 4);
          }
          ctx.restore();
        }
        tx = end + 1;
      }
    }
    // 2) corpo d'água, espuma e brilhos
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = this.map[ty * this.w + tx];
      if (!isW(t)) continue;
      const sx = tx * S - ox, sy = ty * S - oy;
      const up = this.tile(tx, ty - 1);
      const surface = !isW(up) && !GC.TP[up].solid;
      let d = 0; while (d < 4 && isW(this.tile(tx, ty - d - 1))) d++;
      if (t === T.WATER) {
        ctx.fillStyle = ['rgba(48,150,210,0.42)', 'rgba(36,120,190,0.5)', 'rgba(28,96,168,0.58)', 'rgba(22,78,150,0.64)', 'rgba(18,64,130,0.7)'][Math.min(4, d)];
        ctx.fillRect(sx, sy, S, S);
        if (surface) {
          for (let i = 0; i < S * 2; i++) {
            const wy = Math.round(Math.sin((tx * S + i / 2) * 0.32 + time * 3.2) * 2) / 2;
            ctx.fillStyle = 'rgba(220,248,255,0.95)'; ctx.fillRect(sx + i / 2, sy + 0.5 + wy, 0.5, 1);
            ctx.fillStyle = 'rgba(140,215,245,0.5)'; ctx.fillRect(sx + i / 2, sy + 1.5 + wy, 0.5, 2);
          }
          const g = (time * 0.6 + tx * 0.37) % 1;
          if (g < 0.5) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(sx + ((tx * 5) % 12) + g * 4, sy + 4, 2, 0.5); }
        } else {
          // cáusticas suaves
          const c = Math.sin(time * 2 + tx * 1.7 + ty * 2.3);
          if (c > 0.6) { ctx.fillStyle = 'rgba(180,235,255,0.18)'; ctx.fillRect(sx + ((tx * 7 + ty * 3) % 10), sy + ((ty * 5) % 10), 4, 0.5); }
        }
      } else {
        ctx.fillStyle = 'rgba(78,56,52,0.88)'; ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = 'rgba(130,64,130,0.32)'; ctx.fillRect(sx, sy + ((tx + (time * 4 | 0)) % 12), S, 1.5);
        if (surface) {
          ctx.fillStyle = 'rgba(170,120,180,0.85)'; ctx.fillRect(sx, sy + 0.5, S, 1);
          ctx.fillStyle = 'rgba(90,180,150,0.65)'; ctx.fillRect(sx + ((time * 9 + tx * 5) % 12 | 0), sy + 1.5, 4, 0.5);
        }
        const bb = (time * 1.5 + GC.U.hash(tx, ty) * 3) % 1;
        ctx.fillStyle = 'rgba(160,140,96,0.85)'; ctx.fillRect(sx + ((tx * 7) % 12), sy + 14 - bb * 14, 1.5, 1.5);
      }
    }
  }
};
