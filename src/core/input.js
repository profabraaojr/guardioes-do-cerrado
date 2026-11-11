// Entrada unificada: teclado, toque (botões virtuais) e gamepad.
// Cada ação expõe: down (segurada), pressed (apertada neste quadro), released.
GC.Input = (function () {
  const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'tool', 'swap', 'ally', 'power', 'interact', 'pause', 'confirm'];
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyK: 'jump', KeyZ: 'jump',
    KeyJ: 'tool', KeyX: 'tool',
    KeyL: 'swap', KeyC: 'swap',
    KeyQ: 'ally', KeyV: 'ally',
    KeyF: 'power', KeyB: 'power',
    KeyE: 'interact',
    Escape: 'pause', KeyP: 'pause',
    Enter: 'confirm'
  };
  const src = { key: {}, touch: {}, pad: {} };
  const taps = {}; // toques curtos registrados entre dois quadros
  const state = {};
  ACTIONS.forEach((a) => (state[a] = { down: false, pressed: false, released: false }));
  let lastDevice = 'keyboard';

  function onKey(e, isDown) {
    const a = KEYMAP[e.code];
    if (!a) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    src.key[a] = isDown;
    if (isDown) taps[a] = true;
    lastDevice = 'keyboard';
  }
  window.addEventListener('keydown', (e) => { if (!e.repeat) onKey(e, true); else if (KEYMAP[e.code]) e.preventDefault(); });
  window.addEventListener('keyup', (e) => onKey(e, false));
  window.addEventListener('blur', () => { src.key = {}; src.touch = {}; });

  // Botões virtuais: qualquer elemento com data-action
  function bindTouch(root) {
    const active = new Map(); // pointerId -> action
    const setAct = (a, v) => { src.touch[a] = v; if (v) taps[a] = true; if (a === 'jump') src.touch.confirm = v; };
    root.querySelectorAll('[data-action]').forEach((el) => {
      const a = el.dataset.action;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture && el.setPointerCapture(e.pointerId);
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
      pad.addEventListener('pointerdown', (e) => { e.preventDefault(); pad.setPointerCapture(e.pointerId); lastDevice = 'touch'; update(e); });
      pad.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') update(e); });
      pad.addEventListener('pointerup', end);
      pad.addEventListener('pointercancel', end);
    }
  }

  function pollPad() {
    src.pad = {};
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const P = src.pad;
      P.left = b(14) || ax < -0.4; P.right = b(15) || ax > 0.4;
      P.up = b(12) || ay < -0.5; P.down = b(13) || ay > 0.5;
      P.jump = b(0); P.confirm = b(0); P.tool = b(2) || b(7); P.swap = b(3);
      P.ally = b(1) || b(5); P.interact = b(4); P.pause = b(9); P.power = b(6) || b(10);
      if (Object.values(P).some(Boolean)) lastDevice = 'gamepad';
      break;
    }
  }

  return {
    ACTIONS, state, bindTouch,
    get device() { return lastDevice; },
    update() {
      pollPad();
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
    reset() { src.key = {}; src.touch = {}; for (const a of ACTIONS) Object.assign(state[a], { down: false, pressed: false, released: false }); }
  };
})();
