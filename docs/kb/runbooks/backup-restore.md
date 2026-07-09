# Runbook: backup e restore do Postgres

Desde a **Fase 7** há backup automático do banco em produção. Serviço `backup` em
[`ascender-app/docker-compose.prod.yml`](../../../ascender-app/docker-compose.prod.yml).

## Como funciona
- Um contêiner `postgres:16-alpine` roda um loop: `pg_dump` do banco `ascender`,
  comprime com gzip e grava em `/backups/ascender-<timestamp>.sql.gz` no volume
  **`ascender_backups`**. Cadência: **diária** (`sleep 86400`); o primeiro dump é
  imediato ao subir.
- **Retenção:** apaga dumps com mais de `BACKUP_RETENTION_DAYS` dias (default **7**).
  Ajuste no `environment:` do serviço `backup`.
- Escreve em `.tmp` e faz `mv` só no sucesso — nunca deixa dump pela metade.
- É **local** (mesmo VPS): protege contra migração ruim, corrupção e exclusão
  acidental. **Não** protege contra perda do VPS inteiro — para isso, copiar os
  dumps para fora (offsite) periodicamente (ver "Cópia offsite" abaixo).

## Verificar os backups
```bash
# Lista os dumps existentes (no VPS)
docker run --rm -v ascender-app_ascender_backups:/backups alpine ls -lah /backups
# Logs do serviço
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backup | tail
```

## Restore (⚠️ destrutivo — sobrescreve o banco atual)
1. Escolha o dump (ex.: `ascender-20260709-030000.sql.gz`).
2. **Pare app/worker** para não escreverem durante o restore:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml stop app worker
   ```
3. Restaure (o dump é um `pg_dump` plano; aplique com `psql`):
   ```bash
   docker run --rm -v ascender-app_ascender_backups:/backups --network ascender-app_default \
     -e PGPASSWORD=ascender postgres:16-alpine \
     sh -c 'gunzip -c /backups/ascender-<timestamp>.sql.gz | psql -h db -U ascender -d ascender'
   ```
   > Para um restore limpo (sem resíduos), recrie o banco antes: `dropdb`/`createdb`
   > (ou restaure num banco novo e aponte o app para ele).
4. Suba de novo:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```
   O serviço `migrate` reaplica migrations pendentes (idempotente) antes de app/worker.

## Cópia offsite (pendente — Fase 7)
Hoje o backup é só local. Para robustez contra perda do VPS, agendar cópia dos
`.sql.gz` para um bucket S3-compatível (AWS/Backblaze). Requer credenciais do bucket.
Ver pendência em [`../pendencias/README.md`](../pendencias/README.md).

## Relacionado
- Migrations: [`migracoes.md`](migracoes.md) · Deploy: [`deploy.md`](deploy.md)
- Multi-tenancy: [`../adr/ADR-0007-multi-tenancy-shared-db-rls.md`](../adr/ADR-0007-multi-tenancy-shared-db-rls.md)
