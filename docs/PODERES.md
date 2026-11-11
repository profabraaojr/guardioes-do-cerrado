# Poderes especiais

Os poderes usam a tecla **F** (ou **B**), o botão **Poder** na tela de toque e o gatilho esquerdo no controle. O código está em `src/entities/powers.js`, e as animações, em `src/gfx/puppet.js` (`punch`, `beam`).

| | Piatã · Soco da Terra | Larinha · Feixe do Satélite |
| --- | --- | --- |
| Como funciona | golpe de curto alcance à frente, com estrela de impacto, poeira e tremor de tela | a EcoPack mira o alvo mais próximo à frente (0,55 s de mira com anel no chão) e um feixe de luz desce do céu |
| Recarga | 2,2 s | 5 s |
| Máquinas | 2 de dano (4 após o drone) | 3 de dano (6 após o drone) |
| Rochas rachadas e caixas do Horizonte | quebra | quebra |
| Criaturas contaminadas | sem efeito no lodo (mensagem de dica) | purifica (lodo vira perereca, mariposas viram borboletas, cardume volta a lambaris) |
| Infratores | não toca a pessoa: o tremor desequilibra e derruba o equipamento ilegal | o clarão ofusca e registra provas (−1 de resistência) |
| Armadilhas e mangueiras da draga | desarma / trava | desarma / trava |
| Vapor de mercúrio (draga) | sem efeito | dissipa parte da nuvem |
| Colosso | faz o robô cambalear; os núcleos continuam exigindo sementes | atinge um núcleo quando os escudos estão desligados; com escudos ativos, a luz é refletida |
| Animais e pessoas parceiras | nunca são atingidos | nunca são alvo |

## Conteúdo novo na fase (opcional)

Rochas rachadas guardam sementes e frutos na beira do Rio Vermelho, na trilha, no Carimã e na Cidade de Pedra. Caixas de suprimentos do Projeto Horizonte trazem sementes e frutos perto do ipê da trilha e na entrada da caverna. O caminho principal não depende dos poderes. Um diálogo curto apresenta os poderes no início da fase.

## Desempenho

Durante os testes dos poderes, apareceu uma lentidão que já existia: a geração dos fundos em parallax travava o jogo por alguns segundos depois de abrir. O kit de desenho em pixel (`src/gfx/pixel.js`) passou a escrever direto num buffer de memória. Cada fundo agora é gerado em cerca de 50 ms (antes, cerca de 1 s), e o jogo mantém 60 quadros por segundo em toda a fase.
