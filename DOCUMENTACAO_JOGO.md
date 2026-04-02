# Documentacao do Jogo

Este documento resume como o jogo funciona hoje no codigo de [`game.html`](./game.html). O foco aqui e estudo do sistema, onboarding de jogadores e consulta rapida de mecanicas.

## 1. Visao Geral

O jogo e um city builder em grade com:

- mapa procedural de `160 x 90` tiles
- economia baseada em impostos, manutencao e empregos
- crescimento por zonas residenciais, comerciais e industriais
- servicos publicos que influenciam felicidade, crime e poluicao
- energia distribuida por usina nuclear + fios
- demolicao individual e demolicao em area com tempo de execucao

## 2. Estado Inicial da Partida

Ao iniciar uma cidade nova, o jogo comeca com:

- dinheiro inicial: `10000`
- populacao: `0`
- tempo do jogo: `ano 1900`, `mes 1`
- imposto geral: `7%`
- financiamento inicial (percentual do orçamento maximo por area):
- `roads`: `20%`
- `hospitals`: `20%`
- `schools`: `20%`
- `services`: `20%`
- `leisure`: `20%`
 
Observacao: esses percentuais afetam quanto a cidade gasta por ano em manutencao/servicos e tambem influenciam a felicidade quando estao muito baixos.

## 3. Tempo e Velocidade da Simulacao

Cada tick da simulacao avanca `1 mes` no jogo.

Velocidades disponiveis:

- pausado: `0 ms`
- lento: `1000 ms` por tick
- normal: `500 ms` por tick
- rapido: `100 ms` por tick

Consequencia pratica:

- `12 ticks = 1 ano`
- no normal, `1 ano` leva `60 segundos`
- no rapido, `1 ano` leva `24 segundos`
- no lento, `1 ano` leva `120 segundos`

Autosave:

- o jogo tenta salvar a sessao a cada `30 segundos`
- se a cidade tiver `save` nomeado, o save principal tambem e atualizado

## 4. Geracao de Mapa

O mapa e gerado pela funcao `generateMap()`.

Parametros principais:

- tamanho: `160 x 90`
- agua alvo: `20%` do mapa
- floresta alvo: `20%` do mapa

Como funciona:

1. O jogo gera ruido aleatorio.
2. Faz `3 passagens` de suavizacao para formar manchas naturais.
3. Cria um rio principal entre duas bordas aleatorias do mapa.
4. Se a agua ainda ficar abaixo de `70%` da meta, gera um segundo rio.
5. Se ainda faltar agua, cria uma faixa larga de agua numa das bordas, simulando costa.
6. Florestas sao colocadas nas areas nao alagadas, escolhendo os tiles com maior valor no ruido suavizado.

## 5. Ferramentas de Construcao

### 5.1 Custos

| Tipo | Custo |
|---|---:|
| Residencial | `100` |
| Comercial | `100` |
| Industrial | `100` |
| Hospital pequeno | `600` |
| Delegacia | `500` |
| Escola | `1000` |
| Usina nuclear | `3000` |
| Parque | `800` |
| Fio | `2` |
| Estrada | `5` |
| Bulldozer | `1` por tile/acao |

### 5.2 Tamanho de cada construcao

| Tipo | Tamanho em tiles |
|---|---:|
| Estrada | `1 x 1` |
| Fio | `1 x 1` |
| Bulldozer | `1 x 1` |
| Info de zona | `1 x 1` |
| Residencial | `3 x 3` |
| Comercial | `3 x 3` |
| Industrial | `3 x 3` |
| Delegacia | `3 x 3` |
| Parque | `3 x 3` |
| Hospital pequeno | `4 x 4` |
| Escola | `4 x 4` |
| Usina nuclear | `4 x 4` |

### 5.3 Regras de colocacao

Construcoes comuns:

- nao podem ser colocadas sobre agua
- nao podem ser colocadas sobre floresta
- nao podem sobrepor estradas
- nao podem sobrepor outro edificio
- exigem dinheiro suficiente

Estradas:

- nao podem ser colocadas sobre floresta
- nao podem sobrepor edificios
- podem atravessar agua: nesse caso viram ponte visualmente

Fios:

- nao podem ser colocados sobre agua
- nao podem ser colocados sobre floresta
- nao podem sobrepor edificios

## 6. Demolicao

### 6.1 Demolicao simples

Bulldozer remove:

- um edificio
- uma estrada
- um fio
- uma floresta

Custo da demolicao simples:

- `1` por acao/tile

### 6.2 Demolicao em area

A selecao em area calcula:

