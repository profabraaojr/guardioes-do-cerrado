// Definição dos tiles e geração procedural das texturas (pixel art)
GC.T = {
  EMPTY: 0, GRASS: 1, DIRT: 2, ROCK: 3, CLIFF: 4, PLANK: 5, WATER: 6, POLLUTED: 7,
  VINE: 8, SLOPE_R: 9, SLOPE_L: 10, DEGRADED: 11, FAKE: 12, MOUND: 13, SAND: 14, BRANCH: 15, BUSH: 16, GATE: 17, CRACKED: 18
};
GC.D = { NONE: 0, FALLS: 1, CAVE: 2, ART: 3 };

(function () {
  const T = GC.T;
  const P = [];
  const def = (id, o) => (P[id] = Object.assign({ solid: false, oneway: false, water: false, climb: false, vine: false, slope: 0, hazard: false }, o));
  def(T.EMPTY, {});
  def(T.GRASS, { solid: true });
  def(T.DIRT, { solid: true });
  def(T.ROCK, { solid: true });
  def(T.CLIFF, { solid: true, climb: true });
  def(T.PLANK, { oneway: true });
  def(T.WATER, { water: true });
  def(T.POLLUTED, { water: true, hazard: true });
  def(T.VINE, { vine: true });
  def(T.SLOPE_R, { slope: 1 });
  def(T.SLOPE_L, { slope: -1 });
  def(T.DEGRADED, { solid: true });
  def(T.FAKE, {});
  def(T.MOUND, { solid: true });
  def(T.SAND, { solid: true });
  def(T.BRANCH, { oneway: true });
  def(T.BUSH, { oneway: true });   // plataforma de arbusto (desenhada pela entidade)
  def(T.GATE, { solid: true });    // barreira/comporta (desenhada pela entidade)
  def(T.CRACKED, { solid: true }); // rocha rachada: quebra com o Soco da Terra ou o Feixe do Satélite
  GC.TP = P;

  // Paletas por ambiente: saturadas e harmônicas (solo de laterita, verdes vivos)
  GC.THEMES = {
    rio:     { grass: ['#48b84a', '#86e05a', '#24803a', '#1a5e2c'], dirt: ['#b8542e', '#d87444', '#8a3a1e', '#6a2814'], rock: ['#a8907a', '#cbb49a', '#7a6454', '#56443a'], sand: ['#e8c488', '#f4dca8', '#c49a62'] },
    cerrado: { grass: ['#6ac43c', '#a8e85a', '#3a8a2a', '#286024'], dirt: ['#c4582a', '#e47c40', '#94381a', '#6e2410'], rock: ['#b4886a', '#d6aa88', '#86624c', '#5e4232'], sand: ['#ecc488', '#f8deaa', '#c89a60'] },
    carima:  { grass: ['#3cbc5c', '#7ae878', '#1e8a44', '#145e30'], dirt: ['#9a5a36', '#bc7a4c', '#6e3c22', '#4e2816'], rock: ['#7c8c94', '#a4b4b8', '#56646c', '#3c464c'], sand: ['#dcc89a', '#efe0b8', '#b8a476'] },
    pedra:   { grass: ['#a0b444', '#d0dc66', '#6a8228', '#4c5c1c'], dirt: ['#bc4e2a', '#de7040', '#88341a', '#622210'], rock: ['#c86848', '#e8906a', '#94442e', '#6a2c1c'], sand: ['#eebc82', '#f8d8a8', '#c8925e'] },
    boss:    { grass: ['#7a8a3a', '#a4b44e', '#4e5c22', '#363e18'], dirt: ['#8a4228', '#aa5a36', '#622c18', '#44200e'], rock: ['#86706a', '#a68e86', '#5e4c46', '#40342e'], sand: ['#c8a072', '#dcbc8c', '#a07a52'] },
    healed:  { grass: ['#4cc040', '#8cec5c', '#24883a', '#1a602c'], dirt: ['#c4582a', '#e47c40', '#94381a', '#6e2410'], rock: ['#b4886a', '#d6aa88', '#86624c', '#5e4232'], sand: ['#ecc488', '#f8deaa', '#c89a60'] }
  };

  // Texturas em densidade dupla: 32×32 pixels de arte para 16×16 do mundo
  const S = 32;
  const cache = {};
  const U = GC.U;
  const mk = () => U.makeCanvas(S, S);

  // ruído em blocos suaves (manchas de cor do solo)
  function blotch(x, r, cols, n, sizeMin, sizeMax) {
    for (let i = 0; i < n; i++) {
      const cx = r() * S, cy = r() * S, rr = sizeMin + r() * (sizeMax - sizeMin);
      x.fillStyle = cols[(r() * cols.length) | 0];
      for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let X = Math.floor(cx - rr); X <= cx + rr; X++) {
        const dx = X + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy * 1.6 <= rr * rr) x.fillRect(((X % S) + S) % S, ((y % S) + S) % S, 1, 1);
      }
    }
  }
  function pebble(x, px, py, w, h, c, hi, sh) {
    x.fillStyle = sh; x.fillRect(px, py + 1, w, h);
    x.fillStyle = c; x.fillRect(px, py, w, h);
    x.fillStyle = hi; x.fillRect(px, py, w - 1, 1);
  }

  function genTheme(name) {
    const th = GC.THEMES[name];
    const out = {};
    const make = (key, n, fn, w = S, h = S) => {
      out[key] = [];
      for (let v = 0; v < n; v++) { const [c, x] = U.makeCanvas(w, h); fn(x, v, U.rng(key.length * 1000 + v * 37 + name.length)); out[key].push(c); }
    };
    const D = th.dirt, R = th.rock, G = th.grass;
    make('dirt', 4, (x, v, r) => {
      x.fillStyle = D[0]; x.fillRect(0, 0, S, S);
      blotch(x, r, [D[1], D[2]], 4, 2, 4);
      for (let i = 0; i < 12; i++) { x.fillStyle = r() < 0.5 ? D[1] : D[3]; x.fillRect((r() * S) | 0, (r() * S) | 0, 1, 1); }
      for (let i = 0; i < (v % 2 ? 2 : 1); i++) pebble(x, (r() * 27) | 0, (r() * 27) | 0, 3 + ((r() * 3) | 0), 2 + ((r() * 2) | 0), R[0], R[1], D[3]);
    });
    // solo logo abaixo da grama: raízes finas
    make('dirtTop', 2, (x, v, r) => {
      x.drawImage(out.dirt[v * 2], 0, 0);
      x.fillStyle = '#6a3a1e';
      for (let k = 0; k < 3; k++) { let px = 4 + k * 10 + ((r() * 4) | 0); for (let y = 0; y < 10 + ((r() * 8) | 0); y++) { x.fillRect(px, y, 1, 1); if (r() < 0.3) px += r() < 0.5 ? -1 : 1; } }
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 0, S, 3);
    });
    make('rock', 4, (x, v, r) => {
      x.fillStyle = R[0]; x.fillRect(0, 0, S, S);
      blotch(x, r, [R[1], R[2]], 5, 3, 6);
      // blocos de arenito com fissuras
      const y1 = 8 + ((r() * 6) | 0), y2 = 20 + ((r() * 6) | 0);
      x.fillStyle = R[3]; x.fillRect(0, y1, S, 1); x.fillRect((r() * 10) | 0, y2, 14 + ((r() * 14) | 0), 1); x.fillRect(10 + ((r() * 10) | 0), 0, 1, y1);
      x.fillStyle = R[1]; x.fillRect(0, y1 + 1, S, 1); x.fillRect(0, 0, S, 1);
      for (let i = 0; i < 20; i++) { x.fillStyle = r() < 0.5 ? R[1] : R[2]; x.fillRect((r() * S) | 0, (r() * S) | 0, 1, 1); }
    });
    make('cliff', 4, (x, v, r) => {
      x.drawImage(out.rock[v], 0, 0);
      // apoios para escalada e musgo
      for (const [px, py] of [[4, 4 + v * 2], [18, 16 - v * 2], [8, 24]]) { x.fillStyle = R[3]; x.fillRect(px, py + 3, 8, 2); x.fillStyle = R[1]; x.fillRect(px, py, 8, 3); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(px, py, 8, 1); }
      x.fillStyle = '#3e8a3a'; x.fillRect(0, 26, 5, 6); x.fillRect(24, 8, 8, 3); x.fillStyle = '#6ac04a'; x.fillRect(1, 26, 3, 2); x.fillRect(25, 8, 5, 1);
    });
    make('cracked', 2, (x, v, r) => {
      x.drawImage(out.rock[v + 1], 0, 0);
      // rachaduras claras e escuras, bem visíveis
      const crack = [[16, 0], [14, 6], [18, 11], [13, 17], [17, 23], [15, 31]];
      for (let i = 0; i < crack.length - 1; i++) { const [a, b] = crack[i], [c, d] = crack[i + 1]; for (let k = 0; k <= 6; k++) { const px = Math.round(a + (c - a) * k / 6), py = Math.round(b + (d - b) * k / 6); x.fillStyle = '#2a1a12'; x.fillRect(px, py, 2, 1); x.fillStyle = 'rgba(255,230,190,0.6)'; x.fillRect(px + 2, py, 1, 1); } }
      for (const [a, b, c, d] of [[14, 6, 6, 9], [18, 11, 26, 8], [13, 17, 5, 22], [17, 23, 25, 27]]) for (let k = 0; k <= 5; k++) { x.fillStyle = '#3a2418'; x.fillRect(Math.round(a + (c - a) * k / 5), Math.round(b + (d - b) * k / 5), 1, 1); }
      x.fillStyle = 'rgba(255,200,120,0.18)'; x.fillRect(0, 0, S, 2);
    });
    make('sand', 2, (x, v, r) => { x.fillStyle = th.sand[0]; x.fillRect(0, 0, S, S); blotch(x, r, [th.sand[1], th.sand[2]], 6, 2, 4); for (let i = 0; i < 30; i++) { x.fillStyle = r() < 0.5 ? th.sand[1] : th.sand[2]; x.fillRect((r() * S) | 0, (r() * S) | 0, 1, 1); } });
    make('degraded', 2, (x, v, r) => {
      x.fillStyle = '#8a6448'; x.fillRect(0, 0, S, S);
      blotch(x, r, ['#a07a5a', '#6e4c36'], 6, 2, 5);
      x.fillStyle = '#3e2a1e';
      for (const [px, py, L, d] of [[3, 4, 9, 1], [12, 6, 6, 0], [18, 16, 10, 1], [7, 22, 8, 0]]) for (let i = 0; i < L; i++) x.fillRect(px + (d ? i : (i % 2)), py + (d ? (i % 2) : i), 1, 1);
      x.fillStyle = '#5a4030'; x.fillRect(0, 0, S, 2);
      x.fillStyle = '#2e2420'; x.fillRect(20 - v * 12, 0, 3, 2); x.fillRect(21 - v * 12, 2, 1, 1); // toco queimado
    });
    make('mound', 2, (x, v, r) => {
      x.fillStyle = '#c47a42'; x.fillRect(0, 0, S, S);
      blotch(x, r, ['#de9458', '#9a5a30'], 7, 2, 5);
      for (let i = 0; i < 7; i++) { const px = (r() * 28) | 0, py = (r() * 28) | 0; x.fillStyle = '#6e3a1e'; x.fillRect(px, py, 3, 3); x.fillStyle = '#3e2010'; x.fillRect(px + 1, py + 1, 1, 1); }
    });
    // borda de grama arredondada (sobrepõe 4 px acima do tile e desce 18 px)
    make('grassTop', 4, (x, v, r) => {
      const H = 22;
      for (let i = 0; i < S; i++) {
        const lip = 4 - Math.round(Math.abs(Math.sin((i + v * 7) / 5.1)) * 2);
        const bottom = 12 + Math.round(Math.sin((i + v * 3) / 3.3) * 2 + (r() < 0.25 ? 2 : 0));
        x.fillStyle = G[2]; x.fillRect(i, lip + 1, 1, bottom - lip + 1);
        x.fillStyle = G[0]; x.fillRect(i, lip, 1, bottom - lip - 1);
        x.fillStyle = G[1]; x.fillRect(i, lip, 1, 2);
        x.fillStyle = G[3]; x.fillRect(i, bottom + 1, 1, 1);
        if (r() < 0.18) { x.fillStyle = G[2]; x.fillRect(i, bottom + 2, 1, 2 + ((r() * 3) | 0)); }
      }
      for (let i = 0; i < 6; i++) { x.fillStyle = G[1]; x.fillRect((r() * 30) | 0, 6 + ((r() * 5) | 0), 2, 1); }
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(0, 2, S, 1);
      if (v === 1) { x.fillStyle = '#f8e050'; x.fillRect(8, 3, 2, 2); x.fillStyle = '#ffffff'; x.fillRect(22, 4, 2, 2); }
      void H;
    }, S, 24);
    make('plank', 1, (x) => {
      // tábua de madeira com veios, pregos e amarração
      x.fillStyle = '#6a3e1e'; x.fillRect(0, 9, S, 2);
      x.fillStyle = '#a8683a'; x.fillRect(0, 0, S, 9);
      x.fillStyle = '#c88a52'; x.fillRect(0, 0, S, 2);
      x.fillStyle = '#8a5028'; for (const gy of [4, 6]) for (let i = 0; i < S; i += 1) if ((i * 7 + gy * 3) % 11 < 6) x.fillRect(i, gy, 1, 1);
      x.fillStyle = '#5a3418'; x.fillRect(15, 0, 1, 9);
      x.fillStyle = '#d8d0c0'; x.fillRect(3, 3, 1, 1); x.fillRect(27, 3, 1, 1); x.fillRect(19, 5, 1, 1);
      x.fillStyle = '#6a3e1e'; x.fillRect(4, 11, 4, 21); x.fillRect(24, 11, 4, 21);
      x.fillStyle = '#8a5428'; x.fillRect(5, 11, 2, 21); x.fillRect(25, 11, 2, 21);
      x.fillStyle = '#d8c48a'; x.fillRect(3, 12, 6, 2); x.fillRect(23, 12, 6, 2); // corda
    });
    make('branch', 1, (x) => {
      x.fillStyle = '#4a2e16'; x.fillRect(0, 3, S, 7);
      x.fillStyle = '#7a5030'; x.fillRect(0, 3, S, 5);
      x.fillStyle = '#9a6a42'; x.fillRect(0, 3, S, 1);
      x.fillStyle = '#5a3a1e'; x.fillRect(9, 5, 4, 1); x.fillRect(22, 6, 3, 1);
      for (const [px, py] of [[4, 0], [14, -1], [26, 1]]) { x.fillStyle = G[2]; x.fillRect(px, py + 1, 5, 3); x.fillStyle = G[0]; x.fillRect(px, py + 1, 4, 2); x.fillStyle = G[1]; x.fillRect(px, py + 1, 2, 1); }
      x.fillStyle = G[2]; x.fillRect(17, 10, 5, 4); x.fillStyle = G[0]; x.fillRect(17, 10, 4, 3);
    });
    make('vine', 2, (x, v) => {
      for (let y = 0; y < S; y++) { const o = Math.round(Math.sin((y + v * 16) / 4.5) * 3); x.fillStyle = '#2e6a22'; x.fillRect(14 + o, y, 4, 1); x.fillStyle = '#4e9a32'; x.fillRect(15 + o, y, 2, 1); }
      for (const [px, py] of [[7, 5 + v * 12], [20, 18 - v * 8]]) { x.fillStyle = '#2e7a22'; x.fillRect(px, py + 1, 6, 4); x.fillStyle = '#6ac04a'; x.fillRect(px, py, 5, 3); x.fillStyle = '#9ae070'; x.fillRect(px + 1, py, 2, 1); }
    });
    make('cave', 2, (x, v, r) => { x.fillStyle = '#2e2028'; x.fillRect(0, 0, S, S); blotch(x, r, ['#3c2a32', '#22161c'], 6, 3, 6); for (let i = 0; i < 10; i++) { x.fillStyle = '#4a3640'; x.fillRect((r() * S) | 0, (r() * S) | 0, 1, 1); } });
    make('art', 3, (x, v, r) => {
      x.fillStyle = '#3e2c2a'; x.fillRect(0, 0, S, S); blotch(x, r, ['#4a3632', '#30221e'], 5, 3, 6);
      // figuras rupestres estilizadas em ocre e vermelho (não reproduzem painel real)
      x.fillStyle = v === 1 ? '#d8a850' : '#c44a30';
      if (v === 0) { x.fillRect(14, 5, 4, 4); x.fillRect(15, 9, 2, 10); x.fillRect(9, 11, 14, 2); x.fillRect(12, 19, 2, 8); x.fillRect(18, 19, 2, 8); }
      if (v === 1) { x.fillRect(5, 15, 20, 6); x.fillRect(23, 11, 6, 6); x.fillRect(7, 21, 2, 7); x.fillRect(20, 21, 2, 7); x.fillRect(27, 9, 2, 2); }
      if (v === 2) { for (let i = 0; i < 5; i++) x.fillRect(6 + i * 5, 8, 2, 16); x.fillRect(6, 24, 22, 2); }
    });
    cache[name] = out;
    return out;
  }

  GC.Tiles = {
    SIZE: S,
    get(theme) { return cache[theme] || genTheme(theme); },
    pregen() { Object.keys(GC.THEMES).forEach((t) => this.get(t)); }
  };
})();
