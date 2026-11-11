#!/usr/bin/env python3
"""Monta a versão do jogo para o GitHub Pages na pasta _site/.

O index.html do projeto é escrito sem <!doctype>, <html>, <head> e <body>, porque a
publicação em Artifact acrescenta esse esqueleto sozinha. Para o GitHub Pages, este
script embala o mesmo conteúdo num documento HTML completo (doctype, viewport para
celular, reset mínimo e cartão de compartilhamento) e copia os arquivos do jogo.
Nada no projeto original é alterado.

Uso:  python3 tools/build_pages.py   (gera _site/)
"""
import hashlib
import json
import os
import shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, '_site')
COPIAR = ['css', 'src', 'assets']

CABECALHO = """<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#15110c">
<meta property="og:title" content="Guardiões do Cerrado">
<meta property="og:description" content="Plataforma 2D de aventura ambiental em Rondonópolis (MT): a jornada de Piatã e Larinha pelo Cerrado.">
<meta property="og:image" content="preview.png">
<meta property="og:type" content="website">
<link rel="icon" href="favicon.png" type="image/png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Guardiões">
<style>
  /* reset equivalente ao esqueleto da publicação em Artifact */
  :root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box; }
  body { margin: 0; font: 14px system-ui, sans-serif; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
"""


# Service worker: guarda o jogo para uso sem internet. A versão muda sempre que algum
# arquivo muda, e o cache antigo é descartado: quem instalou recebe a atualização.
SW = """// gerado por tools/build_pages.py
const CACHE = 'guardioes-__VERSAO__';
const ARQUIVOS = __ARQUIVOS__;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // fontes do Google: rede primeiro, cópia em cache para uso sem internet
  if (url.origin !== location.origin) { e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req))); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })));
});
"""


def main():
    if os.path.exists(SAIDA):
        shutil.rmtree(SAIDA)
    os.makedirs(SAIDA)
    for pasta in COPIAR:
        shutil.copytree(os.path.join(RAIZ, pasta), os.path.join(SAIDA, pasta))
    corpo = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
    # o charset já vai no cabeçalho; a linha duplicada do arquivo original é removida
    corpo = corpo.replace('<meta charset="utf-8">\n', '', 1)
    with open(os.path.join(SAIDA, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(CABECALHO + corpo + '\n</html>\n')
    prev = os.path.join(RAIZ, 'docs', 'previews', 'trilha-piata.png')
    if os.path.exists(prev):
        shutil.copy(prev, os.path.join(SAIDA, 'preview.png'))
    shutil.copy(os.path.join(RAIZ, 'assets', 'favicon.png'), os.path.join(SAIDA, 'favicon.png'))
    open(os.path.join(SAIDA, '.nojekyll'), 'w').close()
    # aplicativo instalável (PWA): manifesto e service worker para jogar sem internet
    manifesto = {
        'name': 'Guardiões do Cerrado', 'short_name': 'Guardiões', 'lang': 'pt-BR',
        'description': 'Aventura em plataforma 2D pelo Cerrado de Rondonópolis (MT), com Piatã e Larinha.',
        'start_url': './', 'scope': './', 'display': 'fullscreen', 'display_override': ['fullscreen', 'standalone'],
        'orientation': 'landscape', 'background_color': '#15110c', 'theme_color': '#15110c', 'categories': ['games', 'education'],
        'icons': [
            {'src': 'assets/icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'assets/icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'assets/icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}
        ]
    }
    with open(os.path.join(SAIDA, 'manifest.webmanifest'), 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=2)
    arquivos, h = [], hashlib.sha1()
    for dp, _, fs in os.walk(SAIDA):
        for nome in sorted(fs):
            caminho = os.path.join(dp, nome)
            rel = os.path.relpath(caminho, SAIDA).replace(os.sep, '/')
            if rel in ('.nojekyll', 'sw.js'):
                continue
            arquivos.append(rel)
            h.update(rel.encode()); h.update(open(caminho, 'rb').read())
    versao = h.hexdigest()[:10]
    with open(os.path.join(SAIDA, 'sw.js'), 'w', encoding='utf-8') as f:
        f.write(SW.replace('__VERSAO__', versao).replace('__ARQUIVOS__', json.dumps(['./'] + sorted(arquivos), ensure_ascii=False)))
    n = sum(len(fs) for _, _, fs in os.walk(SAIDA))
    print(f'_site/ pronto: {n} arquivos')


if __name__ == '__main__':
    main()