- quantidade de tiles de estrada
- quantidade de tiles de fio
- quantidade de tiles de floresta
- tiles ocupados por edificios

Formula:

- custo: `totalTiles * 1`
- tempo: `max(1, ceil(totalTiles * 0.2))` segundos

Exemplos:

- `5 tiles` => `1 s`
- `10 tiles` => `2 s`
- `25 tiles` => `5 s`
- `100 tiles` => `20 s`

## 7. Economia

## 7.1 Receita de impostos

A receita e calculada em `collectTaxes()`.

Base:

- taxa de imposto: `taxRate / 100`
- proporcao da populacao economicamente ativa: `55%`

Formula simplificada:

1. O jogo calcula `workforce = round(populacao * 0.55)`.
2. O numero de empregados e `min(workforce, empregosDisponiveis)`.
3. A renda media por cidadao depende do valor do solo das zonas residenciais.
4. A receita principal vira:

`empregados * imposto * rendaMedia`

Faixas de renda usadas:

- `Classe alta`: `0.35`
- `Classe media`: `0.15`
- `Classe baixa`: `0.10`
- `Favela`: `0.05`

Bonus adicional:

- empregos industriais geram bonus de `jobsIndustriais * imposto * 0.02`

Ajuda social:

- desempregados geram um alivio de `0.05` por trabalhador sem vaga

Observacao importante:

- a economia atual favorece fortemente a existencia de empregos e solo valorizado
- a populacao residencial alimenta a receita; sem moradores, o dinheiro entra bem mais devagar

## 7.2 Custos de manutencao

A manutencao e cobrada a cada tick mensal em `applyMaintenanceCosts()`.

Custos:

- cada zona residencial/comercial/industrial: `5`
- cada servico publico (`hospital`, `delegacia`, `escola`, `usina`, `parque`): `10`
- cada estrada: `1`
- cada fio: `0.5`
- adicional populacional: `floor(populacao / 500) * 3`

Regra de alivio financeiro:

- se o dinheiro atual for menor que `2000`, a manutencao total e reduzida pela metade

## 8. Energia

A energia e recalculada em `updatePowerState()`.

Como funciona:

1. A usina nuclear e a fonte de energia.
2. O jogo pega todos os tiles ocupados pela usina.
3. Procura fios adjacentes a esses tiles.
4. Faz uma busca em largura pela rede de fios conectados.
5. Marca edificios adjacentes a fios energizados como `powered`.

Consequencias:

- comercio e industria sem energia ficam com `0` empregos
- zonas sem energia perdem crescimento
- residencias sem energia perdem populacao diretamente

## 9. Capacidade e Empregos

Constantes base:

- capacidade residencial por tile bruto: `10`
- empregos comerciais por tile bruto: `4`
- empregos industriais por tile bruto: `6`
- capacidade hospitalar por tile: `8`
- capacidade escolar por tile: `10`
- estudantes: `20%` da populacao
- forca de trabalho: `55%` da populacao

Esses valores brutos valem como fallback. O sistema principal de zonas usa um modelo mais forte, com densidade e nivel.

### 9.1 Capacidade residencial por densidade

Formula:

- densidade 1: `500 * nivel`
- densidade 2: `2000 * nivel`
- densidade 3: `5000 * nivel`

### 9.2 Empregos industriais por densidade

Formula:

- densidade 1: `300 * nivel`
- densidade 2: `1200 * nivel`
- densidade 3: `3000 * nivel`

### 9.3 Empregos comerciais por densidade

Formula:

- densidade 1: `100 * nivel`
- densidade 2: `400 * nivel`
- densidade 3: `1200 * nivel`

## 10. Sistema de Zonas e Crescimento

O coracao do jogo esta em `updateZoneDynamics(month)`.

Cada edificio relevante recebe um objeto `zone` com:

- `type`
- `densityLevel`
- `level`
- `population`
- `maxCapacity`
- `jobs`
- `densityScore`
- `landValueScore`
- `crimeScore`
- `pollutionScore`
- `growthScore`

### 10.1 Alcance de influencia local

Analise de vizinhanca:

- raio local principal: `4` tiles

Influencia especial:

- parque influencia ate `15` tiles
- delegacia influencia ate `15` tiles

### 10.2 Atualizacao mensal

Todo mes:

- se houver mais de `1` industria por perto, a poluicao aumenta `+3`
- servicos publicos por perto reduzem poluicao em `-1`
- servicos publicos por perto reduzem crime em `-2`
- mais de `1` industria por perto aumenta crime em `+1`

