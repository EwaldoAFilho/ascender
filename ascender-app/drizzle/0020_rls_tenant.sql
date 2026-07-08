ALTER TABLE "distribuidoras" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "distribuidoras" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "distribuidoras"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clientes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "clientes"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "unidades_consumidoras"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "usinas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usinas" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "usinas"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "contratos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contratos" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "contratos"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "faturas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "faturas" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "faturas"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "medicoes_geracao" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "medicoes_geracao" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "medicoes_geracao"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "faturas_dg" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "faturas_dg" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "faturas_dg"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "contas_energia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contas_energia" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "contas_energia"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "rateios_dg" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rateios_dg" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "rateios_dg"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "propostas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "propostas" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "propostas"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "parametros_proposta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "parametros_proposta" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "parametros_proposta"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "telemetria_estacao" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "telemetria_estacao" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "telemetria_estacao"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "telemetria_inversor" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "telemetria_inversor" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "telemetria_inversor"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "telemetria_coletor" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "telemetria_coletor" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "telemetria_coletor"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "alarmes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "alarmes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "alarmes"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "anexos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anexos" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "anexos"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "cadastro_historico" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cadastro_historico" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "cadastro_historico"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );--> statement-breakpoint
ALTER TABLE "sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sync_runs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "sync_runs"
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_tenant', true) IS NULL
    OR current_setting('app.current_tenant', true) = ''
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );
