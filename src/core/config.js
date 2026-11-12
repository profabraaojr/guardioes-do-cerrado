// Guardiões do Cerrado — configuração global
// Todos os módulos compartilham o namespace GC (carregados como scripts clássicos,
// o que permite abrir o jogo direto do disco, sem servidor).
window.GC = window.GC || {};

GC.CFG = {
  W: 480,            // largura do mundo visível (unidades lógicas)
  H: 270,
  SCALE: 2,          // densidade da arte: tela de 960×540, 1 unidade = 2 pixels
  TILE: 16,
  STEP: 1 / 60,      // passo fixo da simulação

  // Tela: a altura lógica é fixa (270). A largura cresce de 480 (16:9) até 630 (21:9)
  // em telas mais compridas, mostrando mais cenário dos lados; além disso, faixas.
  W_MIN: 480,
  W_MAX: 630,
  INT_SCALE_MIN: 0.88, // usa ampliação inteira (pixel art nítida) se ela ocupar ao menos 88% do espaço

  // ——— Física do guardião (px/s e px/s²) ———
  // A queda usa gravidade 1,6× maior que a subida. Para não alterar os saltos já
  // calibrados no Capítulo 1, a gravidade de subida e os impulsos foram recalculados:
  // a altura máxima e o tempo no ar (e, portanto, o alcance) continuam os mesmos da
  // versão com gravidade única de 1500. Ver docs/CONTROLES.md.
  GRAVITY: 1500,       // gravidade de referência (criaturas, objetos e a versão anterior)
  RISE_G: 1202,        // gravidade do guardião subindo
  FALL_MULT: 1.6,      // multiplicador na queda (1202 × 1,6 ≈ 1924)
  IMPULSE: 0.8953,     // fator aplicado aos impulsos verticais para manter as alturas
  MAX_FALL: 520,
  RUN_ACC: 1800,       // aceleração no chão
  FRICTION: 2200,      // desaceleração no chão (sem direção)
  AIR_ACC: 1080,       // aceleração no ar (60% do chão)
  AIR_FRICTION: 380,   // desaceleração no ar sem direção
  SNEAK_MAX: 48,
  JUMP_V: 367,         // impulso genérico (cipó, superfície da água): 410 × IMPULSE
  JUMP_CUT: 0.45,      // soltar o pulo na subida multiplica a velocidade vertical por isto
  COYOTE: 0.1,         // tolerância depois de sair da plataforma (s)
  BUFFER: 0.12,        // memória do botão de pulo antes de tocar o chão (s)
  CORNER_FIX: 4,       // px: se a cabeça raspar numa quina, empurra de lado em vez de cortar o pulo
  CLIMB_SPEED: 72,
  WALLJUMP_VX: 170,
  WALLJUMP_VY: 322,    // 360 × IMPULSE
  SWIM_GRAV: 260,
  SWIM_MAX: 95,
  SWIM_STROKE: 175,
  SLIDE_SPEED: 230,
  SLIDE_TIME: 0.42,
  STEP_UP: 7,
  ANALOG_MIN: 0.35,    // fração mínima da velocidade com o analógico pouco inclinado

  // Atributos de cada guardião (lidos por src/data/characters.js)
  CHAR_PHYS: {
    piata: { run: 145, jump: 430, climb: 82, wallJump: true },    // pulo 480 × IMPULSE: 4,8 tiles de altura
    larinha: { run: 125, jump: 351, climb: 54, wallJump: false }  // pulo 392 × IMPULSE: 3,2 tiles
  },

  // Câmera
  CAM_DEADZONE: 20,    // px: meia-largura da zona morta horizontal
  CAM_LOOK: 36,        // px: avanço na direção do movimento
  CAM_LERP_X: 7,
  CAM_LERP_Y: 3.2,     // vertical mais lenta; no ar só acompanha se o guardião sair da faixa
  CAM_BAND: 0.26,      // faixa vertical livre (fração da altura, acima e abaixo do centro)

  // Retorno visual
  HITSTOP_BOSS: 3,     // quadros congelados ao acertar o chefe
  SHAKE_PUNCH: 2.5,
  SHAKE_BEAM: 3.5,
  SHAKE_BLAST: 4,

  // Entrada
  DEADZONE: 0.25,      // zona morta do analógico
  AXIS_DIGITAL: 0.5,   // inclinação vertical que conta como ↑/↓ (evita escalar ou interagir sem querer)

  // Recursos
  HEARTS: 5,
  BREATH: 8,          // segundos de fôlego submerso
  WATER_TANK: 100,
  WATER_USE: 24,      // unidades por segundo de jato
  WATER_REFILL: 70,
  SEED_COOLDOWN: 0.22,
  ALLY_COOLDOWN: 9,
  REVEAL_TIME: 8,
  OBSERVE_TIME: 1.0,
  INVULN: 1.2,

  SAVE_KEY: 'guardioes-cerrado-v1'
};
