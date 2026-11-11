// Flora do Cerrado e elementos de cenário em spritesheets (densidade dupla).
//   'trees'   128×160 · pequizeiro, ipê-amarelo, buriti, lobeira, cagaita (2 quadros de balanço)
//   'scenery'  32×32  · tufos, capim-dourado, arbustos retorcidos, flores, pedras, tufos de primeiro plano
(function () {
  const OUT = '#1e1424';
  const rnd = (seed) => GC.U.rng(seed);

  function trunk(P, x0, y0, x1, y1, w, bark, dark, light) {
    const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const t = i / n, nx = x0 + (x1 - x0) * t + Math.sin(t * 5 + x0) * 3, ny = y0 + (y1 - y0) * t;
      const ww = w * (1 - t * 0.45);
      P.capsule(px, py, nx, ny, ww, dark); P.capsule(px + 1, py, nx + 1, ny, ww - 1.4, bark); P.capsule(px + ww * 0.4, py, nx + ww * 0.4, ny, Math.max(0.6, ww * 0.25), light);
      px = nx; py = ny;
    }
    return [px, py];
  }
  function crown(P, cx, cy, blobs, cols, r, sway) {
    for (const [dx, dy, rx, ry] of blobs) P.ellipse(cx + dx + sway, cy + dy + 3, rx, ry, cols[2]);
    for (const [dx, dy, rx, ry] of blobs) P.ellipse(cx + dx + sway, cy + dy, rx - 1, ry - 1.5, cols[0]);
    for (const [dx, dy, rx, ry] of blobs) P.ellipse(cx + dx + sway - rx * 0.25, cy + dy - ry * 0.35, rx * 0.5, ry * 0.4, cols[1]);
    for (let i = 0; i < 60; i++) { const b = blobs[(r() * blobs.length) | 0]; P.px(cx + b[0] + sway + (r() - 0.5) * b[2] * 1.6, cy + b[1] + (r() - 0.5) * b[3] * 1.4, r() < 0.5 ? cols[1] : cols[2]); }
  }

  const TREE = {
    pequi(P, i) {
      const r = rnd(11), s = i ? 1 : 0;
      const top = trunk(P, 64, 158, 60, 92, 7, '#8a7a6a', '#5a4a3e', '#b0a090');
      trunk(P, 61, 112, 38, 88, 4, '#8a7a6a', '#5a4a3e', '#b0a090'); trunk(P, 62, 104, 88, 84, 4, '#8a7a6a', '#5a4a3e', '#b0a090');
      crown(P, 62, 74, [[-26, 10, 22, 14], [22, 8, 24, 15], [-4, -4, 28, 18], [-30, -8, 16, 11], [28, -10, 16, 11], [0, 16, 20, 10]], ['#3e8a34', '#6cb648', '#24602a'], r, s);
      for (const [dx, dy] of [[-18, 14], [10, 18], [24, 4], [-8, 6]]) { P.circle(62 + dx + s, 74 + dy, 3.4, '#9ab43a'); P.px(61 + dx + s, 72 + dy, '#d0e070'); }
      void top;
    },
    ipe(P, i) {
      const r = rnd(23), s = i ? 1 : 0;
      trunk(P, 64, 158, 66, 96, 6, '#6a4a34', '#44301e', '#8e6a4c');
      trunk(P, 65, 118, 40, 90, 3.5, '#6a4a34', '#44301e', '#8e6a4c'); trunk(P, 66, 108, 92, 86, 3.5, '#6a4a34', '#44301e', '#8e6a4c');
      crown(P, 66, 74, [[-26, 8, 20, 13], [24, 6, 22, 14], [-2, -6, 26, 16], [-34, -6, 13, 10], [34, -8, 13, 10], [2, 14, 18, 10]], ['#f2c230', '#fde27a', '#c8901a'], r, s);
      for (let k = 0; k < 24; k++) P.px(30 + r() * 72 + s, 50 + r() * 44, '#fff6c0');
    },
    buriti(P, i) {
      const s = i ? 1 : 0;
      for (let y = 158; y > 40; y -= 1) { P.rect(61, y, 7, 1, '#7a5a3a'); }
      P.rect(61, 40, 2, 118, '#9a7a56'); for (let y = 150; y > 44; y -= 7) P.rect(61, y, 7, 1, '#5a3e24');
      P.ellipse(58, 44, 5, 7, '#b85a24'); P.ellipse(70, 46, 5, 7, '#b85a24'); P.px(56, 42, '#e08a4a'); P.px(68, 44, '#e08a4a');
      for (let k = 0; k < 15; k++) {
        const a = Math.PI * (0.02 + k * 0.069), col = k % 2 ? '#3e9a3a' : '#5abc4a';
        for (let j = 0; j < 44; j++) P.rect(64 + Math.cos(a) * j * 1.25 + s * (j / 44), 36 - Math.sin(a) * j * 0.8 + j * j * 0.022, 2, 2, j > 36 ? '#2e7a2e' : col);
      }
    },
    lobeira(P, i) {
      const r = rnd(41), s = i ? 1 : 0;
      trunk(P, 64, 158, 63, 128, 4, '#6a5a44', '#44382a', '#8e7e64');
      crown(P, 63, 118, [[-16, 4, 16, 11], [14, 2, 17, 12], [0, -8, 18, 12], [0, 10, 14, 8]], ['#7a9a6a', '#a8c08e', '#566e4a'], r, s);
      for (const [dx, dy] of [[-10, 8], [12, 10], [2, 2]]) { P.circle(63 + dx + s, 118 + dy, 5, '#5a9a3a'); P.px(61 + dx + s, 116 + dy, '#a8d870'); }
    },
    cagaita(P, i) {
      const r = rnd(57), s = i ? 1 : 0;
      trunk(P, 64, 158, 62, 104, 5, '#7a5a40', '#4e3826', '#a07e5c');
      trunk(P, 62, 124, 44, 102, 3, '#7a5a40', '#4e3826', '#a07e5c');
      crown(P, 62, 90, [[-20, 6, 18, 12], [18, 4, 20, 12], [0, -6, 22, 14], [0, 12, 16, 8]], ['#58b048', '#8cd66a', '#357a2e'], r, s);
      for (const [dx, dy] of [[-14, 10], [8, 14], [20, 0], [-4, 0], [12, -6]]) { P.circle(62 + dx + s, 90 + dy, 2.6, '#f0d23a'); P.px(61 + dx + s, 89 + dy, '#fff4a0'); }
    }
  };
  GC.Sheets.define('trees', {
    fw: 128, fh: 160, pivot: [64, 158], cols: 4,
    anims: Object.fromEntries(Object.keys(TREE).map((k) => [k, { n: 2, fps: 1.2 }])),
    frame: (P, kind, i) => { TREE[kind](P, i); P.outline(OUT); }
  });

  const SCN = {
    tuft(P, i) { const r = rnd(70 + i); for (let k = 0; k < 9; k++) { const x = 9 + k * 1.8 + r() * 2, h = 6 + r() * 9; P.line(x, 31, x + (r() - 0.5) * 6, 31 - h, k % 2 ? '#4a9a32' : '#7ac84a'); } },
    capim(P, i) { const r = rnd(80 + i); for (let k = 0; k < 7; k++) { const x = 8 + k * 2.5 + r() * 2, h = 14 + r() * 12, lx = x + (r() - 0.5) * 8; P.line(x, 31, lx, 31 - h, '#c8a43a'); P.circle(lx, 31 - h, 1.6, '#f2d050'); P.px(lx - 0.5, 30 - h, '#fff2a0'); } P.ellipse(16, 30, 7, 2.5, '#5a8a32'); },
    shrub(P, i) { const r = rnd(90 + i); P.capsule(16, 31, 14, 20, 1.6, '#6a4a30'); P.capsule(14, 22, 8, 16, 1, '#6a4a30'); P.capsule(15, 22, 22, 14, 1, '#6a4a30'); for (const [x, y, rr] of [[8, 15, 5], [21, 13, 6], [15, 10, 6], [12, 19, 4]]) { P.ellipse(x, y + 1, rr, rr * 0.75, '#2e6e2a'); P.ellipse(x, y, rr - 0.5, rr * 0.6, i ? '#6aae3a' : '#4e9a34'); P.px(x - 1, y - 2, '#a0d860'); } void r; },
    flower(P, i) { const c = [['#f2c230', '#fff2a0'], ['#e8608a', '#ffc0d8'], ['#ffffff', '#f8f0c0'], ['#9a6ae0', '#d8c0ff']][i]; for (const [x, h] of [[12, 10], [18, 14], [23, 8]]) { P.line(x, 31, x, 31 - h, '#4a9a32'); P.circle(x, 31 - h, 2.2, c[0]); P.px(x, 31 - h, c[1]); } P.ellipse(15, 30, 4, 2, '#5aa83a'); P.ellipse(23, 30, 3, 1.5, '#5aa83a'); },
    rock(P, i) { P.ellipse(16, 27, i ? 9 : 7, i ? 5 : 4.5, '#86624c'); P.ellipse(15, 26, i ? 8 : 6, i ? 4 : 3.5, '#b4886a'); P.ellipse(13, 24.5, 3, 1.4, '#dcb090'); P.rect(9, 30, 14, 1, 'rgba(0,0,0,0.25)'); },
    front(P, i) { const r = rnd(110 + i); for (let k = 0; k < 12; k++) { const x = 6 + k * 1.7 + r() * 2, h = 12 + r() * 16; P.line(x, 31, x + (r() - 0.5) * 9, 31 - h, k % 3 ? '#3e8a2a' : '#6ab842'); } }
  };
  const variants = { tuft: 3, capim: 2, shrub: 2, flower: 4, rock: 2, front: 2 };
  GC.Sheets.define('scenery', {
    fw: 32, fh: 32, pivot: [16, 31], cols: 8,
    anims: Object.fromEntries(Object.entries(variants).map(([k, n]) => [k, { n, fps: 1 }])),
    frame: (P, kind, i) => { SCN[kind](P, i); if (kind !== 'tuft' && kind !== 'front') P.outline(OUT); }
  });
  GC.FLORA = { variants, trees: Object.keys(TREE) };
})();
