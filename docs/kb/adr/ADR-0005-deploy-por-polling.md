# ADR-0005 — Deploy por polling na VPS

## Contexto
Deploy simples para uma VPS, sem pipeline de CD complexo nem webhooks.

## Decisão
`scripts/deploy-poll.sh` roda por **cron a cada 5 min** na VPS. Faz
`git fetch` de `main`; se o remoto mudou, `git pull --ff-only` e
`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.
Usa `flock` para não sobrepor deploys e falha de propósito se o branch divergir
(fast-forward apenas). Migrações rodam no boot do container
(ver [ADR-0004](ADR-0004-migracoes-drizzle-no-boot.md)).

## Consequências
- Publicar = **commit + push em `main`**. Sem passo manual.
- Latência de até ~5 min entre push e deploy.
- Build acontece na VPS — depende de rede/DNS lá (ver runbook de DNS/Docker).

## Alternativas consideradas
- GitHub Actions + registry + pull: mais robusto, porém mais infra; adiado.

## Impacto no sistema
`scripts/deploy-poll.sh`, `ascender-app/docker-compose.prod.yml`, `Caddyfile`.

## Data
2026-07-08
