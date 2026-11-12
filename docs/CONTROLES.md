# Controles, jogabilidade e ajuste de tela

Este documento registra como a entrada é lida, quais constantes controlam a sensação de plataforma e como a imagem se adapta a cada tela. Todos os números ficam em `src/core/config.js`, de modo que podem ser ajustados (e discutidos em aula) sem mexer na lógica.

## Entrada (`src/core/input.js`)

Teclado, controle e toque escrevem em fontes separadas (`src.key`, `src.pad`, `src.touch`). A cada passo de 1/60 s, `GC.Input.update()` junta as três em um estado por ação, com `down`, `pressed` e `released`; os dois últimos valem um único passo. Toques mais curtos que um quadro ficam registrados em `taps` e não se perdem.

Ações: `left`, `right`, `up`, `down`, `jump`, `tool`, `ally`, `power`, `interact`, `pause`, `confirm`. Não existe ação de troca: cada partida tem um único guardião, escolhido no início (veja abaixo).

Eixos: `GC.Input.axisX` e `axisY`, de −1 a 1. Teclado e cruz valem −1, 0 ou 1. No analógico, abaixo de `DEADZONE` (0,25) o valor é zero e acima dele é reescalado para 0..1. Na horizontal, a velocidade de corrida acompanha a inclinação, com mínimo de `ANALOG_MIN` (35%). Na vertical, ↑ e ↓ só contam a partir de `AXIS_DIGITAL` (0,5), para que um leve toque no analógico não faça o guardião escalar nem interagir.

Remapeamento: a tela **Controles** lista as ações com até três teclas cada. As escolhas ficam em `localStorage['guardioes-teclas']` com número de versão. Uma tecla atribuída a uma ação sai das outras, e uma ação nunca fica sem tecla. O mapa padrão não muda.

Pausa automática: `visibilitychange` (aba em segundo plano) e `gamepaddisconnected` pausam a partida e soltam todas as ações seguradas. Campos de texto ativos não disparam comandos.

## Física do guardião

| Constante | Valor | Efeito |
| --- | --- | --- |
| `STEP` | 1/60 s | passo fixo com acumulador (`main.js`) |
| `RISE_G` / `FALL_MULT` | 1202 / 1,6 | gravidade na subida e multiplicador na queda (≈ 1924) |
| `IMPULSE` | 0,8953 | fator dos impulsos verticais (ver abaixo) |
| `MAX_FALL` | 520 px/s | velocidade máxima de queda |
| `RUN_ACC` / `FRICTION` | 1800 / 2200 px/s² | aceleração e desaceleração no chão |
| `AIR_ACC` / `AIR_FRICTION` | 1080 / 380 px/s² | controle no ar (60% do chão) |
| `JUMP_CUT` | 0,45 | soltar o pulo na subida multiplica a velocidade vertical por este valor |
| `COYOTE` | 0,10 s | tolerância para pular depois de sair da plataforma |
| `BUFFER` | 0,12 s | memória do botão de pulo antes de tocar o chão |
| `CORNER_FIX` | 4 px | se só a beirada da cabeça bate numa quina, o guardião é empurrado de lado |
| `CHAR_PHYS` | Piatã: corre 145, pula 430, escala 82 · Larinha: 125, 351, 54 | atributos de cada guardião |

**Por que `IMPULSE`.** Com gravidade única de 1500, Piatã subia 76,8 px (4,8 tiles), Larinha 51,2 px (3,2 tiles), e o pulo completo durava 0,64 s para Piatã. Uma queda mais pesada encurtaria o alcance em cerca de 10% e quebraria saltos calibrados no Capítulo 1. A gravidade de subida (`RISE_G`) e o fator `IMPULSE` foram calculados para manter a mesma altura máxima e o mesmo tempo no ar:

- tempo de subida `t' = 2·t₀ / (1 + 1/√1,6)`;
- `RISE_G = 1500 · (t₀/t')²`;
- `IMPULSE = (RISE_G/1500) · (t'/t₀)`.

Uma simulação determinística, que comparou a versão anterior com a atual nas mesmas entradas, confirmou o resultado: altura máxima 80,8 contra 80,5 px (Piatã) e 54,5 contra 54,2 px (Larinha), com o mesmo número de quadros no ar e o mesmo alcance (96,7 e 68,7 px). A saliência de 4 tiles continua alcançável só por Piatã. O pulo curto ficou um pouco mais baixo (38 contra 41 px), o que dá mais precisão ao toque rápido.

Os impulsos fixos do código (topo do paredão, topo do cipó, soltar do cipó, recuo ao levar dano) também passam por `IMPULSE`. Natação, escalada, deslize e cipós mantêm as próprias constantes.

## Câmera (`game.followCam`)

