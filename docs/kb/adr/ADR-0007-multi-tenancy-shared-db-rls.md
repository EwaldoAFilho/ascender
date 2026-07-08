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
Fase de fundação de **identidade** implementada: tabelas `tenants` +
`tenant_memberships` (migração `drizzle/0018`), seed do tenant 0 + membership `owner`
do admin, e `SessionData.tenantId`/`role` populados no login
(`src/lib/auth/session.ts`, `src/app/api/auth/login/route.ts`, `src/lib/db/seed.ts`).
**Próximo:** `tenant_id NOT NULL DEFAULT tenant0` nas ~19 tabelas de negócio +
uniques compostas (Fase 1b), depois escopo de queries e RLS.

## Alternativas consideradas
- Schema-per-tenant / DB-per-tenant: rejeitados por custo operacional neste porte.

## Data
2026-07-08
