// Pixel art do guardião (grades de caracteres) e desenho procedural de fauna,
// máquinas e objetos. Todas as funções de desenho recebem a posição de tela do
// ponto central inferior da entidade (cx, by) e a direção f (1 direita, -1 esquerda).
GC.Art = (function () {
  const U = GC.U;
  // Paletas dos protagonistas. O visual de Piatã é contemporâneo e neutro:
  // referências culturais específicas dependem da definição do povo de origem,
  // a ser feita com pesquisa e consulta (ver docs/NARRATIVA.md).
  const CHARS = {
    piata: {
      k: '#16101c', a: '#1c1820', r: '#c8302a', y: '#f2c230', s: '#a86a42', S: '#82502e', e: '#16101c',
      w: '#ece8dc', g: '#4aa03a', x: '#ece8dc', X: '#c8c0b0', b: '#7a4a2a', B: '#5a3a1e',
      p: '#4e7a3a', P: '#36582a', o: '#7a4a24'
    },
    larinha: {
      k: '#16101c', a: '#4a2a1a', m: '#3a3a48', L: '#5ac8f0', s: '#c88a62', S: '#a06a48', e: '#16101c',
      j: '#e0508a', J: '#b03a6a', x: '#e0508a', X: '#b03a6a', b: '#24304e', t: '#5ae0f0', n: '#5ae0f0',
      B: '#5a3a1e', w: '#f4f0e8', p: '#3e66a8', P: '#2a4a80', o: '#e85a9a'
    }
  };
  const UPPER = {
    piata: [
      '.....k.k.k......',
      '....kakakak.k...',
      '...kaaaaaaaaak..',
      '...kaaaaaaaaak..',
      '.rrkrrrryrrrrk..',
      'r..kaasssssssk..',
      '...kassssssesk..',
      '...kaSsssssssk..',
      '....kSssssssk...',
      '..kbkwwwwwwwk...',
      '..kbkwwwwwwwk...',
      '..kbkwwwwwwwsk..',
      '..kbkwwgwwwwsk..',
      '..kbbkwwwwwwk...',
      '...kkBBBBBBBk...',
      '....kpppppppk...'
    ],
    larinha: [
      '..kk..kkkk......',
      '.kaak.kaaaak....',
      '.kaaakaaaaaak...',
      '..kaakmLmmLmk...',
      '..kaaaaaaaaak...',
      '.kaaaassssssk...',
      '.kaaasssssesk...',
      '.kaakSssssssk...',
      '..kk.kSssssk....',
      '...nkjjjjjjk....',
      '..kbbkjjjjjjk...',
      '..kbtkjjjjjjsk..',
      '..kbbkjjjjjjsk..',
      '..kbbkjjjjjjk...',
      '...kkBBBBBBBk...',
      '....kpppppppk...'
    ]
  };
  const LEGS = {
    stand: ['....kppkppk.....', '....kppkppk.....', '....kPpkPpk.....', '....kPpkPpk.....', '....kppkppk.....', '....koookoook...', '....koookoook...', '....kkkkkkkkk...'],
    run1: ['....kpppppk.....', '...kppk.kppk....', '...kPpk..kPpk...', '..kPpk....kPpk..', '..kppk....kppk..', '.kooook...koook.', '.kkkkk....kkkkk.', '................'],
    run2: ['....kpppppk.....', '....kppkppk.....', '.....kPppk......', '.....kPPpk......', '.....kppk.......', '.....koooook....', '.....kkkkkkk....', '................'],
    run3: ['....kpppppk.....', '....kppkkppk....', '...kPpk..kPpk...', '...kPpk...kPk...', '..kppk....kppk..', '..kooook..koook.', '..kkkkk...kkkkk.', '................'],
    jump: ['....kpppppk.....', '...kppkkppk.....', '..kPpk.kPpk.....', '..kppk..kppk....', '.koook..koook...', '.kkkk....kkkk...', '................', '................'],
    fall: ['....kpppppk.....', '....kppkppk.....', '...kPpk.kPpk....', '...kppk..kppk...', '..koook..koook..', '..kkkk....kkkk..', '................', '................']
  };
  const E16 = '................';
  const SLIDE = Array(10).fill(E16).concat([
    '..........kkkk..',
    '.........kaaaak.',
    '........kaaaaaak',
    '.kk....kkaaasskk',
    'kbbkkkkkasssssk.',
    'kbbxxxxxxsesk...',
    'kbbxxxxxxsssk...',
    '.kkXXXXXkkkk....',
    '..kppppppppppk..',
    '..kpppppppppppkk',
    '..kPPPPPPPPkoook',
    '...kkkkkkkkkkkkk'
  ]).concat([E16, E16]);
  const CLIMB_UP = [
    '................',
    '.....kkkkkk.....',
    '....kaaaaaaak...',
    '...kaaaaaaaaak..',
    '...kaaaaaaaaak..',
    '...kaaaaaaaaak..',
    '..sk.kaaaaaak...',
    '..sk..kSSSSk..ks',
    '..skkkxxxxxxkkks',
    '...kxbbbbbbbxks.',
    '...kxbBbbbbBxk..',
    '...kxbbbbbbbxk..',
    '...kxbbbbbbbxk..',
    '...kxxxxxxxxxk..',
    '....kXXXXXXXk...',
    '....kpppppppk...'
  ];
  const CLIMB_LEGS = [
    ['....kppk.kppk...', '....kPpk.kPpk...', '....kppk.kppk...', '....koook.kpk...', '....kkkkk.kppk..', '..........koook.', '..........kkkkk.', '................'],
    ['....kppk.kppk...', '....kPpk.kPpk...', '...kppk..kppk...', '..kpk....koook..', '..kppk...kkkkk..', '.koook..........', '.kkkkk..........', '................']
  ];

  const frames = { piata: {}, larinha: {} };
  function bake(rows, pal, w = 16, h = 24) {
    const [c, x] = U.makeCanvas(w, h);
    rows.forEach((row, y) => {
      for (let i = 0; i < w; i++) {
        const ch = row[i];
        if (!ch || ch === '.') continue;
        x.fillStyle = pal[ch] || '#f0f';
        x.fillRect(i, y, 1, 1);
      }
    });
    const [m, mx] = U.makeCanvas(w, h);
    mx.translate(w, 0); mx.scale(-1, 1); mx.drawImage(c, 0, 0);
    return { r: c, l: m };
  }
  function flash(fr) {
    const out = {};
    for (const k of ['r', 'l']) {
      const [c, x] = U.makeCanvas(16, 24);
      x.drawImage(fr[k], 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, 16, 24);
      out[k] = c;
    }
    return out;
  }
  function buildPlayer() {
    const shift = (rows, n) => (n > 0 ? Array(n).fill(E16).concat(rows.slice(0, rows.length - n)) : rows);
    for (const who of ['piata', 'larinha']) {
      const pal = CHARS[who], up = UPPER[who], F = frames[who];
      const full = (legs) => up.concat(legs);
      F.stand = bake(full(LEGS.stand), pal);
      F.breathe = bake(shift(up, 1).concat(LEGS.stand), pal);
      F.run1 = bake(shift(full(LEGS.run1), 1), pal);
      F.run2 = bake(shift(full(LEGS.run2), 1), pal);
      F.run3 = bake(shift(full(LEGS.run3), 1), pal);
      F.jump = bake(shift(full(LEGS.jump), 2), pal);
      F.fall = bake(shift(full(LEGS.fall), 2), pal);
      F.slide = bake(SLIDE, pal);
      F.climb1 = bake(CLIMB_UP.concat(CLIMB_LEGS[0]), pal);
      F.climb2 = bake(CLIMB_UP.concat(CLIMB_LEGS[1]), pal);
      F.white = flash(F.stand);
    }
  }

  // pintor relativo ao centro inferior, com espelhamento
  function P(ctx, cx, by, f) {
    return (c, dx, dy, w, h) => {
      ctx.fillStyle = c;
      const x = f > 0 ? cx + dx : cx - dx - w;
      ctx.fillRect(Math.round(x), Math.round(by + dy), w, h);
    };
  }

  const A = {
    init: buildPlayer,
    frames,
    P,
    // compatibilidade: nomes de quadro antigos → animações das folhas novas
    player(ctx, cx, by, f, frame, opt = {}) {
      const map = { stand: 'idle', breathe: 'idle', run1: 'walk', run2: 'walk', run3: 'walk', jump: 'jump', fall: 'fall', slide: 'slide', climb1: 'climb', climb2: 'climb' };
      const anim = map[frame] || frame;
      GC.Sheets.draw(ctx, opt.char || 'piata', anim, opt.t !== undefined ? opt.t : performance.now() / 1000, cx, by, f < 0, { alpha: opt.alpha, white: opt.white });
    },

    // Emblema fictício do Projeto Horizonte: sol nascendo sobre uma linha reta
    logo(ctx, x, y, s = 1) {
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(x, y + 4 * s, 7 * s, s);
      ctx.fillRect(x + 2 * s, y + s, 3 * s, s); ctx.fillRect(x + s, y + 2 * s, s, 2 * s); ctx.fillRect(x + 5 * s, y + 2 * s, s, 2 * s);
      ctx.fillStyle = '#e8501e'; ctx.fillRect(x + 3 * s, y + 2 * s, s, s);
    },
    // Retrato (recorte ampliado da cabeça) para diálogos e seleção
    portrait(ctx, who, size) {
      const F = frames[who] && frames[who].stand;
      if (!F) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(F.r, 1, 0, 14, 14, 0, 0, size, size);
    },

    // Moradores e parceiros (desenho simples, sem caricatura)
    villager(ctx, cx, by, f, t, look) {
      if (GC.Sheets.get(look)) { GC.Sheets.draw(ctx, look, 'talk', t, cx, by, f < 0); return; }
      const p = P(ctx, cx, by, f);
      const breathe = Math.round(Math.sin(t * 2) * 0.5);
      const L = { cida: { skin: '#b07850', hair: '#d8d0c8', shirt: '#4a7ab0', pants: '#5a4a3a', hat: '#e8dcc0', band: '#8a5a2e' },
        rafael: { skin: '#7a4a2e', hair: '#1c1418', shirt: '#2a8a7a', pants: '#3a3e4a', hat: '#3a6a3a', band: '#e8e0d0', cap: true } }[look];
      p('#1b1a24', -5, -2, 4, 2); p('#1b1a24', 1, -2, 4, 2);
      p(L.pants, -5, -10, 4, 8); p(L.pants, 1, -10, 4, 8);
      p(L.shirt, -6, -20 + breathe, 12, 11); p('#2a4a70', -6, -11, 12, 1);
      p(L.skin, 6, -18 + breathe, 2, 6); p('#e8e0d0', -2, -19 + breathe, 4, 2); // gola
      p(L.skin, -4, -27 + breathe, 9, 7); p('#1b1a24', 3, -25 + breathe, 1, 1);
      p(L.hair, -5, -27 + breathe, 3, 5);
      if (L.cap) {
        p(L.hat, -5, -30 + breathe, 10, 3); p(L.hat, 4, -28 + breathe, 5, 1); p(L.band, -1, -29 + breathe, 2, 1); // boné
        p('#2a2d36', 7, -17 + breathe, 5, 7); p('#6ae8c8', 8, -16 + breathe, 3, 4); // tablet com mapa
      } else {
        p(L.hat, -7, -29 + breathe, 15, 2); p(L.hat, -4, -32 + breathe, 9, 3); p(L.band, -4, -30 + breathe, 9, 1);
        p('#3a3a48', -9, -19 + breathe, 3, 6); p('#6ae8c8', -8, -18 + breathe, 1, 1); // rádio da brigada
      }
    },

    // Infratores (antagonistas humanos): figuras simples, sem caricatura
    human(ctx, cx, by, f, t, look, pose, flash) {
      const anim = { walk: 'walk', run: 'run', alert: 'alert', throw: 'throw', hands: 'hands', slip: 'slip', crouch: 'crouch' }[pose] || 'idle';
      GC.Sheets.draw(ctx, look, anim, t, cx, by, f < 0, { white: flash });
    },

    // ——— Fauna ———
    arara(ctx, cx, by, f, t, flying = true) {
      const p = P(ctx, cx, by, f);
      const BL = '#2f7ad0', DB = '#1e4e8e', Y = '#f2c230', GR = '#3aa04a';
      const up = flying && Math.sin(t * 18) > 0;
      p(BL, -14, -7, 9, 2); p(DB, -18, -6, 5, 2); p(DB, -20, -5, 3, 1); // cauda
      p(BL, -6, -11, 10, 5); p(Y, -5, -7, 9, 3);
      p(BL, 3, -14, 6, 5); p(GR, 3, -15, 4, 1);
      p('#f4f0e0', 6, -13, 3, 3); p('#111', 7, -12, 1, 1);
      p('#222', 9, -12, 2, 3); p('#222', 10, -10, 1, 1);
      if (flying) {
        if (up) { p(BL, -4, -19, 8, 8); p(DB, -4, -21, 6, 2); }
        else { p(BL, -4, -8, 8, 6); p(DB, -4, -3, 6, 2); }
      } else { p(DB, -4, -10, 8, 4); p('#3a2a1a', -2, -2, 1, 2); p('#3a2a1a', 1, -2, 1, 2); }
    },
    capivara(ctx, cx, by, f, t, moving) {
      const p = P(ctx, cx, by, f);
      const B = '#8e5e3a', D = '#6a4226', L = '#a8744a';
      const leg = moving ? Math.round(Math.sin(t * 10) * 1.5) : 0;
      p(D, -10, -3, 3, 3 + leg); p(D, -3, -3, 3, 3 - leg); p(D, 3, -3, 3, 3 + leg); p(D, 7, -3, 3, 3 - leg);
      p(B, -12, -13, 21, 10); p(B, -13, -11, 2, 7); p(L, -10, -13, 16, 2); p(D, -11, -4, 19, 1);
      p(B, 6, -16, 8, 9); p(B, 13, -14, 4, 7); p('#3a2418', 15, -12, 2, 2); p('#111', 10, -14, 1, 1);
      p(D, 7, -17, 2, 2); p(D, 11, -17, 2, 1);
    },
    tamandua(ctx, cx, by, f, t, moving, digging) {
      const p = P(ctx, cx, by, f);
      const B = '#8c7c6a', D = '#5a4e42', K = '#1e1a18', W = '#e8e2d4';
      const leg = moving ? Math.round(Math.sin(t * 9) * 1.5) : 0;
      // cauda em bandeira
      p(D, -22, -16, 9, 12); p(B, -24, -14, 4, 9); p(D, -26, -11, 3, 6);
      p(K, -8, -3, 3, 3 + leg); p(K, 4, -3, 3, 3 - leg); p(W, -10, -3, 1, 2);
      p(B, -14, -13, 22, 10);
      // faixa diagonal preta com borda branca
      for (let i = 0; i < 9; i++) { p(K, -2 + i, -13 + i, 3, 2); p(W, 1 + i, -13 + i, 1, 1); }
      p(B, 7, -11, 5, 6); p(B, 11, -9, 9, 3); p(K, 19, -9, 2, 2); p('#111', 10, -10, 1, 1);
      if (digging) { p('#3a2418', 18 + Math.round(Math.sin(t * 20)), -4, 3, 3); p('#d06080', 21, -7, 4, 1); }
    },
    onca(ctx, cx, by, f, t, pose = 'stand', scale = 1) {
      ctx.save();
      if (scale !== 1) { ctx.translate(cx, by); ctx.scale(scale, scale); ctx.translate(-cx, -by); }
      const p = P(ctx, cx, by, f);
      const Y = '#d9963a', L = '#f2dcae', K = '#2e1e12';
      const walk = pose === 'walk' ? Math.round(Math.sin(t * 12) * 2) : 0;
      const crouch = pose === 'crouch' ? 3 : 0;
      p(Y, -21, -16 + crouch, 3, 2); p(Y, -23, -15 + crouch, 2, 6); p(K, -23, -10 + crouch, 2, 2); // cauda
      p(Y, -12, -5, 4, 5 + walk); p(Y, 7, -5, 4, 5 - walk); p(Y, -8, -5, 3, 5 - walk); p(Y, 3, -5, 3, 5 + walk);
      p(Y, -18, -16 + crouch, 28, 11 - crouch); p(L, -14, -7, 22, 2);
      const spots = [[-15, -14], [-10, -12], [-5, -15], [0, -12], [4, -15], [-12, -9], [-2, -9], [6, -10]];
      spots.forEach(([sx, sy]) => { p(K, sx, sy + crouch, 3, 1); p(K, sx, sy + 2 + crouch, 3, 1); p(K, sx - 1, sy + 1 + crouch, 1, 1); p(K, sx + 3, sy + 1 + crouch, 1, 1); });
      p(Y, 8, -21 + crouch * 1.5, 10, 9); p(L, 13, -15 + crouch * 1.5, 6, 3); p(K, 17, -18 + crouch * 1.5, 2, 1);
      p('#e8d040', 13, -19 + crouch * 1.5, 2, 1); p(K, 14, -19 + crouch * 1.5, 1, 1);
      p(Y, 8, -23 + crouch * 1.5, 3, 2); p(Y, 14, -23 + crouch * 1.5, 3, 2); p(K, 9, -22 + crouch * 1.5, 1, 1);
      if (pose === 'roar') { p('#7a1e1e', 15, -14, 5, 3); p('#fff', 16, -14, 1, 1); p('#fff', 18, -12, 1, 1); }
      ctx.restore();
    },
    jacare(ctx, cx, by, f, t, open = 0) {
      const p = P(ctx, cx, by, f);
      const O = '#56663a', D = '#36442a', Bl = '#b6ae7a';
      p(D, -26, -4, 10, 3); p(O, -18, -6, 20, 6); p(Bl, -16, -1, 16, 1);
      for (let i = 0; i < 8; i++) p(D, -24 + i * 4, -7, 2, 1); // escamas
      p(D, -14, -2, 3, 2); p(D, -2, -2, 3, 2);
      p(O, 2, -6, 8, 5); p('#d8c040', 6, -7, 2, 1); p('#111', 7, -7, 1, 1);
      const jaw = Math.round(open * 6);
      p(O, 10, -5 - jaw, 12, 2); p(D, 20, -5 - jaw, 2, 1);
      p(O, 10, -2, 12, 2);
      if (jaw > 0) { p('#8a2a2a', 10, -3 - jaw, 11, jaw); for (let i = 0; i < 5; i++) p('#fff', 11 + i * 2, -3 - jaw, 1, 1); }
    },
    ariranha(ctx, cx, by, f, t) {
      const p = P(ctx, cx, by, f);
      const B = '#4a3424', L = '#e8d8b0';
      const w = Math.round(Math.sin(t * 6) * 1);
      p(B, -14, -4 + w, 6, 2); p(B, -9, -6, 16, 5); p(B, 6, -7, 6, 5); p(L, 6, -4, 5, 2);
      p('#111', 9, -6, 1, 1); p('#111', 11, -5, 1, 1);
    },
    seriema(ctx, cx, by, f, t, moving) {
      const p = P(ctx, cx, by, f);
      const G = '#a49a88', D = '#7a6e5e', R = '#d8442a';
      const s = moving ? Math.round(Math.sin(t * 14) * 2) : 0;
      p(R, -2 + s, -10, 1, 10); p(R, 1 - s, -10, 1, 10);
      p(G, -6, -18, 11, 8); p(D, -9, -17, 4, 3); p(D, -11, -15, 3, 2);
      p(G, 3, -24, 3, 7); p(G, 4, -27, 5, 4); p(R, 9, -26, 3, 1); p('#111', 6, -26, 1, 1); p(D, 4, -30, 1, 3); p(D, 6, -31, 1, 4);
    },
    perereca(ctx, cx, by, f, t) {
      const p = P(ctx, cx, by, f);
      const hop = Math.max(0, Math.sin(t * 6)) * 6;
      p('#4ab04a', -3, -5 - hop, 7, 4); p('#2e7e2e', -4, -2 - hop, 2, 2); p('#2e7e2e', 3, -2 - hop, 2, 2);
      p('#f0f0a0', 1, -6 - hop, 2, 2); p('#111', 2, -6 - hop, 1, 1);
    },

    // ——— Máquinas e ameaças ———
    chainsaw(ctx, cx, by, f, t, st) {
      const p = P(ctx, cx, by, f);
      if (st.dead) return A.overgrown(ctx, cx, by, 24, 22, t);
      const hit = st.flash > 0;
      const Y = hit ? '#fff' : '#4a4e5a', R = hit ? '#fff' : '#2a2d36', K = '#16181e', M = '#6a6e7a';
      // esteiras
      p(K, -11, -6, 22, 6); p(M, -10, -5, 20, 4);
      for (let i = 0; i < 5; i++) p(K, -9 + ((i * 4 + Math.round(t * 30 * st.dir)) % 20 + 20) % 20, -5, 2, 4);
      p(R, -9, -20, 16, 14); p(Y, -8, -19, 14, 12);
      for (let i = 0; i < 3; i++) p('#e8743a', -7 + i * 5, -9, 3, 2); // faixas de alerta
      p('#4ae0f0', -8, -12, 14, 1);
      p(K, -2, -18, 9, 4); p(st.alert ? '#ff3a2a' : '#c03028', 0, -17, 6, 2);
      p(M, -6, -24, 2, 4); // escapamento
      // braço com motosserra
      p(M, 6, -14, 5, 3);
      const bladeY = st.alert ? -15 : -13;
      p('#9aa0a8', 11, bladeY, 12, 4); p('#c8ccd2', 11, bladeY, 12, 1);
      for (let i = 0; i < 6; i++) p(K, 11 + ((i * 2 + Math.round(t * 40)) % 12), bladeY + 4, 1, 1);
    },
    drone(ctx, cx, by, f, t, st) {
      // drone-sentinela do Projeto Horizonte: casco esférico, olho vermelho, antena
      const p = P(ctx, cx, by, f);
      if (st.dead) return;
      const hit = st.flash > 0;
      const C = hit ? '#fff' : '#3a3e4a', D = '#22252e';
      p(D, -10, -9, 20, 2);
      const r = Math.sin(t * 60) > 0;
      p('rgba(220,220,230,0.7)', r ? -14 : -12, -11, r ? 8 : 4, 1); p('rgba(220,220,230,0.7)', r ? 6 : 8, -11, r ? 8 : 4, 1);
      p(C, -5, -8, 10, 7); p('#5a606e', -5, -8, 10, 1);
      p('#16181e', 0, -6, 5, 3); p('#ff3a2a', 2, -5, 2, 1);
      p('#4ae0f0', -4, -2, 8, 1);
      p('#5a606e', -1, -13, 1, 4); p('#ff3a2a', -1, -14, 1, 1);
    },
    polluter(ctx, cx, by, f, t, st) {
      const p = P(ctx, cx, by, f);
      if (st.dead) return A.overgrown(ctx, cx, by, 26, 28, t);
      const hit = st.flash > 0;
      const B = hit ? '#fff' : '#6a5a4a', D = '#3a3028', R = '#8a3a2a';
      p(D, -12, -8, 24, 8);
      p(B, -11, -30, 22, 22); p(D, -11, -24, 22, 2); p(D, -11, -16, 22, 2);
      p('#5a3a5a', -9, -28, 4, 18); // escorrido de resíduo
      p(R, -2, -36, 5, 6); p(D, -3, -37, 7, 2);
      p('#ffb030', 2, -27, 6, 3);
      p(D, 10, -14, 8, 3); p('#4a3a4a', 17, -14, 3, 6 + Math.round(Math.sin(t * 8) * 2));
    },
    lodo(ctx, cx, by, f, t, st) {
      const p = P(ctx, cx, by, f);
      const s = st.size || 1;
      const wob = Math.sin(t * 5) * 1.5;
      const w = Math.round(20 * s + wob), h = Math.round(13 * s - wob);
      const hit = st.flash > 0;
      p(hit ? '#d8f0ff' : '#4a3a52', -w / 2, -h, w, h);
      p(hit ? '#fff' : '#6a5a6e', -w / 2 + 2, -h, w - 4, 2);
      p('#5a7a4a', -w / 2 + 3, -h + 4, 3, 2);
      p('#e8e070', 1, -h + 3, 3, 3); p('#111', 2 + Math.max(0, f), -h + 4, 1, 1);
      p('#e8e070', -4, -h + 3, 3, 3); p('#111', -3 + Math.max(0, f), -h + 4, 1, 1);
      p('#3a2a40', -w / 2 - 2, -2, 4, 2); p('#3a2a40', w / 2 - 2, -2, 4, 2);
    },
    overgrown(ctx, cx, by, w, h, t) {
      // máquina neutralizada: coberta por cipós e flores
      ctx.fillStyle = '#5a5a5e'; ctx.fillRect(Math.round(cx - w / 2), Math.round(by - h), w, h);
      ctx.fillStyle = '#3e3e44'; ctx.fillRect(Math.round(cx - w / 2), Math.round(by - 4), w, 4);
      ctx.fillStyle = '#3e8a34';
      for (let i = 0; i < w; i += 3) ctx.fillRect(Math.round(cx - w / 2 + i), Math.round(by - h + ((i * 7) % h)), 2, Math.round(h - ((i * 7) % h)));
      ctx.fillStyle = '#5eb04a'; ctx.fillRect(Math.round(cx - w / 2 - 1), Math.round(by - h - 1), w + 2, 3);
      const cols = ['#f2c230', '#e86a9a', '#f4f0e0'];
      for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(Math.round(cx - w / 2 + 3 + i * (w / 4)), Math.round(by - h + 2 + (i % 2) * 6), 2, 2); }
    },
    fire(ctx, cx, by, t, size, seed) {
      const s = size;
      for (let i = 0; i < 3; i++) {
        const ph = t * 10 + i * 2 + seed;
        const h = (10 + Math.sin(ph) * 3) * s, w = (6 - i) * s;
        ctx.fillStyle = ['#e8501e', '#f29a2e', '#fce07a'][i];
        ctx.beginPath();
        ctx.moveTo(cx - w, by);
        ctx.quadraticCurveTo(cx - w * 0.6, by - h * 0.6, cx + Math.sin(ph * 1.3) * 2, by - h - i * 2 * s);
        ctx.quadraticCurveTo(cx + w * 0.6, by - h * 0.6, cx + w, by);
        ctx.fill();
      }
      ctx.fillStyle = '#3a2418'; ctx.fillRect(Math.round(cx - 7 * s), Math.round(by - 2), Math.round(14 * s), 2);
    },

    // ——— Objetos ———
    sign(ctx, cx, by, read) {
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(cx - 1, by - 14, 3, 14);
      ctx.fillStyle = '#9a6a3a'; ctx.fillRect(cx - 9, by - 24, 19, 11);
      ctx.fillStyle = '#c8945a'; ctx.fillRect(cx - 9, by - 24, 19, 1);
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(cx - 9, by - 14, 19, 1);
      ctx.fillStyle = read ? '#7a5a3a' : '#f4e0a0';
      ctx.fillRect(cx - 6, by - 21, 12, 1); ctx.fillRect(cx - 6, by - 18, 9, 1);
    },
    checkpoint(ctx, cx, by, on, t) {
      ctx.fillStyle = '#6a4424'; ctx.fillRect(cx - 2, by - 26, 4, 26);
      ctx.fillStyle = '#8a5a30'; ctx.fillRect(cx - 4, by - 4, 8, 4);
      // fita amarela de ipê marcando a trilha
      const wave = Math.sin(t * 6) * 2;
      ctx.fillStyle = on ? '#f2c230' : '#8a8070';
      ctx.fillRect(cx + 2, by - 25, 9, 3); ctx.fillRect(cx + 10, by - 24 + wave * 0.5, 4, 3);
      ctx.fillStyle = on ? '#fff3b0' : '#a8a090'; ctx.fillRect(cx - 2, by - 28, 4, 2);
      if (on) { ctx.fillStyle = 'rgba(255,230,120,' + (0.25 + 0.15 * Math.sin(t * 4)) + ')'; ctx.beginPath(); ctx.arc(cx, by - 26, 7, 0, Math.PI * 2); ctx.fill(); }
    },
    cage(ctx, cx, by, open, t) {
      ctx.fillStyle = '#5a5a60'; ctx.fillRect(cx - 9, by - 2, 18, 2); ctx.fillRect(cx - 9, by - 22, 18, 2);
      if (!open) for (let i = 0; i < 5; i++) ctx.fillRect(cx - 9 + i * 4, by - 22, 1, 22);
      else { ctx.fillRect(cx - 9, by - 22, 1, 22); ctx.fillRect(cx + 8, by - 22, 1, 22); ctx.fillRect(cx + 9, by - 20, 8, 1); }
      ctx.fillRect(cx - 1, by - 26, 2, 4);
    },
    canteen(ctx, cx, by, t) {
      const b = Math.sin(t * 4) * 2;
      ctx.fillStyle = '#2a5a8a'; ctx.fillRect(cx - 5, by - 16 + b, 10, 12);
      ctx.fillStyle = '#4a8ac8'; ctx.fillRect(cx - 4, by - 15 + b, 4, 10);
      ctx.fillStyle = '#c8d0d8'; ctx.fillRect(cx - 2, by - 19 + b, 4, 3);
      ctx.fillStyle = '#a8e0f8'; ctx.fillRect(cx + 2, by - 22 + b, 6, 2);
    },
    seed(ctx, cx, by, t) {
      const b = Math.round(Math.sin(t * 5) * 1.5);
      ctx.fillStyle = '#7a4a1e'; ctx.fillRect(cx - 2, by - 8 + b, 5, 6);
      ctx.fillStyle = '#a8702e'; ctx.fillRect(cx - 1, by - 8 + b, 2, 2);
      ctx.fillStyle = '#5eb04a'; ctx.fillRect(cx, by - 11 + b, 2, 3);
    },
    rare(ctx, cx, by, t) {
      const b = Math.round(Math.sin(t * 3) * 2);
      ctx.fillStyle = 'rgba(255,220,100,' + (0.25 + 0.15 * Math.sin(t * 5)) + ')';
      ctx.beginPath(); ctx.arc(cx, by - 9 + b, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8901e'; ctx.fillRect(cx - 3, by - 13 + b, 7, 8);
      ctx.fillStyle = '#f8d860'; ctx.fillRect(cx - 2, by - 12 + b, 3, 3);
      ctx.fillStyle = '#4aa03a'; ctx.fillRect(cx - 1, by - 17 + b, 2, 4); ctx.fillRect(cx + 1, by - 18 + b, 3, 2);
      if (((t * 4) | 0) % 2) { ctx.fillStyle = '#fff'; ctx.fillRect(cx + 5, by - 16 + b, 1, 1); }
    },
    fruit(ctx, cx, by, t) {
      // pequi: fruto verde com polpa amarela
      const b = Math.round(Math.sin(t * 4) * 1.5);
      ctx.fillStyle = '#4a7a2a'; ctx.fillRect(cx - 4, by - 10 + b, 8, 8);
      ctx.fillStyle = '#6a9a3a'; ctx.fillRect(cx - 3, by - 10 + b, 3, 2);
      ctx.fillStyle = '#f2c230'; ctx.fillRect(cx - 1, by - 7 + b, 3, 3);
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(cx, by - 12 + b, 1, 2);
    },
    heartUp(ctx, cx, by, t) {
      const b = Math.round(Math.sin(t * 3) * 2);
      ctx.fillStyle = 'rgba(120,230,120,0.3)'; ctx.beginPath(); ctx.arc(cx, by - 9 + b, 10, 0, Math.PI * 2); ctx.fill();
      A.leaf(ctx, cx - 5, by - 15 + b, 1, true, 10);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 1, by - 22 + b, 3, 1); ctx.fillRect(cx, by - 23 + b, 1, 3);
    },
    leaf(ctx, x, y, fullness = 1, glow = false, s = 9) {
      // ícone de vitalidade: folha
      const c1 = fullness > 0 ? (glow ? '#7ee05a' : '#5ec04a') : '#2a3a2a';
      const c2 = fullness > 0 ? '#2e7e2a' : '#1a221a';
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.moveTo(x, y + s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x + s, y + s, x, y + s); ctx.fill();
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.moveTo(x + 1, y + s - 1); ctx.quadraticCurveTo(x + 1, y + 1, x + s - 1, y + 1); ctx.quadraticCurveTo(x + s - 2, y + s - 2, x + 1, y + s - 1); ctx.fill();
      ctx.fillStyle = c2; ctx.fillRect(x + 2, y + s - 3, 1, 1); ctx.fillRect(x + 3, y + s - 4, 1, 1); ctx.fillRect(x + 4, y + s - 5, 1, 1); ctx.fillRect(x + 5, y + s - 6, 1, 1);
    },

    // ——— Flora observável ———
    plant(ctx, kind, cx, by, t) {
      if (kind === 'capim') { for (let k = 0; k < 5; k++) GC.Sheets.draw(ctx, 'scenery', 'capim', 0, cx - 14 + k * 7, by + (k % 2), k % 2 === 1, { frame: k % 2 }); return; }
      if (GC.FLORA && GC.FLORA.trees.includes(kind)) { GC.Sheets.draw(ctx, 'trees', kind, t + cx * 0.01, cx, by, false); return; }
      const sway = Math.sin(t * 1.5 + cx * 0.01) * 1;
      if (kind === 'pequi' || kind === 'ipe' || kind === 'lobeira') {
        const trunk = kind === 'lobeira' ? 10 : 30;
        ctx.fillStyle = '#5a3a24';
        let x = cx, y = by;
        for (let i = 0; i < trunk; i++) { ctx.fillRect(Math.round(x), y - i, kind === 'lobeira' ? 2 : 4, 1); x += Math.sin(i * 0.35) * 0.45; }
        const top = by - trunk;
        const crown = kind === 'ipe' ? ['#f2c230', '#f8dc60', '#c8961e'] : kind === 'pequi' ? ['#4a8a34', '#6aac44', '#2e6024'] : ['#7a9a5a', '#9ab874', '#56743e'];
        const R = kind === 'lobeira' ? 9 : 17;
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2;
          ctx.fillStyle = crown[i % 3];
          ctx.beginPath(); ctx.ellipse(Math.round(x + Math.cos(a) * R * 0.6 + sway), Math.round(top - 4 + Math.sin(a) * R * 0.3), R * 0.55, R * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        }
        if (kind === 'pequi') { ctx.fillStyle = '#9ab83a'; [[-8, 2], [6, 0], [0, 6]].forEach(([dx, dy]) => ctx.fillRect(Math.round(x + dx), Math.round(top + dy), 4, 4)); }
        if (kind === 'lobeira') { ctx.fillStyle = '#6aa040'; ctx.fillRect(Math.round(x + 4), Math.round(top + 2), 5, 5); ctx.fillRect(Math.round(x - 7), Math.round(top + 3), 4, 4); }
        if (kind === 'ipe') { ctx.fillStyle = '#fff4b0'; for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(x - 12 + i * 6 + sway), Math.round(top - 10 + (i % 2) * 8), 1, 1); }
      } else if (kind === 'buriti') {
        ctx.fillStyle = '#6a5038'; ctx.fillRect(cx - 2, by - 54, 4, 54);
        ctx.fillStyle = '#5a4430'; for (let i = 0; i < 54; i += 4) ctx.fillRect(cx - 2, by - i, 4, 1);
        ctx.fillStyle = '#c86a2a'; ctx.fillRect(cx - 4, by - 52, 3, 4); ctx.fillRect(cx + 1, by - 51, 3, 4); // cachos
        for (let i = 0; i < 11; i++) {
          const a = Math.PI * (0.05 + i * 0.09);
          ctx.fillStyle = i % 2 ? '#3e8a34' : '#5aac44';
          for (let k = 0; k < 18; k++) ctx.fillRect(Math.round(cx + Math.cos(a) * k * 1.3 + sway), Math.round(by - 56 - Math.sin(a) * k * 0.9 + k * k * 0.035), 2, 1);
        }
      } else if (kind === 'mound') {
        ctx.fillStyle = '#b4703e';
        ctx.beginPath(); ctx.moveTo(cx - 9, by); ctx.quadraticCurveTo(cx - 6, by - 26, cx, by - 24); ctx.quadraticCurveTo(cx + 6, by - 22, cx + 9, by); ctx.fill();
        ctx.fillStyle = '#8a5230'; ctx.fillRect(cx - 3, by - 14, 2, 2); ctx.fillRect(cx + 2, by - 8, 2, 2);
      } else if (kind === 'art') {
        ctx.fillStyle = 'rgba(255,220,160,0.12)'; ctx.fillRect(cx - 16, by - 60, 32, 50);
      }
    },

    // Ícones para o Guia de Campo (desenha a espécie centralizada num canvas)
    icon(ctx, key, w, h, t = 0) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, by = h - 6;
      ctx.save();
      const s = 2; ctx.translate(cx, by); ctx.scale(s, s); ctx.translate(-cx, -by);
      const SH = { ema: ['ema', 'idle'], lobo: ['lobo', 'idle'], tucano: ['tucano', 'perch'], cateto: ['cateto', 'idle'], veado: ['veado', 'alert'], tatu: ['tatu', 'idle'], seriema: ['seriema', 'idle'], tamandua: ['tamandua', 'idle'], arara: ['arara', 'fly'] }[key];
      if (SH) { ctx.restore(); ctx.save(); ctx.imageSmoothingEnabled = false; ctx.setTransform(1, 0, 0, 1, 0, 0); GC.Sheets.draw(ctx, SH[0], SH[1], t, cx, by + 4, false); ctx.restore(); ctx.save(); return; }
      if (key === 'cagaita') { ctx.restore(); ctx.save(); ctx.setTransform(0.5, 0, 0, 0.5, cx * 0.5, by * 0.5); GC.Sheets.draw(ctx, 'trees', 'cagaita', 0, cx, by + 6, false); ctx.restore(); ctx.save(); return; }
      if (key === 'capim') { ctx.restore(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); for (let k = 0; k < 3; k++) GC.Sheets.draw(ctx, 'scenery', 'capim', 0, cx - 12 + k * 12, by + 2, false, { frame: k % 2 }); ctx.restore(); ctx.save(); return; }
      switch (key) {
        case 'arara': A.arara(ctx, cx, by - 6, 1, t, true); break;
        case 'capivara': A.capivara(ctx, cx, by, 1, t, false); break;
        case 'tamandua': A.tamandua(ctx, cx + 4, by, 1, t, false); break;
        case 'onca': A.onca(ctx, cx, by, 1, t, 'stand'); break;
        case 'jacare': A.jacare(ctx, cx, by, 1, t, 0.3); break;
        case 'sucuri': for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 3 ? '#6a7a3a' : '#2e3a1e'; ctx.fillRect(cx - 20 + i * 3, by - 6 + Math.sin(i * 0.8) * 3, 4, 4); } ctx.fillStyle = '#6a7a3a'; ctx.fillRect(cx + 21, by - 8, 5, 4); break;
        case 'ariranha': A.ariranha(ctx, cx, by - 2, 1, t); break;
        case 'seriema': A.seriema(ctx, cx, by, 1, t, false); break;
        case 'perereca': A.perereca(ctx, cx, by, 1, 0); break;
        case 'pequi': case 'ipe': case 'lobeira': ctx.restore(); ctx.save(); A.plant(ctx, key, cx, by + 2, t); break;
        case 'buriti': ctx.restore(); ctx.save(); ctx.translate(cx, by); ctx.scale(0.9, 0.9); ctx.translate(-cx, -by); A.plant(ctx, 'buriti', cx, by + 4, t); break;
        case 'mound': A.plant(ctx, 'mound', cx, by, t); break;
        case 'fire': A.fire(ctx, cx, by, t, 1.4, 0); break;
        case 'stumps': [[-16, 6], [0, 9], [14, 5]].forEach(([dx, hh]) => { ctx.fillStyle = '#6a4424'; ctx.fillRect(cx + dx - 4, by - hh, 8, hh); ctx.fillStyle = '#c8945a'; ctx.fillRect(cx + dx - 4, by - hh, 8, 2); }); ctx.fillStyle = '#5ec04a'; ctx.fillRect(cx + 6, by - 6, 1, 6); ctx.fillRect(cx + 4, by - 7, 3, 2); ctx.fillStyle = '#8a6a4a'; ctx.fillRect(cx - 24, by - 1, 48, 1); break;
        case 'drone': ctx.fillStyle = '#e8e8ee'; ctx.fillRect(cx - 12, by - 14, 24, 2); ctx.fillRect(cx - 4, by - 12, 8, 6); ctx.fillStyle = '#4a9a3a'; ctx.fillRect(cx - 3, by - 11, 6, 2); ctx.fillStyle = '#2a2d36'; ctx.fillRect(cx - 1, by - 6, 2, 2); ctx.fillStyle = '#6aa83a'; ctx.fillRect(cx - 24, by - 2, 48, 2); ctx.fillStyle = 'rgba(120,220,255,0.35)'; ctx.fillRect(cx - 8, by - 4, 16, 2); break;
        case 'river': ctx.fillStyle = '#2e80aa'; ctx.fillRect(cx - 24, by - 8, 48, 8); ctx.fillStyle = '#bfe8ff'; ctx.fillRect(cx - 20, by - 8, 10, 1); ctx.fillRect(cx + 4, by - 6, 12, 1); ctx.fillStyle = '#8a5a32'; ctx.fillRect(cx - 24, by - 12, 18, 3); break;
        case 'park': A.plant(ctx, 'pequi', cx - 8, by, t); ctx.fillStyle = '#8e9a36'; ctx.fillRect(cx - 24, by - 2, 48, 2); break;
        case 'falls': ctx.fillStyle = '#6f7a7c'; ctx.fillRect(cx - 24, by - 26, 18, 26); ctx.fillStyle = '#c8e8f8'; ctx.fillRect(cx - 6, by - 26, 6, 24); ctx.fillStyle = '#2e80aa'; ctx.fillRect(cx - 6, by - 4, 30, 4); break;
        case 'rock': ctx.fillStyle = '#b0644a'; ctx.fillRect(cx - 20, by - 22, 10, 22); ctx.fillRect(cx - 6, by - 30, 12, 30); ctx.fillRect(cx + 10, by - 16, 9, 16); ctx.fillStyle = '#7a3e2e'; ctx.fillRect(cx - 6, by - 24, 12, 2); break;
        case 'art': ctx.fillStyle = '#3a2a2a'; ctx.fillRect(cx - 22, by - 26, 44, 26); ctx.fillStyle = '#b8442c'; ctx.fillRect(cx - 12, by - 22, 2, 2); ctx.fillRect(cx - 12, by - 20, 2, 6); ctx.fillRect(cx - 15, by - 19, 8, 1); ctx.fillStyle = '#c8a050'; ctx.fillRect(cx + 2, by - 14, 12, 3); ctx.fillRect(cx + 12, by - 17, 3, 3); break;
      }
      ctx.restore();
    }
  };
  return A;
})();
