// Sistema de diálogos em canvas próprio, desenhado na resolução física do aparelho.
// A caixa é dimensionada pela altura do palco (u = pixels físicos por unidade do jogo):
// molduras e placas mantêm o traço de pixel art em blocos de q pixels; o texto usa a
// fonte Pixelify Sans em alta resolução; os retratos de 80×80 (GC.PortraitsHD) são
// ampliados por um fator inteiro, sem suavização.
GC.DialogUI = (function () {
  const F = () => GC.Font;
  let cv, cx, bw = 960, bh = 540, u = 2, q = 2, dpr = 1;
  let dlg = null;      // { pages, page, onDone, shown, total }
  let speech = null;   // { who, text, t }
  let time = 0, dirty = true;

  const TEXT = '#f4f0e6', SHADOW = '#05080f';
  const HL = { a: '#4ad8f8', y: '#f8c838', g: '#7ad860' };
  const PLATES = {
    piata: { bg: '#5ec04a', hi: '#9ae07a', lo: '#2e7a24', ink: '#0c2410' },
    larinha: { bg: '#f2c230', hi: '#fde27a', lo: '#a8800c', ink: '#2a1e08' },
    cida: { bg: '#e8a040', hi: '#f8c878', lo: '#9a6018', ink: '#2a1606' },
    vertice: { bg: '#9aa0c8', hi: '#c8ccec', lo: '#5a6088', ink: '#14162a' },
    rafael: { bg: '#5ac8b0', hi: '#9ae8d8', lo: '#2a7a6a', ink: '#082420' },
    infrator: { bg: '#c86a4a', hi: '#e89a7a', lo: '#7a3a24', ink: '#200a04' }
  };
  const FONT = '"Pixelify Sans", "Atkinson Hyperlegible", monospace';
  const font = (px, w) => (w || 500) + ' ' + Math.round(px) + 'px ' + FONT;

  function init(canvas) {
    cv = canvas; cx = cv.getContext('2d');
    cv.addEventListener('pointerdown', (e) => { if (dlg) { e.preventDefault(); advance(); } });
  }

  function resize(cssW, cssH) {
    if (!cv) return; // ainda não inicializado (redimensionamento antes do boot)
    dpr = Math.max(1, Math.min(4, window.devicePixelRatio || 1));
    bw = Math.round(cssW * dpr); bh = Math.round(cssH * dpr);
    cv.width = bw; cv.height = bh;
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    u = bh / 270;                      // pixels físicos por unidade lógica do jogo
    q = Math.max(1, Math.round(u));    // tamanho do "pixel" das molduras
    cx.imageSmoothingEnabled = false;
    if (dlg) layout(dlg);
    dirty = true;
  }

  function moodFor(L) {
    if (L.mood) return L.mood;
    const t = F().plain(L.text);
    if (/!/.test(t) && /\?/.test(t)) return 'surprised';
    if (/!\s*$/.test(t)) return 'happy';
    if (/\?\s*$/.test(t)) return 'worried';
    return 'neutral';
  }

  // ——— Layout dinâmico (pixels físicos) ———
  // Caixa: até 600 unidades de largura e 3 linhas por página; retrato de 80×80
  // ampliado por fator inteiro à esquerda, sobressaindo acima da caixa.
  function geometry(L) {
    const narr = L.who === 'narrador';
    const m = Math.round(8 * u);
    const boxW = Math.min(bw - m * 2, Math.round(600 * u));
    const boxX = Math.round((bw - boxW) / 2);
    const fs = 11.5 * u, lh = Math.round(fs * 1.32);
    const pad = Math.round(13 * u);
    const boxH = pad * 2 + lh * 3;
    const boxY = bh - m - boxH;
    const pk = Math.max(1, Math.round(u * 1.12));             // fator inteiro do retrato
    const ps = 80 * pk, frame = ps + q * 8;
    const tx = narr ? boxX + pad + q * 4 : boxX + frame + Math.round(10 * u);
    const tw = boxX + boxW - pad - q * 6 - tx;
    return { narr, m, boxW, boxX, boxY, boxH, fs, lh, pad, pk, ps, frame, tx, tw };
  }
  // quebra de linha com medida real da fonte, preservando os trechos coloridos {y|...}
  function wrapRuns(text, maxW, fs) {
    cx.font = font(fs);
    const runs = F().parse(text), lines = [[]];
    let w = 0;
    const push = (t, c) => { const L = lines[lines.length - 1]; const last = L[L.length - 1]; if (last && last.c === c) last.t += t; else L.push({ t, c }); };
    for (const r of runs) {
      for (const tok of r.t.split(/(\s+)/)) {
        if (!tok) continue;
        if (tok.includes('\n')) { lines.push([]); w = 0; continue; }
        const tw = cx.measureText(tok).width;
        if (/^\s+$/.test(tok)) { if (w > 0) { push(' ', r.c); w += cx.measureText(' ').width; } continue; }
        if (w + tw > maxW && w > 0) { const L = lines[lines.length - 1]; if (L.length && /\s$/.test(L[L.length - 1].t)) L[L.length - 1].t = L[L.length - 1].t.replace(/\s+$/, ''); lines.push([]); w = 0; }
        push(tok, r.c); w += tw;
      }
    }
    return lines.filter((l, i) => l.length || i === 0);
  }
  function layout(d) {
    d.pages = [];
    for (const L of d.lines) {
      const g = geometry(L);
      const lines = wrapRuns(L.text, g.tw, g.fs);
      for (let i = 0; i < lines.length; i += 3) d.pages.push({ L, g, lines: lines.slice(i, i + 3), mood: moodFor(L) });
    }
    if (d.page >= d.pages.length) d.page = d.pages.length - 1;
    countPage(d);
  }
  function countPage(d) {
    const P = d.pages[d.page];
    d.total = P ? P.lines.reduce((n, l) => n + l.reduce((m, r) => m + [...r.t].length, 0), 0) : 0;
  }

  // Em partida, só um guardião está em campo: as falas do outro chegam pelo rádio.
  // Linhas com `only: 'piata'|'larinha'` aparecem apenas para aquele guardião.
  const radio = (who) => !!GC.activeChar && (who === 'piata' || who === 'larinha') && who !== GC.activeChar;
  const fits = (L) => !L.only || !GC.activeChar || L.only === GC.activeChar;

  function start(lines, onDone) {
    lines = lines.filter(fits);
    if (!lines.length) { if (onDone) onDone(); return; }
    dlg = { lines, page: 0, onDone, shown: 0 };
    layout(dlg);
    cv.classList.add('active'); document.body.classList.add('dlg-open');
    dirty = true;
  }
  function advance() {
    if (!dlg) return;
    if (dlg.shown < dlg.total) { dlg.shown = dlg.total; dirty = true; return; }
    dlg.page++;
    if (dlg.page >= dlg.pages.length) {
      const cb = dlg.onDone; dlg = null; cv.classList.remove('active'); document.body.classList.remove('dlg-open'); dirty = true;
      if (cb) cb();
      return;
    }
    dlg.shown = 0; countPage(dlg); dirty = true;
    GC.Audio.play('swap');
  }
  function say(who, text) {
    speech = { who, text, t: Math.max(3.2, F().plain(text).length * 0.065) };
    dirty = true;
  }
  function clear() { dlg = null; speech = null; cv.classList.remove('active'); document.body.classList.remove('dlg-open'); dirty = true; }

  function update(dt) {
    time += dt;
    if (dlg && dlg.shown < dlg.total) { dlg.shown = Math.min(dlg.total, dlg.shown + dt * 60); dirty = true; }
    if (dlg) dirty = true; // seta animada
    if (speech) { speech.t -= dt; if (speech.t <= 0) speech = null; dirty = true; }
  }

  // ——— Desenho (pixels físicos; q = tamanho do pixel das molduras) ———
  const R = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function frameBox(x, y, w, h) {
    R(x + 2 * q, y, w - 4 * q, h, '#06090f'); R(x, y + 2 * q, w, h - 4 * q, '#06090f'); R(x + q, y + q, w - 2 * q, h - 2 * q, '#06090f');
    R(x + 3 * q, y + q, w - 6 * q, h - 2 * q, '#3a86d8'); R(x + q, y + 3 * q, w - 2 * q, h - 6 * q, '#3a86d8'); R(x + 2 * q, y + 2 * q, w - 4 * q, h - 4 * q, '#3a86d8');
    R(x + 3 * q, y + q, w - 6 * q, q, '#7ac0f8'); R(x + q, y + 3 * q, q, h - 6 * q, '#7ac0f8');
    R(x + 3 * q, y + h - 2 * q, w - 6 * q, q, '#1e4e90'); R(x + w - 2 * q, y + 3 * q, q, h - 6 * q, '#1e4e90');
    R(x + 4 * q, y + 3 * q, w - 8 * q, h - 6 * q, '#0d1728'); R(x + 3 * q, y + 4 * q, w - 6 * q, h - 8 * q, '#0d1728');
    R(x + 4 * q, y + 4 * q, w - 8 * q, 3 * q, '#122038');
  }
  function leaf(x, y) {
    // folha ornamental em pixel art (blocos de q)
    const B = (i, j, w, h, c) => R(x + i * q, y + j * q, w * q, h * q, c);
    B(0, 6, 3, 2, '#2e7a24'); B(3, 4, 3, 3, '#2e7a24'); B(6, 2, 3, 3, '#2e7a24'); B(9, 0, 3, 3, '#2e7a24');
    B(3, 4, 2, 2, '#6ac04a'); B(6, 2, 2, 2, '#6ac04a'); B(9, 0, 2, 2, '#6ac04a'); B(4, 8, 4, 2, '#4a9a3a'); B(5, 8, 2, 1, '#7ad860');
  }
  function plate(x, y, text, P, fs) {
    cx.font = font(fs, 700);
    const w = Math.round(cx.measureText(text).width + 22 * u), h = Math.round(fs * 1.55);
    R(x + 2 * q, y, w - 4 * q, h, '#06090f'); R(x, y + 2 * q, w, h - 4 * q, '#06090f'); R(x + q, y + q, w - 2 * q, h - 2 * q, '#06090f');
    R(x + 2 * q, y + q, w - 4 * q, h - 2 * q, P.lo); R(x + q, y + 2 * q, w - 2 * q, h - 4 * q, P.lo);
    R(x + 2 * q, y + 2 * q, w - 4 * q, h - 5 * q, P.bg);
    R(x + 3 * q, y + 2 * q, w - 6 * q, q, P.hi);
    R(x + 4 * q, y + h / 2, 2 * q, q, P.lo); R(x + w - 6 * q, y + h / 2, 2 * q, q, P.lo);
    cx.fillStyle = P.ink; cx.textBaseline = 'middle'; cx.fillText(text, x + 11 * u, y + h / 2 - q * 0.5);
    leaf(x + w - q, y - 2 * q);
    return w;
  }
  function portrait(x, y, who, mood, pk) {
    const ps = 80 * pk, f = q * 4, size = ps + f * 2;
    frameBox(x, y, size, size);
    const g = cx.createLinearGradient(0, y + f, 0, y + f + ps);
    g.addColorStop(0, who === 'vertice' ? '#0a2230' : '#2a5a7a'); g.addColorStop(1, who === 'vertice' ? '#06121a' : '#1a3048');
    cx.fillStyle = g; cx.fillRect(x + f, y + f, ps, ps);
    cx.imageSmoothingEnabled = false;
    cx.drawImage((GC.PortraitsHD || GC.Portraits).get(who, mood), x + f, y + f, ps, ps);
    if (radio(who)) {
      // retrato pelo rádio: tom verde e linhas de transmissão
      R(x + f, y + f, ps, ps, 'rgba(40,140,80,0.16)');
      for (let ly = y + f + (Math.floor(time * 12) % 2) * pk; ly < y + f + ps; ly += pk * 2) R(x + f, ly, ps, pk, 'rgba(6,20,12,0.18)');
      const ax = x + f + ps - 10 * pk, ay = y + f + 3 * pk;
      R(ax + 3 * pk, ay, pk, 7 * pk, '#8ef0a8'); R(ax, ay + 2 * pk, pk, pk, '#8ef0a8'); R(ax + 6 * pk, ay + 2 * pk, pk, pk, '#8ef0a8'); R(ax + pk, ay, pk, pk, '#8ef0a8'); R(ax + 5 * pk, ay, pk, pk, '#8ef0a8');
    }
    return size;
  }
  function drawLines(lines, x, y, lh, fs, limit) {
    cx.font = font(fs); cx.textBaseline = 'alphabetic';
    let n = 0;
    const sh = Math.max(1, Math.round(q * 0.75));
    lines.forEach((line, i) => {
      let px = x;
      const by = y + i * lh + fs;
      for (const r of line) {
        let t = r.t;
        if (limit !== undefined) { const ch = [...t]; if (n >= limit) return; if (n + ch.length > limit) t = ch.slice(0, limit - n).join(''); n += ch.length; }
        cx.fillStyle = SHADOW; cx.fillText(t, px + sh, by + sh);
        cx.fillStyle = r.c ? HL[r.c] : TEXT; cx.fillText(t, px, by);
        px += cx.measureText(t).width;
      }
    });
  }

  function drawDialog() {
    const P = dlg.pages[dlg.page];
    if (!P) return;
    const { L, g, lines } = P;
    frameBox(g.boxX, g.boxY, g.boxW, g.boxH);
    if (!g.narr) {
      // retrato sobressai acima da caixa, alinhado à base
      portrait(g.boxX - q * 2, g.boxY + g.boxH - g.frame + q * 2, L.who, P.mood, g.pk);
      const S = GC.SPEAKERS[L.who];
      const pfs = 10.5 * u;
      const py = g.boxY - Math.round(pfs * 1.55 * 0.62);
      const pw = plate(g.tx - q * 2, py, S ? S.name.replace(' (transmissão)', '') : '', PLATES[L.who] || (S && S.infrator ? PLATES.infrator : PLATES.vertice), pfs);
      cx.font = font(8.5 * u, 600); cx.textBaseline = 'middle';
      const tagX = g.tx + pw + 14 * q + 6 * u, tagY = py + pfs * 0.75;
      if (L.who === 'vertice') { cx.fillStyle = SHADOW; cx.fillText('· transmissão', tagX + q, tagY + q); cx.fillStyle = '#7ae0f0'; cx.fillText('· transmissão', tagX, tagY); }
      else if (radio(L.who)) { cx.fillStyle = SHADOW; cx.fillText('· rádio', tagX + q, tagY + q); cx.fillStyle = '#8ef0a8'; cx.fillText('· rádio', tagX, tagY); }
    }
    const ty = g.boxY + Math.round((g.boxH - lines.length * g.lh) / 2) - Math.round(g.fs * 0.12);
    drawLines(lines, g.tx, ty, g.lh, g.fs, Math.floor(dlg.shown));
    // indicador de continuação
    if (dlg.shown >= dlg.total) {
      const s = Math.max(2, Math.round(u * 1.1));
      const ax = g.boxX + g.boxW - 16 * u, ay = g.boxY + g.boxH - 12 * u + (Math.floor(time * 3) % 2) * s;
      for (let i = 0; i < 5; i++) { R(ax + i * s + s, ay + i * s + s, (9 - i * 2) * s, s, '#05080f'); R(ax + i * s, ay + i * s, (9 - i * 2) * s, s, '#f8c838'); }
    }
    if (dlg.pages.length > 1) {
      const sTxt = (dlg.page + 1) + '/' + dlg.pages.length;
      cx.font = font(8 * u); cx.textBaseline = 'alphabetic'; cx.fillStyle = '#7a8aa8';
      cx.fillText(sTxt, g.boxX + g.boxW - 30 * u - cx.measureText(sTxt).width, g.boxY + g.boxH - 7 * u);
    }
  }

  function drawSpeech() {
    const s = speech;
    const fs = 9.5 * u, lh = Math.round(fs * 1.3), pk = Math.max(1, Math.round(u * 0.62)), ps = 80 * pk, f = q * 4, size = ps + f * 2;
    const w = Math.min(bw - 16 * u, Math.round(340 * u));
    const tx0 = 8 * u + size + 8 * u, tw = w - size - 20 * u;
    const lines = wrapRuns(s.text, tw, fs);
    const h = Math.max(size - 6 * q, lines.length * lh + 16 * u);
    const x = 8 * u, y = Math.max(30 * u, Math.round(bh * 0.15));
    cx.globalAlpha = Math.min(1, s.t * 3);
    frameBox(x + size * 0.5, y, w - size * 0.5, h);
    if (s.who !== 'narrador' && s.who !== 'vertice') portrait(x, y - 2 * q, s.who, moodFor(s), pk);
    if (radio(s.who)) { cx.font = font(7.5 * u, 600); cx.textBaseline = 'top'; cx.fillStyle = '#8ef0a8'; cx.fillText('rádio', x + f, y + size); }
    drawLines(lines, tx0, y + Math.round((h - lines.length * lh) / 2) - Math.round(fs * 0.12), lh, fs);
    cx.globalAlpha = 1;
  }

  function render() {
    if (!dirty) return;
    dirty = false;
    cx.clearRect(0, 0, cv.width, cv.height);
    if (!dlg && !speech) return;
    if (speech && !dlg) drawSpeech();
    if (dlg) drawDialog();
  }

  return {
    init, resize, start, advance, say, clear, update, render,
    get open() { return !!dlg; },
    get scale() { return u; }
  };
})();
