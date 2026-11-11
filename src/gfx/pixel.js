// Kit de desenho em pixel (sem suavização): elipses, cápsulas, polígonos e contorno.
// Usado para gerar spritesheets e fundos em densidade dupla.
// Desenha direto num buffer de memória (Uint32) e só copia para o canvas quando a
// imagem é usada: muito mais rápido que uma chamada de desenho por pixel.
GC.Pix = (function () {
  const cache = {};
  // converte '#rrggbb', '#rgb', 'rgb()' e 'rgba()' em [valor Uint32 (ABGR), alfa 0-255]
  function parse(c) {
    let v = cache[c];
    if (v) return v;
    let r = 0, g = 0, b = 0, a = 255;
    if (c[0] === '#') {
      const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      const m = c.match(/[\d.]+/g).map(Number);
      [r, g, b] = m; if (m.length > 3) a = Math.round(m[3] * 255);
    }
    v = cache[c] = [((a << 24) | (b << 16) | (g << 8) | r) >>> 0, a, r, g, b];
    return v;
  }

  return class Pix {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.buf = new Uint32Array(w * h);
      this._c = null; this.dirty = true;
    }
    // canvas pronto para uso (copia o buffer quando houve alteração)
    get c() {
      if (!this._c) { const [c, x] = GC.U.makeCanvas(this.w, this.h); this._c = c; this._x = x; }
      if (this.dirty) { this._x.putImageData(new ImageData(new Uint8ClampedArray(this.buf.buffer), this.w, this.h), 0, 0); this.dirty = false; }
      return this._c;
    }
    set(x, y, col) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x;
      if (col[1] === 255) { this.buf[i] = col[0]; return; }
      if (col[1] === 0) return;
      const d = this.buf[i], da = d >>> 24, sa = col[1] / 255, ia = 1 - sa;
      if (!da) { this.buf[i] = col[0]; return; }
      const r = col[2] * sa + (d & 255) * ia, g = col[3] * sa + ((d >>> 8) & 255) * ia, b = col[4] * sa + ((d >>> 16) & 255) * ia;
      const a = Math.min(255, col[1] + da * ia);
      this.buf[i] = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
    }
    rect(x, y, w, h, c) {
      const col = parse(c); this.dirty = true;
      const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(this.w, Math.round(x) + Math.round(w)), y1 = Math.min(this.h, Math.round(y) + Math.round(h));
      for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.set(i, j, col);
    }
    px(x, y, c) { this.dirty = true; this.set(Math.round(x), Math.round(y), parse(c)); }
    ellipse(cx, cy, rx, ry, c) {
      if (rx <= 0 || ry <= 0) return;
      const col = parse(c); this.dirty = true;
      const y0 = Math.max(0, Math.floor(cy - ry - 1)), y1 = Math.min(this.h - 1, Math.ceil(cy + ry + 1));
      for (let y = y0; y <= y1; y++) {
        const dy = (y + 0.5 - cy) / ry, q = 1 - dy * dy;
        if (q < 0) continue;
        const half = Math.sqrt(q) * rx;
        const xa = Math.max(0, Math.ceil(cx - half - 0.5)), xb = Math.min(this.w - 1, Math.floor(cx + half - 0.5));
        for (let x = xa; x <= xb; x++) this.set(x, y, col);
      }
    }
    circle(cx, cy, r, c) { this.ellipse(cx, cy, r, r, c); }
    // segmento grosso com extremidades arredondadas e raio interpolado
    capsule(x1, y1, x2, y2, r1, c, r2 = r1) {
      const col = parse(c); this.dirty = true;
      const R = Math.max(r1, r2);
      const xa = Math.max(0, Math.floor(Math.min(x1, x2) - R - 1)), xb = Math.min(this.w - 1, Math.ceil(Math.max(x1, x2) + R + 1));
      const ya = Math.max(0, Math.floor(Math.min(y1, y2) - R - 1)), yb = Math.min(this.h - 1, Math.ceil(Math.max(y1, y2) + R + 1));
      const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
        const px = x + 0.5, py = y + 0.5;
        let t = ((px - x1) * dx + (py - y1) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = x1 + dx * t - px, qy = y1 + dy * t - py, r = r1 + (r2 - r1) * t;
        if (qx * qx + qy * qy <= r * r) this.set(x, y, col);
      }
    }
    poly(pts, c) {
      const col = parse(c); this.dirty = true;
      let ya = 1e9, yb = -1e9;
      for (const [, y] of pts) { ya = Math.min(ya, y); yb = Math.max(yb, y); }
      // varredura por linhas: cruzamentos das arestas
      for (let y = Math.max(0, Math.floor(ya)); y <= Math.min(this.h - 1, Math.ceil(yb)); y++) {
        const py = y + 0.5, xs = [];
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py)) xs.push((xj - xi) * (py - yi) / (yj - yi) + xi);
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(this.w - 1, Math.floor(xs[k + 1] - 0.5)); x++) this.set(x, y, col);
        }
      }
    }
    line(x1, y1, x2, y2, c) {
      const col = parse(c); this.dirty = true;
      const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
      for (let i = 0; i <= n; i++) this.set(Math.round(x1 + (x2 - x1) * i / n), Math.round(y1 + (y2 - y1) * i / n), col);
    }
    // contorno escuro de 1 px em volta de tudo que é opaco (marca de estilo)
    outline(color = '#1a1220') {
      const W = this.w, H = this.h, B = this.buf, col = parse(color);
      const a = (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? false : (B[j * W + i] >>> 24) > 40;
      const out = [];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (!a(i, j) && (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1))) out.push(i, j);
      for (let k = 0; k < out.length; k += 2) this.set(out[k], out[k + 1], col);
      this.dirty = true;
    }
    // luz de cima: clareia o primeiro pixel interno de cada coluna (volume)
    rimLight(color = 'rgba(255,255,255,0.28)') {
      const W = this.w, H = this.h, B = this.buf, col = parse(color);
      for (let i = 0; i < W; i++) for (let j = 1; j < H; j++) {
        if ((B[j * W + i] >>> 24) > 40 && (B[(j - 1) * W + i] >>> 24) <= 40) { if (j + 1 < H) this.set(i, j + 1, col); break; }
      }
      this.dirty = true;
    }
  };
})();
