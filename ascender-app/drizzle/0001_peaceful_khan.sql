CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"documento" text DEFAULT '' NOT NULL,
	"tipo" text DEFAULT 'cliente' NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"email" text,
	"responsavel" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"unidade_consumidora_id" uuid,
	"usina_id" uuid,
	"tarifa_distribuidora" double precision DEFAULT 0 NOT NULL,
	"tarifa_ascender" double precision DEFAULT 0 NOT NULL,
	"percentual_desconto" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'simulacao' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribuidoras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"uf" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distribuidoras_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "unidades_consumidoras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"codigo_instalacao" text NOT NULL,
	"distribuidora_id" uuid,
	"consumo_medio_kwh" double precision DEFAULT 0 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usinas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"codigo_digital_grid" text,
	"station_id_soliscloud" text,
	"distribuidora_id" uuid,
	"potencia_kwp" double precision DEFAULT 0 NOT NULL,
	"geracao_esperada_kwh_mes" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_unidade_consumidora_id_unidades_consumidoras_id_fk" FOREIGN KEY ("unidade_consumidora_id") REFERENCES "public"."unidades_consumidoras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_usina_id_usinas_id_fk" FOREIGN KEY ("usina_id") REFERENCES "public"."usinas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" ADD CONSTRAINT "unidades_consumidoras_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" ADD CONSTRAINT "unidades_consumidoras_distribuidora_id_distribuidoras_id_fk" FOREIGN KEY ("distribuidora_id") REFERENCES "public"."distribuidoras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usinas" ADD CONSTRAINT "usinas_distribuidora_id_distribuidoras_id_fk" FOREIGN KEY ("distribuidora_id") REFERENCES "public"."distribuidoras"("id") ON DELETE set null ON UPDATE no action;