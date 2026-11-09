# Modulo: Rateio & Auditoria

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/auditoria/ · ascender-app/src/lib/db/auditar-rateio.ts · ascender-app/src/lib/db/inspecionar-rateio.ts · ascender-app/src/lib/db/investigar-atencao.ts · ascender-app/src/lib/db/reconciliar-fatura.ts · ascender-app/src/lib/db/sync-rateio-dg.ts · ascender-app/src/lib/db/conciliar-dg.ts · ascender-app/src/app/(dashboard)/rateio/page.tsx · ascender-app/src/app/(dashboard)/cadastros/conciliacao/page.tsx · ascender-app/src/lib/digitalgrid/sync.ts · ascender-app/src/lib/digitalgrid/queries.ts · ascender-app/src/lib/digitalgrid/cadastros.ts · ascender-app/src/lib/cadastros/actions.ts

## Visao geral
Subsistema que trata do rateio de creditos de geracao compartilhada (dados do Digital Grid) e da auditoria de consistencia entre rateio, faturas e cadastro local. O rateio real e sincronizado do Digital Grid (endpoint `/estimated-quota/`) para a tabela `rateios_dg` e exibido em `/rateio`. A auditoria (`lib/auditoria/`) e um motor de regras PURAS (sem I/O) que carrega rateios/faturas/UCs e devolve uma lista de `Finding` (inconsistencias + impacto financeiro estimado). Existe ainda a conciliacao de cadastros (clientes/usinas/UCs do DG -> banco local) e varios scripts CLI de investigacao/reconciliacao usados para calibrar as regras. A auditoria esta na "Fase 1": SOMENTE LEITURA, nada e gravado; roda apenas por CLI (`npm run db:auditar-rateio`), sem tela nem persistencia.

## Responsabilidades
- Sincronizar o rateio (cotas de geracao compartilhada) do Digital Grid para `rateios_dg` (`syncRateioDg`).
- Exibir o rateio por UC/usina/competencia na tela `/rateio` com KPIs (cotas, usinas, UCs, consumo).
- Auditar consistencia: UC sem rateio, credito x consumo incompativel (risco de expiracao SCEE), fatura sem UC, fatura duplicada, competencia incorreta, credito parado, desconto abaixo do contratado.
- Estimar impacto financeiro (R$) de cada achado usando uma tarifa de referencia.
- Diagnosticar a qualidade/semantica dos dados do DG (escala do `percentual`, taxas de juncao DG <-> cadastro) antes de confiar nas regras.
- Conciliar cadastros do DG (clientes, usinas, UCs) com o banco local, sem duplicar (tela `/cadastros/conciliacao` + server action).
- Ferramentas CLI de investigacao (inspecionar rateio, investigar pontos de atencao, reconciliar boleto) para calibrar regras contra os dados reais.

