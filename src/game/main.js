// Orquestração: laço principal, telas (título, abertura, seleção, pausa,
// Guia de Campo, final), dimensionamento responsivo e controles de toque.
(function () {
  const C = GC.CFG, I = GC.Input, A = GC.Audio, U = GC.U;
  const $ = (id) => document.getElementById(id);
  const canvas = $('screen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let mode = 'title';   // title | intro | select | play | pause | guide | ending
  let game = null;
  let save = GC.Save.load() || GC.Save.blank();
  let selected = 'piata';
  let introT = 0, introLine = -1;
  let titleT = 0;
  let prevMode = null;
  const titleCam = { x: 0, y: 300 };
  let titleLevel = null;

  // ——— Dimensionamento ———
  function resize() {
    const stage = $('stage');
    const app = $('app');
    const portrait = window.innerHeight > window.innerWidth;
    const touch = document.body.classList.contains('touch');
    const availW = app.clientWidth;
    const availH = app.clientHeight - (portrait && touch ? Math.min(240, app.clientHeight * 0.38) : 0);
    let s = Math.min(availW / C.W, availH / C.H);
    if (s >= 2) s = Math.floor(s * 2) / 2;
    const w = Math.floor(C.W * s), h = Math.floor(C.H * s);
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    stage.style.setProperty('--u', (w / C.W) + 'px');
    GC.DialogUI.resize(w, h);
    document.body.classList.toggle('portrait', portrait);
  }
  window.addEventListener('resize', resize);

  function enableTouch() {
    if (document.body.classList.contains('touch')) return;
    document.body.classList.add('touch');
    resize();
  }
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  window.addEventListener('touchstart', enableTouch, { passive: true, once: true });

  // ——— Telas ———
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => (s.hidden = s.id !== id));
    $('screens').hidden = !id;
  }

  function setMode(m) {
    prevMode = mode; mode = m;
    document.body.dataset.mode = m;
    GC.HUD.show(m === 'play' || m === 'pause');
    $('touch').dataset.mode = m;
  }

  function goTitle() {
    if (game && game.player.spraying) A.spray(false);
    game = null;
    GC.HUD.clearTransient();
    save = GC.Save.load() || save;
    $('btnContinue').hidden = !(GC.Save.load() && (GC.Save.load().checkpoint || GC.Save.load().guide.length));
    show('titleScreen');
    setMode('title');
    A.music('title');
    setTimeout(() => $('btnNew').focus({ preventScroll: true }), 50);
  }

  function startIntro() {
    const keepGuide = GC.Save.loadGuideOnly();
    save = GC.Save.blank();
    save.guide = keepGuide;
    GC.Save.write(save);
    introT = 0; introLine = -1;
    show(null);
    setMode('intro');
    A.music('title');
    nextIntroLine();
  }
  function nextIntroLine() {
    introLine++;
    if (introLine >= GC.INTRO.length) { openSelect(); return; }
    GC.HUD.startDialog([GC.INTRO[introLine]], () => nextIntroLine());
    introT = 0;
  }

  function openSelect() {
    GC.HUD.clearTransient();
    show('selectScreen');
    setMode('select');
    renderSelect();
  }
  function renderSelect() {
    for (const who of ['piata', 'larinha']) {
      const card = document.querySelector('.char-card[data-char="' + who + '"]');
      const Ch = GC.CHARACTERS[who];
      card.querySelector('.cname').textContent = Ch.name;
      card.querySelector('.crole').textContent = Ch.role + ' · ' + Ch.age + ' anos';
      card.querySelector('.cbio').textContent = Ch.bio;
      const st = card.querySelector('.cstats'); st.innerHTML = '';
      Object.entries(Ch.stats).forEach(([k, v]) => {
        const row = document.createElement('div'); row.className = 'stat';
        row.innerHTML = '<span></span><i></i>';
        row.querySelector('span').textContent = k;
        row.querySelector('i').style.setProperty('--v', v);
        row.querySelector('i').setAttribute('aria-label', v + ' de 3');
        st.appendChild(row);
      });
      const ab = card.querySelector('.cabil'); ab.innerHTML = '';
      [[Ch.toolName, Ch.toolDesc], [Ch.allyName, Ch.allyDesc]].forEach(([n, d]) => { const li = document.createElement('li'); li.innerHTML = '<b></b> <span></span>'; li.querySelector('b').textContent = n + ':'; li.querySelector('span').textContent = d; ab.appendChild(li); });
      Ch.extra.forEach((e) => { const li = document.createElement('li'); li.textContent = e; ab.appendChild(li); });
      card.classList.toggle('sel', who === selected);
      card.setAttribute('aria-pressed', who === selected ? 'true' : 'false');
    }
    $('btnStart').textContent = 'Começar com ' + GC.CHARACTERS[selected].name;
  }

  function startGame() {
    A.init();
    GC.HUD.clearTransient();
    GC.HUD.reset();
    game = new GC.Game('fase1', save, selected);
    game.onRespawn = () => {
      const ch = game.player.char;
      GC.Save.write(save);
      game = new GC.Game('fase1', save, ch);
      wire(game);
      GC.HUD.reset();
    };
    wire(game);
    show(null);
    setMode('play');
    if (!save.flags.started) { save.flags.started = true; GC.HUD.toast('Troque de personagem com L (ou o botão Trocar). Aliado: Q.'); }
  }
  function wire(g) { g.onEnd = () => setTimeout(showEnding, 400); }

  function pause() {
    if (!game || mode !== 'play') return;
    if (game.player.spraying) { game.player.spraying = false; A.spray(false); }
    setMode('pause'); show('pauseScreen');
    $('btnSound').textContent = A.muted ? 'Som: desligado' : 'Som: ligado';
    setTimeout(() => $('btnResume').focus({ preventScroll: true }), 30);
  }
  function resume() { show(null); setMode('play'); I.reset(); }

  function openGuide(from) {
    prevMode = from;
    show('guideScreen'); mode = 'guide';
    const grid = $('guideGrid'); grid.innerHTML = '';
    const have = (game ? game.save.guide : (GC.Save.load() || save).guide);
    $('guideProgress').textContent = have.length + ' de ' + GC.GUIDE_ORDER.length + ' registros';
    GC.GUIDE_ORDER.forEach((k) => {
      const G = GC.GUIDE[k], ok = have.includes(k);
      const b = document.createElement('button');
      b.className = 'gitem' + (ok ? '' : ' locked');
      b.type = 'button';
      const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64;
      if (ok) GC.Art.icon(cv.getContext('2d'), G.icon, 96, 64, 0);
      const t = document.createElement('span'); t.textContent = ok ? G.name : '???';
      const c = document.createElement('small'); c.textContent = G.cat;
      b.append(cv, t, c);
      if (ok) b.addEventListener('click', () => GC.HUD.showCard({ cat: 'Guia de Campo · ' + G.cat, title: G.name, sub: G.sci, text: G.text, tip: G.tip, icon: G.icon }, () => {}));
      else b.disabled = true;
      grid.appendChild(b);
    });
    setTimeout(() => $('btnGuideBack').focus({ preventScroll: true }), 30);
  }
  function closeGuide() {
    if (prevMode === 'pause') { setMode('pause'); show('pauseScreen'); }
    else goTitle();
  }

  function showEnding() {
    const S = game.save.stats;
    const mins = Math.floor(S.time / 60), secs = Math.floor(S.time % 60);
    const rows = [
      ['Tempo de trilha', mins + 'min ' + String(secs).padStart(2, '0') + 's'],
      ['Mudas plantadas', S.planted],
      ['Focos de incêndio apagados', S.fires],
      ['Máquinas neutralizadas', S.machines],
      ['Trechos de água purificados', S.cleaned],
      ['Animais resgatados', S.rescued],
      ['Infratores contidos sem violência', S.contained || 0],
      ['Criaturas recuperadas', S.recovered || 0],
      ['Armadilhas desarmadas', S.traps || 0],
      ['Sementes nativas coletadas', S.seeds],
      ['Sementes raras', game.save.rares.length + ' de 5'],
      ['Registros no Guia de Campo', game.save.guide.length + ' de ' + GC.GUIDE_ORDER.length],
      ['Recomeços', S.deaths]
    ];
    const tb = $('endStats'); tb.innerHTML = '';
    rows.forEach(([k, v]) => { const tr = document.createElement('tr'); tr.innerHTML = '<th></th><td></td>'; tr.querySelector('th').textContent = k; tr.querySelector('td').textContent = v; tb.appendChild(tr); });
    GC.Save.write(game.save);
    show('endScreen'); setMode('ending');
    setTimeout(() => $('btnEndTitle').focus({ preventScroll: true }), 30);
  }

  // ——— Botões ———
  const click = (id, fn) => $(id).addEventListener('click', () => { A.init(); A.play('swap'); fn(); });
  click('btnNew', startIntro);
  click('btnContinue', () => { save = GC.Save.load() || GC.Save.blank(); openSelect(); });
  click('btnGuide', () => openGuide('title'));
  click('btnControls', () => { show('controlsScreen'); mode = 'controls'; setTimeout(() => $('btnControlsBack').focus({ preventScroll: true }), 30); });
  click('btnControlsBack', goTitle);
  click('btnSkipIntro', () => { GC.HUD.clearTransient(); openSelect(); });
  click('btnStart', startGame);
  click('btnSelectBack', goTitle);
  click('btnResume', resume);
  click('btnPauseGuide', () => openGuide('pause'));
  click('btnSound', () => { const m = A.toggleMute(); $('btnSound').textContent = m ? 'Som: desligado' : 'Som: ligado'; });
  click('btnRestart', () => { resume(); game.onRespawn(); });
  click('btnQuit', goTitle);
  click('btnGuideBack', closeGuide);
  click('btnEndTitle', goTitle);
  document.querySelectorAll('.char-card').forEach((c) => c.addEventListener('click', () => { selected = c.dataset.char; A.init(); A.play('swap'); renderSelect(); }));
  $('pauseBtn').addEventListener('click', () => { A.init(); if (mode === 'play') pause(); else if (mode === 'pause') resume(); });

  // ——— Laço principal ———
  let last = performance.now(), acc = 0;
  function frame(now) {
    let dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= C.STEP) {
      I.update();
      step(C.STEP);
      acc -= C.STEP;
    }
    render();
    requestAnimationFrame(frame);
  }

  function step(dt) {
    titleT += dt;
    if (mode === 'play') {
      if (I.pressed('pause') && !GC.HUD.dialogOpen && !GC.HUD.cardOpen) { pause(); return; }
      game.update(dt);
    } else if (mode === 'pause') {
      if (I.pressed('pause')) resume();
    } else if (mode === 'intro') {
      introT += dt;
      GC.HUD.update(null, dt);
      if (GC.HUD.dialogOpen && (I.pressed('confirm') || I.pressed('interact'))) GC.HUD.advance();
      if (I.pressed('pause')) { GC.HUD.clearTransient(); openSelect(); }
      GC.HUD.update({ save, hearts: 0, water: 0, player: { char: 'piata' }, allyCd: 0 }, 0);
    } else if (mode === 'select') {
      if (I.pressed('left') || I.pressed('right')) { selected = selected === 'piata' ? 'larinha' : 'piata'; A.play('swap'); renderSelect(); }
      if (I.pressed('confirm')) startGame();
    } else if (mode === 'guide' || mode === 'controls') {
      if (GC.HUD.cardOpen) { if (I.pressed('confirm') || I.pressed('pause')) GC.HUD.closeCard(); }
      else if (I.pressed('pause')) { if (mode === 'guide') closeGuide(); else goTitle(); }
    }
    if (mode === 'intro' || mode === 'title' || mode === 'select') A.ambient(dt, 'day');
  }

  function render() {
    GC.DialogUI.render();
    if ((mode === 'play' || mode === 'pause') && game) { game.render(ctx); return; }
    // fundos animados das telas
    if (!titleLevel) titleLevel = new GC.Level(GC.Levels.fase1);
    let theme = 'rio';
    if (mode === 'intro') {
      const L = GC.INTRO[Math.max(0, introLine)];
      theme = L ? L.scene : 'rio';
    } else if (mode === 'ending') theme = 'healed';
    else if (mode === 'select') theme = 'cerrado';
    titleCam.x = (titleT * 18) % 3000;
    GC.Background.draw(ctx, titleLevel, titleCam, titleT, theme);
    if (mode === 'intro') {
      const x = ((titleT * 70) % (C.W + 80)) - 40;
      if (theme === 'cerrado') GC.Art.arara(ctx, x, 80 + Math.sin(titleT * 2) * 10, 1, titleT, true);
      if (theme === 'boss') {
        ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(300, 200); ctx.scale(0.8, 0.8);
        const fake = { x: 0, y: -70, w: 112, h: 70, t: titleT, valves: [{ dx: 22, alive: true, hp: 5 }, { dx: 52, alive: true, hp: 5 }, { dx: 82, alive: true, hp: 5 }], state: 'idle', scanned: 0, stun: 0, chain: null, flash: 0, shieldsDown: false };
        GC.Ent.boss.prototype.draw.call(fake, ctx, { x: 0, y: 0 }, { level: { arena: { floor: 0 } } });
        ctx.restore();
        ctx.fillStyle = 'rgba(40,30,30,0.35)'; ctx.fillRect(0, 0, C.W, C.H);
      }
      if (theme === 'rio') {
        GC.Art.player(ctx, 200, 236, 1, 'stand', { char: 'larinha' });
        GC.Art.player(ctx, 260, 236, -1, 'stand', { char: 'piata' });
        ctx.fillStyle = '#3e4a22'; ctx.fillRect(0, 236, C.W, 34);
      }
    }
    if (mode === 'select' || mode === 'title') {
      ctx.fillStyle = 'rgba(10,14,12,0.25)'; ctx.fillRect(0, 0, C.W, C.H);
    }
  }

  // ——— Inicialização ———
  function boot() {
    GC.Art.init();
    GC.Tiles.pregen();
    GC.Background.pregen();
    GC.DialogUI.init($('ui'));
    GC.HUD.init();
    I.bindTouch($('touch'));
    resize();
    // retratos da tela de seleção
    document.querySelectorAll('.char-card canvas').forEach((cv) => { const x = cv.getContext('2d'); cv.width = 40; cv.height = 40; x.drawImage(GC.Portraits.get(cv.closest('.char-card').dataset.char, 'happy'), 0, 0); });
    goTitle();
    requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });
    // primeira interação libera o áudio
    const unlock = () => { A.init(); A.music(mode === 'play' ? (game && game.zone ? game.zone.music : 'cerrado') : 'title'); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }
  const fontReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontReady.then(boot);

  // depuração e testes automatizados
  GC.debug = { get game() { return game; }, get mode() { return mode; }, startGame: (c) => { selected = c || 'piata'; startGame(); }, save: () => save };
})();
