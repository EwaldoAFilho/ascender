CREATE TABLE "parametros_proposta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dados" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "cenario" text;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "potencia_kwp" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "modulo_wp" integer;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "qtd_modulos" integer;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "inversor_tipo" text;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "geracao_mensal_kwh" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "preco_final" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "preco_por_kwp" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "payback_anos" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "tir_percent" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "economia_25_anos" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "co2_toneladas" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "custo_total" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "margem_valor" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "margem_percent" double precision;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "dados_gerador" jsonb;