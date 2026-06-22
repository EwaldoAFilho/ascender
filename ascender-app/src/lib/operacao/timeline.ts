import {
  getOperationalOverview,
  type OperationalOverview,
} from "@/lib/operacao/operational-overview";
import {
  historicoAlarmes,
  listarSyncRunsRecentes,
  type AlarmeHistorico,
  type SyncRunRecente,
} from "@/lib/soliscloud/telemetria-db";

export type TimelineSeverity = "critical" | "warning" | "info" | "success";

export type TimelineType =
  | "alarm"
  | "telemetry"
  | "collector"
  | "sync"
  | "finance";

export type OperationalTimelineEvent = {
  id: string;
  severity: TimelineSeverity;
  type: TimelineType;
  title: string;
  description: string;
  occurredAt: Date | string;
  ageLabel?: string;
  targetLabel?: string;
  href?: string;
};

function ageLabel(occurredMs: number, nowMs: number): string {
  const min = Math.max(0, Math.round((nowMs - occurredMs) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export type TimelineInput = {
  nowMs: number;
  alarms: AlarmeHistorico[];
  syncRuns: SyncRunRecente[];
  lastTelemetryIso: string | null;
  lastTelemetryAgeMinutes: number | null;
  limit?: number;
};

/**
 * Função PURA: mescla os eventos datados, ordena (mais recente primeiro) e
 * limita. `nowMs` é injetado (sem `Date.now()` interno) para ser determinística.
 */
export function buildTimeline(input: TimelineInput): OperationalTimelineEvent[] {
  const eventos: Array<OperationalTimelineEvent & { _t: number }> = [];

  for (const a of input.alarms) {
    const resolvido = a.resolvidoEm != null;
    const t = ms(resolvido ? a.resolvidoEm : a.atualizadoEm);
    if (t == null) continue;
    eventos.push({
      _t: t,
      id: `alarm-${a.alarmId}-${resolvido ? "res" : "act"}`,
      type: "alarm",
      severity: resolvido ? "success" : "warning",
      title: resolvido ? "Alarme resolvido" : "Alarme ativo",
      description: a.mensagem || (resolvido ? "Alarme normalizado." : "Alarme ativo no dispositivo."),
      occurredAt: new Date(t).toISOString(),
      ageLabel: ageLabel(t, input.nowMs),
      targetLabel: a.usinaNome !== "—" ? a.usinaNome : undefined,
      href: "/soliscloud",
    });
  }

  for (const s of input.syncRuns) {
    const t = ms(s.terminadoEm) ?? ms(s.iniciadoEm);
    if (t == null) continue;
    const ok = s.status === "ok";
    eventos.push({
      _t: t,
      id: `sync-${s.id}`,
      type: "sync",
      severity: ok ? "success" : "critical",
      title: ok ? "Sincronização concluída" : "Falha de sincronização",
      description: ok
        ? `Job "${s.job}" · ${s.itens} item(ns).`
        : `Job "${s.job}" falhou${s.mensagem ? `: ${s.mensagem}` : "."}`,
      occurredAt: new Date(t).toISOString(),
      ageLabel: ageLabel(t, input.nowMs),
      targetLabel: s.job,
    });
  }

  const tTele = ms(input.lastTelemetryIso);
  if (tTele != null) {
    const atrasada =
      input.lastTelemetryAgeMinutes != null &&
      input.lastTelemetryAgeMinutes > 60;
    eventos.push({
      _t: tTele,
      id: "telemetry-last",
      type: "telemetry",
      severity: atrasada ? "warning" : "info",
      title: atrasada ? "Telemetria atrasada" : "Telemetria atualizada",
      description: `Última coleta da frota${
        input.lastTelemetryAgeMinutes != null
          ? ` (${ageLabel(tTele, input.nowMs)})`
          : ""
      }.`,
      occurredAt: new Date(tTele).toISOString(),
      ageLabel: ageLabel(tTele, input.nowMs),
    });
  }

  eventos.sort((a, b) => b._t - a._t);
  const limit = input.limit ?? 8;
  return eventos.slice(0, limit).map(({ _t, ...e }) => {
    void _t;
    return e;
  });
}

/**
 * Camada de leitura da timeline. Reaproveita o overview para a última telemetria
 * e faz leitura própria apenas de alarmes (`historicoAlarmes`) e execuções de
 * sync (`listarSyncRunsRecentes`) — ambas somente leitura.
 */
export async function getTimeline(
  overview?: OperationalOverview,
  limit = 8,
): Promise<OperationalTimelineEvent[]> {
  const ov = overview ?? (await getOperationalOverview());
  const [alarms, syncRuns] = await Promise.all([
    historicoAlarmes(20),
    listarSyncRunsRecentes(8),
  ]);
  return buildTimeline({
    nowMs: Date.now(),
    alarms,
    syncRuns,
    lastTelemetryIso: ov.lastTelemetryIso,
    lastTelemetryAgeMinutes: ov.lastTelemetryAgeMinutes,
    limit,
  });
}
