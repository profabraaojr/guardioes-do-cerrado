// Fundos em paralaxe gerados proceduralmente para cada ambiente.
// Chapadas de topo plano, árvores retorcidas do Cerrado, buritis e torres de arenito.
GC.Background = (function () {
  const W = 640, H = 270, U = GC.U;
  const SKIES = {
    rio:     ['#2c3e6e', '#c76a6a', '#f2b26b', '#f8d89a'],   // amanhecer sobre o Rio Vermelho
    cerrado: ['#5aa0d8', '#8cc4e6', '#e8e0b0', '#f2d8a0'],   // dia seco, luz dourada
    carima:  ['#3a9ad0', '#7cc8e8', '#c8ecf0', '#e0f4ee'],
    pedra:   ['#d07a4a', '#e8a060', '#f4c88a', '#f8dca8'],   // fim de tarde sobre a Cidade de Pedra
    boss:    ['#3a2230', '#7a3a34', '#b85a3a', '#d88a4a'],   // céu tomado pela fumaça
    healed:  ['#4a7ac8', '#8ab4e0', '#f4d49a', '#fbe6b8']
  };
  const FAR = { rio: '#8a6a8a', cerrado: '#8aa0b0', carima: '#6a9aa0', pedra: '#b06a5a', boss: '#5a3036', healed: '#8a9ab8' };
  const MID = { rio: '#4a4a5e', cerrado: '#5e6a3a', carima: '#2e6a4a', pedra: '#7a4a36', boss: '#3a2626', healed: '#3e6a3a' };
  const NEAR = { rio: '#2a3438', cerrado: '#3e4a22', carima: '#1e4a32', pedra: '#4e2e22', boss: '#241818', healed: '#2a4a24' };
  const cache = {};

  function tree(x, cx, base, scale, col) {
    // árvore do Cerrado: tronco tortuoso e copa irregular
    x.fillStyle = col;
    let tx = cx, ty = base;
    const r = U.rng((cx * 13) | 0);
    for (let i = 0; i < 18 * scale; i++) { x.fillRect(Math.round(tx), Math.round(ty), Math.max(2, 3 * scale), 2); ty -= 1.4; tx += (r() - 0.5) * 2.2; }
    const blobs = 4 + ((r() * 3) | 0);
    for (let i = 0; i < blobs; i++) {
      const bx = tx + (r() - 0.5) * 26 * scale, by = ty + (r() - 0.6) * 10 * scale, br = (6 + r() * 7) * scale;
      x.beginPath(); x.ellipse(bx, by, br * 1.4, br * 0.8, 0, 0, Math.PI * 2); x.fill();
    }
  }
  function buriti(x, cx, base, h, col) {
    x.fillStyle = col;
    x.fillRect(cx, base - h, 3, h);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.1 + i * 0.1);
      for (let k = 0; k < 14; k++) x.fillRect(Math.round(cx + 1 + Math.cos(a) * k * 1.2 * (i < 5 ? -1 : 1) * (i < 5 ? 1 : 1)), Math.round(base - h - Math.sin(a) * k * 0.8 + k * k * 0.03), 2, 1);
    }
  }
  function mound(x, cx, base, h, col) {
    x.fillStyle = col;
    x.beginPath(); x.moveTo(cx - h * 0.45, base); x.quadraticCurveTo(cx - h * 0.2, base - h * 1.1, cx, base - h); x.quadraticCurveTo(cx + h * 0.25, base - h * 1.05, cx + h * 0.45, base); x.fill();
  }

  function gen(theme) {
    const out = {};
    const [farC, farX] = U.makeCanvas(W, H);
    const [midC, midX] = U.makeCanvas(W, H);
    const [nearC, nearX] = U.makeCanvas(W, H);
    const r = U.rng(theme.length * 977 + theme.charCodeAt(0));
    // camada distante
    farX.fillStyle = FAR[theme];
    if (theme === 'pedra') {
      for (let i = 0; i < 14; i++) {
        const cx = (i / 14) * W + r() * 20, w = 18 + r() * 30, h = 50 + r() * 70;
        farX.fillRect(cx, 200 - h, w, h + 70);
        farX.fillRect(cx - 4, 200 - h + 8, w + 8, 6); // estratos do arenito
        farX.fillStyle = 'rgba(0,0,0,0.12)'; farX.fillRect(cx + w * 0.6, 200 - h, w * 0.4, h + 70); farX.fillStyle = FAR[theme];
      }
    } else {
      // chapadas: platôs de topo plano com escarpas
      let x = -20;
      while (x < W) {
        const w = 80 + r() * 140, h = 30 + r() * 50, slope = 12 + r() * 18;
        farX.beginPath(); farX.moveTo(x, 210); farX.lineTo(x + slope, 200 - h); farX.lineTo(x + w - slope, 200 - h); farX.lineTo(x + w, 210); farX.fill();
        farX.fillStyle = 'rgba(255,255,255,0.08)'; farX.fillRect(x + slope, 200 - h, w - slope * 2, 3); farX.fillStyle = FAR[theme];
        x += w + r() * 40 - 20;
      }
      farX.fillRect(0, 200, W, 70);
      if (theme === 'rio') {
        // silhueta discreta da cidade e da ponte sobre o rio
        farX.fillStyle = '#6a5070';
        for (let i = 0; i < 26; i++) { const bx = 320 + i * 11, bh = 8 + r() * 26; farX.fillRect(bx, 205 - bh, 9, bh); }
        farX.fillRect(250, 200, 90, 3); for (let i = 0; i < 6; i++) farX.fillRect(256 + i * 15, 200, 2, 10);
      }
    }
    // camada intermediária
    const mc = MID[theme];
    midX.fillStyle = mc;
    midX.beginPath(); midX.moveTo(0, 230);
    for (let x = 0; x <= W; x += 16) midX.lineTo(x, 222 + Math.sin(x * 0.02) * 6 + r() * 4);
    midX.lineTo(W, H); midX.lineTo(0, H); midX.fill();
    const n = theme === 'carima' ? 26 : 18;
    for (let i = 0; i < n; i++) {
      const cx = (i / n) * W + r() * 20;
      const kind = r();
      if ((theme === 'rio' || theme === 'carima') && kind < 0.35) buriti(midX, cx, 228, 40 + r() * 20, mc);
      else if (theme === 'cerrado' && kind < 0.25) mound(midX, cx, 228, 14 + r() * 16, mc);
      else if (theme === 'boss' && kind < 0.5) { midX.fillRect(cx, 200 + r() * 10, 3, 30); midX.fillRect(cx - 4, 212, 10, 2); } // tocos
      else tree(midX, cx, 228, 0.9 + r() * 0.6, mc);
    }
    if (theme === 'carima') {
      // queda d'água distante
      midX.fillStyle = 'rgba(220,240,250,0.55)'; midX.fillRect(410, 150, 10, 80);
      midX.fillStyle = mc; midX.fillRect(380, 140, 70, 12);
    }
    // camada próxima: capim e arbustos
    nearX.fillStyle = NEAR[theme];
    nearX.fillRect(0, 252, W, 18);
    for (let x = 0; x < W; x += 2) {
      const h = 4 + r() * 14;
      nearX.fillRect(x, 252 - h, 1, h);
    }
    for (let i = 0; i < 8; i++) { const cx = r() * W; nearX.beginPath(); nearX.ellipse(cx, 250, 14 + r() * 10, 8 + r() * 6, 0, 0, Math.PI * 2); nearX.fill(); }
    // nuvens
    const [cloudC, cloudX] = U.makeCanvas(W, 120);
    cloudX.fillStyle = theme === 'boss' ? 'rgba(60,40,40,0.55)' : 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 6; i++) {
      const cx = r() * W, cy = 20 + r() * 70;
      for (let k = 0; k < 5; k++) { cloudX.beginPath(); cloudX.ellipse(cx + k * 9 - 18, cy + (k % 2) * 3, 12 + r() * 8, 5 + r() * 3, 0, 0, Math.PI * 2); cloudX.fill(); }
    }
    out.far = farC; out.mid = midC; out.near = nearC; out.cloud = cloudC;
    cache[theme] = out;
    return out;
  }

  function drawLayer(ctx, img, cam, factor, yBase) {
    const off = -((cam.x * factor) % W + W) % W;
    const y = Math.round(yBase - (cam.y - 300) * factor * 0.6);
    for (let x = off; x < GC.CFG.W; x += W) ctx.drawImage(img, Math.round(x), y);
  }

  function drawTheme(ctx, theme, cam, time, alpha) {
    const L = cache[theme] || gen(theme);
    ctx.globalAlpha = alpha;
    const sky = SKIES[theme];
    const g = ctx.createLinearGradient(0, 0, 0, GC.CFG.H);
    g.addColorStop(0, sky[0]); g.addColorStop(0.45, sky[1]); g.addColorStop(0.8, sky[2]); g.addColorStop(1, sky[3]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, GC.CFG.W, GC.CFG.H);
    // sol
    const sunY = theme === 'rio' ? 150 : theme === 'pedra' ? 120 : theme === 'healed' ? 110 : 50;
    if (theme !== 'boss') {
      ctx.fillStyle = theme === 'rio' || theme === 'pedra' ? 'rgba(255,220,150,0.35)' : 'rgba(255,255,220,0.3)';
      ctx.beginPath(); ctx.arc(360, sunY - (cam.y - 300) * 0.05, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme === 'rio' || theme === 'pedra' ? '#ffd890' : '#fff8d8';
      ctx.beginPath(); ctx.arc(360, sunY - (cam.y - 300) * 0.05, 16, 0, Math.PI * 2); ctx.fill();
    }
    const cx = -((cam.x * 0.05 + time * 4) % W);
    for (let x = cx; x < GC.CFG.W; x += W) ctx.drawImage(L.cloud, Math.round(x), Math.round(-(cam.y - 300) * 0.04));
    drawLayer(ctx, L.far, cam, 0.12, -10);
    drawLayer(ctx, L.mid, cam, 0.3, 0);
    drawLayer(ctx, L.near, cam, 0.55, 20);
    ctx.globalAlpha = 1;
  }

  return {
    pregen() { Object.keys(SKIES).forEach(gen); },
    // mistura suave entre ambientes vizinhos
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
