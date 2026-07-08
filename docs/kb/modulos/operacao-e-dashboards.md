# Modulo: Operacao & Dashboards

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/operacao/{operational-overview.ts, health-score.ts, incidents.ts, timeline.ts}, ascender-app/src/lib/dashboard-data.ts, ascender-app/src/app/(dashboard)/{page.tsx, executivo, analise, geracao, mapa, usinas, soliscloud}/page.tsx, ascender-app/src/components/operacao/{HealthScore,AttentionCenter,IncidentItem,StatTile,OperationalTimeline}.tsx, ascender-app/src/components/{UsinasMap,GenerationHeatmap}.tsx

## Visao geral
Camada de leitura e apresentacao que transforma a telemetria (mantida no banco pelo worker `sync-telemetria`) e os dados de faturamento em paineis operacionais e executivos. Centraliza a apuracao de estado da frota num unico snapshot (`getOperationalOverview()`) e deriva dele o Health Score (nota 0-100 de saude da operacao), o Centro de Atencao (incidentes priorizados) e a Linha do tempo. Existe para dar visao NOC/SOC ao vivo (dashboard raiz e SolisCloud) e visao de diretoria (Executivo), alem de telas de analise, geracao, mapa e usinas. As telas leem do banco, nao batem na API SolisCloud ao vivo.

## Responsabilidades
- Ler um snapshot operacional unico (estacoes, coletores, ultima telemetria, faturas vencidas) e o contexto de janela solar.
- Calcular o Health Score (funcao pura, pesos versionados) e o rotulo/status da operacao.
- Montar a lista priorizada de incidentes (Centro de Atencao) e a linha do tempo de eventos.
- Renderizar dashboards: overview ao vivo, executivo, analise interativa, historico de geracao, mapa por pinos e performance de usinas.
- Cruzar realizado (SolisCloud) x meta proporcional aos dias do mes para aderencia.
- Servir as APIs de telemetria (somente leitura, autenticadas) consumidas pelas telas client-side.

## Principais arquivos
| Caminho | Papel |
|---|---|
| ascender-app/src/lib/operacao/operational-overview.ts | Unica camada de I/O da operacao; `getOperationalOverview()` (snapshot) e `isSolarWindowAt()` (janela solar 06-18h SP) |
| ascender-app/src/lib/operacao/health-score.ts | `computeHealthScore()` (pura) + `getHealthScore()`; pesos, faixas e regras de protecao da nota |
| ascender-app/src/lib/operacao/incidents.ts | `buildIncidents()` (pura) + `getIncidents()`; regras/priorizacao de incidentes |
| ascender-app/src/lib/operacao/timeline.ts | `buildTimeline()` (pura) + `getTimeline()`; mescla alarmes + sync_runs + ultima telemetria |
| ascender-app/src/lib/dashboard-data.ts | Formatadores (money/number/competencia/data/tempoRelativo), `modules`, `viewTitles`, `viewSubtitles` (navegacao) |
| ascender-app/src/app/(dashboard)/page.tsx | Overview "Operacao ao vivo" (RSC): HealthScore, PowerRing, AttentionCenter, OperationalTimeline, frota |
| ascender-app/src/app/(dashboard)/executivo/page.tsx | Dashboard executivo (RSC): aderencia global, MetricCards, ComparisonChart, GenerationChart, GenerationHeatmap |
| ascender-app/src/app/(dashboard)/analise/page.tsx | Analise interativa (client): barras/rosca nivo, filtro por usina e periodo |
| ascender-app/src/app/(dashboard)/geracao/page.tsx | Historico de geracao (client): curva por usina/periodo + tabela geracao diaria x meta |
| ascender-app/src/app/(dashboard)/mapa/page.tsx | Mapa por pinos (RSC): monta MapPins a partir de lat/lon do cadastro |
| ascender-app/src/app/(dashboard)/usinas/page.tsx | Performance de usinas (RSC): KPIs, BarList de aderencia, "abaixo da meta", UsinasTable |
| ascender-app/src/app/(dashboard)/soliscloud/page.tsx | Operacao SolisCloud (client): StatTiles com filtro, AttentionCenter (incidentes montados no cliente), telemetria, coletores, alarmes, inversores, historico/O&M |
| ascender-app/src/components/operacao/HealthScore.tsx | Widget do Health Score (gauge SVG + motivos) |
| ascender-app/src/components/operacao/AttentionCenter.tsx | Painel do Centro de Atencao (lista de IncidentItem) |
| ascender-app/src/components/operacao/OperationalTimeline.tsx | Linha do tempo operacional |
| ascender-app/src/components/UsinasMap.tsx | Mapa SVG do Brasil (bbox + contorno embutido) com pinos por status |
| ascender-app/src/components/GenerationHeatmap.tsx | Heatmap usina x competencia (rampa de cor unica) |

