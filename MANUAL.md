# Manual Tecnico - micropolisJS (Crescimento, Evolucao e Economia)

Este manual resume a logica de simulacao com numeros exatos, baseado no codigo-fonte do projeto.

## 1) Tempo e ciclos
- 1 tick de cidade = 1 passo logico da simulacao.
- 4 ticks = 1 mes.
- 48 ticks = 1 ano.
- Data exibida:
  - ano = floor(cityTime / 48) + 1900
  - mes = floor((cityTime % 48) / 4)
- Velocidade de simulacao (tempo minimo entre ticks):
  - Slow: 100 ms
  - Medium: 50 ms
  - Fast: 10 ms

Arquivos: src/simulation.js

## 2) Frequencias do sistema
- Censo curto (10): a cada 4 ticks.
- Censo longo (120): a cada 40 ticks.
- Imposto: a cada 48 ticks (1 ano).

Arquivos: src/simulation.js, src/census.js, src/budget.js

## 3) Demanda (valves)
- Residencial: range -2000 a 2000
- Comercial: range -1500 a 1500
- Industrial: range -1500 a 1500

Arquivos: src/valves.js

## 4) Crescimento residencial (numeros exatos)
### Populacao por zona
- Zona residencial completa representa populacoes: 16, 24, 32, 40.
- Free zone (casas individuais) pode ter ate 8 casas.

### Bloqueios
- Poluicao local > 128 bloqueia crescimento.
- Sem energia: penalidade forte (zoneScore = -500).

### Quando avalia crescimento
- Sempre avalia se a zona esta vazia (FREEZ).
- Caso contrario, avalia com chance aproximada de 1/7.

### Formula de decisao
- locationScore: -3000 a +3000
- zoneScore = resValve + locationScore

Cresce se:
- zoneScore > -350
- (zoneScore - 26380) > Random.getRandom16Signed()

Degrada se:
- zoneScore < 350
- (zoneScore + 26380) < Random.getRandom16Signed()

### Efeitos
- Crescimento pode criar hospital quando a cidade precisa.
- Se nao houver rota ate comercio, a zona degrada.

Arquivos: src/residential.js, src/traffic.js

## 5) Crescimento comercial (numeros exatos)
### Populacao
- Niveis de 1 a 5.

### Condicoes
- Necessita rota ate zona industrial.
- Sem energia: zoneScore = -500.

### Formula
- locationScore vem da distancia ao centro: -64 a +64
- zoneScore = comValve + locationScore

Cresce se:
- zoneScore > -350
- (zoneScore - 26380) > Random.getRandom16Signed()

Degrada se:
- zoneScore < 350
- (zoneScore + 26380) < Random.getRandom16Signed()

Arquivos: src/commercial.js

## 6) Crescimento industrial (numeros exatos)
### Populacao
- Niveis de 1 a 4.

### Condicoes
- Necessita rota ate residencial.
- Sem energia: zoneScore = -500.

### Formula
- zoneScore = indValve + (trafficFail ? -1000 : 0)

Cresce se:
- zoneScore > -350
- (zoneScore - 26380) > Random.getRandom16Signed()

Degrada se:
- zoneScore < 350
- (zoneScore + 26380) < Random.getRandom16Signed()

Arquivos: src/industrial.js

## 7) Trafego e conexao
- Distancia maxima de rota: 30 passos.
- Se nao encontrar estrada perto, crescimento falha e pode degradar.

Arquivo: src/traffic.js

## 8) Receita (capital entra pelo imposto)
### Formula do imposto anual
- taxFund = floor( (citizenBase + businessBase) * cityTax * FLevels[gameLevel] )
- citizenBase = totalPop * baseIncomePerCitizen * landValueMultiplier
- landValueMultiplier varia com o valor do solo medio (0.75 a 1.5)
- businessBase = (commercialJobsTotal * COMMERCIAL_INCOME_PER_JOB) + (industrialJobsTotal * INDUSTRIAL_INCOME_PER_JOB)

### FLevels (dificuldade)
- Easy: 1.4
- Medium: 1.2
- Hard: 0.8

### cityTax inicial
- cityTax comeca em 7.

Arquivo: game.html

## 9) Custos fixos (manutencao)
- Estradas/trilhos/fios e servicos tem custo anual baseado no tamanho da cidade e infraestrutura.
- O quanto a cidade realmente gasta em cada area depende do financiamento (%) nos sliders.

