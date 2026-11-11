// Diálogos do Capítulo 1. Falas curtas, com humor e divergências que
// amadurecem ao longo da fase (desconfiança → reconhecimento → confiança).
GC.SPEAKERS = {
  piata: { name: 'Piatã', color: '#6ad0a0' },
  larinha: { name: 'Larinha', color: '#f2a05a' },
  vertice: { name: 'Dr. Vértice (transmissão)', color: '#c8c8e0' },
  cida: { name: 'Dona Cida, produtora rural', color: '#e8d070' },
  rafael: { name: 'Rafael, engenheiro agrônomo', color: '#7ad0c0' },
  traficante: { name: 'Traficante', color: '#e89a7a', infrator: true },
  cacador: { name: 'Caçador ilegal', color: '#e89a7a', infrator: true },
  descartador: { name: 'Descartador clandestino', color: '#e89a7a', infrator: true },
  garimpeiro: { name: 'Garimpeiro ilegal', color: '#e89a7a', infrator: true },
  narrador: { name: '', color: '#f4e8c8' }
};

GC.INTRO = [
  { who: 'narrador', text: 'Rondonópolis, Mato Grosso. Amanhece sobre o Cerrado.', scene: 'cerrado' },
  { who: 'narrador', text: 'Uma arara cruza o céu. Mais adiante, onde ontem havia mata, há só terra revirada.', scene: 'cerrado' },
  { who: 'narrador', text: 'Ao fundo, uma máquina gigantesca arranca árvores e espalha resíduos. No casco, um emblema: {y|Projeto Horizonte}.', scene: 'boss' },
  { who: 'larinha', text: 'Isso não pode estar certo... Esses níveis de {a|contaminação} não são naturais.', scene: 'rio', mood: 'worried' },
  { who: 'piata', text: 'Os animais estão fugindo. Alguma coisa está assustando todos eles.', scene: 'rio' },
  { who: 'larinha', text: 'Você entrou numa área de risco sem equipamento nenhum?', scene: 'rio' },
  { who: 'piata', text: 'Eu? Foi você que se afastou do grupo da escola e ficou presa na ribanceira.', scene: 'rio' },
  { who: 'larinha', text: '...Justo. Você sabe o que está acontecendo?', scene: 'rio' },
  { who: 'piata', text: 'Ainda não. Mas vamos descobrir.', scene: 'rio', mood: 'determined' }
];