### 10.3 Atualizacao trimestral

A cada `3 meses`:

- mais de `2` comercios proximos:
- valor do solo `+2`
- crescimento `+2`

- mais de `1` industria proxima:
- poluicao `+3`
- valor do solo `-2`
- crescimento `-2`

- se poluicao `< 2` e nao houver industria perto:
- valor do solo `+3`

- se poluicao `> 5`:
- valor do solo `-3`
- score de densidade `+2`

- servico publico perto:
- crime `-2`
- valor do solo `+2`
- crescimento `+1`

- influencia de parque:
- poluicao `-6`
- crescimento `+2`

- influencia de delegacia:
- crime `-6`
- crescimento `+1`

- sem energia em zona residencial/comercial/industrial:
- crescimento `-2`

### 10.4 Densidade e nivel

Conversao de `densityScore` para densidade:

- `0 a 2` => densidade `1`
- `3 a 5` => densidade `2`
- `6 ou mais` => densidade `3`

Conversao textual:

- `9+` => `Muito alto`
- `6+` => `Alto`
- `3+` => `Medio`
- abaixo disso => `Baixo`

Nivel da zona:

- sobe `+1` se `growthScore > 0`, `level < 3` e `pollutionScore < 5`
- cai `-1` se `growthScore < 0` e `level > 1`

### 10.5 Valor do solo

Faixas:

- `<= -3` => `Favela`
- `<= 0` => `Classe baixa`
- `<= 3` => `Classe media`
- acima disso => `Classe alta`

### 10.6 Crime

Faixas:

- `score >= 5` => `Perigoso`
- abaixo disso => `Seguro`

Seguranca da cidade no painel geral:

- `0` delegacias => `Criminalidade alta`
- `1` delegacia => `Segura`
- `2 a 3` delegacias => `Baixa`
- `4+` delegacias => `Quase zero`

### 10.7 Poluicao

Faixas:

- `<= 0` => `Nenhum`
- `1 a 4` => `Baixo`
- `5+` => `Alto`

### 10.8 Crescimento textual

Faixas:

- `>= 6` => `Auge`
- `> 0` => `Crescendo`
- `< 0` => `Em declinio`
- `0` => `Estavel`

### 10.9 Crescimento residencial real

A populacao residencial e atualizada a cada `3 meses`.

Se a zona residencial tiver energia:

- `baseGrowth = 2` quando a demanda global for positiva
- `baseDecline = 1` quando a demanda global for negativa
- `growthModifier = +1` se felicidade `> 60`
- `growthModifier = -1` se felicidade `< 40`

Formula de crescimento:

- ganho de populacao:
`max(1, growthScore + baseGrowth + growthModifier + earlyBoost) * 40`

Formula de queda:

- perda de populacao:
`max(1, abs(growthScore) + baseDecline + abs(growthModifier))`

Perdas extras:

- sem energia: `-10` populacao no ciclo trimestral
- felicidade menor que `30`: `-1` populacao no ciclo trimestral

Observacao importante do codigo atual:

- existe um `earlyBoost` pensado para anos iniciais
- a regra e `gameTime.year <= 3 ? 2 : (gameTime.year <= 8 ? 1 : 0)`
- como o jogo comeca em `2025`, esse bonus nunca ativa no estado atual

### 10.10 Demanda global

A demanda principal usada pelo jogo e:

`(empregosDisponiveis * 1.2) - populacao`

Isso significa:

- mais empregos tendem a puxar crescimento residencial
- excesso de populacao sem empregos tende a frear ou inverter o crescimento

Observacao tecnica importante:

- a funcao `updatePopulation()` ainda existe, mas quando ja ha zona residencial criada ela faz retorno cedo e apenas atualiza a demanda global
- na pratica, o crescimento real da cidade hoje acontece principalmente dentro de `updateZoneDynamics()`

## 11. Felicidade

Base:

- felicidade inicial de cada calculo: `50`

Ajustes:

- empregos insuficientes: `-15`
- empregos suficientes: `+10`
- falta de moradia ou ocupacao acima de `90%`: `-15`
- imposto acima de `15%`: `-(taxa - 15) * 2`
- imposto `<= 15%`: `+5`
- poluicao media acima de `5`: `-10`
- criminalidade media acima de `5`: `-10`
- servicos publicos abaixo do ideal: `-10`
- servicos publicos suficientes: `+10`
- menos de `3` parques: `-5`
- nenhuma reclamacao no ciclo: `+10`

Ideal de servicos publicos:

- `ceil(populacao / 200)`, minimo de `1`

