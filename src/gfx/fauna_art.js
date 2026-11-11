// Fauna do Cerrado em spritesheets (densidade dupla, voltados para a direita).
// Cada animal tem animações próprias (mínimo de 2 quadros): parado, andar/correr, voar etc.
(function () {
  const OUT = '#1e1424';
  const D = Math.PI / 180;
  const leg = (P, x, y, L1, a1, L2, a2, w, c) => {
    const kx = x + Math.sin(a1 * D) * L1, ky = y + Math.cos(a1 * D) * L1;
    const fx = kx + Math.sin(a2 * D) * L2, fy = ky + Math.cos(a2 * D) * L2;
    P.capsule(x, y, kx, ky, w, c, w * 0.85); P.capsule(kx, ky, fx, fy, w * 0.85, c, w * 0.7);
    return [fx, fy];
  };
  const cyc = (i, n) => Math.sin(i / n * Math.PI * 2);
  const def = (name, fw, fh, anims, draw) => GC.Sheets.define(name, {
    fw, fh, pivot: [fw / 2, fh - 2], cols: 8, anims,
    frame: (P, anim, i) => { draw(P, anim, i); P.outline(OUT); P.rimLight('rgba(255,255,255,0.22)'); }
  });

  // ——— Ema (Rhea americana) ———
  def('ema', 64, 80, { idle: { n: 2, fps: 2 }, walk: { n: 4, fps: 6 }, run: { n: 4, fps: 12 } }, (P, a, i) => {
    const run = a === 'run', s = a === 'idle' ? 0 : cyc(i, 4), amp = run ? 38 : 20;
    const by = 40 + (run ? Math.abs(s) * -2 : 0);
    const f1 = leg(P, 30, by + 6, 15, amp * s, 17, amp * s - 25, 2.6, '#a8906a');
    const f2 = leg(P, 34, by + 6, 15, -amp * s, 17, -amp * s - 25, 2.6, '#c8b48a');
    for (const [fx, fy] of [f1, f2]) P.capsule(fx, fy, fx + 6, fy + 1, 1.6, '#a8906a');
    for (const [x, y, r] of [[14, by - 4, 9], [10, by + 2, 8], [18, by + 6, 8]]) P.circle(x, y, r, '#7e6e5a');
    P.ellipse(30, by, 16, 11, '#8a7a64'); P.ellipse(31, by - 3, 13, 7, '#a8977e'); P.ellipse(28, by + 5, 10, 4, '#6e604e');
    const nb = a === 'idle' ? i * 2 : run ? 6 : 2;
    P.capsule(42, by - 4, 46 + nb, 12 + nb * 0.5, 3, '#b0a490', 2.3);
    P.capsule(42, by - 4, 44 + nb * 0.6, by - 14, 3.4, '#3a3430');
    P.circle(47 + nb, 10 + nb * 0.5, 4, '#a89a86'); P.capsule(50 + nb, 10 + nb * 0.5, 56 + nb, 11 + nb * 0.5, 1.4, '#d8c890');
    P.px(48 + nb, 8 + nb * 0.5, '#1a1220'); P.px(48 + nb, 7 + nb * 0.5, '#ffffff');
  });

  // ——— Seriema (Cariama cristata) ———
  def('seriema', 48, 64, { idle: { n: 2, fps: 2 }, walk: { n: 4, fps: 9 }, call: { n: 2, fps: 4 } }, (P, a, i) => {
    const s = a === 'walk' ? cyc(i, 4) : 0;
    leg(P, 22, 36, 11, 24 * s, 13, 24 * s - 12, 1.6, '#c83a24');
    leg(P, 24, 36, 11, -24 * s, 13, -24 * s - 12, 1.6, '#e8502e');
    P.capsule(14, 32, 4, 44, 3, '#8c8270', 1.6);
    P.ellipse(22, 31, 10, 7, '#9a9080'); P.ellipse(23, 29, 8, 4, '#c0b6a2'); P.capsule(16, 30, 26, 34, 1, '#6e6656');
    const up = a === 'call' ? 4 + i * 2 : 0;
    P.capsule(28, 27, 31, 15 - up * 0.5, 2.6, '#b4aa98', 2);
    P.circle(32, 13 - up * 0.5, 3.6, '#bcb2a0');
    const bx = 34, by = 13 - up * 0.5;
    if (a === 'call' && i === 1) { P.capsule(bx, by - 1, bx + 6, by - 4, 1, '#e04a2c'); P.capsule(bx, by + 1, bx + 6, by + 2, 1, '#e04a2c'); }
    else P.capsule(bx, by, bx + 6, by + 0.5, 1.2, '#e04a2c');
    P.px(32, 11.5 - up * 0.5, '#f8e8a0'); P.px(33, 11.5 - up * 0.5, '#1a1220');
    for (let k = 0; k < 4; k++) P.line(31, 9 - up * 0.5, 31 + k * 1.5, 3 - up * 0.5 - k, '#7a7060'); // crista
  });

  // ——— Tamanduá-bandeira (Myrmecophaga tridactyla) ———
  def('tamandua', 80, 48, { idle: { n: 2, fps: 2 }, walk: { n: 4, fps: 6 }, dig: { n: 2, fps: 8 } }, (P, a, i) => {
    const s = a === 'walk' ? cyc(i, 4) : 0;
    leg(P, 28, 30, 7, -18 * s, 8, -18 * s, 3, '#4a3e34'); leg(P, 50, 30, 7, 18 * s, 8, 18 * s - 8, 3, '#b8ac98');
    for (const [x, y, r] of [[14, 20, 11], [9, 28, 9], [18, 13, 8], [8, 18, 8]]) P.circle(x, y, r, '#5a4e42');
    for (let k = 0; k < 10; k++) P.line(6 + k * 2, 30, 4 + k * 2.4, 10 + (k % 3) * 2, '#7a6c5a');
    P.ellipse(38, 26, 19, 11, '#9c8c78'); P.ellipse(40, 22, 15, 6, '#b8aa94');
    leg(P, 32, 30, 7, 18 * s, 8, 18 * s, 3, '#5a4e42'); leg(P, 52, 30, 7, -18 * s, 8, -18 * s - 8, 3.2, '#d0c6b2');
    P.capsule(48, 36, 52, 40, 1.6, '#1e1612');
    for (let k = 0; k < 12; k++) { P.capsule(46 - k * 1.6, 18 + k * 1.3, 49 - k * 1.6, 20 + k * 1.3, 1.8, '#1a1412'); P.px(50 - k * 1.6, 17 + k * 1.3, '#f0eade'); P.px(44 - k * 1.6, 23 + k * 1.3, '#f0eade'); }
    const dg = a === 'dig' ? 3 + i * 2 : 0;
    P.capsule(56, 24, 76, 28 + dg, 5, '#9c8c78', 1.6); P.capsule(56, 22, 70, 25 + dg, 2, '#b8aa94', 1);
    P.circle(76, 28.5 + dg, 1.4, '#1a1412'); P.px(62, 22, '#1a1220'); P.ellipse(58, 18, 2, 2.5, '#8a7a66');
    if (a === 'dig') { P.capsule(76, 30 + dg, 79, 32 + dg, 0.8, '#d8607a'); P.circle(70 + i * 3, 44, 2, '#b4703e'); }
  });

  // ——— Lobo-guará (Chrysocyon brachyurus) ———
  def('lobo', 72, 64, { idle: { n: 2, fps: 2 }, trot: { n: 4, fps: 8 } }, (P, a, i) => {
    const s = a === 'trot' ? cyc(i, 4) : 0, by = 30 + (a === 'trot' ? Math.abs(s) * -1.5 : 0);
    leg(P, 22, by + 4, 13, 22 * s, 14, 22 * s - 10, 2.2, '#2a1c16'); leg(P, 44, by + 4, 13, -22 * s, 14, -22 * s + 4, 2.2, '#2a1c16');
    P.capsule(18, by - 2, 4, by + 8, 4, '#d8742c', 3); P.circle(4, by + 10, 3, '#f4eee2');
    P.ellipse(32, by, 16, 8, '#d8742c'); P.ellipse(33, by - 3, 13, 4, '#f0a050');
    P.capsule(36, by - 6, 46, by - 8, 4, '#2a1c16'); // crina
    leg(P, 26, by + 4, 13, -22 * s, 14, -22 * s - 10, 2.4, '#1e1410'); leg(P, 48, by + 4, 13, 22 * s, 14, 22 * s + 4, 2.4, '#1e1410');
    const hy = by - 12 + (a === 'idle' ? i : 0);
    P.capsule(46, by - 4, 52, hy + 2, 4.2, '#d8742c'); P.ellipse(55, hy, 6, 5, '#e0843a');
    P.capsule(58, hy + 1, 67, hy + 3, 2.6, '#e0843a', 1.6); P.circle(67, hy + 3, 1.6, '#1a1210'); P.capsule(60, hy + 4, 66, hy + 4, 1.2, '#2a1c16');
    P.poly([[51, hy - 3], [54, hy - 15], [57, hy - 3]], '#d8742c'); P.poly([[53, hy - 4], [54, hy - 11], [56, hy - 4]], '#f8d8b0');
    P.capsule(50, hy + 5, 54, by - 1, 2.4, '#f4eee2'); P.px(58, hy - 1, '#1a1220'); P.px(58, hy - 2, '#f8e070');
  });

  // ——— Tucanuçu (Ramphastos toco) ———
  def('tucano', 48, 40, { perch: { n: 2, fps: 2 }, fly: { n: 2, fps: 8 } }, (P, a, i) => {
    if (a === 'fly') {
      const up = i === 0;
      P.ellipse(20, 22, 10, 5, '#16141c'); P.capsule(10, 22, 2, 24, 3, '#16141c', 2);
      P.poly(up ? [[14, 20], [24, 20], [16, 4]] : [[14, 22], [24, 22], [18, 36]], '#22202a');
      P.ellipse(27, 21, 4, 4, '#f4f0e0');
      P.poly([[29, 17], [46, 21], [29, 25]], '#f08a20'); P.poly([[29, 17], [46, 21], [38, 19]], '#f8b040'); P.circle(44, 21, 1.6, '#16141c');
      P.circle(28, 19, 1.8, '#5ab8f0'); P.px(28, 19, '#16141c');
      return;
    }
    P.capsule(18, 30, 10, 38, 3, '#16141c', 2);
    P.ellipse(20, 24, 8, 10, '#16141c'); P.ellipse(22, 18, 5, 5, '#f4f0e0'); P.ellipse(18, 33, 4, 2, '#d8302a');
    const tilt = i ? 1 : 0;
    P.poly([[25, 14 + tilt], [44, 17 + tilt * 2], [25, 21 + tilt]], '#f08a20'); P.poly([[25, 14 + tilt], [44, 17 + tilt * 2], [35, 15 + tilt]], '#f8b040'); P.circle(42, 17 + tilt * 2, 1.8, '#16141c');
    P.circle(23, 14, 2, '#5ab8f0'); P.px(23, 14, '#16141c');
    P.capsule(18, 33, 18, 37, 1, '#7a8aa0'); P.capsule(22, 33, 22, 37, 1, '#7a8aa0'); P.rect(12, 37, 18, 2, '#6a4a30');
  });

  // ——— Cateto (Pecari tajacu) ———
  def('cateto', 48, 32, { idle: { n: 2, fps: 3 }, walk: { n: 4, fps: 9 } }, (P, a, i) => {
    const s = a === 'walk' ? cyc(i, 4) : 0, nose = a === 'idle' ? i : 0;
    leg(P, 14, 22, 4, 20 * s, 4, 20 * s, 1.8, '#2a221e'); leg(P, 30, 22, 4, -20 * s, 4, -20 * s, 1.8, '#2a221e');
    P.ellipse(22, 17, 14, 8, '#4a3e36'); for (let k = 0; k < 14; k++) P.line(10 + k * 2, 11 + (k % 2), 11 + k * 2, 8, '#6a5a4a');
    P.capsule(30, 10, 27, 24, 1.4, '#cfc4b0');
    leg(P, 18, 22, 4, -20 * s, 4, -20 * s, 1.9, '#3a302a'); leg(P, 34, 22, 4, 20 * s, 4, 20 * s, 1.9, '#3a302a');
    P.capsule(34, 16, 45, 20 + nose, 5, '#4e423a', 2.4); P.ellipse(46, 20.5 + nose, 1.8, 2.2, '#8a7a72');
    P.px(38, 14, '#1a1220'); P.poly([[32, 11], [34, 6], [36, 11]], '#3a302a');
  });

  // ——— Veado-campeiro (Ozotoceros bezoarticus) ———
  def('veado', 64, 56, { graze: { n: 2, fps: 2 }, alert: { n: 1, fps: 1 }, run: { n: 4, fps: 10 } }, (P, a, i) => {
    const run = a === 'run';
    const ph = [[-30, 30], [10, -10], [40, -40], [10, -10]][i % 4];
    const by = run ? [22, 18, 20, 24][i % 4] : 26;
    const fa = run ? ph[0] : 4, ba = run ? ph[1] : -4;
    leg(P, 20, by + 4, 11, ba, 12, ba + (run ? 20 : 2), 1.8, '#a0683a'); leg(P, 40, by + 4, 11, fa, 12, fa - (run ? 20 : 2), 1.8, '#a0683a');
    P.ellipse(30, by, 14, 8, '#c88a4a'); P.ellipse(30, by + 4, 10, 3, '#f0e2c8'); P.ellipse(31, by - 3, 11, 3, '#dca06a');
    P.capsule(16, by - 2, 14, by - 6, 2, '#f4f0e6');
    leg(P, 22, by + 4, 11, ba + 8, 12, ba + 20, 2, '#b8784a'); leg(P, 42, by + 4, 11, fa - 8, 12, fa - 18, 2, '#b8784a');
    const graze = a === 'graze', hx = graze ? 48 : 46, hy = graze ? by + 12 + i * 2 : 8;
    P.capsule(40, by - 4, hx - 2, hy + 3, 3, '#c88a4a', 2.2);
    P.ellipse(hx, hy, 5, 4, '#c88a4a'); P.capsule(hx + 2, hy + 1, hx + 8, hy + 2, 2, '#c88a4a', 1.4); P.circle(hx + 8, hy + 2, 1.2, '#1a1220');
    P.ellipse(hx - 4, hy - 4, 2, 4, '#b07a42'); P.px(hx + 1, hy - 1, '#1a1220');
    if (!graze) { P.line(hx - 1, hy - 4, hx - 3, hy - 13, '#e8dcc0'); P.line(hx - 2, hy - 8, hx + 2, hy - 12, '#e8dcc0'); P.line(hx - 3, hy - 11, hx - 6, hy - 14, '#e8dcc0'); }
  });

  // ——— Tatu-canastra (Priodontes maximus) ———
  def('tatu', 56, 32, { idle: { n: 2, fps: 2 }, walk: { n: 4, fps: 7 }, dig: { n: 3, fps: 6, loop: false } }, (P, a, i) => {
    const s = a === 'walk' ? cyc(i, 4) : 0, sink = a === 'dig' ? i * 5 : 0;
    if (a !== 'dig' || i < 2) { leg(P, 16, 22, 3, 18 * s, 3, 18 * s, 2.2, '#5a4a3a'); leg(P, 36, 22, 3, -18 * s, 3, -18 * s, 2.6, '#6a5a46'); }
    P.capsule(8, 22 + sink, 2, 26 + sink, 2.6, '#8a7a62', 1.2);
    P.ellipse(26, 18 + sink, 18, 11, '#7a6a52'); P.ellipse(26, 16 + sink, 16, 8, '#9a8a6e');
    for (let k = 0; k < 9; k++) P.line(14 + k * 3, 8 + sink + Math.abs(k - 4) * 0.6, 13 + k * 3, 26 + sink, '#6a5a46');
    P.capsule(10, 26 + sink, 42, 26 + sink, 1, '#c0b090');
    P.capsule(42, 20 + sink, 52, 24 + sink, 3.4, '#a89878', 1.4); P.px(46, 19 + sink, '#1a1220'); P.ellipse(43, 15 + sink, 1.6, 2.4, '#8a7a62');
    if (a !== 'dig' || i < 2) { leg(P, 20, 22, 3, -18 * s, 3, -18 * s, 2.4, '#6a5a46'); leg(P, 40, 22, 3, 18 * s, 3, 18 * s + 20, 2.8, '#7a6a52'); P.capsule(42, 28, 46, 30, 0.8, '#e8e0c8'); }
    if (a === 'dig') { P.ellipse(26, 30, 20, 3, '#9a5a30'); for (let k = 0; k < 6; k++) P.circle(10 + k * 7, 26 - (k % 2) * 3 - i, 1.6, '#c47a42'); }
  });

  // ——— Arara-canindé (Ara ararauna) ———
  def('arara', 48, 40, { fly: { n: 4, fps: 10 }, perch: { n: 2, fps: 2 } }, (P, a, i) => {
    if (a === 'perch') {
      P.capsule(16, 26, 8, 38, 2.6, '#1e4e9e', 1.4); P.ellipse(20, 22, 7, 9, '#2a7ad8'); P.ellipse(21, 25, 5, 6, '#f2c230');
      P.ellipse(22, 11 + i * 0.5, 6, 6, '#2a7ad8'); P.ellipse(24, 12, 3.4, 3, '#f4f0e0'); P.capsule(19, 6, 24, 6, 1.2, '#3aa04a');
      P.ellipse(29, 13, 2.6, 3.4, '#1a1a1e'); P.px(23, 11, '#1a1220'); P.rect(12, 36, 20, 2, '#6a4a30'); return;
    }
    const wing = [-14, -4, 8, -2][i];
    P.capsule(14, 22, 0, 26, 2.6, '#1e4e9e', 1.2);
    P.ellipse(22, 21, 10, 5, '#2a7ad8'); P.ellipse(22, 23, 8, 3, '#f2c230');
    P.poly([[16, 20], [28, 20], [20 + wing * 0.3, 20 + wing]], '#2a6ac8'); P.poly([[18, 20], [26, 20], [21 + wing * 0.3, 20 + wing * 0.6]], '#3a8ae8');
    P.ellipse(32, 18, 5, 4.5, '#2a7ad8'); P.ellipse(34, 19, 3, 2.6, '#f4f0e0'); P.capsule(30, 14, 34, 14, 1, '#3aa04a');
    P.ellipse(38, 20, 2.4, 3, '#1a1a1e'); P.px(33, 17, '#1a1220');
  });

  // ——— Insetos de ambiente ———
  GC.Sheets.define('insetos', {
    fw: 16, fh: 16, pivot: [8, 8], cols: 8,
    anims: { amarela: { n: 2, fps: 10 }, azul: { n: 2, fps: 10 }, laranja: { n: 2, fps: 10 }, fuligem: { n: 2, fps: 12 }, libelula: { n: 2, fps: 18 } },
    frame: (P, a, i) => {
      if (a === 'libelula') { P.capsule(2, 8, 12, 8, 1, '#2a8a6a'); P.circle(13, 8, 1.6, '#3ab88a'); const w = i ? 3 : 5; P.ellipse(7, 8 - w, 2, w, 'rgba(200,240,255,0.7)'); P.ellipse(9, 8 + w - 1, 2, w - 1, 'rgba(200,240,255,0.6)'); P.outline('rgba(30,20,36,0.6)'); return; }
      const c = { amarela: ['#f2c230', '#c8901a'], azul: ['#3a8ae8', '#1e4e9e'], laranja: ['#f08a30', '#b85a1a'], fuligem: ['#4a4242', '#2a2424'] }[a];
      const open = i === 0;
      P.capsule(8, 4, 8, 12, 0.8, '#2a1e1a');
      if (open) { P.ellipse(4, 6, 3.4, 3, c[0]); P.ellipse(12, 6, 3.4, 3, c[0]); P.ellipse(5, 10, 2.4, 2, c[1]); P.ellipse(11, 10, 2.4, 2, c[1]); P.px(4, 6, a === 'fuligem' ? '#e8501e' : '#ffffff'); P.px(12, 6, a === 'fuligem' ? '#e8501e' : '#ffffff'); }
      else { P.ellipse(7, 7, 1.6, 4, c[0]); P.ellipse(9, 7, 1.6, 4, c[1]); }
      P.outline('#2a1e24');
    }
  });
})();
