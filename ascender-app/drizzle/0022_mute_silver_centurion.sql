ALTER TABLE "integration_credentials" DROP CONSTRAINT "integration_credentials_provider_unique";--> statement-breakpoint
ALTER TABLE "integration_credentials" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_tenant_provider" UNIQUE("tenant_id","provider");--> statement-breakpoint
ALTER TABLE "integration_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integration_credentials" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "integration_credentials"
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