GC.DIALOGS = {
  garimpo: [
    { who: 'piata', text: 'Uma draga de garimpo dentro da caverna! É dela que vem o {y|lodo}.', mood: 'surprised' },
    { who: 'larinha', text: 'E {a|mercúrio}. Meu sensor está apitando sem parar.', mood: 'worried' },
    { who: 'garimpeiro', text: 'Ninguém mandou vocês entrarem aqui. Isso é meu ganha-pão!', mood: 'determined' },
    { who: 'piata', text: 'Ganha-pão que envenena o rio de todo mundo. Vamos desligar essa máquina.', mood: 'determined' },
    { who: 'larinha', text: 'Piatã, trava as {g|mangueiras} com sementes. Depois eu cuido do vapor e do painel.', mood: 'determined' }
  ],
  garimpo_fim: [
    { who: 'larinha', text: 'Desligada. Sem mercúrio novo, a água da caverna se recupera com o tempo.', mood: 'happy' },
    { who: 'piata', text: 'Ele vai responder à justiça, e ninguém saiu ferido. É assim que tem que ser.', mood: 'determined' }
  ],
  traficante: [
    { who: 'larinha', text: 'Tem alguém vigiando a gaiola no píer. Aquilo é uma rede de captura!', mood: 'worried' },
    { who: 'piata', text: 'Não precisamos machucar ninguém. Dá para travar o lançador dele ou registrar provas para a fiscalização.', mood: 'determined' }
  ],
  rafael: [
    { who: 'rafael', text: 'Vocês são a dupla que a Dona Cida comentou? Sou o Rafael, engenheiro agrônomo da cooperativa.' },
    { who: 'larinha', text: 'Agrônomo? Então você trabalha com solo, água e... dados?', mood: 'happy' },
    { who: 'rafael', text: 'Muitos dados. Nossos drones de monitoramento mapeiam lavouras e áreas de preservação. Semana passada captaram um sinal estranho vindo da {y|Cidade de Pedra}.' },
    { who: 'piata', text: 'O mesmo sinal das máquinas sem placa?', mood: 'worried' },
    { who: 'rafael', text: 'Isso não pertence a ninguém da região. Já repassei as coordenadas à polícia ambiental. Se precisarem, a cooperativa está com vocês.' },
    { who: 'larinha', text: 'Drones que cuidam do campo e da mata. Gostei de você, Rafael!', mood: 'happy' }
  ],
  brigada: [
    { who: 'cida', text: 'Vocês são os jovens que o pessoal do parque comentou? Essas máquinas sem placa apareceram na mata da minha Reserva Legal também.' },
    { who: 'larinha', text: 'Na sua propriedade? Alguém contratou esse serviço?' },
    { who: 'cida', text: 'Ninguém daqui. A gente produz e preserva, e máquina clandestina prejudica todo mundo. Já avisei os órgãos ambientais.' },
    { who: 'piata', text: 'Então somos mais gente contra o Projeto Horizonte.' },
    { who: 'cida', text: 'Os produtores da região mantêm esta brigada junto com voluntários. Monitoramos focos de fogo por satélite e drone. Levem água e voltem aqui sempre que precisarem.' },
    { who: 'larinha', text: 'Satélite e drone? A senhora tem que me mostrar esse sistema depois!' }
  ],
  start: [
    { who: 'larinha', text: 'Meu sensor marcou {a|água turva} e pouco oxigênio no {y|Rio Vermelho}. Isso não acontece de uma hora para outra.', mood: 'worried' },
    { who: 'piata', text: 'As {g|capivaras} sumiram da margem desde ontem. Os bichos perceberam antes do seu aparelho.', mood: 'determined' },
    { who: 'larinha', text: 'Então fechado: você lê a trilha, eu leio os dados.' },
    { who: 'piata', text: 'Fechado. Mas aqui no mato quem escolhe onde pisar sou eu.', mood: 'happy' }
  ],
  arara: [
    { who: 'piata', text: 'Calma, amiga. Ninguém mais vai te prender.' },
    { who: 'larinha', text: 'Gaiola com etiqueta de transporte... isso é tráfico de animais. Vou fotografar como prova.' },
    { who: 'piata', text: 'Ela vem com a gente. Do alto, arara enxerga a mata melhor que qualquer drone.' },
    { who: 'larinha', text: 'Ei! ...Tá bom, talvez. Por enquanto.' }
  ],
  machines: [
    { who: 'larinha', text: 'Uma motosserra robótica dentro da cidade? O logo do {y|Projeto Horizonte} de novo.', mood: 'surprised' },
    { who: 'piata', text: '{g|Sementes nativas} travam essas engrenagens. E onde caírem no chão pelado, nasce planta.', mood: 'determined' }
  ],
  ledge: [
    { who: 'larinha', text: 'Esse barranco é alto demais para mim.' },
    { who: 'piata', text: 'Eu pulo. Mas se eu plantar uma muda no solo degradado, ela vira degrau para você.' }
  ],
  fire: [
    { who: 'piata', text: 'Fumaça. Fogo nessa época, com o capim seco, se espalha rápido.' },
    { who: 'larinha', text: 'Meu purificador apaga isso. Só preciso recarregar em {a|água limpa} depois.', mood: 'determined' }
  ],
  tamandua: [
    { who: 'piata', text: 'Um tamanduá-bandeira. Fica parada, Larinha: ele enxerga pouco, mas tem um faro incrível.' },
    { who: 'piata', text: 'Ele confia na gente agora. Perto do cupinzeiro tem uma toca antiga que ele sabe abrir.' }
  ],
  fence: [
    { who: 'piata', text: 'Uma cerca elétrica no meio do parque? Isso bloqueia o caminho dos animais.' },
    { who: 'larinha', text: 'Corredor ecológico cortado. Deixa o terminal comigo: troque para mim e acesse.' }
  ],
  cliff: [
    { who: 'larinha', text: 'Você tem certeza de que esse caminho é seguro?' },
    { who: 'piata', text: 'Seguro, não. Mas é o único que não destrói a vegetação.' },
    { who: 'larinha', text: 'Ótimo! Minha mochila tem ferramentas, mas não tem seguro contra quedas.' },
    { who: 'piata', text: 'Então é melhor prestar atenção onde pisa!' }
  ],
  stream: [
    { who: 'larinha', text: 'O riacho lá em cima está contaminado. A leitura bate com a do Rio Vermelho: é daqui que vem.' },
    { who: 'piata', text: 'Eu travo a máquina. Você limpa a água. Sem pisar no lodo.' }
  ],
  capivara: [
    { who: 'larinha', text: 'Capivaras ficam vários minutos debaixo d\'água! Olha como ela respira fundo antes de mergulhar.' },
    { who: 'piata', text: 'Faz igual: respira devagar e não gasta força à toa. O fôlego rende o dobro.' }
  ],
  tunnel: [
    { who: 'larinha', text: 'O paredão fecha a passagem. Não tem como subir.' },
    { who: 'piata', text: 'Bolhas saindo da pedra lá no fundo. A água está passando por algum lugar.' }
  ],
  cave: [
    { who: 'larinha', text: '{y|Pinturas rupestres}! Gente viveu aqui milhares de anos atrás.', mood: 'surprised' },
    { who: 'piata', text: 'Minha avó diz que as pedras guardam a memória de quem passou. Não encoste nelas.' },
    { who: 'larinha', text: 'Só foto, sem flash. Prometo.' }
  ],
  onca_warn: [
    { who: 'piata', text: 'Para. Tem uma onça com filhotes na pedra adiante.' },
    { who: 'larinha', text: 'E agora? Corre?' },
    { who: 'piata', text: 'Nunca. Passa devagar, abaixada, sem usar ferramenta. Ela só quer saber se somos ameaça.' }
  ],
  onca: [
    { who: 'larinha', text: 'Meu coração ainda está disparado.', mood: 'worried' },
    { who: 'piata', text: 'O dela também estava. Ela só queria proteger os filhotes.' },
    { who: 'larinha', text: 'Nenhum sensor teria me ensinado isso.', mood: 'happy' }
  ],
  gate: [
    { who: 'larinha', text: 'Comporta com duas travas: uma mecânica no alto da pedra e outra eletrônica aqui embaixo.' },
    { who: 'piata', text: 'Eu subo e puxo a alavanca. Você cuida dos fios.' },
    { who: 'larinha', text: 'Olha só, um plano em equipe. Quem diria.' }
  ],
  boss: [
    { who: 'larinha', text: 'Aquilo é... o {y|Colosso}, um robô de desmatamento do Projeto Horizonte!', mood: 'surprised' },
    { who: 'piata', text: 'Está derrubando tudo. A gente precisa parar essa máquina agora.', mood: 'determined' },
    { who: 'larinha', text: 'Os três núcleos de energia no topo! Meu drone desliga os escudos por alguns segundos.', mood: 'determined' },
    { who: 'piata', text: 'E aí minhas sementes travam tudo. Se o fogo subir, é com você.' }
  ],
  onca_boss: [
    { who: 'piata', text: 'Ela voltou!' },
    { who: 'larinha', text: 'Está defendendo o território dela... e o nosso também.' }
  ],
  victory: [
    { who: 'larinha', text: 'A máquina parou. E olha os dados: ela recebia ordens de fora, de uma rede chamada {a|NEXUS}.', mood: 'surprised' },
    { who: 'vertice', text: 'Vocês atrasaram uma máquina. Não o progresso. O Cerrado é terreno desperdiçado, e o futuro precisa de espaço.' },
    { who: 'piata', text: 'Futuro sem rio, sem bicho e sem mata não é futuro.' },
    { who: 'vertice', text: 'Opinião bonita. Vejo vocês na Chapada.' },
    { who: 'larinha', text: 'Os dados de satélite da brigada da Dona Cida e os drones do Rafael apontam para o mesmo lugar.', mood: 'happy' },
    { who: 'larinha', text: 'O sinal veio da {y|Chapada dos Guimarães}. As coordenadas estão aqui.', mood: 'determined' },
    { who: 'piata', text: 'Então é para lá que a gente vai. Juntos.', mood: 'happy' }
  ]
};