- Zona morta horizontal de ±`CAM_DEADZONE` (20 px) em torno do centro.
- Avanço de `CAM_LOOK` (36 px) na direção do movimento; parado, metade disso para o lado em que o guardião olha.
- A vertical acompanha mais devagar (`CAM_LERP_Y`) e se reposiciona ao pousar. No ar, só se move se o guardião sair da faixa central (`CAM_BAND`).
- Escalando, nadando ou no cipó, a câmera acompanha continuamente, para não esconder o paredão nem o guardião submerso.
- Na arena do Colosso, a câmera fica centrada como antes.

## Retorno visual

- Tremor de tela: `SHAKE_PUNCH` (Soco da Terra), `SHAKE_BEAM` (Feixe do Satélite) e `SHAKE_BLAST` (impactos fortes e chefes).
- Hit stop: `HITSTOP_BOSS` (3 quadros) ao acertar um núcleo do Colosso ou neutralizar a draga.
- Partículas leves ao pousar de quedas pequenas e ao disparar sementes.

## Ajuste de tela (`resize` em `src/game/main.js`)

- A altura lógica é fixa em 270 unidades. A largura vai de `W_MIN` (480, 16:9) a `W_MAX` (630, 21:9) conforme a proporção da tela, e só depois disso aparecem faixas. Telas mais altas que 16:9, como 16:10 e 4:3, recebem faixas finas em cima e embaixo, porque os planos de fundo têm altura fixa. As passagens secretas não aparecem com a tela mais larga, porque são tiles falsos desenhados como rocha.
- Na arena do Colosso, desenhada com 480 de largura, o excedente fica coberto por faixas laterais.
- A ampliação é inteira em pixels físicos (`devicePixelRatio`) quando ocupa ao menos `INT_SCALE_MIN` (88%) do espaço disponível. Caso contrário, é fracionária com `image-rendering: pixelated`. O canvas interno mantém a densidade da arte (2 pixels por unidade).
- O palco é recalculado em `resize`, `orientationchange` e `visualViewport.resize`. As margens respeitam `env(safe-area-inset-*)` nos quatro lados.
- Tela cheia ao iniciar a partida no toque. A trava de orientação horizontal só é pedida no Android; no iPhone, a tela cheia vem da instalação na Tela de Início (PWA).

## Um guardião por partida

A escolha feita em "Novo jogo" fica gravada no salvamento (`save.char`), e "Continuar" segue com o mesmo guardião. Só o escolhido aparece em campo. O parceiro participa da história pelo rádio da EcoPack: nos diálogos, o retrato dele recebe tom verde, linhas de transmissão e a etiqueta "rádio". Falas que só fazem sentido para um dos guardiões usam o campo `only: 'piata' | 'larinha'` em `src/data/dialogs.js`.

Cada trecho do Capítulo 1 tem uma solução para cada guardião:

| Trecho | Piatã | Larinha |
| --- | --- | --- |
| Barranco com solo degradado | salta direto (ou planta uma muda com sementes) | agachada (↓), irriga o solo com o jato: as sementes adormecidas brotam e a muda vira degrau |
| Focos de incêndio | Soco da Terra sobre a chama (terra abafa o fogo) | purificador (jato d'água) |
| Mariposas de fuligem | apagado o fogo, a fuligem assenta e elas se recuperam sozinhas | jato d'água lava a fuligem |
| Cerca elétrica | Soco da Terra derruba o gerador do terminal | desliga no terminal |
| Cupinzeiro do tamanduá | chama o tamanduá | também chama, com orientação de Piatã pelo rádio |
| Riacho contaminado | sementes desligam o poluidor; o riacho se limpa sozinho | jato desliga o poluidor e limpa a água |
| Draga: mangueiras | sementes (de longe, ou pulando e mirando para baixo) | Feixe do Satélite |
| Draga: vapor de mercúrio | Soco da Terra perto da nuvem: o tremor espalha o vapor | jato d'água ou Feixe |
| Draga: painel | Soco da Terra no painel | desliga no painel |
| Comporta: alavanca alta | salto alto | o drone (Aliado) puxa com a garra |
| Comporta: trava eletrônica | Soco da Terra | terminal |
| Colosso: escudos | fazer o robô investir contra a pedra (fica 3,6 s atordoado) | drone (Aliado) ou a mesma batida na pedra |
| Colosso: núcleos | sementes (a uns 70 px do corpo, ou do galho mirando para baixo) | Feixe do Satélite (2,5 por acerto) ou jato |
| Fogo na arena | Soco da Terra | purificador |

## Testes

Os testes com Playwright cobrem as rotas acima com cada guardião (18 verificações, por teclado) e também: coyote time, memória de pulo, tolerância de quina, zona morta e velocidade proporcional do analógico, botão A do controle, remapeamento persistente, pausa automática (foco e controle), o teclado no computador e as resoluções 360×640, 390×844, 412×915, 768×1024, 1366×768 e 1920×1080 nas duas orientações.