## Principais arquivos
| Caminho | Papel |
|---|---|
| ascender-app/src/lib/auditoria/types.ts | Tipos `Finding`, `Severidade`, `AuditReport`, `RegrasOpts`, `DiagnosticoDados` e defaults `REGRAS_OPTS_PADRAO`. |
| ascender-app/src/lib/auditoria/queries.ts | Camada de I/O (so leitura): `carregarDadosAuditoria` carrega `rateios_dg`, `faturas_dg` e UCs (join `clientes`); extrai campos do `raw` da fatura (`agent_discount`, `total_amount_without_discount`, `total_amount_distributor`, etc.). |
| ascender-app/src/lib/auditoria/rules.ts | Motor de regras PURO: diagnostico de dados + validacoes (`regraUcSemRateio`, `regraConsumoCreditoIncompativel`, `regraFaturaSemUc`, `regraFaturaDuplicada`, `regraCompetenciaIncorreta`, `regraCreditoParado`, `regraDescontoAbaixoContratado`) e orquestrador `rodarRegras`. |
| ascender-app/src/lib/auditoria/run.ts | Orquestrador: le o banco, monta diagnostico, aplica overrides de env, roda regras e devolve `AuditReport` em memoria (`gerarRelatorioAuditoria`). |
| ascender-app/src/lib/db/auditar-rateio.ts | CLI `db:auditar-rateio`: imprime relatorio legivel ou `--json`; agrupa por regra/severidade e soma impacto. So leitura. |
| ascender-app/src/lib/db/inspecionar-rateio.ts | CLI `db:inspecionar-rateio`: decodifica semantica do DG (soma de % por `generation_month_id`, o que e `covering`, geradora x consumidora). So leitura. |
| ascender-app/src/lib/db/investigar-atencao.ts | CLI `db:investigar-atencao`: credito por UC vs por titular (lockstep), serie temporal por titular, UCs `-CANCEL`, distribuicao de `agent_discount`. So leitura. |
| ascender-app/src/lib/db/reconciliar-fatura.ts | CLI `db:reconciliar-fatura`: despeja campos monetarios do `raw` e testa formulas candidatas contra `total_value`/`agent_discount`. So leitura. |
| ascender-app/src/lib/db/sync-rateio-dg.ts | CLI `db:sync-rateio-dg`: chama `syncRateioDg` via `registrarSyncRun("rateio_dg", ...)`. |
| ascender-app/src/lib/db/conciliar-dg.ts | CLI `db:conciliar-dg`: chama `importarCadastrosDg` (conciliacao de cadastros). |
| ascender-app/src/lib/digitalgrid/sync.ts | `syncRateioDg` (upsert em `rateios_dg`) e `syncFaturasDg` (upsert em `faturas_dg`); resolve competencia via `/monthly-generation/` e nome da usina via `/generators/`. |
| ascender-app/src/lib/digitalgrid/queries.ts | Leituras: `listRateioDg`, `getUltimaSyncRateioDg`, mapas `getClientePorInstalacao`/`getDocumentoPorInstalacao`. |
| ascender-app/src/lib/digitalgrid/cadastros.ts | `getConciliacaoReport` (leitura p/ tela) e `importarCadastrosDg` (escreve so no banco local). |
| ascender-app/src/lib/cadastros/actions.ts | Server action `importarCadastrosDg` (wrapper autenticado) consumida pela tela de conciliacao. |
| ascender-app/src/app/(dashboard)/rateio/page.tsx | Tela do rateio (server component). |
| ascender-app/src/app/(dashboard)/cadastros/conciliacao/page.tsx | Tela de conciliacao de cadastros. |

## Entidades / tabelas
| Tabela (real) | Uso neste modulo |
|---|---|
| `rateios_dg` | Fonte principal do rateio (cotas). Chave unica `rateios_dg_month_installation_owner` (generation_month_id + installation + owner_document). Campos: `percentual`, `covering`, `consumo_kwh`, `creditos_acumulados`, `usina_nome`, `generator_number`, `raw`. So leitura na auditoria; escrita apenas no sync. |
| `faturas_dg` | Fonte das validacoes financeiras. `dg_bill_id` unico. Campos usados: `competencia`, `installation_number`, `valor_total`, `economia`, `vencimento`, `payment_status` e do `raw`: `agent_discount`, `total_amount_without_discount`, `total_amount_distributor`, `lightning`, `extra_charges`. |
| `unidades_consumidoras` | Cadastro local de UC (`codigo_instalacao`, `ativo`, `consumo_medio_kwh`, `origem`). Usada para juncao com o rateio/fatura e para conciliacao. |
| `clientes` | Join para obter `nome`/`documento` do titular da UC (join em `carregarDadosAuditoria` e nas conciliacoes). |
| `usinas` | Conciliacao (vinculo por `codigo_digital_grid` / nome). Nao lida diretamente pela auditoria. |
| `distribuidoras` | Conciliacao de UCs (match do distribuidor do DG). |
| `sync_runs` | Registro da execucao de `syncRateioDg` (via `registrarSyncRun`, tipo `rateio_dg`); alimenta `getUltimaSyncRateioDg`. |

