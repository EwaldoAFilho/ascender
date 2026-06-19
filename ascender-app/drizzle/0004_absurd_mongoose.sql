CREATE TABLE "propostas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"unidade_consumidora_id" uuid,
	"distribuidora_id" uuid,
	"consumo_estimado_kwh" double precision DEFAULT 0 NOT NULL,
	"tarifa_distribuidora" double precision DEFAULT 0 NOT NULL,
	"tarifa_ascender" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'simulacao' NOT NULL,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_unidade_consumidora_id_unidades_consumidoras_id_fk" FOREIGN KEY ("unidade_consumidora_id") REFERENCES "public"."unidades_consumidoras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_distribuidora_id_distribuidoras_id_fk" FOREIGN KEY ("distribuidora_id") REFERENCES "public"."distribuidoras"("id") ON DELETE set null ON UPDATE no action;