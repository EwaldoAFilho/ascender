# Fluxo: sincronização de dados (sync-first)

Ver [ADR-0003](../adr/ADR-0003-arquitetura-sync-first.md). As telas leem do **banco**;
workers buscam das integrações periodicamente. Desde a **Fase 6** (multi-tenant,
[ADR-0007](../adr/ADR-0007-multi-tenancy-shared-db-rls.md)) o sync é **por tenant** e
orquestrado por **pg-boss** (fila + cron + lock no próprio Postgres), num **serviço
único** `worker` (`ascender-app/docker-compose.yml`) que substituiu os 3 loops shell.

## Orquestração (pg-boss — `src/lib/worker/index.ts`)
Para cada tipo de job há uma fila de **fanout** agendada por cron; o handler enumera os
tenants ativos com credencial do provider (`db/tenants.ts::listarTenantsComCredencial`) e
enfileira 1 job na fila `sync-run` **por tenant**, com `singletonKey = job:tenant`. A
fila `sync-run` usa `policy: 'stately'` → no máximo **1 rodando + 1 na fila** por
`(tenant, job)` (lock: sem sobreposição nem acúmulo). O handler roda
`sync/jobs.ts::rodarJobParaTenant` dentro de `runWithTenant(tenant)`.

| Job (cron) | Função de sync | Cadência | Origem → Destino |
|---|---|---|---|
| `telemetria` (`*/10`) | `syncTelemetria` (`soliscloud/telemetria-sync.ts`) | ~10 min | SolisCloud → `telemetria_estacao/inversor/coletor`, `alarmes` |
| `geracao` (`30 */6`) | `syncGeracaoMensal` (`cadastros/sync.ts`) | ~6 h | SolisCloud → `medicoes_geracao` |
| `faturas_dg` (`*/15`) | `syncFaturasDg` (`digitalgrid/sync.ts`) | ~15 min | Digital Grid (só leitura) → `faturas_dg` |
| `rateio_dg` (`5-59/15`) | `syncRateioDg` (`digitalgrid/sync.ts`) | ~15 min | Digital Grid (só leitura) → `rateios_dg` |

Os scripts `npm run db:sync-*` continuam para execução manual — viraram wrappers de
`rodarJobTodosTenants(job)` (percorre todos os tenants em sequência, isolando falha por
tenant). Cada execução registra em `sync_runs` **com `tenant_id`** (painel de saúde por
tenant). Escritas dos syncs setam `tenant_id` explícito e os upserts usam as UNIQUE
compostas `(tenant_id, …)`. Tabelas de telemetria são **append-only** (DISTINCT ON = estado atual).

## Leitura pelas telas
As telas de operação (`/executivo`, `/geracao`, `/mapa`, `/usinas`, `/soliscloud`,
`/rateio`, `/financeiro`) consultam o banco via `lib/dashboard-data.ts`,
`lib/operacao/`, `lib/cadastros/queries.ts`. **Não** chamam SolisCloud/Digital Grid
no request do usuário.

> Exceção: rotas `api/soliscloud/*` fazem chamadas ao vivo (com cache TTL em
> `lib/cache/ttlCache.ts`, singleton por processo) para telas específicas — ver
> [`../modulos/integracao-soliscloud.md`](../modulos/integracao-soliscloud.md). Desde a
> Fase 6c o cache e o rate-limit do cliente Solis são **por conta** (`keyId`): a chave
> de cache é `${keyId}:${resourcePath}:${body}` e há um balde de rate-limit por conta —
> contas de tenants distintos não vazam resposta nem se serializam (in-process; Redis
> só na Fase 7). As rotas de leitura Solis rodam em `withSessionTenant`.

## Credenciais
Credenciais das integrações ficam em `integration_credentials` (criptografadas,
`lib/crypto/`), **uma por `(tenant, provider)`** (Fase 5), configuráveis em
`/integracoes`. O fanout só enfileira tenants com credencial ativa do provider; se a
credencial for inválida, o `sync-run` daquele tenant falha isolado (registra `erro` em
`sync_runs`) sem afetar os demais.

## Como investigar
Runbook: [`../runbooks/investigar-sync.md`](../runbooks/investigar-sync.md).
