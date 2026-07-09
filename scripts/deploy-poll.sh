#!/usr/bin/env bash
#
# Deploy automático por polling — ASCENDER
# ----------------------------------------
# Rodado periodicamente pelo cron na VPS. Faz `git fetch` e, SOMENTE se o
# branch remoto mudou, faz pull + rebuild do docker compose de produção.
# As migrações de banco rodam sozinhas no start do container (docker-entrypoint.sh).
#
# Instalação (na VPS, dentro do repositório):
#   chmod +x scripts/deploy-poll.sh
#   crontab -e   ->   */5 * * * * /CAMINHO/DO/REPO/scripts/deploy-poll.sh
#
# Variáveis opcionais:
#   ASCENDER_BRANCH      (default: main)
#   ASCENDER_DEPLOY_LOG  (default: <repo>/deploy.log)
#
set -euo pipefail

# Raiz do repositório = pasta pai do diretório deste script (robusto via git).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
APP_DIR="$REPO_DIR/ascender-app"
BRANCH="${ASCENDER_BRANCH:-main}"
LOG="${ASCENDER_DEPLOY_LOG:-$REPO_DIR/deploy.log}"
LOCK="/tmp/ascender-deploy.lock"

log() { echo "[$(date '+%F %T')] $*" >>"$LOG"; }

# Evita dois deploys simultâneos (rebuild demorado + cron sobreposto).
exec 9>"$LOCK"
if ! flock -n 9; then
  log "Deploy já em andamento — pulando esta execução."
  exit 0
fi

cd "$REPO_DIR"

git fetch --quiet origin "$BRANCH"
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

# Sem mudanças: sai em silêncio (não polui o log a cada 5 min).
[ "$LOCAL" = "$REMOTE" ] && exit 0

log "Mudança detectada em '$BRANCH': ${LOCAL:0:7} -> ${REMOTE:0:7}. Iniciando deploy."

# Fast-forward apenas: se a VPS tiver commits locais divergentes, falha de propósito
# (surface o problema em vez de criar merge silencioso). .env é gitignored, então não atrapalha.
if ! git pull --ff-only origin "$BRANCH" >>"$LOG" 2>&1; then
  log "ERRO: 'git pull --ff-only' falhou (branch divergiu?). Deploy abortado."
  exit 1
fi

cd "$APP_DIR"
# --remove-orphans: remove contêineres de serviços que saíram do compose (ex.: os
# 3 workers sync/sync-dg/sync-telemetria colapsados no serviço único `worker`).
if docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans >>"$LOG" 2>&1; then
  # Limpa imagens órfãs geradas pelo rebuild (não remove imagens em uso).
  docker image prune -f >>"$LOG" 2>&1 || true
  log "Deploy concluído: $(git -C "$REPO_DIR" rev-parse --short HEAD)."
else
  log "ERRO: 'docker compose up --build' falhou. Verifique os logs acima."
  exit 1
fi
