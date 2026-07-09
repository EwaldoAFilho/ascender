# Documentação Técnica da Solução — ASCENDER

> **Memorial técnico** do produto **como ele existe hoje**, para instruir a proposta
> ao Edital FAPDF START BSB nº 11/2026. Descreve arquitetura, módulos, integrações,
> dados, segurança e estágio de maturidade. Todo o conteúdo é rastreável ao código em
> `ascender-app/` e à Base de Conhecimento (`docs/kb/`).
> Confiança: alta (baseado em KB de confiança alta + `HANDOFF.md` + leitura do schema).

---

## 1. O que é

**ASCENDER** é uma **plataforma SaaS (web, autenticada) para gestão de usinas solares
fotovoltaicas e geração de propostas comerciais**, voltada a **integradoras e
geradoras de energia solar** (mercado de **geração distribuída — GD**). Ela consolida,
em um único produto, três domínios que hoje vivem em sistemas separados:

1. **Operação e O&M** — telemetria de geração das usinas (via SolisCloud);
2. **Financeiro e rateio** — faturas, contas de energia e rateio de créditos (via
   Digital Grid + leitura de contas da distribuidora);
3. **Comercial** — geração de propostas fotovoltaicas (dimensionamento, precificação,
   payback/TIR, PDF).

- **Em produção**: `https://gestao.ascenderenergiasolar.com`.
- **Modelo**: **SaaS multi-tenant** — uma instância atende **N integradoras** (tenants).
  Cliente âncora: **Ascender Solar Tech**; **2º cliente em contratação**.

## 2. Problema que resolve

Integradoras/geradoras solares operam em silos: **SolisCloud** (geração/telemetria),
**Digital Grid** (faturamento/rateio/prosumidores), **contas da distribuidora em PDF**
e **planilhas** para propostas e controle. Não há visão consolidada de **O&M +
financeiro + comercial**, e o **Fio B (Lei 14.300/2022)** tornou o cálculo de créditos
e economia mais complexo. A ASCENDER unifica esses fluxos, **audita o rateio de
créditos** automaticamente e **padroniza a geração de propostas** com as regras de
negócio do setor.

