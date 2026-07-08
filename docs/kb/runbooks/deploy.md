# Runbook: deploy (VPS)

Ver [ADR-0005](../adr/ADR-0005-deploy-por-polling.md). Deploy é **automático por
polling**.

## Publicar
1. Faça `commit` na branch `main` (typecheck limpo, testado local).
2. `git push origin main`.
3. A VPS roda `scripts/deploy-poll.sh` por cron (a cada ~5 min): detecta o novo
   commit, `git pull --ff-only`, e `docker compose -f docker-compose.yml -f
   docker-compose.prod.yml up -d --build`. Migrações aplicam no boot.

**Se houve mudança de schema:** confirme que `drizzle/*.sql` + `drizzle/meta/*` foram
commitados (ver [`migracoes.md`](migracoes.md)).

## Forçar deploy imediato (na VPS)
```bash
./scripts/deploy-poll.sh          # ou ver o log:
tail -f deploy.log
```

## Cuidados
- `--ff-only`: se a VPS divergiu de `main`, o deploy **falha de propósito** (não faz
  merge silencioso). Resolva a divergência manualmente.
- **DNS do build na VPS:** o build acontece na VPS; se falhar com erro de DNS
  (`npm ci`/`apk`), aplique a correção de [`dns-docker-build.md`](dns-docker-build.md)
  lá também.
- Rollback: `git revert <commit>` + push (o poller re-deploya). Migrações são
  aditivas — reverter código não desfaz coluna nova (normalmente inofensivo).
