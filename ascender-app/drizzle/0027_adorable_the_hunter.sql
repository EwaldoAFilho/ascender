-- Backfill: tenants no default legado "padrao" (slug que NÃO existe em `planos`) → "starter".
-- Sem isso, quotaUsinas cai em fail-open (plano desconhecido = sem limite) para tenants
-- criados antes do Passo 3a. A Ascender (tenant 0) já é "interno" (seed) — não é afetada.
UPDATE "tenants" SET "plano" = 'starter', "updated_at" = now() WHERE "plano" = 'padrao';
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plano" SET DEFAULT 'starter';
