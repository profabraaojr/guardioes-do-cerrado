// Retratos 80×80 (o dobro do detalhe dos retratos de 40×40) para a caixa de diálogo.
// Piatã e Larinha têm arte própria, desenhada pixel a pixel a partir dos rostos
// aprovados; os demais personagens usam o retrato de 40×40 ampliado 2× sem suavização.
// Sombreamento da pele em três tons (base, sombra, luz); contorno de 1 px.
GC.PortraitsHD = (function () {
  const S = 80;
  const cache = {};
  const OUT = '#16101c';

  function painter(x) {
    return {
      r(X, Y, w, h, c) { x.fillStyle = c; x.fillRect(X, Y, w, h); },
      p(X, Y, c) { x.fillStyle = c; x.fillRect(X, Y, 1, 1); },
      el(cx, cy, rx, ry, c) {
        x.fillStyle = c;
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
          for (let X = Math.floor(cx - rx); X <= Math.ceil(cx + rx); X++) {
            const dx = (X + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
            if (dx * dx + dy * dy <= 1) x.fillRect(X, y, 1, 1);
          }
      },
      spike(bx, by, tx, ty, w, c) {
        const n = Math.max(Math.abs(tx - bx), Math.abs(ty - by));
        for (let i = 0; i <= n; i++) {
          const k = i / n, cx = bx + (tx - bx) * k, cy = by + (ty - by) * k, ww = Math.max(1, Math.round(w * (1 - k)));
          x.fillStyle = c; x.fillRect(Math.round(cx - ww / 2), Math.round(cy), ww, 1);
        }
      }
    };
  }

  function outline(c) {
    const x = c.getContext('2d');
    const img = x.getImageData(0, 0, S, S), d = img.data;
    const a = (i, j) => (i < 0 || j < 0 || i >= S || j >= S) ? 0 : d[(j * S + i) * 4 + 3];
    x.fillStyle = OUT;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (!a(i, j) && (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1))) x.fillRect(i, j, 1, 1);
  }

  // ——— Cabeça em 3/4 suave para a direita (eixo do rosto em x ≈ 41) ———
  function head(P, C) {
    P.r(36, 50, 11, 14, C.shadow);                               // pescoço
    P.el(40.4, 38.2, 16.2, 16.6, C.shadow); P.el(41.8, 46, 11.8, 11.6, C.shadow);
    P.el(41.4, 37.6, 15.6, 16, C.skin); P.el(42.4, 45.4, 11, 11, C.skin);   // a sombra vira um crescente à esquerda; queixo mais estreito
    P.r(37, 56, 10, 1, C.shadow);                                // sombra do queixo
    P.r(51, 42, 2, 1, C.light); P.el(45, 27.5, 5, 1.6, C.light); // luz discreta na bochecha e na testa
    P.el(25.2, 39.5, 3, 4.8, C.skin); P.r(25, 37, 1, 5, C.shadow); P.p(26, 42, C.shadow); // orelha
  }

  function eyes(P, mood, C) {
    const W = '#f6f2ea', PUP = '#120a0a', HI = '#ffffff';
    const L = 29, R = 44; // coluna inicial de cada olho (8 px de largura, 7 px entre eles)
    // sobrancelhas (2 px de espessura)
    const by = mood === 'surprised' ? 28 : 30;
    for (const X of [L, R]) {
      const near = X === L;
      if (mood === 'worried') { P.r(X, by + (near ? 1 : -1), 4, 2, C.brow); P.r(X + 4, by + (near ? -1 : 1), 4, 2, C.brow); }
      else if (mood === 'determined') { P.r(X, by + (near ? -1 : 1), 4, 2, C.brow); P.r(X + 4, by + (near ? 1 : -1), 4, 2, C.brow); }
      else { P.r(X + 1, by - 1, 6, 1, C.brow); P.r(X, by, 8, 1, C.brow); P.p(near ? X : X + 7, by + 1, C.brow); }
    }
    if (mood === 'happy') {
      for (const X of [L, R]) { P.r(X + 2, 35, 4, 1, C.lash); P.r(X + 1, 36, 1, 1, C.lash); P.r(X + 6, 36, 1, 1, C.lash); P.p(X, 37, C.lash); P.p(X + 7, 37, C.lash); P.r(X + 1, 39, 6, 1, C.shadow); }
      if (C.lashes) { P.p(L - 1, 36, C.lash); P.p(R + 8, 36, C.lash); }
      return;
    }
    const top = mood === 'surprised' ? 33 : 34;
    for (const X of [L, R]) {
      P.r(X + 1, top - 2, 6, 1, C.lash); P.r(X, top - 1, 8, 1, C.lash);  // pálpebra superior
      P.r(X, top, 8, 40 - top, W); P.p(X, 39, C.skin); P.p(X + 7, 39, C.skin); // esclera amendoada
      P.r(X + 2, top, 4, 41 - top, C.iris);                         // íris
      P.r(X + 2, top, 4, 1, C.irisD);                               // sombra da pálpebra na íris
      P.r(X + 3, 39, 2, 1, C.irisL);                                // reflexo inferior
      P.r(X + 3, top + 2, 2, 2, PUP);                               // pupila
      P.r(X + 2, top + 1, 1, 2, HI); P.p(X + 5, 38, HI);            // brilhos
    }
    if (C.lashes) { P.p(L - 1, top - 2, C.lash); P.p(L - 2, top - 3, C.lash); P.p(R + 8, top - 2, C.lash); P.p(R + 9, top - 3, C.lash); }
  }

  function noseMouth(P, mood, C) {
    const M = '#7a3028', ML = '#a04a3c', T = '#f6f2ea', TG = '#c0574c';
    P.p(42, 42, C.light); P.p(43, 43, C.light);                     // ponte
    P.r(44, 43, 1, 3, C.shadow); P.r(41, 46, 4, 1, C.shadow);       // lateral e base do nariz
    switch (mood) {
      case 'happy': P.r(36, 49, 12, 1, M); P.r(37, 50, 10, 3, M); P.r(38, 50, 8, 1, T); P.r(39, 52, 6, 1, TG); P.r(38, 53, 8, 1, ML); break;
      case 'surprised': P.el(42, 51, 2.6, 3.2, M); P.r(41, 52, 2, 2, TG); break;
      case 'worried': P.r(38, 50, 8, 1, M); P.p(37, 51, M); P.p(46, 51, M); P.r(39, 51, 6, 1, ML); break;
      case 'determined': P.r(37, 50, 9, 1, M); P.p(46, 49, M); P.r(38, 51, 7, 1, ML); break;
      default: P.r(38, 50, 8, 1, M); P.p(37, 49, M); P.p(46, 49, M); P.r(39, 51, 6, 1, ML);
    }
  }

  // ——— Piatã ———
  function piata(P, mood) {
    const C = { skin: '#a86a42', shadow: '#82502e', light: '#c4855a', hair: '#1c1820', hairL: '#3a3444', hairM: '#2a2430', brow: '#1c1820', lash: '#1c1820', iris: '#5a3018', irisD: '#3a1c0c', irisL: '#8a5a32' };
    // tronco: camiseta clara, alças da mochila, colar com pingente de folha
    P.el(40, 79, 33, 18, '#e8e4d6'); P.r(6, 72, 68, 8, '#d4ccba'); P.el(40, 79, 33, 18, '#e8e4d6'); P.r(8, 74, 64, 6, '#d8d0be');
    P.r(32, 58, 16, 4, '#d4ccba');
    P.r(17, 62, 7, 18, '#7a4a2a'); P.r(18, 62, 2, 18, '#94603a'); P.r(57, 63, 7, 17, '#6a3e22'); P.r(18, 67, 4, 3, '#c8a060'); P.r(59, 69, 4, 3, '#c8a060');
    for (let i = 0; i < 8; i++) { P.p(32 + i, 59 + i, '#6a4a2a'); P.p(48 - i, 59 + i, '#6a4a2a'); }
    P.el(40, 70, 3, 4, '#4aa03a'); P.r(39, 67, 2, 5, '#7ad05a'); P.p(40, 74, '#2e6a24'); P.p(40, 66, '#c8a060');
    head(P, C);
    // cabelo espetado e volumoso
    P.el(38, 20, 21, 11, C.hair);
    [[18, 20, 6, 6, 9], [22, 14, 16, 0, 9], [31, 12, 28, -1, 10], [41, 11, 45, -1, 10], [51, 13, 59, 2, 9], [57, 19, 66, 13, 8], [16, 28, 7, 26, 7], [61, 25, 68, 23, 6]]
      .forEach(([bx, by, tx, ty, w]) => P.spike(bx, by, tx, ty, w, C.hair));
    [[28, 8, 26, 3], [43, 7, 44, 2], [53, 10, 57, 5], [35, 13, 34, 9], [47, 13, 50, 10]].forEach(([x0, y0, x1, y1]) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) P.p(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), C.hairL); });
    P.r(34, 14, 6, 1, C.hairM); P.r(40, 15, 5, 1, C.hairM);
    // franja curta (libera a testa) e costeletas
    P.r(24, 25, 34, 2, C.hair); P.r(24, 27, 3, 7, C.hair); P.r(56, 27, 2, 4, C.hair);
    [[31, 27], [37, 27], [44, 27], [50, 27]].forEach(([x, y]) => { P.r(x, y, 3, 1, C.hair); P.p(x + 1, y + 1, C.hair); });
    P.r(27, 28, 29, 1, C.shadow); [[31, 28], [32, 28], [37, 28], [38, 28], [44, 28], [45, 28], [50, 28], [51, 28]].forEach(([x, y]) => P.p(x, y, C.hair)); P.p(32, 29, C.hair); P.p(38, 29, C.hair); P.p(45, 29, C.hair); P.p(51, 29, C.hair);
    // faixa vermelha e laranja com grafismo amarelo e branco
    P.r(19, 19, 41, 6, '#c8302a'); P.r(19, 19, 41, 1, '#e8702a'); P.r(19, 20, 41, 1, '#e05a2a'); P.r(19, 24, 41, 1, '#9a2420');
    for (let i = 21; i < 58; i += 6) { P.r(i, 21, 2, 2, '#f2c230'); P.p(i + 3, 21, '#f4f0e8'); P.p(i + 3, 22, '#f4f0e8'); P.p(i + 2, 22, '#f2c230'); }
    P.r(11, 21, 8, 4, '#c8302a'); P.r(11, 21, 8, 1, '#e8702a'); P.r(5, 25, 9, 4, '#c8302a'); P.r(5, 28, 9, 1, '#9a2420'); P.r(7, 29, 3, 3, '#9a2420');
    eyes(P, mood, C); noseMouth(P, mood, C);
  }

  // ——— Larinha ———
  function larinha(P, mood) {
    const C = { skin: '#c88a62', shadow: '#a06a48', light: '#e0a07a', hair: '#4a2a1a', hairL: '#7a4a2e', hairD: '#2e1a10', brow: '#3a2014', lash: '#1e1210', iris: '#6a3a1c', irisD: '#40220e', irisL: '#9a6234', lashes: true };
    // cabelo cacheado volumoso (atrás) e rabo de cavalo
    P.el(37, 35, 26, 26, C.hair); P.el(14, 14, 12, 12, C.hair); P.el(8, 28, 8, 10, C.hair); P.el(18, 4, 8, 6, C.hair); P.el(60, 40, 6, 14, C.hair);
    // textura de cachos: pequenos arcos de luz e sombra
    for (const [x, y] of [[10, 9], [17, 15], [8, 23], [5, 31], [15, 3], [21, 8], [13, 41], [11, 50], [60, 31], [62, 44], [58, 52], [20, 20], [7, 37], [64, 37]]) {
      P.r(x, y, 2, 1, C.hairL); P.p(x - 1, y + 1, C.hairL); P.p(x + 2, y + 1, C.hairD); P.r(x, y + 2, 2, 1, C.hairD);
    }
    P.el(22, 56, 3, 3, C.hair); P.p(21, 55, C.hairL);
    // tronco: camisa rosa aberta, camiseta branca, alças da EcoPack e broche verde
    P.el(40, 79, 33, 18, '#e0508a'); P.r(6, 72, 68, 8, '#b83a6e'); P.el(40, 80, 30, 15, '#e0508a');
    P.r(32, 58, 16, 6, '#f4f0e8'); P.r(30, 60, 3, 8, '#c84278'); P.r(47, 60, 3, 8, '#c84278');
    P.r(17, 62, 7, 18, '#24304e'); P.r(18, 62, 2, 18, '#34446a'); P.r(57, 63, 7, 17, '#1c2640'); P.r(19, 70, 3, 2, '#5ae0f0'); P.r(59, 72, 3, 2, '#5ae0f0');
    P.r(26, 66, 6, 4, '#4aa03a'); P.r(27, 67, 2, 1, '#7ad05a');
    // cacho lateral atrás do rosto
    P.el(22, 42, 5, 12, C.hair); P.r(20, 37, 2, 1, C.hairL); P.r(22, 47, 2, 1, C.hairL);
    head(P, C);
    // sardas leves (tom de sombra da pele)
    for (const [x, y] of [[30, 43], [33, 44], [31, 45], [50, 44], [53, 43], [52, 45]]) P.p(x, y, C.shadow);
    // franja cacheada curta e cachos que emolduram o rosto
    P.el(40, 20, 20, 8.5, C.hair); P.r(24, 24, 34, 2, C.hair);
    for (const [x, w] of [[25, 4], [30, 3], [35, 4], [41, 3], [46, 4], [51, 3], [55, 3]]) { P.r(x, 26, w, 1, C.hair); P.r(x + 1, 27, w - 2, 1, C.hair); }
    P.r(24, 26, 2, 10, C.hair); P.r(56, 26, 2, 8, C.hair); P.p(23, 30, C.hair); P.p(58, 30, C.hair);
    for (const [x, y] of [[29, 22], [37, 21], [45, 22], [52, 23], [33, 18], [48, 18]]) { P.r(x, y, 2, 1, C.hairL); P.p(x + 2, y + 1, C.hairD); }
    P.r(26, 28, 30, 1, C.shadow); for (const x of [26, 27, 31, 36, 37, 42, 47, 48, 52, 55]) P.p(x, 28, C.hair);
    P.r(22, 50, 2, 2, '#5ae0f0'); P.p(22, 50, '#c8f8ff');            // brinco
    // óculos de aviador azuis sobre a testa
    P.r(17, 17, 48, 4, '#3a3a48'); P.r(17, 17, 48, 1, '#5a5a6a');
    for (const cx0 of [33, 50]) {
      P.el(cx0, 18, 7.5, 6, '#8a90a0'); P.el(cx0, 18, 6.5, 5, '#c8ccd8');
      P.el(cx0, 18, 5, 4, '#2a88c8'); P.el(cx0 + 0.6, 18.6, 4, 3, '#4ab8e8');
      P.r(cx0 - 3, 15, 2, 2, '#ffffff'); P.p(cx0 + 2, 21, '#a8e8ff');
    }
    P.r(40, 16, 3, 4, '#5a5a6a');
    eyes(P, mood, C); noseMouth(P, mood, C);
  }

  function get(who, mood = 'neutral') {
    const key = who + '_' + mood;
    if (cache[key]) return cache[key];
    const [c, x] = GC.U.makeCanvas(S, S);
    x.imageSmoothingEnabled = false;
    if (who === 'piata' || who === 'larinha') {
      const P = painter(x);
      (who === 'piata' ? piata : larinha)(P, mood);
      outline(c);
    } else x.drawImage(GC.Portraits.get(who, mood), 0, 0, S, S); // demais: 40×40 ampliado 2×
    cache[key] = c;
    return c;
  }
  return { get, SIZE: S };
})();
