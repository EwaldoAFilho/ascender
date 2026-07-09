# ADR-0007 — Multi-tenancy: banco compartilhado + tenant_id + RLS

## Contexto
O ASCENDER está sendo transformado em **SaaS** para integradoras/instaladoras
solares (cada empresa = um **tenant** isolado). Hoje é single-tenant (ver
[ADR-0001](ADR-0001-login-unico-sem-rbac.md)): nenhuma tabela tem escopo de tenant,
todas as queries retornam tudo. Roadmap completo em
`/home/desenvolvedor/.claude/plans/queria-saber-qual-a-velvety-platypus.md`.

## Decisão
- **Modelo de tenancy:** banco **compartilhado** + coluna `tenant_id` em todas as
  tabelas de negócio + **Postgres Row-Level Security (RLS)** como rede de segurança.
  (Descartados schema-per-tenant e DB-per-tenant pelo custo operacional para dezenas
  de tenants; um tenant que exija isolamento físico pode ser promovido a DB-próprio
  depois, pois o `tenant_id` já existirá.)
- **Identidade + membership:** `usuarios.email` é identidade GLOBAL; o vínculo
  usuário↔tenant + papel (RBAC) fica em `tenant_memberships` (owner/admin/operador/
  leitura). Um usuário pode pertencer a 1+ tenants.
- **Migração "tenant 0":** os dados atuais viram o primeiro tenant (`TENANT0_ID` =
  `00000000-0000-0000-0000-000000000001`, a Ascender). A instância atual segue
  funcionando durante toda a migração.
- **Abordagem faseada** (fundação → escopo de query → RLS → RBAC → credenciais por
  tenant → sync por tenant → infra → billing self-serve com Stripe).

## Consequências
- Isolamento é **lógico** (RLS), não físico: exige role de app **sem BYPASSRLS** +
  `FORCE ROW LEVEL SECURITY`, e `SET LOCAL app.current_tenant` por transação
  (`withTenant`). Cache/rate-limit precisam de namespace por tenant (senão vazam).
- Chaves únicas globais viram compostas com `tenant_id` (`distribuidoras.nome`,
  `faturas_dg.dg_bill_id`, `alarmes.alarm_id`, uniques de `medicoes_geracao`/`rateios_dg`,
  `integration_credentials.provider`). `usuarios.email` permanece global.
- `parametros_proposta` e `integration_credentials` (hoje globais) passam a 1 por tenant.

## Estado (2026-07-09)
- **Fase 1a (identidade) — feita:** tabelas `tenants` + `tenant_memberships`
  (migração `drizzle/0018`), seed do tenant 0 + membership `owner`, e
  `SessionData.tenantId`/`role` no login (`session.ts`, `api/auth/login`, `seed.ts`).
- **Fase 1b (tenant_id nas tabelas) — feita:** `tenant_id NOT NULL DEFAULT '<tenant0>'`
  (fábrica `tenantCol`) nas 19 tabelas de negócio + uniques compostas (migração
  `drizzle/0019`). Backfill verificado: 0 linhas fora do tenant 0. O `DEFAULT`
  mantém a app não-quebrada até o escopo por query/RLS.
- **Fase 2 (escopo por tenant) — feita:** contexto de tenant (`db/tenant-context.ts`
  com `AsyncLocalStorage` + `auth/tenant.ts` `withSessionTenant`/`getSessionTenantId`);
  todas as queries de leitura filtram por `getCurrentTenantId()`, os writes setam
  `tenant_id` e escopam o WHERE, e as páginas (server components) carregam dados
  dentro de `withSessionTenant`. Isolamento provado com um tenant B (cada tenant só
  vê os próprios dados). Pendências por design: integrações/credenciais globais
  (dropdown Solis compartilhado) → Fase 5; route handlers de API e workers usam
  fallback tenant 0 → Fase 5/6.
