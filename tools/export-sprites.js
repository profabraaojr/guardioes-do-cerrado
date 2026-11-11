// Exporta todas as spritesheets do jogo para assets/sprites/<nome>.png + <nome>.json.
// Uso (na raiz do projeto, com um servidor local ativo na porta 8765):
//   python3 -m http.server 8765 &
//   node tools/export-sprites.js
// Requer o Playwright instalado (o ambiente de desenvolvimento já o fornece).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const url = process.argv[2] || 'http://localhost:8765/index.html';
  const out = path.join(__dirname, '..', 'assets', 'sprites');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(url + '?export=1');
  await p.waitForFunction(() => window.GC && GC.Sheets && GC.spriteSource);
  const all = await p.evaluate(() => GC.Sheets.exportAll());
  const manifest = [];
  for (const [name, { png, json }] of Object.entries(all)) {
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(png.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(json, null, 2));
    const frames = Object.values(json.animations).reduce((n, a) => n + a.frames.length, 0);
    manifest.push({ name, frames, frameSize: json.frameWidth + 'x' + json.frameHeight, animations: Object.keys(json.animations) });
  }
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(manifest.map((m) => `${m.name}: ${m.frames} quadros (${m.frameSize}) · ${m.animations.join(', ')}`).join('\n'));
  await b.close();
})();
