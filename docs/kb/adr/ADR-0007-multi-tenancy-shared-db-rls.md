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

## Estado (2026-07-08)
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
- **Próximo:** Fase 3 (RLS backstop no Postgres), Fase 4 (RBAC), Fase 5 (credenciais
  por tenant), Fase 6 (sync por tenant + Redis), Fase 7 (infra), Fase 8 (billing Stripe).

## Alternativas consideradas
- Schema-per-tenant / DB-per-tenant: rejeitados por custo operacional neste porte.

## Data
2026-07-08
