#!/bin/sh
set -e

# Migrations e seed NÃO rodam aqui: ficam no serviço one-shot `migrate` do
# docker-compose (roda uma vez por deploy, antes de app/worker subirem). Isso
# evita corrida de migração quando houver mais de uma instância do app.
echo "==> Iniciando ASCENDER em :${PORT:-3000} ..."
exec npm run start -- --port "${PORT:-3000}" --hostname 0.0.0.0
