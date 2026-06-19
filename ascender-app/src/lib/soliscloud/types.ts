// Tipos parciais e tolerantes das respostas da SolisCloud. A API tem dezenas de
// campos e variações de nomes; declaramos apenas o que consumimos, todos
// opcionais, e o mapper trata ausências e nomes alternativos.

export type SolisEnvelope<T> = {
  success?: boolean;
  code?: string | number;
  msg?: string;
  data?: T;
};

export type SolisStationRecord = {
  id?: string | number;
  stationId?: string | number;
  sno?: string;
  name?: string;
  stationName?: string;
  capacity?: number;
  capacityStr?: string;
  state?: number | string;
  power?: number;
  powerStr?: string;
  pac?: number;
  pacStr?: string;
  dayEnergy?: number;
  dayEnergyStr?: string;
  etoday?: number;
  monthEnergy?: number;
  monthEnergyStr?: string;
  yearEnergy?: number;
  yearEnergyStr?: string;
  allEnergy?: number;
  allEnergyStr?: string;
  etotal?: number;
  gridSellTodayEnergy?: number;
  gridPurchasedTodayEnergy?: number;
  homeLoadTodayEnergy?: number;
  dataTimestamp?: string | number;
  updateDate?: string;
};

export type SolisInverterRecord = {
  id?: string | number;
  sn?: string;
  stationId?: string | number;
  state?: number | string;
  pac?: number;
  pacStr?: string;
  etoday?: number;
  etodayStr?: string;
  etotal?: number;
  etotalStr?: string;
  inverterTemperature?: number;
  temperature?: number;
  dataTimestamp?: string | number;
  updateDate?: string;
};

export type SolisAlarmRecord = {
  id?: string | number;
  alarmId?: string | number;
  stationId?: string | number;
  alarmDeviceSn?: string;
  deviceSn?: string;
  sn?: string;
  alarmCode?: string;
  alarmLevel?: number | string;
  alarmMsg?: string;
  alarmName?: string;
  alarmBegTime?: string | number;
  state?: number | string;
};

// Séries temporais (stationDay/Month/Year): array direto de pontos.
export type SolisSeriesRecord = {
  timeStr?: string;
  dateStr?: string;
  power?: number; // stationDay: potência instantânea em W
  energy?: number; // stationMonth/Year: energia (kWh ou MWh, ver energyStr)
  energyStr?: string;
  money?: number;
  moneyStr?: string;
};

// A SolisCloud costuma paginar em `data.page.records`, mas alguns endpoints
// retornam `data.records` ou um array direto. O extractRecords trata os casos.
export type SolisPaged<T> =
  | { page?: { records?: T[]; total?: number } }
  | { records?: T[] }
  | T[];
