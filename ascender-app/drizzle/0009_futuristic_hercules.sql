ALTER TABLE "contas_energia" ADD COLUMN "scee_saldo_anterior_kwh" double precision;--> statement-breakpoint
ALTER TABLE "contas_energia" ADD COLUMN "scee_transf_kwh" double precision;--> statement-breakpoint
ALTER TABLE "contas_energia" ADD COLUMN "scee_injetado_kwh" double precision;--> statement-breakpoint
ALTER TABLE "contas_energia" ADD COLUMN "scee_compensado_kwh" double precision;--> statement-breakpoint
ALTER TABLE "contas_energia" ADD COLUMN "scee_saldo_atual_kwh" double precision;