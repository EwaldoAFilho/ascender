# CLAUDE.md — Como trabalhar neste repositório

Guia para qualquer IA (e humanos) que forem evoluir o **ASCENDER**. Leia isto
primeiro. O objetivo é reduzir alucinação e retrabalho: **consulte a Base de
Conhecimento (KB) antes de mexer no código e atualize-a depois.**

---

## 1. O que é o ASCENDER

Plataforma interna (autenticada) da **Ascender Solar Tech / Moreira Camargo Eng.**
para **gestão de usinas fotovoltaicas** (telemetria SolisCloud, geração,
faturas/rateio via Digital Grid) e **geração de propostas comerciais**
(dimensionamento + precificação + payback/TIR + PDF).

- **App principal:** [`ascender-app/`](ascender-app/) — Next.js 15 (App Router),
  Drizzle ORM + Postgres, roda em Docker.
- `ascender-dashboard/` é material legado/estático de referência (não é o produto).

### Stack (ver [`ascender-app/package.json`](ascender-app/package.json))
Next.js 15.5 · React 19 · Drizzle ORM + `pg` (Postgres 16) · `iron-session` (auth) ·
`@node-rs/argon2` (hash de senha) · `zod` (validação) · TanStack Query · Recharts +
Nivo (gráficos) · `jspdf` + `jspdf-autotable` (PDF) · `pdf-parse` · `xlsx` ·
`lucide-react`. Docker Compose (app + Postgres + 3 workers de sync + Caddy em prod).

---

## 2. Base de Conhecimento (KB) — obrigatória

A KB fica em **[`docs/kb/`](docs/kb/)**. Comece sempre por
**[`docs/kb/README.md`](docs/kb/README.md)** e por
**[`docs/kb/cobertura.json`](docs/kb/cobertura.json)** (o que já está documentado e
com que confiança).

```
docs/kb/
  README.md          # índice e como usar a KB
  cobertura.json     # status de documentação por módulo
  manifest.json      # o que foi analisado, quando, com que confiança
  modulos/           # um doc por subsistema (arquitetura, auth, propostas, ...)
  entidades/         # modelo de dados (tabelas)
  contratos/         # contratos de API (interno e integrações externas)
  fluxos/            # fluxos de negócio ponta a ponta
  telas/             # telas relevantes
  integracoes/       # SolisCloud, Digital Grid, IA
  decisoes/ adr/     # decisões arquiteturais (ADRs)
  runbooks/          # como rodar, deployar, investigar
  riscos/ pendencias/ regras-negocio/
```

### 2.1 ANTES de alterar código
1. Leia o(s) doc(s) da KB do(s) módulo(s) afetado(s) (`docs/kb/modulos/`,
   `docs/kb/cobertura.json`).
2. Faça **análise de impacto** (ver `/impact-analysis` na seção 4): quais módulos,
   telas, endpoints, entidades, integrações e **regras de negócio** são tocados.
3. Verifique se já existe documentação relacionada — **não duplique**.
4. Se algo na KB estiver desatualizado, **atualize junto com o código**.

### 2.2 DEPOIS de alterar código
1. Atualize os docs da KB impactados (`/update-kb`, seção 4).
2. Atualize `docs/kb/cobertura.json` (status + `ultima_analise`).
3. Atualize `docs/kb/manifest.json` (arquivos analisados, docs gerados/atualizados).
4. Registre **pendências** para o que não deu para inferir com segurança.
5. Se tomou/descobriu uma decisão arquitetural, crie um **ADR** (`/create-adr`).

---

## 3. Comandos (rodar de dentro de `ascender-app/`)

```bash
# Dev
npm run dev                         # next dev
./node_modules/.bin/tsc --noEmit -p tsconfig.json   # typecheck (rápido)
npm run build                       # next build

# Banco (Drizzle)
npm run db:generate                 # gera migração em drizzle/ a partir do schema.ts
npm run db:migrate                  # aplica migrações (roda sozinho no boot do container)
npm run db:seed                     # cria o admin (idempotente; usa LOGIN_EMAIL/LOGIN_PASSWORD)

# Docker (stack local: app :3005 + Postgres + workers)
docker compose up -d --build        # sobe tudo (migrate + seed no entrypoint)
docker compose logs -f app
```

