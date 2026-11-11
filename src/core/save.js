// Progresso salvo no navegador. Toda leitura e escrita é protegida, pois o
// armazenamento pode estar bloqueado (janela anônima, prévias etc.).
GC.Save = (function () {
  const KEY = GC.CFG.SAVE_KEY;
  function blank() {
    return {
      version: 1,
      level: 'fase1',
      checkpoint: null,        // {id, x, y}
      guide: [],               // ids do Guia de Campo descobertos
      allies: {},              // arara, tamandua, capivara, onca
      tools: { seed: true, water: false },
      rares: [],               // sementes raras encontradas
      maxHearts: GC.CFG.HEARTS,
      collected: [],           // ids de itens únicos já coletados
      flags: {},
      stats: { seeds: 0, planted: 0, fires: 0, machines: 0, cleaned: 0, rescued: 0, deaths: 0, time: 0 },
      completed: [],
      best: {}
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return Object.assign(blank(), d, { stats: Object.assign(blank().stats, d.stats || {}) });
    } catch (e) { return null; }
  }
  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  // O Guia de Campo é mantido mesmo ao iniciar um novo jogo
  function loadGuideOnly() {
    const d = load();
    return d ? d.guide.slice() : [];
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }
  return { blank, load, write, clear, loadGuideOnly };
})();
