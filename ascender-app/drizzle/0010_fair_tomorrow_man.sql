CREATE TABLE "alarmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alarm_id" text NOT NULL,
	"usina_id" uuid,
	"station_id" text,
	"device_sn" text,
	"nivel" text DEFAULT 'baixo' NOT NULL,
	"mensagem" text,
	"iniciado_em" text,
	"status" text DEFAULT 'aberto' NOT NULL,
	"visto_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvido_em" timestamp with time zone,
	CONSTRAINT "alarmes_alarm_id_unique" UNIQUE("alarm_id")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" text NOT NULL,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"terminado_em" timestamp with time zone,
	"status" text DEFAULT 'ok' NOT NULL,
	"itens" integer DEFAULT 0 NOT NULL,
	"mensagem" text
);
--> statement-breakpoint
CREATE TABLE "telemetria_coletor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usina_id" uuid,
	"station_id" text,
	"sn" text NOT NULL,
	"estado" text DEFAULT 'offline' NOT NULL,
	"ultima_comunicacao" text,
	"modelo" text,
	"capturado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetria_estacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usina_id" uuid,
	"station_id" text NOT NULL,
	"estado" text DEFAULT 'offline' NOT NULL,
	"potencia_kw" double precision DEFAULT 0 NOT NULL,
	"energia_dia_kwh" double precision DEFAULT 0 NOT NULL,
	"energia_mes_kwh" double precision DEFAULT 0 NOT NULL,
	"energia_ano_kwh" double precision DEFAULT 0 NOT NULL,
	"energia_total_kwh" double precision DEFAULT 0 NOT NULL,
	"capturado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetria_inversor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usina_id" uuid,
	"station_id" text,
	"serial" text NOT NULL,
	"estado" text DEFAULT 'offline' NOT NULL,
	"potencia_kw" double precision DEFAULT 0 NOT NULL,
	"energia_dia_kwh" double precision DEFAULT 0 NOT NULL,
	"energia_total_kwh" double precision DEFAULT 0 NOT NULL,
	"temperatura_c" double precision DEFAULT 0 NOT NULL,
	"capturado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alarmes" ADD CONSTRAINT "alarmes_usina_id_usinas_id_fk" FOREIGN KEY ("usina_id") REFERENCES "public"."usinas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetria_coletor" ADD CONSTRAINT "telemetria_coletor_usina_id_usinas_id_fk" FOREIGN KEY ("usina_id") REFERENCES "public"."usinas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetria_estacao" ADD CONSTRAINT "telemetria_estacao_usina_id_usinas_id_fk" FOREIGN KEY ("usina_id") REFERENCES "public"."usinas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetria_inversor" ADD CONSTRAINT "telemetria_inversor_usina_id_usinas_id_fk" FOREIGN KEY ("usina_id") REFERENCES "public"."usinas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "telemetria_coletor_sn_capt_idx" ON "telemetria_coletor" USING btree ("sn","capturado_em");--> statement-breakpoint
CREATE INDEX "telemetria_estacao_station_capt_idx" ON "telemetria_estacao" USING btree ("station_id","capturado_em");--> statement-breakpoint
CREATE INDEX "telemetria_estacao_usina_capt_idx" ON "telemetria_estacao" USING btree ("usina_id","capturado_em");--> statement-breakpoint
CREATE INDEX "telemetria_inversor_serial_capt_idx" ON "telemetria_inversor" USING btree ("serial","capturado_em");