CREATE TABLE "operador_acessos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operador_user_id" uuid NOT NULL,
	"operador_email" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_nome" text NOT NULL,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL
);
