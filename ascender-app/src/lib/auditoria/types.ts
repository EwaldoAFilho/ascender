// Tipos do Validador de Rateio/Faturas — Fase 1 (somente leitura/diagnóstico).
// Nenhuma escrita no banco nesta fase; o relatório é montado em memória.

export type Severidade = "critica" | "alta" | "media" | "info";

export type EntidadeAlvo = "uc" | "usina" | "cliente" | "fatura" | "rateio";

/** Um achado de auditoria (validação ou diagnóstico do otimizador). */
export type Finding = {
  /** Identificador da regra, ex.: "fatura_duplicada", "uc_sem_rateio". */
  regra: string;
  severidade: Severidade;
  entidade: EntidadeAlvo;
  /** Referência legível da entidade (código da UC, nome da usina, documento…). */
  entidadeRef: string;
  competencia: string | null;
  titulo: string;
  /** Valores observados × esperados, para auditoria humana. */
  detalhe: Record<string, unknown>;
  /** R$ estimado (0 quando não estimável com os dados atuais). */
  impactoFinanceiro: number;
};

/** Escala inferida do campo `percentual` do rateio (a confirmar empiricamente). */
export type EscalaPercentual = "fracao_0_1" | "percentual_0_100" | "indefinida";

export type DiagnosticoDados = {
  rateios: number;
  faturas: number;
  ucsCadastradas: number;
  competenciaRateioRecente: string | null;
  competenciaFaturaRecente: string | null;
  percentual: {
    min: number;
    max: number;
    media: number;
    escala: EscalaPercentual;
    /** Multiplicador para converter o valor armazenado em base 0–100. */
    fatorPara100: number;
  };
  juncao: {
    rateioInstalacoes: number;
    rateioComUc: number;
    rateioJoinPct: number;
    faturaInstalacoes: number;
    faturaComUc: number;
    faturaJoinPct: number;
    rateioDocumentos: number;
    rateioComCliente: number;
    documentoJoinPct: number;
  };
};

export type AuditReport = {
  geradoEm: string;
  /** Tarifa de referência (R$/kWh) usada nas estimativas de impacto. */
  tarifaRef: number;
  diagnostico: DiagnosticoDados;
  findings: Finding[];
};

/** Opções das regras puras (calibráveis sem tocar no código). */
export type RegrasOpts = {
  /** Converte o `percentual` armazenado para base 0–100. */
  fatorPercentualPara100: number;
  /** Tolerância (em pontos 0–100) para a soma de percentuais ≈ 100. */
  tolPercentual: number;
  /** Tarifa de referência (R$/kWh) para estimar impacto financeiro. */
  tarifaRef: number;
  /** Múltiplo de consumo acima do qual o crédito é considerado excessivo. */
  fatorCreditoExcessivo: number;
  /** Mínimo de competências para avaliar tendência de "crédito parado". */
  minCompetenciasTendencia: number;
  /** Meses até o crédito SCEE expirar (ANEEL). Excedente além disso = risco real. */
  mesesExpiracaoScee: number;
  /** Tolerância (pontos percentuais) p/ desconto efetivo < contratado. */
  tolDescontoPct: number;
  /** Tolerância (R$) p/ a cobrança fechar (total vs esperado). */
  tolCobrancaBrl: number;
};

export const REGRAS_OPTS_PADRAO: RegrasOpts = {
  fatorPercentualPara100: 1,
  tolPercentual: 1,
  tarifaRef: 0.98,
  fatorCreditoExcessivo: 3,
  minCompetenciasTendencia: 3,
  mesesExpiracaoScee: 60,
  tolDescontoPct: 2,
  tolCobrancaBrl: 1,
};
