# Trilha e paisagem sonora

Todo o áudio é sintetizado com Web Audio (`src/core/audio.js` e `src/core/soundscape.js`), sem arquivos externos nem gravações de terceiros.

## Música

Faixas curtas em loop por ambiente: título, Cerrado, caverna, chefe e vitória. O dedilhado lembra a viola de cocho, e o pulso faz referência ao rasqueado mato-grossense.

## Paisagem sonora

| Ambiente | Camadas contínuas | Cantos e sons de fundo |
| --- | --- | --- |
| Margens do Rio Vermelho | água do rio, vento leve, grilos | bem-te-vi, sabiá, juriti, araras, sapos e pererecas |
| Trilha do Cerrado | cigarras (estação seca), vento no capim | seriema, bem-te-vi, pica-pau, tucanuçu, araras, juriti |
| Cachoeiras do Carimã | cachoeira (mais forte perto das quedas), insetos | sabiá, araras, bem-te-vi, tucanuçu, sapos |
| Cidade de Pedra (fim de tarde) | vento forte, grilos | curiango, juriti, seriema, pica-pau |
| Caverna | ar abafado, eco | gotas e morcegos, com reverberação |
| Clareira do Colosso | vento e zumbido de máquinas | brasas crepitando, sem aves |
| Clareira recuperada | insetos suaves | coro de aves que voltam |

O volume da água acompanha a quantidade de água e de cachoeiras visíveis na tela.

**Vozes dos animais em cena.** Ema (ronco grave), seriema, lobo-guará, veado-campeiro (assobio de alerta), catetos (grunhidos e estalos de dentes), tatu (cavando), tamanduá (fungadas), tucanuçu, araras, capivara, onça (esturro), jacaré (sibilo), ariranhas e pererecas. O volume depende da distância até o personagem, e o som fica à esquerda ou à direita conforme a posição na tela. Focos de incêndio crepitam quando estão perto.

**Mixer.** Os botões **Música** e **Sons da natureza** ficam no menu de pausa. Os níveis são guardados no navegador. O botão **Som** silencia tudo.

## Amostras

`docs/audio/paisagem-*.webm` traz 12 s de cada ambiente (trilha, Carimã, Rio Vermelho e caverna), com música e natureza misturadas, gravados direto do jogo.

## Limites

- Os cantos são aproximações sintetizadas das espécies, sem fidelidade de gravação de campo.
- Para usar gravações reais, acervos como o Fonoteca Neotropical Jacques Vielliard (Unicamp) ou o xeno-canto exigem conferir a licença de cada arquivo. Elas podem substituir as funções em `CALLS` com uma reprodução de arquivo.
