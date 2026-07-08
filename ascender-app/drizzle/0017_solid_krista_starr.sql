ALTER TABLE "propostas" ALTER COLUMN "cliente_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "propostas" ADD COLUMN "cliente_nome_livre" text;