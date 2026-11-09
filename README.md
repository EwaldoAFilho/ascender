# ASCENDER

Plataforma web da **Ascender Solar Tech / Moreira Camargo Eng.** para:

- **Gestão de usinas fotovoltaicas** — telemetria SolisCloud (usinas, inversores,
  alarmes), geração, mapa, visão executiva/operacional.
- **Financeiro e rateio** — faturas e rateio de créditos via Digital Grid,
  auditoria/conciliação, leitura de contas de energia (PDF).
- **Propostas comerciais** — dimensionamento FV, precificação, payback/TIR
  (com Fio B, Lei 14.300) e PDF da proposta.

Em evolução para **SaaS multi-tenant** (banco compartilhado + `tenant_id` + RLS) —
ver [ADR-0007](docs/kb/adr/ADR-0007-multi-tenancy-shared-db-rls.md).

---

## Estrutura do repositório

| Caminho | O que é |
|---|---|
| [`ascender-app/`](ascender-app/) | **O produto.** Next.js 15 (App Router) + Drizzle + Postgres, roda em Docker. |
| [`docs/kb/`](docs/kb/) | **Base de Conhecimento** (módulos, entidades, fluxos, ADRs, runbooks). Comece por aqui. |
| [`scripts/`](scripts/) | `deploy-poll.sh` (deploy na VPS) e utilitários da KB (`scripts/kb/`). |
| [`.github/`](.github/) | CI (testes + typecheck, checagem da KB) e template de PR. |
| [`ascender contexto/`](ascender%20contexto/) | Material de levantamento/contexto inicial (histórico). |
| [`ascender-dashboard/`](ascender-dashboard/) | Protótipo Vite legado — referência, **não** é o produto. |
| [`CLAUDE.md`](CLAUDE.md) / [`HANDOFF.md`](HANDOFF.md) | Guia para quem (humano ou IA) for evoluir o projeto. |

## Stack

Next.js 15 · React 18 · TypeScript · Drizzle ORM + PostgreSQL 16 · pg-boss (fila/cron
dos syncs) · iron-session + `@node-rs/argon2` · Zod · TanStack Query · Recharts + Nivo ·
jsPDF · pdf-parse · xlsx · `node:crypto` (HMAC SolisCloud, AES-256-GCM dos segredos).
Em produção: Docker Compose + Caddy (HTTPS).

## Arquitetura em uma frase

**Sync-first:** as telas leem só do **banco**; um **worker** (pg-boss) sincroniza
periodicamente SolisCloud e Digital Grid (telemetria ~10 min, faturas/rateio ~15 min,
geração ~6 h). APIs externas são **somente leitura**. Detalhes em
[`docs/kb/modulos/arquitetura.md`](docs/kb/modulos/arquitetura.md).

---

## Começando

Pré-requisitos: Docker (Desktop) — ou Node 22+ e um Postgres 16 para rodar sem Docker.

### Com Docker (recomendado)

```bash
cd ascender-app
cp .env.example .env
# Gere os segredos e preencha o .env:
node -e "console.log('APP_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
# Defina também LOGIN_EMAIL e LOGIN_PASSWORD (admin inicial).

docker compose up -d --build
docker compose logs -f app
```

Sobe `db` (Postgres), `migrate` (aplica migrações + seed e sai), `app` e `worker`.
Acesse `http://localhost:${APP_PORT:-3000}` e entre com `LOGIN_EMAIL` / `LOGIN_PASSWORD`.

As credenciais da SolisCloud/Digital Grid **não** vão no `.env`: são cadastradas
(cifradas) em **Configurações › Integrações**.

### Sem Docker

```bash
cd ascender-app
npm ci
# .env com DATABASE_URL apontando para um Postgres acessível (localhost)
npm run db:migrate && npm run db:seed
npm run dev          # app
npm run worker       # (opcional) worker de sincronização
```

## Comandos úteis (em `ascender-app/`)

```bash
npm test                                            # testes unitários (node:test + tsx; sem banco)
./node_modules/.bin/tsc --noEmit -p tsconfig.json   # typecheck
npm run build                                       # build de produção
npm run db:generate                                 # gera migração a partir do schema.ts
npm run db:migrate                                  # aplica migrações
```

Há também scripts operacionais `db:sync-*`, `db:auditar-rateio`, `db:conciliar-dg` etc.
— veja [`ascender-app/package.json`](ascender-app/package.json) e
[`docs/kb/runbooks/investigar-sync.md`](docs/kb/runbooks/investigar-sync.md).

## Deploy

Produção numa VPS com **deploy por polling**: [`scripts/deploy-poll.sh`](scripts/deploy-poll.sh)
(cron a cada 5 min) faz `git pull --ff-only` de `main` e `docker compose up -d --build`.
Ou seja, **push em `main` = deploy**. Ver [`docs/kb/runbooks/deploy.md`](docs/kb/runbooks/deploy.md)
e [`backup-restore.md`](docs/kb/runbooks/backup-restore.md).

---

## Contribuindo

1. **Leia a KB antes de mexer** — [`docs/kb/README.md`](docs/kb/README.md) e
   [`cobertura.json`](docs/kb/cobertura.json) — e **atualize-a junto com o código**.
2. Mudou `schema.ts` → `npm run db:generate` e **commite** `drizzle/*.sql` + `drizzle/meta/*`.
   Colunas novas em tabelas existentes devem ser **nullable**.
3. Mutações via **Server Actions** com sessão + validação **Zod**.
4. **Custo, margem e tabela de kit nunca chegam ao cliente** (bundle ou PDF): ficam em
   módulos `server-only` em `src/lib/propostas/`.
5. Fórmulas sensíveis (dimensionamento, precificação, payback/TIR, Fio B, rateio) só
   mudam após ler o doc do módulo e com aval quando alterarem número exibido ao cliente.
6. Rode `npm test` + typecheck antes do push (a CI roda os mesmos).
7. Use o [template de PR](.github/PULL_REQUEST_TEMPLATE.md). Código de domínio e docs em **PT-BR**.

Regras completas em [`CLAUDE.md`](CLAUDE.md).

## Problemas comuns

- **Build Docker falha no `npm ci`/`apk` (DNS/IPv6):**
  [`docs/kb/runbooks/dns-docker-build.md`](docs/kb/runbooks/dns-docker-build.md).
- **Tela não reflete o código:** rebuild da imagem (`docker compose up -d --build`).
- **Coluna/tabela faltando:** migração não aplicada —
  [`docs/kb/runbooks/migracoes.md`](docs/kb/runbooks/migracoes.md).
- **SolisCloud rejeita assinatura:** relógio do host fora de sincronia (NTP; tolerância de 15 min).

---

Uso interno — Ascender Solar Tech / Moreira Camargo Eng.