- **App local:** http://localhost:3005 (porta via `APP_PORT` no `.env`).
- **Migrações rodam no boot** do container (ver `docker-entrypoint.sh`) — não
  esqueça de commitar `drizzle/*.sql` + `drizzle/meta/*` junto com mudanças de schema.

### Deploy
A VPS usa **deploy por polling**: [`scripts/deploy-poll.sh`](scripts/deploy-poll.sh)
(cron a cada 5 min) faz `git pull --ff-only` de `main` e `docker compose up -d --build`.
Basta **commitar e dar push em `main`**. Detalhes em `docs/kb/runbooks/`.

> ⚠️ **Gotcha de DNS (Docker Desktop):** builds podem falhar (`npm ci`
> "Exit handler never called", `apk`/`EAI_AGAIN`) quando o DNS do daemon resolve
> os registries só em IPv6. Corrija com `"dns": ["8.8.8.8","1.1.1.1"]` em
> `~/.docker/daemon.json` + `systemctl --user restart docker-desktop`. Ver
> `docs/kb/runbooks/`.

---

## 4. Comandos operacionais da IA (procedimentos)

Não são scripts executáveis — são **rotinas** que a IA segue. Há apoio em
[`scripts/kb/`](scripts/kb/).

- **`/impact-analysis`** — antes de alterar: liste arquivos prováveis, regras de
  negócio, telas/endpoints/integrações em risco, testes a rodar e docs da KB a revisar.
- **`/update-kb`** — depois de alterar: identifique arquivos mudados (`git diff`),
  atualize os docs relacionados, `cobertura.json` e `manifest.json`; registre pendências.
- **`/review-pr`** — revise um conjunto de mudanças: impacto funcional, em regras de
  negócio, em contratos de API, em banco; necessidade de atualizar a KB; riscos e regressões.
- **`/review-kb-drift`** — rode `python3 scripts/kb/drift.py`: aponta código sem
  cobertura, docs possivelmente desatualizados e documentação órfã.
- **`/create-adr`** — registre uma decisão em `docs/kb/adr/ADR-000X-*.md`.

---

## 5. Padrões e cuidados (regras que NÃO podem quebrar)

- **Confidencialidade de custo/margem:** custo, margem e tabela de kit **nunca**
  vão ao cliente. Ficam em módulos `import "server-only"` (`ascender-app/src/lib/propostas/precificacao.ts`,
  `parametros.ts`). Nada de custo/margem pode entrar em bundle client nem no PDF do cliente.
  Antes de mudar propostas, confira que nenhum literal de kit/margem vaza (`grep` nos chunks).
- **Server Actions + Zod:** mutações passam por Server Actions (`"use server"`) com
  `getSession()`/auth e validação Zod. Siga o padrão existente (ex.: `lib/propostas/actions.ts`).
- **Auth:** login único compartilhado via `iron-session`; **não há RBAC** (todos são
  staff). Não assuma papéis/permissões que não existem.
- **Migrações:** mudou `schema.ts` → `npm run db:generate` e **commite** o `.sql` +
  `meta/`. Colunas novas em tabelas existentes devem ser **nullable** (dados legados).
- **Arquitetura sync-first:** as telas leem do **banco**; workers (`db:sync-*`)
  buscam de SolisCloud/Digital Grid periodicamente. Não faça telas chamarem APIs
  externas em request de usuário.
- **Regras de negócio sensíveis** (documentadas na KB): dimensionamento FV, precificação,
  payback/TIR, **Fio B (Lei 14.300)**, rateio de créditos. Não altere fórmulas sem
  ler o doc do módulo e sem aval quando mudar número exibido ao cliente.
- **PT-BR** em código de domínio, comentários e documentação. Use nomes reais.

---

## 6. Regras da KB (resumo)

- Não invente regra de negócio — o incerto vira **hipótese/pendência**.
- Documentação objetiva e rastreável; sempre com **caminho real do código**.
- Toda mudança relevante de código **atualiza a KB correspondente**.
- Modelo de PR: [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).
