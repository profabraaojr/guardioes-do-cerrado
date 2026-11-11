// Protagonistas: atributos de jogo e textos de apresentação.
// Nenhum dos dois é superior: cada um resolve desafios que o outro não resolve sozinho.
GC.CHARACTERS = {
  piata: {
    id: 'piata', name: 'Piatã', role: 'Guardião da natureza', age: 16,
    bio: 'Nascido e criado em Mato Grosso, cresceu ouvindo as histórias dos mais velhos de sua família sobre o respeito à terra, aos rios e aos animais. Gosta de música e de esporte, usa celular como qualquer jovem e percebe na paisagem sinais que quase ninguém nota.',
    traits: ['Corajoso, mas não imprudente', 'Observador', 'Às vezes teimoso', 'Demora a confiar em desconhecidos'],
    tool: 'seed', toolName: 'Sementes nativas', toolDesc: 'Travam engrenagens das máquinas e brotam no solo degradado.',
    ally: 'track', allyName: 'Ler a trilha', allyDesc: 'Revela passagens escondidas a partir de rastros e sinais da vegetação.',
    extra: ['Escala paredões com agilidade e salta entre eles', 'Alcança plataformas altas', 'Chama o tamanduá para abrir tocas'],
    stats: { Velocidade: 3, Salto: 3, Escalada: 3, Tecnologia: 1 },
    phys: { run: 145, jump: 480, climb: 82, wallJump: true }
  },
  larinha: {
    id: 'larinha', name: 'Larinha', role: 'Inventora e exploradora', age: 16,
    bio: 'Nasceu em Rondonópolis e conhece a cidade como poucos. Gosta de fotografia, robótica e experiências científicas. Um trabalho escolar sobre os rios da região virou investigação quando seus sensores registraram algo que não deveria estar ali.',
    traits: ['Criativa e bem-humorada', 'Investigativa', 'Um pouco impaciente', 'Detesta o que não consegue controlar'],
    tool: 'water', toolName: 'Purificador da EcoPack', toolDesc: 'Jato que apaga focos de incêndio e limpa água contaminada. Recarrega em água limpa.',
    ally: 'drone', allyName: 'Drone de análise', allyDesc: 'Escaneia máquinas, expõe pontos frágeis e desliga escudos por alguns segundos.',
    extra: ['Opera terminais e dispositivos do Projeto Horizonte', 'Escala com luvas de apoio, mais devagar', 'Registra espécies com fotografias'],
    stats: { Velocidade: 2, Salto: 2, Escalada: 2, Tecnologia: 3 },
    phys: { run: 125, jump: 392, climb: 54, wallJump: false }
  }
};
