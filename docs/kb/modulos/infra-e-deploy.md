# Modulo: Infra & Deploy

> Status: completo  ·  Ultima analise: 2026-07-09  ·  Confianca: alta
> Codigo: ascender-app/Dockerfile, ascender-app/docker-compose.yml, ascender-app/docker-compose.prod.yml, ascender-app/docker-entrypoint.sh, ascender-app/Caddyfile, scripts/deploy-poll.sh, ascender-app/package.json, ascender-app/drizzle.config.ts, ascender-app/src/lib/db/index.ts, ascender-app/src/lib/worker/index.ts, ascender-app/src/app/api/health/route.ts, ascender-app/src/lib/env.ts

## Visao geral
Empacotamento e operacao da aplicacao ASCENDER em containers Docker num servidor proprio (VPS). Um Postgres dedicado e o banco; em producao o Caddy termina TLS (Let's Encrypt) e faz proxy reverso. O deploy e feito por polling: um script no cron da VPS detecta mudanca no branch remoto e refaz o build/subida do compose de producao (com `--remove-orphans`). Existe para dar deploy repetivel, HTTPS automatico e frescor de dados sem depender de PaaS.

> **Atualizado nas Fases 6–7 (multi-tenant, ver [ADR-0007](../adr/ADR-0007-multi-tenancy-shared-db-rls.md)):**
> - **Migrations fora do boot:** servico one-shot **`migrate`** roda `db:migrate` + `db:seed` uma vez por deploy; `app` e `worker` esperam (`depends_on: service_completed_successfully`). O `docker-entrypoint.sh` do `app` agora so faz `start`.
> - **Sync:** os 3 loops `sh` (`sync`/`sync-dg`/`sync-telemetria`) foram colapsados num **`worker`** unico com **pg-boss** (fila+cron+lock), sync **por tenant** (ver [`fluxos/sincronizacao-dados.md`](../fluxos/sincronizacao-dados.md)).
> - **Backup (prod):** servico **`backup`** faz `pg_dump` diario no volume `ascender_backups` (retencao configuravel). Runbook: [`runbooks/backup-restore.md`](../runbooks/backup-restore.md).
> - **Healthchecks:** `app` (`/api/health`, liveness) e `worker` (heartbeat `/tmp/worker-heartbeat`).

## Responsabilidades
- Build da imagem Next.js 15 de producao (`Dockerfile`, multi-camada simples node:20-alpine).
- Orquestracao de servicos com Docker Compose (`db`, `app`, `sync`, `sync-dg`, `sync-telemetria` + `caddy` em prod).
- Aplicar migrations Drizzle e seed do admin automaticamente no start do `app` (`docker-entrypoint.sh`).
- Rodar os workers de sync como loops periodicos (geracao mensal, faturas+rateio DG, telemetria SolisCloud).
- Terminacao TLS e proxy reverso em producao via Caddy (`Caddyfile` + `docker-compose.prod.yml`).
- Deploy automatico por polling do git (`scripts/deploy-poll.sh`), com lock e fast-forward-only.
- Registrar cada execucao de worker em `sync_runs` para observabilidade ("atualizado ha X").

## Principais arquivos
| Caminho | Papel |
|---|---|
| ascender-app/Dockerfile | Imagem de producao: node:20-alpine + libc6-compat (p/ @node-rs/argon2), `npm ci` (inclui devDeps p/ build/migrate/seed), `npm run build`, ENTRYPOINT do entrypoint. |
| ascender-app/docker-entrypoint.sh | Boot do `app`: `db:migrate` -> `db:seed` (tolerante a falha) -> `npm run start --port $PORT --hostname 0.0.0.0`. |
| ascender-app/docker-compose.yml | Stack base: `db` (postgres:16-alpine, healthcheck), `app` e os 3 workers de cron; volume `ascender_pgdata`. |
| ascender-app/docker-compose.prod.yml | Override de producao: remove porta publica do `app` (`ports: !reset []`, `expose 3000`) e adiciona `caddy` (80/443, volumes caddy_data/caddy_config). |
| ascender-app/Caddyfile | Dominio `gestao.ascenderenergiasolar.com`, `reverse_proxy app:3000`, gzip e headers de hardening (HSTS, nosniff, Referrer-Policy). |
| scripts/deploy-poll.sh | Cron da VPS (*/5): `git fetch`, compara HEAD x origin, `git pull --ff-only`, `docker compose up -d --build` (base+prod), `docker image prune`; flock + log em deploy.log. |
| ascender-app/package.json | Scripts `db:migrate` (drizzle-kit migrate), `db:seed`, `db:sync-*` (tsx) usados por entrypoint e workers. |
| ascender-app/drizzle.config.ts | Config do drizzle-kit (dialect postgresql, out ./drizzle, url via DATABASE_URL) usada pelo `db:migrate`. |
| ascender-app/src/lib/db/index.ts | Pool `pg` + drizzle como singleton preguicoso (lazy) — nao le DATABASE_URL no build. |
| ascender-app/src/lib/db/sync-run.ts | `registrarSyncRun()` envolve cada worker e grava `sync_runs`; `getSyncRunsResumo()` alimenta a tela Integracoes. |
| ascender-app/src/lib/env.ts | Leitura lazy das env vars (DATABASE_URL, APP_ENCRYPTION_KEY, SESSION_SECRET, APP_BASE_URL) com validacao so em runtime. |
| ascender-app/.env.example | Contrato das variaveis de ambiente do deploy. |
| ascender-app/.dockerignore | Exclui node_modules, .next, .git, *.log, .env, Dockerfile, docker-compose.yml, README.md do contexto de build. |

## Entidades / tabelas
- `sync_runs` (ascender-app/src/lib/db/schema.ts:552) — auditoria de cada execucao de worker (colunas: `id`, `job`, `iniciado_em`, `terminado_em`, `status` ok|erro, `itens`, `mensagem`). Escrita por `registrarSyncRun`.
- `usuarios` — tocada pelo seed no boot (`seed.ts`), cria o admin inicial de forma idempotente.
- `__drizzle_migrations` (implicita) — tabela de controle do drizzle-kit criada/consultada por `db:migrate` no entrypoint. HIPOTESE (nome padrao do drizzle-kit; nao aparece no schema).
- Demais tabelas (telemetria/faturas/rateio) sao populadas pelos workers, mas pertencem aos modulos de dominio, nao a este.

## Endpoints / Server Actions
Modulo de infraestrutura — nao expoe rotas HTTP proprias. Pontos de codigo relevantes:
- `registrarSyncRun(job, fn, resumo)` — ascender-app/src/lib/db/sync-run.ts:40 — executor comum dos workers; grava inicio/fim/status em `sync_runs` e relanca o erro.
- `getSyncRunsResumo()` — ascender-app/src/lib/db/sync-run.ts:14 — ultimo run de cada job; consumido pela tela Configuracoes > Integracoes.
- Entradas de CLI (via `tsx`) disparadas pelos workers: `db:sync-geracao` (sync-geracao.ts), `db:sync-faturas-dg` (sync-faturas-dg.ts), `db:sync-rateio-dg` (sync-rateio-dg.ts), `db:sync-telemetria` (sync-telemetria.ts).

## Telas
- Nenhuma tela propria. A saude das sincronizacoes (via `getSyncRunsResumo`) e exibida em **Configuracoes > Integracoes** (modulo de integracoes), incluindo o "atualizado ha X".

## Regras de negocio
- Boot aplica migrations ANTES de servir: `npm run db:migrate` roda a cada start do `app` (docker-entrypoint.sh:5).
- Seed do admin e idempotente e NAO bloqueia o boot: so cria admin se nao houver nenhum usuario, e o entrypoint segue mesmo se falhar (`db:seed || echo ...`, docker-entrypoint.sh:8; logica em seed.ts:17-31).
- Workers sao loops `sh` infinitos (nao cron do SO). Cadencias explicitas:
  - `sync` — geracao mensal SolisCloud, `sleep 45` inicial e `sleep 21600` (6h) por ciclo (docker-compose.yml:43-48). Dado mensal, cadencia longa de proposito.
  - `sync-dg` — faturas + rateio Digital Grid, `sleep 50` inicial e `sleep 900` (15min) (docker-compose.yml:64-71).
  - `sync-telemetria` — telemetria SolisCloud, `sleep 30` inicial e `sleep 600` (10min) (docker-compose.yml:86-91).
- Sleeps iniciais escalonados (30/45/50s) dao tempo do `db` subir e evitam disparo simultaneo. HIPOTESE quanto a intencao exata (efeito e explicito no compose).
- Resiliencia dos workers: cada comando tem fallback `|| echo ...` e segue no proximo ciclo; falta de token/credencial apenas pula o ciclo (docker-compose.yml:46,67-69,89).
- `app` e os 3 workers usam a MESMA imagem (`build: .`); os workers sobrescrevem `entrypoint: []` e definem `command` proprio, pulando o migrate/seed do entrypoint.
- DATABASE_URL do banco do compose e forcado no `environment` de `app` e workers (`postgresql://ascender:ascender@db:5432/ascender`), independente do `.env` (docker-compose.yml:26,40,61,83).
- `db` so e considerado pronto via healthcheck `pg_isready`; app/workers tem `depends_on: condition: service_healthy` (docker-compose.yml:11-15,20-22).
- Deploy por polling e fast-forward-only: se a VPS divergir do remoto, o `git pull --ff-only` falha de proposito e o deploy aborta (scripts/deploy-poll.sh:49-52). Falha e sinalizada, nao mascarada com merge.
- Deploy so refaz build quando `HEAD != origin/BRANCH`; sem mudanca, sai em silencio (deploy-poll.sh:43).
- `flock -n` garante um deploy por vez (deploy-poll.sh:30-34); apos build, `docker image prune -f` limpa imagens orfas (deploy-poll.sh:56-57).
- Producao remove exposicao publica do `app` (`!reset []`) e so o Caddy publica 80/443; Caddy obtem/renova TLS Let's Encrypt sozinho (docker-compose.prod.yml:16-33, comentario 12-14).
- Cookie de sessao usa `Secure` apenas quando `APP_BASE_URL` comeca com `https://` (env.ts:31-32) — relevante ao subir atras do Caddy.
- GOTCHA operacional (DNS IPv6-only do Docker Desktop): em Docker Desktop (Mac/Windows) o resolvedor DNS embutido pode devolver apenas registros AAAA (IPv6), e o Node 20 dentro do container pode falhar ao alcancar APIs externas IPv4 (SolisCloud / Digital Grid) com `ENETUNREACH`/`EAI_AGAIN`. Mitigacao usual: `NODE_OPTIONS=--dns-result-order=ipv4first` no ambiente do container ou rodar em Linux/VPS (onde o problema geralmente nao ocorre). NAO ha tratamento no codigo nem env definida no repo — registrado como HIPOTESE/gotcha ambiental.

## Dependencias
- Depende de:
  - Docker Engine + Docker Compose (v2) e cron do SO na VPS.
  - Postgres 16 (imagem `postgres:16-alpine`) e volume `ascender_pgdata`.
  - Drizzle Kit (`db:migrate`, `db:generate`) e `tsx` para os scripts de seed/sync (devDependencies mantidas na imagem).
  - Caddy 2 (imagem `caddy:2-alpine`) + Let's Encrypt para TLS em producao.
  - Integracoes externas alcancadas pelos workers: SolisCloud (`src/lib/soliscloud/*`) e Digital Grid (`src/lib/digitalgrid/*`).
  - `git` na VPS para o polling.
- Consumido por:
  - Toda a aplicacao ASCENDER (o `app` Next.js roda dentro deste empacotamento).
  - Modulos de dominio (telemetria, geracao, faturas/rateio) que leem dados que os workers gravam.
  - Tela Configuracoes > Integracoes (le `sync_runs` via `getSyncRunsResumo`).

## Riscos de alteracao
- Migrations rodam em TODO boot do `app`: subir mais de uma replica do `app` simultaneamente pode causar corrida no `db:migrate` (hoje ha 1 instancia — seguro; escalar exige repensar).
- devDependencies (drizzle-kit, tsx, typescript) permanecem na imagem porque migrate/seed/workers precisam delas em runtime; um `npm ci --omit=dev` ou multi-stage "otimizado" quebraria o entrypoint e os workers.
- Mudar o `entrypoint`/`command` dos workers e delicado: eles dependem de `entrypoint: []` para NAO herdar o migrate/seed do `app`; remover isso faria cada worker tentar migrar/seedar.
- Trocar porta/dominio exige coerencia entre `APP_PORT` (compose base), `Caddyfile` (dominio) e `APP_BASE_URL` (.env, controla cookie Secure). O comentario do prod menciona `:3005` (via APP_PORT no .env nao versionado).
- Deploy fast-forward-only: qualquer commit local na VPS trava todos os deploys ate ser resolvido manualmente.
- Alterar as cadencias (`sleep`) impacta frescor x carga nas APIs externas; reduzir demais pode "hammerar" a SolisCloud/Digital Grid.
- Sem CI/CD versionado (dir `.github` vazio) e sem backup automatizado do volume `ascender_pgdata` — perda do volume = perda de dados.
- `docker image prune -f` roda no host; em host compartilhado poderia remover imagens de outros projetos que estejam sem tag/uso.

## Pendencias / a investigar
- GOTCHA IPv6-only: confirmar se afeta a VPS Linux de producao (provavelmente nao; e sintoma tipico de Docker Desktop) e decidir se vale fixar `NODE_OPTIONS=--dns-result-order=ipv4first` no compose por seguranca. Nao ha evidencia no repo.
- `APP_PORT` real de producao esta no `.env` (nao versionado, 0600); comentario do prod indica `:3005`. Confirmar valor efetivo.
- Estrategia de backup/restore do `ascender_pgdata` nao existe no repo.
- Nao ha healthcheck do `app` nem dos workers (so do `db`); um worker "vivo mas travado" nao seria detectado alem do `sync_runs`.
- Rotacao/limite de tamanho do `deploy.log` e dos logs dos containers nao configurados.
- `.github` presente mas sem workflows — confirmar se ha automacao de CI planejada fora do polling.

## Fontes
- ascender-app/Dockerfile
- ascender-app/docker-compose.yml
- ascender-app/docker-compose.prod.yml
- ascender-app/docker-entrypoint.sh
- ascender-app/Caddyfile
- scripts/deploy-poll.sh
- ascender-app/package.json
- ascender-app/drizzle.config.ts
- ascender-app/.env.example
- ascender-app/.dockerignore
- ascender-app/next.config.mjs
- ascender-app/README.md
- ascender-app/src/lib/db/index.ts
- ascender-app/src/lib/db/seed.ts
- ascender-app/src/lib/db/sync-run.ts
- ascender-app/src/lib/db/sync-geracao.ts
- ascender-app/src/lib/db/sync-faturas-dg.ts
- ascender-app/src/lib/db/sync-rateio-dg.ts
- ascender-app/src/lib/db/sync-telemetria.ts
- ascender-app/src/lib/db/schema.ts (bloco sync_runs)
- ascender-app/src/lib/env.ts
- ascender-app/drizzle/ (0000..0017 migrations, meta/)
