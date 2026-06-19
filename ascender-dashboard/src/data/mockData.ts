export type PlantStatus = "ativa" | "atencao" | "inativa";
export type InvoiceStatus = "aguardando" | "pago" | "vencido" | "parcelado" | "negativado";
export type SourceStatus = "mock" | "pendente-validacao" | "importado-para-analise";
export type AlarmLevel = "critico" | "alto" | "medio" | "baixo";
export type EndpointStatus = "mockado" | "mapeado" | "pendente-credencial";

export type Plant = {
  id: string;
  name: string;
  digitalGridCode?: string;
  solisStationId?: string;
  distributor: string;
  capacityKwp: number;
  status: PlantStatus;
};

export type Customer = {
  id: string;
  name: string;
  documentMasked: string;
  type: "cliente" | "prosumidor" | "investidor";
  status: "ativo" | "inativo";
};

export type ConsumerUnit = {
  id: string;
  customerId: string;
  installationCode: string;
  distributor: string;
  averageConsumptionKwh: number;
};

export type GenerationReading = {
  id: string;
  plantId: string;
  month: string;
  generationKwh: number;
  compensatedKwh?: number;
  source: "planilha" | "soliscloud" | "digital-grid";
};

export type Invoice = {
  id: string;
  customerId: string;
  consumerUnitId: string;
  plantId: string;
  month: string;
  invoiceAmount: number;
  billetAmount: number;
  dueDate: string;
  status: InvoiceStatus;
};

export type Proposal = {
  id: string;
  customerId: string;
  consumerUnitId: string;
  distributor: string;
  estimatedConsumptionKwh: number;
  distributorTariff: number;
  ascenderTariff: number;
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  status: "simulacao" | "em-analise" | "aprovada";
};

export type Integration = {
  id: string;
  name: string;
  status: SourceStatus;
  description: string;
};

export type SolisTelemetry = {
  plantId: string;
  stationId: string;
  updateTime: string;
  state: "online" | "offline" | "alarm";
  currentPowerKw: number;
  dayEnergyKwh: number;
  monthEnergyKwh: number;
  yearEnergyKwh: number;
  allEnergyKwh: number;
  expectedMonthEnergyKwh: number;
  gridSellEnergyKwh: number;
  gridPurchasedEnergyKwh: number;
  homeLoadEnergyKwh: number;
};