- **Fase 3 (RLS) — feita:** `withTenant()` abre transação + `SET LOCAL
  app.current_tenant`; `getDb()` usa essa transação no contexto (senão o pool) sem
  mudar os call sites. Migração `0020`: `ENABLE`/`FORCE ROW LEVEL SECURITY` + policy
  `tenant_isolation` (permissiva quando o GUC não está setado, estrita quando está)
  nas 19 tabelas. Migração `0021`: role restrita `ascender_app` (NOSUPERUSER,
  NOBYPASSRLS) usada pelo runtime (`APP_DATABASE_URL`); migrate/seed seguem como o
  dono. Provado: `SELECT` sem `WHERE` é filtrado pela RLS ao tenant do contexto.
- **Fase 4 (RBAC) — feita:** papéis por tenant (`owner > admin > operador > leitura`)
  em `tenant_memberships`; `auth/rbac.ts` com `getSessionRole()` (revalida o membership
  no banco, com fallback), `roleAtLeast`, `requireRole(min)` (server actions) e
  `requireRoleResponse(min)` (route handlers → 403). Rotas sensíveis gated: gestão de
  usuários/membros (tela e ações escopadas ao tenant, com coluna/edição de papel),
  premissas de proposta (preços/margem) e PUT das credenciais de integração. Provado:
  admin enxerga usuários + papéis; operador é bloqueado nas ações mas usa a app normal.
- **Fase 5 (credenciais por tenant) — feita:** `integration_credentials` ganhou
  `tenant_id` + `unique(tenant_id, provider)` (migração `0022`, que também aplica
  `ENABLE`/`FORCE ROW LEVEL SECURITY` + policy `tenant_isolation` na tabela). Os
  loaders `soliscloud/credentials.ts`, `digitalgrid/credentials.ts` e `ai/credentials.ts`
  filtram/gravam por `getCurrentTenantId()` (upsert no alvo composto `(tenant_id,
  provider)`); os route handlers de credenciais rodam dentro de `withSessionTenant` e a
  página `/integracoes` carrega tudo no contexto do tenant. Endurecimento do contexto:
  `getCurrentTenantId()`/`getSessionTenantId()` usam `|| TENANT0_ID` (string vazia →
  tenant 0), evitando `uuid ""` no render RSC. Provado: cada tenant só lê a própria
  credencial; salvar a do tenant B não altera a do tenant 0. *Rotação de chave por
  tenant (envelope/KEK) fica para depois — o blob de cripto ainda usa a chave mestra única.*
- **RLS hardening (migração `0023`) — feito:** a policy `tenant_isolation` passou a
  usar `NULLIF(current_setting('app.current_tenant', true), '')::uuid` nas 20 tabelas.
  A forma anterior (`IS NULL OR = ''`) não bastava: o Postgres não garante
  short-circuit de `OR` e avaliava o cast de `''` para uuid mesmo com as guardas
  verdadeiras (raiz do 500 de `/integracoes` na Fase 5, pois o valor de reset de um
  GUC custom numa conexão de pool passa a ser `''`, não NULL). `NULLIF` converte `''`
  em NULL antes do cast → nunca dispara. Corrige na origem (a mitigação da Fase 5 só
  tratava os call sites de código, não a policy).
- **Fase 6a (writes dos workers) — feita:** os upserts de `medicoes_geracao` e
  `alarmes` usavam os `ON CONFLICT` antigos (dropados pela 0019) → erro 42P10 a cada
  ciclo (bug em produção). Agora batem com as UNIQUE compostas `(tenant_id, …)` e todas
  as escritas dos syncs setam `tenant_id` explícito (telemetria_*, usinas, sync_runs);
  reads auxiliares de `usinas` e o painel `getSyncRunsResumo` escopados por tenant.
- **Fase 6b (sync por tenant) — feita:** `db/tenants.ts::listarTenantsComCredencial`
  enumera tenants ativos com credencial do provider (fora de contexto); `sync/jobs.ts`
  é o registro único dos 4 jobs + `rodarJobParaTenant` (usa `runWithTenant` — só ALS,
  sem transação longa durante o I/O de rede) e `rodarJobTodosTenants` (loop com
  try/catch POR TENANT). Os 4 entrypoints `db:sync-*` viram wrappers. Provado com um
  tenant B (credenciais próprias fake): cada tenant usa a SUA credencial (403 no B) e
  a falha de um não derruba os outros; `sync_runs` por tenant; zero vazamento.