## Entidades / tabelas
Tabelas Postgres (Drizzle, `ascender-app/src/lib/db/schema.ts`) lidas por este modulo (todas somente leitura aqui):
- `telemetria_estacao` — snapshots de estacoes; estado atual via `selectDistinctOn(stationId)` por `capturado_em` desc.
- `telemetria_inversor` — snapshots de inversores.
- `telemetria_coletor` — snapshots de dataloggers (coletores).
- `alarmes` — alarmes SolisCloud (ativo/resolvido).
- `sync_runs` — execucoes dos workers (job, status, itens) para timeline.
- `medicoes_geracao` — geracao mensal por usina/competencia (historico e heatmap).
- `usinas` — cadastro (potencia_kwp, geracao_esperada_kwh_mes, station_id_soliscloud, latitude, longitude).
- `faturas_dg` — faturas Digital Grid (Health Score: vencidas; Executivo: recebido/em aberto).
- `faturas` — faturas do cadastro (usado por `getResumoFaturas`, secundario).

## Endpoints / Server Actions
Nao ha Server Actions neste modulo. As telas RSC (overview, executivo, mapa, usinas) chamam funcoes de query diretamente no servidor; as telas client (analise, geracao, soliscloud) consomem rotas GET autenticadas (`requireSession`, `runtime nodejs`, `dynamic force-dynamic`):

| Rota (ascender-app/src/app/api/...) | Funcao de dados |
|---|---|
| soliscloud/stations/route.ts | `lerEstacoesDoBanco()` |
| soliscloud/stations/[id]/route.ts | detalhe da estacao |
| soliscloud/stations/[id]/generation/route.ts | `curvaGeracaoBanco(id, period)` |
| soliscloud/inverters/route.ts | `lerInversoresDoBanco()` |
| soliscloud/alarms/route.ts | `lerAlarmesDoBanco()` |
| soliscloud/collectors/route.ts | `lerColetoresDoBanco()` |
| soliscloud/geracao-diaria/route.ts | `geracaoDiariaFrota(14)` |
| soliscloud/sync-status/route.ts | `ultimaTelemetriaEm()` |
| soliscloud/uptime-coletores/route.ts | `uptimeColetores(24)` |
| soliscloud/historico/route.ts | `historicoPotenciaFrota(24)` |
| soliscloud/historico-alarmes/route.ts | `historicoAlarmes()` |
| soliscloud/status/route.ts | status da integracao |

Funcoes de dados centrais (server): `getOperationalOverview`, `getHealthScore`, `getIncidents`, `getTimeline` (lib/operacao); `getUsinasComTelemetria`, `getTelemetriaPorStation`, `getHistoricoGeracaoMensal`, `geracaoPorUsinaMes`, `listUsinas` (lib/cadastros/queries); `getResumoFaturasDg`, `contarFaturasVencidasDg` (lib/digitalgrid/queries).

## Telas
- `/` — Operacao ao vivo (overview). Configurada em layout como `viewTitles.overview`.
- `/executivo` — Dashboard executivo.
- `/analise` — Analise de geracao (client, nivo).
- `/geracao` — Historico de geracao (client).
- `/mapa` — Mapa das usinas (RSC).
- `/usinas` — Performance de usinas (RSC).
- `/soliscloud` — Operacao SolisCloud (client), abas "Operacao ao vivo" / "Historico & O&M".
Rotulos/subtitulos definidos em `dashboard-data.ts` (`viewTitles`/`viewSubtitles`) e no `getViewMeta` do `(dashboard)/layout.tsx` (geracao/mapa/analise nao estao no array `modules`, tem titulo dedicado no layout).

## Regras de negocio
Health Score (health-score.ts):
- Pesos maximos por fator (explicita, ref. PLANO_FASE_2A_HEALTHSCORE.md): W_OFFLINE=45, W_ALARM=20, W_COLLECTORS=20, W_STALE=15, W_INVOICES=10 (linhas 48-52).
- Penalidade de atraso: sem penalidade ate 30 min, maxima a partir de 180 min, linear no meio (STALE_OK_MIN=30, STALE_MAX_MIN=180; linhas 54-68).
- Faturas: penaliza ate 20 faturas vencidas (satura em 20) (linhas 124-127).
- Nota = clamp(round(100 - somaPenalidades), 0, 100) (129-133). Faixas: >=85 healthy, >=60 attention, senao critical (137).
- Regras de protecao (explicitas, 141-154): de dia, offline>0 rebaixa healthy->attention; qualquer alarme rebaixa healthy->attention (um alarme isolado NAO torna critico); de dia, offline/total >= 0.3 -> critical; ultima comunicacao > 60 min rebaixa healthy->attention.
- Janela solar: a noite (fora de 06-18h SP), usina offline = ausencia de geracao esperada, nao penaliza nem vira critico; coletor e alarme seguem penalizando (117, 141, 146).
- `noData=true` quando `totalPlants<=0 && lastCommAgeMinutes==null` (exibe "-", nota nao significativa) (96-112).

