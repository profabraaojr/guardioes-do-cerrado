// Áudio procedural (Web Audio): efeitos, ambiente e trilha.
// A trilha usa um pulso binário com acentos deslocados, em referência ao
// rasqueado mato-grossense, com timbre dedilhado que lembra a viola de cocho.
GC.Audio = (function () {
  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let muted = false;
  let music = { name: null, step: 0, next: 0, timer: null };
  let sprayNode = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone({ type = 'square', f = 440, f2 = null, t = 0, dur = 0.12, vol = 0.3, bus = sfxBus, attack = 0.005, detune = 0 }) {
    if (!ctx) return;
    const now = ctx.currentTime + t;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, now); o.detune.value = detune;
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(bus);
    o.start(now); o.stop(now + dur + 0.05);
  }

  function noise({ t = 0, dur = 0.2, vol = 0.3, freq = 1200, q = 1, type = 'bandpass', bus = sfxBus, f2 = null }) {
    if (!ctx) return;
    const now = ctx.currentTime + t;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, now); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(fl); fl.connect(g); g.connect(bus);
    s.start(now, Math.random()); s.stop(now + dur + 0.05);
  }

  // Dedilhado: duas cordas levemente desafinadas, ataque rápido
  function pluck(f, t, vol = 0.18, dur = 0.35) {
    tone({ type: 'triangle', f, t, dur, vol, bus: musicBus, attack: 0.003 });
    tone({ type: 'sawtooth', f: f * 2, t, dur: dur * 0.5, vol: vol * 0.18, bus: musicBus, attack: 0.002, detune: 7 });
  }

  const SFX = {
    jump: () => tone({ type: 'square', f: 260, f2: 520, dur: 0.12, vol: 0.12 }),
    land: () => noise({ dur: 0.07, vol: 0.12, freq: 400 }),
    seed: () => { tone({ type: 'square', f: 700, f2: 300, dur: 0.08, vol: 0.1 }); noise({ dur: 0.05, vol: 0.08, freq: 2500 }); },
    metal: () => { tone({ type: 'square', f: 1200, f2: 600, dur: 0.07, vol: 0.12 }); noise({ dur: 0.08, vol: 0.12, freq: 3000, q: 4 }); },
    neutralize: () => [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f, t: i * 0.06, dur: 0.2, vol: 0.16 })),
    grow: () => [392, 494, 587, 784].forEach((f, i) => tone({ type: 'sine', f, t: i * 0.07, dur: 0.3, vol: 0.18 })),
    pickup: () => { tone({ type: 'square', f: 880, dur: 0.06, vol: 0.1 }); tone({ type: 'square', f: 1320, t: 0.06, dur: 0.1, vol: 0.1 }); },
    rare: () => [659, 784, 988, 1318, 1568].forEach((f, i) => tone({ type: 'triangle', f, t: i * 0.08, dur: 0.35, vol: 0.15 })),
    heart: () => [523, 784].forEach((f, i) => tone({ type: 'sine', f, t: i * 0.1, dur: 0.25, vol: 0.2 })),
    hurt: () => { tone({ type: 'sawtooth', f: 300, f2: 90, dur: 0.25, vol: 0.18 }); noise({ dur: 0.15, vol: 0.15, freq: 800 }); },
    splash: () => noise({ dur: 0.35, vol: 0.22, freq: 900, f2: 300, q: 0.7 }),
    stroke: () => noise({ dur: 0.12, vol: 0.08, freq: 700, q: 0.8 }),
    extinguish: () => noise({ dur: 0.4, vol: 0.18, freq: 3000, f2: 800, type: 'highpass' }),
    card: () => [784, 988, 1175].forEach((f, i) => tone({ type: 'sine', f, t: i * 0.05, dur: 0.25, vol: 0.14 })),
    checkpoint: () => [392, 523, 659, 784].forEach((f, i) => pluck(f, i * 0.08, 0.3, 0.5)),
    observe: () => { tone({ type: 'sine', f: 1500, dur: 0.05, vol: 0.12 }); noise({ t: 0.04, dur: 0.06, vol: 0.12, freq: 5000 }); },
    clank: () => { noise({ dur: 0.12, vol: 0.2, freq: 1800, q: 6 }); tone({ type: 'square', f: 160, f2: 80, dur: 0.1, vol: 0.12 }); },
    engine: () => { tone({ type: 'sawtooth', f: 55, f2: 110, dur: 0.9, vol: 0.18 }); noise({ dur: 0.9, vol: 0.12, freq: 200 }); },
    crash: () => { noise({ dur: 0.6, vol: 0.4, freq: 300, type: 'lowpass' }); tone({ type: 'sine', f: 90, f2: 30, dur: 0.5, vol: 0.4 }); },
    fireball: () => noise({ dur: 0.5, vol: 0.18, freq: 600, f2: 200, type: 'lowpass' }),
    roar: () => { tone({ type: 'sawtooth', f: 110, f2: 60, dur: 1.1, vol: 0.28, attack: 0.05 }); tone({ type: 'sawtooth', f: 82, f2: 50, dur: 1.2, vol: 0.2, detune: 30, attack: 0.08 }); noise({ dur: 1.1, vol: 0.2, freq: 400, f2: 150, q: 0.6 }); },
    growl: () => { tone({ type: 'sawtooth', f: 70, f2: 55, dur: 0.5, vol: 0.16 }); noise({ dur: 0.5, vol: 0.1, freq: 300 }); },
    snap: () => { noise({ dur: 0.08, vol: 0.3, freq: 1500, q: 2 }); tone({ type: 'square', f: 200, f2: 60, dur: 0.1, vol: 0.15 }); },
    dig: () => { for (let i = 0; i < 6; i++) noise({ t: i * 0.09, dur: 0.07, vol: 0.14, freq: 500 + Math.random() * 400 }); },
    open: () => { tone({ type: 'square', f: 330, dur: 0.06, vol: 0.1 }); tone({ type: 'square', f: 494, t: 0.07, dur: 0.12, vol: 0.1 }); noise({ dur: 0.1, vol: 0.12, freq: 2200, q: 5 }); },
    arara: () => { tone({ type: 'square', f: 1300, f2: 900, dur: 0.12, vol: 0.09 }); tone({ type: 'square', f: 1400, f2: 1000, t: 0.15, dur: 0.14, vol: 0.09 }); },
    seriema: () => [1200, 1100, 1000, 900, 800].forEach((f, i) => tone({ type: 'square', f, f2: f * 0.8, t: i * 0.09, dur: 0.08, vol: 0.05 })),
    warn: () => tone({ type: 'square', f: 220, dur: 0.15, vol: 0.12 }),
    swap: () => tone({ type: 'square', f: 600, f2: 900, dur: 0.06, vol: 0.08 }),
    deny: () => tone({ type: 'square', f: 180, f2: 140, dur: 0.12, vol: 0.1 }),
    victory: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => pluck(f, i * 0.12, 0.3, 0.7))
  };

  // ——— Trilha ———
  // notas em semitons a partir de Ré (D3 = 146.83 Hz)
  const N = (s) => 146.83 * Math.pow(2, s / 12);
  const SONGS = {
    title: {
      bpm: 92, steps: 32,
      bass: [0, null, null, null, 7, null, null, null, 5, null, null, null, 7, null, 2, null,
             0, null, null, null, 7, null, null, null, 9, null, 7, null, 5, null, 4, null],
      mel: [12, null, 16, null, 19, null, 16, 14, 12, null, null, 9, 12, null, null, null,
            14, null, 16, null, 19, 21, 19, null, 16, null, 14, null, 12, null, null, null],
      shaker: false
    },
    cerrado: {
      bpm: 118, steps: 32,
      bass: [0, null, 7, null, 0, null, 7, null, 5, null, 12, null, 5, null, 7, null,
             0, null, 7, null, 0, null, 7, null, 9, null, 7, null, 5, null, 7, null],
      mel: [12, 14, 16, null, 19, null, 16, null, 17, 16, 14, null, 12, null, 14, null,
            16, null, 19, 21, 19, null, 16, 14, 12, null, 9, null, 12, null, null, null],
      shaker: true
    },
    cave: {
      bpm: 84, steps: 32,
      bass: [0, null, null, null, null, null, null, null, -2, null, null, null, null, null, null, null,
             -4, null, null, null, null, null, null, null, -2, null, null, null, null, null, null, null],
      mel: [null, null, 12, null, null, 15, null, null, null, null, 10, null, null, null, 14, null,
            null, null, 12, null, 15, null, 17, null, null, null, 15, null, 14, null, null, null],
      shaker: false
    },
    boss: {
      bpm: 146, steps: 32,
      bass: [0, 0, 12, 0, 0, 12, 0, 10, 0, 0, 12, 0, 3, 3, 5, 7,
             0, 0, 12, 0, 0, 12, 0, 10, -2, -2, 10, -2, 1, 1, 3, 5],
      mel: [12, null, 15, null, 17, 15, null, 12, null, 10, 12, null, 15, null, null, null,
            19, null, 17, null, 15, 17, null, 15, 12, null, 10, null, 12, null, null, null],
      shaker: true
    },
    victory: {
      bpm: 104, steps: 32,
      bass: [0, null, 7, null, 5, null, 7, null, 9, null, 7, null, 5, null, 4, null,
             2, null, 9, null, 7, null, 9, null, 0, null, 7, null, 0, null, null, null],
      mel: [12, null, 16, 19, 24, null, 21, null, 19, null, 16, 19, 21, null, null, null,
            14, null, 17, 21, 19, null, 16, null, 12, 16, 19, 16, 24, null, null, null],
      shaker: true
    }
  };

  function scheduleMusic() {
    if (!ctx || !music.name) return;
    const song = SONGS[music.name];
    const stepDur = 60 / song.bpm / 4;
    while (music.next < ctx.currentTime + 0.15) {
      const i = music.step % song.steps;
      const t = music.next - ctx.currentTime;
      const b = song.bass[i];
      if (b !== null && b !== undefined) tone({ type: 'square', f: N(b) / 2, t, dur: stepDur * 1.6, vol: 0.1, bus: musicBus });
      const m = song.mel[i];
      if (m !== null && m !== undefined) pluck(N(m), t, 0.13, stepDur * 3);
      // pulso rasqueado: acento no contratempo
      if (song.shaker) {
        const acc = i % 4 === 2 ? 0.07 : i % 2 === 0 ? 0.035 : 0.02;
        noise({ t, dur: 0.05, vol: acc, freq: 6000, q: 1.5, bus: musicBus });
        if (i % 8 === 0) tone({ type: 'sine', f: 120, f2: 45, t, dur: 0.18, vol: 0.22, bus: musicBus });
        if (i % 8 === 6) tone({ type: 'sine', f: 160, f2: 70, t, dur: 0.12, vol: 0.12, bus: musicBus });
      } else if (music.name === 'cave' && i % 8 === 4) {
        tone({ type: 'sine', f: 2200 + Math.random() * 800, f2: 900, t, dur: 0.12, vol: 0.04, bus: musicBus });
      }
      music.next += stepDur;
      music.step++;
    }
  }

  // ambiente: pássaros esporádicos e água corrente
  let ambientTimer = 0;
  function ambient(dt, kind) {
    if (!ctx || muted) return;
    ambientTimer -= dt;
    if (ambientTimer > 0) return;
    ambientTimer = 1.5 + Math.random() * 3;
    if (kind === 'day') {
      const f = 1800 + Math.random() * 1600;
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++)
        tone({ type: 'sine', f: f * (1 + i * 0.05), f2: f * 1.3, t: i * 0.11, dur: 0.08, vol: 0.035 });
    } else if (kind === 'water') {
      noise({ dur: 1.6, vol: 0.05, freq: 900, q: 0.5 });
    } else if (kind === 'cave') {
      tone({ type: 'sine', f: 1800 + Math.random() * 900, f2: 700, dur: 0.1, vol: 0.05 });
    }
  }

  return {
    init,
    get ready() { return !!ctx; },
    get muted() { return muted; },
    play(name) { if (ctx && SFX[name]) SFX[name](); },
    music(name) {
      if (!ctx) { music.name = name; return; }
      if (music.name === name && music.timer) return;
      music.name = name;
      music.step = 0;
      music.next = ctx.currentTime + 0.1;
      if (!music.timer) music.timer = setInterval(scheduleMusic, 50);
    },
    stopMusic() { music.name = null; },
    ambient,
    spray(on) {
      if (!ctx) return;
      if (on && !sprayNode) {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.8;
        const g = ctx.createGain(); g.gain.value = 0.07;
        s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
        sprayNode = s;
      } else if (!on && sprayNode) { sprayNode.stop(); sprayNode = null; }
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    }
  };
})();
