#!/usr/bin/env python3
"""Monta a versão do jogo para o GitHub Pages na pasta _site/.

O index.html do projeto é escrito sem <!doctype>, <html>, <head> e <body>, porque a
publicação em Artifact acrescenta esse esqueleto sozinha. Para o GitHub Pages, este
script embala o mesmo conteúdo num documento HTML completo (doctype, viewport para
celular, reset mínimo e cartão de compartilhamento) e copia os arquivos do jogo.
Nada no projeto original é alterado.

Uso:  python3 tools/build_pages.py   (gera _site/)
"""
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
<style>
  /* reset equivalente ao esqueleto da publicação em Artifact */
  :root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box; }
  body { margin: 0; font: 14px system-ui, sans-serif; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
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
    n = sum(len(fs) for _, _, fs in os.walk(SAIDA))
    print(f'_site/ pronto: {n} arquivos')


if __name__ == '__main__':
    main()
