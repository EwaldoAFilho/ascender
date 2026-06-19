#!/bin/sh
set -e

echo "==> Aplicando migrations do banco..."
npm run db:migrate

echo "==> Seed do login (idempotente)..."
npm run db:seed || echo "Seed de login pulado/falhou — seguindo."

echo "==> Iniciando ASCENDER em :${PORT:-3000} ..."
exec npm run start -- --port "${PORT:-3000}" --hostname 0.0.0.0
