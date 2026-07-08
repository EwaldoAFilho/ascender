# Modulo: Integracao Digital Grid

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/digitalgrid/ · ascender-app/src/lib/db/sync-faturas-dg.ts · ascender-app/src/lib/db/sync-rateio-dg.ts · ascender-app/src/lib/db/conciliar-dg.ts · ascender-app/src/lib/db/dg-preview.ts · ascender-app/src/lib/db/sync-run.ts · ascender-app/docker-compose.yml

## Visao geral
Integracao SOMENTE LEITURA com a Billing API v1 do Digital Grid (`https://gestao.dg.energy/api/v1`). Espelha para o Postgres local as faturas (`faturas_dg`) e o rateio estimado (`rateios_dg`) via jobs de sincronizacao rodados por um loop de cron do docker-compose (`sync-dg`) a cada 15 min. Tambem oferece conciliacao de cadastros (importa clientes/UCs e vincula usinas a partir do DG para o banco local, sem nunca escrever no DG). Existe para manter o financeiro e o rateio frescos nas telas sem consultar o DG em tempo de request e sem sobrecarregar a API externa.

## Responsabilidades
- Autenticar no DG com token cifrado e detectar o esquema de header (`Bearer`/`Token`).
- Cliente HTTP read-only com retry para erros transitorios (`dgGet`).
- Sincronizar faturas (`GET /bills/`) → upsert em `faturas_dg` por `dg_bill_id`.
- Sincronizar rateio (`GET /estimated-quota/`) → upsert em `rateios_dg`, cruzando `monthly-generation` e `generators` para resolver competencia e nome da usina.
- Conciliar cadastros: importar clientes/UCs e vincular usinas do DG no banco local (`importarCadastrosDg`) e gerar relatorio de pendencias (`getConciliacaoReport`).
- Expor queries de leitura para telas (faturas, rateio, resumos, ultima sync, mapa UC→cliente/documento).
- Registrar cada execucao em `sync_runs` (observabilidade `registrarSyncRun`).

## Principais arquivos
| Caminho | Papel |
| --- | --- |
| ascender-app/src/lib/digitalgrid/endpoints.ts | Base URL e catalogo de endpoints DG (`DG_ENDPOINTS`). |
| ascender-app/src/lib/digitalgrid/credentials.ts | Le/grava token cifrado em `integration_credentials` (provider `digital_grid`); `getDgCredential`, `saveDgToken`, `recordDgTest`. |
| ascender-app/src/lib/digitalgrid/client.ts | `dgGet` (GET autenticado read-only com retry) e `testDigitalGridConnection`. |
| ascender-app/src/lib/digitalgrid/sync.ts | `syncFaturasDg` e `syncRateioDg` (paginacao + upsert). |
| ascender-app/src/lib/digitalgrid/cadastros.ts | `getConciliacaoReport` (leitura) e `importarCadastrosDg` (escreve no banco local). |
| ascender-app/src/lib/digitalgrid/queries.ts | Queries de leitura para telas/health (faturas, rateio, resumos, mapas UC→cliente/documento). |
| ascender-app/src/lib/db/sync-faturas-dg.ts | CLI `npm run db:sync-faturas-dg` — roda `syncFaturasDg` dentro de `registrarSyncRun`. |
| ascender-app/src/lib/db/sync-rateio-dg.ts | CLI `npm run db:sync-rateio-dg` — roda `syncRateioDg` dentro de `registrarSyncRun`. |
| ascender-app/src/lib/db/conciliar-dg.ts | CLI `npm run db:conciliar-dg` — roda `importarCadastrosDg`. |
| ascender-app/src/lib/db/dg-preview.ts | CLI `npm run dg:preview` — inspeciona `/entities/` e `/installations/` (diagnostico). |
| ascender-app/src/lib/db/sync-run.ts | `registrarSyncRun` (grava em `sync_runs`) e `getSyncRunsResumo`. |
| ascender-app/src/lib/api/digitalgrid.ts | Wrappers fetch client-side: `fetchDgStatus`, `saveDgToken`, `testDg`. |
| ascender-app/docker-compose.yml | Servico `sync-dg`: loop `db:sync-faturas-dg` + `db:sync-rateio-dg` a cada 900s. |

