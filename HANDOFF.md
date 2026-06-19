# ASCENDER — Handoff / Estado do Projeto

Sistema web de **gestão de usinas solares fotovoltaicas** (ASCENDER, Brasília).
Este documento orienta qualquer sessão nova (humano ou IA) a continuar o trabalho.

---

## 1. Como trabalhar (CONVENÇÕES — siga sempre)

- **A cada atualização concluída: commit + push no GitHub.** Mensagens claras em português.
- **Sempre passar ao usuário os comandos para atualizar a produção (VPS).**
- **APIs externas são SOMENTE LEITURA** (SolisCloud e Digital Grid) — nunca chamar endpoints que alterem dados lá.
- **Segredos nunca vão para o git** (`.env` é ignorado). Credenciais de API ficam cifradas (AES-256-GCM) no banco.
- **Skills instaladas em `.agents/skills/` — USE-AS quando fizer sentido:**
  - `frontend-design` — design de UI intencional (evitar telas "templated").
  - `vercel-react-best-practices` — performance React/Next (RSC, paralelismo, bundle).
  - `find-skills` — descobrir outras skills.
- Antes de mexer no parser/regex ou em algo arriscado, **valide empiricamente** (rodar, testar) — não confiar só na leitura.
- Há memória persistente do projeto (`MEMORY.md` no diretório de memória) com detalhes técnicos.

## 2. Repositório e Git

- Repo: `git@github.com:EwaldoAFilho/ascender.git` (branch `main`), autenticação por **SSH**.
- `gh` CLI **não** está instalado — usar `git` puro.
- Monorepo: `ascender-app/` (o sistema), `ascender contexto/` (docs/base de conhecimento), `ascender-dashboard/` (protótipo Vite, aposentado).
- Atualizar/commitar:
  ```bash
  git add -A && git commit -m "..." && git push
  ```

## 3. Stack

Next.js 15 (App Router) + TypeScript + React 18 · Drizzle ORM + PostgreSQL (Docker) ·
TanStack Query · Zod 4 · iron-session + @node-rs/argon2 · Recharts + Nivo · lucide-react ·
node:crypto (HMAC-SHA1 da SolisCloud, AES-256-GCM dos segredos) · pdf-parse (contas de energia).
Server Components para leitura + Server Actions/route handlers para escrita.

## 4. Produção (VPS Ubuntu na Hostinger)

- URL: **https://gestao.ascenderenergiasolar.com** (HTTPS via **Caddy**, Let's Encrypt **auto-renovável**).
- IP: 187.77.236.114 · projeto em `~/ascender/ascender-app` · Docker + Compose já instalados.
- Atualizar a produção (com HTTPS/Caddy):
  ```bash
  cd ~/ascender && git pull
  cd ascender-app
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
  ```
- **NUNCA** usar `docker compose down -v` (o `-v` apaga o volume do Postgres e os certificados). Atualizar com `up -d --build` preserva os dados.
- Backup do banco: `docker compose exec db pg_dump -U ascender ascender > ~/backup-$(date +%F).sql`
- HTTPS exige portas **80 e 443** abertas (ufw + painel Hostinger). O cookie de login só é seguro se `APP_BASE_URL` começar com `https://`.
- Relógio do servidor precisa estar sincronizado (NTP) — a assinatura SolisCloud falha se >15 min de diferença.

## 5. Desenvolvimento local

- Roda no Docker na porta **3005** (`docker compose -f ascender-app/docker-compose.yml up -d --build`).
- Login: `ewaldo.alves@gmail.com` / senha em `LOGIN_PASSWORD` do `.env` (dev: `TMjdF7W0tr-l`).
- Typecheck: `./ascender-app/node_modules/.bin/tsc --noEmit --project ascender-app/tsconfig.json`
- Migrations: geradas com `npm run db:generate` (drizzle-kit); aplicadas no boot (entrypoint roda `db:migrate` + seed do admin).

## 6. Autenticação / usuários

- **Multiusuário**: tabela `usuarios` (nome, email único, hash Argon2, ativo). Login valida contra ela; sessão guarda `userId`.
- Tela **Configurações › Usuários** (CRUD; guardas: não desativar/excluir o próprio usuário nem o último ativo).
- `db:seed` cria o admin a partir de `LOGIN_EMAIL`/`LOGIN_PASSWORD` só se não houver usuários (migração suave).
- Sem RBAC/papéis ainda (todos têm acesso total); a sessão já reserva `roles` para evoluir.

## 7. Integrações (somente leitura)

### SolisCloud (técnico — geração/telemetria)
- Assinatura HMAC-SHA1 no servidor (`src/lib/soliscloud/`). **Content-Type deve ser `application/json` SEM `;charset`** (com charset → 403 "wrong sign"). URL base precisa de `https://`.
- Unidades: `stationDay.power` em W (÷1000→kW); `inverterList.etotal` em MWh (usar etotalStr); `stationMonth/Year.energy/money` já vêm em base kWh/BRL (NÃO converter).
- Telas: SolisCloud (telemetria, inversores, alarmes, **monitor de coletores/dataloggers** via `collectorList`), Geração (curvas), Usinas (realizado×esperado).

### Digital Grid (financeiro — "Billing API v1")
- Base `https://gestao.dg.energy/api/v1`, auth header `Authorization: Token <token>` (NÃO Bearer; detecção automática), paginação DRF (`results`/`next`).
- **Faturas** (`/bills`) → tabela `faturas_dg` + tela Financeiro; **Rateio** (`/estimated-quota`) → `rateios_dg` + tela Rateio; **Conciliação** de cadastros (`/entities`,`/installations`,`/generators`) → cria clientes/UCs (usinas por vínculo manual). Sincronização por cron (serviço `sync` no compose, a cada 6h).
- Plano completo em `ascender-app/PLANO-DIGITAL-GRID.md`.

### Conta de energia (distribuidora) anexa às faturas
- Em cada linha do Financeiro dá para **anexar o PDF da conta** (Neoenergia) — guardado no banco (`contas_energia`, base64) e com **campos extraídos** por regex (`src/lib/financeiro/parse-conta.ts`): cliente, mês/ano, vencimento, valor, nota fiscal, código de barras, leituras, tributos, itens, e o **saldo de créditos SCEE**.
- Cobre **2 layouts Neoenergia**: beneficiário (Excedente/créditos/saldo próximo) e gerador/consórcio (SALDO ANTERIOR/INJETADO/COMPENSADO/SALDO ATUAL). Outras distribuidoras precisam de novas regras.

## 8. UI / componentes-chave

- **DataTable** (`src/components/DataTable.tsx`): ordenação por coluna, busca, paginação e **exportação Excel/PDF** (xlsx + jspdf, import dinâmico). Usado nas tabelas de dados e no `CrudSection` (cadastros).
- **Dashboards Início/Executivo** redesenhados (skill frontend-design): **PowerRing** (anel SVG amarelo→ouro) — potência/capacidade no Início, **aderência** no Executivo. Aderência usa **meta proporcional aos dias** do mês corrente (`getUsinasComTelemetria`).
- Tema claro/escuro via variáveis CSS em `src/app/globals.css` (azul `--brand-blue` + amarelo/ouro solar). Datas exibidas DD/MM/AAAA, competências MM/AAAA (armazenadas AAAA-MM).

## 9. O que falta / próximos (opcional)

- RBAC (papéis/permissões).
- Importador de planilha Excel (dados que só vivem na planilha operacional).
- Parser de contas para outras distribuidoras.
- Edição manual dos campos extraídos de contas (correção do que o parser não pegar).
