// Tipos do domínio SolisCloud — compartilhados entre os dados mock e os dados
// reais vindos da API (via route handlers internos). Manter o mesmo contrato
// faz com que a UI não mude ao trocar a fonte de dados.

export type AlarmLevel = "critico" | "alto" | "medio" | "baixo";

export type DeviceState = "online" | "offline" | "alarm";

export type SolisTelemetry = {
  plantId: string;
  stationId: string;
  /** Nome da estação vindo da SolisCloud (preenchido nos dados reais). */
  stationName?: string;
  updateTime: string;
  state: DeviceState;
  currentPowerKw: number;
  dayEnergyKwh: number;
  monthEnergyKwh: number;
  yearEnergyKwh: number;
  allEnergyKwh: number;
  /** Meta interna (não existe na API SolisCloud) — vem do cadastro/mock. */
  expectedMonthEnergyKwh: number;
  gridSellEnergyKwh: number;
  gridPurchasedEnergyKwh: number;
  homeLoadEnergyKwh: number;
};

export type InverterTelemetry = {
  id: string;
  plantId: string;
  serialNumber: string;
  state: DeviceState;
  currentPowerKw: number;
  todayEnergyKwh: number;
  totalEnergyKwh: number;
  temperatureC: number;
  lastUpdate: string;
};

// Coletor (datalogger) — monitor de comunicação para O&M.
export type Collector = {
  sn: string;
  plantId: string;
  state: DeviceState; // online | offline | alarm
  updateTime: string;
  model: string | null;
};

export type CollectorMonitor = {
  resumo: { total: number; online: number; offline: number; alarme: number };
  coletores: Collector[];
};

export type SolisAlarm = {
  id: string;
  plantId: string;
  deviceSerialNumber: string;
  level: AlarmLevel;
  message: string;
  startedAt: string;
  status: "aberto" | "em-tratativa" | "resolvido";
};
