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
  // Ajuste de tela: altura lógica fixa (270); a largura cresce até 21:9 em telas compridas.
  // A ampliação é inteira em pixels FÍSICOS (considera o devicePixelRatio) quando isso
  // ocupa ao menos INT_SCALE_MIN do espaço; senão, fracionária com image-rendering: pixelated.
  function resize() {
    const stage = $('stage'), app = $('app'), cv = $('screen');
    const portrait = window.innerHeight > window.innerWidth;
    const touch = document.body.classList.contains('touch');
    const cs = getComputedStyle(app);
    const availW = app.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = app.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (portrait && touch && mode === 'play' ? Math.min(240, app.clientHeight * 0.38) : 0);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const fit = Math.max(0.25, Math.min(availW / C.W_MIN, availH / C.H)); // CSS px por unidade lógica
    // escala inteira: cada pixel da arte (meia unidade) vira N pixels físicos
    const n = Math.floor(fit * dpr / C.SCALE * 1.0001);
    let s = fit;
    if (n >= 1 && (n * C.SCALE / dpr) >= fit * C.INT_SCALE_MIN) s = n * C.SCALE / dpr;
    // largura lógica: preenche a tela até o limite de 21:9 (número par)
    const W = Math.max(C.W_MIN, Math.min(C.W_MAX, Math.floor(availW / s / 2) * 2));
    if (W !== C.W) { C.W = W; cv.width = W * C.SCALE; }
    const w = Math.round(C.W * s), h = Math.round(C.H * s);
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    stage.style.setProperty('--u', s + 'px');
    GC.DialogUI.resize(w, h);
    document.body.classList.toggle('portrait', portrait);
    if (GC.Mobile) GC.Mobile.updateRotate(mode);
    GC.view = { W: C.W, scale: s, dpr, integer: Math.abs(s * dpr / C.SCALE - Math.round(s * dpr / C.SCALE)) < 1e-6 };
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

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
    if (GC.Mobile) GC.Mobile.updateRotate(m);
    GC.HUD.show(m === 'play' || m === 'pause');
    $('touch').dataset.mode = m;
    if (document.body.classList.contains('portrait') && (m === 'play' || prevMode === 'play')) resize(); // retrato: reserva a área dos controles
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
      [[Ch.toolName, Ch.toolDesc], [Ch.allyName, Ch.allyDesc], [Ch.powerName + ' (F)', Ch.powerDesc]].forEach(([n, d]) => { const li = document.createElement('li'); li.innerHTML = '<b></b> <span></span>'; li.querySelector('b').textContent = n + ':'; li.querySelector('span').textContent = d; ab.appendChild(li); });
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
    if (GC.HUD.cardOpen || GC.HUD.dialogOpen) return; // fecha a ficha ou o diálogo antes
    if (game.player.spraying) { game.player.spraying = false; A.spray(false); }
    setMode('pause'); show('pauseScreen');
    $('btnSound').textContent = A.muted ? 'Som: desligado' : 'Som: ligado';
    setTimeout(() => $('btnResume').focus({ preventScroll: true }), 30);
  }
  function resume() { show(null); setMode('play'); I.reset(); }
  // pausa automática: aba em segundo plano ou controle desconectado
  I.onAutoPause = (why) => { if (mode === 'play' && game) { pause(); if (why === 'controle') GC.HUD.toast('Controle desconectado: jogo pausado.'); } };

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
  click('btnNew', () => { GC.Mobile.onStart(); startIntro(); });
  click('btnContinue', () => { GC.Mobile.onStart(); save = GC.Save.load() || GC.Save.blank(); openSelect(); });
  click('btnGuide', () => openGuide('title'));
  click('btnInstall', () => { const panel = GC.Mobile.install(); if (panel) { show('installScreen'); mode = 'controls'; } });
  click('btnInstallBack', goTitle);
  $('soundBtn').addEventListener('click', () => { GC.Audio.unlock(); if (GC.Audio.muted || !GC.Audio.running) { if (GC.Audio.muted) GC.Audio.toggleMute(); GC.Audio.unlock(); GC.HUD.toast('Som ligado.'); } else { GC.Audio.toggleMute(); GC.HUD.toast('Som desligado.'); } GC.HUD.reset(); });
  $('fsBtn').addEventListener('click', () => GC.Mobile.toggleFullscreen());
  click('btnControls', () => { renderKeys(); show('controlsScreen'); mode = 'controls'; setTimeout(() => $('btnControlsBack').focus({ preventScroll: true }), 30); });
  click('btnKeysReset', () => { I.cancelRebind(); I.resetBinds(); renderKeys(); GC.HUD.toast('Teclas padrão restauradas.'); });
  // tabela de remapeamento do teclado (as teclas padrão continuam as mesmas)
  const KEY_LABELS = {
    left: ['Andar para a esquerda', 'Direcional ou analógico'], right: ['Andar para a direita', 'Direcional ou analógico'],
    up: ['Cima · escalar · mirar · interagir', 'Direcional ou analógico'], down: ['Baixo · agachar · deslizar', 'Direcional ou analógico'],
    jump: ['Pular · nadar', 'A'], tool: ['Usar ferramenta', 'X ou RT'], swap: ['Trocar personagem', 'Y'], ally: ['Aliado', 'B ou RB'],
    power: ['Poder', 'LT ou L3'], interact: ['Interagir', 'LB'], pause: ['Pausa', 'Start'], confirm: ['Confirmar (diálogos)', 'A']
  };
  function renderKeys() {
    const t = $('keysTable'); t.innerHTML = '<tr><th>Ação</th><th>Teclado</th><th>Controle</th></tr>';
    for (const a of I.ACTIONS) {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.textContent = KEY_LABELS[a][0]; tr.appendChild(th);
      const td = document.createElement('td');
      const keys = I.binds[a].slice(); if (keys.length < 3) keys.push('');
      keys.forEach((k, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'key' + (k ? '' : ' add');
        b.textContent = k ? I.keyName(k) : '+'; b.title = k ? 'Trocar esta tecla' : 'Acrescentar tecla';
        b.addEventListener('click', () => {
          document.querySelectorAll('#keysTable .key.wait').forEach((x) => x.classList.remove('wait'));
          b.classList.add('wait'); b.textContent = '…';
          $('keysHint').textContent = 'Aperte a nova tecla para "' + KEY_LABELS[a][0] + '" (Esc cancela).';
          I.rebind(a, i, (ok, code) => { $('keysHint').textContent = ok ? 'Tecla ' + I.keyName(code) + ' gravada.' : 'Troca cancelada.'; renderKeys(); });
        });
        td.appendChild(b);
      });
      tr.appendChild(td);
      const pad = document.createElement('td'); pad.className = 'pad'; pad.textContent = KEY_LABELS[a][1]; tr.appendChild(pad);
      t.appendChild(tr);
    }
  }
  click('btnControlsBack', () => { I.cancelRebind(); goTitle(); });
  click('btnSkipIntro', () => { GC.HUD.clearTransient(); openSelect(); });
  click('btnStart', () => { GC.Mobile.onStart(); startGame(); });
  click('btnSelectBack', goTitle);
  click('btnResume', resume);
  click('btnPauseGuide', () => openGuide('pause'));
  click('btnSound', () => { const m = A.toggleMute(); $('btnSound').textContent = m ? 'Som: desligado' : 'Som: ligado'; });
  // mixer: música e sons da natureza em três níveis
  const MUS = [[0.24, 'média'], [0.4, 'alta'], [0.1, 'baixa'], [0, 'desligada']];
  const NAT = [[0.75, 'altos'], [1, 'muito altos'], [0.4, 'baixos'], [0, 'desligados']];
  const label = () => {
    const m = MUS.find(([v]) => Math.abs(v - A.mix.music) < 0.01) || MUS[0], n = NAT.find(([v]) => Math.abs(v - A.mix.nature) < 0.01) || NAT[0];
    $('btnMusic').textContent = 'Música: ' + m[1]; $('btnNature').textContent = 'Sons da natureza: ' + n[1];
  };
  const cycle = (list, key) => { const i = list.findIndex(([v]) => Math.abs(v - A.mix[key]) < 0.01); A.setMix(key, list[(i + 1) % list.length][0]); label(); };
  click('btnMusic', () => cycle(MUS, 'music'));
  click('btnNature', () => { cycle(NAT, 'nature'); GC.Soundscape.play('bemtevi', 0, 1); });
  label();
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
    if (mode === 'intro' || mode === 'title' || mode === 'select' || mode === 'ending') GC.Soundscape.update(dt, mode === 'ending' ? 'healed' : 'title', null);
  }

  function render() {
    GC.DialogUI.render();
    ctx.setTransform(C.SCALE, 0, 0, C.SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
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
  async function boot() {
    GC.Art.init();
    GC.spriteSource = await GC.Sheets.preload();
    GC.Tiles.pregen();
    GC.Background.pregenAsync();
    GC.Mobile.init();
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
