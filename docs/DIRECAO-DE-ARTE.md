# Nova direção de arte: desenho 2D sobre cenário real

Os sprites em pixel art deixam de ser a linguagem visual do jogo. A nova composição tem três camadas:

1. **Plano distante:** foto real do lugar da fase (Rio Vermelho, Casario, Cidade de Pedra, cachoeiras), com licença livre ou autorizada, recortada e levemente tratada (suavização e névoa de distância) para ficar atrás da ação.
2. **Planos próximos:** água, margens, vegetação, plataformas e objetos desenhados em 2D, com as cores e as formas tiradas da foto da própria fase.
3. **Personagens e fauna:** desenho 2D de ilustrador, animado por partes recortadas (cabeça, tronco, braços, pernas), sobre a mesma física do jogo atual.

Cada fase abre com a foto inteira do ponto turístico, o nome do lugar, um texto curto e o crédito da imagem. As fotos também entram nas fichas do Guia de Campo.

O protótipo do primeiro trecho (margens do Rio Vermelho) está em `prototipo/`.

## O que fica do jogo atual

Física (pulo variável, tolerância ao sair da plataforma, memória de pulo, gravidade maior na queda), controles de teclado, controle e toque, um guardião por partida com o parceiro no rádio, narrativa, Guia de Campo, salvamento e instalação no celular.

## Especificação para o ilustrador

**Estilo.** Desenho 2D limpo, com traço de contorno escuro e cores chapadas com um ou dois tons de sombra. Proporções naturais de adolescentes de 16 anos, sem deformação. A representação de Piatã segue a diretriz do projeto: origem indígena sem povo definido e sem estereótipos (sem cocar, sem pintura genérica, sem caricatura).

**Personagens.**

- **Piatã:** pele morena, cabelo preto volumoso e espetado, faixa vermelha e laranja na cabeça com grafismo amarelo, camiseta clara, colar com pingente de folha, mochila marrom.
- **Larinha:** pele morena clara, cabelo castanho-avermelhado cacheado preso em rabo de cavalo, óculos de aviador azuis sobre a testa, sardas leves, camisa rosa aberta sobre camiseta branca, mochila EcoPack azul-marinho.

**Corpo para animação (recorte).** Vista de 3/4 virada para a direita; o jogo espelha para a esquerda. Altura do personagem no desenho-mestre: cerca de 600 px (no jogo, cerca de 150 px em tela de 720 px de altura). Cada parte em arquivo separado, com fundo transparente, desenhada inteira mesmo onde fica escondida:

| Parte | Ponto de articulação |
| --- | --- |
| cabeça (rosto e orelha) | pescoço |
| cabelo da frente e cabelo de trás | topo da cabeça |
| tronco com roupa | quadril e pescoço |
| braço (de cada lado) | ombro |
| antebraço com mão aberta e mão fechada | cotovelo |
| coxa (de cada lado) | quadril |
| canela (de cada lado) | joelho |
| pé com calçado | tornozelo |
| mochila e acessórios (faixa com pontas soltas; óculos) | ponto de fixação no corpo |

**Rosto.** Cinco expressões, que já existem nos diálogos do jogo: neutro, feliz, surpreso, preocupado e determinado. Pode ser feito como rosto completo por expressão ou como peças trocáveis (olhos abertos e fechados, sobrancelhas e boca). Também uma piscada.

**Retratos de diálogo.** Busto de 3/4, 512 × 512 px, fundo transparente, nas cinco expressões.

**Formato de entrega.** PNG de 32 bits ou SVG por parte, ou um arquivo em camadas (PSD, Krita ou SVG) com uma camada por parte e os pontos de articulação marcados. Nomes em minúsculas, sem acento: `piata_cabeca.png`, `piata_coxa_frente.png`, `larinha_retrato_feliz.png`.

**Fauna, depois dos personagens:** capivara, arara, tucanuçu, tamanduá-bandeira, lobo-guará, seriema, ema, tatu, cateto e onça-pintada, em pose de caminhada e parada.

## Fotos por fase

Busca feita na Wikimedia Commons em novembro de 2026.

| Fase ou trecho | Foto encontrada | Licença e autor | Situação |
| --- | --- | --- | --- |
| Margens do Rio Vermelho (Reserva João Basso) | [Reserva João Basso - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Reserva_Jo%C3%A3o_Basso_-_panoramio.jpg) | CC BY 3.0, grauciano | em uso no protótipo |
| Parque Estadual Dom Osório Stoffel | [Paisagem do Parque Dom Ozorio 01 a 20](https://commons.wikimedia.org/wiki/Category:Parque_Estadual_Dom_Os%C3%B3rio_Stoffel) (trechos de rio, formações de arenito, cachoeira) | CC BY-SA 4.0, Rogério Salles | disponível |
| Ruas e avenidas de Rondonópolis | [Fotos em Rondonópolis - MT 01 a 47](https://commons.wikimedia.org/wiki/Category:Rondon%C3%B3polis) (a nº 13 mostra uma ponte de grade azul sobre um rio, sem descrição do local) | CC BY-SA 4.0, Túllio F | disponível; pouco útil como paisagem |
| Casario de Rondonópolis | nenhuma foto livre encontrada | — | falta foto |
| Cidade de Pedra (Parque Ecológico João Basso) | nenhuma foto livre com esse nome; as formações de arenito do Parque Dom Osório podem servir de referência visual | — | falta foto do lugar |
| Cachoeiras do Carimã | nenhuma foto livre encontrada | — | falta foto |

**Como completar as lacunas:** fotos próprias ou de colegas (sem custo de licença), pedido de autorização à Secretaria de Turismo de Rondonópolis ou à gestão dos parques, ou novas buscas na Commons.

## Regras de uso das fotos

- Toda foto aparece com crédito na abertura da fase e na tela de créditos: título, autor, origem e licença com link.
- **CC BY:** basta o crédito e a indicação das alterações feitas.
- **CC BY-SA:** além do crédito, a versão alterada da foto (recortada ou tratada) precisa ser distribuída sob a mesma licença CC BY-SA. Isso vale para o arquivo de imagem, não para o código do jogo.
- Foto encontrada na web sem licença declarada não entra no jogo.
- Recortes e tratamentos ficam registrados em `prototipo/img/` e nos créditos.
