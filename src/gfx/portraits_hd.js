// Retratos 96×96 para a caixa de diálogo, com proporções humanas.
// O volume do rosto é calculado: um campo de altura (oval da cabeça + ponte e ponta do
// nariz, órbitas, arco das sobrancelhas, maçãs do rosto, lábios e queixo) é iluminado
// de cima à esquerda e quantizado em cinco tons de pele com pontilhado 2×2, como em
// pixel art desenhada à mão. Olhos, sobrancelhas, nariz e boca são desenhados por cima,
// com pálpebra, dobra, íris, pupila e brilho. Contorno escuro só na silhueta.
// Piatã e Larinha têm arte própria; os demais usam o retrato de 40×40 ampliado.
GC.PortraitsHD = (function () {
  const S = 96;
  const cache = {};
  const OUT = [22, 16, 28];
  const BAYER = [[0, 0.5], [0.75, 0.25]];
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const g2 = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2) - (((y - cy) / sy) ** 2));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const noise = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

  // ——— Pintor sobre um buffer RGBA ———
  function Canvas() {
    const [c, x] = GC.U.makeCanvas(S, S);
    const img = x.createImageData(S, S), d = img.data;
    const set = (X, Y, col) => { X = Math.round(X); Y = Math.round(Y); if (X < 0 || Y < 0 || X >= S || Y >= S) return; const i = (Y * S + X) * 4; const k = typeof col === 'string' ? hex(col) : col; d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = 255; };
    const get = (X, Y) => { if (X < 0 || Y < 0 || X >= S || Y >= S) return 0; return d[(Y * S + X) * 4 + 3]; };
    const ramp = (tones, t, X, Y) => { const n = tones.length; const v = clamp(t + (BAYER[Y & 1][X & 1] - 0.375) * (0.55 / n), 0, 0.999); return tones[Math.floor(v * n)]; };
    // preenche uma região (função de pertinência) com um tom calculado por pixel
    const fill = (x0, y0, x1, y1, inside, tone) => { for (let Y = Math.floor(y0); Y <= Math.ceil(y1); Y++) for (let X = Math.floor(x0); X <= Math.ceil(x1); X++) if (inside(X + 0.5, Y + 0.5)) set(X, Y, tone(X, Y)); };
    const ell = (cx, cy, rx, ry) => (X, Y) => ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2 <= 1;
    const line = (pts, col, w = 1) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; const n = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)))); for (let k = 0; k <= n; k++) { const X = ax + (bx - ax) * k / n, Y = ay + (by - ay) * k / n; for (let j = 0; j < w; j++) set(X, Y + j, col); } } };
    const outline = () => {
      const mark = [];
      for (let Y = 0; Y < S; Y++) for (let X = 0; X < S; X++) if (!get(X, Y) && (get(X - 1, Y) || get(X + 1, Y) || get(X, Y - 1) || get(X, Y + 1))) mark.push([X, Y]);
      mark.forEach(([X, Y]) => set(X, Y, OUT));
    };
    const done = () => { x.putImageData(img, 0, 0); return c; };
    return { set, get, ramp, fill, ell, line, outline, done };
  }

  // ——— Rosto (comum aos dois; eixo do rosto em x ≈ 49, leve 3/4 para a direita) ———
  const F = { cx: 48.5, cy: 46, rx: 16.5, ry: 21.5 };
  function faceInside(X, Y) {
    const v = (Y - F.cy) / F.ry;
    const k = v > 0.15 ? 1 - 0.36 * Math.pow((v - 0.15) / 0.85, 1.5) : 1; // maxilar afinando até o queixo
    const u = (X - F.cx - (v > 0 ? 0.6 * v : 0)) / (F.rx * k);
    return u * u + v * v <= 1;
  }
  function faceHeight(X, Y) {
    const u = (X - F.cx) / F.rx, v = (Y - F.cy) / F.ry;
    const base = Math.sqrt(Math.max(0, 1 - u * u * 0.9 - v * v * 0.8));
    const r = F.rx;
    return r * (base
      + 0.16 * g2(X, Y, 52, 47, 1.7, 6.5)        // ponte do nariz
      + 0.20 * g2(X, Y, 52.5, 53, 2.6, 2.2)      // ponta do nariz
      + 0.06 * g2(X, Y, 49.5, 54.5, 5, 1.4)      // asas do nariz
      - 0.13 * g2(X, Y, 40.5, 43, 4.6, 3.2)      // órbita esquerda
      - 0.12 * g2(X, Y, 58, 43, 4.2, 3.2)        // órbita direita
      + 0.07 * g2(X, Y, 49, 38, 13, 1.8)         // arco das sobrancelhas
      + 0.07 * g2(X, Y, 39, 51, 4.5, 3.4)        // maçã esquerda
      + 0.05 * g2(X, Y, 60, 51, 3.5, 3.4)        // maçã direita
      + 0.05 * g2(X, Y, 51, 60, 5.5, 2.2)        // lábios
      - 0.04 * g2(X, Y, 51, 63, 5, 0.9)          // sulco abaixo do lábio
      + 0.06 * g2(X, Y, 50.5, 66, 4.5, 2.4));    // queixo
  }
  const LIGHT = (() => { const l = [-0.5, -0.55, 0.67], n = Math.hypot(...l); return l.map((v) => v / n); })();
  function shadeAt(X, Y, hgt) {
    const nx = -(hgt(X + 1, Y) - hgt(X - 1, Y)) / 2, ny = -(hgt(X, Y + 1) - hgt(X, Y - 1)) / 2, nz = 1;
    const n = Math.hypot(nx, ny, nz);
    const dot = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / n;
    return clamp(0.36 + 0.66 * Math.max(0, dot) + 0.08 * Math.max(0, -dot), 0, 1);
  }

  function drawFace(P, C) {
    // pescoço (cilindro, mais escuro sob o queixo)
    P.fill(40, 60, 58, 80, (X, Y) => X >= 40.5 + (Y - 60) * -0.08 && X <= 57.5 + (Y - 60) * 0.08, (X, Y) => P.ramp(C.skin, clamp(0.5 - 0.28 * g2(X, Y, 49, 62, 9, 3.5) - (X < 44 ? 0.14 : 0), 0, 1), X, Y));
    // orelha (lado próximo)
    P.fill(29, 40, 35, 54, P.ell(32.3, 47, 3.1, 6), (X, Y) => P.ramp(C.skin, 0.42 - 0.25 * g2(X, Y, 32.8, 47.5, 1.2, 3), X, Y));
    // rosto iluminado
    P.fill(30, 22, 68, 70, faceInside, (X, Y) => {
      let t = shadeAt(X, Y, faceHeight);
      if (!faceInside(X - 2, Y)) t -= 0.08;          // borda esquerda em sombra
      return P.ramp(C.skin, t, X, Y);
    });
  }

  // olho amendoado com pálpebra, dobra, íris, pupila, brilho e canto interno
  function eye(P, C, ex, ey, w, h, mood, outer) {
    const lash = C.lash, sclera = '#ece4da', scleraS = '#c8bcb0';
    if (mood === 'happy') {
      P.line([[ex - w / 2, ey], [ex - w / 4, ey - 1.6], [ex + w / 4, ey - 1.6], [ex + w / 2, ey]], lash, 1);
      P.line([[ex - w / 3, ey + 1.5], [ex + w / 3, ey + 1.5]], C.skin[1]);
      P.line([[ex - w / 2 + 1, ey - 3.5], [ex + w / 2 - 1, ey - 3.8]], C.skin[1]);
      return;
    }
    const hh = mood === 'surprised' ? h * 1.3 : h;
    const top = (X) => ey - hh * 0.6 * Math.sqrt(Math.max(0, 1 - ((X - ex) / (w / 2)) ** 2)) - (X - ex) * outer * 0.06;
    const bot = (X) => ey + hh * 0.42 * Math.sqrt(Math.max(0, 1 - ((X - ex) / (w / 2)) ** 2));
    const ix = ex + outer * 0.4, iy = ey + (mood === 'surprised' ? 0 : 0.3), ir = Math.min(hh * 0.62, 2.7);
    for (let X = Math.floor(ex - w / 2); X <= Math.ceil(ex + w / 2); X++) for (let Y = Math.floor(ey - hh); Y <= Math.ceil(ey + hh); Y++) {
      const cx = X + 0.5, cy = Y + 0.5;
      if (cy < top(cx) || cy > bot(cx)) continue;
      const di = Math.hypot(cx - ix, cy - iy);
      if (di <= 0.95) P.set(X, Y, '#0e0808');
      else if (di <= ir) P.set(X, Y, di > ir - 0.8 ? C.irisD : (cy > iy + 0.5 ? C.irisL : C.iris));
      else P.set(X, Y, cy < top(cx) + 1.1 ? scleraS : sclera);
    }
    P.set(ix - 1, iy - 1, '#ffffff'); P.set(ix + 1, iy + 1, '#f0e8e0');
    // pálpebra superior (mais grossa e alongada no canto externo) e cílios
    const pts = []; for (let X = ex - w / 2 - 0.5; X <= ex + w / 2 + 0.5; X += 1) pts.push([X, top(X) - 0.7]);
    P.line(pts, lash, 1);
    const oe = outer > 0 ? ex + w / 2 : ex - w / 2;
    P.line([[oe, top(oe) - 0.7], [oe + outer * 1.5, top(oe) - 1.6]], lash, 1);
    if (C.lashes) { P.set(oe + outer * 2.3, top(oe) - 2.6, lash); P.set(oe + outer * 0.6, top(oe) - 2.2, lash); }
    // dobra da pálpebra, pálpebra inferior e canto interno
    const crease = []; for (let X = ex - w / 2 + 1.5; X <= ex + w / 2; X += 1) crease.push([X, top(X) - 2.6]);
    P.line(crease, C.skin[1]);
    P.line([[ex - w / 3, bot(ex - w / 3) + 0.8], [ex + w / 3, bot(ex + w / 3) + 0.8]], C.skin[1]);
    const ie = outer > 0 ? ex - w / 2 : ex + w / 2;
    P.set(ie, ey, '#c4806e');
  }

  function brow(P, C, x0, x1, y, mood, inner) {
    // arco com a cabeça (lado interno) mais grossa, afinando para fora
    const lift = mood === 'worried' ? -1.5 : mood === 'determined' ? 1.5 : mood === 'surprised' ? -1.5 : 0;
    const liftO = mood === 'surprised' ? -1.5 : mood === 'worried' ? 0.8 : mood === 'determined' ? -0.5 : 0;
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const t = i / n, X = x0 + (x1 - x0) * t;
      const fromInner = inner < 0 ? t : 1 - t;              // 0 no lado interno
      const arch = -1.6 * Math.sin(Math.PI * clamp(fromInner * 0.9 + 0.05, 0, 1));
      const Y = y + arch + lift * (1 - fromInner) + liftO * fromInner;
      const thick = fromInner < 0.45 ? 2 : 1;
      for (let j = 0; j < thick; j++) P.set(X, Y + j, j === 0 && thick === 2 && fromInner < 0.2 ? C.browL : C.brow);
    }
  }

  function noseMouth(P, C, mood) {
    // nariz: base e narinas (o volume vem do sombreamento)
    P.set(48.5, 55, C.skin[0]); P.set(49.5, 55.5, C.skin[0]); P.set(54.5, 55, C.skin[0]);
    P.line([[50, 56], [54, 56]], C.skin[1]);
    P.set(52, 52, C.skin[4]); P.set(52, 51, C.skin[4]);
    const L = C.lip, mx = 51, my = 61;
    const dark = '#4a1e1a';
    switch (mood) {
      case 'happy':
        P.fill(44, my - 1, 58, my + 3, (X, Y) => { const t = (X - mx) / 6.5; return Math.abs(t) <= 1 && Y >= my - 0.5 + 0.8 * t * t && Y <= my + 2.6 - 1.4 * t * t; }, () => dark);
        P.line([[46, my], [56, my]], '#f0ece4'); P.line([[47, my + 1], [55, my + 1]], '#e4dcd0');
        P.line([[47, my + 3], [55, my + 3]], L[1]); P.line([[49, my + 3], [52, my + 3]], L[2]);
        P.set(44, my - 1, dark); P.set(58, my - 1, dark);
        break;
      case 'surprised':
        P.fill(48, my - 2, 54, my + 3, P.ell(mx, my + 0.5, 2.4, 2.8), () => dark);
        P.line([[49, my - 2], [53, my - 2]], L[0]); P.line([[49, my + 3.5], [53, my + 3.5]], L[1]);
        break;
      case 'worried':
        P.line([[45, my + 1], [47, my], [55, my], [57, my + 1]], dark);
        P.line([[47, my - 1], [55, my - 1]], L[0]); P.line([[47, my + 1], [55, my + 1]], L[1]); P.line([[49, my + 2], [53, my + 2]], L[2]);
        break;
      case 'determined':
        P.line([[45, my], [57, my - 0.5]], dark);
        P.line([[46, my - 1], [56, my - 1]], L[0]); P.line([[47, my + 1], [55, my + 1]], L[1]);
        break;
      default:
        P.line([[44.5, my - 1], [46, my], [56, my], [57.5, my - 1]], dark);
        P.line([[46, my - 1], [56, my - 1]], L[0]); P.line([[49, my - 1.5], [53, my - 1.5]], L[0]);
        P.line([[47, my + 1], [55, my + 1]], L[1]); P.line([[48, my + 2], [54, my + 2]], L[1]); P.line([[49, my + 1], [52, my + 1]], L[2]);
    }
  }

  function features(P, C, mood) {
    brow(P, C, 34, 45, 38, mood, 1);
    brow(P, C, 53, 63, 38, mood, -1);
    eye(P, C, 40.5, 44, 9, 4.6, mood, -1);
    eye(P, C, 58, 44, 8, 4.4, mood, 1);
    noseMouth(P, C, mood);
  }

  // ——— Piatã ———
  function piata(mood) {
    const P = Canvas();
    const C = {
      skin: ['#5a3620', '#7a4a2c', '#9c613a', '#b5774c', '#cb9066'], lip: ['#7a3c2e', '#9a5444', '#b46a58'],
      brow: '#141016', browL: '#2a2430', lash: '#100c10', iris: '#4a2814', irisD: '#2a160a', irisL: '#6e4222'
    };
    const HAIR = ['#0c0a10', '#18141e', '#26202e', '#3a3446'];
    // tronco: camiseta clara com dobras, alças da mochila e colar
    const TEE = ['#b4ad98', '#cdc5b1', '#e2ddcf', '#f2efe6'];
    P.fill(0, 72, 95, 95, (X, Y) => ((X - 48) / 47) ** 2 + ((Y - 99) / 28) ** 2 <= 1, (X, Y) => P.ramp(TEE, 0.72 - 0.35 * g2(X, Y, 48, 75, 10, 4) - (X - 48) * 0.006 - 0.12 * g2(X, Y, 30, 88, 3, 8) - 0.1 * g2(X, Y, 66, 90, 3, 8), X, Y));
    P.fill(38, 70, 60, 80, (X, Y) => ((X - 49) / 9.5) ** 2 + ((Y - 71) / 6) ** 2 <= 1 && Y > 71, (X, Y) => P.ramp(C.skin, 0.38, X, Y));
    for (const [x0, w, sh] of [[17, 9, 0], [70, 9, 1]]) P.fill(x0, 74, x0 + w, 95, (X, Y) => Y > 74 + (x0 < 48 ? (26 - X) * 0.3 : (X - 70) * 0.3), (X, Y) => P.ramp(['#4a2a16', '#6a3e22', '#86542e', '#a06a3c'], 0.62 - sh * 0.25 - (X - x0) * 0.03, X, Y));
    P.fill(19, 82, 25, 86, () => true, (X, Y) => P.ramp(['#8a6a30', '#c8a060', '#e8c888'], Y < 84 ? 0.8 : 0.4, X, Y));
    P.line([[42, 71], [46, 80], [49, 84]], '#5a3c22'); P.line([[56, 71], [52, 80], [49, 84]], '#5a3c22');
    P.fill(45, 83, 53, 92, P.ell(49, 87.5, 3, 4.5), (X, Y) => P.ramp(['#2a6a24', '#3e8a32', '#5aae44', '#86d064'], 0.75 - (X - 47) * 0.1 - (Y - 85) * 0.05, X, Y));
    P.line([[49, 84], [49, 91]], '#2a6a24');
    drawFace(P, C);
    // cabelo: volume preto com mechas espetadas
    const spikes = [[22, 34, 9, 24], [24, 26, 12, 12], [30, 20, 22, 3], [38, 16, 35, -1], [47, 15, 50, -2], [56, 16, 63, 0], [63, 20, 73, 8], [67, 27, 79, 20], [68, 34, 78, 32], [21, 40, 13, 40]];
    const hairIn = (X, Y) => {
      if (((X - 48) / 23) ** 2 + ((Y - 30) / 15) ** 2 <= 1 && Y < 37) return true;
      for (const [bx, by, tx, ty] of spikes) {
        const dx = tx - bx, dy = ty - by, L2 = dx * dx + dy * dy, t = clamp(((X - bx) * dx + (Y - by) * dy) / L2, 0, 1);
        const px = bx + dx * t, py = by + dy * t, w = 6.5 * (1 - t);
        if (Math.hypot(X - px, Y - py) <= w) return true;
      }
      return (X < 33 && Y < 47 && Y > 30 && X > 28.5) || (X > 63.5 && X < 67 && Y < 42 && Y > 30);
    };
    P.fill(4, -2, 92, 48, hairIn, (X, Y) => {
      const strand = 0.5 + 0.5 * Math.sin(X * 0.75 + Y * 0.45 + noise(Math.floor(X / 3), Math.floor(Y / 3)) * 3);
      const lightDir = clamp(1 - Math.hypot(X - 34, Y - 12) / 40, 0, 1);
      return P.ramp(HAIR, clamp(0.15 + 0.45 * lightDir + 0.3 * strand * lightDir, 0, 1), X, Y);
    });
    // franja irregular sobre a testa e sombra do cabelo na pele
    for (const [x, len] of [[33, 6], [36, 4], [39, 7], [43, 4], [46, 6], [50, 3], [53, 6], [57, 4], [60, 5], [63, 3]]) P.line([[x, 34], [x + 1, 34 + len]], HAIR[1], 2);
    for (let X = 31; X <= 65; X++) { const Y = 36 + (X % 7 === 0 ? 4 : X % 3 === 0 ? 2 : 0) + (X > 38 && X < 45 ? 4 : 0); if (faceInside(X + 0.5, Y + 1.5)) P.set(X, Y + 1, C.skin[1]); }
    // faixa vermelha e laranja com grafismo, acompanhando a curva da cabeça
    const bandY = (X) => 27 + 0.0045 * (X - 49) ** 2;
    P.fill(23, 22, 74, 38, (X, Y) => X > 24 && X < 73 && Y >= bandY(X) && Y < bandY(X) + 6.5, (X, Y) => {
      const r = Y - bandY(X);
      if (r < 1.2) return '#ee8a3a';
      if (r < 2.2) return '#e0602c';
      if (r > 5.4) return '#8a1e1a';
      const m = (X - 26) % 7;
      if (r > 2.4 && r < 4.8) { if (m === 1 || m === 2) return '#f2c230'; if (m === 4) return '#f4f0e8'; }
      return X < 32 ? '#a8261f' : '#c8302a';
    });
    P.fill(8, 30, 26, 48, (X, Y) => (Y > 31 && Y < 36 && X > 14 && X < 25) || (Y > 35 && Y < 41 && X > 8 && X < 19) || (X > 10 && X < 14 && Y > 40 && Y < 46), (X, Y) => Y % 4 === 0 ? '#8a1e1a' : (X + Y) % 6 === 0 ? '#e0602c' : '#b82a24');
    features(P, C, mood);
    P.outline();
    return P.done();
  }

  // ——— Larinha ———
  function larinha(mood) {
    const P = Canvas();
    const C = {
      skin: ['#7a4a30', '#9a6244', '#bb7d56', '#d29870', '#e4b088'], lip: ['#8a4438', '#a85a4c', '#c27262'],
      brow: '#2e1a10', browL: '#4a2c1c', lash: '#160c08', iris: '#5a3218', irisD: '#34200e', irisL: '#8a5a30', lashes: true
    };
    const HAIR = ['#24120a', '#3e2214', '#5a321e', '#7a4628', '#9a5e34'];
    // cachos: cada cacho é uma pequena esfera iluminada de cima à esquerda
    const curl = (cx, cy, r) => P.fill(cx - r, cy - r, cx + r, cy + r, P.ell(cx, cy, r, r), (X, Y) => P.ramp(HAIR, clamp(0.5 - ((X - cx) + (Y - cy)) / (2.4 * r) - 0.2 * noise(cx, cy) + 0.12 * clamp(1 - Math.hypot(cx - 30, cy - 20) / 40, 0, 1), 0, 1), X, Y));
    // volume de trás e rabo de cavalo
    const back = [];
    for (let i = 0; i < 170; i++) { const a = noise(i, 1) * Math.PI * 2, rr = Math.sqrt(noise(i, 2)); back.push([48 + Math.cos(a) * rr * 28, 45 + Math.sin(a) * rr * 27, 2.6 + noise(i, 3) * 1.8]); }
    for (let i = 0; i < 70; i++) { const a = noise(i, 7) * Math.PI * 2, rr = Math.sqrt(noise(i, 8)); back.push([21 + Math.cos(a) * rr * 13, 18 + Math.sin(a) * rr * 12, 2.4 + noise(i, 9) * 1.6]); }
    back.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).reverse().forEach(([x, y, r]) => curl(x, y, r));
    // tronco: camisa rosa aberta, camiseta branca, alças da EcoPack e broche
    const PINK = ['#8e2a56', '#b83a6e', '#d84c84', '#ec72a0'];
    P.fill(0, 72, 95, 95, (X, Y) => ((X - 48) / 47) ** 2 + ((Y - 99) / 28) ** 2 <= 1, (X, Y) => P.ramp(PINK, 0.7 - (X - 48) * 0.006 - 0.15 * g2(X, Y, 30, 88, 3, 8) - 0.12 * g2(X, Y, 66, 90, 3, 8), X, Y));
    P.fill(36, 70, 62, 96, (X, Y) => Math.abs(X - 49) < 9 - (Y - 72) * 0.05 && Y > 71, (X, Y) => P.ramp(['#c8c0b8', '#e2dcd4', '#f4f0e8'], 0.75 - 0.4 * g2(X, Y, 49, 72, 8, 3), X, Y));
    P.fill(38, 70, 60, 80, (X, Y) => ((X - 49) / 8.5) ** 2 + ((Y - 71) / 4.5) ** 2 <= 1 && Y > 71, (X, Y) => P.ramp(C.skin, 0.4, X, Y));
    P.line([[39, 72], [35, 86]], '#8e2a56', 2); P.line([[59, 72], [63, 86]], '#8e2a56', 2);
    for (const [x0, w, sh] of [[17, 9, 0], [70, 9, 1]]) P.fill(x0, 74, x0 + w, 95, (X, Y) => Y > 74 + (x0 < 48 ? (26 - X) * 0.3 : (X - 70) * 0.3), (X, Y) => P.ramp(['#141c30', '#24304e', '#34446a', '#4a5c88'], 0.62 - sh * 0.25 - (X - x0) * 0.03, X, Y));
    P.fill(20, 84, 23, 86, () => true, () => '#5ae0f0'); P.fill(73, 87, 76, 89, () => true, () => '#5ae0f0');
    P.fill(28, 80, 34, 84, () => true, (X, Y) => Y === 80 ? '#7ad05a' : '#3e8a32');
    // cacho lateral atrás do rosto (lado próximo)
    for (const [x, y, r] of [[30, 44, 3], [28, 49, 3], [30, 54, 3], [29, 59, 2.8], [32, 63, 2.6]]) curl(x, y, r);
    drawFace(P, C);
    // sardas leves
    for (const [x, y] of [[37, 50], [39, 52], [41, 50], [36, 53], [57, 51], [60, 50], [59, 53], [62, 52]]) P.set(x, y, C.skin[1]);
    // franja de cachos curtos e cachos que emolduram o rosto
    for (const [x, y, r] of [[33, 33, 3], [37, 31, 3], [42, 30, 3], [47, 30, 3], [52, 30, 3], [57, 31, 3], [62, 33, 3], [65, 37, 2.8], [31, 38, 2.6], [35, 35.5, 2.2], [40, 34, 2.2], [45, 33.5, 2], [50, 33.5, 2], [55, 34, 2.2], [60, 35.5, 2.2], [66, 43, 2.6], [67, 48, 2.4], [30, 43, 2.6]]) curl(x, y, r);
    for (let X = 33; X <= 63; X++) { const Y = 37 + (X % 5 === 0 ? 1 : 0); if (faceInside(X + 0.5, Y + 1.5)) P.set(X, Y + 1, C.skin[1]); }
    P.fill(30, 59, 33, 62, () => true, (X, Y) => (X + Y) % 2 ? '#5ae0f0' : '#c8f8ff'); // brinco
    // óculos de aviador azuis sobre a testa: alça, aro metálico e lentes com reflexo
    const strapY = (X) => 25 + 0.004 * (X - 49) ** 2;
    P.fill(14, 18, 84, 34, (X, Y) => X > 15 && X < 83 && Y >= strapY(X) && Y < strapY(X) + 4.5, (X, Y) => (Y - strapY(X)) < 1 ? '#6a6a7a' : (Y - strapY(X)) > 3.5 ? '#1e1e28' : '#3a3a48');
    for (const [gx, gy] of [[40, 25], [58, 25]]) {
      P.fill(gx - 9, gy - 8, gx + 9, gy + 8, P.ell(gx, gy, 8.5, 7.5), (X, Y) => P.ramp(['#5a5e6c', '#8a90a0', '#b8bcc8', '#e2e6ee'], clamp(0.6 - ((X - gx) + (Y - gy)) / 14, 0, 1), X, Y));
      P.fill(gx - 7, gy - 6, gx + 7, gy + 6, P.ell(gx, gy, 6.3, 5.4), (X, Y) => P.ramp(['#123e6e', '#1e64a4', '#2e8ad0', '#4ab8e8', '#8ad8f8'], clamp(0.75 - ((Y - gy) + 0.5 * (X - gx)) / 10 - 0.25 * g2(X, Y, gx + 2, gy + 2, 3, 2), 0, 1), X, Y));
      P.line([[gx - 4, gy - 3], [gx - 2, gy - 4]], '#ffffff'); P.set(gx - 4, gy - 2, '#ffffff'); P.set(gx + 3, gy + 3, '#c8f0ff');
    }
    P.fill(47, 23, 51, 28, () => true, (X, Y) => Y < 25 ? '#8a90a0' : '#4a4e5c');
    features(P, C, mood);
    P.outline();
    return P.done();
  }

  function get(who, mood = 'neutral') {
    const key = who + '_' + mood;
    if (cache[key]) return cache[key];
    let c;
    if (who === 'piata') c = piata(mood);
    else if (who === 'larinha') c = larinha(mood);
    else {
      const [cc, x] = GC.U.makeCanvas(S, S); x.imageSmoothingEnabled = false;
      x.drawImage(GC.Portraits.get(who, mood), 8, 8, 80, 80); c = cc; // demais: 40×40 ampliado 2×
    }
    cache[key] = c;
    return c;
  }
  return { get, SIZE: S };
})();
