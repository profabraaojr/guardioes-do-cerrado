// Experiência em celulares e tablets: controles de toque, tela cheia, orientação
// horizontal e instalação como aplicativo (PWA) no Android, no iOS e no computador.
GC.Mobile = (function () {
  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  const isTouch = () => mq('(pointer: coarse)') || (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const standalone = () => mq('(display-mode: standalone)') || mq('(display-mode: fullscreen)') || navigator.standalone === true;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canFullscreen = () => { const d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen) && document.fullscreenEnabled !== false; };
  let deferredPrompt = null;
  let rotateDismissed = false;

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; refresh(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; refresh(); GC.HUD && GC.HUD.toast('Jogo instalado! Abra pelo ícone na tela inicial.'); });

  async function enterFullscreen() {
    try {
      const d = document.documentElement;
      if (!fsElement()) {
        if (d.requestFullscreen) await d.requestFullscreen({ navigationUI: 'hide' });
        else if (d.webkitRequestFullscreen) d.webkitRequestFullscreen();
      }
    } catch (e) { /* o navegador recusou: segue sem tela cheia */ }
    try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { /* nem todo navegador permite travar a orientação */ }
  }
  function exitFullscreen() { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
  function toggleFullscreen() { if (fsElement()) exitFullscreen(); else enterFullscreen(); }

  // chamado nos botões que iniciam a partida (gesto do usuário)
  function onStart() {
    GC.Audio.unlock();
    if (isTouch() && !standalone() && canFullscreen()) enterFullscreen();
  }

  function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => { deferredPrompt = null; refresh(); });
      return;
    }
    const panel = document.getElementById('installScreen');
    document.querySelectorAll('#installScreen [data-os]').forEach((el) => (el.hidden = !(el.dataset.os === (isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'))));
    return panel;
  }

  function refresh() {
    const b = document.getElementById('btnInstall');
    if (b) {
      b.hidden = standalone() || !document.querySelector('link[rel="manifest"]');
      b.textContent = isIOS ? 'Instalar no iPhone/iPad' : isAndroid ? 'Instalar no Android' : 'Instalar o jogo';
    }
    const fs = document.getElementById('fsBtn');
    if (fs) fs.hidden = !canFullscreen();
  }

  // aviso para girar o aparelho na vertical (o jogo é horizontal)
  function updateRotate(mode) {
    const el = document.getElementById('rotateHint');
    if (!el) return;
    const portrait = window.innerHeight > window.innerWidth;
    el.hidden = !(isTouch() && portrait && mode === 'play' && !rotateDismissed);
  }

  function registerServiceWorker() {
    // só na versão publicada (que tem manifesto); a publicação em Artifact não usa
    if (!('serviceWorker' in navigator) || !document.querySelector('link[rel="manifest"]')) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  function init() {
    if (isTouch()) document.body.classList.add('touch');
    if (isIOS) document.body.classList.add('ios');
    if (standalone()) document.body.classList.add('standalone');
    const dismiss = document.getElementById('btnRotateDismiss');
    if (dismiss) dismiss.addEventListener('click', () => { rotateDismissed = true; updateRotate(); });
    document.addEventListener('fullscreenchange', refresh);
    refresh();
    registerServiceWorker();
  }

  return { init, onStart, install, toggleFullscreen, updateRotate, refresh, isTouch, isIOS, isAndroid, standalone, get fullscreen() { return !!fsElement(); } };
})();
