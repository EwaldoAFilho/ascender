# Fluxo: sincronização de dados (sync-first)

Ver [ADR-0003](../adr/ADR-0003-arquitetura-sync-first.md). As telas leem do **banco**;
workers buscam das integrações periodicamente. Definição em
`ascender-app/docker-compose.yml` (serviços `sync`, `sync-dg`, `sync-telemetria`).

## Workers (loops `while true; ...; sleep N`)
| Serviço Docker | Script | Cadência | Origem → Destino |
|---|---|---|---|
| `sync-telemetria` | `db:sync-telemetria` (`lib/db/sync-telemetria.ts`) | ~10 min | SolisCloud → `telemetria_estacao/inversor/coletor`, `alarmes` |
| `sync` | `db:sync-geracao` (`lib/db/sync-geracao.ts`) | ~6 h | SolisCloud → `medicoes_geracao` |
| `sync-dg` | `db:sync-faturas-dg` + `db:sync-rateio-dg` | ~15 min | Digital Grid (somente leitura) → `faturas_dg`, `rateios_dg` |

Cada execução registra em `sync_runs`. Tabelas de telemetria são **append-only**: o
"estado atual" é o registro mais recente por entidade (DISTINCT ON).

## Leitura pelas telas
As telas de operação (`/executivo`, `/geracao`, `/mapa`, `/usinas`, `/soliscloud`,
`/rateio`, `/financeiro`) consultam o banco via `lib/dashboard-data.ts`,
`lib/operacao/`, `lib/cadastros/queries.ts`. **Não** chamam SolisCloud/Digital Grid
no request do usuário.

> Exceção: rotas `api/soliscloud/*` fazem chamadas ao vivo (com cache TTL em
> `lib/cache/ttlCache.ts`, singleton por processo) para telas específicas — ver
> [`../modulos/integracao-soliscloud.md`](../modulos/integracao-soliscloud.md).

## Credenciais
Credenciais das integrações ficam em `integration_credentials` (criptografadas,
`lib/crypto/`), configuráveis em `/configuracoes/integracoes`. Sem credencial, o
worker pula o ciclo (log) e segue.

## Como investigar
Runbook: [`../runbooks/investigar-sync.md`](../runbooks/investigar-sync.md).
