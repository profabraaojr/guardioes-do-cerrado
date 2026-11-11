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
      if (!d) continue;
      const sx = tx * S - ox, sy = ty * S - oy;
      const tex = GC.Tiles.get(this.theme[tx]);
      if (d === GC.D.CAVE) ctx.drawImage(tex.cave[GC.U.hash(tx, ty) < 0.5 ? 0 : 1], sx, sy);
      else if (d === GC.D.ART) ctx.drawImage(tex.art[(GC.U.hash(tx, ty, 3) * 3) | 0], sx, sy);
      else if (d === GC.D.FALLS) {
        ctx.fillStyle = 'rgba(170,215,240,0.78)'; ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (let i = 0; i < 4; i++) {
          const lx = (i * 4 + ((tx * 7) % 3)) % S;
          const off = ((time * 160 + i * 23 + tx * 31) % 32) - 16;
          ctx.fillRect(sx + lx, sy + off, 1, 9);
        }
        ctx.fillStyle = 'rgba(90,150,200,0.5)'; ctx.fillRect(sx + ((tx * 5) % 13), sy, 2, S);
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
      switch (t) {
        case T.GRASS:
          ctx.drawImage(tex.dirt[v4], sx, sy);
          if (upOpen) ctx.drawImage(tex.grassTop[v4], sx, sy);
          break;
        case T.DIRT: ctx.drawImage(tex.dirt[v4], sx, sy); break;
        case T.ROCK: ctx.drawImage(tex.rock[v4], sx, sy); if (upOpen) { ctx.fillStyle = GC.THEMES[this.theme[tx]].rock[1]; ctx.fillRect(sx, sy, S, 1); } break;
        case T.CLIFF: ctx.drawImage(tex.cliff[v4], sx, sy); if (upOpen) ctx.drawImage(tex.grassTop[v4], sx, sy - 1); break;
        case T.SAND: ctx.drawImage(tex.sand[v2], sx, sy); break;
        case T.DEGRADED: ctx.drawImage(tex.degraded[v2], sx, sy); break;
        case T.MOUND: ctx.drawImage(tex.mound[v2], sx, sy); break;
        case T.PLANK: ctx.drawImage(tex.plank[0], sx, sy); break;
        case T.BRANCH: ctx.drawImage(tex.branch[0], sx, sy); break;
        case T.VINE: ctx.drawImage(tex.vine[v2], sx, sy); break;
        case T.FAKE: {
          const near = reveal > 0;
          ctx.globalAlpha = near ? 0.35 : 1;
          ctx.drawImage(tex.rock[v4], sx, sy);
          ctx.globalAlpha = 1;
          if (near) {
            ctx.fillStyle = 'rgba(255,230,120,' + (0.5 + 0.5 * Math.sin(time * 8 + tx + ty)) + ')';
            ctx.fillRect(sx + ((tx * 5 + (time * 10 | 0)) % 14), sy + ((ty * 7) % 14), 2, 2);
            ctx.strokeStyle = 'rgba(255,220,100,0.6)'; ctx.strokeRect(sx + 0.5, sy + 0.5, S - 1, S - 1);
          }
          continue;
        }
        case T.SLOPE_R: case T.SLOPE_L: {
          const g = GC.THEMES[this.theme[tx]].grass;
          for (let i = 0; i < S; i++) {
            const h = t === T.SLOPE_R ? i + 1 : S - i;
            ctx.drawImage(tex.dirt[v4], i, S - h, 1, h, sx + i, sy + S - h, 1, h);
            ctx.fillStyle = g[0]; ctx.fillRect(sx + i, sy + S - h, 1, 3);
            ctx.fillStyle = g[1]; ctx.fillRect(sx + i, sy + S - h, 1, 1);
          }
          continue;
        }
      }
      // contornos onde o tile encontra o vazio
      if (TP[t].solid) {
        const solidN = (nx, ny) => { const n = this.tile(nx, ny); return TP[n].solid || TP[n].slope || n === T.FAKE; };
        ctx.fillStyle = 'rgba(20,10,10,0.45)';
        if (!solidN(tx - 1, ty)) ctx.fillRect(sx, sy, 1, S);
        if (!solidN(tx + 1, ty)) ctx.fillRect(sx + S - 1, sy, 1, S);
        if (!solidN(tx, ty + 1)) ctx.fillRect(sx, sy + S - 1, S, 1);
      }
    }
  }

  renderWater(ctx, cam, time) {
    const S = 16, T = GC.T;
    const x0 = Math.max(0, Math.floor(cam.x / S)), x1 = Math.min(this.w - 1, Math.floor((cam.x + GC.CFG.W) / S));
    const y0 = Math.max(0, Math.floor(cam.y / S)), y1 = Math.min(this.h - 1, Math.floor((cam.y + GC.CFG.H) / S));
    const ox = Math.round(cam.x), oy = Math.round(cam.y);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = this.map[ty * this.w + tx];
      if (t !== T.WATER && t !== T.POLLUTED) continue;
      const sx = tx * S - ox, sy = ty * S - oy;
      const up = this.tile(tx, ty - 1);
      const surface = up !== T.WATER && up !== T.POLLUTED && !GC.TP[up].solid;
      if (t === T.WATER) {
        ctx.fillStyle = 'rgba(46,128,170,0.5)'; ctx.fillRect(sx, sy, S, S);
        if (surface) {
          for (let i = 0; i < S; i++) {
            const wy = Math.round(Math.sin((tx * S + i) * 0.35 + time * 3) * 1.2);
            ctx.fillStyle = 'rgba(190,235,255,0.85)'; ctx.fillRect(sx + i, sy + 1 + wy, 1, 1);
            ctx.fillStyle = 'rgba(120,200,235,0.45)'; ctx.fillRect(sx + i, sy + 2 + wy, 1, 3);
          }
        } else if (GC.U.hash(tx, ty, (time * 2) | 0) < 0.08) {
          ctx.fillStyle = 'rgba(200,240,255,0.5)'; ctx.fillRect(sx + 6, sy + 8, 2, 1);
        }
      } else {
        ctx.fillStyle = 'rgba(70,52,48,0.86)'; ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = 'rgba(120,60,120,0.35)'; ctx.fillRect(sx, sy + ((tx + (time * 4 | 0)) % 12), S, 2);
        if (surface) {
          ctx.fillStyle = 'rgba(160,110,170,0.8)'; ctx.fillRect(sx, sy + 1, S, 1);
          ctx.fillStyle = 'rgba(90,160,140,0.6)'; ctx.fillRect(sx + ((time * 9 + tx * 5) % 12 | 0), sy + 2, 4, 1);
        }
        const b = (time * 1.5 + GC.U.hash(tx, ty) * 3) % 1;
        ctx.fillStyle = 'rgba(150,130,90,0.8)'; ctx.fillRect(sx + ((tx * 7) % 12), sy + 14 - b * 14, 2, 2);
      }
    }
  }
};
