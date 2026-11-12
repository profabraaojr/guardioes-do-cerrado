// Protagonistas: atributos de jogo e textos de apresentação.
// Nenhum dos dois é superior: cada um resolve desafios que o outro não resolve sozinho.
GC.CHARACTERS = {
  piata: {
    id: 'piata', name: 'Piatã', role: 'Guardião da natureza', age: 16,
    bio: 'Nascido e criado em Mato Grosso, cresceu ouvindo as histórias dos mais velhos de sua família sobre o respeito à terra, aos rios e aos animais. Gosta de música e de esporte, usa celular como qualquer jovem e percebe na paisagem sinais que quase ninguém nota.',
    traits: ['Corajoso, mas não imprudente', 'Observador', 'Às vezes teimoso', 'Demora a confiar em desconhecidos'],
    tool: 'seed', toolName: 'Sementes nativas', toolDesc: 'Travam engrenagens das máquinas e brotam no solo degradado.',
    ally: 'track', allyName: 'Ler a trilha', allyDesc: 'Revela passagens escondidas a partir de rastros e sinais da vegetação.',
    power: 'soco', powerName: 'Soco da Terra', powerCd: 2.2, powerDesc: 'Golpe que racha rochas, quebra caixas e danifica máquinas. Não atinge pessoas nem animais: o impacto no chão desequilibra os infratores e derruba seu equipamento.',
    extra: ['Escala paredões com agilidade e salta entre eles', 'Alcança plataformas altas', 'Chama o tamanduá para abrir tocas'],
    stats: { Velocidade: 3, Salto: 3, Escalada: 3, Tecnologia: 1 },
    get phys() { return GC.CFG.CHAR_PHYS.piata; }
  },
  larinha: {
    id: 'larinha', name: 'Larinha', role: 'Inventora e exploradora', age: 16,
    bio: 'Nasceu em Rondonópolis e conhece a cidade como poucos. Gosta de fotografia, robótica e experiências científicas. Um trabalho escolar sobre os rios da região virou investigação quando seus sensores registraram algo que não deveria estar ali.',
    traits: ['Criativa e bem-humorada', 'Investigativa', 'Um pouco impaciente', 'Detesta o que não consegue controlar'],
    tool: 'water', toolName: 'Purificador da EcoPack', toolDesc: 'Jato que apaga focos de incêndio e limpa água contaminada. Recarrega em água limpa.',
    ally: 'drone', allyName: 'Drone de análise', allyDesc: 'Escaneia máquinas, expõe pontos frágeis e desliga escudos por alguns segundos.',
    power: 'feixe', powerName: 'Feixe do Satélite', powerCd: 5, powerDesc: 'A EcoPack se conecta a um satélite de monitoramento e guia um feixe de luz concentrada sobre o alvo: danifica máquinas, purifica criaturas e ofusca infratores, registrando provas.',
    extra: ['Opera terminais e dispositivos do Projeto Horizonte', 'Escala com luvas de apoio, mais devagar', 'Registra espécies com fotografias'],
    stats: { Velocidade: 2, Salto: 2, Escalada: 2, Tecnologia: 3 },
    get phys() { return GC.CFG.CHAR_PHYS.larinha; }
  }
};