Incidentes (incidents.ts):
- Sem telemetria total (`totalPlants==0 && lastComm==null`): unico incidente informativo com CTA "Configurar" (68-80).
- De dia: cada usina offline vira incidente critico; a noite: agrega num unico item informativo "Sem geracao (fora da janela solar)" (83-110).
- Alarme -> warning; coletor offline -> warning; telemetria atrasada >30min -> info, >60min -> warning; faturas vencidas -> warning (112-159).
- Ordenacao por severidade critical(0)/warning(1)/info(2), estavel (28-39, 161).

Janela solar (operational-overview.ts): `SOLAR_WINDOW = {6, 18}` fixo, fuso America/Sao_Paulo, intervalo [06,18); se `Intl` nao devolver hora, assume dia (conservador) (12, 47-57). [aproximacao] — nao ha coordenadas por usina para nascer/por do sol reais (comentario linhas 9-11).

Faturas vencidas (digitalgrid/queries.ts:106-116, explicita): `vencimento < hoje (SP)` E `coalesce(valorPago,0) < coalesce(valorTotal,0)`.

Aderencia realizado x meta (cadastros/queries.ts:387-407, explicita): meta proporcional = `geracaoEsperadaKwhMes * fracaoMes`, com `fracaoMes = min(dia/diasNoMes, 1)`; `aderenciaPct = realizado/esperado*100`. "Usina na meta" = aderenciaPct >= 100 (executivo/usinas). Tone: >=85 ok, >=70 warn, senao bad (executivo:38-39, usinas:44-51).

Geracao diaria da frota (telemetria-db.ts:176-211, explicita): meta diaria = `sum(geracao_esperada_kwh_mes)/30`; realizado do dia = `max(energia_dia_kwh)` por estacao/dia (acumulado) somado entre estacoes, no fuso SP. Aderencia na tabela: verde >=100%, vermelho <70% (geracao/page.tsx:52-58).

Heatmap (cadastros/queries.ts:196-225 + GenerationHeatmap.tsx): limitado ao ano corrente (`competencia like 'AAAA-%'`); celula sem registro = null ("sem dado", nao zero); intensidade de cor 12%-100% relativa ao maximo (garante visibilidade do minimo). Coluna do mes atual marcada "(parcial)".

Mapa (mapa/page.tsx + UsinasMap.tsx): so entram usinas com latitude E longitude nao nulas; cor do pino por `statusReal` (online=ok, alarm=warning, offline=critical, senao muted); projecao equiretangular sobre bbox do Brasil; contorno do pais embutido (~45 vertices), sem tiles/API externa.

Uptime coletores (telemetria-db.ts:348-374): `pct = online/total` de snapshots nas ultimas 24h; verde >=95%, vermelho <80% (soliscloud/page.tsx:308-314).

Timeline (timeline.ts): mescla alarmes (ativo=warning, resolvido=success), sync_runs (ok=success, erro=critical) e ultima telemetria (atrasada se >60min=warning); ordena por data desc; limite default 8 (62-129).

HIPOTESE: a SolisCloud page reconstroi os incidentes no cliente (soliscloud/page.tsx:124-189) replicando a mesma logica solar (06-18h) de `incidents.ts`, porem com `href` diferentes (usina offline aponta para /usinas no cliente vs /soliscloud no servidor) e sem os itens de telemetria atrasada/faturas. E uma duplicacao intencional para evitar I/O no cliente, mas as duas fontes podem divergir.

## Dependencias
- Depende de:
  - ascender-app/src/lib/soliscloud/telemetria-db.ts (todas as leituras de telemetria/alarmes/sync/uptime/curvas).
  - ascender-app/src/lib/cadastros/queries.ts (usinas x telemetria, historico e heatmap de geracao, listUsinas p/ coords).
  - ascender-app/src/lib/digitalgrid/queries.ts (faturas vencidas e resumo financeiro).
  - ascender-app/src/lib/db/schema.ts + lib/db (Drizzle/Postgres).
  - ascender-app/src/hooks/useSolis.ts + ascender-app/src/lib/api/soliscloud.ts (fetch client-side, TanStack Query, refetch ~5 min).
  - Worker externo `sync-telemetria` (popula as tabelas; fora deste modulo) e integracao SolisCloud/Digital Grid.
  - Libs de UI: @nivo/bar, @nivo/pie (analise), lucide-react; componentes compartilhados (PowerRing, MetricCard, ComparisonChart, GenerationChart, BarList, SummaryStrip, DataTable, StatusBanner, FrescorTelemetria).
