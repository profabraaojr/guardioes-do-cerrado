// Guardiões do Cerrado · protótipo da nova direção visual (trecho: margens do Rio Vermelho).
// Cenário híbrido: a foto real (Reserva João Basso) é o plano distante; água, margens,
// vegetação próxima, plataformas e personagens são desenhados em vetor 2D.
// O personagem é um boneco articulado (partes recortadas: cabeça, tronco, braços, pernas)
// provisório: a mesma estrutura receberá as partes desenhadas pelo ilustrador.
(function () {
  'use strict';
  const H = 720;                       // altura lógica fixa; a largura acompanha a tela
  let W = 1280;
  const STEP = 1 / 60;
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const stage = document.getElementById('stage');
  const $ = (id) => document.getElementById(id);

  // ——— Paleta tirada da foto e da terra do Cerrado ———
  const C = {
    out: '#1d1a12', water: '#8b6a4b', waterD: '#6c4f35', waterL: '#b39573',
    earth: '#a8482a', earthD: '#7a2e18', earthL: '#c4643a', grass: '#5e9a36', grassD: '#3e6e22', grassL: '#8cc452',
    rock: '#d7a06a', rockD: '#a8703e', rockL: '#efc994', rockS: '#8a5530',
    wood: '#8a5a32', woodD: '#5e3a1c', woodL: '#b07a46',
    leaf: '#3e6e2a', leafD: '#26461a', leafL: '#6a9a3e', ipe: '#f2c230', ipeD: '#c89412'
  };

  // ——— Nível ———
  const GROUND = 600;
  const LEVEL_W = 5200, LEVEL_W_WALL = 5200;
  const solids = [
    { x: -40, y: GROUND, w: 1390, h: 200, kind: 'ground' },
    { x: 2150, y: GROUND, w: 1210, h: 200, kind: 'ground' },
    { x: 3760, y: GROUND, w: 1480, h: 200, kind: 'ground' },
    { x: 2450, y: 520, w: 180, h: 80, kind: 'rock' },
    { x: 2700, y: 440, w: 200, h: 160, kind: 'rock' },
    { x: 2960, y: 360, w: 170, h: 240, kind: 'rock' },
    { x: 3190, y: 470, w: 150, h: 130, kind: 'rock' },
    { x: -80, y: -400, w: 60, h: 1200, kind: 'wall' },
    { x: LEVEL_W_WALL, y: -400, w: 60, h: 1200, kind: 'wall' }
  ];
  const oneways = [
    { x: 1290, x1: 1700, y: 556, kind: 'pier' },
    { x: 1810, x1: 2190, y: 556, kind: 'pier' },
    { x: 3370, x1: 3750, y: 566, kind: 'log' }
  ];
  const waters = [{ x: 1350, x1: 2150 }, { x: 3360, x1: 3760 }];
  const seedSpots = [[560, 540], [860, 540], [1500, 500], [1755, 430], [2060, 500], [2540, 460], [2800, 380], [3045, 300], [3560, 500], [4250, 540], [4560, 540]];
  const signs = [
    { x: 300, title: 'Rio Vermelho', text: 'O rio deu o primeiro nome ao povoado que viria a ser Rondonópolis. Ele segue para o rio São Lourenço, na bacia que abastece o Pantanal.' },
    { x: 2300, title: 'Paredões de arenito', text: 'Os paredões alaranjados ao fundo são de arenito, rocha que a erosão esculpe em torres e degraus como os da Reserva João Basso.' },
    { x: 3880, title: 'Mata ciliar', text: 'A mata da beira do rio segura a terra das margens. Sem ela, a chuva leva o barro vermelho e a água fica ainda mais turva.' }
  ];
  const END_X = 5000;

  // ——— Física (constantes no espírito do jogo principal, em pixels de 720p) ———
  const PH = {
    piata: { run: 560, jumpH: 300, name: 'Piatã' },
    larinha: { run: 490, jumpH: 215, name: 'Larinha' }
  };
  const G = 4800, FALL = 1.6, MAXFALL = 2100, ACC = 7200, FRIC = 8800, AIR = 4300, AIRF = 1500;
  const COYOTE = 0.1, BUFFER = 0.12, CUT = 0.45, CORNER = 10;

  // ——— Entrada (teclado + toque) ———
  const keys = { left: false, right: false, down: false, jump: false };
  let jumpPressed = false;
  const KM = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', Space: 'jump', KeyK: 'jump', KeyZ: 'jump', ArrowUp: 'jump', KeyW: 'jump' };
  addEventListener('keydown', (e) => { const k = KM[e.code]; if (!k) return; e.preventDefault(); if (k === 'jump' && !keys.jump && !e.repeat) jumpPressed = true; keys[k] = true; });
  addEventListener('keyup', (e) => { const k = KM[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.querySelectorAll('#touch [data-k]').forEach((b) => {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} if (k === 'jump' && !keys.jump) jumpPressed = true; keys[k] = true; b.classList.add('on'); };
    const off = () => { keys[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  });
  if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');

  // ——— Imagens ———
  const photo = new Image(); photo.src = 'img/rio-vermelho-joao-basso-fundo.jpg';

  // ——— Estado ———
  let mode = 'intro', char = 'piata', t = 0;
  let P, cam, seeds, particles, birds, capivara, ended;
  function reset() {
    P = { x: 120, y: GROUND - 140, w: 40, h: 140, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, buffer: 0, cut: false, phase: 0, drop: 0, safe: { x: 120, y: GROUND - 140 }, safeT: 0, dead: 0, land: 0, blink: 2 };
    cam = { x: 0, look: 0 };
    seeds = seedSpots.map(([x, y]) => ({ x, y, got: false, t: Math.random() * 6 }));
    particles = [];
    birds = [0, 1, 2].map((i) => ({ x: 400 + i * 70, y: 120 + i * 18, s: 0.8 + i * 0.1, ph: i, red: i !== 1 }));
    capivara = { x: 4060, t: 0, look: 0 };
    ended = false;
    updateSeeds();
  }

  // ——— Colisão ———
  const overlapX = (a, x0, x1) => a.x + a.w > x0 && a.x < x1;
  function moveX(dx) {
    P.x += dx;
    for (const s of solids) {
      if (P.x + P.w <= s.x || P.x >= s.x + s.w || P.y + P.h <= s.y || P.y >= s.y + s.h) continue;
      // degrau baixo: sobe sozinho (até 14 px) quando está no chão
      if (P.onGround && P.y + P.h - s.y <= 14) { P.y = s.y - P.h; continue; }
      if (dx > 0) P.x = s.x - P.w; else if (dx < 0) P.x = s.x + s.w;
      P.vx = 0;
    }
  }
  function moveY(dy) {
    const prevBottom = P.y + P.h;
    P.y += dy;
    let landed = false;
    for (const s of solids) {
      if (P.x + P.w <= s.x || P.x >= s.x + s.w || P.y + P.h <= s.y || P.y >= s.y + s.h) continue;
      if (dy > 0) { P.y = s.y - P.h; landed = true; P.vy = 0; }
      else if (dy < 0) {
        // tolerância de quina: só a beirada da cabeça raspou? empurra de lado
        const leftOver = P.x + P.w - s.x, rightOver = s.x + s.w - P.x;
        if (leftOver <= CORNER) { P.x = s.x - P.w; continue; }
        if (rightOver <= CORNER) { P.x = s.x + s.w; continue; }
        P.y = s.y + s.h; P.vy = 0;
      }
    }
    if (dy > 0 && P.drop <= 0) for (const o of oneways) {
      if (!overlapX(P, o.x, o.x1)) continue;
      if (prevBottom <= o.y + 0.5 && P.y + P.h >= o.y) { P.y = o.y - P.h; landed = true; P.vy = 0; }
    }
    return landed;
  }
  function standingOn(x) {
    const b = P.y + P.h;
    for (const s of solids) if (x >= s.x && x <= s.x + s.w && Math.abs(s.y - b) < 2) return true;
    for (const o of oneways) if (x >= o.x && x <= o.x1 && Math.abs(o.y - b) < 2) return true;
    return false;
  }

  // ——— Atualização ———
  function update(dt) {
    t += dt;
    for (const b of birds) { b.x += 70 * dt * b.s; if (b.x > LEVEL_W * 0.2 + 1600) b.x = -200; }
    capivara.t += dt;
    for (const s of seeds) s.t += dt;
    particles = particles.filter((p) => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 900) * dt; return p.life > 0; });
    if (mode !== 'play') return;
    const ph = PH[char];
    P.blink -= dt; if (P.blink < -0.12) P.blink = 2 + Math.random() * 3;

    if (P.dead > 0) {
      P.dead -= dt;
      if (P.dead <= 0) { P.x = P.safe.x; P.y = P.safe.y; P.vx = 0; P.vy = 0; }
      return;
    }
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (jumpPressed) P.buffer = BUFFER; else P.buffer -= dt;
    jumpPressed = false;
    P.drop = Math.max(0, P.drop - dt);

    const acc = P.onGround ? ACC : AIR;
    if (dir) { P.vx = approach(P.vx, dir * ph.run, acc * dt); P.face = dir; }
    else P.vx = approach(P.vx, 0, (P.onGround ? FRIC : AIRF) * dt);
    P.vy = Math.min(P.vy + (P.vy < 0 ? G : G * FALL) * dt, MAXFALL);
    P.coyote = P.onGround ? COYOTE : P.coyote - dt;
    if (P.buffer > 0 && P.coyote > 0) {
      const onOneway = oneways.some((o) => overlapX(P, o.x, o.x1) && Math.abs(o.y - (P.y + P.h)) < 2);
      if (keys.down && onOneway) { P.drop = 0.22; P.y += 2; }
      else { P.vy = -Math.sqrt(2 * G * ph.jumpH); P.cut = false; puff(P.x + P.w / 2, P.y + P.h, 6, '#d8c8a8'); }
      P.buffer = 0; P.coyote = 0;
    }
    if (!keys.jump && P.vy < 0 && !P.cut) { P.vy *= CUT; P.cut = true; }
    const was = P.onGround, vyBefore = P.vy;
    moveX(P.vx * dt);
    P.onGround = moveY(P.vy * dt);
    if (P.onGround && !was && vyBefore > 900) { puff(P.x + P.w / 2, P.y + P.h, 8, '#d8c8a8'); P.land = 0.12; }
    P.land = Math.max(0, P.land - dt);
    if (P.onGround && Math.abs(P.vx) > 20) P.phase += Math.abs(P.vx) * dt / 38;
    else if (P.onGround) P.phase = approach(P.phase, Math.round(P.phase / Math.PI) * Math.PI, dt * 6);

    // posição segura (os dois pés apoiados) para voltar depois de cair no rio
    P.safeT -= dt;
    if (P.onGround && P.safeT <= 0 && standingOn(P.x + 4) && standingOn(P.x + P.w - 4)) { P.safe = { x: P.x, y: P.y }; P.safeT = 0.25; }
    // caiu no rio
    if (P.y + P.h > 650) {
      for (const w of waters) if (P.x + P.w / 2 > w.x && P.x + P.w / 2 < w.x1) {
        splash(P.x + P.w / 2, 640); P.dead = 0.8; P.vx = 0; P.vy = 0; P.y = 700;
      }
    }
    // sementes
    for (const s of seeds) if (!s.got && Math.abs(s.x - (P.x + P.w / 2)) < 36 && s.y > P.y - 10 && s.y < P.y + P.h + 10) { s.got = true; sparkle(s.x, s.y); updateSeeds(); }
    // fim do trecho
    if (!ended && P.x > END_X) { ended = true; setTimeout(showEnd, 500); }

    // câmera: zona morta horizontal e avanço na direção do movimento
    const look = Math.abs(P.vx) > 40 ? Math.sign(P.vx) * 150 : P.face * 70;
    cam.look = approach(cam.look, look, dt * 420);
    const want = P.x + P.w / 2 + cam.look, center = cam.x + W / 2, diff = want - center;
    let tx = cam.x; if (Math.abs(diff) > 60) tx = cam.x + diff - Math.sign(diff) * 60;
    cam.x += (tx - cam.x) * Math.min(1, dt * 7);
    cam.x = Math.max(0, Math.min(LEVEL_W - W, cam.x));
  }
  const approach = (v, to, d) => (v < to ? Math.min(to, v + d) : Math.max(to, v - d));
  function puff(x, y, n, col) { for (let i = 0; i < n; i++) particles.push({ x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 120, life: 0.45, max: 0.45, r: 4 + Math.random() * 4, col, g: 200 }); }
  function splash(x, y) { for (let i = 0; i < 26; i++) particles.push({ x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 300, vy: -200 - Math.random() * 420, life: 0.8, max: 0.8, r: 3 + Math.random() * 4, col: '#cbb08c' }); }
  function sparkle(x, y) { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; particles.push({ x, y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, life: 0.5, max: 0.5, r: 3, col: '#ffe08a', g: 0 }); } }
  function updateSeeds() { const n = seeds ? seeds.filter((s) => s.got).length : 0; $('seeds').textContent = n + '/' + seedSpots.length; }

  // ——— Desenho ———
  function render() {
    ctx.save();
    // céu (aparece só se a foto não cobrir)
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#85c8f0'); sky.addColorStop(0.6, '#b0e3f6'); sky.addColorStop(1, '#d8eef0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawPhoto();
    drawBirds();
    ctx.translate(-Math.round(cam.x), 0);
    drawWater();
    drawMidBank();
    for (const o of oneways) o.kind === 'pier' ? drawPier(o) : drawLog(o);
    for (const s of solids) if (s.kind === 'ground') drawGround(s);
    for (const s of solids) if (s.kind === 'rock') drawRock(s);
    for (const s of signs) drawSign(s);
    drawEndPost();
    drawCapivara();
    for (const s of seeds) if (!s.got) drawSeed(s);
    if (P && P.dead <= 0) drawGuardian(ctx, P.x + P.w / 2, P.y + P.h, P.face, char, poseOf(P), 1);
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    drawSignBubble();
    drawForeground();
    ctx.restore();
  }

  // plano distante: a foto, quase parada (a paisagem está longe)
  function drawPhoto() {
    if (!photo.complete || !photo.naturalWidth) return;
    const dh = 640, dw = photo.naturalWidth * dh / photo.naturalHeight;
    const maxShift = Math.max(0, dw - W);
    const x = -Math.min(maxShift, cam.x * (maxShift / Math.max(1, LEVEL_W - W)));
    ctx.drawImage(photo, x, -10, dw, dh);
    // névoa de distância e tom quente para assentar a foto atrás do cenário desenhado
    const haze = ctx.createLinearGradient(0, 260, 0, 640);
    haze.addColorStop(0, 'rgba(214,234,240,0)'); haze.addColorStop(1, 'rgba(214,226,220,0.42)');
    ctx.fillStyle = haze; ctx.fillRect(0, 0, W, 640);
    ctx.fillStyle = 'rgba(255,214,150,0.06)'; ctx.fillRect(0, 0, W, 640);
  }
  function drawBirds() {
    for (const b of birds) {
      const x = b.x - cam.x * 0.15, y = b.y + Math.sin(t * 1.5 + b.ph) * 8;
      if (x < -60 || x > W + 60) continue;
      const f = Math.sin(t * 9 + b.ph * 2);
      ctx.save(); ctx.translate(x, y); ctx.scale(b.s, b.s);
      ctx.fillStyle = b.red ? '#c8302a' : '#2a6ab8';
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-30, -2); ctx.lineTo(-14, 3); ctx.fill(); // cauda
      ctx.fillStyle = b.red ? '#e04a30' : '#3a86d8';
      ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(2, -14 - f * 12, 10, -2); ctx.fill(); // asa
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(12, -1, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  // água barrenta do Rio Vermelho, com reflexos que se movem
  function drawWater() {
    const x0 = cam.x - 20, x1 = cam.x + W + 20;
    const g = ctx.createLinearGradient(0, 548, 0, H);
    g.addColorStop(0, 'rgba(133,117,99,0)'); g.addColorStop(0.1, 'rgba(133,117,99,0.75)'); g.addColorStop(0.3, '#85725c'); g.addColorStop(0.6, C.water); g.addColorStop(1, C.waterD);
    ctx.fillStyle = g; ctx.fillRect(x0, 548, x1 - x0, H - 548);
    ctx.strokeStyle = 'rgba(214,190,150,0.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const y = 590 + (i % 7) * 18, len = 30 + (i * 37 % 50);
      const x = Math.floor(x0 / 160) * 160 + ((i * 113 + t * (14 + i % 5 * 4)) % (x1 - x0 + 200)) - 100;
      ctx.beginPath(); ctx.moveTo(x, y + Math.sin(t * 2 + i) * 1.5); ctx.lineTo(x + len, y + Math.sin(t * 2 + i) * 1.5); ctx.stroke();
    }
  }
  // margem próxima desenhada (parallax intermediário): buritis, ipês e árvores do Cerrado
  const midTrees = (() => { const a = []; let x = 120; let i = 0; while (x < LEVEL_W * 1.2) { a.push({ x, kind: ['cerrado', 'buriti', 'ipe', 'cerrado', 'buriti'][i % 5], s: 0.75 + ((i * 37) % 30) / 100 }); x += 420 + ((i * 53) % 260); i++; } return a; })();
  function drawMidBank() {
    const f = 0.55, off = cam.x * (1 - f);
    for (const tr of midTrees) {
      const x = tr.x + off;
      if (x < cam.x - 300 || x > cam.x + W + 300) continue;
      drawTree(x, 600, tr.s, tr.kind);
    }
  }
  function blob(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function drawTree(x, base, s, kind) {
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
    ctx.globalAlpha = 0.92;
    if (kind === 'buriti') {
      ctx.strokeStyle = '#6e5a3e'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -150, 4, -300); ctx.stroke();
      ctx.strokeStyle = '#8a7450'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-3, -10); ctx.quadraticCurveTo(7, -150, 1, -295); ctx.stroke();
      for (let i = 0; i < 13; i++) {
        const a = -Math.PI + (i / 12) * Math.PI + Math.sin(t * 0.8 + i) * 0.03;
        ctx.save(); ctx.translate(4, -300); ctx.rotate(a);
        ctx.fillStyle = i % 2 ? C.leaf : C.leafL;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(50, -18, 110, 14); ctx.quadraticCurveTo(50, 2, 0, 6); ctx.fill();
        ctx.restore();
      }
      blob(4, -298, 12, '#5e4a30');
    } else {
      const ipe = kind === 'ipe';
      ctx.strokeStyle = '#5e4630'; ctx.lineCap = 'round';
      ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-14, -60, 18, -110, -6, -170); ctx.stroke();
      ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-2, -120); ctx.quadraticCurveTo(40, -150, 58, -190); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, -150); ctx.quadraticCurveTo(-40, -170, -60, -200); ctx.stroke();
      const d = ipe ? C.ipeD : C.leafD, m = ipe ? C.ipe : C.leaf, l = ipe ? '#fde27a' : C.leafL;
      for (const [bx, by, r] of [[-60, -205, 46], [0, -235, 58], [60, -200, 48], [-26, -185, 40], [32, -175, 40]]) blob(bx, by + 6, r, d);
      for (const [bx, by, r] of [[-60, -210, 40], [0, -242, 50], [60, -205, 40], [-26, -190, 34], [32, -182, 34]]) blob(bx, by, r, m);
      for (const [bx, by, r] of [[-70, -224, 18], [-12, -262, 24], [48, -222, 18]]) blob(bx, by, r, l);
    }
    ctx.restore();
  }
  // chão de terra vermelha com grama
  function drawGround(s) {
    const x0 = Math.max(s.x, cam.x - 40), x1 = Math.min(s.x + s.w, cam.x + W + 40);
    if (x1 <= x0) return;
    const g = ctx.createLinearGradient(0, s.y, 0, s.y + 120);
    g.addColorStop(0, C.earthL); g.addColorStop(0.3, C.earth); g.addColorStop(1, C.earthD);
    ctx.fillStyle = g; ctx.fillRect(x0, s.y + 6, x1 - x0, H - s.y);
    // camadas e pedrinhas do latossolo
    for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) {
      const h = hash(x);
      ctx.fillStyle = 'rgba(90,30,14,0.35)'; ctx.fillRect(x + h * 20, s.y + 40 + h * 50, 18 + h * 16, 4);
      ctx.fillStyle = 'rgba(230,150,100,0.35)'; ctx.beginPath(); ctx.arc(x + 30 * h + 8, s.y + 80 + 30 * hash(x + 7), 3 + 3 * h, 0, Math.PI * 2); ctx.fill();
    }
    // bordas laterais (barranco)
    for (const ex of [s.x, s.x + s.w]) {
      if (ex < x0 - 1 || ex > x1 + 1) continue;
      ctx.fillStyle = C.earthD; ctx.fillRect(ex === s.x ? ex : ex - 10, s.y + 6, 10, H - s.y);
    }
    // grama
    ctx.fillStyle = C.grassD; ctx.fillRect(x0, s.y - 2, x1 - x0, 16);
    ctx.fillStyle = C.grass; ctx.beginPath(); ctx.moveTo(x0, s.y + 10);
    for (let x = Math.floor(x0 / 14) * 14; x <= x1 + 14; x += 14) ctx.lineTo(Math.min(x1, Math.max(x0, x)), s.y + 4 + (hash(x) * 8 - 4));
    ctx.lineTo(x1, s.y + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.grassL; ctx.lineWidth = 2;
    for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
      const h = hash(x * 3), sway = Math.sin(t * 2 + x * 0.05) * 2;
      ctx.beginPath(); ctx.moveTo(x, s.y + 4); ctx.quadraticCurveTo(x + 2, s.y - 6, x + 4 + sway, s.y - 10 - h * 10); ctx.stroke();
    }
  }
  // formações de arenito em camadas
  function drawRock(s) {
    if (s.x > cam.x + W + 20 || s.x + s.w < cam.x - 20) return;
    const r = 18;
    ctx.save();
    rrect(s.x, s.y, s.w, s.h + 10, r); ctx.fillStyle = C.rockD; ctx.fill();
    rrect(s.x + 4, s.y, s.w - 12, s.h + 6, r); ctx.fillStyle = C.rock; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = C.rockS; ctx.lineWidth = 3; ctx.globalAlpha = 0.45;
    for (let y = s.y + 24; y < s.y + s.h; y += 22) { ctx.beginPath(); ctx.moveTo(s.x, y + hash(y) * 4); ctx.bezierCurveTo(s.x + s.w * 0.3, y - 4, s.x + s.w * 0.6, y + 5, s.x + s.w, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.rockL; ctx.fillRect(s.x + 10, s.y + 6, s.w * 0.45, 6);
    ctx.restore();
    ctx.strokeStyle = C.out; ctx.lineWidth = 3; rrect(s.x, s.y, s.w, s.h + 10, r); ctx.stroke();
    // tufos de capim no topo
    ctx.strokeStyle = C.grass; ctx.lineWidth = 2.5;
    for (let x = s.x + 16; x < s.x + s.w - 10; x += 26) { ctx.beginPath(); ctx.moveTo(x, s.y + 2); ctx.lineTo(x - 4, s.y - 10); ctx.moveTo(x + 2, s.y + 2); ctx.lineTo(x + 6, s.y - 12); ctx.stroke(); }
  }
  function drawPier(o) {
    if (o.x > cam.x + W || o.x1 < cam.x) return;
    for (let x = o.x + 20; x < o.x1; x += 110) { ctx.fillStyle = C.woodD; ctx.fillRect(x, o.y, 14, H - o.y); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, 640, 14, 6); }
    for (let x = o.x; x < o.x1; x += 34) {
      const w = Math.min(32, o.x1 - x);
      ctx.fillStyle = hash(x) > 0.5 ? C.wood : C.woodL; ctx.fillRect(x, o.y, w, 14);
      ctx.fillStyle = C.woodD; ctx.fillRect(x, o.y + 11, w, 3);
      ctx.strokeStyle = C.out; ctx.lineWidth = 2; ctx.strokeRect(x + 0.5, o.y + 0.5, w - 1, 13);
    }
  }
  function drawLog(o) {
    if (o.x > cam.x + W || o.x1 < cam.x) return;
    const y = o.y, h = 26;
    rrect(o.x - 10, y, o.x1 - o.x + 20, h, 13); ctx.fillStyle = C.woodD; ctx.fill();
    rrect(o.x - 10, y, o.x1 - o.x + 20, h - 8, 11); ctx.fillStyle = C.wood; ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,10,0.5)'; ctx.lineWidth = 2;
    for (let x = o.x; x < o.x1; x += 40) { ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + 26, y + 8); ctx.stroke(); }
    ctx.fillStyle = 'rgba(110,160,60,0.8)'; for (let x = o.x + 30; x < o.x1; x += 90) { ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = C.out; ctx.lineWidth = 3; rrect(o.x - 10, y, o.x1 - o.x + 20, h, 13); ctx.stroke();
    ctx.fillStyle = '#c89a64'; ctx.beginPath(); ctx.ellipse(o.x1 + 10, y + h / 2, 7, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  function drawSign(s) {
    if (s.x < cam.x - 100 || s.x > cam.x + W + 100) return;
    ctx.fillStyle = C.woodD; ctx.fillRect(s.x - 4, GROUND - 70, 8, 70);
    rrect(s.x - 46, GROUND - 104, 92, 44, 6); ctx.fillStyle = C.woodL; ctx.fill(); ctx.strokeStyle = C.out; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#3a2410'; ctx.font = '700 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('i', s.x, GROUND - 77);
    ctx.font = '600 11px "Atkinson Hyperlegible", sans-serif'; ctx.fillText(s.title.length > 14 ? s.title.slice(0, 13) + '…' : s.title, s.x, GROUND - 63 - 2);
    ctx.textAlign = 'left';
  }
  function drawSignBubble() {
    if (!P || mode !== 'play') return;
    const s = signs.find((s) => Math.abs(s.x - (P.x + P.w / 2)) < 90 && P.y + P.h > GROUND - 10);
    if (!s) return;
    const w = 380, x = Math.max(cam.x + 16, Math.min(cam.x + W - w - 16, s.x - w / 2)), y = 330;
    ctx.font = '400 16px "Atkinson Hyperlegible", sans-serif';
    const lines = wrap(s.text, w - 32);
    const h = 54 + lines.length * 22;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 16;
    rrect(x, y - h, w, h, 12); ctx.fillStyle = '#f6efe2'; ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2; rrect(x, y - h, w, h, 12); ctx.stroke();
    ctx.fillStyle = '#a8482a'; ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.fillText(s.title, x + 16, y - h + 30);
    ctx.fillStyle = '#2a261a'; ctx.font = '400 16px "Atkinson Hyperlegible", sans-serif';
    lines.forEach((l, i) => ctx.fillText(l, x + 16, y - h + 54 + i * 22));
  }
  function wrap(text, maxW) { const out = []; let line = ''; for (const w of text.split(' ')) { const tst = line ? line + ' ' + w : w; if (ctx.measureText(tst).width > maxW && line) { out.push(line); line = w; } else line = tst; } if (line) out.push(line); return out; }
  function drawEndPost() {
    const x = END_X + 60; if (x < cam.x - 100 || x > cam.x + W + 100) return;
    ctx.fillStyle = C.woodD; ctx.fillRect(x - 5, GROUND - 150, 10, 150);
    ctx.fillStyle = C.ipe; ctx.beginPath(); ctx.moveTo(x + 5, GROUND - 148); ctx.lineTo(x + 70 + Math.sin(t * 4) * 4, GROUND - 130); ctx.lineTo(x + 5, GROUND - 110); ctx.fill();
    ctx.strokeStyle = C.out; ctx.lineWidth = 2.5; ctx.stroke();
  }
  function drawSeed(s) {
    const x = s.x, y = s.y + Math.sin(s.t * 3) * 5;
    if (x < cam.x - 40 || x > cam.x + W + 40) return;
    const gl = ctx.createRadialGradient(x, y, 2, x, y, 26); gl.addColorStop(0, 'rgba(255,230,140,0.55)'); gl.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a5c1e'; ctx.beginPath(); ctx.ellipse(x, y + 2, 9, 11, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8964a'; ctx.beginPath(); ctx.ellipse(x - 3, y - 1, 3, 5, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.out; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 2, 9, 11, 0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = C.grassL; ctx.beginPath(); ctx.moveTo(x + 2, y - 8); ctx.quadraticCurveTo(x + 14, y - 22, x + 18, y - 12); ctx.quadraticCurveTo(x + 10, y - 10, x + 2, y - 8); ctx.fill(); ctx.stroke();
  }
  // capivara pastando na margem
  function drawCapivara() {
    const c = capivara, x = c.x; if (x < cam.x - 150 || x > cam.x + W + 150) return;
    const graze = Math.sin(c.t * 0.9) > 0.2, hd = graze ? 12 : 0;
    ctx.save(); ctx.translate(x, GROUND); ctx.lineWidth = 3; ctx.strokeStyle = C.out; ctx.lineJoin = 'round';
    // pernas curtas
    ctx.fillStyle = '#6a4628'; for (const lx of [-36, -20, 20, 34]) { rrect(lx, -24, 13, 24, 5); ctx.fill(); ctx.stroke(); }
    // corpo em barril
    ctx.fillStyle = '#8e6440'; ctx.beginPath(); ctx.ellipse(-2, -46, 54, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(190,150,100,0.45)'; ctx.beginPath(); ctx.ellipse(-12, -60, 34, 10, -0.08, 0, Math.PI * 2); ctx.fill();
    // cabeça grande e retangular, focinho rombudo
    ctx.save(); ctx.translate(46, -58 + hd); ctx.rotate(graze ? 0.35 : 0.05);
    ctx.fillStyle = '#8e6440'; rrect(-8, -18, 50, 34, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5e3e22'; ctx.beginPath(); ctx.ellipse(2, -18, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();   // orelha
    ctx.fillStyle = '#1d1a12'; ctx.beginPath(); ctx.arc(18, -6, 3, 0, Math.PI * 2); ctx.fill();                      // olho
    ctx.fillStyle = '#3a2614'; ctx.beginPath(); ctx.ellipse(38, -2, 3, 2.2, 0, 0, Math.PI * 2); ctx.fill();          // narina
    ctx.restore();
    ctx.restore();
  }
  function drawForeground() {
    const f = 1.25, off = -cam.x * (f - 1);
    for (let i = 0; i < 40; i++) {
      const x = i * 340 + 90 + off; if (x < cam.x - 120 || x > cam.x + W + 120) continue;
      ctx.fillStyle = 'rgba(30,54,20,0.9)';
      for (let k = 0; k < 7; k++) { const a = -1.3 + k * 0.42 + Math.sin(t * 1.6 + i + k) * 0.05; ctx.beginPath(); ctx.moveTo(x, H + 10); ctx.quadraticCurveTo(x + Math.cos(a) * 30, H - 50, x + Math.cos(a) * 70, H - 70 - (k % 3) * 18); ctx.lineTo(x + 8, H + 10); ctx.fill(); }
    }
  }
  const hash = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ——— Boneco articulado provisório ———
  // Estrutura de recorte para o ilustrador: cabeça, tronco, braço e antebraço, coxa e
  // canela, pé, cabelo e acessórios, cada parte com seu ponto de articulação.
  const LOOK = {
    piata: { skin: '#a86a42', skinD: '#82502e', shirt: '#efe9da', shirtD: '#cfc6b0', pants: '#4a5530', shoes: '#6a4428', hair: '#191420', strap: '#7a4a2a', pack: '#7a4a2a' },
    larinha: { skin: '#c88a62', skinD: '#a06a48', shirt: '#e0508a', shirtD: '#b83a6e', tee: '#f4f0e8', pants: '#2a3550', shoes: '#e8f0f0', hair: '#4a2a1a', hairL: '#7a4a2e', strap: '#24304e', pack: '#24304e' }
  };
  function poseOf(p) {
    const run = Math.min(1, Math.abs(p.vx) / PH[char].run);
    if (!p.onGround) return { kind: p.vy < 0 ? 'jump' : 'fall', run, blink: p.blink < 0 };
    if (run > 0.05) return { kind: 'walk', run, ph: p.phase, blink: p.blink < 0 };
    return { kind: 'idle', run: 0, blink: p.blink < 0, land: p.land };
  }
  function limb(c, x0, y0, a, len, w, col) {
    const x1 = x0 + Math.sin(a) * len, y1 = y0 + Math.cos(a) * len;
    c.lineCap = 'round';
    c.strokeStyle = C.out; c.lineWidth = w + 5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    return [x1, y1];
  }
  function drawGuardian(c, fx, fy, face, who, pose, scale) {
    const L = LOOK[who];
    c.save(); c.translate(fx, fy); c.scale(face * scale, scale);
    let tA = 0.05, tB = -0.05, kA = 0.06, kB = 0.06, aA = -0.15, aB = 0.2, eA = 0.3, eB = 0.3, bob = Math.sin(t * 2.2) * 1.5, lean = 0;
    if (pose.kind === 'walk') {
      const s = Math.sin(pose.ph), q = pose.run;
      tA = 0.62 * s * q; tB = -0.62 * s * q;
      kA = 0.1 + 0.9 * Math.max(0, -Math.cos(pose.ph)) * q; kB = 0.1 + 0.9 * Math.max(0, Math.cos(pose.ph)) * q;
      aA = -0.7 * s * q; aB = 0.7 * s * q; eA = 0.4 + 0.5 * q; eB = 0.4 + 0.5 * q;
      bob = -Math.abs(Math.cos(pose.ph)) * 5 * q; lean = 0.12 * q;
    } else if (pose.kind === 'jump') { tA = 0.75; tB = -0.15; kA = 1.3; kB = 0.5; aA = -2.4; aB = 0.9; eA = 0.5; eB = 0.6; bob = 0; lean = 0.08; }
    else if (pose.kind === 'fall') { tA = 0.3; tB = -0.35; kA = 0.4; kB = 0.6; aA = -1.9; aB = 1.4; eA = 0.3; eB = 0.2; bob = 0; }
    if (pose.land) bob += 6;
    const hipY = -64 + bob;
    const leg = (thigh, knee, col, front) => {
      const [kx, ky] = limb(c, 0, hipY, thigh, 32, 15, L.pants);
      const [ax, ay] = limb(c, kx, ky, thigh - knee, 30, 13, front ? L.pants : L.pants);
      // pé
      c.save(); c.translate(ax, ay); c.rotate(-(thigh - knee) * 0.3);
      rrectC(c, -6, -2, 22, 10, 5); c.fillStyle = L.shoes; c.fill(); c.strokeStyle = C.out; c.lineWidth = 2.5; c.stroke();
      c.restore();
    };
    const sx = 4 + lean * 30, sy = hipY - 44;
    const arm = (a, e, col) => { const [ex, ey] = limb(c, sx, sy + 6, a, 24, 11, col); const [hx, hy] = limb(c, ex, ey, a + e, 22, 10, L.skin); c.fillStyle = L.skin; c.strokeStyle = C.out; c.lineWidth = 2.5; c.beginPath(); c.arc(hx, hy, 6, 0, Math.PI * 2); c.fill(); c.stroke(); };
    // atrás: braço e perna de trás, mochila
    arm(aB, eB, who === 'larinha' ? L.shirtD : L.shirtD);
    leg(tB, kB, L.pants, false);
    c.save(); c.translate(-14 + lean * 20, hipY - 30); c.rotate(-lean);
    rrectC(c, -12, -18, 18, 34, 6); c.fillStyle = L.pack; c.fill(); c.strokeStyle = C.out; c.lineWidth = 3; c.stroke();
    if (who === 'larinha') { c.fillStyle = '#5ae0f0'; c.fillRect(-8, -6, 6, 4); }
    c.restore();
    // tronco
    c.save(); c.translate(0, hipY); c.rotate(lean);
    c.beginPath(); c.moveTo(-14, 2); c.lineTo(-15, -36); c.quadraticCurveTo(-14, -46, -2, -47); c.lineTo(6, -47); c.quadraticCurveTo(17, -46, 17, -36); c.lineTo(15, 2); c.closePath();
    c.fillStyle = L.shirt; c.fill();
    if (who === 'larinha') { c.save(); c.clip(); c.fillStyle = L.tee; c.fillRect(1, -48, 9, 52); c.restore(); }
    else { c.save(); c.clip(); c.fillStyle = L.shirtD; c.fillRect(-15, -10, 32, 12); c.restore(); }
    c.strokeStyle = C.out; c.lineWidth = 3; c.stroke();
    c.strokeStyle = L.strap; c.lineWidth = 5; c.beginPath(); c.moveTo(-10, -44); c.lineTo(-6, 0); c.stroke();
    if (who === 'piata') { c.strokeStyle = '#5a3c22'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-2, -46); c.lineTo(4, -34); c.lineTo(9, -46); c.stroke(); c.fillStyle = '#4aa03a'; c.beginPath(); c.ellipse(4, -31, 3, 4.5, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
    leg(tA, kA, L.pants, true);
    // cabeça
    const hx = 3 + lean * 46, hy = hipY - 70;
    c.fillStyle = L.skinD; c.fillRect(hx - 5, hipY - 52, 10, 8);
    head(c, hx, hy, who, L, pose);
    // braço da frente
    arm(aA, eA, L.shirt);
    c.restore();
  }
  function head(c, x, y, who, L, pose) {
    c.save(); c.translate(x, y);
    if (who === 'larinha') {
      // volume de cachos atrás e rabo de cavalo
      c.fillStyle = L.hair; c.strokeStyle = C.out; c.lineWidth = 3;
      for (const [bx, by, r] of [[-30, -26, 13], [-36, -14, 11], [-26, -36, 11]]) { c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill(); c.stroke(); }
      for (const [bx, by, r] of [[-14, -18, 17], [-17, 2, 14], [-6, -24, 15], [8, -24, 13], [-15, 14, 10]]) { c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill(); c.stroke(); }
    } else {
      c.fillStyle = L.hair; c.strokeStyle = C.out; c.lineWidth = 3;
      c.beginPath();
      const pts = [[-20, 4], [-26, -6], [-34, -12], [-24, -18], [-30, -30], [-16, -28], [-14, -42], [-4, -32], [4, -44], [8, -30], [18, -38], [17, -24], [26, -22], [20, -10]];
      c.moveTo(pts[0][0], pts[0][1]); for (const [px, py] of pts.slice(1)) c.lineTo(px, py); c.closePath(); c.fill(); c.stroke();
    }
    // rosto
    c.fillStyle = L.skin; c.strokeStyle = C.out; c.lineWidth = 3;
    c.beginPath(); c.ellipse(2, -2, 18, 21, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = L.skinD; c.beginPath(); c.ellipse(-13, 1, 4.5, 6, 0, 0, Math.PI * 2); c.fill(); c.stroke(); // orelha
    // olhos (3/4 para a frente)
    if (pose.blink) { c.strokeStyle = C.out; c.lineWidth = 2.2; c.beginPath(); c.moveTo(3, -3); c.lineTo(9, -3); c.moveTo(13, -3); c.lineTo(18, -3); c.stroke(); }
    else for (const [ex, rx] of [[6, 3], [15.5, 2.6]]) { c.fillStyle = '#1d140c'; c.beginPath(); c.ellipse(ex, -3, rx, 4, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 0.8, -4.5, 1.1, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = who === 'larinha' ? '#3a2014' : '#1c1820'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(2.5, -10); c.quadraticCurveTo(6, -12, 9.5, -10.5); c.moveTo(13, -10.5); c.quadraticCurveTo(16, -12, 18.5, -10); c.stroke();
    c.strokeStyle = L.skinD; c.lineWidth = 2; c.beginPath(); c.moveTo(19.5, 0); c.quadraticCurveTo(21.5, 4, 18.5, 5); c.stroke(); // nariz
    c.strokeStyle = '#6a2a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(9, 9.5); c.quadraticCurveTo(13, 12, 17, 9); c.stroke(); // boca
    if (who === 'larinha') {
      c.fillStyle = L.skinD; for (const [fx2, fy2] of [[4, 4], [7, 5], [16, 4]]) { c.beginPath(); c.arc(fx2, fy2, 0.9, 0, Math.PI * 2); c.fill(); }
      // franja de cachos e óculos azuis na testa
      c.fillStyle = L.hair; c.strokeStyle = C.out; c.lineWidth = 2.5;
      for (const [bx, by, r] of [[-8, -17, 8], [1, -20, 8], [10, -19, 7], [17, -14, 6]]) { c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill(); c.stroke(); }
      c.fillStyle = '#3a3a48'; c.fillRect(-14, -23, 32, 5);
      for (const gx of [4, 15]) { c.fillStyle = '#c8ccd8'; c.beginPath(); c.arc(gx, -21, 6, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = '#4ab8e8'; c.beginPath(); c.arc(gx, -21, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.fillRect(gx - 2, -24, 2, 2); }
    } else {
      // franja e faixa vermelha e laranja com grafismo; pontas balançando
      c.fillStyle = L.hair; c.beginPath(); c.moveTo(-15, -12); c.quadraticCurveTo(0, -24, 19, -12); c.lineTo(17, -9); c.lineTo(10, -13); c.lineTo(6, -9); c.lineTo(0, -13); c.lineTo(-6, -9); c.lineTo(-12, -11); c.closePath(); c.fill();
      c.fillStyle = '#c8302a'; c.strokeStyle = C.out; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-17, -17); c.quadraticCurveTo(2, -25, 20, -18); c.lineTo(20, -12); c.quadraticCurveTo(2, -19, -17, -11); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ee8a3a'; c.beginPath(); c.moveTo(-16, -16); c.quadraticCurveTo(2, -23.5, 19, -17); c.lineTo(19, -15.5); c.quadraticCurveTo(2, -22, -16, -14.5); c.fill();
      c.fillStyle = '#f2c230'; for (const bx of [-10, -2, 6, 14]) c.fillRect(bx, -17.5 + Math.abs(bx - 2) * 0.05, 3, 3);
      const sw = Math.sin(t * 6) * 3;
      c.fillStyle = '#c8302a'; c.beginPath(); c.moveTo(-17, -15); c.quadraticCurveTo(-28, -14 + sw, -36, -6 + sw); c.lineTo(-32, -2 + sw); c.quadraticCurveTo(-24, -9, -16, -11); c.fill(); c.stroke();
    }
    c.restore();
  }
  function rrectC(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  // ——— Tela e laço ———
  let scale = 1, dpr = 1;
  function resize() {
    const app = $('app'), cs = getComputedStyle(app);
    const aw = app.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = app.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    W = Math.max(1100, Math.min(1600, Math.round(aw / ah * H)));
    scale = Math.min(aw / W, ah / H);
    dpr = Math.min(3, window.devicePixelRatio || 1);
    stage.style.width = Math.round(W * scale) + 'px'; stage.style.height = Math.round(H * scale) + 'px';
    cv.width = Math.round(W * scale * dpr); cv.height = Math.round(H * scale * dpr);
  }
  addEventListener('resize', resize);
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    render();
    requestAnimationFrame(frame);
  }

  // ——— Fichas ———
  function pick(c) {
    char = c;
    document.querySelectorAll('.char-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.char === c ? 'true' : 'false'));
  }
  function drawPreviews() {
    document.querySelectorAll('.char-btn canvas').forEach((cnv) => {
      const c = cnv.getContext('2d'); c.clearRect(0, 0, cnv.width, cnv.height);
      c.save(); c.scale(0.68, 0.68); drawGuardian(c, 82, 184, 1, cnv.closest('.char-btn').dataset.char, { kind: 'idle', blink: false }, 1); c.restore();
    });
  }
  function show(id) { ['intro', 'end', 'credits'].forEach((k) => ($(k).hidden = k !== id)); }
  function start() { reset(); mode = 'play'; show(null); $('hud').hidden = false; $('badge').hidden = false; $('place').textContent = 'Margens do Rio Vermelho · ' + PH[char].name; }
  function showEnd() {
    mode = 'end';
    const n = seeds.filter((s) => s.got).length;
    $('endText').textContent = 'Sementes nativas coletadas: ' + n + ' de ' + seedSpots.length + '. ' + (n === seedSpots.length ? 'Todas! Elas vão virar mudas na mata ciliar.' : 'Algumas ficaram para trás, no píer e nos paredões.');
    show('end');
  }
  let backTo = 'intro';
  $('pickPiata').addEventListener('click', () => pick('piata'));
  $('pickLarinha').addEventListener('click', () => pick('larinha'));
  $('btnStart').addEventListener('click', start);
  $('btnAgain').addEventListener('click', () => { show('intro'); mode = 'intro'; });
  $('btnRestart').addEventListener('click', () => { reset(); mode = 'play'; show(null); });
  const openCredits = (from) => { backTo = from; if (mode === 'play') mode = 'paused'; show('credits'); };
  $('btnCredits').addEventListener('click', () => openCredits('intro'));
  $('btnCredits2').addEventListener('click', () => openCredits('end'));
  $('btnCreditsHud').addEventListener('click', () => openCredits('play'));
  $('btnCloseCredits').addEventListener('click', () => { if (backTo === 'play') { mode = 'play'; show(null); } else show(backTo); });
  addEventListener('keydown', (e) => { if (e.code === 'Enter' && mode === 'intro' && !$('intro').hidden) start(); });

  // depuração e testes automatizados
  window.PROTO = { get P() { return P; }, get mode() { return mode; }, get cam() { return cam; }, get seeds() { return seeds; }, start: (c) => { pick(c || 'piata'); start(); }, keys };

  reset();
  resize();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(drawPreviews);
  drawPreviews();
  requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); });
})();
