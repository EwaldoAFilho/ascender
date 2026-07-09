-- Fase 6 (hardening da RLS): torna a policy tenant_isolation à prova de
-- app.current_tenant = '' (string vazia).
--
-- A policy anterior (0020/0022) protegia o cast com `IS NULL OR = ''`, mas o
-- Postgres NÃO garante short-circuit de OR e avalia
-- `current_setting('app.current_tenant', true)::uuid` mesmo quando as guardas
-- são verdadeiras — e o cast de '' para uuid dispara
-- "invalid input syntax for type uuid: \"\"". Isso ocorre porque, uma vez que
-- um GUC custom é setado (SET LOCAL) numa transação, o valor de reset da conexão
-- do pool vira '' (não NULL) — então qualquer query FORA de withTenant, na mesma
-- conexão reutilizada, quebrava (raiz do 500 em /integracoes na Fase 5).
--
-- Solução: NULLIF(current_setting(...), '') converte '' em NULL ANTES do cast,
-- então `NULL::uuid` = NULL (nunca dispara). Mesma semântica permissiva quando o
-- GUC está ausente/vazio, estrita quando setado.

DROP POLICY IF EXISTS "tenant_isolation" ON "alarmes";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "alarmes"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "anexos";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "anexos"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "cadastro_historico";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "cadastro_historico"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "clientes";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "clientes"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "contas_energia";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "contas_energia"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "contratos";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "contratos"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "distribuidoras";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "distribuidoras"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "faturas";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "faturas"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "faturas_dg";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "faturas_dg"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "integration_credentials";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "integration_credentials"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "medicoes_geracao";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "medicoes_geracao"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "parametros_proposta";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "parametros_proposta"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "propostas";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "propostas"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "rateios_dg";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "rateios_dg"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "sync_runs";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "sync_runs"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "telemetria_coletor";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "telemetria_coletor"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "telemetria_estacao";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "telemetria_estacao"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "telemetria_inversor";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "telemetria_inversor"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "unidades_consumidoras";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "unidades_consumidoras"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation" ON "usinas";
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "usinas"
  USING (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_tenant', true), '') IS NULL
    OR "tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid
  );
