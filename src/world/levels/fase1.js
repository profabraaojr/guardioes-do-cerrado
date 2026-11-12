// CAPÍTULO 1 · O CHAMADO DE RONDONÓPOLIS
// Percurso: margens do Rio Vermelho → trilha do Parque Estadual Dom Osório Stoffel
// → Cachoeiras do Carimã → Cidade de Pedra (Parque Ecológico João Basso) → clareira do Colosso.
// Coordenadas em tiles (16 px). A linha "y" das entidades é a do chão onde se apoiam.
GC.Levels.fase1 = {
  id: 'fase1',
  name: 'O chamado de Rondonópolis',
  chapter: 'Capítulo 1',
  width: 400,
  height: 40,
  build(B) {
    const T = GC.T;
    const seeds = (x0, x1, y, step = 2) => { for (let x = x0; x <= x1; x += step) B.ent('pickup', x, y, { kind: 'seed', lift: 6 }); };

    // ——— ZONAS ———
    B.zone({ id: 'rio', name: 'Margens do Rio Vermelho', sub: 'Rondonópolis · Parque das Águas', x0: 0, x1: 67, theme: 'rio', guide: 'rioVermelho' });
    B.zone({ id: 'trilha', name: 'Trilha do Cerrado', sub: 'Parque Estadual Dom Osório Stoffel', x0: 68, x1: 167, theme: 'cerrado', guide: 'domOsorio' });
    B.zone({ id: 'carima', name: 'Cachoeiras do Carimã', sub: 'Circuito de quedas d\'água', x0: 168, x1: 267, theme: 'carima', ambient: 'water', guide: 'carima' });
    B.zone({ id: 'pedra', name: 'Cidade de Pedra', sub: 'Parque Ecológico João Basso', x0: 268, x1: 360, theme: 'pedra', guide: 'cidadePedra' });
    B.zone({ id: 'clareira', name: 'Clareira do Colosso', sub: 'Frente de desmatamento ilegal do Projeto Horizonte', x0: 361, x1: 399, theme: 'boss', music: 'boss', ambient: 'none' });

    // ═══ A · MARGENS DO RIO VERMELHO ═══
    B.fill(0, 0, 1, 39, T.ROCK);
    B.ground(2, 21, 28);
    B.startAt(5, 28);
    B.ent('talk', 6, 28, { id: 'start' });
    B.ent('tatu', 3, 28, { x0: 2, x1: 11 });
    B.ent('plant', 11, 28, { kind: 'cagaita' });
    B.ent('araraVoo', 0, 28, { x0: 0, x1: 66, lift: 150 });
    B.ent('insetos', 22, 28, {});
    B.ent('insetos', 38, 28, { kind: 'libelula' });
    B.ent('sign', 8, 28, { title: 'Bem-vindos, guardiões', text: 'Teclado: ← → para andar, ESPAÇO para pular, J para a ferramenta, Q para o aliado, F para o poder especial.\nToque: direcional à esquerda; Pular, Usar, Poder e Aliado à direita.\nCada guardião vence os desafios do seu jeito: Piatã salta mais alto e escala rápido; Larinha opera terminais e tem o purificador de água.' });
    B.ground(13, 17, 26);
    seeds(13, 15, 26);
    B.fill(16, 24, 17, 25, T.CRACKED);
    B.ent('pickup', 16, 26, { kind: 'seed', lift: 6 });
    B.ent('talk', 12, 28, { id: 'poderes' });
    B.ent('plant', 19, 28, { kind: 'ipe' });
    // vão
    B.ground(24, 30, 28);
    B.ent('sign', 26, 28, { title: 'Rio Vermelho', guide: 'rioVermelho', text: 'O Rio Vermelho atravessa Rondonópolis e pertence à bacia do rio Paraguai, que abastece o Pantanal. O que acontece aqui chega lá embaixo.' });
    // rio e píer
    B.ground(31, 46, 33, T.SAND, T.DIRT);
    B.water(31, 28, 46, 32);
    B.fill(31, 27, 37, 27, T.PLANK);
    B.ent('cage', 36, 27);
    B.ent('traficante', 33, 27, { x0: 31, x1: 35 });
    B.ent('talk', 28, 28, { id: 'traficante' });
    seeds(39, 45, 31, 3);
    B.ground(47, 63, 28);
    B.ent('checkpoint', 49, 28, { id: 'cpA' });
    B.ent('plant', 51, 28, { kind: 'buriti' });
    B.ent('sign', 53, 28, { title: 'Observar a natureza', text: 'Fique parado perto de plantas e animais marcados com um brilho verde para registrá-los no Guia de Campo. Larinha fotografa; Piatã observa os detalhes.' });
    B.ent('talk', 54, 28, { id: 'machines' });
    B.ent('chainsaw', 57, 28, { x0: 54, x1: 61 });
    // solo degradado e barranco: Piatã sobe direto; Larinha irriga o solo e a muda vira degrau
    B.fill(58, 28, 61, 28, T.DEGRADED);
    B.ground(62, 80, 24);
    B.ent('talk', 59, 28, { id: 'ledge' });
    // esconderijo dentro do barranco (raro 1)
    B.fill(62, 25, 66, 27, T.FAKE);
    B.ent('pickup', 65, 28, { kind: 'rare', id: 'rare1' });

    // ═══ B · TRILHA DO CERRADO ═══
    B.ent('station', 71, 24);
    B.fill(79, 22, 80, 23, T.CRACKED);
    B.ent('pickup', 79, 24, { kind: 'fruit', lift: 4 });
    B.ent('lobo', 64, 24, { x0: 62, x1: 69 });
    B.ent('sign', 74, 24, { title: 'Posto de brigada', guide: 'domOsorio', text: 'Parque Estadual Dom Osório Stoffel: área protegida de Cerrado vizinha ao Rio Vermelho.\nBrigada mantida por produtores rurais da região e voluntários. Há focos de incêndio na trilha: Larinha apaga o fogo com o purificador (botão Usar). Recarregue em água limpa ou aqui no posto.' });
    B.ent('npc', 77, 24, { dialog: 'brigada', who: 'cida', guides: ['reservaLegal', 'ilpf'], repeat: 'O posto fica aberto. Água não falta para quem cuida da mata.' });
    B.slopeDown(81, 24, 4);
    B.ground(85, 107, 28);
    B.ent('veado', 86, 28, { x0: 85, x1: 94 });
    B.ent('sign', 86, 28, { title: 'Passagem estreita', text: 'Corra e aperte ↓ para deslizar por baixo da rocha. Em rampas, segurar ↓ faz escorregar.' });
    B.fill(89, 19, 92, 26, T.ROCK);
    B.ent('talk', 94, 28, { id: 'fire' });
    [96, 99, 102, 105].forEach((x) => B.ent('fire', x, 28));
    B.ent('mariposas', 101, 28);
    B.ent('seriema', 98, 28, { x0: 94, x1: 106 });
    // vereda com buritis
    B.ground(108, 112, 30);
    B.water(108, 28, 112, 29);
    B.ground(113, 157, 28);
    B.ent('insetos', 110, 28, { kind: 'libelula' });
    B.ent('insetos', 124, 28, {});
    B.ent('tucano', 129, 28, { perches: [0, -9], lift: -66 });
    B.ent('caixa', 124, 28, { id: 'caixaB1', drop: ['seed', 'seed'] });
    B.ent('caixa', 125, 28, { id: 'caixaB2', drop: ['fruit'] });
    B.ent('catetos', 145, 28, { x0: 144, x1: 154 });
    B.ent('plant', 150, 28, { kind: 'capim', guide: 'capimDourado' });
    B.ent('araraVoo', 70, 28, { x0: 70, x1: 166, lift: 140 });
    B.ent('plant', 107, 28, { kind: 'buriti' });
    B.ent('checkpoint', 93, 28, { id: 'cpB1' });
    B.ent('descartador', 114, 28, { x0: 113, x1: 115 });
    B.ent('plant', 119, 28, { kind: 'pequi' });
    B.ent('chainsaw', 123, 28, { x0: 120, x1: 127 });
    // ipê com galhos (raro 2 no alto)
    B.ent('plant', 129, 28, { kind: 'ipe' });
    B.fill(126, 25, 128, 25, T.BRANCH);
    B.fill(129, 22, 131, 22, T.BRANCH);
    B.fill(126, 19, 127, 19, T.BRANCH);
    B.ent('pickup', 126, 19, { kind: 'rare', id: 'rare2' });
    B.ent('sprayer', 132, 22, { x0: 128, x1: 140 });
    B.ent('cacador', 133, 28, { x0: 130, x1: 138 });
    B.ent('plant', 137, 28, { kind: 'lobeira' });
    B.ent('tamandua', 139, 28, { x0: 136, x1: 140, obsRange: 80 });
    // cupinzeiro e toca subterrânea
    B.fill(142, 26, 143, 28, T.MOUND);
    B.ent('plant', 145, 28, { kind: 'mound', guide: 'cupinzeiro' });
    B.ent('moundSpot', 142, 28, { tiles: [[142, 26], [143, 26], [142, 27], [143, 27], [142, 28], [143, 28]] });
    B.clear(142, 29, 153, 31);
    B.fill(152, 30, 153, 30, T.PLANK);
    B.fill(152, 28, 153, 28, T.PLANK);
    seeds(144, 150, 32, 2);
    B.ent('pickup', 148, 32, { kind: 'heartUp', id: 'heartUp1' });
    B.ent('pickup', 145, 32, { kind: 'rare', id: 'rare3' });
    // cerca do Projeto Horizonte (Larinha desliga no terminal; Piatã derruba o gerador com o Soco da Terra)
    B.ent('checkpoint', 151, 28, { id: 'cpB2' });
    B.ent('talk', 152, 28, { id: 'fence' });
    B.ent('terminal', 154, 28, { flag: 'fenceB', opens: 'fenceB', say: 'Cerca desligada. Os bichos voltam a passar por aqui.', forceSay: 'Gerador no chão. A cerca apagou e os bichos voltam a passar.' });
    B.ent('gate', 156, 28, { name: 'fenceB', rows: 7, flag: 'fenceB', kind: 'fence' });
    // abismo com cipó
    B.ent('sign', 157, 28, { title: 'Cipó', text: 'Pule para agarrar o cipó. Use ← → para ganhar balanço e ESPAÇO para soltar no ponto mais alto.' });
    B.ent('cipo', 162, 18, { len: 114 });
    B.ground(167, 180, 28);

    // ═══ C · CACHOEIRAS DO CARIMÃ ═══
    B.ent('checkpoint', 169, 28, { id: 'cpC1' });
    B.ent('sign', 172, 28, { title: 'Complexo do Carimã', guide: 'carima', text: 'Circuito de cachoeiras acessado por trilha. Aperte ↑ dentro d\'água para nadar e ESPAÇO para dar braçadas. Para escalar, segure a direção contra o paredão.' });
    B.ent('talk', 176, 28, { id: 'cliff' });
    B.ent('pickup', 178, 28, { kind: 'fruit', lift: 4 });
    B.ent('capivara', 174, 28, { x0: 171, x1: 180, obsRange: 90 });
    B.fill(176, 26, 177, 27, T.CRACKED);
    B.ent('pickup', 176, 28, { kind: 'fruit', lift: 4 });
    // poço 1
    B.ground(181, 199, 34, T.SAND, T.DIRT);
    B.water(181, 28, 199, 33);
    B.ent('ariranha', 186, 32, { x0: 183, x1: 196, n: 3 });
    B.fill(185, 34, 187, 35, T.FAKE);
    B.ent('pickup', 186, 36, { kind: 'rare', id: 'rare4' });
    B.deco(198, 16, 199, 27, GC.D.FALLS);
    // paredão
    B.fill(200, 16, 205, 39, T.CLIFF);
    // platô com riacho contaminado
    B.ground(206, 207, 16);
    B.ground(208, 221, 19);
    B.water(208, 16, 221, 18, T.POLLUTED);
    B.ground(222, 226, 16);
    B.ent('talk', 204, 16, { id: 'stream' });
    B.ent('polluter', 223, 16);
    B.ent('cardume', 213, 18);
    // poço 2 com jacaré e sucuri
    B.ground(227, 250, 34, T.SAND, T.DIRT);
    B.water(227, 25, 250, 33);
    B.deco(227, 16, 228, 24, GC.D.FALLS);
    B.fill(243, 24, 250, 27, T.ROCK);
    B.ent('jacare', 246, 24, { dir: -1 });
    B.ent('sucuri', 233, 31, { x0: 229, x1: 241, y0: 27, y1: 31 });
    B.ent('talk', 232, 26, { id: 'tunnel' });
    // paredão com túnel submerso escondido
    B.fill(251, 10, 258, 39, T.ROCK);
    B.water(252, 30, 258, 31);
    B.fill(251, 30, 251, 31, T.FAKE);
    B.ent('bubbles', 251, 32);
    B.water(259, 25, 261, 31);
    B.ground(259, 261, 32);
    B.ground(262, 284, 24);
    B.ent('checkpoint', 264, 24, { id: 'cpC2' });
    B.ent('npc', 267, 24, { dialog: 'rafael', who: 'rafael', look: 'rafael', guides: ['agriPrecisao'], repeat: 'Os drones da cooperativa estão de olho na Cidade de Pedra. Boa sorte!' });
    seeds(266, 272, 24, 2);

    // ═══ D · CIDADE DE PEDRA ═══
    B.ent('ema', 266, 24, { x0: 263, x1: 271 });
    B.ent('sign', 270, 24, { title: 'Cidade de Pedra', guide: 'cidadePedra', text: 'Parque Ecológico João Basso. Formações de arenito esculpidas pela erosão, com abrigos e inscrições rupestres estudadas há décadas.' });
    B.fill(275, 22, 276, 23, T.ROCK);
    B.fill(272, 22, 273, 23, T.CRACKED);
    B.ent('pickup', 272, 24, { kind: 'seed', lift: 6 });
    B.ent('caixa', 283, 24, { id: 'caixaD1', drop: ['seed', 'fruit'] });
    B.fill(279, 20, 280, 23, T.ROCK);
    // caverna
    B.fill(285, 8, 334, 17, T.ROCK);
    B.ground(285, 334, 24, T.ROCK, T.ROCK);
    B.deco(285, 18, 334, 23, GC.D.CAVE);
    B.deco(292, 19, 296, 21, GC.D.ART);
    B.deco(318, 19, 321, 21, GC.D.ART);
    B.dark(285, 8, 334, 24);
    B.ent('talk', 289, 24, { id: 'cave' });
    B.ent('plant', 294, 24, { kind: 'art', guide: 'arteRupestre' });
    B.ent('plant', 319, 24, { kind: 'art', guide: 'arteRupestre' });
    B.clear(299, 24, 301, 39);
    B.clear(303, 24, 305, 39);
    B.ent('lodo', 309, 24);
    B.ent('pickup', 311, 24, { kind: 'fruit', lift: 4 });
    // câmara superior com cipó (raro 5)
    B.clear(311, 11, 318, 14);
    B.deco(311, 11, 318, 14, GC.D.CAVE);
    B.fill(314, 15, 314, 23, T.VINE);
    B.ent('pickup', 317, 15, { kind: 'rare', id: 'rare5' });
    seeds(312, 316, 15, 2);
    B.ent('draga', 327, 24, { gate: 'gateGarimpo' });
    B.ent('gate', 333, 24, { name: 'gateGarimpo', rows: 6, flag: 'gateGarimpo', kind: 'gate' });
    B.ground(335, 362, 24);
    // território da onça
    B.ent('talk', 335, 24, { id: 'onca_warn' });
    B.ent('onca', 341, 24, { zx0: 336, zx1: 347 });
    // comporta com duas travas: Piatã salta até a alavanca e derruba a trava eletrônica;
    // Larinha puxa a alavanca com o drone e abre o terminal
    B.ent('talk', 348, 24, { id: 'gate' });
    B.fill(349, 20, 351, 20, T.ROCK); // saliência alta: só o salto de Piatã (ou o drone de Larinha) alcança
    B.ent('lever', 350, 20, { flag: 'leverD', opens: 'leverD', say: 'Trava mecânica liberada! Falta a trava eletrônica lá embaixo.' });
    B.ent('terminal', 353, 24, { flag: 'gateD', opens: 'gateD', needs: 'leverD', needsMsg: 'A trava mecânica lá em cima ainda está fechada. O drone (Aliado) alcança a alavanca.', needsMsgPiata: 'A trava mecânica lá em cima ainda segura a comporta. Primeiro a alavanca.', forceSay: 'Trava eletrônica fora do ar. Comporta aberta!', say: 'Comporta aberta!' });
    B.ent('gate', 356, 24, { name: 'gateD', rows: 6, flag: 'gateD', kind: 'gate' });
    B.ent('checkpoint', 358, 24, { id: 'cpD' });
    B.ent('pickup', 360, 24, { kind: 'fruit', lift: 4 });

    // ═══ E · CLAREIRA DO CORRENTÃO ═══
    B.ground(363, 399, 24);
    B.fill(393, 0, 399, 39, T.CLIFF);
    B.water(364, 24, 366, 25);
    B.fill(367, 18, 370, 18, T.BRANCH);
    B.fill(377, 17, 380, 17, T.BRANCH);
    B.arena(363, 392, 24);
    B.ent('arenaGate', 362, 24, { rows: 16 });
    B.ent('boss', 386, 24);
  }
};
