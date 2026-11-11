# Guardiões do Cerrado: a jornada de Piatã e Larinha

Jogo de plataforma 2D com rolagem lateral, ambientado em Rondonópolis (MT). Esta é a primeira versão jogável: o **Capítulo 1 · O chamado de Rondonópolis** completo, com dois protagonistas alternáveis, fauna e flora interativas, desafios ambientais, cooperação obrigatória em alguns trechos e um chefe final.

O jogo usa HTML5 Canvas e JavaScript puro, sem dependências nem etapa de compilação.

## Jogar online

**https://profabraaojr.github.io/guardioes-do-cerrado/**

Funciona no navegador do computador (teclado ou controle) e do celular (controles de toque). Nada precisa ser instalado. A cada envio para a branch `main`, o GitHub Actions publica a nova versão automaticamente (`.github/workflows/pages.yml`).

## Como jogar

Abra `index.html` em um navegador moderno. Para evitar restrições de arquivos locais, prefira um servidor simples:

```bash
cd guardioes-do-cerrado
```

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

| Ação | Teclado | Toque |
| --- | --- | --- |
| Andar | ← → ou A D | direcional |
| Pular, nadar | Espaço, K, Z | Pular |
| Escalar | direção contra o paredão, ↑ ↓ | direcional |
| Deslizar / andar abaixado | ↓ correndo / segurar ↓ | direcional |
| Usar ferramenta | J, X (↑ mira para cima) | Usar |
| Trocar personagem | L, C | Trocar |
| Aliado | Q, V | Aliado |
| Poder especial | F, B | Poder |
| Interagir | ↑ ou E | direcional ↑ |
| Pausa | Esc, P | botão II |

O jogo também aceita gamepad. O progresso é salvo no navegador a cada marco de trilha (fita amarela).

## O Capítulo 1

| Zona | Referência real | Mecânicas introduzidas |
| --- | --- | --- |
| Margens do Rio Vermelho | Rio Vermelho e Parque das Águas | movimento, natação, resgate da arara, sementes, plantio em solo degradado |
| Trilha do Cerrado | Parque Estadual Dom Osório Stoffel | rampa e deslize, focos de incêndio, observação, tamanduá, cerca do Projeto Horizonte (terminal), cipó |
| Cachoeiras do Carimã | Complexo turístico do Carimã | escalada de paredão, riacho contaminado, capivara (fôlego), jacaré, sucuri, túnel submerso |
| Cidade de Pedra | Parque Ecológico João Basso e arte rupestre | caverna escura, cipó vertical, lodo do garimpo, chefe da draga clandestina, território da onça, comporta com duas travas |
| Clareira do Colosso | frente de desmatamento ilegal fictícia | chefe em três fases (robô experimental do Projeto Horizonte), com a participação da onça-pintada |

### Cooperação entre Piatã e Larinha

| | Piatã | Larinha |
| --- | --- | --- |
| Ferramenta | sementes nativas: travam máquinas e brotam no solo degradado | purificador da EcoPack: apaga fogo e limpa água |
| Aliado (Q) | Ler a trilha: revela passagens escondidas (a arara amplia o efeito) | drone de análise: expõe pontos frágeis e desliga escudos |
| Exclusivo | salto alto (alcança saliências de 4 tiles), salto entre paredões, chamar o tamanduá | terminais do Projeto Horizonte, lanterna mais forte nas cavernas |

Poderes especiais (tecla F): **Soco da Terra** (Piatã) e **Feixe do Satélite** (Larinha). Ver `docs/PODERES.md`.

Trechos que exigem os dois: a cerca elétrica (terminal), a comporta (alavanca alta + terminal), o riacho do Carimã (sementes no poluidor + purificador na água) e o chefe (drone derruba os escudos, sementes travam as válvulas, purificador apaga as queimadas).

## Arquitetura

```
index.html            página, HUD (DOM), telas e controles de toque
css/style.css         interface responsiva (paisagem e retrato)
src/core/             configuração, utilidades, entrada, áudio procedural, salvamento
src/data/             Guia de Campo, personagens, diálogos
src/world/            tiles, estrutura de fase, fundos em paralaxe, fases (levels/)
src/gfx/              spritesheets (boneco articulado, flora, fauna, objetos), fonte bitmap, retratos
assets/sprites/       PNG + JSON exportados (editáveis; o jogo os carrega no início)
tools/                exportação das spritesheets
src/entities/         física, guardião, projéteis, objetos, fauna, máquinas, Colosso
src/entities/antagonists/  registro modular, infratores, criaturas, chefes (draga)
src/game/             diálogos (canvas), HUD, núcleo da partida, orquestração
```

Os módulos são scripts clássicos que compartilham o namespace `GC`, o que permite abrir o jogo sem servidor e publicá-lo como página estática.

Pontos principais:

- **Física** (`entities/physics.js`): colisão por eixos separados contra o mapa de tiles, plataformas de mão única, rampas de 45° e tolerância de degrau.
- **Guardião** (`entities/player.js`): máquina de estados (normal, deslize, escalada, cipó vertical, balanço, natação, morte), com atributos que mudam conforme o personagem ativo.
- **Fases** (`world/levels/fase1.js`): descritas por um construtor declarativo (`ground`, `water`, `slopeDown`, `ent`, `zone`...). Uma nova fase é um novo arquivo registrado em `GC.Levels`.
- **Entidades**: cada tipo é uma classe em `GC.Ent`, instanciada pelo nome usado em `B.ent('tipo', x, y, opções)`.
- **Diálogos** (`game/dialogui.js`, `gfx/font.js`, `gfx/portraits.js`): canvas próprio em resolução física, com fator de escala inteiro, fonte bitmap com acentuação do português, quebra automática de linhas, paginação e retratos 40×40 com expressões.
- **Áudio** (`core/audio.js`): efeitos e trilha gerados com Web Audio, sem arquivos externos.

### Como adicionar uma fase

1. Crie `src/world/levels/faseN.js` registrando `GC.Levels.faseN = { id, name, width, height, build(B) { ... } }`.
2. Inclua o script em `index.html` antes de `src/gfx/sprites.js`.
3. Ajuste `startGame()` em `src/game/main.js` para escolher a fase.

## Documentação complementar

- `docs/NARRATIVA.md`: personagens, diretrizes narrativas e padrão visual dos diálogos.
- `docs/VISUAL.md`: revisão visual, pipeline de spritesheets e pendências.
- `docs/ANTAGONISTAS.md`: sistema de antagonistas (humanos, criaturas, máquinas e chefes) e como estendê-lo.
- `docs/PESQUISA.md`: fontes consultadas para os lugares e as espécies.
