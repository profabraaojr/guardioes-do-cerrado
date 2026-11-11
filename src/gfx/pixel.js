// Kit de desenho em pixel (sem suavização): elipses, cápsulas, polígonos e contorno.
// Usado para gerar spritesheets em densidade dupla (1 pixel lógico = 2 pixels de arte).
GC.Pix = class Pix {
  constructor(w, h) {
    [this.c, this.x] = GC.U.makeCanvas(w, h);
    this.w = w; this.h = h;
  }
  rect(x, y, w, h, c) { this.x.fillStyle = c; this.x.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  px(x, y, c) { this.x.fillStyle = c; this.x.fillRect(Math.round(x), Math.round(y), 1, 1); }
  ellipse(cx, cy, rx, ry, c) {
    this.x.fillStyle = c;
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.x.fillRect(x, y, 1, 1);
    }
  }
  circle(cx, cy, r, c) { this.ellipse(cx, cy, r, r, c); }
  // segmento grosso com extremidades arredondadas e raio interpolado
  capsule(x1, y1, x2, y2, r1, c, r2 = r1) {
    this.x.fillStyle = c;
    const R = Math.max(r1, r2);
    const xa = Math.floor(Math.min(x1, x2) - R - 1), xb = Math.ceil(Math.max(x1, x2) + R + 1);
    const ya = Math.floor(Math.min(y1, y2) - R - 1), yb = Math.ceil(Math.max(y1, y2) + R + 1);
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const px = x + 0.5, py = y + 0.5;
      let t = ((px - x1) * dx + (py - y1) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = x1 + dx * t - px, qy = y1 + dy * t - py, r = r1 + (r2 - r1) * t;
      if (qx * qx + qy * qy <= r * r) this.x.fillRect(x, y, 1, 1);
    }
  }
  poly(pts, c) {
    this.x.fillStyle = c;
    let xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9;
    for (const [x, y] of pts) { xa = Math.min(xa, x); xb = Math.max(xb, x); ya = Math.min(ya, y); yb = Math.max(yb, y); }
    for (let y = Math.floor(ya); y <= Math.ceil(yb); y++) for (let x = Math.floor(xa); x <= Math.ceil(xb); x++) {
      const px = x + 0.5, py = y + 0.5; let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
      }
      if (ins) this.x.fillRect(x, y, 1, 1);
    }
  }
  line(x1, y1, x2, y2, c) {
    this.x.fillStyle = c;
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 0; i <= n; i++) this.x.fillRect(Math.round(x1 + (x2 - x1) * i / n), Math.round(y1 + (y2 - y1) * i / n), 1, 1);
  }
  // contorno escuro de 1 px em volta de tudo que é opaco (marca de estilo)
  outline(color = '#1a1220') {
    const img = this.x.getImageData(0, 0, this.w, this.h), d = img.data, W = this.w, H = this.h;
    const a = (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? 0 : d[(j * W + i) * 4 + 3] > 40;
    const out = [];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (!a(i, j) && (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1))) out.push(i, j);
    this.x.fillStyle = color;
    for (let k = 0; k < out.length; k += 2) this.x.fillRect(out[k], out[k + 1], 1, 1);
  }
  // luz de cima: clareia a primeira linha opaca de cada coluna (volume)
  rimLight(color = 'rgba(255,255,255,0.28)') {
    const img = this.x.getImageData(0, 0, this.w, this.h), d = img.data, W = this.w, H = this.h;
    this.x.fillStyle = color;
    for (let i = 0; i < W; i++) for (let j = 1; j < H; j++) {
      const k = (j * W + i) * 4, up = ((j - 1) * W + i) * 4;
      if (d[k + 3] > 40 && d[up + 3] <= 40) { this.x.fillRect(i, j + 1, 1, 1); break; }
    }
  }
};
