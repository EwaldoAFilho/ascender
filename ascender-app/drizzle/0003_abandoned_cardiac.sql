CREATE TABLE "medicoes_geracao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usina_id" uuid NOT NULL,
	"competencia" text NOT NULL,
	"geracao_kwh" double precision DEFAULT 0 NOT NULL,
	"receita" double precision DEFAULT 0 NOT NULL,
	"fonte" text DEFAULT 'soliscloud' NOT NULL,
	"sincronizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medicoes_geracao_usina_competencia_fonte" UNIQUE("usina_id","competencia","fonte")
);
--> statement-breakpoint
ALTER TABLE "medicoes_geracao" ADD CONSTRAINT "medicoes_geracao_usina_id_usinas_id_fk" FOREIGN KEY ("usina_id") REFERENCES "public"."usinas"("id") ON DELETE cascade ON UPDATE no action;