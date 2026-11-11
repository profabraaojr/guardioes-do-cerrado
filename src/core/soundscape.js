// Paisagem sonora do Cerrado (Web Audio, tudo sintetizado, sem arquivos externos).
//
// Camadas contínuas: vento no capim, cigarras, grilos, água (rio/cachoeira) e
// ar de caverna, com volumes que mudam por zona e pela quantidade de água na tela.
// Eventos: cantos de aves do Cerrado e vozes dos animais visíveis, com panorâmica
// estéreo pela posição na tela e volume pela distância. Na caverna, os sons ganham eco.
GC.Soundscape = (function () {
  let ctx = null, bus = null, reverb = null, revSend = null, layers = {}, noise = null;
  let level = 0.75;           // volume geral da natureza (mixer)
  const GAIN = 1.7;           // compensa o volume baixo das camadas sintetizadas
  let profileName = null, eventT = 1, waterT = 0, waterAmt = 0, voiceT = {};

  // ——— perfis por ambiente ———
  const PROFILES = {
    rio:     { wind: 0.25, cicada: 0.15, cricket: 0.25, water: 0.55, cave: 0, birds: ['bemtevi', 'sabia', 'juriti', 'arara', 'sabia'], rate: 2.2, frogs: 0.4 },
    cerrado: { wind: 0.5, cicada: 0.65, cricket: 0.1, water: 0.1, cave: 0, birds: ['seriema', 'bemtevi', 'picapau', 'tucano', 'arara', 'juriti', 'bemtevi'], rate: 2.4, frogs: 0 },
    carima:  { wind: 0.2, cicada: 0.3, cricket: 0.2, water: 0.9, cave: 0, birds: ['sabia', 'arara', 'bemtevi', 'tucano'], rate: 2.8, frogs: 0.8 },
    pedra:   { wind: 0.65, cicada: 0.2, cricket: 0.55, water: 0.05, cave: 0, birds: ['curiango', 'juriti', 'seriema', 'picapau'], rate: 3.2, frogs: 0 },
    caverna: { wind: 0.05, cicada: 0, cricket: 0.1, water: 0.08, cave: 0.7, birds: ['gota', 'gota', 'morcego', 'gota'], rate: 1.6, frogs: 0 },
    boss:    { wind: 0.7, cicada: 0, cricket: 0, water: 0, cave: 0, birds: ['brasa'], rate: 1.2, frogs: 0, hum: 0.5 },
    healed:  { wind: 0.25, cicada: 0.35, cricket: 0.1, water: 0.1, cave: 0, birds: ['bemtevi', 'sabia', 'arara', 'tucano', 'sabia', 'juriti', 'picapau'], rate: 0.9, frogs: 0 },
    title:   { wind: 0.3, cicada: 0.2, cricket: 0.2, water: 0.35, cave: 0, birds: ['bemtevi', 'sabia', 'juriti'], rate: 3, frogs: 0.2 }
  };

  function makeNoise() {
    const b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = last * 0.97 + w * 0.03; d[i] = w * 0.6 + last * 4; }
    return b;
  }
  function makeImpulse(sec) {
    const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  }
  function loopNoise(filterType, freq, q, gainVal) {
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.loopStart = Math.random();
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(bus); s.start(0, Math.random() * 2);
    return { s, f, g, base: gainVal };
  }
  function lfo(target, rate, depth) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(target); o.start();
  }

  function init(audioCtx, master) {
    if (ctx) return;
    ctx = audioCtx;
    noise = makeNoise();
    bus = ctx.createGain(); bus.gain.value = level * GAIN; bus.connect(master);
    reverb = ctx.createConvolver(); reverb.buffer = makeImpulse(2.4);
    revSend = ctx.createGain(); revSend.gain.value = 0; reverb.connect(revSend); revSend.connect(bus);
    // vento: ruído grave que respira devagar
    layers.wind = loopNoise('bandpass', 420, 0.6, 0.12); lfo(layers.wind.f.frequency, 0.07, 160);
    // cigarras: chiado agudo com pulsação rápida e ondas lentas de intensidade
    layers.cicada = loopNoise('bandpass', 5600, 6, 0.05);
    const am = ctx.createGain(); am.gain.value = 0.6; layers.cicada.g.disconnect(); layers.cicada.g.connect(am); am.connect(bus); lfo(am.gain, 42, 0.4); lfo(layers.cicada.f.frequency, 0.11, 900);
    // água corrente
    layers.water = loopNoise('lowpass', 1400, 0.4, 0.16);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180; layers.water.f.disconnect(); layers.water.f.connect(hp); hp.connect(layers.water.g); lfo(layers.water.f.frequency, 0.3, 300);
    // ar de caverna
    layers.cave = loopNoise('lowpass', 260, 0.7, 0.14);
    // zumbido de máquinas distantes (clareira)
    const hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 52; const hf = ctx.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 140; const hg = ctx.createGain(); hg.gain.value = 0;
    hum.connect(hf); hf.connect(hg); hg.connect(bus); hum.start(); layers.hum = { g: hg, base: 0.05 };
  }

  // ——— síntese de cantos e vozes ———
  function voice(t, pan, vol, wet) {
    const g = ctx.createGain(); g.gain.value = vol;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) { p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(bus); if (wet) p.connect(reverb); }
    else { g.connect(bus); if (wet) g.connect(reverb); }
    return g;
  }
  function tone(out, { type = 'sine', f, f2, t = 0, dur = 0.1, vol = 0.3, attack = 0.005, vib = 0, vibRate = 30 }) {
    const now = ctx.currentTime + t;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, now);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), now + dur);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vibRate; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(now); l.stop(now + dur + 0.05); }
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + attack); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(out); o.start(now); o.stop(now + dur + 0.05);
  }
  function hiss(out, { t = 0, dur = 0.1, vol = 0.3, freq = 1500, q = 1, type = 'bandpass', f2 }) {
    const now = ctx.currentTime + t;
    const s = ctx.createBufferSource(); s.buffer = noise;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, now); fl.Q.value = q; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, now + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(now, Math.random() * 2); s.stop(now + dur + 0.05);
  }

  const CALLS = {
    // aves
    bemtevi: (o) => { tone(o, { type: 'triangle', f: 2500, f2: 2300, dur: 0.12, vol: 0.22 }); tone(o, { type: 'triangle', f: 3100, f2: 2900, t: 0.16, dur: 0.1, vol: 0.2 }); tone(o, { type: 'triangle', f: 2700, f2: 1900, t: 0.3, dur: 0.28, vol: 0.24, vib: 40, vibRate: 25 }); },
    sabia: (o) => { let t = 0; const n = 4 + ((Math.random() * 4) | 0); for (let i = 0; i < n; i++) { const f = 1700 + Math.random() * 1500, d = 0.07 + Math.random() * 0.1; tone(o, { f, f2: f * (0.85 + Math.random() * 0.35), t, dur: d, vol: 0.18, vib: 30 }); t += d + 0.03 + Math.random() * 0.05; } },
    juriti: (o) => { tone(o, { f: 560, f2: 520, dur: 0.38, vol: 0.2, attack: 0.08 }); tone(o, { f: 500, f2: 440, t: 0.5, dur: 0.6, vol: 0.18, attack: 0.1 }); },
    picapau: (o) => { for (let i = 0; i < 14; i++) hiss(o, { t: i * 0.042, dur: 0.012, vol: 0.28 - i * 0.012, freq: 1700, q: 3 }); },
    seriema: (o) => { for (let i = 0; i < 7; i++) { const f = 1300 - i * 60; tone(o, { type: 'square', f, f2: f * 0.72, t: i * 0.11, dur: 0.09, vol: 0.06 + (i < 3 ? i * 0.02 : 0.04) }); } },
    arara: (o) => { for (let k = 0; k < 2; k++) { tone(o, { type: 'sawtooth', f: 950, f2: 700, t: k * 0.32, dur: 0.24, vol: 0.09, vib: 120, vibRate: 60 }); hiss(o, { t: k * 0.32, dur: 0.22, vol: 0.12, freq: 2400, q: 2 }); } },
    tucano: (o) => { for (let k = 0; k < 3; k++) { tone(o, { type: 'sawtooth', f: 340, f2: 260, t: k * 0.28, dur: 0.2, vol: 0.1, vib: 80, vibRate: 45 }); } },
    curiango: (o) => { tone(o, { f: 1150, f2: 1350, dur: 0.12, vol: 0.18 }); tone(o, { f: 1400, f2: 1900, t: 0.16, dur: 0.18, vol: 0.2 }); tone(o, { f: 1950, f2: 1200, t: 0.4, dur: 0.55, vol: 0.2, vib: 15 }); },
    morcego: (o) => { for (let i = 0; i < 4; i++) tone(o, { f: 6500, f2: 4800, t: i * 0.07, dur: 0.03, vol: 0.06 }); },
    gota: (o) => { const f = 1800 + Math.random() * 1400; tone(o, { f, f2: f * 0.55, dur: 0.09, vol: 0.2 }); },
    brasa: (o) => { for (let i = 0; i < 6; i++) hiss(o, { t: i * (0.05 + Math.random() * 0.12), dur: 0.02, vol: 0.18, freq: 3000 + Math.random() * 2000, q: 1 }); },
    grilo: (o) => { for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) tone(o, { f: 4600, t: r * 0.32 + i * 0.045, dur: 0.025, vol: 0.06 }); },
    sapo: (o) => { for (let i = 0; i < 4; i++) tone(o, { type: 'square', f: 150, t: i * 0.16, dur: 0.1, vol: 0.06, vib: 30, vibRate: 70 }); },
    perereca: (o) => { for (let i = 0; i < 5; i++) hiss(o, { t: i * 0.08, dur: 0.03, vol: 0.12, freq: 2200, q: 8 }); },
    // vozes dos animais em cena
    ema: (o) => { tone(o, { f: 120, f2: 95, dur: 0.45, vol: 0.28, attack: 0.08 }); tone(o, { f: 105, f2: 80, t: 0.55, dur: 0.6, vol: 0.24, attack: 0.1 }); },
    lobo: (o) => { tone(o, { type: 'sawtooth', f: 260, f2: 180, dur: 0.32, vol: 0.12 }); hiss(o, { dur: 0.3, vol: 0.14, freq: 500, q: 0.8 }); },
    veado: (o) => { hiss(o, { dur: 0.18, vol: 0.18, freq: 2600, type: 'highpass' }); tone(o, { f: 900, f2: 600, t: 0.02, dur: 0.12, vol: 0.06 }); },
    cateto: (o) => { for (let i = 0; i < 3; i++) tone(o, { type: 'sawtooth', f: 130, f2: 100, t: i * 0.2, dur: 0.12, vol: 0.1, vib: 25, vibRate: 35 }); for (let i = 0; i < 4; i++) hiss(o, { t: 0.7 + i * 0.05, dur: 0.012, vol: 0.2, freq: 3200, q: 4 }); },
    tatu: (o) => { for (let i = 0; i < 6; i++) hiss(o, { t: i * 0.07, dur: 0.05, vol: 0.1, freq: 700 + Math.random() * 300 }); },
    tamandua: (o) => { for (let i = 0; i < 4; i++) hiss(o, { t: i * 0.11, dur: 0.06, vol: 0.12, freq: 1100, q: 1.5 }); },
    capivara: (o) => { tone(o, { f: 1300, f2: 1500, dur: 0.08, vol: 0.08 }); hiss(o, { t: 0.15, dur: 0.05, vol: 0.1, freq: 900 }); },
    onca: (o) => { for (let i = 0; i < 4; i++) { tone(o, { type: 'sawtooth', f: 95, f2: 70, t: i * 0.42, dur: 0.3, vol: 0.14 }); hiss(o, { t: i * 0.42, dur: 0.3, vol: 0.1, freq: 350 }); } },
    jacare: (o) => { hiss(o, { dur: 0.6, vol: 0.12, freq: 2500, type: 'highpass' }); },
    ariranha: (o) => { for (let i = 0; i < 3; i++) tone(o, { f: 2600, f2: 3200, t: i * 0.12, dur: 0.06, vol: 0.08 }); }
  };
  // classe da entidade → voz e intervalo médio entre chamados (s)
  const VOICES = [
    ['ema', 'ema', 9], ['seriema', 'seriema', 8], ['lobo', 'lobo', 11], ['veado', 'veado', 10], ['catetos', 'cateto', 7], ['tatu', 'tatu', 6],
    ['tamandua', 'tamandua', 7], ['tucano', 'tucano', 7], ['araraVoo', 'arara', 6], ['araraFriend', 'arara', 14], ['capivara', 'capivara', 9],
    ['onca', 'onca', 12], ['jacare', 'jacare', 10], ['ariranha', 'ariranha', 5], ['perereca', 'perereca', 4]
  ];

  function play(name, pan = 0, vol = 1, wet = false) {
    if (!ctx || !CALLS[name] || level <= 0) return;
    CALLS[name](voice(0, pan, vol, wet));
  }

  function setProfile(name) {
    if (!ctx || name === profileName || !PROFILES[name]) return;
    profileName = name;
    const P = PROFILES[name], t = ctx.currentTime, T = 1.6;
    layers.wind.g.gain.setTargetAtTime(layers.wind.base * P.wind, t, T);
    layers.cicada.g.gain.setTargetAtTime(layers.cicada.base * P.cicada, t, T);
    layers.cave.g.gain.setTargetAtTime(layers.cave.base * P.cave, t, T);
    layers.hum.g.gain.setTargetAtTime(layers.hum.base * (P.hum || 0), t, T);
    revSend.gain.setTargetAtTime(name === 'caverna' ? 0.9 : 0.12, t, 0.8);
  }

  // chamado a cada passo: perfil da zona, água na tela e vozes dos animais visíveis
  function update(dt, name, game) {
    if (!ctx) return;
    setProfile(name);
    const P = PROFILES[profileName];
    if (!P) return;
    // água: mede quanto da tela tem água (rio, poço, cachoeira)
    waterT -= dt;
    if (waterT <= 0 && game) {
      waterT = 0.5;
      const L = game.level, cam = game.cam; let n = 0, tot = 0;
      for (let ty = Math.floor(cam.y / 16); ty <= Math.floor((cam.y + GC.CFG.H) / 16); ty += 2)
        for (let tx = Math.floor(cam.x / 16); tx <= Math.floor((cam.x + GC.CFG.W) / 16); tx += 2) { tot++; const t = L.tile(tx, ty), d = L.decoAt(tx, ty); if (GC.TP[t].water) n++; if (d === GC.D.FALLS) n += 4; }
      waterAmt = Math.min(1, n / Math.max(1, tot) * 6);
    }
    const wv = layers.water.base * Math.max(P.water * 0.35, game ? waterAmt * Math.max(0.6, P.water) : P.water);
    layers.water.g.gain.setTargetAtTime(wv, ctx.currentTime, 0.6);
    // aves e sons de fundo da zona
    eventT -= dt;
    if (eventT <= 0) {
      eventT = P.rate * (0.6 + Math.random() * 0.9);
      const b = P.birds[(Math.random() * P.birds.length) | 0];
      const far = 0.35 + Math.random() * 0.4;
      play(b, Math.random() * 1.6 - 0.8, far, profileName === 'caverna');
      if (P.cricket > 0.3 && Math.random() < P.cricket) setTimeout(() => play('grilo', Math.random() * 1.4 - 0.7, 0.5), 400);
      if (P.frogs && Math.random() < P.frogs * (game ? 0.5 + waterAmt : 1)) setTimeout(() => play(Math.random() < 0.5 ? 'sapo' : 'perereca', Math.random() * 1.4 - 0.7, 0.6), 700);
    }
    // vozes dos animais na tela (volume pela distância, panorâmica pela posição)
    if (!game) return;
    const cx = game.cam.x + GC.CFG.W / 2, px = game.player.cx;
    for (const e of game.entities) {
      if (e.dead) continue;
      const V = VOICES.find(([cls]) => GC.Ent[cls] && e instanceof GC.Ent[cls]);
      if (!V) continue;
      const ex = e.px !== undefined ? e.px : e.cx;
      if (Math.abs(ex - cx) > GC.CFG.W * 0.75) continue;
      const k = voiceT[V[0]] = (voiceT[V[0]] === undefined ? Math.random() * V[2] : voiceT[V[0]]) - dt / (game.entities.filter((q) => q instanceof GC.Ent[V[0]]).length || 1);
      if (k > 0) continue;
      voiceT[V[0]] = V[2] * (0.6 + Math.random() * 0.8);
      const dist = Math.abs(ex - px), vol = Math.max(0.25, 1 - dist / 420);
      play(V[1], (ex - cx) / (GC.CFG.W / 2), vol, game.level.inDark(e.cx, e.cy));
    }
    // fogo crepitando por perto
    if (Math.random() < dt * 3) { const f = game.entities.find((e) => e instanceof GC.Fire && !e.dead && Math.abs(e.cx - px) < 200); if (f) play('brasa', (f.cx - cx) / (GC.CFG.W / 2), 0.5); }
  }

  return {
    init, update, play, PROFILES,
    get level() { return level; },
    setLevel(v) { level = v; if (bus) bus.gain.setTargetAtTime(v * GAIN, ctx.currentTime, 0.2); }
  };
})();
