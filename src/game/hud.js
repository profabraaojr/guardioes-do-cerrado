// Interface sobreposta (DOM): vitalidade, água, personagem ativo, contadores,
// faixas de zona, avisos, falas rápidas, caixas de diálogo e fichas.
GC.HUD = (function () {
  const $ = (id) => document.getElementById(id);
  let els = {};
  let toastT = [];
  let bannerT = 0;
  let last = {};
  let card = null;

  function init() {
    els = {
      hud: $('hud'), hearts: $('hearts'), water: $('water'), waterWrap: $('waterWrap'),
      charName: $('charName'), charTool: $('charTool'), charPortrait: $('charPortrait'), partnerPortrait: $('partnerPortrait'),
      ally: $('allyState'), rares: $('rares'), guide: $('guideCount'),
      banner: $('banner'), toasts: $('toasts'),
      bossbar: $('bossbar'), bossName: $('bossName'), bossLabel: $('bossLabel'), bossFill: $('bossFill'),
      card: $('card'), cardTitle: $('cardTitle'), cardSub: $('cardSub'), cardText: $('cardText'), cardTip: $('cardTip'), cardCat: $('cardCat'), cardIcon: $('cardIcon'), cardBtn: $('cardBtn')
    };
    els.cardBtn.addEventListener('click', () => closeCard());
  }

  // retrato 40×40 copiado 1:1; o CSS amplia apenas em múltiplos inteiros
  function portraitInto(canvas, who) {
    canvas.width = 40; canvas.height = 40;
    const x = canvas.getContext('2d'); x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 40, 40); x.drawImage(GC.Portraits.get(who, 'neutral'), 0, 0);
  }

  function update(g, dt) {
    GC.DialogUI.update(dt);
    if (!g) return;
    const max = g.save.maxHearts;
    const key = g.hearts + '/' + max;
    if (last.hearts !== key) {
      last.hearts = key;
      els.hearts.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const s = document.createElement('i');
        s.className = 'leaf' + (i < g.hearts ? ' full' : '');
        els.hearts.appendChild(s);
      }
    }
    const w = Math.round(g.water);
    if (last.water !== w) { last.water = w; els.water.style.width = (w / GC.CFG.WATER_TANK * 100) + '%'; els.waterWrap.classList.toggle('low', w < 20); }
    const ch = g.player.char;
    if (last.char !== ch) {
      last.char = ch;
      const C = GC.CHARACTERS[ch];
      els.charName.textContent = C.name;
      els.charTool.textContent = C.toolName;
      portraitInto(els.charPortrait, ch);
      portraitInto(els.partnerPortrait, ch === 'piata' ? 'larinha' : 'piata');
      els.hud.dataset.char = ch;
    }
    const allyTxt = g.allyCd > 0 ? Math.ceil(g.allyCd) + 's' : GC.CHARACTERS[ch].allyName;
    if (last.ally !== allyTxt) { last.ally = allyTxt; els.ally.textContent = allyTxt; els.ally.classList.toggle('cool', g.allyCd > 0); }
    const r = g.save.rares.length + '/5';
    if (last.rares !== r) { last.rares = r; els.rares.textContent = r; }
    const gc = g.save.guide.length + '/' + GC.GUIDE_ORDER.length;
    if (last.guide !== gc) { last.guide = gc; els.guide.textContent = gc; }

    // barra de chefe (qualquer chefe preenche g.bossBar)
    const B = g.bossBar;
    const bk = B ? B.name + '|' + B.label + '|' + Math.round(B.value * 100) : '';
    if (last.boss !== bk) {
      last.boss = bk;
      els.bossbar.hidden = !B;
      if (B) { els.bossName.textContent = B.name + (B.steps ? '  ·  etapa ' + B.step + '/' + B.steps : ''); els.bossLabel.textContent = B.label; els.bossFill.style.width = Math.round(B.value * 100) + '%'; }
    }
    // temporizadores
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) els.banner.classList.remove('show'); }
    toastT = toastT.filter((t) => { t.t -= dt; if (t.t <= 0) { t.el.classList.add('out'); setTimeout(() => t.el.remove(), 400); return false; } return true; });

  }

  function reset() { last = {}; }

  function banner(title, sub) {
    els.banner.innerHTML = '<b></b><small></small>';
    els.banner.querySelector('b').textContent = title;
    els.banner.querySelector('small').textContent = sub || '';
    els.banner.classList.add('show');
    bannerT = 3.2;
  }

  function toast(msg) {
    if (toastT.some((t) => t.msg === msg)) return;
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    els.toasts.appendChild(el);
    toastT.push({ el, t: 3.6, msg });
    if (toastT.length > 3) { const o = toastT.shift(); o.el.remove(); }
  }

  // Falas rápidas e diálogos são desenhados pelo GC.DialogUI (fonte bitmap, escala inteira)
  function speech(who, text) { GC.DialogUI.say(who, text); }
  function startDialog(lines, onDone) { GC.DialogUI.start(lines, onDone); }
  function advance() { GC.DialogUI.advance(); }

  // ——— Fichas (Guia de Campo e placas) ———
  let iconAnim = null;
  function showCard(o, onClose) {
    card = { onClose };
    els.cardCat.textContent = o.cat || '';
    els.cardTitle.textContent = o.title;
    els.cardSub.textContent = o.sub || '';
    els.cardSub.hidden = !o.sub;
    els.cardText.textContent = o.text || '';
    els.cardTip.textContent = o.tip || '';
    els.cardTip.hidden = !o.tip;
    const cv = els.cardIcon;
    cv.hidden = !o.icon;
    cancelAnimationFrame(iconAnim);
    if (o.icon) {
      const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
      const t0 = performance.now();
      const loop = (now) => { GC.Art.icon(x, o.icon, cv.width, cv.height, (now - t0) / 1000); iconAnim = requestAnimationFrame(loop); };
      iconAnim = requestAnimationFrame(loop);
    }
    els.card.hidden = false;
    els.cardBtn.focus({ preventScroll: true });
    GC.Audio.play('card');
  }
  function closeCard() {
    if (!card) return;
    cancelAnimationFrame(iconAnim);
    els.card.hidden = true;
    const cb = card.onClose; card = null;
    if (cb) cb();
  }

  return {
    init, update, reset, banner, toast, speech, startDialog, advance, showCard, closeCard,
    get dialogOpen() { return GC.DialogUI.open; },
    get cardOpen() { return !!card; },
    show(v) { els.hud.hidden = !v; },
    clearTransient() {
      toastT.forEach((t) => t.el.remove()); toastT = [];
      els.banner.classList.remove('show');
      GC.DialogUI.clear();
    },
    portraitInto
  };
})();
