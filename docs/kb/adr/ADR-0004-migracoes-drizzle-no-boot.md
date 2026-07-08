# ADR-0004 — Migrações Drizzle aplicadas no boot do container

## Contexto
Schema versionado com Drizzle. É preciso garantir que o banco esteja sempre no
schema esperado sem passo manual de migração em cada deploy.

## Decisão
O `ascender-app/docker-entrypoint.sh` roda `npm run db:migrate` (drizzle-kit migrate)
**no start do container**, antes de subir o servidor, seguido do seed idempotente do
admin. O fluxo de schema é: editar `schema.ts` → `npm run db:generate` (gera
`drizzle/NNNN_*.sql` + `drizzle/meta/*`) → **commitar** esses arquivos → no boot o
migrate aplica o que faltar.

## Consequências
- Deploy = build + up; migrações rodam sozinhas.
- **Colunas novas em tabelas existentes devem ser nullable** (dados legados).
- Esquecer de commitar `drizzle/*.sql` + `meta/` faz o boot não migrar (bug silencioso:
  a imagem só conhece as migrações que estavam no build).

## Alternativas consideradas
- Migração manual/CI separada: rejeitada (mais passos, risco de esquecimento).

## Impacto no sistema
`ascender-app/drizzle/`, `docker-entrypoint.sh`, `drizzle.config.ts`. Ver runbook de
migrações em [`../runbooks/`](../runbooks/).

## Data
2026-07-08