## 3. Arquitetura técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 15.5** (App Router), **React 19/18**, TypeScript |
| Renderização | **React Server Components** para leitura; **Server Actions** + route handlers para escrita (validação **Zod**) |
| Dados | **PostgreSQL 16** via **Drizzle ORM** (`pg`); migrações versionadas em `drizzle/` |
| Estado no cliente | **TanStack Query**; gráficos **Recharts** + **Nivo** |
| Autenticação | **iron-session** (cookie cifrado) + **@node-rs/argon2** (hash de senha) |
| Documentos | **jspdf** + **jspdf-autotable** (PDF de propostas); **pdf-parse** (contas de energia); **xlsx** (import/export Excel) |
| Filas/sync | workers `tsx` + **pg-boss** (fila em Postgres) para sincronizações |
| Empacotamento | **Docker Compose** (app + Postgres + workers de sync + **Caddy** em produção, HTTPS/Let's Encrypt) |

**Padrão arquitetural central — _sync-first_**: as telas **nunca chamam APIs externas
no request do usuário**. **Workers** sincronizam periodicamente SolisCloud e Digital
Grid para o banco; as telas **leem do banco** (com selo “atualizado há X”). Isso
protege o rate limit das APIs externas, dá previsibilidade de latência e cria
**histórico** (séries temporais). Ver `docs/kb/modulos/arquitetura.md`.

Escala/porte atual: **~23,5 mil linhas** de TypeScript em `ascender-app/src`,
**26 tabelas** no schema, **13 áreas de tela** no dashboard.

## 4. Módulos e funcionalidades

Doze subsistemas documentados na KB (`docs/kb/modulos/`, todos com cobertura
`completo`/confiança `alta`):

| Módulo | O que faz | Código |
|--------|-----------|--------|
| **Autenticação & multi-tenant** | Login por usuário (Argon2 + iron-session); tenants; papel por tenant (`tenant_memberships`); operador de plataforma; signup público com fila de aprovação; impersonação auditada | `src/lib/auth/`, `src/lib/db/tenants.ts`, `src/lib/db/tenant-context.ts` |
| **Cadastros (CRUD)** | Clientes, unidades consumidoras, usinas, contratos, distribuidoras; anexos (PDF em banco), histórico, conciliação; importação de usinas do SolisCloud e cadastros do Digital Grid | `src/lib/cadastros/`, `src/app/(dashboard)/cadastros/` |
| **Operação & Dashboards** | Visão executiva, health score das usinas, central de atenção/incidentes, timeline operacional, mapa, heatmap de geração | `src/lib/operacao/`, `src/app/(dashboard)/executivo`, `/analise`, `/mapa` |
| **Geração** | Curvas de geração (dia/mês/ano), realizado × esperado, metas | `src/app/(dashboard)/geracao/`, `src/lib/soliscloud/telemetria-db.ts` |
| **Financeiro & Faturas** | Faturas (Digital Grid), **anexo e extração de contas de energia** (regex + IA), KPIs, conciliação boleto↔fatura | `src/lib/financeiro/`, `src/app/(dashboard)/financeiro/` |
| **Rateio & Auditoria** | Rateio de créditos SCEE; **auditoria automática** por regras (detecção de inconsistências de rateio) | `src/lib/auditoria/`, `src/lib/db/auditar-rateio.ts`, `src/app/(dashboard)/rateio/` |
| **Propostas & Gerador FV** | Dimensionamento FV, **precificação (custo/margem — server-only)**, payback/TIR, **Fio B**, PDF do cliente, export Excel | `src/lib/propostas/`, `src/app/(dashboard)/propostas/` |
| **Integração SolisCloud** | Cliente assinado **HMAC-SHA1**, fila global anti-rate-limit, mappers, sync de telemetria/geração/alarmes | `src/lib/soliscloud/`, `src/lib/db/sync-telemetria.ts`, `sync-geracao.ts` |
| **Integração Digital Grid** | Cliente REST (Billing API v1), sync de faturas e rateio, conciliação de cadastros | `src/lib/digitalgrid/`, `src/lib/db/sync-faturas-dg.ts`, `sync-rateio-dg.ts` |
| **Integrações (config) & IA** | Credenciais cifradas por provedor; **extração de faturas por IA** (Anthropic/OpenAI, JSON schema) com _fallback_ para regex | `src/lib/ai/`, `src/lib/crypto/secrets.ts`, `src/app/(dashboard)/integracoes/` |
| **Dados & Banco** | Schema Drizzle (26 tabelas), migrações no boot, seed do admin | `src/lib/db/schema.ts`, `drizzle/` |
| **Infra & Deploy** | Docker Compose, workers, Caddy, deploy por polling na VPS | `Dockerfile`, `docker-compose*.yml`, `scripts/deploy-poll.sh` |

## 5. Integrações externas (todas **somente leitura**)

- **SolisCloud** (telemetria/geração): assinatura **HMAC-SHA1** no servidor
  (`Content-Type` sem `charset`, senão HTTP 403); **fila global** que espaça chamadas
  concorrentes (~600 ms) + retry com backoff, para respeitar o **rate limit por conta**;
  cache em memória (TTL 5 min). Coleta estações, inversores, alarmes e
  **dataloggers/coletores**.
- **Digital Grid** (financeiro): Billing API v1 (`Authorization: Token`, paginação DRF).
  Faturas (`/bills`), rateio (`/estimated-quota`) e conciliação de cadastros
  (`/entities`, `/installations`, `/generators`).
- **IA (Anthropic/OpenAI)**: **extração estruturada de dados de contas de energia**
  (PDF) via **JSON schema**, com _fallback_ para parser regex — extrai cliente,
  competência, vencimento, valor, tributos, leituras e **saldo de créditos SCEE**.

## 6. Modelo de dados (principais entidades)

26 tabelas em `src/lib/db/schema.ts`. Núcleo:

- **Multi-tenant**: `tenants`, `tenant_memberships`, `tenant_access_audit`,
  `usuarios`, `app_settings`, `integration_credentials` (segredos cifrados por tenant).
- **Cadastro**: `distribuidoras`, `clientes`, `unidades_consumidoras`, `usinas`,
  `contratos`, `anexos`, `cadastro_historico`.
- **Operação/telemetria (IoT)**: `telemetria_estacao`, `telemetria_inversor`,
  `telemetria_coletor`, `alarmes`, `medicoes_geracao`, `sync_runs` (auditoria dos crons).
- **Financeiro/rateio**: `faturas`, `faturas_dg`, `contas_energia`, `rateios_dg`,
  `contas_energia` (PDF + campos extraídos).
- **Comercial**: `propostas`, `parametros_proposta`.

Colunas de negócio carregam `tenant_id` (NOT NULL, default = “tenant 0” = instância
atual) — base para o isolamento por empresa. Ver `docs/kb/modulos/dados-e-banco.md`.

## 7. Inteligência de negócio (o que o produto “sabe” do setor)

Regras de domínio codificadas e documentadas (KB) — o que diferencia a plataforma de
um dashboard genérico:

- **Dimensionamento fotovoltaico** — potência/nº de módulos a partir do consumo.
- **Precificação** — custo/margem/kit **confidenciais** (`import "server-only"`, nunca
  no bundle do cliente nem no PDF).
- **Viabilidade financeira** — payback, TIR, economia projetada.
- **Fio B (Lei 14.300/2022)** — cronograma de transição na base de desconto dos créditos.
- **Rateio de créditos SCEE** — distribuição de créditos entre unidades e
  **auditoria automática** que sinaliza inconsistências (UC sem rateio, crédito parado,
  fatura duplicada, encerramento etc.).
- **Health score & O&M** — status de saúde por usina, incidentes, aderência
  (realizado × esperado com meta proporcional aos dias).

## 8. SaaS multi-tenant (estado atual)

Fundação de multilocação **já implementada** (commits recentes na branch):
- **Tenants** = integradoras/instaladoras que assinam o SaaS; identidade de usuário
  **global**, com **papel por tenant** em `tenant_memberships` (base do RBAC).
- **Operador de plataforma** (staff Ascender): enxerga/administra todos os tenants e
  pode **“acessar empresa” (impersonar)**, com **auditoria** em `tenant_access_audit`.
- **Signup público** (`/signup`) com **fila de aprovação**; isolamento por tenant
  endurecido (fail-closed sem empresa; ~16 rotas de API escopadas).

Isso sustenta diretamente a **escalabilidade e replicabilidade** exigidas pelo edital:
o custo marginal de atender uma nova integradora é baixo.

## 9. Segurança e privacidade (LGPD)

**Já implementado:**
- Senhas com **Argon2**; sessão em **cookie cifrado** (iron-session, `sameSite`,
  `Secure` atrelado a HTTPS);
- **Segredos de integração cifrados** no banco com **AES-256-GCM** (nunca em git);
- **Confidencialidade de custo/margem** via `server-only`;
- **Isolamento multi-tenant** (fail-closed) e **auditoria de impersonação**;
- **Histórico de cadastro** (`cadastro_historico`).

**Gaps de conformidade (viram metas de projeto — ver `02-aderencia-ascender.md` §7):**
- **Log rastreável de acesso a dados pessoais** (LGPD art. 37: acesso, data, hora,
  finalidade) — exigido pela Cláusula 15 da minuta do Termo de Outorga;
- **Política formal de retenção/eliminação** de dados pessoais;
- **RBAC fino por tenant** (a estrutura existe; o _enforcement_ granular é evolução).

## 10. Infraestrutura e operação

- **Docker Compose**: app (porta 3005) + Postgres + **workers de sync** + **Caddy**
  (HTTPS/Let's Encrypt auto-renovável) em produção.
- **Migrações** rodam no **boot** do container (`docker-entrypoint.sh`).
- **Deploy por polling**: `scripts/deploy-poll.sh` (cron 5 min) faz `git pull --ff-only`
  de `main` e `docker compose up -d --build`. Basta commitar/pushar em `main`.
- **VPS** Ubuntu (Hostinger); backup por `pg_dump`.

## 11. Estágio de maturidade / TRL

| Indicador | Situação |
|-----------|----------|
| Estágio | **Em produção e comercialização** (não é protótipo) |
| TRL (aprox.) | **8–9** (sistema real, validado em operação) |
| Clientes | **1 em produção** (Ascender Solar Tech) + **1 em contratação** |
| Base de código | ~23,5 mil linhas TS · 26 tabelas · 13 áreas de tela · 12 módulos documentados |
| Documentação | Base de Conhecimento própria (`docs/kb/`) com cobertura completa |

Esse estágio é a **evidência central para o Eixo III (Aceleração)** e para o critério
**P (Potencial de negócio)**.

## 12. Grau de inovação e roadmap

- **Grau de inovação**: **incremental-a-radical** — a inovação não está numa tecnologia
  isolada, mas na **consolidação** (O&M + financeiro + comercial), na **auditoria
  automática de rateio SCEE** e na **IA aplicada a faturas** do setor elétrico,
  entregues como **SaaS multi-tenant** para um nicho carente de ferramentas integradas.
- **Roadmap** (de `HANDOFF.md` §9 e KB `pendencias/`), candidato a virar metas
  financiáveis: conformidade LGPD (trilha de auditoria), RBAC completo, onboarding
  self-service, parser de contas de outras distribuidoras, escala da telemetria
  (scheduler/particionamento), expansão de IA/analytics.

---

### Referências no repositório
- Base de Conhecimento: `docs/kb/README.md`, `docs/kb/cobertura.json`, `docs/kb/modulos/`.
- Estado do projeto: `HANDOFF.md`.
- Convenções e regras de negócio sensíveis: `CLAUDE.md`.
</content>
