# ADR-0003 — Arquitetura sync-first (workers periódicos → banco)

## Contexto
Os dados operacionais vêm de integrações externas (SolisCloud, Digital Grid) com
rate limits e latência. Fazer as telas chamarem essas APIs a cada request seria
lento e frágil.

## Decisão
**Workers de sincronização** rodam periodicamente e gravam no Postgres; as **telas
leem apenas do banco**. Workers (serviços Docker separados, loops `sh -c "while
true; ... sleep N"`):
- `db:sync-telemetria` (SolisCloud, ~10 min) — estações/inversores/coletores/alarmes.
- `db:sync-geracao` (SolisCloud, ~6 h) — histórico mensal de geração.
- `db:sync-faturas-dg` + `db:sync-rateio-dg` (Digital Grid, ~15 min) — faturas e rateio.

O "estado atual" de tabelas append-only de telemetria é o registro mais recente por
entidade (DISTINCT ON). Ver `ascender-app/docker-compose.yml` e
`ascender-app/src/lib/db/sync-*.ts`.

## Consequências
- Telas rápidas e resilientes a instabilidade das APIs.
- Dados têm latência de até o intervalo do worker.
- Novas telas devem consumir do banco, **não** chamar SolisCloud/Digital Grid no request.

## Alternativas consideradas
- Fetch on-demand por request: rejeitado (latência + rate limit).

## Impacto no sistema
Alterar cadência/queries de sync afeta o frescor dos dados nas telas. Digital Grid é
somente leitura.

## Data
2026-07-08