Servicos contados para felicidade:

- hospital
- delegacia
- escola
- parque

Faixas de status:

- `0 a 20` => `Muito ruim`
- `21 a 40` => `Ruim`
- `41 a 60` => `Neutro`
- `61 a 80` => `Bom`
- `81 a 100` => `Excelente`

## 12. Informacoes de Cidade

O painel da cidade exibe:

- populacao total
- capacidade residencial usada
- empregos totais
- empregados
- carga hospitalar
- carga escolar
- nivel medio de poluicao
- seguranca geral

Capacidade hospitalar:

- hospital `4 x 4` => `16 tiles`
- `16 * 8 = 128` de capacidade por hospital

Capacidade escolar:

- escola `4 x 4` => `16 tiles`
- `16 * 10 = 160` de capacidade por escola

## 13. Controles do Jogador

Ferramentas:

- botoes laterais selecionam o tipo de construcao
- `Q` seleciona o bulldozer
- ferramenta de info mostra os dados da zona clicada

Camera:

- `Espaco + arrastar` faz pan
- `Alt + scroll` faz zoom
- limites de zoom: `0.6` ate `3.5`
- zoom inicial: `2.2`

Estradas e fios:

- podem ser desenhados em sequencia arrastando
- o jogo ajusta a direcao automaticamente entre horizontal e vertical

## 14. Funcoes Principais do Codigo

### 14.1 Simulacao e economia

- `generateMap()` - gera o mapa procedural
- `updateGameTime()` - avanca mes e aplica economia mensal
- `simulationTick()` - tick principal da simulacao
- `setSimulationSpeed(ms)` - troca a velocidade da simulacao
- `collectTaxes()` - calcula receita
- `applyMaintenanceCosts()` - cobra manutencao
- `updatePowerState()` - recalcula a rede de energia
- `updatePopulation()` - atualiza demanda e fallback de populacao
- `updateZoneDynamics(month)` - sistema principal de crescimento
- `updateHappiness()` - recalcula felicidade e reclamacoes

### 14.2 Construcao e destruicao

- `getBuildSize(type)` - retorna tamanho do item
- `getBuildCost(type)` - retorna custo do item
- `canPlaceBuilding(x, y, size)` - valida colocacao de edificios
- `canPlaceRoad(x, y)` - valida estrada
- `canPlaceWire(x, y)` - valida fio
- `placeRoadAt(x, y, dir)` - coloca estrada
- `placeWireAt(x, y, dir)` - coloca fio
- `findBuildingAt(x, y)` - identifica edificio sob o tile
- `computeAreaSelection(rect)` - calcula custo e tempo da demolicao em area
- `startDemolitionTimer(stats)` - inicia a demolicao temporizada
- `applyAreaDestruction(stats)` - aplica a remocao definitiva

### 14.3 Interface e persistencia

- `updateFinanceUI()` - atualiza HUD financeira
- `openTaxModal()` / `applyTaxesFromUI()` - editar impostos
- `openCityModal()` - painel geral da cidade
- `openZoneModal(building)` - painel detalhado da zona
- `openRatingModal()` - painel de felicidade e reclamacoes
- `saveGame()` / `loadGame()` - salvar e carregar
- `saveSession()` / `loadSession()` - persistencia da sessao atual
- `startAutosave()` - autosave periodico
- `resumeLastSession()` - retoma a ultima sessao

## 15. Leituras Rapidas para Novos Jogadores

Se a cidade nao cresce, verifique nesta ordem:

1. Se existe energia chegando nas zonas.
2. Se ha empregos suficientes.
3. Se o imposto passou de `15%`.
4. Se a poluicao e o crime ficaram altos.
5. Se faltam servicos publicos.
6. Se faltam parques.

Se a economia piora cedo:

1. Evite exagerar em servicos publicos caros.
2. Nao espalhe estrada e fiacao sem necessidade.
3. Crie empregos antes de empilhar residencias.
4. Segure o imposto em torno de `10% a 15%`.

## 16. Observacoes Tecnicas do Estado Atual

Alguns comportamentos do codigo merecem atencao ao estudar ou apresentar o jogo:

- os percentuais de financiamento controlam quanto a cidade gasta por setor (estradas, saude, educacao, servicos, lazer) e podem afetar a felicidade quando muito baixos
- o crescimento real esta concentrado em `updateZoneDynamics()`
- o `earlyBoost` de crescimento inicial ajuda nos primeiros anos (baseado em `cityAgeYears`)
- `updatePopulation()` ainda funciona mais como suporte de demanda do que como motor principal de crescimento
