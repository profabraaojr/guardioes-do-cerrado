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
      hud: $('hud'), hearts: $('hearts'), water: $('water'), waterWrap: $('waterWrap'), waterState: $('waterState'), questTitle: $('questTitle'), questSub: $('questSub'),
      charName: $('charName'), charTool: $('charTool'), charPortrait: $('charPortrait'), partnerPortrait: $('partnerPortrait'),
      ally: $('allyState'), power: $('powerState'), rares: $('rares'), guide: $('guideCount'),
      banner: $('banner'), toasts: $('toasts'),
      bossbar: $('bossbar'), bossName: $('bossName'), bossLabel: $('bossLabel'), bossFill: $('bossFill'),
      card: $('card'), cardTitle: $('cardTitle'), cardSub: $('cardSub'), cardText: $('cardText'), cardTip: $('cardTip'), cardCat: $('cardCat'), cardIcon: $('cardIcon'), cardBtn: $('cardBtn')
    };
    els.cardBtn.addEventListener('click', () => closeCard());
    // ícones em pixel art (16×16) aplicados como imagem nítida
    document.querySelectorAll('.ico[data-ico]').forEach((el) => (el.style.backgroundImage = 'url(' + icon(el.dataset.ico) + ')'));
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
        s.className = 'leaf';
        s.style.backgroundImage = 'url(' + icon(i < g.hearts ? 'leaf' : 'leafEmpty') + ')';
        els.hearts.appendChild(s);
      }
      els.hearts.setAttribute('aria-label', 'Vitalidade ' + g.hearts + ' de ' + max);
    }
    const w = Math.round(g.water);
    if (last.water !== w) {
      last.water = w;
      const pct = w / GC.CFG.WATER_TANK;
      const st = pct >= 0.6 ? 'cheia' : pct > 0.02 ? (pct >= 0.2 ? 'media' : 'baixa') : 'vazia';
      els.water.style.width = (pct * 100) + '%';
      els.waterWrap.dataset.state = st;
      els.waterState.textContent = { cheia: 'Cheia', media: 'Média', baixa: 'Baixa', vazia: 'Vazia' }[st];
    }
    const z = g.zone;
    const zk = z ? z.id : '';
    if (last.zone !== zk && z) { last.zone = zk; els.questTitle.textContent = z.name; els.questSub.textContent = z.sub; }
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
    const snd = GC.Audio.muted || !GC.Audio.running ? 'mute' : 'sound';
    if (last.snd !== snd) { last.snd = snd; const i = document.querySelector('#soundBtn .ico'); if (i) i.style.backgroundImage = 'url(' + icon(snd) + ')'; }
    const pc = g.player.powerCd || 0;
    const powTxt = pc > 0 ? Math.ceil(pc) + 's' : GC.CHARACTERS[ch].powerName;
    if (last.pow !== powTxt) { last.pow = powTxt; els.power.textContent = powTxt; els.power.classList.toggle('cool', pc > 0); }
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

  // ——— Ícones do HUD (pixel art, 16×16) ———
  const icons = {};
  function icon(name) {
    if (icons[name]) return icons[name];
    const P = new GC.Pix(16, 16);
    switch (name) {
      case 'leaf': case 'leafEmpty': {
        const full = name === 'leaf';
        P.poly([[2, 14], [2, 6], [7, 2], [14, 2], [14, 8], [9, 14]], full ? '#58c040' : '#2a3a2a');
        P.poly([[3, 12], [3, 7], [7, 4], [11, 4], [5, 10]], full ? '#8ee060' : '#3a4a3a');
        P.line(3, 13, 12, 4, full ? '#2e7a24' : '#1a221a');
        P.outline('#0e1408'); break;
      }
      case 'drop': P.poly([[8, 1], [13, 9], [12, 13], [8, 15], [4, 13], [3, 9]], '#3aa0e8'); P.ellipse(8, 11, 4.2, 3.6, '#3aa0e8'); P.rect(6, 6, 2, 4, '#bfe8ff'); P.outline('#0a1a2e'); break;
      case 'rare': P.circle(8, 8, 7, 'rgba(255,220,90,0.35)'); P.ellipse(8, 10, 4, 5, '#d8961e'); P.ellipse(7, 8, 2, 2, '#fde070'); P.line(8, 5, 9, 1, '#3e9a3a'); P.rect(9, 1, 4, 2, '#6ac84a'); P.outline('#2a1a04'); break;
      case 'sound': case 'mute': {
        P.rect(2, 6, 3, 4, '#e8f4ff'); P.poly([[5, 6], [9, 2], [9, 14], [5, 10]], '#e8f4ff');
        if (name === 'sound') { P.line(11, 6, 11, 10, '#8ad8ff'); P.line(13, 4, 13, 12, '#8ad8ff'); }
        else { P.line(11, 5, 15, 11, '#ff7a6a'); P.line(15, 5, 11, 11, '#ff7a6a'); }
        P.outline('#06090f'); break;
      }
      case 'fs': for (const [x, y, dx, dy] of [[2, 2, 1, 1], [14, 2, -1, 1], [2, 14, 1, -1], [14, 14, -1, -1]]) { P.rect(Math.min(x, x + dx * 3), y, 4, 1.5, '#e8f4ff'); P.rect(x, Math.min(y, y + dy * 3), 1.5, 4, '#e8f4ff'); } P.outline('#06090f'); break;
      case 'book': P.rect(2, 3, 12, 11, '#3a8a3a'); P.rect(3, 4, 10, 9, '#5ab84a'); P.rect(7, 3, 2, 11, '#2a6a2a'); P.rect(4, 6, 2, 1, '#e8f8d0'); P.rect(10, 6, 2, 1, '#e8f8d0'); P.rect(4, 8, 2, 1, '#e8f8d0'); P.rect(10, 8, 2, 1, '#e8f8d0'); P.outline('#0e1a0a'); break;
    }
    icons[name] = P.c.toDataURL();
    return icons[name];
  }

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
