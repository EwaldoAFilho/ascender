// Tipos do gerador de propostas fotovoltaicas.
// A matemática foi portada do gerador estático (Moreira Camargo Eng.) para
// rodar no servidor — assim custo e margem nunca chegam ao navegador do cliente.

// Parâmetros de custo/margem (definição client-safe — apenas tipos, sem código
// de servidor; os valores/defaults e o carregamento do banco ficam em
// `parametros.ts`, que é server-only).
export type FaixaKit = {
  kwpMax: number;
  precoMicro: number; // R$/kWp
  precoString: number; // R$/kWp
  trifasicoObrigatorio: boolean;
};

export type ParametrosProposta = {
  kit: FaixaKit[];
  ajusteString: number;
  ajusteMicro: number;
  maoDeObraKwp: number;
  materialAcKwp: number;
  materialAcMin: number;
  impostoPercent: number;
  margemPercent: number;
  margemPercentRentavel: number;
  soloDescontoKitKwp: number;
  estruturaSoloPorModulo: number;
  dataTabela: string;
};

export type Inversor = "string" | "micro";
export type InversorForcado = "auto" | Inversor;
export type Instalacao = "telhado" | "solo";
export type ModuloWp = 620 | 700;
export type Cenario = "necessario" | "rentavel";

// Um telhado disponível (dimensões em metros + fator de aproveitamento %).
export type TelhadoInput = {
  largura: number;
  comprimento: number;
  aproveitamento: number; // %
};

// Entrada de engenharia/consumo do gerador (sem dados de custo).
export type GeradorInput = {
  instalacao: Instalacao;
  moduloWp: ModuloWp;
  inversorForcado: InversorForcado;
  consumoKwh: number;
  compensacaoPct: number; // 1.0, 0.9, 0.8, 1.1
  hsp: number;
  tarifa: number; // R$/kWh com impostos
  telhados: TelhadoInput[];
  adequacaoTrifasica: boolean;
  adequacaoValor: number; // 3500 | 6000 | 8000
};

// Resultado do empacotamento de um telhado.
export type TelhadoResultado = {
  modulos: number;
  potenciaKwp: number;
  areaM2: number;
  ocupacaoPct: number;
  orientacao: "Retrato" | "Paisagem";
};

// Inversor dimensionado.
export type InversorResultado = {
  tipo: Inversor;
  quantidade: number;
  potenciaKw: number;
  disjuntorA: number;
  label: string;
  disjuntor: string;
};

// Detalhamento de custo — SENSÍVEL. Só existe no servidor; nunca vai ao PDF do
// cliente nem ao bundle do navegador.
export type CustoDetalhado = {
  kit: number;
  estruturaSolo: number;
  maoDeObra: number;
  materiaisAc: number;
  adequacao: number;
  baseImposto: number;
  imposto: number;
  custoTotal: number;
  margemValor: number;
  margemPercent: number; // % sobre preço final
  precoPorKwpBase: number; // R$/kWp do kit
};

// Resultado de um cenário (Sistema Necessário ou Telhado Rentável).
export type CenarioResultado = {
  cenario: Cenario;
  potenciaKwp: number;
  qtdModulos: number;
  moduloWp: ModuloWp;
  geracaoMensalKwh: number;
  geracaoAnualKwh: number;
  inversor: InversorResultado;
  precoFinal: number;
  precoPorKwp: number;
  paybackAnos: number;
  tirPercent: number;
  economia25Anos: number;
  co2Toneladas: number;
  // Necessário: economia mensal; Rentável: receita mensal (economia + crédito).
  retornoMensal: number;
  excedenteKwh: number; // só faz sentido no rentável
  creditoExcedente: number; // R$/mês
  geracaoMensalPorMes: number[]; // 12 meses (curva sazonal)
  projecao25Anos: ProjecaoAno[];
  custo: CustoDetalhado; // SENSÍVEL — remover antes de expor ao cliente
};

export type ProjecaoAno = {
  ano: number;
  acumuladoRetorno: number; // economia/receita acumulada
  retornoLiquido: number; // acumulado − investimento
};

// Resultado completo do gerador.
export type GeradorResultado = {
  necessario: CenarioResultado;
  rentavel: CenarioResultado | null;
  telhados: TelhadoResultado[];
  telhadoTotalModulos: number;
  telhadoTotalKwp: number;
  // Alertas derivados (telhado suficiente?, trifásico obrigatório?, etc.)
  telhadoSuficiente: boolean | null;
  trifasicoObrigatorio: boolean;
  microForcado: boolean;
};