## Entidades / tabelas
- **faturas_dg** (schema.ts:254) — espelho das faturas do DG. Chave externa `dg_bill_id` (unique). Campos: `competencia`, `reference_date`, `fatura_numero`, `installation_number` (UC), `installation_class`, `payment_status`, `valor_energia`, `valor_total`, `valor_pago`, `economia`, `consumo_kwh`, `energia_injetada_kwh`, `vencimento`, `pago_em`, `raw` (jsonb da fatura completa), `sincronizado_em`.
- **rateios_dg** (schema.ts:324) — rateio estimado do DG. Unique composto `rateios_dg_month_installation_owner` = (`generation_month_id`, `installation`, `owner_document`). Campos: `competencia`, `generator_number`, `usina_nome`, `owner_name`, `percentual`, `covering`, `consumo_kwh`, `creditos_acumulados`, `annotations`, `raw`, `sincronizado_em`.
- **integration_credentials** (schema.ts:26) — reusada: `provider='digital_grid'`, `key_id` guarda o esquema do header (`Bearer`/`Token`), `key_secret_enc` guarda o token cifrado (AES-256-GCM), `base_url`, `last_test_at`, `last_test_ok`, `is_active`.
- **sync_runs** (schema.ts:552) — auditoria dos jobs `faturas_dg` e `rateio_dg` (start/fim/status/itens/mensagem).
- Escritas de conciliacao (`importarCadastrosDg`) tocam tambem: **clientes**, **unidades_consumidoras**, **usinas** (campo `codigo_digital_grid`), **distribuidoras** (somente leitura para vinculo). Coluna `origem`/`origem_sincronizado_em` (valores `manual|digitalgrid|soliscloud`) carimba a proveniencia.
- **contas_energia** (schema.ts:279) — nao pertence a este modulo, mas referencia `faturas_dg.id` (conta da distribuidora anexada a fatura DG).

## Endpoints / Server Actions
API routes (Next):
- `GET/PUT ascender-app/src/app/api/integrations/digitalgrid/credentials/route.ts` — GET retorna status (nunca o token); PUT salva token via `saveDgToken`. Protegido por `requireSession`.
- `POST ascender-app/src/app/api/integrations/digitalgrid/test/route.ts` — testa conexao via `testDigitalGridConnection`.
- `POST ascender-app/src/app/api/financeiro/conta/lote/route.ts` — consome `getDocumentoPorInstalacao` (mapa UC→documento do DG) para conferir CNPJ/CPF de PDFs em lote.

Server action:
- `importarCadastrosDg` em ascender-app/src/lib/cadastros/actions.ts:546 (reexporta `runImportarCadastrosDg` de digitalgrid/cadastros.ts).

Endpoints DG consumidos (externos, read-only): `/bills/`, `/estimated-quota/`, `/monthly-generation/`, `/generators/`, `/entities/`, `/installations/`, `/agents/` (usado so no teste de conexao). Constantes em `DG_ENDPOINTS`; na pratica so `DG_ENDPOINTS.agents` e referenciado — os demais paths estao hardcoded em sync.ts/cadastros.ts. `financialCredits` esta em `DG_ENDPOINTS` mas nao e chamado em lugar nenhum.

## Telas
- `/configuracoes/integracoes` — cartao `DigitalGridCard` (configurar/testar token).
- `/financeiro` — `listFaturasDg` + resumo de faturas DG.
- `/rateio` — `listRateioDg` (cotas do rateio DG).
- `/executivo` — `getResumoFaturasDg`.
- `/integracoes` — status/contagens de `faturas_dg`/`rateios_dg` e saude dos jobs (`getSyncRunsResumo`, `getDgRow`).
- `/cadastros/conciliacao` — `getConciliacaoReport` + botao `ImportarCadastrosDg`.

