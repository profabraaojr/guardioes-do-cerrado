// Sistema de diálogos em canvas próprio, com escala inteira e fonte bitmap.
// O canvas de interface tem resolução física do aparelho; tudo é desenhado
// primeiro em "pixels de interface" (escala 1) e ampliado por um fator inteiro k,
// o que mantém cada pixel nítido em qualquer tela.
GC.DialogUI = (function () {
  const F = () => GC.Font;
  let cv, cx, off, ox, k = 2, V = 480, VH = 270, dpr = 1;
  let dlg = null;      // { pages, page, onDone, shown, total, line }
  let speech = null;   // { who, lines, t }
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

  function init(canvas) {
    cv = canvas; cx = cv.getContext('2d');
    [off, ox] = GC.U.makeCanvas(480, 270);
    cv.addEventListener('pointerdown', (e) => { if (dlg) { e.preventDefault(); advance(); } });
  }

  function resize(cssW, cssH) {
    if (!cv) return; // ainda não inicializado (redimensionamento antes do boot)
    dpr = Math.max(1, Math.min(4, window.devicePixelRatio || 1));
    const bw = Math.round(cssW * dpr), bh = Math.round(cssH * dpr);
    cv.width = bw; cv.height = bh;
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    // fator inteiro: legível (≥ ~11 px CSS por linha) sem espremer o layout (≥ 300 px de interface)
    const kFit = Math.floor(bw / 480);
    const kRead = Math.ceil(1.1 * dpr);
    const kMax = Math.max(1, Math.floor(bw / 300));
    k = Math.max(1, Math.min(kMax, Math.max(kFit, kRead)));
    V = Math.floor(bw / k); VH = Math.floor(bh / k);
    off.width = V; off.height = VH; ox.imageSmoothingEnabled = false;
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

  // ——— Layout dinâmico ———
  function geometry(L) {
    const narr = !GC.Portraits || L.who === 'narrador';
    const m = 8;
    const boxW = Math.min(V - m * 2, narr ? 400 : 470);
    const boxX = Math.floor((V - boxW) / 2);
    const tx = narr ? boxX + 12 : boxX + 58;
    const tw = boxX + boxW - 18 - tx;
    return { narr, m, boxW, boxX, tx, tw };
  }
  function layout(d) {
    d.pages = [];
    for (const L of d.lines) {
      const g = geometry(L);
      const lines = F().wrap(L.text, g.tw);
      const per = 3;
      for (let i = 0; i < lines.length; i += per) d.pages.push({ L, g, lines: lines.slice(i, i + per), mood: moodFor(L) });
    }
    if (d.page >= d.pages.length) d.page = d.pages.length - 1;
    countPage(d);
  }
  function countPage(d) {
    const P = d.pages[d.page];
    d.total = P ? P.lines.reduce((n, l) => n + l.reduce((m, r) => m + [...r.t].length, 0), 0) : 0;
  }

  function start(lines, onDone) {
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
    const w = Math.min(V - 16, 300);
    speech = { who, text, t: Math.max(3.2, F().plain(text).length * 0.065), w, lines: F().wrap(text, w - 62) };
    dirty = true;
  }
  function clear() { dlg = null; speech = null; cv.classList.remove('active'); document.body.classList.remove('dlg-open'); dirty = true; }

  function update(dt) {
    time += dt;
    if (dlg && dlg.shown < dlg.total) { dlg.shown = Math.min(dlg.total, dlg.shown + dt * 60); dirty = true; }
    if (dlg) dirty = true; // seta animada
    if (speech) { speech.t -= dt; if (speech.t <= 0) speech = null; dirty = true; }
  }

  // ——— Desenho (em pixels de interface) ———
  function frameBox(x, y, w, h) {
    const o = ox;
    o.fillStyle = '#06090f'; o.fillRect(x + 2, y, w - 4, h); o.fillRect(x, y + 2, w, h - 4); o.fillRect(x + 1, y + 1, w - 2, h - 2);
    o.fillStyle = '#3a86d8'; o.fillRect(x + 3, y + 1, w - 6, h - 2); o.fillRect(x + 1, y + 3, w - 2, h - 6); o.fillRect(x + 2, y + 2, w - 4, h - 4);
    o.fillStyle = '#7ac0f8'; o.fillRect(x + 3, y + 1, w - 6, 1); o.fillRect(x + 1, y + 3, 1, h - 6);
    o.fillStyle = '#1e4e90'; o.fillRect(x + 3, y + h - 2, w - 6, 1); o.fillRect(x + w - 2, y + 3, 1, h - 6);
    o.fillStyle = '#0d1728'; o.fillRect(x + 4, y + 3, w - 8, h - 6); o.fillRect(x + 3, y + 4, w - 6, h - 8);
    o.fillStyle = '#122038'; o.fillRect(x + 4, y + 4, w - 8, 3);
  }
  function plate(x, y, text, P) {
    const o = ox, w = F().width(text) + 18, h = 15;
    o.fillStyle = '#06090f'; o.fillRect(x + 2, y, w - 4, h); o.fillRect(x, y + 2, w, h - 4); o.fillRect(x + 1, y + 1, w - 2, h - 2);
    o.fillStyle = P.lo; o.fillRect(x + 2, y + 1, w - 4, h - 2); o.fillRect(x + 1, y + 2, w - 2, h - 4);
    o.fillStyle = P.bg; o.fillRect(x + 2, y + 2, w - 4, h - 5);
    o.fillStyle = P.hi; o.fillRect(x + 3, y + 2, w - 6, 1);
    o.fillStyle = P.lo; o.fillRect(x + 4, y + 7, 2, 1); o.fillRect(x + w - 6, y + 7, 2, 1);
    F().draw(o, text, x + 9, y + 1, P.ink, null);
    // folha ornamental
    const lx = x + w - 1, ly = y + 1;
    o.fillStyle = '#2e7a24'; o.fillRect(lx, ly + 5, 2, 2); o.fillRect(lx + 2, ly + 3, 3, 3); o.fillRect(lx + 5, ly + 1, 3, 3); o.fillRect(lx + 8, ly, 2, 2);
    o.fillStyle = '#6ac04a'; o.fillRect(lx + 2, ly + 3, 2, 2); o.fillRect(lx + 5, ly + 1, 2, 2); o.fillRect(lx + 8, ly, 1, 1);
    return w;
  }
  function portrait(x, y, who, mood) {
    const o = ox;
    o.fillStyle = '#06090f'; o.fillRect(x + 2, y, 44, 48); o.fillRect(x, y + 2, 48, 44); o.fillRect(x + 1, y + 1, 46, 46);
    o.fillStyle = '#3a86d8'; o.fillRect(x + 2, y + 1, 44, 46); o.fillRect(x + 1, y + 2, 46, 44);
    o.fillStyle = '#7ac0f8'; o.fillRect(x + 2, y + 1, 44, 1);
    const g = o.createLinearGradient(0, y + 4, 0, y + 44);
    g.addColorStop(0, who === 'vertice' ? '#0a2230' : '#2a5a7a'); g.addColorStop(1, who === 'vertice' ? '#06121a' : '#1a3048');
    o.fillStyle = g; o.fillRect(x + 4, y + 4, 40, 40);
    o.drawImage(GC.Portraits.get(who, mood), x + 4, y + 4);
  }
  function drawLines(lines, x, y, limit) {
    let n = 0;
    lines.forEach((line, i) => {
      let px = x;
      for (const r of line) {
        let t = r.t;
        if (limit !== undefined) { const chars = [...t]; if (n >= limit) return; if (n + chars.length > limit) t = chars.slice(0, limit - n).join(''); n += chars.length; }
        px = F().draw(ox, t, px, y + i * F().LINE_H, r.c ? HL[r.c] : TEXT, SHADOW) + (r.t === ' ' ? 0 : 0);
      }
    });
  }

  function drawDialog() {
    const P = dlg.pages[dlg.page];
    if (!P) return;
    const { L, g, lines } = P;
    const LH = F().LINE_H;
    const textH = Math.max(lines.length, 2) * LH;
    const boxH = Math.max(g.narr ? 0 : 46, textH + 16);
    const boxY = VH - g.m - boxH;
    frameBox(g.boxX, boxY, g.boxW, boxH);
    if (!g.narr) {
      portrait(g.boxX - 2, boxY - 14, L.who, P.mood);
      const S = GC.SPEAKERS[L.who];
      const pw = plate(g.tx - 2, boxY - 12, S ? S.name.replace(' (transmissão)', '') : '', PLATES[L.who] || (S && S.infrator ? PLATES.infrator : PLATES.vertice));
      if (L.who === 'vertice') F().draw(ox, '· transmissão', g.tx + pw + 12, boxY - 11, '#7ae0f0', SHADOW);
    }
    const ty = boxY + Math.floor((boxH - lines.length * LH) / 2) - 1;
    drawLines(lines, g.tx, ty, Math.floor(dlg.shown));
    // indicador de continuação
    if (dlg.shown >= dlg.total) {
      const ax = g.boxX + g.boxW - 14, ay = boxY + boxH - 10 + (Math.floor(time * 3) % 2);
      ox.fillStyle = '#05080f'; ox.fillRect(ax - 1, ay + 1, 9, 1); ox.fillRect(ax, ay + 2, 7, 1); ox.fillRect(ax + 1, ay + 3, 5, 1); ox.fillRect(ax + 2, ay + 4, 3, 1); ox.fillRect(ax + 3, ay + 5, 1, 1);
      ox.fillStyle = '#f8c838'; ox.fillRect(ax - 1, ay, 9, 1); ox.fillRect(ax, ay + 1, 7, 1); ox.fillRect(ax + 1, ay + 2, 5, 1); ox.fillRect(ax + 2, ay + 3, 3, 1); ox.fillRect(ax + 3, ay + 4, 1, 1);
    }
    if (dlg.pages.length > 1) {
      const s = (dlg.page + 1) + '/' + dlg.pages.length;
      F().draw(ox, s, g.boxX + g.boxW - 26 - F().width(s), boxY + boxH - 13, '#7a8aa8', SHADOW);
    }
  }

  function drawSpeech() {
    const s = speech, LH = F().LINE_H;
    const h = Math.max(46, s.lines.length * LH + 14);
    const x = 8, y = Math.max(30, Math.round(VH * 0.15));
    const a = Math.min(1, s.t * 3);
    ox.globalAlpha = a;
    frameBox(x + 20, y, s.w - 20, h);
    if (s.who !== 'narrador' && s.who !== 'vertice') portrait(x, y - 1, s.who, moodFor(s));
    drawLines(s.lines, x + 56, y + Math.floor((h - s.lines.length * LH) / 2) - 1);
    ox.globalAlpha = 1;
  }

  function render() {
    if (!dirty) return;
    dirty = false;
    cx.clearRect(0, 0, cv.width, cv.height);
    if (!dlg && !speech) return;
    ox.clearRect(0, 0, V, VH);
    if (speech && !dlg) drawSpeech();
    if (dlg) drawDialog();
    cx.drawImage(off, 0, 0, V * k, VH * k);
  }

  return {
    init, resize, start, advance, say, clear, update, render,
    get open() { return !!dlg; },
    get scale() { return k; }
  };
})();