- **Fase 6c (cache/rate-limit por conta) — feita:** no cliente SolisCloud a chave de
  cache passou a `${keyId}:${resourcePath}:${body}` e o rate-limit virou um balde
  (fila+timestamp) por `keyId` — contas de tenants distintos não vazam resposta nem se
  serializam. As rotas de leitura Solis (`withSolis`, `/test`) rodam em
  `withSessionTenant`. In-process (sem Redis).
- **Fase 6d (fila/lock via pg-boss) — feita:** worker único (`src/lib/worker/index.ts`)
  sobre **pg-boss** (fila+cron+lock no próprio Postgres) substitui os 3 loops shell.
  Cron por tipo de job → fanout que enumera tenants e enfileira 1 `sync-run` por tenant
  com `singletonKey = job:tenant`; a fila `sync-run` usa `policy: 'stately'` →
  índice único parcial `(name,state,singleton_key) WHERE state<=active` = no máximo 1
  rodando + 1 na fila por `(tenant,job)` (sem sobreposição nem acúmulo). `docker-compose`
  colapsa 3 serviços em `worker`; `deploy-poll.sh` ganhou `--remove-orphans`.
- **Decisão (Fase 6): Redis adiado para a Fase 7.** O sistema é single-instance (1 app
  + 1 worker); namespacing in-process resolve cache/rate-limit e pg-boss provê
  fila/cron/lock sobre o Postgres — nada na Fase 6 exige Redis. Redis passa a ser
  necessário só com réplicas horizontais (bucket/cache compartilhados) → Fase 7.
- **Fase 7 (ops hardening) — feita (parcial):** endurecimento de operação que vale já
  no cenário single-instance (Redis + réplicas horizontais adiados até haver carga real):
  - **Migrations fora do boot:** serviço one-shot `migrate` (docker-compose) roda
    `db:migrate` + `db:seed` uma vez por deploy; `app` e `worker` esperam via
    `depends_on: { migrate: service_completed_successfully }`. O `docker-entrypoint.sh`
    do `app` agora só faz `start` — não migra mais no boot (evita corrida com réplicas).
  - **Backup automático (prod):** serviço `backup` faz `pg_dump` diário comprimido no
    volume `ascender_backups` com retenção (`BACKUP_RETENTION_DAYS`, default 7). Local
    (mesmo VPS). Runbook: `runbooks/backup-restore.md`.
  - **Healthchecks:** `app` expõe `/api/health` (liveness pública) + healthcheck via
    `wget 127.0.0.1` (IPv4, senão `localhost`→::1 dá connection refused); o `worker`
    escreve um heartbeat (`/tmp/worker-heartbeat`) e o healthcheck marca unhealthy se
    o event loop travar. `deploy-poll.sh` já usa `--remove-orphans` (Fase 6d).
- **Produto/SaaS — Passo 1 (operador da plataforma) — feito:** camada de administração
  ACIMA do RBAC por-tenant, sem depender de cobrança. Flag `usuarios.is_platform_admin`
  (migração 0024; seed marca o `LOGIN_EMAIL`); painel `/plataforma` (`platform.ts` +
  `PlataformaClient`) lista/cria/aprova/suspende/cancela empresas — cross-tenant, roda
  FORA de `withSessionTenant`. **Controle de acesso por status** no login: `tenants.status`
  (`pendente|trial|ativo|suspenso|cancelado`); só `trial`/`ativo` entram (demais → 403).
- **Operador SEPARADO da empresa + impersonação — feito (ajuste de identidade):** o
  operador deixou de ser "um usuário da Ascender com flag" e virou uma identidade à
  parte — **não pertence a nenhuma empresa** (o seed remove seus memberships). No login,
  o operador não recebe `tenantId` e cai no painel; grupo de rotas **`(plataforma)`** com
  shell próprio (guard `requirePlatformAdminPage`), separado do app solar (grupo
  `(dashboard)`, cujo layout server redireciona operador-sem-empresa para o painel).
  Usuário de empresa sem membership é bloqueado no login. **"Acessar empresa"**
  (`acessarEmpresaAction`, restrita a operador) fixa o tenant na sessão (papel efetivo
  `owner`), registra **auditoria** (`operador_acessos`, migração 0025) e leva ao app da
  empresa (banner "acessando <empresa> · Sair"); `sairDaEmpresaAction` limpa o contexto.
  A Ascender vira só mais uma empresa na lista. Detalhe: ver
  [`../modulos/auth-autorizacao.md`](../modulos/auth-autorizacao.md).
