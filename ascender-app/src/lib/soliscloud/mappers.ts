import type {
  AlarmLevel,
  DeviceState,
  InverterTelemetry,
  SolisAlarm,
  SolisTelemetry,
} from "@/types/soliscloud";
import type {
  SolisAlarmRecord,
  SolisInverterRecord,
  SolisPaged,
  SolisSeriesRecord,
  SolisStationRecord,
} from "./types";

function num(value: unknown): number {
  const n =
    typeof value === "string"
      ? parseFloat(value)
      : typeof value === "number"
        ? value
        : 0;
  return Number.isFinite(n) ? n : 0;
}

/** Converte um valor de potência para kW usando a unidade textual, se houver. */
function toKw(value: number, unitStr?: string): number {
  const unit = (unitStr ?? "kW").trim().toLowerCase();
  if (unit === "w") return value / 1000;
  if (unit === "mw") return value * 1000;
  if (unit === "gw") return value * 1_000_000;
  return value; // kW (ou desconhecido)
}

/** Converte um valor de energia para kWh usando a unidade textual, se houver. */
function toKwh(value: number, unitStr?: string): number {
  const unit = (unitStr ?? "kWh").trim().toLowerCase();
  if (unit === "wh") return value / 1000;
  if (unit === "mwh") return value * 1000;
  if (unit === "gwh") return value * 1_000_000;
  return value; // kWh (ou desconhecido)
}

function mapState(state: unknown): DeviceState {
  const s = Number(state);
  if (s === 1) return "online";
  if (s === 3) return "alarm";
  return "offline";
}

function mapAlarmLevel(level: unknown): AlarmLevel {
  const l = Number(level);
  if (l >= 3) return "critico";
  if (l === 2) return "medio";
  return "baixo";
}

function mapAlarmStatus(state: unknown): SolisAlarm["status"] {
  const s = Number(state);
  if (s === 2) return "resolvido";
  if (s === 1) return "em-tratativa";
  return "aberto";
}

function formatTimestamp(value: unknown): string {
  if (value == null || value === "") return "";
  const epoch = typeof value === "string" ? Number(value) : (value as number);
  if (!Number.isFinite(epoch)) return String(value);
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(epoch));
  } catch {
    return String(value);
  }
}

/** Extrai a lista de registros das várias estruturas de paginação possíveis. */
export function extractRecords<T>(data: SolisPaged<T> | undefined | null): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ("page" in data && data.page?.records) return data.page.records;
  if ("records" in data && data.records) return data.records;
  return [];
}

export function mapStationRecord(record: SolisStationRecord): SolisTelemetry {
  const stationId = String(record.id ?? record.stationId ?? record.sno ?? "");
  return {
    plantId: stationId,
    stationId,
    stationName: record.name ?? record.stationName ?? stationId,
    updateTime: formatTimestamp(record.dataTimestamp ?? record.updateDate),
    state: mapState(record.state),
    currentPowerKw: toKw(
      num(record.power ?? record.pac),
      record.powerStr ?? record.pacStr,
    ),
    dayEnergyKwh: toKwh(
      num(record.dayEnergy ?? record.etoday),
      record.dayEnergyStr,
    ),
    monthEnergyKwh: toKwh(num(record.monthEnergy), record.monthEnergyStr),
    yearEnergyKwh: toKwh(num(record.yearEnergy), record.yearEnergyStr),
    allEnergyKwh: toKwh(
      num(record.allEnergy ?? record.etotal),
      record.allEnergyStr,
    ),
    // Meta interna — não existe na API; preenchida pelo cadastro/mock no front.
    expectedMonthEnergyKwh: 0,
    gridSellEnergyKwh: num(record.gridSellTodayEnergy),
    gridPurchasedEnergyKwh: num(record.gridPurchasedTodayEnergy),
    homeLoadEnergyKwh: num(record.homeLoadTodayEnergy),
  };
}

export function mapInverterRecord(
  record: SolisInverterRecord,
): InverterTelemetry {
  const id = String(record.id ?? record.sn ?? "");
  return {
    id,
    plantId: String(record.stationId ?? ""),
    serialNumber: record.sn ?? id,
    state: mapState(record.state),
    currentPowerKw: toKw(num(record.pac), record.pacStr),
    todayEnergyKwh: toKwh(num(record.etoday), record.etodayStr),
    totalEnergyKwh: toKwh(num(record.etotal), record.etotalStr),
    temperatureC: num(record.inverterTemperature ?? record.temperature),
    lastUpdate: formatTimestamp(record.dataTimestamp ?? record.updateDate),
  };
}

export type GenerationPoint = {
  label: string;
  value: number;
  money: number | null;
};

/** stationDay → curva de potência (kW) por horário. `power` vem em W. */
export function mapStationDay(records: SolisSeriesRecord[]): GenerationPoint[] {
  return records.map((p) => ({
    label: String(p.timeStr ?? ""),
    value: toKw(num(p.power), "W"),
    money: null,
  }));
}

// Em stationMonth/Year, `energy` (kWh) e `money` (BRL) já vêm no valor base — os
// sufixos energyStr/moneyStr ("MWh"/"K BRL") são apenas unidade de exibição da
// Solis (com energyPec/moneyPec). Não converter aqui.
export function mapStationMonth(records: SolisSeriesRecord[]): GenerationPoint[] {
  return records.map((p) => ({
    label: String(p.dateStr ?? "").slice(-2),
    value: num(p.energy),
    money: p.money != null ? num(p.money) : null,
  }));
}

export function mapStationYear(records: SolisSeriesRecord[]): GenerationPoint[] {
  return records.map((p) => ({
    label: String(p.dateStr ?? "").slice(-2),
    value: num(p.energy),
    money: p.money != null ? num(p.money) : null,
  }));
}

export function mapAlarmRecord(record: SolisAlarmRecord): SolisAlarm {
  const id = String(record.id ?? record.alarmId ?? record.alarmCode ?? "");
  return {
    id,
    plantId: String(record.stationId ?? ""),
    deviceSerialNumber:
      record.alarmDeviceSn ?? record.deviceSn ?? record.sn ?? "",
    level: mapAlarmLevel(record.alarmLevel),
    message: record.alarmMsg ?? record.alarmName ?? record.alarmCode ?? "Alarme",
    startedAt: formatTimestamp(record.alarmBegTime),
    status: mapAlarmStatus(record.state),
  };
}
