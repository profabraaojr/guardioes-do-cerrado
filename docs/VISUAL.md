# Revisão visual: estilo misto Metal Slug × Super Mario World

## Decisões

- **Resolução dobrada sem mexer na lógica.** O mundo continua simulado em unidades de 16 (mesma física, colisões, fase e progressão). Só a renderização passou a 960×540 (`GC.CFG.SCALE = 2`), com arte em densidade dupla: tiles de 32 px e personagens em quadros de 64×64.
- **Veículo:** caminhonete do descartador com caçamba lançadora, sem canhão (diretriz de confronto não letal).
- **Tucano:** tucanuçu (*Ramphastos toco*), espécie do Cerrado.

## Pipeline de spritesheets

| Arquivo | Função |
| --- | --- |
| `src/gfx/pixel.js` | kit de desenho em pixel: elipse, cápsula, polígono, contorno e luz superior |
| `src/gfx/puppet.js` | boneco articulado (Piatã, Larinha, infratores, Dona Cida e Rafael) com poses por ângulo de articulação |
| `src/gfx/sheets.js` | registro, montagem de atlas, carregamento de PNG/JSON, pivô e desenho |
| `src/gfx/flora.js` | árvores (pequizeiro, ipê, buriti, lobeira, cagaita) e elementos de cenário |
| `src/gfx/fauna_art.js` | fauna e insetos |
| `src/gfx/objects_art.js` | serra-robô, drone-sentinela, caminhonete, fogo, itens e efeitos |
| `tools/export-sprites.js` | exporta tudo para `assets/sprites/*.png` + `*.json` + `manifest.json` |

No início, o jogo carrega `assets/sprites/<nome>.png` e `.json`. Se um arquivo não existir (por exemplo, ao abrir o jogo direto do disco), monta o atlas a partir do código. **Para trocar a arte, edite o PNG mantendo a grade de quadros**: o jogo passa a usar a versão editada. O JSON traz `frameWidth`, `frameHeight`, `pivot` (pé do personagem), `scale` e, para os personagens, `hitbox` em pixels de arte.

Para reexportar depois de mudar o código das folhas:

```bash
python3 -m http.server 8765 &
node tools/export-sprites.js
```

## Conteúdo por folha

| Folha | Quadro | Animações |
| --- | --- | --- |
| piata, larinha | 64×64 | idle 4, walk 8, run 8, jump 2, fall 2, tool 3, hurt 2, death 4, victory 4, climb 4, swim 4, slide 2, crouch 4 |
| traficante, cacador, descartador, garimpeiro, cida, rafael | 64×64 | idle, walk, run, alert, throw, hands, slip, crouch, talk |
| ema | 64×80 | idle, walk, run |
| seriema | 48×64 | idle, walk, call |
| tamandua | 80×48 | idle, walk, dig |
| lobo (lobo-guará) | 72×64 | idle, trot |
| tucano (tucanuçu) | 48×40 | perch, fly |
| cateto | 48×32 | idle, walk |
| veado (veado-campeiro) | 64×56 | graze, alert, run |
| tatu (tatu-canastra) | 56×32 | idle, walk, dig |
| arara | 48×40 | fly, perch |
| insetos | 16×16 | 3 borboletas, mariposa de fuligem, libélula |
| serra | 64×56 | idle, walk, attack, off |
| drone | 48×32 | fly, off |
| van | 112×72 | idle (rodas), dump (caçamba), jammed |
| fogo | 32×40 | burn 6 |
| itens | 24×24 | seed, rare, fruit, heartUp |
| brilho | 32×32 | sparkle (coleta), dust (pouso) |
| trees | 128×160 | pequi, ipe, buriti, lobeira, cagaita (balanço) |
| scenery | 32×32 | tufos, capim-dourado, arbustos, flores, pedras, primeiro plano |

## Comportamentos da fauna (`src/entities/fauna2.js`)

| Animal | Comportamento |
| --- | --- |
| Ema, lobo-guará | passeiam e fogem correndo quando alguém se aproxima ou corre por perto |
| Veado-campeiro | pasta, fica em alerta a média distância e sai saltando |
| Catetos | bando de três que fuça o chão e se afasta junto |
| Tatu-canastra | anda devagar, cava e some por alguns segundos quando incomodado |
| Tucanuçu | pousa no alto do ipê e voa para outro poleiro |
| Araras | par cruzando o céu |
| Borboletas e libélulas | enxames de ambiente perto de flores e da água |

Cada espécie nova tem registro no Guia de Campo (observação parado à distância).

## Cenário, água e HUD

- **Tiles** (`src/world/tiles.js`): paletas saturadas por ambiente, solo de laterita com pedras e raízes sob a grama, borda de grama arredondada, madeira com veios, pregos e corda, pedra com fissuras e apoios de escalada.
- **Parallax** (`src/world/background.js`): céu em faixas com nuvens arredondadas, chapadas, morros, mata distante (ipês, buritis, cupinzeiros) e capim dourado. O primeiro plano tem tufos à frente do jogador.
- **Água** (`src/world/level.js`): profundidade em camadas, ondas em meio pixel e reflexo ondulado do cenário.
- **Túneis**: fundo de terra escura em vez de céu.
- **HUD** (`index.html`, `src/game/hud.js`, `css/style.css`): painéis com o acabamento dos diálogos, ícones em pixel art, barra de água com estados (Cheia, Média, Baixa, Vazia) e painel fixo da zona com título e subtítulo.

## O que ainda precisa de ajuste

- Entidades de outras zonas ainda na densidade antiga: capivara, onça, jacaré, sucuri, ariranha, perereca, poluidor, lodo, Colosso, draga, gaiola, placas, marcos de trilha, posto de brigada, terminal, alavanca e comporta.
- Os textos do HUD, menus e avisos usam fonte vetorial (Pixelify Sans). Só os diálogos usam a fonte bitmap.
- A arte é gerada por código. Um ilustrador pode refinar os PNGs exportados, mantendo a grade e o pivô, sem tocar no código.
- Em túneis cobertos por tábuas (saída da toca do tamanduá), uma coluna ainda mostra o céu ao fundo.
- O plugin SpriteCook foi instalado, mas não conectou: a rede do ambiente recusou a conexão. Se for liberado, os PNGs gerados por ele podem substituir os de `assets/sprites/` seguindo o mesmo JSON.
