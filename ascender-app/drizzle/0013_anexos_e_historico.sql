CREATE TABLE "anexos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"mime_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"tamanho_bytes" integer DEFAULT 0 NOT NULL,
	"conteudo" "bytea" NOT NULL,
	"enviado_por" text,
	"enviado_por_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cadastro_historico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" uuid NOT NULL,
	"acao" text NOT NULL,
	"campo" text,
	"valor_antes" text,
	"valor_depois" text,
	"detalhe" text,
	"autor" text,
	"autor_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "anexos_entidade_idx" ON "anexos" USING btree ("entidade","entidade_id");--> statement-breakpoint
CREATE INDEX "cadastro_historico_entidade_idx" ON "cadastro_historico" USING btree ("entidade","entidade_id");