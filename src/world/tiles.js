// Definição dos tiles e geração procedural das texturas (pixel art)
GC.T = {
  EMPTY: 0, GRASS: 1, DIRT: 2, ROCK: 3, CLIFF: 4, PLANK: 5, WATER: 6, POLLUTED: 7,
  VINE: 8, SLOPE_R: 9, SLOPE_L: 10, DEGRADED: 11, FAKE: 12, MOUND: 13, SAND: 14, BRANCH: 15, BUSH: 16, GATE: 17
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
  GC.TP = P;

  // Paletas por ambiente (tema)
  GC.THEMES = {
    rio:     { grass: ['#4f9a3c', '#6dbb4a', '#2f6e2a'], dirt: ['#8a4e2e', '#a35f37', '#6b3a22'], rock: ['#8c7a6a', '#a69482', '#5e5046'], sand: ['#d8b27a', '#c49a62'] },
    cerrado: { grass: ['#8e9a36', '#b2b84a', '#5e6e26'], dirt: ['#a2502c', '#bd6534', '#7a3a20'], rock: ['#937562', '#ad8f78', '#644c40'], sand: ['#d9b07a', '#c39a62'] },
    carima:  { grass: ['#3e9a52', '#5fc06a', '#256b38'], dirt: ['#7e5236', '#996444', '#5c3a26'], rock: ['#6f7a7c', '#8d9a9a', '#4a5456'], sand: ['#cdb88e', '#b39f76'] },
    pedra:   { grass: ['#a2903e', '#c4ad52', '#6e6026'], dirt: ['#9a4a2e', '#b65c38', '#6e321e'], rock: ['#b0644a', '#cc7e5e', '#7a3e2e'], sand: ['#deb07a', '#c8966a'] },
    boss:    { grass: ['#6a6a34', '#8a8640', '#45451f'], dirt: ['#6e3c26', '#86492c', '#4c2818'], rock: ['#6e5a50', '#86706a', '#4a3c36'], sand: ['#b8946a', '#9a7a56'] },
    healed:  { grass: ['#4fa040', '#76c454', '#2f702a'], dirt: ['#8a4e2e', '#a35f37', '#6b3a22'], rock: ['#8c7a6a', '#a69482', '#5e5046'], sand: ['#d8b27a', '#c49a62'] }
  };

  const S = 16;
  const cache = {};
  const U = GC.U;

  function speckle(x, base, light, dark, seed, density = 0.18) {
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    const r = U.rng(seed);
    for (let i = 0; i < S * S * density; i++) {
      const px = (r() * S) | 0, py = (r() * S) | 0;
      x.fillStyle = r() < 0.5 ? light : dark;
      x.fillRect(px, py, r() < 0.3 ? 2 : 1, 1);
    }
  }

  function genTheme(name) {
    const th = GC.THEMES[name];
    const out = {};
    const mk = (key, n, fn) => {
      out[key] = [];
      for (let v = 0; v < n; v++) { const [c, x] = U.makeCanvas(S, S); fn(x, v); out[key].push(c); }
    };
    mk('dirt', 4, (x, v) => {
      speckle(x, th.dirt[0], th.dirt[1], th.dirt[2], 100 + v);
      // pedrinhas
      const r = U.rng(200 + v);
      for (let i = 0; i < 2; i++) { const px = (r() * 13) | 0, py = (r() * 13) | 0; x.fillStyle = th.rock[1]; x.fillRect(px, py, 2, 2); x.fillStyle = th.rock[2]; x.fillRect(px, py + 2, 2, 1); }
    });
    mk('rock', 4, (x, v) => {
      speckle(x, th.rock[0], th.rock[1], th.rock[2], 300 + v, 0.12);
      x.fillStyle = th.rock[2];
      // fissuras horizontais típicas de arenito
      const r = U.rng(400 + v);
      const y1 = 3 + ((r() * 4) | 0), y2 = 10 + ((r() * 4) | 0);
      x.fillRect(0, y1, S, 1); x.fillRect((r() * 8) | 0, y2, 8 + ((r() * 8) | 0), 1);
      x.fillStyle = th.rock[1]; x.fillRect(0, y1 + 1, S, 1);
    });
    mk('cliff', 4, (x, v) => {
      speckle(x, th.rock[0], th.rock[1], th.rock[2], 500 + v, 0.15);
      // apoios para escalada
      x.fillStyle = th.rock[2];
      x.fillRect(2, 2 + v, 4, 2); x.fillRect(9, 9 - v, 4, 2);
      x.fillStyle = th.rock[1];
      x.fillRect(2, 1 + v, 4, 1); x.fillRect(9, 8 - v, 4, 1);
      x.fillStyle = 'rgba(40,80,40,0.55)'; // musgo
      x.fillRect(0, 13, 3, 3); x.fillRect(12, 4, 4, 2);
    });
    mk('sand', 2, (x, v) => speckle(x, th.sand[0], '#efd3a0', th.sand[1], 600 + v, 0.25));
    mk('degraded', 2, (x, v) => {
      speckle(x, '#7a5a44', '#94725a', '#5a4030', 700 + v, 0.3);
      x.fillStyle = '#3a2a20';
      x.fillRect(2, 2, 5, 1); x.fillRect(6, 3, 1, 3); x.fillRect(9, 8, 5, 1); x.fillRect(4, 11, 1, 4); // rachaduras
      x.fillStyle = '#5a4030'; x.fillRect(0, 0, S, 1);
      // tocos queimados
      x.fillStyle = '#2a2220'; x.fillRect(11 - v * 6, 0, 2, 1);
    });
    mk('mound', 2, (x, v) => {
      speckle(x, '#b4703e', '#cf8a52', '#8a5230', 800 + v, 0.3);
      x.fillStyle = '#6e3e22';
      for (let i = 0; i < 5; i++) x.fillRect((i * 3 + v) % 14, (i * 5) % 14, 2, 2); // furinhos
    });
    mk('grassTop', 4, (x, v) => {
      const r = U.rng(900 + v);
      x.fillStyle = th.grass[0]; x.fillRect(0, 0, S, 4);
      x.fillStyle = th.grass[2]; x.fillRect(0, 4, S, 1);
      for (let i = 0; i < S; i++) {
        const h = (r() * 3) | 0;
        x.fillStyle = th.grass[0]; x.fillRect(i, 4, 1, h);
        if (r() < 0.4) { x.fillStyle = th.grass[1]; x.fillRect(i, 0, 1, 1 + ((r() * 2) | 0)); }
      }
      x.fillStyle = th.grass[1]; x.fillRect(0, 0, S, 1);
    });
    mk('plank', 1, (x) => {
      x.fillStyle = '#8a5a32'; x.fillRect(0, 0, S, 5);
      x.fillStyle = '#b07a46'; x.fillRect(0, 0, S, 1);
      x.fillStyle = '#5e3a1e'; x.fillRect(0, 4, S, 1); x.fillRect(7, 0, 1, 5);
      x.fillStyle = '#5e3a1e'; x.fillRect(2, 5, 2, 11); x.fillRect(12, 5, 2, 11); // estacas
      x.fillStyle = '#4a2c16'; x.fillRect(3, 5, 1, 11); x.fillRect(13, 5, 1, 11);
    });
    mk('branch', 1, (x) => {
      x.fillStyle = '#5e3e24'; x.fillRect(0, 1, S, 4);
      x.fillStyle = '#7e5634'; x.fillRect(0, 1, S, 1);
      x.fillStyle = '#3e2814'; x.fillRect(0, 4, S, 1);
      x.fillStyle = th.grass[0]; x.fillRect(3, 0, 3, 1); x.fillRect(11, 0, 2, 1); // folhinhas
      x.fillStyle = th.grass[2]; x.fillRect(9, 5, 3, 2);
    });
    mk('vine', 2, (x, v) => {
      x.fillStyle = '#2e5e22';
      for (let y = 0; y < S; y++) { const o = Math.round(Math.sin((y + v * 8) / 2.5) * 2); x.fillRect(7 + o, y, 2, 1); }
      x.fillStyle = '#5ea83a';
      x.fillRect(4, 3 + v * 6, 3, 2); x.fillRect(10, 9 - v * 4, 3, 2);
      x.fillStyle = '#3e7e2a'; x.fillRect(5, 5 + v * 6, 1, 1);
    });
    mk('cave', 2, (x, v) => speckle(x, '#2e2026', '#3c2a30', '#22161c', 1000 + v, 0.2));
    mk('art', 3, (x, v) => {
      speckle(x, '#3a2a2a', '#46322e', '#2a1e1e', 1100 + v, 0.15);
      // figuras rupestres em ocre e vermelho (interpretação estilizada, não cópia de painel real)
      x.fillStyle = v === 1 ? '#c8a050' : '#b8442c';
      if (v === 0) { x.fillRect(7, 3, 2, 2); x.fillRect(7, 5, 2, 5); x.fillRect(4, 6, 8, 1); x.fillRect(6, 10, 1, 4); x.fillRect(9, 10, 1, 4); }
      if (v === 1) { x.fillRect(2, 8, 10, 3); x.fillRect(11, 6, 3, 3); x.fillRect(3, 11, 1, 3); x.fillRect(10, 11, 1, 3); x.fillRect(13, 5, 1, 1); }
      if (v === 2) { for (let i = 0; i < 4; i++) { x.fillRect(3 + i * 3, 4, 1, 8); } x.fillRect(3, 12, 10, 1); }
    });
    cache[name] = out;
    return out;
  }

  GC.Tiles = {
    get(theme) { return cache[theme] || genTheme(theme); },
    pregen() { Object.keys(GC.THEMES).forEach((t) => this.get(t)); }
  };
})();
