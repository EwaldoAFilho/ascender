// Tipos de domínio da ASCENDER (cadastros e movimentos). Por ora alimentados
// por dados mock; evoluem para o banco relacional em fases futuras.

export type PlantStatus = "ativa" | "atencao" | "inativa";
export type InvoiceStatus =
  | "aguardando"
  | "pago"
  | "vencido"
  | "parcelado"
  | "negativado";
export type SourceStatus =
  | "mock"
  | "pendente-validacao"
  | "importado-para-analise";
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
