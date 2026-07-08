# Runbook: rodar localmente

App: [`ascender-app/`](../../../ascender-app/). Requer Docker (Desktop) e um `.env`
(ver `.env.example`).

## Subir a stack
```bash
cd ascender-app
docker compose up -d --build      # app :3005 + Postgres + 3 workers de sync
docker compose logs -f app
```
- App: **http://localhost:3005** (porta via `APP_PORT` no `.env`).
- No boot, o `docker-entrypoint.sh` aplica migrações (`db:migrate`) e roda o seed do
  admin (idempotente).
- Login: `LOGIN_EMAIL` / `LOGIN_PASSWORD` do `.env`.

## Dev sem Docker (precisa de um Postgres acessível)
```bash
cd ascender-app
npm ci
npm run db:migrate && npm run db:seed
npm run dev
```

## Checagens rápidas
```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.json   # typecheck
docker ps --filter name=ascender-app                # estado dos containers
docker exec ascender-app-db-1 psql -U ascender -d ascender -c "\dt"
```

## Problemas comuns
- **Build falha no `npm ci`/`apk` (DNS):** ver
  [`dns-docker-build.md`](dns-docker-build.md).
- **Imagem velha (tela não reflete o código):** rebuild
  (`docker compose up -d --build`). O container standalone só tem o que foi buildado.
- **`parametros_proposta`/colunas faltando:** migração não aplicada — ver
  [`migracoes.md`](migracoes.md).
