// Entrada unificada: teclado, toque (botões virtuais) e gamepad escrevem no mesmo estado.
// Cada ação expõe: down (segurada), pressed e released (valem um quadro de simulação).
// Eixos analógicos: axisX e axisY, de -1 a 1 (teclado e cruz valem -1, 0 ou 1).
GC.Input = (function () {
  // Uma partida tem um único guardião: não há ação de troca (a escolha vale até o próximo jogo).
  const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'tool', 'ally', 'power', 'interact', 'pause', 'confirm'];
  // Mapa padrão do teclado (pode ser remapeado na tela de Controles; o padrão não muda)
  const DEFAULT_KEYS = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'KeyK', 'KeyZ'], tool: ['KeyJ', 'KeyX'], ally: ['KeyQ', 'KeyV'],
    power: ['KeyF', 'KeyB'], interact: ['KeyE'], pause: ['Escape', 'KeyP'], confirm: ['Enter']
  };
  const KEYS_STORE = 'guardioes-teclas', KEYS_VERSION = 1;
  let binds = loadBinds();
  let KEYMAP = buildKeymap();
  function loadBinds() {
    const b = JSON.parse(JSON.stringify(DEFAULT_KEYS));
    try {
      const d = JSON.parse(localStorage.getItem(KEYS_STORE) || 'null');
      if (d && d.version === KEYS_VERSION && d.keys) for (const a of ACTIONS) if (Array.isArray(d.keys[a]) && d.keys[a].every((k) => typeof k === 'string')) b[a] = d.keys[a].slice(0, 3);
    } catch (e) { /* armazenamento indisponível: usa o padrão */ }
    return b;
  }
  function buildKeymap() { const m = {}; for (const a of ACTIONS) for (const k of binds[a]) if (k && !m[k]) m[k] = a; return m; }
  function saveBinds() { try { localStorage.setItem(KEYS_STORE, JSON.stringify({ version: KEYS_VERSION, keys: binds })); } catch (e) {} }
  const src = { key: {}, touch: {}, pad: {}, padAxis: { x: 0, y: 0 }, touchAxis: null };
  const taps = {}; // toques curtos registrados entre dois quadros
  const state = {};
  ACTIONS.forEach((a) => (state[a] = { down: false, pressed: false, released: false }));
  let lastDevice = 'keyboard';
  let capture = null; // remapeamento em andamento: (code) => void
  let onAutoPause = null; // chamado quando a aba perde o foco ou o controle é desconectado
  const axis = { x: 0, y: 0 };

  // campos de texto ativos não disparam comandos
  const typing = (e) => { const t = e.target; return !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))); };

  function onKey(e, isDown) {
    if (capture && isDown) { e.preventDefault(); const c = capture; capture = null; c(e.code); return; }
    if (typing(e)) return;
    const a = KEYMAP[e.code];
    if (!a) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    src.key[a] = isDown;
    if (isDown) taps[a] = true;
    lastDevice = 'keyboard';
  }
  window.addEventListener('keydown', (e) => { if (!e.repeat) onKey(e, true); else if (KEYMAP[e.code]) e.preventDefault(); });
  window.addEventListener('keyup', (e) => onKey(e, false));
  function releaseAll() { src.key = {}; src.touch = {}; src.touchAxis = null; for (const k in taps) delete taps[k]; }
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseAll(); if (onAutoPause) onAutoPause('foco'); } });
  window.addEventListener('gamepaddisconnected', () => { src.pad = {}; src.padAxis = { x: 0, y: 0 }; if (onAutoPause) onAutoPause('controle'); });

  // Botões virtuais: qualquer elemento com data-action
  function bindTouch(root) {
    const active = new Map(); // pointerId -> action
    const setAct = (a, v) => { src.touch[a] = v; if (v) taps[a] = true; if (a === 'jump') src.touch.confirm = v; };
    root.querySelectorAll('[data-action]').forEach((el) => {
      const a = el.dataset.action;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { el.setPointerCapture && el.setPointerCapture(e.pointerId); } catch (err) { /* ponteiro já liberado */ }
        active.set(e.pointerId, a); setAct(a, true); el.classList.add('on');
        lastDevice = 'touch';
      });
      const up = (e) => {
        if (active.get(e.pointerId) !== a) return;
        active.delete(e.pointerId);
        if (![...active.values()].includes(a)) { setAct(a, false); el.classList.remove('on'); }
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    // Direcional deslizante: arrastar o dedo entre as setas troca a direção
    const pad = root.querySelector('.dpad');
    if (pad) {
      const dirs = ['left', 'right', 'up', 'down'];
      const update = (e) => {
        const r = pad.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dead = r.width * 0.14;
        dirs.forEach((d) => (src.touch[d] = false));
        if (Math.abs(dx) > dead) src.touch[dx < 0 ? 'left' : 'right'] = true;
        if (Math.abs(dy) > dead * 1.2) src.touch[dy < 0 ? 'up' : 'down'] = true;
        pad.dataset.dir = dirs.filter((d) => src.touch[d]).join(' ');
      };
      const end = () => { dirs.forEach((d) => (src.touch[d] = false)); pad.dataset.dir = ''; };
      pad.addEventListener('pointerdown', (e) => { e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch (err) { /* ponteiro já liberado */ } lastDevice = 'touch'; update(e); });
      pad.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') update(e); });
      pad.addEventListener('pointerup', end);
      pad.addEventListener('pointercancel', end);
    }
  }

  // zona morta radial: abaixo de DEADZONE vale 0; acima, reescala para 0..1
  function dead(x, y) {
    const dz = GC.CFG.DEADZONE, m = Math.hypot(x, y);
    if (m < dz) return { x: 0, y: 0 };
    const k = Math.min(1, (m - dz) / (1 - dz)) / m;
    return { x: x * k, y: y * k };
  }
  function pollPad() {
    src.pad = {}; src.padAxis = { x: 0, y: 0 };
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      const st = dead(p.axes[0] || 0, p.axes[1] || 0), ax = st.x, ay = st.y;
      const P = src.pad, D = GC.CFG.AXIS_DIGITAL;
      src.padAxis = { x: ax, y: ay };
      // horizontal: qualquer inclinação além da zona morta anda (a velocidade segue o eixo);
      // vertical: exige inclinação maior para não escalar nem interagir sem querer
      P.left = b(14) || ax < -0.01; P.right = b(15) || ax > 0.01;
      P.up = b(12) || ay < -D; P.down = b(13) || ay > D;
      if (b(14) || b(15)) src.padAxis.x = b(14) ? -1 : 1;
      P.jump = b(0); P.confirm = b(0); P.tool = b(2) || b(7);
      P.ally = b(1) || b(5); P.interact = b(4); P.pause = b(9); P.power = b(6) || b(10);
      if (Object.values(P).some(Boolean)) lastDevice = 'gamepad';
      break;
    }
  }

  return {
    ACTIONS, state, bindTouch, axis, DEFAULT_KEYS,
    get device() { return lastDevice; },
    get axisX() { return axis.x; },
    get axisY() { return axis.y; },
    // ——— remapeamento do teclado ———
    get binds() { return binds; },
    keyName(code) {
      if (!code) return '—';
      const N = { Space: 'Espaço', Enter: 'Enter', Escape: 'Esc', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: 'Shift', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl', ControlRight: 'Ctrl dir.', AltLeft: 'Alt', Tab: 'Tab', Backspace: '⌫' };
      return N[code] || code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num ');
    },
    // espera a próxima tecla e grava na posição slot da ação (tira a tecla de outra ação, se houver)
    rebind(action, slot, cb) {
      capture = (code) => {
        if (code === 'Escape' && action !== 'pause') { if (cb) cb(false); return; }
        const old = binds[action][slot];
        for (const a of ACTIONS) if (a !== action) binds[a] = binds[a].filter((k) => k !== code);
        const arr = binds[action].filter((k, i) => k !== code || i === slot);
        if (slot < arr.length) arr[slot] = code; else arr.push(code);
        binds[action] = arr.slice(0, 3);
        // ações essenciais nunca ficam sem tecla: devolve a antiga a quem perdeu a única
        for (const a of ACTIONS) if (!binds[a].length && old && a !== action) binds[a] = [old];
        KEYMAP = buildKeymap(); saveBinds(); if (cb) cb(true, code);
      };
    },
    cancelRebind() { capture = null; },
    resetBinds() { binds = JSON.parse(JSON.stringify(DEFAULT_KEYS)); KEYMAP = buildKeymap(); saveBinds(); },
    set onAutoPause(fn) { onAutoPause = fn; },
    // fontes externas (controles de toque configuráveis)
    setTouch(a, v) { src.touch[a] = v; if (v) { taps[a] = true; lastDevice = 'touch'; } },
    setTouchAxis(x, y) { src.touchAxis = x === null ? null : { x, y }; if (x !== null) lastDevice = 'touch'; },
    releaseAll,
    update() {
      pollPad();
      // eixos: o maior valor entre as fontes (gamepad analógico, joystick de toque, teclado/cruz)
      const kx = ((src.key.right || src.touch.right) ? 1 : 0) - ((src.key.left || src.touch.left) ? 1 : 0);
      const ky = ((src.key.down || src.touch.down) ? 1 : 0) - ((src.key.up || src.touch.up) ? 1 : 0);
      const pick = (...v) => v.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0);
      axis.x = pick(kx, src.padAxis.x, src.touchAxis ? src.touchAxis.x : 0);
      axis.y = pick(ky, src.padAxis.y, src.touchAxis ? src.touchAxis.y : 0);
      for (const a of ACTIONS) {
        const s = state[a];
        let d = !!(src.key[a] || src.touch[a] || src.pad[a] || taps[a]);
        if (a === 'confirm') d = d || !!src.key.jump || !!taps.jump;
        s.pressed = d && !s.down;
        s.released = !d && s.down;
        s.down = d;
      }
      for (const k in taps) delete taps[k];
    },
    down: (a) => state[a].down,
    pressed: (a) => state[a].pressed,
    released: (a) => state[a].released,
    clear() { for (const a of ACTIONS) { state[a].pressed = false; } },
    reset() { releaseAll(); for (const a of ACTIONS) Object.assign(state[a], { down: false, pressed: false, released: false }); }
  };
})();
