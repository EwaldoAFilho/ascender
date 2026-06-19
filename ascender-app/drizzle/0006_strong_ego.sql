CREATE TABLE "rateios_dg" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_month_id" integer NOT NULL,
	"competencia" text DEFAULT '' NOT NULL,
	"generator_number" text,
	"usina_nome" text,
	"installation" text DEFAULT '' NOT NULL,
	"owner_name" text,
	"owner_document" text DEFAULT '' NOT NULL,
	"percentual" double precision DEFAULT 0 NOT NULL,
	"covering" double precision DEFAULT 0 NOT NULL,
	"consumo_kwh" double precision DEFAULT 0 NOT NULL,
	"creditos_acumulados" double precision DEFAULT 0 NOT NULL,
	"annotations" text,
	"raw" jsonb,
	"sincronizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rateios_dg_month_installation_owner" UNIQUE("generation_month_id","installation","owner_document")
);
