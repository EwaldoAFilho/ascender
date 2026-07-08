# Runbook: migrações de banco (Drizzle)

Ver [ADR-0004](../adr/ADR-0004-migracoes-drizzle-no-boot.md).

## Alterar o schema
```bash
cd ascender-app
# 1. edite src/lib/db/schema.ts
npm run db:generate            # gera drizzle/NNNN_*.sql + drizzle/meta/*
# 2. revise o .sql gerado (colunas novas DEVEM ser nullable)
# 3. COMMITE o .sql + a pasta meta/ junto com a mudança de código
```
No boot do container, `docker-entrypoint.sh` roda `npm run db:migrate` e aplica o que
faltar. Localmente, um `docker compose up -d --build` já aplica.

## Regras
- **Colunas novas em tabelas existentes = nullable** (dados legados).
- Nunca edite um `.sql` já aplicado em produção — crie uma nova migração.
- Esquecer de commitar `drizzle/*.sql`/`meta/` → a imagem não conhece a migração e o
  boot não aplica (bug silencioso).

## Verificar estado no banco
```bash
docker exec ascender-app-db-1 psql -U ascender -d ascender -tAc \
  "select count(*) from drizzle.__drizzle_migrations;"          # nº aplicadas
docker exec ascender-app-db-1 psql -U ascender -d ascender -c "\d propostas"
```

## Aplicar manualmente (ambiente já rodando, sem rebuild)
```bash
docker cp ./drizzle/. ascender-app-app-1:/app/drizzle/
docker exec ascender-app-app-1 sh -c 'cd /app && npm run db:migrate'
```
