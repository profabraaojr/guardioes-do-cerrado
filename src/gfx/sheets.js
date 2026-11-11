// Spritesheets: registro, montagem de atlas, carregamento de PNG/JSON e desenho.
//
// Cada folha é definida uma vez (tamanho do quadro, pivô, animações e função que
// desenha cada quadro). No início o jogo tenta carregar assets/sprites/<nome>.png e
// <nome>.json; se não existirem (por exemplo, ao abrir o arquivo direto do disco),
// monta o atlas em memória a partir da mesma definição. Assim, um artista pode editar
// o PNG exportado e o jogo passa a usá-lo, sem tocar no código.
//
// Densidade: a arte tem o dobro de pixels do mundo lógico (SCALE = 2). Um quadro de
// 64×64 ocupa 32×32 unidades do mundo e aparece com 64 px de altura na tela de 960×540.
GC.Sheets = (function () {
  const defs = {}, sheets = {};
  const SC = () => GC.CFG.SCALE;

  function define(name, def) { defs[name] = Object.assign({ cols: 8 }, def); }

  function layout(d) {
    const list = [];
    for (const [anim, a] of Object.entries(d.anims)) for (let i = 0; i < a.n; i++) list.push([anim, i]);
    return list;
  }

  function build(name) {
    const d = defs[name];
    const list = layout(d);
    const cols = Math.min(d.cols, list.length), rows = Math.ceil(list.length / cols);
    const [img, x] = GC.U.makeCanvas(cols * d.fw, rows * d.fh);
    const meta = { image: name + '.png', frameWidth: d.fw, frameHeight: d.fh, pivot: { x: d.pivot[0], y: d.pivot[1] }, scale: SC(), hitbox: d.hitbox || null, animations: {} };
    list.forEach(([anim, i], k) => {
      const pix = new GC.Pix(d.fw, d.fh);
      d.frame(pix, anim, i);
      const cx = (k % cols) * d.fw, cy = Math.floor(k / cols) * d.fh;
      x.drawImage(pix.c, cx, cy);
      const A = meta.animations[anim] || (meta.animations[anim] = { fps: d.anims[anim].fps, loop: d.anims[anim].loop !== false, frames: [] });
      A.frames.push({ x: cx, y: cy, w: d.fw, h: d.fh });
    });
    return use(name, img, meta);
  }

  function use(name, img, meta) {
    // silhueta branca para o piscar de dano
    const [white, wx] = GC.U.makeCanvas(img.width, img.height);
    wx.drawImage(img, 0, 0); wx.globalCompositeOperation = 'source-atop'; wx.fillStyle = '#ffffff'; wx.fillRect(0, 0, img.width, img.height);
    sheets[name] = { img, white, meta };
    return sheets[name];
  }

  function get(name) { return sheets[name] || (defs[name] ? build(name) : null); }

  async function preload(base = 'assets/sprites/') {
    const names = Object.keys(defs);
    await Promise.all(names.map(async (n) => {
      try {
        const r = await fetch(base + n + '.json');
        if (!r.ok) throw 0;
        const meta = await r.json();
        const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = base + meta.image; });
        use(n, img, meta);
        sheets[n].fromFile = true;
      } catch (e) { build(n); }
    }));
    return Object.fromEntries(names.map((n) => [n, sheets[n].fromFile ? 'png' : 'gerado']));
  }

  function frameOf(sheet, anim, t, frame) {
    const A = sheet.meta.animations[anim] || sheet.meta.animations[Object.keys(sheet.meta.animations)[0]];
    let i = frame !== undefined ? frame : Math.floor(t * A.fps);
    i = A.loop ? ((i % A.frames.length) + A.frames.length) % A.frames.length : Math.min(i, A.frames.length - 1);
    return A.frames[i];
  }

  const r2 = (v) => Math.round(v * SC()) / SC();

  // desenha com o pivô em (x, y) nas coordenadas do mundo (contexto já em escala 2)
  function draw(ctx, name, anim, t, x, y, flip, opt = {}) {
    const S = get(name);
    if (!S) return;
    const f = frameOf(S, anim, t, opt.frame);
    const s = SC(), w = f.w / s, h = f.h / s, px = S.meta.pivot.x / s, py = S.meta.pivot.y / s;
    const img = opt.white ? S.white : S.img;
    if (opt.alpha !== undefined) ctx.globalAlpha = opt.alpha;
    if (flip) {
      ctx.save(); ctx.translate(r2(x), r2(y)); ctx.scale(-1, 1);
      ctx.drawImage(img, f.x, f.y, f.w, f.h, -px, -py, w, h);
      ctx.restore();
    } else ctx.drawImage(img, f.x, f.y, f.w, f.h, r2(x) - px, r2(y) - py, w, h);
    if (opt.alpha !== undefined) ctx.globalAlpha = 1;
  }

  // exportação (usada por tools/export-sprites.js)
  function exportAll() {
    const out = {};
    for (const n of Object.keys(defs)) {
      const S = sheets[n] && !sheets[n].fromFile ? sheets[n] : build(n);
      out[n] = { png: S.img.toDataURL('image/png'), json: S.meta };
    }
    return out;
  }

  function duration(name, anim) { const S = get(name); const A = S.meta.animations[anim]; return A ? A.frames.length / A.fps : 0; }

  return { define, get, draw, preload, exportAll, duration, defs, sheets };
})();

// ——— Folhas dos personagens (boneco articulado) ———
(function () {
  const A = GC.Puppet.ANIMS;
  const pick = (names) => Object.fromEntries(names.map((n) => [n, { n: A[n].n, fps: A[n].fps, loop: A[n].loop }]));
  const hero = ['idle', 'walk', 'run', 'jump', 'fall', 'tool', 'hurt', 'death', 'victory', 'climb', 'swim', 'slide', 'crouch'];
  for (const who of ['piata', 'larinha']) {
    GC.Sheets.define(who, {
      fw: 64, fh: 64, pivot: [32, 62], hitbox: { w: 20, h: 44 },
      anims: pick(hero),
      frame: (pix, anim, i) => GC.Puppet.draw(pix, who, A[anim].f(i))
    });
  }
  const npc = ['idle', 'walk', 'run', 'alert', 'throw', 'hands', 'slip', 'crouch', 'talk'];
  for (const who of ['traficante', 'cacador', 'descartador', 'garimpeiro', 'cida', 'rafael']) {
    GC.Sheets.define(who, {
      fw: 64, fh: 64, pivot: [32, 62], hitbox: { w: 24, h: 52 },
      anims: pick(npc),
      frame: (pix, anim, i) => GC.Puppet.draw(pix, who, A[anim].f(i))
    });
  }
})();
