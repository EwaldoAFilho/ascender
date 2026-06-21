ALTER TABLE "clientes" ADD COLUMN "origem" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "origem_sincronizado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" ADD COLUMN "origem" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "unidades_consumidoras" ADD COLUMN "origem_sincronizado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "usinas" ADD COLUMN "origem" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "usinas" ADD COLUMN "origem_sincronizado_em" timestamp with time zone;