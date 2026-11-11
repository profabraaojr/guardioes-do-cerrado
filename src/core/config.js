// Guardiões do Cerrado — configuração global
// Todos os módulos compartilham o namespace GC (carregados como scripts clássicos,
// o que permite abrir o jogo direto do disco, sem servidor).
window.GC = window.GC || {};

GC.CFG = {
  W: 480,            // resolução interna (pixel art)
  H: 270,
  TILE: 16,
  STEP: 1 / 60,      // passo fixo da simulação

  // Física do guardião (px/s e px/s²)
  GRAVITY: 1500,
  MAX_FALL: 520,
  RUN_ACC: 1700,
  RUN_MAX: 135,
  SNEAK_MAX: 48,
  AIR_ACC: 1150,
  FRICTION: 1700,
  JUMP_V: 410,
  JUMP_CUT: 0.45,
  COYOTE: 0.1,
  BUFFER: 0.13,
  CLIMB_SPEED: 72,
  WALLJUMP_VX: 170,
  WALLJUMP_VY: 360,
  SWIM_GRAV: 260,
  SWIM_MAX: 95,
  SWIM_STROKE: 175,
  SLIDE_SPEED: 230,
  SLIDE_TIME: 0.42,
  STEP_UP: 7,

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