## Endpoints / Server Actions
- Server Action `importarCadastrosDg` — ascender-app/src/lib/cadastros/actions.ts:546 (`"use server"`, exige sessao; chama `runImportarCadastrosDg` e `revalidatePath("/cadastros")`). Unica escrita disparada por UI neste subsistema.
- NAO ha rota de API (`route.ts`) para rateio/auditoria. As telas usam server components lendo direto do banco (`listRateioDg`, `getUltimaSyncRateioDg`, `getConciliacaoReport`).
- Scripts CLI (tsx, via package.json): `db:sync-rateio-dg`, `db:conciliar-dg`, `db:auditar-rateio`, `db:inspecionar-rateio`, `db:investigar-atencao`, `db:reconciliar-fatura`.
- Funcao publica de auditoria: `gerarRelatorioAuditoria()` (run.ts) — retorna `AuditReport` em memoria; hoje so o CLI a consome.

## Telas
- `/rateio` — ascender-app/src/app/(dashboard)/rateio/page.tsx (KPIs + `RateioDgTable`; `dynamic = "force-dynamic"`).
- `/cadastros/conciliacao` — ascender-app/src/app/(dashboard)/cadastros/conciliacao/page.tsx (relatorio de conciliacao + botao importar).
- A auditoria (`lib/auditoria`) NAO possui tela — so saida CLI.

## Regras de negocio
Regras ATIVAS (orquestradas em `rodarRegras`, rules.ts:562-590):
- UC sem rateio (`uc_sem_rateio`, rules.ts:166) — UC `ativo` sem cota na competencia recente gera achado severidade `alta`; exclui geradoras/consorcio (`ehGeradoraOuConsorcio`, rules.ts:154, casa por `generator_number` ou regex `consorcio|ases` no nome). Impacto = `consumoMedioKwh * tarifaRef * 0.15` (rules.ts:193) — o fator 0.15 (~15% de margem/desconto) e **HIPOTESE** (constante embutida, sem origem documentada).
- Credito x consumo incompativel (`consumo_credito_incompativel`, rules.ts:273) — credito acumulado > `fatorCreditoExcessivo` (3) x consumo mensal gera alerta; dedup por TITULAR quando 2+ UCs do mesmo `owner_document` tem credito em "lockstep" (<5% de diferenca), tratado como saldo do titular replicado (conta 1x). Impacto = excedente que expira alem de `mesesExpiracaoScee` (60) meses x `tarifaRef` (rules.ts:236-268). UC `-CANCEL` vira severidade `info` (encerramento).
- Fatura sem UC (`fatura_sem_uc`, rules.ts:379) — `installation_number` da fatura sem UC cadastrada, severidade `media`.
- Fatura duplicada (`fatura_duplicada`, rules.ts:405) — mesma UC + competencia com >1 fatura, severidade `critica`; impacto = soma das faturas excedentes (alem da primeira por `dg_bill_id`).
- Competencia incorreta (`competencia_incorreta`, rules.ts:442) — fatura sem competencia OU vencimento distante (lag < 0 ou > 2 meses da competencia). Severidade `info`. Regra implicita: vencimento cai no mes da competencia ou ate 2 meses depois.
- Credito parado (`credito_parado`, rules.ts:485) — saldo nao-decrescente por `minCompetenciasTendencia` (3) competencias e saldo final > 2x consumo medio, severidade `alta`. Impacto = saldo x `tarifaRef`.
- Desconto abaixo do contratado (`desconto_abaixo_contratado`, FIN-1, rules.ts:335) — base de energia = `total_sem_desconto - total_distribuidor` (retira o residuo NAO descontavel da distribuidora: fio B, taxas, iluminacao — Lei 14.300). Desconto efetivo = `economia / baseEnergia * 100`; alerta `alta` quando efetivo < contratado - `tolDescontoPct` (2 p.p.). Pula encerramento (`agent_discount >= 99%`). Impacto = `esperado - economia`.

