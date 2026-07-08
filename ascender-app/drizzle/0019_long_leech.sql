ALTER TABLE "alarmes" DROP CONSTRAINT "alarmes_alarm_id_unique";--> statement-breakpoint
ALTER TABLE "distribuidoras" DROP CONSTRAINT "distribuidoras_nome_unique";--> statement-breakpoint
ALTER TABLE "faturas_dg" DROP CONSTRAINT "faturas_dg_dg_bill_id_unique";--> statement-breakpoint
ALTER TABLE "medicoes_geracao" DROP CONSTRAINT "medicoes_geracao_usina_competencia_fonte";--> statement-breakpoint
ALTER TABLE "rateios_dg" DROP CONSTRAINT "rateios_dg_month_installation_owner";--> statement-breakpoint
ALTER TABLE "alarmes" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "anexos" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "cadastro_historico" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "contas_energia" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "contratos" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "distribuidoras" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "faturas_dg" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "medicoes_geracao" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "parametros_proposta" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "rateios_dg" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "telemetria_coletor" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "telemetria_estacao" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "telemetria_inversor" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "usinas" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "alarmes" ADD CONSTRAINT "alarmes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadastro_historico" ADD CONSTRAINT "cadastro_historico_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contas_energia" ADD CONSTRAINT "contas_energia_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribuidoras" ADD CONSTRAINT "distribuidoras_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas_dg" ADD CONSTRAINT "faturas_dg_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicoes_geracao" ADD CONSTRAINT "medicoes_geracao_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros_proposta" ADD CONSTRAINT "parametros_proposta_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rateios_dg" ADD CONSTRAINT "rateios_dg_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetria_coletor" ADD CONSTRAINT "telemetria_coletor_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetria_estacao" ADD CONSTRAINT "telemetria_estacao_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetria_inversor" ADD CONSTRAINT "telemetria_inversor_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" ADD CONSTRAINT "unidades_consumidoras_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usinas" ADD CONSTRAINT "usinas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alarmes" ADD CONSTRAINT "alarmes_tenant_alarm" UNIQUE("tenant_id","alarm_id");--> statement-breakpoint
ALTER TABLE "distribuidoras" ADD CONSTRAINT "distribuidoras_tenant_nome" UNIQUE("tenant_id","nome");--> statement-breakpoint
ALTER TABLE "faturas_dg" ADD CONSTRAINT "faturas_dg_tenant_bill" UNIQUE("tenant_id","dg_bill_id");--> statement-breakpoint
ALTER TABLE "medicoes_geracao" ADD CONSTRAINT "medicoes_geracao_tenant_usina_competencia_fonte" UNIQUE("tenant_id","usina_id","competencia","fonte");--> statement-breakpoint
ALTER TABLE "parametros_proposta" ADD CONSTRAINT "parametros_proposta_tenant" UNIQUE("tenant_id");--> statement-breakpoint
ALTER TABLE "rateios_dg" ADD CONSTRAINT "rateios_dg_tenant_month_installation_owner" UNIQUE("tenant_id","generation_month_id","installation","owner_document");