### Exemplo de custo anual (infraestrutura)
- roadRequired = floor((infraTiles + railCost) * ROAD_UPKEEP_PER_TILE * RLevels[gameLevel])
- roadBudget = floor(roadRequired * (funding.roads / 100))

### RLevels (dificuldade)
- Easy: 0.7
- Medium: 0.9
- Hard: 1.2

Arquivo: game.html

## 10) Cashflow
- cashFlow = taxFund - totalExpense
- Se cashFlow negativo, a felicidade cai e o crescimento tende a piorar (nao ha degradacao visual automatica ainda).

Arquivo: game.html

## 11) Classificacao da cidade
Populacao total para classificacao:
- Town: > 2.000
- City: > 10.000
- Capital: > 50.000
- Metropolis: > 100.000
- Megalopolis: > 500.000

Arquivo: src/evaluation.js

## 12) Populacao real (usada no score e classe)
- cityPop = (resPop + (comPop + indPop) * 8) * 20

Arquivo: src/evaluation.js

## 13) Poluicao (valores por tile)
- Trafego baixo: 50
- Trafego alto: 75
- Fogo: 90
- Radiacao: 255
- Industria: 50
- Usina de carvao: 100

Arquivo: src/blockMapUtils.js

## 14) Valor da terra
- Range: 0 a 250
- Fatores:
  - Distancia do centro
  - Poluicao
  - Crime
  - Proximidade de areas verdes/nao desenvolvidas

Arquivo: src/blockMapUtils.js

## 15) Crime
- Range: 0 a 250
- Fatores:
  - Baixo valor da terra
  - Alta densidade populacional
  - Falta de cobertura policial

Arquivo: src/blockMapUtils.js

## 16) Penalidades no score
- Penaliza demanda cap (falta de estadio/porto/aeroporto): -15% por demanda capada.
- Penaliza demanda colapsada (valve < -1000): -15%.
- Penaliza estradas subfinanciadas.
- Penaliza policia/bombeiros subfinanciados (ate 10%).
- Penaliza fires e impostos altos.
- Penaliza zonas sem energia (escala proporcional).

Arquivo: src/evaluation.js

## 17) Observacoes praticas
- Residencial depende de comercio, comercio depende de industria, industria depende de residencial.
- Sem energia, crescimento sofre queda forte.
- Imposto alto reduz crescimento geral (valves).
- Conectividade por estrada e critica para evolucao.

## 18) Exemplos praticos (como jogar pensando na simulacao)
### Exemplo A: Inicio seguro (primeiros 2-3 anos)
- Objetivo: gerar demanda positiva e manter caixa estavel.
- Passo a passo:
  - Coloque uma usina de carvao e conecte com fios.
  - Desenhe um pequeno grid de estradas.
  - Zoneie 2 quarteiroes residenciais, 1 comercial e 1 industrial (R-C-I em proporcao 2:1:1).
  - Garanta que todos os quarteiroes tenham estrada e energia.
  - Deixe o imposto em 7.
- Resultado esperado:
  - Crescimento inicial de residencial, seguida por comercio e industria.
  - A receita de imposto deve cobrir manutencao basica.

### Exemplo B: Crescimento por demanda (quando travar)
- Sintoma: zonas nao evoluem apesar de existir espaco.
- Checagem rapida:
  - Residencial travado: existe rota ate comercio?
  - Comercial travado: existe rota ate industria?
  - Industrial travado: existe rota ate residencial?
  - Todas as zonas tem energia?
  - Poluicao local esta alta?
- Acoes:
  - Conectar estradas entre zonas (reduz NO_ROAD_FOUND).
  - Criar mais do tipo faltante (ex.: se res cresce e com nao, adicione industria).
  - Diminuir impostos se valves estiverem negativos por muito tempo.

### Exemplo C: Evitar queda de caixa
- Sintoma: cashFlow negativo.
- Solucao rapida:
  - Reduzir expansao de estradas (manutencao sobe com roadTotal).
  - Adiar policia e bombeiros ate ter populacao maior.
  - Aumentar densidade antes de expandir area.
  - Manter impostos entre 6 e 9 ate estabilizar crescimento.

### Exemplo D: Crescimento acelerado
- Objetivo: acelerar demanda positiva.
- Acoes:
  - Mantenha crime e poluicao baixos (aumenta valor da terra).
  - Distribua zonas em blocos conectados por estrada e energia.
  - Evite zonas isoladas sem conexao (elas degradam).
  - Construa porto/aeroporto/estadio quando mensagens pedirem (evita cap nas valves).

Fim do manual.
