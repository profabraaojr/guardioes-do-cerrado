# Narrativa e diretrizes

## Conceito

> Não precisamos destruir a natureza para vencer uma batalha. Precisamos aprender a protegê-la.

Piatã e Larinha representam duas perspectivas complementares: a relação com a natureza aprendida em família e o olhar de quem cresce numa cidade em transformação. Nenhum dos dois é superior. Cada um tem conhecimentos, limitações e habilidades próprias, e alguns desafios só se resolvem com a cooperação entre eles.

## Protagonistas

**Piatã (16 anos).** Nascido e criado em Mato Grosso, descendente de indígenas por parte da família. Observador, corajoso sem ser imprudente, teimoso às vezes e lento para confiar em desconhecidos. Arco: aprender que preservar também exige diálogo e participação da sociedade.

**Larinha (16 anos).** Nascida em Rondonópolis, interessada em fotografia, robótica e ciência. Criativa, bem-humorada e um pouco impaciente. Arco: compreender que nem tudo se resolve com tecnologia.

### Pendência registrada: origem indígena de Piatã

O povo de origem da família de Piatã **ainda não foi definido**. A definição depende de pesquisa histórica e cultural adequada e, de preferência, da participação de representantes do povo escolhido. Até lá:

- os textos dizem apenas que ele cresceu com as histórias dos mais velhos da família;
- o jogo não atribui a ele grafismos, rituais, idioma ou elementos de um povo específico;
- a faixa vermelha da proposta visual (imagem 01) é tratada como acessório pessoal, sujeito a revisão quando a origem for definida.

## Antagonistas

**Projeto Horizonte**, organização fictícia que opera de forma clandestina e ilegal. **Dr. Vértice** acredita que a natureza é um obstáculo ao progresso e que todos os recursos deveriam estar sob controle tecnológico. O conflito é ideológico, com causas próprias.

**NEXUS** é a rede central que coordena as máquinas. Ela é revelada no fim do Capítulo 1 e leva a dupla à Chapada dos Guimarães.

## Diretriz permanente: o setor agropecuário

Nenhum personagem, máquina, organização ou atividade ligada ao agronegócio é antagonista por associação. O setor agropecuário aparece como parceiro estratégico dos protagonistas, com diversidade de produtores, profissionais, tecnologias e práticas sustentáveis.

Aplicação no Capítulo 1:

- **Dona Cida**, produtora rural, mantém com outros produtores e voluntários o posto de brigada da trilha, monitora focos de fogo por satélite e drone e denuncia as máquinas clandestinas que invadiram a Reserva Legal da sua propriedade.
- O Guia de Campo inclui **Reserva Legal** e **Integração Lavoura-Pecuária-Floresta (ILPF)** como registros de produção sustentável.
- **Rafael**, engenheiro agrônomo de uma cooperativa, usa drones de monitoramento de lavouras e áreas de preservação, detecta o sinal do Projeto Horizonte e repassa as coordenadas à polícia ambiental. Ele desbloqueia o registro **Agricultura de precisão**.
- Na vitória, os dados de satélite da brigada de Dona Cida e os drones de Rafael confirmam a origem do sinal: a tecnologia do campo ajuda a resolver o conflito.

### Máquinas inimigas

As máquinas do Projeto Horizonte são robôs experimentais fictícios, sem semelhança visual ou funcional com maquinário agrícola:

| Máquina | Desenho adotado | O que foi evitado |
| --- | --- | --- |
| **Colosso** (chefe) | robô de quatro patas hidráulicas, cúpula-sensor sem cabine de operador, garra frontal, cabo magnético, casco grafite com linhas de energia ciano | trator amarelo com esteira e cabine; o nome e a técnica do "correntão" |
| **Drone-sentinela** | casco esférico, olho vermelho e antena; dispara pulsos elétricos | drone de pulverização com tanque; "resíduo químico" |
| **Serra-robô** | robô grafite com faixas laranja e emblema do Horizonte | paleta amarela típica de máquinas de campo |
| **Poluidor** e **lodo do garimpo** | resíduos de atividade clandestina de mineração | |

O registro de ameaça do Guia de Campo passou a ser **Desmatamento ilegal**, definido pela falta de autorização, e não por um setor.

## Antagonistas por grupo

Ver `docs/ANTAGONISTAS.md`: infratores humanos em crimes específicos (tráfico, caça, descarte clandestino, garimpo ilegal), criaturas contaminadas recuperáveis e máquinas do Projeto Horizonte.

## Fauna

Os animais nativos nunca são vilões. Os perigos surgem do desrespeito ao território:

- **Jacaré**: reage a quem chega correndo ou nadando perto de onde ele toma sol.
- **Sucuri**: empurra quem a cerca dentro d'água.
- **Onça-pintada**: com filhotes, faz uma investida de advertência, sem ferir, se a dupla atravessa o território correndo ou usando ferramentas. Quem passa devagar ganha a confiança dela, e ela retorna na batalha final.

## Relação da dupla no Capítulo 1

| Momento | Desenvolvimento |
| --- | --- |
| Abertura | desconfiança: cada um acha o outro imprudente |
| Rio Vermelho | acordo prático: "você lê a trilha, eu leio os dados" |
| Carimã | humor e confiança crescente (diálogo do paredão) |
| Território da onça | Larinha aprende algo que nenhum sensor ensinaria |
| Comporta | primeiro plano feito em equipe |
| Vitória | decisão conjunta de seguir para a Chapada |

## Padrão visual dos diálogos

Implementado em `src/game/dialogui.js`, `src/gfx/font.js` e `src/gfx/portraits.js`.

- **Causa dos problemas anteriores**: ausência de declaração de codificação, que gerava caracteres corrompidos; fonte vetorial em tamanhos fracionários, que gerava texto borrado; retrato recortado do sprite e ampliado em escala não inteira; caixa de altura fixa, que cortava o texto.
- **Fonte bitmap** própria, com corpo de 7 px, descendentes e espaço para acentos de maiúsculas. Diacríticos do português (á à â ã é ê í ó ô õ ú ç e maiúsculas) são compostos no próprio grid.
- **Camada de interface** em canvas com resolução física do aparelho e fator de ampliação sempre inteiro, escolhido para manter a legibilidade em celulares.
- **Retratos 40×40** desenhados pixel a pixel, com contorno automático e cinco expressões (neutra, alegre, surpresa, preocupada e determinada).
- **Caixa** com moldura azul chanfrada, plaqueta de nome na cor do personagem com ornamento de folha, indicador de continuação, quebra automática de linhas, altura dinâmica e paginação a cada três linhas.
- **Destaques** no texto: `{a|...}` ciano (água, dados), `{y|...}` amarelo (lugares, nomes), `{g|...}` verde (fauna e flora).
