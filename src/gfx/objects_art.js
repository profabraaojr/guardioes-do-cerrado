// Máquinas, veículo, itens e efeitos em spritesheets (densidade dupla).
(function () {
  const OUT = '#16101c';
  const def = (name, fw, fh, piv, anims, draw, opts = {}) => GC.Sheets.define(name, {
    fw, fh, pivot: piv, cols: 8, anims,
    frame: (P, a, i) => { draw(P, a, i); if (opts.outline !== false) P.outline(OUT); if (opts.rim !== false) P.rimLight('rgba(255,255,255,0.25)'); }
  });

  // ——— Serra-robô do Projeto Horizonte ———
  def('serra', 64, 56, [32, 54], { idle: { n: 2, fps: 3 }, walk: { n: 4, fps: 10 }, attack: { n: 2, fps: 14 }, off: { n: 1, fps: 1 } }, (P, a, i) => {
    const off = a === 'off';
    const body = off ? '#6a6e76' : '#454a58', hi = off ? '#8a8e96' : '#666c7c', dk = '#22252e';
    // esteira com sapatas animadas
    P.capsule(14, 46, 46, 46, 7, dk); P.capsule(14, 46, 46, 46, 5, '#4a4e58');
    for (let k = 0; k < 6; k++) P.rect(12 + ((k * 7 + (a === 'walk' ? i * 2 : 0)) % 36), 40, 3, 2, '#7a7e88');
    for (const x of [16, 30, 44]) { P.circle(x, 46, 3.4, '#2a2d36'); P.circle(x, 46, 1.4, '#8a8e96'); }
    // corpo e faixas de alerta
    P.rect(14, 18, 30, 22, dk); P.rect(15, 18, 28, 20, body); P.rect(15, 18, 28, 3, hi);
    for (let k = 0; k < 4; k++) P.rect(17 + k * 7, 34, 4, 3, off ? '#5a5e66' : '#e8743a');
    P.rect(15, 30, 28, 1, off ? '#4a4e58' : '#4ae0f0');
    // cabeça-sensor
    P.rect(28, 10, 14, 9, dk); P.rect(29, 11, 12, 6, '#16181e');
    const eye = off ? '#3a3a3e' : a === 'attack' ? '#ff6040' : '#ff3a2a';
    P.rect(33 + (a === 'idle' ? i : 0), 13, 5, 2, eye);
    P.rect(19, 12, 3, 7, '#5a606e'); P.rect(18, 9, 5, 3, '#3a3e4a'); // escapamento
    // braço com serra
    const ay = a === 'attack' ? 22 - i * 3 : 26;
    P.rect(42, ay, 8, 4, '#5a606e');
    P.rect(48, ay - 2, 15, 7, '#9aa0a8'); P.rect(48, ay - 2, 15, 2, '#d0d4da');
    for (let k = 0; k < 8; k++) P.rect(48 + ((k * 2 + i * (off ? 0 : 1)) % 15), ay + 5, 1, 1, '#2a2d36');
    if (off) { // coberta de cipós e flores
      for (let k = 0; k < 10; k++) P.line(14 + k * 3, 18 + (k % 3) * 4, 15 + k * 3, 40, '#3e8a34');
      P.capsule(12, 18, 46, 17, 2, '#5eb04a');
      for (const [x, y, c] of [[18, 16, '#f2c230'], [28, 15, '#e86a9a'], [38, 16, '#ffffff'], [24, 26, '#f2c230']]) P.circle(x, y, 1.6, c);
    }
  });

  // ——— Drone-sentinela ———
  def('drone', 48, 32, [24, 28], { fly: { n: 2, fps: 16 }, off: { n: 1, fps: 1 } }, (P, a, i) => {
    const off = a === 'off';
    P.rect(4, 8, 40, 3, '#22252e');
    if (!off) { const w = i ? 14 : 8; P.rect(10 - w / 2, 5, w, 1, 'rgba(220,226,236,0.9)'); P.rect(38 - w / 2, 5, w, 1, 'rgba(220,226,236,0.9)'); }
    P.rect(9, 6, 2, 3, '#5a606e'); P.rect(37, 6, 2, 3, '#5a606e');
    P.ellipse(24, 16, 10, 8, '#22252e'); P.ellipse(24, 15, 9, 7, off ? '#6a6e76' : '#454a58'); P.ellipse(22, 12, 5, 3, '#6a707e');
    P.rect(25, 13, 7, 4, '#16181e'); P.rect(27, 14, 3, 2, off ? '#3a3a3e' : '#ff3a2a');
    P.rect(16, 21, 16, 1, off ? '#4a4e58' : '#4ae0f0');
    P.rect(23, 1, 1, 6, '#5a606e'); P.rect(22, 0, 3, 2, off ? '#3a3a3e' : '#ff3a2a');
    if (off) { P.line(14, 20, 34, 12, '#3e8a34'); P.circle(20, 11, 1.4, '#f2c230'); }
  });

  // ——— Caminhonete do descartador, com caçamba lançadora ———
  def('van', 112, 72, [56, 70], { idle: { n: 2, fps: 4 }, dump: { n: 3, fps: 6, loop: false }, jammed: { n: 1, fps: 1 } }, (P, a, i) => {
    const tilt = a === 'dump' ? i * 8 : a === 'jammed' ? 4 : 0;
    // chassi e cabine
    P.rect(10, 44, 92, 10, '#2a2d36'); P.rect(12, 44, 88, 3, '#4a4e58');
    P.rect(68, 20, 34, 26, '#3a3e4a'); P.rect(70, 22, 30, 4, '#5a606e');
    P.rect(74, 24, 22, 12, '#22303e'); P.rect(75, 25, 8, 4, '#6a8ab0'); P.rect(86, 25, 9, 3, '#4a6a90');
    P.rect(98, 38, 4, 4, '#f8e070'); P.rect(66, 46, 4, 3, '#c83a2a');
    P.rect(90, 47, 10, 5, '#e8e8e8'); P.rect(91, 48, 8, 3, '#5a5e66'); // placa coberta
    // caçamba basculante (gira para trás ao despejar)
    const yb = 44 - tilt * 0.5, xb = 12 - tilt * 0.4;
    P.poly([[xb, yb - 18 - tilt * 0.3], [xb + 54, yb - 18 + tilt * 0.5], [xb + 54, yb], [xb + 4, yb + tilt * 0.2]], '#5a6270');
    P.poly([[xb, yb - 18 - tilt * 0.3], [xb + 54, yb - 18 + tilt * 0.5], [xb + 54, yb - 15 + tilt * 0.5], [xb, yb - 15 - tilt * 0.3]], '#7a828e');
    for (let k = 0; k < 3; k++) P.rect(xb + 10 + k * 14, yb - 12, 2, 10, '#444a56');
    // tambores dentro
    if (a !== 'jammed') for (let k = 0; k < 2; k++) { P.rect(xb + 12 + k * 14, yb - 26 - tilt * 0.2, 10, 10, '#5a6a7a'); P.rect(xb + 12 + k * 14, yb - 22 - tilt * 0.2, 10, 2, '#c8c040'); }
    // pistão
    P.capsule(60, 46, 50 - tilt * 0.3, 40 - tilt * 0.8, 1.6, '#8a8e96');
    // rodas animadas
    for (const x of [26, 86]) { P.circle(x, 56, 10, '#16181e'); P.circle(x, 56, 6, '#3a3e4a'); P.circle(x, 56, 2.2, '#9aa0a8'); const r = (a === 'idle' ? i : 0) * 0.8; P.line(x + Math.cos(r) * 5, 56 + Math.sin(r) * 5, x - Math.cos(r) * 5, 56 - Math.sin(r) * 5, '#5a606e'); }
    if (a === 'jammed') { for (let k = 0; k < 8; k++) P.line(14 + k * 6, 26, 15 + k * 6, 44, '#3e8a34'); P.capsule(12, 26, 64, 28, 2, '#5eb04a'); for (const x of [20, 34, 50]) P.circle(x, 25, 1.8, x % 2 ? '#f2c230' : '#e86a9a'); }
  });

  // ——— Fogo (6 quadros) ———
  def('fogo', 32, 40, [16, 38], { burn: { n: 6, fps: 12 } }, (P, a, i) => {
    const ph = i / 6 * Math.PI * 2;
    P.ellipse(16, 37, 12, 2.5, '#3a2418');
    P.rect(8, 35, 16, 2, '#5a3018'); P.rect(10, 34, 4, 2, '#7a4a2a'); P.rect(18, 34, 5, 2, '#6a3a1e');
    const flame = (h, w, c, dx) => { for (let y = 0; y < h; y++) { const t = y / h, ww = w * (1 - t) * (0.8 + 0.2 * Math.sin(ph + t * 6)), x = 16 + dx + Math.sin(ph * 1.3 + t * 5) * 2.5 * t; P.rect(x - ww, 34 - y, ww * 2, 1, c); } };
    flame(28 + Math.sin(ph) * 3, 10, '#e8401a', 0); flame(22 + Math.cos(ph) * 2, 7.5, '#f8901e', 0.5); flame(14 + Math.sin(ph * 2) * 2, 4.5, '#fde060', 1); flame(7, 2, '#fff6c0', 1);
    if (i % 2) P.px(10 + i * 2, 6 + i, '#ffb040');
  }, { outline: false, rim: false });

  // ——— Itens ———
  def('itens', 24, 24, [12, 22], { seed: { n: 4, fps: 6 }, rare: { n: 4, fps: 8 }, fruit: { n: 2, fps: 3 }, heartUp: { n: 4, fps: 6 } }, (P, a, i) => {
    const b = [0, -1, -2, -1][i % 4];
    if (a === 'seed') { P.ellipse(12, 15 + b, 4.5, 5.5, '#7a4a1e'); P.ellipse(11, 13 + b, 2, 2, '#b8804a'); P.capsule(12, 10 + b, 14, 5 + b, 1, '#4aa03a'); P.ellipse(15, 5 + b, 2.4, 1.4, '#7ad050'); }
    if (a === 'rare') { const g = [0.3, 0.6, 1, 0.6][i]; P.circle(12, 12 + b, 10, `rgba(255,220,90,${0.18 * g})`); P.ellipse(12, 14 + b, 5, 6, '#c88a1a'); P.ellipse(11, 12 + b, 2.6, 2.6, '#fde070'); P.capsule(12, 8 + b, 13, 3 + b, 1.2, '#3e9a3a'); P.ellipse(16, 3 + b, 3, 1.6, '#6ac84a'); if (i === 2) { P.px(20, 5, '#ffffff'); P.px(4, 9, '#ffffff'); } }
    if (a === 'fruit') { P.circle(12, 14 + (i ? -1 : 0), 7, '#4a8a2a'); P.circle(10, 12 + (i ? -1 : 0), 3, '#7ab84a'); P.circle(13, 15 + (i ? -1 : 0), 2.6, '#f2c230'); P.capsule(12, 7, 12, 4, 0.8, '#5a3a1e'); }
    if (a === 'heartUp') { const s = 1 + (i % 2) * 0.08; P.circle(12, 12 + b, 10, 'rgba(120,230,120,0.22)'); P.poly([[4, 18 + b], [5, 8 + b], [12, 3 + b], [20, 4 + b], [19, 13 + b], [12, 19 + b]].map(([x, y]) => [12 + (x - 12) * s, 12 + (y - 12) * s]), '#5ec04a'); P.line(6, 17 + b, 17, 6 + b, '#2e7e2a'); P.rect(11, 0, 2, 5, '#ffffff'); P.rect(9.5, 1.5, 5, 2, '#ffffff'); }
  });

  // ——— Brilho de coleta e poeira de pouso ———
  def('brilho', 32, 32, [16, 16], { sparkle: { n: 5, fps: 18, loop: false }, dust: { n: 4, fps: 16, loop: false }, impacto: { n: 5, fps: 20, loop: false } }, (P, a, i) => {
    if (a === 'impacto') {
      // estrela de impacto: núcleo branco, raios dourados e anel que se abre
      const r = 4 + i * 3;
      if (i < 3) P.circle(16, 16, 6 - i, '#ffffff');
      for (let k = 0; k < 8; k++) { const ang = k / 8 * Math.PI * 2 + (i % 2) * 0.2, L = k % 2 ? r : r * 1.5; P.line(16 + Math.cos(ang) * (r * 0.4), 16 + Math.sin(ang) * (r * 0.4), 16 + Math.cos(ang) * L, 16 + Math.sin(ang) * L, k % 2 ? '#f8d860' : '#ffffff'); }
      if (i > 1) for (let k = 0; k < 16; k++) { const ang = k / 16 * Math.PI * 2; P.px(16 + Math.cos(ang) * (r + 2), 16 + Math.sin(ang) * (r + 2), '#f2a040'); }
      return;
    }
    if (a === 'sparkle') {
      const r = 3 + i * 3, c = i < 3 ? '#fff6b0' : '#f2c230';
      P.rect(16 - r, 15, r * 2, 2, c); P.rect(15, 16 - r, 2, r * 2, c);
      if (i > 0) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.rect(16 + dx * r * 0.65, 16 + dy * r * 0.65, 2, 2, '#ffffff');
      if (i < 3) P.circle(16, 16, 3 - i * 0.6, '#ffffff');
    } else {
      for (const s of [-1, 1]) { const x = 16 + s * (4 + i * 3), y = 26 - i; P.circle(x, y, 4 - i * 0.7, `rgba(230,200,160,${0.9 - i * 0.2})`); }
    }
  }, { outline: false, rim: false });
})();