## Regras de negocio
Explicitas:
- Integracao e **somente leitura no DG**: `dgGet` so faz `GET` (client.ts:13-54); toda escrita e no banco local. Comentarios reforcam em sync.ts:62, cadastros.ts:104.
- Retry do cliente: 2 tentativas extras, backoff linear 0,8s×tentativa; 429/5xx sao transitorios, 401/403/404 sao definitivos (client.ts:34-53).
- Teste de conexao tenta `Bearer` depois `Token` em `GET /agents/`; grava o esquema que funcionou em `key_id` (client.ts:68-127, credentials.ts:51-61).
- Valores numericos do DG vem como string (ex.: "211.73") e sao convertidos por `num()` (sync.ts:15-22).
- Competencia = `reference` fatiado em "YYYY-MM" (sync.ts:31-34, 240).
- Faturas: upsert por `dg_bill_id`; sobrescreve todos os campos + `raw` a cada sync (sync.ts:87-107).
- Rateio: upsert por chave composta (`generation_month_id`, `installation`, `owner_document`); dedup no lote antes do insert mantendo a ultima ocorrencia da chave (sync.ts:183-193, 199-218). Registros com `generation_month_id <= 0` sao descartados (sync.ts:186).
- Rateio resolve competencia via `monthly-generation.reference` e `usina_nome` via `generators.nickname` (sync.ts:230-254).
- Paginacao com trava de seguranca `page > 100` em todos os loops (sync.ts:113, 224, 157; cadastros.ts:39).
- Health score conta faturas vencidas: `vencimento < hoje` (fuso America/Sao_Paulo) E `valor_pago < valor_total` (queries.ts:106-116).
- Mapa UC→cliente e UC→documento: rateio (`owner_name`/`owner_document`) e fallback; o cadastro local sobrescreve quando existe (queries.ts:42-48, 74-83).
- Conciliacao NAO cria usinas — so vincula `codigo_digital_grid` quando o nome normalizado bate exatamente; o resto fica para vinculo manual (cadastros.ts:169-187).
- Distribuidora da UC vinculada por match difuso de nome (`includes` nos dois sentidos), sem criar novas (cadastros.ts:190-197).
- Conciliacao e idempotente: registros ja existentes so recebem carimbo `origem='digitalgrid'` + `origem_sincronizado_em` (cadastros.ts:137-142, 206-212).

Implicitas / HIPOTESE:
- HIPOTESE: `document_type === 'CPF'` → cliente tipo `prosumidor`, senao `cliente` (cadastros.ts:145). A semantica prosumidor×cliente e inferida do codigo, nao documentada.
- HIPOTESE: UC considerada ativa quando o codigo NAO contem a substring "CANCEL" (`ativo: !numero.includes("CANCEL")`, cadastros.ts:243) — heuristica fragil baseada em convencao de nomenclatura do DG.
- HIPOTESE: quando a UC do DG nao tem cliente por documento, cria-se um cliente a partir da propria instalacao (`nickname`/`owner`) com tipo `cliente` (cadastros.ts:216-233).
- HIPOTESE: `payment_status` e persistido como texto livre do DG (ex.: "Pago"/"Pendente"), sem enum/normalizacao (schema.ts:262, sync.ts mapBill).

## Dependencias
- Depende de:
  - `@/lib/db` (Drizzle/Postgres) e schema (`faturas_dg`, `rateios_dg`, `integration_credentials`, `sync_runs`, `clientes`, `unidades_consumidoras`, `usinas`, `distribuidoras`).
  - `@/lib/crypto/secrets` (`encryptSecret`/`decryptSecret`, AES-256-GCM; depende de `APP_ENCRYPTION_KEY`).
  - `@/lib/db/sync-run` (`registrarSyncRun`).
  - `@/lib/auth/guard` (`requireSession`) nas rotas de API.
  - API externa Digital Grid Billing v1 e token valido.
  - Infra: servico `sync-dg` do docker-compose (loop 15 min) — cron de execucao.
- Consumido por:
  - Telas: `/financeiro`, `/rateio`, `/executivo`, `/integracoes`, `/cadastros/conciliacao`, `/configuracoes/integracoes`.
  - `@/lib/operacao/operational-overview.ts` (`contarFaturasVencidasDg` no Health Score).
  - `@/lib/auditoria/queries.ts` (le `faturas_dg`/`rateios_dg` para auditoria de rateio).
  - `@/lib/financeiro/conta.ts` e `/api/financeiro/conta/lote` (conciliacao de boleto usa `getDocumentoPorInstalacao`; `contas_energia` referencia `faturas_dg`).
  - CLIs de diagnostico: `db:auditar-rateio`, `db:inspecionar-rateio`, `db:investigar-atencao`, `db:reconciliar-fatura`.

