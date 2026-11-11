// Fundos em paralaxe (5 planos) desenhados em pixels nítidos na resolução da tela:
//   1 céu e nuvens · 2 chapadas · 3 morros · 4 mata distante · 5 capim próximo
// O primeiro plano (tufos à frente do jogador) é desenhado pela cena.
GC.Background = (function () {
  const LW = 1920, LH = 540, U = GC.U;
  const THEME = {
    rio: { sky: ['#3a5aa8', '#e0807a', '#f8b878', '#fde0a0'], sun: [700, 300, '#ffe0a0'], cloud: ['#fff4e8', '#f0c8b8', '#c89ab0'],
      far: ['#a888b8', '#c8a8d0', '#8e72a4'], hill: ['#6a8a7a', '#86a68e', '#56746a'], veg: ['#3e6a4a', '#527e56', '#2c5238', '#6a4a3a'], near: ['#4a6a3a', '#6a8a48', '#34502a'], city: true },
    cerrado: { sky: ['#2e8ae0', '#5ab0f0', '#a8dcf8', '#e8f6f0'], sun: [1380, 120, '#fff8d0'], cloud: ['#ffffff', '#d8ecfa', '#9cc4e8'],
      far: ['#94b0e0', '#bcd0f0', '#7c98cc'], hill: ['#62b47e', '#84cc94', '#4c9a68'], veg: ['#3a944a', '#58b858', '#28743a', '#6a4430'], near: ['#d8b848', '#f0d870', '#a88a2c'] },
    carima: { sky: ['#2a90d8', '#58b8ec', '#a8e0f4', '#e0f6f2'], sun: [1500, 110, '#fffbe0'], cloud: ['#ffffff', '#d8f0f8', '#a0cce0'],
      far: ['#86aed0', '#aecae4', '#7096be'], hill: ['#46a874', '#6cc48c', '#348c5e'], veg: ['#2a8a4a', '#48aa5a', '#1c6a38', '#5a4030'], near: ['#5aa848', '#84c860', '#3e8436'], falls: true },
    pedra: { sky: ['#d07848', '#ec9a5a', '#f8c47e', '#fde2aa'], sun: [640, 250, '#ffe2a0'], cloud: ['#fff0dc', '#f4c8a0', '#d89a7a'],
      far: ['#c47a5e', '#e09a78', '#a45e46'], hill: ['#a8864e', '#c4a262', '#8a6a3c'], veg: ['#6a8a3a', '#88a84a', '#4e6a2a', '#6a4430'], near: ['#d8a848', '#eec86a', '#a87a2c'], towers: true },
    boss: { sky: ['#3a2232', '#7a3a36', '#b85a3c', '#d88a4c'], sun: null, cloud: ['#7a5a56', '#5a3e3e', '#3e2a2c'],
      far: ['#6a3a40', '#844a4c', '#542e34'], hill: ['#5a3a30', '#6e4a3a', '#46302a'], veg: ['#4a3a2a', '#5a4a34', '#362a1e', '#3a2a1e'], near: ['#6a5030', '#86683c', '#4c3822'], stumps: true },
    healed: { sky: ['#3a7ad0', '#78b0e8', '#f4cc90', '#fde6b6'], sun: [1200, 230, '#fff0c0'], cloud: ['#ffffff', '#f8e4d0', '#d8b8a8'],
      far: ['#98a8d8', '#c0cceb', '#8090c4'], hill: ['#5ab47a', '#7ccc90', '#469a64'], veg: ['#3a9a4a', '#5abc58', '#28783a', '#6a4430'], near: ['#d8c04c', '#f2dc74', '#aa8c2e'], ipes: true }
  };
  const cache = {};

  function cloudsLayer(th, r) {
    const P = new GC.Pix(LW, 300);
    for (let i = 0; i < 9; i++) {
      const cx = r() * LW, cy = 40 + r() * 180, s = 0.7 + r() * 0.8;
      const puffs = [[-50, 6, 30], [-20, -10, 40], [20, -14, 44], [56, 4, 30], [0, 10, 46]];
      // contorno, sombra e corpo (nuvem arredondada)
      for (const [dx, dy, rr] of puffs) P.ellipse(cx + dx * s, cy + dy * s, rr * s + 3, rr * s * 0.62 + 3, th.cloud[2]);
      for (const [dx, dy, rr] of puffs) P.ellipse(cx + dx * s, cy + dy * s + 4, rr * s, rr * s * 0.62, th.cloud[1]);
      for (const [dx, dy, rr] of puffs) P.ellipse(cx + dx * s, cy + dy * s - 2, rr * s - 2, rr * s * 0.62 - 4, th.cloud[0]);
    }
    return P.c;
  }

  function farLayer(th, r) {
    const P = new GC.Pix(LW, LH);
    const base = 360;
    if (th.towers) {
      // torres de arenito da Cidade de Pedra
      for (let i = 0; i < 18; i++) {
        const x = (i / 18) * LW + r() * 40, w = 40 + r() * 70, h = 100 + r() * 150;
        P.rect(x, base - h, w, h + 200, th.far[0]);
        for (let k = 0; k < 4; k++) P.rect(x - 4, base - h + 20 + k * 34, w + 8, 6, th.far[1]);
        P.rect(x + w * 0.62, base - h, w * 0.38, h + 200, th.far[2]);
        P.rect(x, base - h, w, 3, th.far[1]);
      }
    } else {
      // chapadas: platôs de topo plano com escarpas
      let x = -60;
      while (x < LW + 60) {
        const w = 150 + r() * 220, h = 50 + r() * 100, sl = 24 + r() * 30;
        P.poly([[x, base + 40], [x + sl, base - h], [x + w - sl, base - h], [x + w, base + 40]], th.far[0]);
        P.poly([[x + sl, base - h], [x + w - sl, base - h], [x + w - sl - 6, base - h + 10], [x + sl + 6, base - h + 10]], th.far[1]);
        for (let k = 0; k < 6; k++) { const lx = x + sl + 20 + r() * (w - sl * 2 - 40); P.rect(lx, base - h + 14, 3, h * 0.6, th.far[2]); }
        x += w + 60 + r() * 220;
      }
      P.rect(0, base + 30, LW, LH, th.far[2]);
      if (th.city) {
        for (let i = 0; i < 34; i++) { const bx = 900 + i * 22, bh = 20 + r() * 60; P.rect(bx, base + 10 - bh, 18, bh + 30, th.far[2]); P.rect(bx + 4, base + 16 - bh, 3, 3, '#f8e0a0'); }
        P.rect(700, base, 200, 6, th.far[2]); for (let i = 0; i < 8; i++) P.rect(712 + i * 25, base, 4, 22, th.far[2]);
      }
    }
    return P.c;
  }

  function hillLayer(th, r) {
    const P = new GC.Pix(LW, LH);
    const base = 400;
    for (let i = 0; i < 9; i++) {
      const cx = (i / 9) * LW + r() * 120, rx = 160 + r() * 140, ry = 60 + r() * 60;
      P.ellipse(cx, base, rx + 3, ry + 3, th.hill[2]);
      P.ellipse(cx, base, rx, ry, th.hill[0]);
      P.ellipse(cx - rx * 0.25, base - ry * 0.35, rx * 0.5, ry * 0.4, th.hill[1]);
      for (let k = 0; k < 8; k++) { const bx = cx - rx * 0.7 + r() * rx * 1.4, by = base - ry * 0.6 + r() * ry * 0.5; P.ellipse(bx, by, 6, 4, th.hill[2]); }
    }
    P.rect(0, base, LW, LH - base, th.hill[0]);
    if (th.falls) { P.rect(1210, 250, 24, 160, '#d8f0fa'); for (let k = 0; k < 6; k++) P.rect(1214 + k * 3, 250, 1, 160, '#ffffff'); P.rect(1150, 236, 140, 20, th.hill[2]); }
    return P.c;
  }

  function tree(P, x, base, s, th, r, kind) {
    const [c0, c1, c2, trunk] = th.veg;
    if (kind === 'buriti') {
      P.rect(x - 2, base - 110 * s, 5, 110 * s, '#7a5a3a');
      for (let i = 0; i < 12; i++) { const a = Math.PI * (0.05 + i * 0.08); for (let k = 0; k < 26; k++) P.rect(x + Math.cos(a) * k * 1.4, base - 112 * s - Math.sin(a) * k * 0.9 + k * k * 0.04, 3, 2, i % 2 ? c0 : c1); }
      return;
    }
    if (kind === 'mound') { P.ellipse(x, base - 12 * s, 12 * s, 22 * s, '#d0844a'); P.ellipse(x - 3, base - 18 * s, 4 * s, 10 * s, '#e8a060'); return; }
    if (kind === 'stump') { P.rect(x - 6, base - 18, 12, 18, '#4a3420'); P.rect(x - 6, base - 18, 12, 3, '#8a6a4a'); return; }
    // árvore do Cerrado: tronco tortuoso e copa aberta
    let tx = x, ty = base;
    for (let i = 0; i < 46 * s; i++) { P.rect(tx, ty, 5 * s, 2, trunk); ty -= 1.6; tx += (r() - 0.5) * 2.4; }
    const yellow = kind === 'ipe';
    const cols = yellow ? ['#f2c230', '#fde27a', '#c8961e'] : [c0, c1, c2];
    for (let i = 0; i < 7; i++) {
      const bx = tx + (r() - 0.5) * 70 * s, by = ty + (r() - 0.7) * 24 * s, rr = (14 + r() * 14) * s;
      P.ellipse(bx, by + 4, rr * 1.4, rr * 0.75, cols[2]);
      P.ellipse(bx, by, rr * 1.35, rr * 0.7, cols[0]);
      P.ellipse(bx - rr * 0.3, by - rr * 0.25, rr * 0.6, rr * 0.32, cols[1]);
    }
  }

  function vegLayer(th, r) {
    const P = new GC.Pix(LW, LH);
    const base = 440;
    P.rect(0, base, LW, LH - base, th.veg[2]);
    P.rect(0, base, LW, 6, th.veg[0]);
    const n = 30;
    for (let i = 0; i < n; i++) {
      const x = (i / n) * LW + r() * 40, k = r();
      let kind = 'tree';
      if (th.stumps) kind = k < 0.6 ? 'stump' : 'tree';
      else if (k < 0.18) kind = 'buriti';
      else if (k < 0.3 && !th.falls) kind = 'mound';
      else if (k < 0.38 || (th.ipes && k < 0.6)) kind = 'ipe';
      tree(P, x, base + 4, 0.8 + r() * 0.5, th, r, kind);
    }
    return P.c;
  }

  function nearLayer(th, r) {
    const P = new GC.Pix(LW, LH);
    const base = 500;
    P.rect(0, base, LW, LH - base, th.near[2]);
    // capim alto com hastes douradas
    for (let x = 0; x < LW; x += 3) {
      const h = 18 + r() * 34, lean = (r() - 0.5) * 8;
      P.line(x, base + 4, x + lean, base - h, r() < 0.5 ? th.near[0] : th.near[2]);
      if (r() < 0.25) P.rect(x + lean - 1, base - h - 2, 3, 3, th.near[1]);
    }
    for (let i = 0; i < 14; i++) { const cx = r() * LW; P.ellipse(cx, base + 6, 30 + r() * 30, 16 + r() * 10, '#3e7a32'); P.ellipse(cx - 6, base, 16, 8, '#5a9a42'); }
    return P.c;
  }

  function gen(theme) {
    const th = THEME[theme];
    const r = U.rng(theme.length * 977 + theme.charCodeAt(0) * 31);
    cache[theme] = { cloud: cloudsLayer(th, r), far: farLayer(th, r), hill: hillLayer(th, r), veg: vegLayer(th, r), near: nearLayer(th, r) };
    return cache[theme];
  }

  function layer(ctx, img, cam, factor, yBase, K) {
    const off = -(((cam.x * factor * K) % LW) + LW) % LW;
    const y = Math.round(yBase - (cam.y - 300) * factor * 0.6 * K);
    for (let x = Math.round(off); x < GC.CFG.W * K; x += LW) ctx.drawImage(img, x, y);
  }

  function drawTheme(ctx, theme, cam, time, alpha) {
    const L = cache[theme] || gen(theme), th = THEME[theme], K = GC.CFG.SCALE;
    const W = GC.CFG.W * K, H = GC.CFG.H * K;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    // céu em faixas (gradiente quantizado, típico de pixel art)
    const bands = 18;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1), seg = t * 3, k = Math.min(2, Math.floor(seg)), f = seg - k;
      const a = th.sky[k], b = th.sky[k + 1];
      ctx.fillStyle = mix(a, b, f);
      ctx.fillRect(0, Math.floor(i * H / bands), W, Math.ceil(H / bands) + 1);
    }
    if (th.sun) {
      const [sx, sy, sc] = th.sun, yy = sy - (cam.y - 300) * 0.05 * K;
      const x = ((sx - cam.x * 0.02 * K) % W + W) % W;
      ctx.fillStyle = 'rgba(255,250,220,0.18)'; circle(ctx, x, yy, 92);
      ctx.fillStyle = 'rgba(255,250,220,0.28)'; circle(ctx, x, yy, 64);
      ctx.fillStyle = sc; circle(ctx, x, yy, 40);
    }
    const cx = -(((cam.x * 0.04 * K + time * 8) % LW) + LW) % LW;
    for (let x = cx; x < W; x += LW) ctx.drawImage(L.cloud, Math.round(x), Math.round(-(cam.y - 300) * 0.04 * K));
    layer(ctx, L.far, cam, 0.1, -96, K);
    layer(ctx, L.hill, cam, 0.22, -120, K);
    layer(ctx, L.veg, cam, 0.4, -150, K);
    layer(ctx, L.near, cam, 0.62, -186, K);
    ctx.restore();
  }
  function circle(ctx, x, y, r) { for (let dy = -r; dy <= r; dy += 2) { const w = Math.sqrt(r * r - dy * dy); ctx.fillRect(Math.round(x - w), Math.round(y + dy), Math.round(w * 2), 2); } }
  function mix(a, b, f) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - f) + ((pb >> s) & 255) * f));
    return 'rgb(' + c.join(',') + ')';
  }

  return {
    THEME,
    pregen() { Object.keys(THEME).forEach(gen); },
    // gera os planos aos poucos, sem travar a tela
    pregenAsync() { const list = Object.keys(THEME).filter((t) => !cache[t]); const step = () => { const t = list.shift(); if (!t) return; if (!cache[t]) gen(t); setTimeout(step, 30); }; setTimeout(step, 30); },
    draw(ctx, level, cam, time, override) {
      if (override) { drawTheme(ctx, override, cam, time, 1); return; }
      const cxw = cam.x + GC.CFG.W / 2;
      const z = level.zoneAt(cxw) || level.zones[0];
      drawTheme(ctx, z.theme, cam, time, 1);
      const idx = level.zones.indexOf(z);
      const next = level.zones[idx + 1];
      if (next && next.theme !== z.theme) {
        const edge = next.x0 * 16, span = 200;
        const t = GC.U.clamp((cxw - (edge - span)) / span, 0, 1);
        if (t > 0) drawTheme(ctx, next.theme, cam, time, GC.U.ease(t));
      }
    }
  };
})();