- Consumido por:
  - `(dashboard)/layout.tsx` (navegacao via `modules`/`viewTitles`/`viewSubtitles` de dashboard-data.ts).
  - As proprias telas do grupo (dashboard) e o hub raiz.
  - Componentes `operacao/*` consomem os tipos e resultados das funcoes puras de lib/operacao.

## Riscos de alteracao
- Logica solar/incidentes duplicada entre servidor (`incidents.ts`) e cliente (`soliscloud/page.tsx`): mudar uma sem a outra causa divergencia de comportamento e de `href`.
- Pesos e limiares do Health Score sao constantes "magicas" acopladas ao doc PLANO_FASE_2A; alterar quebra a calibracao de status/rotulo e a semantica dos motivos.
- Duas convencoes de meta diaria coexistem: `geracaoDiariaFrota` usa metaMensal/30 (divisor fixo), enquanto `getUsinasComTelemetria` usa proporcional aos dias reais do mes — comparacoes cruzadas entre telas podem confundir.
- Heatmap e `geracaoPorUsinaMes` filtram por ano corrente; na virada de ano as colunas zeram (esperado, mas surpreende).
- Mapa: projecao equiretangular e contorno simplificado embutido — mexer no bbox/`project()` desalinha pinos e contorno (compartilham a mesma funcao propositalmente).
- Janela solar fixa 06-18h ignora estacao/localizacao; ampliar/estreitar muda quantas usinas offline viram critico.
- Telas leem "estado atual" via `selectDistinctOn` por `capturado_em`; se o worker parar, os dashboards mostram dados velhos sem erro (so o selo de frescor denuncia).
- `getOperationalOverview` faz 4 leituras em paralelo; `contarFaturasVencidasDg` tem `.catch(()=>0)` — falha de faturas nao derruba o overview, mas mascara o numero de vencidas.

## Pendencias / a investigar
- Os documentos referenciados PLANO_FASE_2A_HEALTHSCORE.md e PLANO_FASE_2B_ATTENTION_CENTER.md nao foram lidos/localizados nesta analise — confirmar existencia e se os pesos batem.
- Confirmar se ha algum ponto de escrita/edicao de coordenadas (latitude/longitude) das usinas — aparentemente feito em Cadastros › Usinas (fora deste modulo), nao verificado aqui.
- `OperationalTimeline` so aparece na tela overview; confirmar se e intencional nao expor no Executivo/SolisCloud.
- Divergencia de meta diaria (/30 vs dias reais) — verificar se e decisao de produto ou inconsistencia a corrigir.
- Nao verificado o codigo dos componentes compartilhados PowerRing/ComparisonChart/GenerationChart/UsinasTable/StatusBanner (usados, mas fora do foco do modulo).

## Fontes
- ascender-app/src/lib/operacao/operational-overview.ts
- ascender-app/src/lib/operacao/health-score.ts
- ascender-app/src/lib/operacao/incidents.ts
- ascender-app/src/lib/operacao/timeline.ts
- ascender-app/src/lib/dashboard-data.ts
- ascender-app/src/app/(dashboard)/page.tsx
- ascender-app/src/app/(dashboard)/layout.tsx
- ascender-app/src/app/(dashboard)/executivo/page.tsx
- ascender-app/src/app/(dashboard)/analise/page.tsx
- ascender-app/src/app/(dashboard)/geracao/page.tsx
- ascender-app/src/app/(dashboard)/mapa/page.tsx
- ascender-app/src/app/(dashboard)/usinas/page.tsx
- ascender-app/src/app/(dashboard)/soliscloud/page.tsx
- ascender-app/src/components/operacao/{HealthScore,AttentionCenter,IncidentItem,StatTile,OperationalTimeline}.tsx
- ascender-app/src/components/UsinasMap.tsx
- ascender-app/src/components/GenerationHeatmap.tsx
- ascender-app/src/hooks/useSolis.ts
- ascender-app/src/lib/cadastros/queries.ts
- ascender-app/src/lib/soliscloud/telemetria-db.ts
- ascender-app/src/lib/digitalgrid/queries.ts
- ascender-app/src/lib/db/schema.ts
- ascender-app/src/app/api/soliscloud/{stations,geracao-diaria,sync-status,uptime-coletores,historico}/route.ts