## Riscos de alteracao
- **Cadencia divergente na UI**: em `/integracoes` os jobs `faturas_dg`/`rateio_dg` sao rotulados como "(6h)" (integracoes/page.tsx:112-113), mas o cron real roda a cada 15 min (docker-compose.yml:70). Label desatualizado — corrigir ao mexer.
- Trava `page > 100`: se o DG passar de 100 paginas em qualquer endpoint, a sync trunca dados silenciosamente.
- Upsert sobrescreve todos os campos + `raw` a cada ciclo; qualquer ajuste manual em `faturas_dg`/`rateios_dg` e perdido (tabelas sao espelho, mas cuidado com colunas adicionadas).
- Nao ha logica de exclusao: faturas/rateios removidos na origem permanecem no banco (registros orfaos). HIPOTESE.
- Chave do rateio nao inclui `competencia` diretamente (depende de `generation_month_id` codificar o mes); se o DG reusar ids de mes, ha risco de colisao.
- Regra `!numero.includes("CANCEL")` para `ativo` e o match difuso de distribuidora sao fragies a mudancas de nomenclatura no DG.
- Troca de esquema de header (`Bearer`↔`Token`) depende do teste de conexao ter rodado; um token novo salvo sempre entra como `Bearer` (credentials.ts:41).
- Descriptografia do token depende de `APP_ENCRYPTION_KEY` estavel; rotacao de chave invalida credenciais salvas.

## Pendencias / a investigar
- Confirmar a cadencia correta que deveria aparecer na tela `/integracoes` (15 min vs "6h" atualmente exibido).
- Endpoint `financial-credits` esta em `DG_ENDPOINTS` mas nao e consumido — verificar se ha uso planejado ou remover.
- Nao ha rotina de reconciliacao de registros removidos no DG (delete). Confirmar se e requisito.
- `payment_status` gravado como texto livre — confirmar valores possiveis e se ha necessidade de normalizacao/enum.
- Semantica de `covering` e `annotations` em `rateios_dg` nao esta documentada no codigo.
- `generation_month_id` como parte da chave: confirmar unicidade global desse id no DG (nao apenas por gerador/mes).

## Fontes
- ascender-app/src/lib/digitalgrid/endpoints.ts
- ascender-app/src/lib/digitalgrid/credentials.ts
- ascender-app/src/lib/digitalgrid/client.ts
- ascender-app/src/lib/digitalgrid/sync.ts
- ascender-app/src/lib/digitalgrid/cadastros.ts
- ascender-app/src/lib/digitalgrid/queries.ts
- ascender-app/src/lib/db/sync-faturas-dg.ts
- ascender-app/src/lib/db/sync-rateio-dg.ts
- ascender-app/src/lib/db/conciliar-dg.ts
- ascender-app/src/lib/db/dg-preview.ts
- ascender-app/src/lib/db/sync-run.ts
- ascender-app/src/lib/db/auditar-rateio.ts
- ascender-app/src/lib/db/reconciliar-fatura.ts
- ascender-app/src/lib/db/schema.ts (faturas_dg, rateios_dg, integration_credentials, sync_runs, contas_energia)
- ascender-app/src/lib/api/digitalgrid.ts
- ascender-app/src/app/api/integrations/digitalgrid/credentials/route.ts
- ascender-app/src/app/api/integrations/digitalgrid/test/route.ts
- ascender-app/src/app/api/financeiro/conta/lote/route.ts
- ascender-app/src/app/(dashboard)/rateio/page.tsx
- ascender-app/src/app/(dashboard)/financeiro/page.tsx
- ascender-app/src/app/(dashboard)/cadastros/conciliacao/page.tsx
- ascender-app/src/app/(dashboard)/integracoes/page.tsx
- ascender-app/src/app/(dashboard)/configuracoes/integracoes/page.tsx
- ascender-app/src/components/DigitalGridCard.tsx
- ascender-app/src/lib/cadastros/actions.ts
- ascender-app/src/lib/operacao/operational-overview.ts
- ascender-app/src/lib/auditoria/queries.ts
- ascender-app/src/lib/financeiro/conta.ts
- ascender-app/docker-compose.yml
- ascender-app/package.json
- ascender-app/docker-entrypoint.sh
- scripts/deploy-poll.sh
