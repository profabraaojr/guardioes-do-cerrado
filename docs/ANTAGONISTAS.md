# Sistema de antagonistas e ameaças ambientais

O código está em `src/entities/antagonists/` (registro, classes-base, humanos, criaturas, chefes), com as máquinas originais em `src/entities/enemies.js` e o Colosso em `src/entities/boss.js`.

## Diretrizes fixas

- O agronegócio, seus produtores, trabalhadores, empresas, cooperativas e atividades legítimas nunca são vilões. O setor aparece como parceiro: Dona Cida (brigada rural) e Rafael (engenheiro agrônomo de cooperativa).
- Animais silvestres nunca são inimigos. Jacaré, sucuri e onça reagem apenas ao desrespeito ao território.
- Criaturas contaminadas sempre podem se recuperar.
- Os confrontos usam só ferramentas não letais: pessoas não recebem dano, são contidas; máquinas são desativadas.

## Como resolver cada grupo

| Grupo | Como é resolvido | Resultado |
| --- | --- | --- |
| Humano infrator | a resistência cai com o jato d'água (escorrega), as sementes no equipamento ilegal (trava uma vez) e o drone (registra provas) | rende-se, a polícia ambiental é acionada e ele deixa a área |
| Criatura contaminada | remoção da contaminação (jato d'água ou água limpa ao redor) | volta à forma saudável |
| Máquina | sementes travam engrenagens; o drone dobra o efeito ou derruba escudos | fica inerte, coberta de vegetação |

## Catálogo do Capítulo 1

| Id | Grupo | Onde | Comportamento | Resolução |
| --- | --- | --- | --- | --- |
| `traficante` | humano | píer do Rio Vermelho | vigia a gaiola da arara e lança redes que imobilizam | molhar o píer, travar o lançador, provas do drone; só então a gaiola abre |
| `cacador` | humano | trilha, perto do tamanduá | arma até 3 armadilhas no caminho e acelera ao ver alguém | desarmar armadilhas com sementes, água ou drone |
| `descartador` | humano | vereda com buritis | caminhonete sem placa despeja tambores que rolam pela trilha | travar a rampa com sementes, água ou drone |
| `lodo` | criatura | caverna | rasteja em direção à dupla; sementes afundam nele | jato d'água; vira perereca |
| `cardume` | criatura | riacho do Carimã | persegue quem nada por perto | limpar a água ao redor; vira lambaris |
| `mariposas` | criatura | focos de incêndio | enxame em ondas, coberto de fuligem | jato d'água; vira borboletas |
| `chainsaw` | máquina | trilha | patrulha e avança ao detectar alguém | sementes |
| `sprayer` | máquina | trilha, arena | drone-sentinela que dispara pulsos elétricos | sementes |
| `polluter` | máquina | platô do Carimã | lança lodo em arco no riacho | sementes, depois purificar a água |
| `draga` | chefe | fim da caverna | ver abaixo | ver abaixo |
| `boss` (Colosso) | chefe | Clareira do Colosso | ver abaixo | ver abaixo |

## Chefes

Cada chefe estende `GC.BossBase`, declara suas fases e informa o progresso à barra de chefe do HUD (`g.bossBar`).

**Draga clandestina (garimpo ilegal)**

1. *Mangueiras*: duas mangueiras de sucção puxam a dupla e precisam ser travadas por Piatã com sementes. A draga lança lama com mercúrio e gera lodo.
2. *Vapor de mercúrio*: a draga superaquece e libera uma nuvem tóxica, que Larinha dispersa com o purificador.
3. *Painel*: com o vapor dissipado, Larinha desliga a draga no painel. O garimpeiro se rende, o lodo é purificado e a passagem se abre.

**Colosso (robô experimental do Projeto Horizonte)**

1. Escudos protegem três núcleos de energia. O drone de Larinha ou a colisão do robô contra a parede os derruba.
2. Com os escudos baixos, as sementes de Piatã travam os núcleos.
3. Os ataques variam entre o cabo magnético rasteiro (pular), as bolas de fogo que iniciam queimadas (purificador), a investida (subir no paredão ou nos galhos) e os drones-sentinela. No último núcleo, a onça-pintada aparece e atordoa o robô.

## Como adicionar um antagonista

```js
GC.Antagonists.define('meu_inimigo', {
  group: 'humano' | 'criatura' | 'maquina',
  name: 'Nome exibido', guide: 'chaveDoGuia',
  desc: 'O que faz.', resolve: 'Como resolver sem violência.'
}, class extends GC.Infrator /* ou GC.Criatura, GC.Machine, GC.BossBase */ {
  // act(g), patrolTick(dt, g), jamGear(g), onRecover(g), phases [...]
});
```

Depois, basta usar `B.ent('meu_inimigo', x, y, { ... })` na fase. Inclua o arquivo em `index.html` depois de `src/entities/antagonists/base.js`.