export type InverterTelemetry = {
  id: string;
  plantId: string;
  serialNumber: string;
  state: "online" | "offline" | "alarm";
  currentPowerKw: number;
  todayEnergyKwh: number;
  totalEnergyKwh: number;
  temperatureC: number;
  lastUpdate: string;
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

export type AllocationRow = {
  id: string;
  month: string;
  plantId: string;
  customerId: string;
  consumerUnitId: string;
  consumptionKwh: number;
  allocatedKwh: number;
  balanceKwh: number;
  allocationPercent: number;
};

export type SolisApiEndpoint = {
  id: string;
  method: "POST";
  path: string;
  dashboardUse: string;
  mappedFields: string[];
  status: EndpointStatus;
};

export const plants: Plant[] = [
  {
    id: "usina-ascender-01",
    name: "ASCENDER 01",
    digitalGridCode: "1357213",
    solisStationId: "mock-station-ascender-01",
    distributor: "Neoenergia",
    capacityKwp: 75,
    status: "ativa",
  },
  {
    id: "usina-morumbi",
    name: "MORUMBI",
    digitalGridCode: "845590",
    solisStationId: "mock-station-morumbi",
    distributor: "Neoenergia",
    capacityKwp: 60,
    status: "ativa",
  },
  {
    id: "usina-encontro",
    name: "USINA ENCONTRO DAS AGUAS GO",
    digitalGridCode: "431764001222",
    solisStationId: "mock-station-encontro",
    distributor: "Equatorial GO",
    capacityKwp: 90,
    status: "atencao",
  },
  {
    id: "usina-vitor",
    name: "USINA VITOR",
    digitalGridCode: "743102",
    solisStationId: "mock-station-vitor",
    distributor: "Neoenergia",
    capacityKwp: 55,
    status: "ativa",
  },
  {
    id: "usina-vivendas",
    name: "USINA VIVENDAS DO CAMPO",
    digitalGridCode: "431107101247",
    solisStationId: "mock-station-vivendas",
    distributor: "Neoenergia",
    capacityKwp: 65,
    status: "ativa",
  },
];

export const customers: Customer[] = [
  {
    id: "cliente-tt-burger",
    name: "TT BURGER",
    documentMasked: "***.***.***/0001-**",
    type: "prosumidor",
    status: "ativo",
  },
  {
    id: "cliente-fernando-guimaraes",
    name: "FERNANDO GUIMARAES",
    documentMasked: "***.***.***-**",
    type: "prosumidor",
    status: "ativo",
  },
  {
    id: "cliente-condominio-real-versatile",
    name: "CONDOMINIO REAL VERSATILE",
    documentMasked: "***.***.***/0001-**",
    type: "cliente",
    status: "ativo",
  },
  {
    id: "cliente-alvarenga",
    name: "ALVARENGA SANTA MARIA",
    documentMasked: "***.***.***/0001-**",
    type: "cliente",
    status: "ativo",
  },
];

export const consumerUnits: ConsumerUnit[] = [
  {
    id: "uc-32903",
    customerId: "cliente-tt-burger",
    installationCode: "32903",
    distributor: "CEMIG",
    averageConsumptionKwh: 6550,
  },
  {
    id: "uc-616324",
    customerId: "cliente-fernando-guimaraes",
    installationCode: "616324",
    distributor: "CEMIG",
    averageConsumptionKwh: 1271,
  },
  {
    id: "uc-1291385",
    customerId: "cliente-condominio-real-versatile",
    installationCode: "1291385",
    distributor: "CEMIG",
    averageConsumptionKwh: 11548,
  },
  {
    id: "uc-333864101250",
    customerId: "cliente-alvarenga",
    installationCode: "3.338.641.012-50",
    distributor: "CEMIG",
    averageConsumptionKwh: 8200,
  },
];

export const generationReadings: GenerationReading[] = [
  { id: "g-asc-2026-01", plantId: "usina-ascender-01", month: "2026-01", generationKwh: 11569, source: "planilha" },
  { id: "g-asc-2026-02", plantId: "usina-ascender-01", month: "2026-02", generationKwh: 11116, source: "planilha" },
  { id: "g-asc-2026-03", plantId: "usina-ascender-01", month: "2026-03", generationKwh: 12011, source: "planilha" },
  { id: "g-asc-2026-04", plantId: "usina-ascender-01", month: "2026-04", generationKwh: 12262, source: "soliscloud" },
  { id: "g-mor-2026-01", plantId: "usina-morumbi", month: "2026-01", generationKwh: 13204, source: "planilha" },
  { id: "g-mor-2026-02", plantId: "usina-morumbi", month: "2026-02", generationKwh: 10137.93, source: "soliscloud" },
  { id: "g-mor-2026-03", plantId: "usina-morumbi", month: "2026-03", generationKwh: 14996.55, source: "planilha" },
  { id: "g-mor-2026-04", plantId: "usina-morumbi", month: "2026-04", generationKwh: 14320, source: "soliscloud" },
  { id: "g-enc-2026-01", plantId: "usina-encontro", month: "2026-01", generationKwh: 10137.93, source: "planilha" },
  { id: "g-enc-2026-02", plantId: "usina-encontro", month: "2026-02", generationKwh: 8460, source: "soliscloud" },
  { id: "g-vit-2026-04", plantId: "usina-vitor", month: "2026-04", generationKwh: 12130, source: "planilha" },
  { id: "g-viv-2026-04", plantId: "usina-vivendas", month: "2026-04", generationKwh: 13371, source: "planilha" },
];

export const invoices: Invoice[] = [
  {
    id: "fat-747698",
    customerId: "cliente-tt-burger",
    consumerUnitId: "uc-32903",
    plantId: "usina-ascender-01",
    month: "2026-04",
    invoiceAmount: 3542.37,
    billetAmount: 4932.53,
    dueDate: "2026-05-02",
    status: "aguardando",
  },
  {
    id: "fat-776105",
    customerId: "cliente-fernando-guimaraes",
    consumerUnitId: "uc-616324",
    plantId: "usina-ascender-01",
    month: "2026-04",
    invoiceAmount: 880.49,
    billetAmount: 1395.23,
    dueDate: "2026-05-08",
    status: "aguardando",
  },
  {
    id: "fat-745192",
    customerId: "cliente-condominio-real-versatile",
    consumerUnitId: "uc-1291385",
    plantId: "usina-ascender-01",
    month: "2026-04",
    invoiceAmount: 7517.58,
    billetAmount: 9706.24,
    dueDate: "2026-05-10",
    status: "aguardando",
  },
  {
    id: "fat-768407",
    customerId: "cliente-alvarenga",
    consumerUnitId: "uc-333864101250",
    plantId: "usina-encontro",
    month: "2026-04",
    invoiceAmount: 3821.58,
    billetAmount: 5140.53,
    dueDate: "2026-05-04",
    status: "vencido",
  },
  {
    id: "fat-762659",
    customerId: "cliente-fernando-guimaraes",
    consumerUnitId: "uc-616324",
    plantId: "usina-morumbi",
    month: "2026-03",
    invoiceAmount: 115.84,
    billetAmount: 170.18,
    dueDate: "2026-04-03",
    status: "pago",
  },
];

export const proposals: Proposal[] = [
  {
    id: "prop-mock-001",
    customerId: "cliente-fernando-guimaraes",
    consumerUnitId: "uc-616324",
    distributor: "Neoenergia",
    estimatedConsumptionKwh: 1271,
    distributorTariff: 1.07,
    ascenderTariff: 0.856,
    estimatedMonthlySavings: 272,
    estimatedYearlySavings: 3264,
    status: "simulacao",
  },
  {
    id: "prop-mock-002",
    customerId: "cliente-condominio-real-versatile",
    consumerUnitId: "uc-1291385",
    distributor: "Neoenergia",
    estimatedConsumptionKwh: 11548,
    distributorTariff: 1.02,
    ascenderTariff: 0.78,
    estimatedMonthlySavings: 2771.52,
    estimatedYearlySavings: 33258.24,
    status: "em-analise",
  },
];

export const integrations: Integration[] = [
  {
    id: "soliscloud",
    name: "SolisCloud",
    status: "mock",
    description: "Fonte tecnica para geracao, inversores, alarmes e disponibilidade.",
  },
  {
    id: "digital-grid",
    name: "Digital Grid",
    status: "pendente-validacao",
    description: "Fonte comercial/financeira para faturas, pagamentos, consumo e rateio.",
  },
  {
    id: "planilha-controle-usinas",
    name: "Controle de Usinas",
    status: "importado-para-analise",
    description: "Planilha operacional usada diariamente pela ASCENDER.",
  },
];

export const solisTelemetries: SolisTelemetry[] = [
  {
    plantId: "usina-ascender-01",
    stationId: "mock-station-ascender-01",
    updateTime: "2026-04-30 18:20",
    state: "online",
    currentPowerKw: 42.7,
    dayEnergyKwh: 318.4,
    monthEnergyKwh: 12262,
    yearEnergyKwh: 46958,
    allEnergyKwh: 289140,
    expectedMonthEnergyKwh: 11800,
    gridSellEnergyKwh: 11180,
    gridPurchasedEnergyKwh: 420,
    homeLoadEnergyKwh: 760,
  },
  {
    plantId: "usina-morumbi",
    stationId: "mock-station-morumbi",
    updateTime: "2026-04-30 18:18",
    state: "online",
    currentPowerKw: 33.1,
    dayEnergyKwh: 284.9,
    monthEnergyKwh: 14320,
    yearEnergyKwh: 52659,
    allEnergyKwh: 311908,
    expectedMonthEnergyKwh: 12800,
    gridSellEnergyKwh: 13040,
    gridPurchasedEnergyKwh: 315,
    homeLoadEnergyKwh: 965,
  },
  {
    plantId: "usina-encontro",
    stationId: "mock-station-encontro",
    updateTime: "2026-04-30 17:55",
    state: "alarm",
    currentPowerKw: 18.4,
    dayEnergyKwh: 171.2,
    monthEnergyKwh: 8460,
    yearEnergyKwh: 33821,
    allEnergyKwh: 201774,
    expectedMonthEnergyKwh: 10500,
    gridSellEnergyKwh: 7804,
    gridPurchasedEnergyKwh: 690,
    homeLoadEnergyKwh: 430,
  },
  {
    plantId: "usina-vitor",
    stationId: "mock-station-vitor",
    updateTime: "2026-04-30 18:12",
    state: "online",
    currentPowerKw: 27.2,
    dayEnergyKwh: 246.7,
    monthEnergyKwh: 12130,
    yearEnergyKwh: 42120,
    allEnergyKwh: 176430,
    expectedMonthEnergyKwh: 11200,
    gridSellEnergyKwh: 10940,
    gridPurchasedEnergyKwh: 280,
    homeLoadEnergyKwh: 610,
  },
  {
    plantId: "usina-vivendas",
    stationId: "mock-station-vivendas",
    updateTime: "2026-04-30 18:09",
    state: "online",
    currentPowerKw: 31.8,
    dayEnergyKwh: 260.3,
    monthEnergyKwh: 13371,
    yearEnergyKwh: 44890,
    allEnergyKwh: 194202,
    expectedMonthEnergyKwh: 12400,
    gridSellEnergyKwh: 12020,
    gridPurchasedEnergyKwh: 340,
    homeLoadEnergyKwh: 720,
  },
];

export const inverterTelemetries: InverterTelemetry[] = [
  {
    id: "inv-asc-01",
    plantId: "usina-ascender-01",
    serialNumber: "ASC-INV-001",
    state: "online",
    currentPowerKw: 21.4,
    todayEnergyKwh: 158.2,
    totalEnergyKwh: 142320,
    temperatureC: 48.1,
    lastUpdate: "2026-04-30 18:20",
  },
  {
    id: "inv-asc-02",
    plantId: "usina-ascender-01",
    serialNumber: "ASC-INV-002",
    state: "online",
    currentPowerKw: 21.3,
    todayEnergyKwh: 160.2,
    totalEnergyKwh: 146820,
    temperatureC: 47.4,
    lastUpdate: "2026-04-30 18:20",
  },
  {
    id: "inv-mor-01",
    plantId: "usina-morumbi",
    serialNumber: "MOR-INV-001",
    state: "online",
    currentPowerKw: 33.1,
    todayEnergyKwh: 284.9,
    totalEnergyKwh: 311908,
    temperatureC: 49.7,
    lastUpdate: "2026-04-30 18:18",
  },
  {
    id: "inv-enc-01",
    plantId: "usina-encontro",
    serialNumber: "ENC-INV-001",
    state: "alarm",
    currentPowerKw: 18.4,
    todayEnergyKwh: 171.2,
    totalEnergyKwh: 201774,
    temperatureC: 63.5,
    lastUpdate: "2026-04-30 17:55",
  },
];

export const solisAlarms: SolisAlarm[] = [
  {
    id: "alarm-enc-temp",
    plantId: "usina-encontro",
    deviceSerialNumber: "ENC-INV-001",
    level: "alto",
    message: "Temperatura do inversor acima da faixa operacional esperada",
    startedAt: "2026-04-30 16:42",
    status: "em-tratativa",
  },
  {
    id: "alarm-enc-geracao",
    plantId: "usina-encontro",
    deviceSerialNumber: "ENC-INV-001",
    level: "medio",
    message: "Geracao diaria abaixo da curva historica",
    startedAt: "2026-04-30 15:10",
    status: "aberto",
  },
];

export const allocationRows: AllocationRow[] = [
  {
    id: "rateio-001",
    month: "2026-04",
    plantId: "usina-ascender-01",
    customerId: "cliente-tt-burger",
    consumerUnitId: "uc-32903",
    consumptionKwh: 6550,
    allocatedKwh: 6110,
    balanceKwh: -440,
    allocationPercent: 27,
  },
  {
    id: "rateio-002",
    month: "2026-04",
    plantId: "usina-ascender-01",
    customerId: "cliente-fernando-guimaraes",
    consumerUnitId: "uc-616324",
    consumptionKwh: 1271,
    allocatedKwh: 1390,
    balanceKwh: 119,
    allocationPercent: 6,
  },
  {
    id: "rateio-003",
    month: "2026-04",
    plantId: "usina-ascender-01",
    customerId: "cliente-condominio-real-versatile",
    consumerUnitId: "uc-1291385",
    consumptionKwh: 11548,
    allocatedKwh: 10450,
    balanceKwh: -1098,
    allocationPercent: 46,
  },
  {
    id: "rateio-004",
    month: "2026-04",
    plantId: "usina-encontro",
    customerId: "cliente-alvarenga",
    consumerUnitId: "uc-333864101250",
    consumptionKwh: 8200,
    allocatedKwh: 7540,
    balanceKwh: -660,
    allocationPercent: 35,
  },
];

export const solisApiEndpoints: SolisApiEndpoint[] = [
  {
    id: "station-list",
    method: "POST",
    path: "/v1/api/userStationList",
    dashboardUse: "Cadastro e reconciliacao das usinas monitoradas",
    mappedFields: ["stationId", "stationName", "capacity", "state"],
    status: "mapeado",
  },
  {
    id: "station-detail",
    method: "POST",
    path: "/v1/api/stationDetail",
    dashboardUse: "KPIs operacionais e saude da usina",
    mappedFields: ["dayEnergy", "monthEnergy", "allEnergy", "power", "updateTime"],
    status: "mockado",
  },
  {
    id: "station-day",
    method: "POST",
    path: "/v1/api/stationDay",
    dashboardUse: "Curva diaria e comparativo geracao esperada x realizada",
    mappedFields: ["date", "energy", "power"],
    status: "mockado",
  },
  {
    id: "inverter-list",
    method: "POST",
    path: "/v1/api/inverterList",
    dashboardUse: "Inventario tecnico por usina",
    mappedFields: ["sn", "state", "pac", "eToday", "eTotal"],
    status: "mockado",
  },
  {
    id: "alarm-list",
    method: "POST",
    path: "/v1/api/alarmList",
    dashboardUse: "Fila de alertas e acionamento de O&M",
    mappedFields: ["deviceSn", "alarmName", "alarmLevel", "alarmTime"],
    status: "pendente-credencial",
  },
];

export const dashboardIdeas = [
  {
    id: "executivo",
    title: "Executivo",
    goal: "Consolidar geracao, faturamento, inadimplencia e economia em uma visao de diretoria.",
    source: "Planilha + Digital Grid + SolisCloud",
    priority: "P1",
  },
  {
    id: "usinas",
    title: "Performance de Usinas",
    goal: "Comparar geracao esperada, geracao real, disponibilidade, alarmes e receita liquida por usina.",
    source: "SolisCloud + planilha",
    priority: "P1",
  },
  {
    id: "financeiro",
    title: "Financeiro e Cobranca",
    goal: "Acompanhar faturas por status, vencimentos, total faturado, pago e em aberto.",
    source: "Digital Grid + extrato",
    priority: "P1",
  },
  {
    id: "rateio",
    title: "Rateio e Compensacao",
    goal: "Validar energia rateada, consumo, saldo, sobra/deficit e divergencias por UC.",
    source: "Planilha + Digital Grid",
    priority: "P2",
  },
  {
    id: "propostas",
    title: "Propostas Comerciais",
    goal: "Simular economia, tarifa ASCENDER, tarifa distribuidora e potencial comercial por cliente.",
    source: "Planilha + regras comerciais",
    priority: "P2",
  },
  {
    id: "integracoes",
    title: "Saude das Integracoes",
    goal: "Monitorar ultima sincronizacao, fonte dos dados e pendencias de API/exportacao.",
    source: "SolisCloud + Digital Grid + importador Excel",
    priority: "P3",
  },
];

export const dataModel = {
  plants,
  customers,
  consumerUnits,
  generationReadings,
  invoices,
  proposals,
  integrations,
  solisTelemetries,
  inverterTelemetries,
  solisAlarms,
  allocationRows,
  solisApiEndpoints,
  dashboardIdeas,
};
