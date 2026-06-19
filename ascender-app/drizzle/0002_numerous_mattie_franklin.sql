CREATE TABLE "faturas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid,
	"unidade_consumidora_id" uuid,
	"usina_id" uuid,
	"competencia" text DEFAULT '' NOT NULL,
	"valor_fatura" double precision DEFAULT 0 NOT NULL,
	"valor_boleto" double precision DEFAULT 0 NOT NULL,
	"vencimento" text,
	"status" text DEFAULT 'aguardando' NOT NULL,
	"pago_em" text,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_unidade_consumidora_id_unidades_consumidoras_id_fk" FOREIGN KEY ("unidade_consumidora_id") REFERENCES "public"."unidades_consumidoras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_usina_id_usinas_id_fk" FOREIGN KEY ("usina_id") REFERENCES "public"."usinas"("id") ON DELETE set null ON UPDATE no action;