Regras DESATIVADAS apos inspecao dos dados reais (2026-06) — mantidas para teste/uso futuro (rules.ts:583-590):
- `regraSomaPercentual` (#1) — desativada: `percentage` do DG nao particiona 100% por gerador (UCs compartilhadas entre usinas somam 100/150/200%).
- `regraRateioDuplicado` (#3) — desativada: multi-gerador por UC e NORMAL na geracao compartilhada (confirmado pelo negocio).
- `diagUcSubalocada` — desativada: `covering` e um indice/ratio do DG (0-3), NAO kWh.
- FIN-2 (`regraCobrancaInconsistente`) — APOSENTADA: boleto do DG e heterogeneo (boleto simples vs alta compensacao com fio B), sem formula unica; recomputar gera falso-positivo (rules.ts:373-376).

Parametros calibraveis (`REGRAS_OPTS_PADRAO`, types.ts:82; overrides por env em run.ts):
- `tarifaRef` 0.98 R$/kWh (env `AUDITORIA_TARIFA_REF`), `tolPercentual` 1, `fatorCreditoExcessivo` 3 (`AUDITORIA_FATOR_CREDITO`), `minCompetenciasTendencia` 3, `mesesExpiracaoScee` 60 (`AUDITORIA_MESES_EXPIRACAO`; expiracao SCEE ANEEL), `tolDescontoPct` 2 (`AUDITORIA_TOL_DESCONTO_PCT`), `tolCobrancaBrl` 1.
- Escala do `percentual` e INFERIDA dos dados (`inferirEscalaPercentual`, rules.ts:38): max<=1.5 => fracao 0-1 (fator 100); max<=100.5 => 0-100 (fator 1); senao indefinida.

Regras da conciliacao (cadastros.ts):
- Clientes casam por documento (so digitos); usinas por `codigo_digital_grid` com fallback por nome normalizado; UCs por `codigo_instalacao`. Nao duplica; carimba `origem = "digitalgrid"` (idempotente).
- Usinas NAO sao criadas automaticamente (nomes SolisCloud x DG divergem) — vinculo manual pelo Codigo Digital Grid; so enriquece quando o nome bate exato (cadastros.ts:169-187).
- UC recebe `ativo = !numero.includes("CANCEL")` (cadastros.ts:243) — sufixo `-CANCEL` marca encerramento.

Regras do sync do rateio (sync.ts):
- Upsert por chave composta (`generation_month_id` + `installation` + `owner_document`); deduplica dentro do lote antes do INSERT; competencia derivada de `monthly-generation.reference` (`YYYY-MM`); nome da usina do `nickname` do gerador. Trava de seguranca de 100 paginas.

## Dependencias
- Depende de:
  - `@/lib/db` (`getDb`, Drizzle) e `@/lib/db/schema` (`rateiosDg`, `faturasDg`, `unidadesConsumidoras`, `clientes`, `usinas`, `distribuidoras`, `syncRuns`).
  - `@/lib/digitalgrid` — `client` (`dgGet`), `sync` (`syncRateioDg`), `cadastros` (`importarCadastrosDg`, `getConciliacaoReport`), `queries` (`listRateioDg`, `getUltimaSyncRateioDg`), `credentials` (`getDgCredential`).
  - `@/lib/db/sync-run` (`registrarSyncRun`) para registrar o sync do rateio.
  - `@/lib/auth/session` (server action de conciliacao exige sessao).
  - Componentes UI: `RateioDgTable`, `SummaryStrip`, `EmptyState`, `ImportarCadastrosDg`.
- Consumido por:
  - CLI/operacao: scripts `db:*` (rodados manualmente ou por automacao de deploy/cron da VPS — a confirmar).
  - Telas `/rateio` e `/cadastros/conciliacao`.
  - `AuditReport` de `gerarRelatorioAuditoria` hoje so e consumido pelo CLI `auditar-rateio.ts`.

## Riscos de alteracao
- A auditoria depende da semantica do `raw` do Digital Grid (`agent_discount`, `total_amount_without_discount`, `total_amount_distributor`). Se o DG mudar nomes/escala de campos, `regraDescontoAbaixoContratado` e a extracao em `queries.ts` quebram silenciosamente (campos viram null e a regra e pulada).
- Constantes embutidas fragil: fator 0.15 no impacto de `uc_sem_rateio`, limiar de lockstep 5%, `> 2x consumo` no credito parado, `agent_discount >= 99%` como encerramento. Alterar dados ou premissas muda os achados sem aviso.
- `regraFaturaDuplicada` marca `critica` e soma impacto das excedentes — reativar sync que reprocessa faturas ou mudar a chave `dg_bill_id` pode gerar falsos criticos.
- Reativar regras desativadas (`regraSomaPercentual`, `regraRateioDuplicado`, `diagUcSubalocada`) sem reinterpretar `percentage`/`covering` gera enxurrada de falsos positivos (documentado nos comentarios).
- Escala do `percentual` e inferida por heuristica (`inferirEscalaPercentual`); dados atipicos podem cair em "indefinida" e desvirtuar qualquer regra que dependa de percentual.
- Conciliacao (`importarCadastrosDg`) escreve no banco local e cria clientes/UCs; mudar o match por documento/nome pode duplicar cadastros ou vincular UC ao cliente errado.
- `covering` NAO e kWh (e indice 0-3 do DG); qualquer regra nova que o trate como energia estara errada.

## Pendencias / a investigar
- Confirmar se/como os scripts (`db:sync-rateio-dg`, `db:auditar-rateio`) sao disparados por cron/deploy na VPS (o commit recente cita polling/cron, mas nao foi encontrado o agendamento nestes arquivos).
- Origem/justificativa do fator 0.15 no impacto de `uc_sem_rateio` (marcado HIPOTESE) — precisa ser documentado ou parametrizado.
- A "Fase 2" (persistencia dos achados / tela de auditoria) esta prevista nos comentarios mas nao existe: sem tabela de findings, sem historico, sem UI.
- Testes: `src/lib/auditoria/rules.test.ts` cobre todas as regras puras de `rules.ts` (inclusive as desativadas e o fato de `rodarRegras` nao executa-las); `npm test`. `queries.ts`/`run.ts` (I/O) nao sao testados.
- `mesesExpiracaoScee = 60` e citado como regra ANEEL; confirmar aderencia a Lei 14.300 (prazo/condicoes de expiracao do saldo SCEE) para o cenario real dos clientes.
- Vinculo "Lei 14.300" no codigo aparece so indiretamente (residuo fio B na base de desconto + expiracao SCEE 60m); nao ha modulo dedicado a Fio B dentro deste subsistema (o Fio B do gerador de propostas e outro modulo).

## Fontes
- ascender-app/src/lib/auditoria/types.ts
- ascender-app/src/lib/auditoria/queries.ts
- ascender-app/src/lib/auditoria/rules.ts
- ascender-app/src/lib/auditoria/run.ts
- ascender-app/src/lib/db/auditar-rateio.ts
- ascender-app/src/lib/db/inspecionar-rateio.ts
- ascender-app/src/lib/db/investigar-atencao.ts
- ascender-app/src/lib/db/reconciliar-fatura.ts
- ascender-app/src/lib/db/sync-rateio-dg.ts
- ascender-app/src/lib/db/conciliar-dg.ts
- ascender-app/src/lib/digitalgrid/sync.ts
- ascender-app/src/lib/digitalgrid/queries.ts
- ascender-app/src/lib/digitalgrid/cadastros.ts
- ascender-app/src/lib/cadastros/actions.ts
- ascender-app/src/lib/db/schema.ts (tabelas rateios_dg, faturas_dg, unidades_consumidoras, clientes, usinas)
- ascender-app/src/app/(dashboard)/rateio/page.tsx
- ascender-app/src/app/(dashboard)/cadastros/conciliacao/page.tsx
- ascender-app/package.json (scripts db:*)