- **Produto/SaaS — Passo 2 (autocadastro + aprovação) — feito:** `/signup` PÚBLICO
  (`signup-actions.ts::signupAction`, sem sessão; honeypot anti-bot) cria a empresa com
  status `pendente` + dono via `criarEmpresaComDono` (atômico). O dono NÃO entra até o
  operador aprovar (login bloqueia `pendente`). O painel `/plataforma` aprova/recusa
  pendentes (Aprovar → `trial`) e mostra "N aguardando aprovação". `middleware` libera
  `/signup`; `/login` ganhou link cruzado.
  Endurecimento (revisão adversarial): `/signup` tem rate-limit por IP (5/h) + teto
  global (30/10min) in-memory (`auth/rate-limit.ts`), `.max()` em todos os campos,
  honeypot, e **não** vaza erro cru do banco (`db/erros.ts::ehViolacaoUnica` → mensagem
  amigável). *Falta captcha e o rate-limit é por-processo (migrar p/ Redis com réplicas).*
- **Endurecimento de isolamento (revisão adversarial do operador) — feito:** dois
  ajustes de segurança: (1) `getSessionTenantId()` agora é **fail-CLOSED** — sessão
  autenticada sem empresa (operador não-impersonando) é NEGADA (`SemEmpresaAtivaError`)
  em vez de cair no tenant 0 (Ascender real); o fallback tenant-0 fica só no contexto
  sem sessão (`getCurrentTenantId`, workers). (2) **~16 rotas de API** (`/api/soliscloud/*`,
  `/api/financeiro/conta*`, `/api/cadastros/anexo*`) que liam/gravavam dados de tenant
  **sem** `withSessionTenant` foram envolvidas — antes caíam no tenant 0 e devolviam
  dados da Ascender a qualquer usuário (vazamento cross-tenant dormente, latente desde
  a Fase 2/5). Provado: usuário de outra empresa recebe os PRÓPRIOS dados (vazios), não
  os da Ascender; operador não-impersonando falha fechado (500).
- **Varredura de isolamento (6 dimensões, multi-agente) — feita:** auditoria completa de
  server actions, páginas, leituras, escritas, cobertura de RLS e fronteira de contexto/
  cache/segredos. Resultado **limpo** no backstop: RLS cobre todas as tabelas com tenant_id
  (ENABLE+FORCE, policy NULLIF), `ascender_app` é NOBYPASSRLS, os módulos de query filtram
  por `getCurrentTenantId()`, o cache Solis é namespaced por keyId e custo/margem seguem
  server-only. Foram achados e corrigidos **5 entry points** que tocavam dados sem
  `withSessionTenant` (mesmo padrão): server actions `importarUsinasSolis`,
  `importarCadastrosDg` e `getFichaCliente` (`cadastros/actions.ts`), a leitura de premissas
  em `gerarProposta` (`propostas/actions.ts`) e a página `/configuracoes/proposta-precos`
  (esta última expunha kit/custos/margem do tenant 0 — confidencial). Todos envolvidos em
  `withSessionTenant`.
- **Próximo (produto):** Passo 3 — cobrança (gateway; avaliar BR-native
  Asaas/Iugu/Vindi vs. Stripe, dado Pix/boleto) + planos/quotas por tenant. *Só quando
  houver um piloto rodando e um preço definido.*
- **Próximo (infra):** Fase 7 restante (quando houver carga): **Redis** + **réplicas
  horizontais**, quotas por tenant, cópia **offsite** dos backups. *Pendente: rotação de
  chave de cripto por tenant (envelope/KEK), herdada da Fase 5; e revalidação de status
  por request (hoje suspender só bloqueia novos logins).*

> **Nota de segurança:** a senha de `ascender_app` está fixa no `0021` (dev). Em
> produção, parametrizar via env/secret. O banco não é exposto externamente.

## Alternativas consideradas
- Schema-per-tenant / DB-per-tenant: rejeitados por custo operacional neste porte.

## Data
2026-07-09
