// Retratos 40×40 em pixel art (rostos de Piatã e Larinha revisados: ver assets/portraits/revisao/), desenhados pixel a pixel e exibidos sempre em
// escala inteira. Cada personagem tem expressões: neutral, happy, surprised,
// worried, determined. Baseado na proposta de identidade visual (imagem 01).
GC.Portraits = (function () {
  const S = 40;
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
        // triângulo do ponto (bx,by) com base w até a ponta (tx,ty)
        const n = Math.max(Math.abs(tx - bx), Math.abs(ty - by));
        for (let i = 0; i <= n; i++) {
          const k = i / n, cx = bx + (tx - bx) * k, cy = by + (ty - by) * k, ww = Math.max(1, Math.round(w * (1 - k)));
          x.fillStyle = c; x.fillRect(Math.round(cx - ww / 2), Math.round(cy), ww, 1);
        }
      }
    };
  }

  function outline(c, color) {
    const x = c.getContext('2d');
    const img = x.getImageData(0, 0, S, S), d = img.data;
    const a = (i, j) => (i < 0 || j < 0 || i >= S || j >= S) ? 0 : d[(j * S + i) * 4 + 3];
    const mark = [];
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (!a(i, j) && (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1))) mark.push([i, j]);
    x.fillStyle = color;
    mark.forEach(([i, j]) => { if (j < S - 1 || true) x.fillRect(i, j, 1, 1); });
  }

  // olhos e boca compartilhados (rosto voltado para a direita, em 3/4)
  function face(P, mood, C) {
    const W = '#f6f2ea';
    // sobrancelhas
    const browY = mood === 'surprised' ? 13 : 14;
    if (mood === 'worried') { P.r(14, browY, 3, 1, C.brow); P.p(17, browY - 1, C.brow); P.r(22, browY, 4, 1, C.brow); P.p(21, browY - 1, C.brow); }
    else if (mood === 'determined') { P.r(14, browY, 3, 1, C.brow); P.p(17, browY + 1, C.brow); P.r(22, browY, 4, 1, C.brow); P.p(21, browY + 1, C.brow); }
    else { P.r(14, browY, 4, 1, C.brow); P.r(21, browY, 5, 1, C.brow); }
    // olhos
    const eh = mood === 'happy' ? 2 : 3;
    const ey = mood === 'happy' ? 18 : 17;
    P.r(15, ey, 3, eh, W); P.r(22, ey, 4, eh, W);
    P.r(16, ey, 2, eh, C.iris); P.r(23, ey, 2, eh, C.iris);
    P.p(17, ey + eh - 1, '#140c0c'); P.p(24, ey + eh - 1, '#140c0c');
    P.p(16, ey, '#ffffff'); P.p(23, ey, '#ffffff');
    P.r(14, ey - 1, 4, 1, C.lash); P.r(21, ey - 1, 5, 1, C.lash);
    if (C.lashes) { P.p(26, ey - 1, C.lash); P.p(26, ey - 2, C.lash); }
    if (mood === 'happy') { P.r(15, ey + 2, 3, 1, C.shadow); P.r(22, ey + 2, 4, 1, C.shadow); }
    // nariz
    P.p(26, 20, C.shadow); P.p(26, 21, C.shadow); P.p(25, 21, C.shadow);
    // boca
    const M = '#6a2a22', T = '#f4f0e8';
    switch (mood) {
      case 'happy': P.r(20, 24, 6, 2, M); P.r(21, 24, 4, 1, T); P.p(19, 23, M); P.p(26, 23, M); break;
      case 'surprised': P.r(21, 23, 3, 3, M); P.p(22, 23, '#8a3a30'); break;
      case 'worried': P.r(21, 25, 4, 1, M); P.p(20, 26, M); P.p(25, 26, M); break;
      case 'determined': P.r(20, 24, 5, 1, M); P.p(25, 23, M); break;
      default: P.r(20, 24, 5, 1, M); P.p(25, 23, M);
    }
  }


  // ——— Rosto revisado (v2) de Piatã e Larinha ———
  // Vista de 3/4 suave para a direita. Olhos 4×4 na mesma altura (linhas 17–20),
  // espaçados por 4 px; nariz de 2 px apontando para a direita; boca pequena
  // centrada no eixo do rosto; sombreamento em três tons da pele (base, sombra, luz).
  function faceV2(P, mood, C) {
    const W = '#f6f2ea', PUP = '#140c0c', HI = '#ffffff', M = '#7a3028', T = '#f4f0e8';
    const L = [15, 16, 17, 18], R = [22, 23, 24, 25];
    // sobrancelhas (linha 15), com o desenho de cada expressão
    const by = mood === 'surprised' ? 14 : 15;
    if (mood === 'worried') { P.r(15, by + 1, 2, 1, C.brow); P.r(17, by, 2, 1, C.brow); P.r(22, by, 2, 1, C.brow); P.r(24, by + 1, 2, 1, C.brow); }
    else if (mood === 'determined') { P.r(15, by, 2, 1, C.brow); P.r(17, by + 1, 2, 1, C.brow); P.r(22, by + 1, 2, 1, C.brow); P.r(24, by, 2, 1, C.brow); }
    else { P.r(15, by, 4, 1, C.brow); P.r(22, by, 4, 1, C.brow); }
    if (mood === 'happy') {
      // olhos sorrindo: arcos fechados
      for (const X of [L, R]) { P.r(X[1], 18, 2, 1, C.lash); P.p(X[0], 19, C.lash); P.p(X[3], 19, C.lash); }
      if (C.lashes) { P.p(14, 18, C.lash); P.p(26, 18, C.lash); }
    } else {
      // olho amendoado 4×3: esclera nas pontas, íris de 2 px, pupila e brilho de 1 px
      const top = mood === 'surprised' ? 17 : 18;
      for (const X of [L, R]) {
        P.r(X[0], top, 4, 20 - top, W);                 // esclera
        P.r(X[1], top, 2, 21 - top, C.iris);            // íris (embaixo arredonda o olho)
        P.p(X[2], 19, PUP);                              // pupila
        P.p(X[1], top, HI);                              // brilho
        P.r(X[0], top - 1, 4, 1, C.lash);               // pálpebra superior
      }
      if (C.lashes) { P.p(14, top - 1, C.lash); P.p(26, top - 1, C.lash); }
    }
    // nariz: luz na ponte e sombra embaixo, sem contorno duro
    P.p(21, 21, C.light); P.p(22, 21, C.shadow); P.p(22, 22, C.shadow);
    // boca centrada no eixo do rosto (x ≈ 20,5)
    switch (mood) {
      case 'happy': P.r(18, 24, 6, 1, M); P.r(19, 24, 4, 1, T); P.r(19, 25, 4, 1, M); break;
      case 'surprised': P.r(20, 24, 2, 2, M); break;
      case 'worried': P.r(19, 24, 4, 1, M); P.p(18, 25, M); P.p(23, 25, M); break;
      case 'determined': P.r(18, 24, 5, 1, M); P.p(23, 23, M); break;
      default: P.r(19, 24, 4, 1, M); P.p(18, 23, M); P.p(23, 23, M);
    }
  }
  // cabeça: oval com queixo suave; sombra fina no contorno esquerdo e sob a franja
  function headV2(P, C) {
    P.r(17, 26, 7, 5, C.shadow);                         // pescoço
    P.el(20.5, 19, 8, 8.5, C.skin); P.el(20.8, 22.5, 6.6, 5.8, C.skin);
    P.p(14, 24, C.shadow); P.p(15, 25, C.shadow); P.p(16, 26, C.shadow); // contorno do maxilar
    P.r(17, 27, 7, 1, C.shadow);                         // sombra do queixo sobre o pescoço
    P.p(26, 21, C.light);                                // luz na bochecha
    P.el(12.5, 19.5, 1.5, 2.2, C.skin); P.p(12, 20, C.shadow); // orelha
  }

  function piata(P, mood) {
    const C = { skin: '#a86a42', shadow: '#82502e', light: '#c4855a', hair: '#1c1820', hairL: '#3a3444', brow: '#1c1820', lash: '#1c1820', iris: '#5a3018' };
    // tronco: camiseta clara, alças da mochila e colar com pingente de folha
    P.el(20, 39, 16, 9, '#e8e4d6'); P.r(4, 36, 32, 4, '#d4ccba');
    P.r(16, 29, 8, 2, '#d4ccba');
    P.r(9, 31, 3, 9, '#7a4a2a'); P.r(29, 32, 3, 8, '#7a4a2a'); P.p(10, 34, '#c8a060'); P.p(30, 35, '#c8a060');
    for (let i = 0; i < 4; i++) { P.p(16 + i, 30 + i, '#6a4a2a'); P.p(24 - i, 30 + i, '#6a4a2a'); }
    P.r(19, 34, 3, 3, '#4aa03a'); P.p(20, 34, '#7ad05a'); P.p(20, 37, '#2e6a24');
    // cabeça revisada
    headV2(P, C);
    // cabelo espetado (mesmo desenho), franja curta para liberar a testa
    P.el(19, 10, 10.5, 5.5, C.hair);
    [[9, 10, 4, 3, 5], [11, 7, 9, 0, 5], [16, 6, 15, -1, 5], [21, 6, 23, 0, 5], [26, 7, 30, 2, 5], [29, 10, 33, 7, 4], [8, 14, 4, 13, 4]].forEach(([bx, by, tx, ty, w]) => P.spike(bx, by, tx, ty, w, C.hair));
    P.p(15, 4, C.hairL); P.p(22, 3, C.hairL); P.p(27, 5, C.hairL); P.r(17, 7, 3, 1, C.hairL);
    P.r(12, 13, 17, 1, C.hair); P.r(12, 14, 2, 3, C.hair); P.p(28, 14, C.hair); P.p(16, 14, C.hair); P.p(23, 14, C.hair);
    P.r(13, 14, 15, 1, C.shadow); P.p(16, 14, C.hair); P.p(23, 14, C.hair); P.r(12, 14, 2, 3, C.hair);
    // faixa vermelha e laranja com grafismo
    P.r(10, 10, 20, 3, '#c8302a'); P.r(10, 12, 20, 1, '#9a2420'); P.r(10, 10, 20, 1, '#e8702a');
    for (let i = 11; i < 29; i += 3) { P.p(i, 11, '#f2c230'); P.p(i + 1, 11, '#f4f0e8'); }
    P.r(6, 11, 4, 2, '#c8302a'); P.r(3, 13, 4, 2, '#c8302a'); P.p(4, 15, '#9a2420');
    faceV2(P, mood, C);
  }

  function larinha(P, mood) {
    const C = { skin: '#c88a62', shadow: '#a06a48', light: '#e0a07a', hair: '#4a2a1a', hairL: '#7a4a2e', hairD: '#2e1a10', brow: '#3a2014', lash: '#1e1210', iris: '#6a3a1c', lashes: true };
    // volume do cabelo cacheado (atrás do rosto) e rabo de cavalo
    P.el(18, 17, 13, 13, C.hair); P.el(7, 7, 6, 6, C.hair); P.el(4, 14, 4, 5, C.hair); P.el(9, 2, 4, 3, C.hair);
    [[6, 5], [9, 8], [4, 12], [3, 16], [8, 1], [11, 4], [7, 21], [6, 26]].forEach(([x, y]) => { P.p(x, y, C.hairL); P.p(x + 1, y + 1, C.hairL); P.p(x - 1, y + 1, C.hairD); });
    // tronco: camisa rosa, camiseta branca e alças da EcoPack
    P.el(20, 39, 16, 9, '#e0508a'); P.r(4, 36, 32, 4, '#b83a6e');
    P.r(16, 29, 8, 3, '#f4f0e8');
    P.r(9, 31, 3, 9, '#24304e'); P.r(29, 32, 3, 8, '#24304e'); P.p(10, 35, '#5ae0f0'); P.p(30, 36, '#5ae0f0');
    P.r(13, 33, 3, 2, '#4aa03a');
    // cacho lateral atrás do rosto
    P.el(11, 21, 2.6, 6, C.hair); P.p(10, 19, C.hairL); P.p(11, 24, C.hairL);
    // cabeça revisada
    headV2(P, C);
    // sardas leves (tom de sombra da pele)
    P.p(15, 21, C.shadow); P.p(17, 22, C.shadow); P.p(24, 22, C.shadow); P.p(26, 21, C.shadow);
    // franja cacheada curta e cachos que emolduram o rosto
    P.el(20, 10, 10, 4.5, C.hair); P.r(12, 12, 17, 1, C.hair);
    P.p(13, 13, C.hair); P.p(14, 13, C.hair); P.p(17, 13, C.hair); P.p(21, 13, C.hair); P.p(25, 13, C.hair); P.p(27, 13, C.hair); P.p(28, 13, C.hair);
    P.r(12, 13, 1, 5, C.hair); P.r(28, 13, 1, 4, C.hair);
    P.p(16, 12, C.hairL); P.p(22, 11, C.hairL); P.p(26, 12, C.hairD);
    P.r(13, 14, 15, 1, C.shadow); P.p(14, 14, C.hair); P.p(27, 14, C.hair);
    P.p(11, 25, '#5ae0f0'); // brinco
    // óculos de aviador na testa
    P.r(9, 9, 24, 2, '#3a3a48');
    P.el(17, 9, 3.5, 3, '#c8ccd8'); P.el(17, 9, 2.5, 2, '#4ab8e8'); P.p(16, 8, '#ffffff');
    P.el(25, 9, 3.5, 3, '#c8ccd8'); P.el(25, 9, 2.5, 2, '#4ab8e8'); P.p(24, 8, '#ffffff');
    faceV2(P, mood, C);
  }

  function cida(P, mood) {
    const C = { skin: '#b07850', shadow: '#8a5a38', light: '#c88e64', brow: '#9a9088', lash: '#3a2a20', iris: '#4a2a18' };
    P.el(20, 39, 16, 9, '#4a7ab0'); P.r(4, 36, 32, 4, '#3a6090'); P.r(16, 29, 8, 2, '#e8e0d0');
    P.r(28, 31, 4, 7, '#3a3a48'); P.p(29, 32, '#6ae8c8'); // rádio
    P.r(17, 25, 7, 6, C.shadow);
    P.el(20, 18, 8.5, 9, C.skin); P.el(21, 21, 7, 6.5, C.skin); P.r(12, 15, 2, 8, C.shadow);
    P.el(11, 17, 3, 4, '#d8d0c8'); P.r(13, 13, 15, 2, '#d8d0c8');
    P.p(15, 21, C.shadow); P.p(26, 22, C.shadow); // linhas de expressão
    // chapéu de palha
    P.r(4, 10, 32, 2, '#e0cf9a'); P.r(4, 11, 32, 1, '#b8a470');
    P.el(20, 7, 9, 5, '#e0cf9a'); P.r(11, 8, 18, 2, '#8a5a2e');
    for (let i = 6; i < 34; i += 4) P.p(i, 10, '#c8b47e');
    face(P, mood === 'neutral' ? 'happy' : mood, C);
  }

  function rafael(P, mood) {
    const C = { skin: '#7a4a2e', shadow: '#5e3820', light: '#92603e', brow: '#1c1418', lash: '#1c1418', iris: '#3a2010' };
    P.el(20, 39, 16, 9, '#2a8a7a'); P.r(4, 36, 32, 4, '#1e6a5e'); P.r(16, 29, 8, 3, '#1e6a5e'); P.p(20, 31, '#e8e0d0');
    P.r(27, 32, 6, 8, '#2a2d36'); P.r(28, 33, 4, 5, '#6ae8c8'); P.p(29, 35, '#4aa03a'); // tablet
    P.r(17, 25, 7, 6, C.shadow);
    P.el(20, 18, 8.5, 9, C.skin); P.el(21, 21, 7, 6.5, C.skin); P.r(12, 15, 2, 8, C.shadow);
    P.el(12, 19, 2, 3, C.skin); P.r(12, 12, 4, 6, '#1c1418');
    P.r(19, 25, 6, 1, C.shadow); // barba rente
    // boné da cooperativa
    P.el(19, 10, 10, 5, '#3a6a3a'); P.r(9, 11, 21, 3, '#3a6a3a'); P.r(24, 12, 9, 2, '#2e5a2e'); P.r(17, 7, 4, 2, '#e8e0d0'); P.p(18, 8, '#4aa03a');
    face(P, mood, C);
  }

  function infrator(P, mood, who) {
    const V = {
      traficante: { skin: '#b07850', shadow: '#8a5a38', shirt: '#2a2a32', hat: '#16161c' },
      cacador: { skin: '#9a6a48', shadow: '#7a4e30', shirt: '#5a6a3a', hat: '#6a7a42' },
      descartador: { skin: '#c8906a', shadow: '#a06a48', shirt: '#5a6270', hat: '#3a3e4a' },
      garimpeiro: { skin: '#8a5a3a', shadow: '#6a4026', shirt: '#8a7a5a', hat: '#e8c030' }
    }[who];
    const C = { skin: V.skin, shadow: V.shadow, light: V.skin, brow: '#2a1a14', lash: '#2a1a14', iris: '#3a2414' };
    P.el(20, 39, 16, 9, V.shirt); P.r(4, 36, 32, 4, 'rgba(0,0,0,0.25)');
    P.r(17, 25, 7, 6, C.shadow);
    P.el(20, 18, 8.5, 9, C.skin); P.el(21, 21, 7, 6.5, C.skin); P.r(12, 15, 2, 8, C.shadow);
    P.r(18, 25, 8, 2, C.shadow); // barba por fazer
    if (who === 'garimpeiro') { P.el(19, 10, 11, 6, V.hat); P.r(7, 13, 25, 2, '#c8a020'); P.r(12, 28, 16, 3, '#c8302a'); P.p(15, 21, '#5a4a3a'); P.p(24, 15, '#5a4a3a'); }
    else if (who === 'cacador') { P.r(5, 11, 30, 2, V.hat); P.el(20, 8, 9, 4, V.hat); P.p(14, 7, '#4a5a2a'); P.p(23, 9, '#4a5a2a'); }
    else { P.el(19, 10, 10, 5, V.hat); P.r(10, 11, 20, 3, V.hat); P.r(24, 13, 9, 2, V.hat); }
    face(P, mood, C);
    if (who === 'traficante') { P.r(14, 16, 12, 3, '#16161c'); P.r(15, 16, 3, 1, '#5a5a6a'); }
  }

  function vertice(P) {
    const H = '#7ae0f0', D = '#2a8aa8', L = '#c8f8ff';
    P.el(20, 39, 15, 9, D); P.r(17, 29, 6, 4, D);
    P.el(20, 18, 8, 9.5, H); P.r(12, 15, 2, 8, D);
    P.el(19, 10, 9, 4, D); P.r(11, 10, 17, 3, D);
    P.r(14, 16, 12, 3, '#1a4a5a'); P.r(15, 17, 4, 1, L); P.r(21, 17, 4, 1, L); // óculos
    P.r(20, 24, 5, 1, '#1a4a5a');
    P.r(17, 30, 6, 2, L); P.p(20, 32, '#f2c230');
  }

  function get(who, mood = 'neutral') {
    const key = who + '_' + mood;
    if (cache[key]) return cache[key];
    const [c, x] = GC.U.makeCanvas(S, S);
    const P = painter(x);
    if (who === 'piata') piata(P, mood);
    else if (who === 'larinha') larinha(P, mood);
    else if (who === 'cida') cida(P, mood);
    else if (who === 'rafael') rafael(P, mood);
    else if (['traficante', 'cacador', 'descartador', 'garimpeiro'].includes(who)) infrator(P, mood, who);
    else if (who === 'vertice') vertice(P);
    if (who !== 'vertice') outline(c, OUT);
    else {
      // linhas de varredura do holograma
      x.globalCompositeOperation = 'destination-out';
      for (let y = 0; y < S; y += 2) { x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, y, S, 1); }
      x.globalCompositeOperation = 'source-over';
    }
    cache[key] = c;
    return c;
  }
  return { get, SIZE: S };
})();
