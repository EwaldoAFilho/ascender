import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ===== Integrações / configurações (já existentes) =====

// Credenciais de integração (cifradas). `provider` é único: uma credencial por
// fonte. Extensível para outras integrações (ex.: 'digital_grid') no futuro.
export const integrationCredentials = pgTable("integration_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().unique(),
  keyId: text("key_id").notNull(),
  // AES-256-GCM: "base64(iv):base64(tag):base64(ciphertext)".
  keySecretEnc: text("key_secret_enc").notNull(),
  baseUrl: text("base_url")
    .notNull()
    .default("https://www.soliscloud.com:13333"),
  isActive: boolean("is_active").notNull().default(true),
  lastTestAt: timestamp("last_test_at", { withTimezone: true }),
  lastTestOk: boolean("last_test_ok"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Configurações chave/valor. No MVP: 'login_email' e 'login_password_hash'.
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Usuários da aplicação (multiusuário; todos com acesso total nesta fase).
export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== Cadastros-mestre (alimentados manualmente; base do modelo relacional) =====

export const distribuidoras = pgTable("distribuidoras", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  uf: text("uf"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  documento: text("documento").notNull().default(""),
  tipo: text("tipo").notNull().default("cliente"), // cliente | prosumidor | investidor
  status: text("status").notNull().default("ativo"), // ativo | inativo
  email: text("email"),
  responsavel: text("responsavel"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const unidadesConsumidoras = pgTable("unidades_consumidoras", {
  id: uuid("id").primaryKey().defaultRandom(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  codigoInstalacao: text("codigo_instalacao").notNull(),
  distribuidoraId: uuid("distribuidora_id").references(
    () => distribuidoras.id,
    { onDelete: "set null" },
  ),
  consumoMedioKwh: doublePrecision("consumo_medio_kwh").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usinas = pgTable("usinas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  codigoDigitalGrid: text("codigo_digital_grid"),
  // Chave de vínculo com a SolisCloud (stationId real).
  stationIdSoliscloud: text("station_id_soliscloud"),
  distribuidoraId: uuid("distribuidora_id").references(
    () => distribuidoras.id,
    { onDelete: "set null" },
  ),
  potenciaKwp: doublePrecision("potencia_kwp").notNull().default(0),
  // Meta de geração mensal (a API SolisCloud não fornece o "esperado").
  geracaoEsperadaKwhMes: doublePrecision("geracao_esperada_kwh_mes")
    .notNull()
    .default(0),
  status: text("status").notNull().default("ativa"), // ativa | atencao | inativa
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contratos = pgTable("contratos", {
  id: uuid("id").primaryKey().defaultRandom(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  unidadeConsumidoraId: uuid("unidade_consumidora_id").references(
    () => unidadesConsumidoras.id,
    { onDelete: "set null" },
  ),
  usinaId: uuid("usina_id").references(() => usinas.id, {
    onDelete: "set null",
  }),
  tarifaDistribuidora: doublePrecision("tarifa_distribuidora")
    .notNull()
    .default(0),
  tarifaAscender: doublePrecision("tarifa_ascender").notNull().default(0),
  percentualDesconto: doublePrecision("percentual_desconto")
    .notNull()
    .default(0),
  status: text("status").notNull().default("simulacao"), // simulacao | em-analise | ativo
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Faturas (lançamento manual enquanto não há integração com o Digital Grid).
export const faturas = pgTable("faturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  clienteId: uuid("cliente_id").references(() => clientes.id, {
    onDelete: "set null",
  }),
  unidadeConsumidoraId: uuid("unidade_consumidora_id").references(
    () => unidadesConsumidoras.id,
    { onDelete: "set null" },
  ),
  usinaId: uuid("usina_id").references(() => usinas.id, {
    onDelete: "set null",
  }),
  competencia: text("competencia").notNull().default(""), // ex.: "2026-06"
  valorFatura: doublePrecision("valor_fatura").notNull().default(0),
  valorBoleto: doublePrecision("valor_boleto").notNull().default(0),
  vencimento: text("vencimento"), // "YYYY-MM-DD"
  status: text("status").notNull().default("aguardando"), // aguardando|pago|vencido|parcelado|negativado
  pagoEm: text("pago_em"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Histórico mensal de geração por usina (sincronizado da SolisCloud).
export const medicoesGeracao = pgTable(
  "medicoes_geracao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usinaId: uuid("usina_id")
      .notNull()
      .references(() => usinas.id, { onDelete: "cascade" }),
    competencia: text("competencia").notNull(), // "2026-01"
    geracaoKwh: doublePrecision("geracao_kwh").notNull().default(0),
    receita: doublePrecision("receita").notNull().default(0),
    fonte: text("fonte").notNull().default("soliscloud"),
    sincronizadoEm: timestamp("sincronizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("medicoes_geracao_usina_competencia_fonte").on(
      table.usinaId,
      table.competencia,
      table.fonte,
    ),
  ],
);

// Faturas reais sincronizadas do Digital Grid (Billing API /bills, somente leitura).
export const faturasDg = pgTable("faturas_dg", {
  id: uuid("id").primaryKey().defaultRandom(),
  dgBillId: integer("dg_bill_id").notNull().unique(), // id da fatura no Digital Grid
  competencia: text("competencia").notNull().default(""), // "2025-09"
  referenceDate: text("reference_date"), // "2025-09-01"
  faturaNumero: integer("fatura_numero"), // campo `number` (sequencial da fatura)
  installationNumber: text("installation_number"), // código da UC
  installationClass: text("installation_class"),
  paymentStatus: text("payment_status").notNull().default(""), // "Pago", "Pendente"...
  valorEnergia: doublePrecision("valor_energia").notNull().default(0), // `value`
  valorTotal: doublePrecision("valor_total").notNull().default(0), // `total_value` (cobrado)
  valorPago: doublePrecision("valor_pago").notNull().default(0), // `paid_amount`
  economia: doublePrecision("economia").notNull().default(0), // `amount_saved`
  consumoKwh: doublePrecision("consumo_kwh").notNull().default(0),
  energiaInjetadaKwh: doublePrecision("energia_injetada_kwh").notNull().default(0),
  vencimento: text("vencimento"), // "YYYY-MM-DD"
  pagoEm: text("pago_em"), // ISO
  raw: jsonb("raw"), // fatura completa do DG (p/ detalhes/PDF futuro)
  sincronizadoEm: timestamp("sincronizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Conta de energia (distribuidora) anexada a uma fatura do Digital Grid.
// O PDF é guardado em base64 no banco; os campos são extraídos do PDF.
export const contasEnergia = pgTable("contas_energia", {
  id: uuid("id").primaryKey().defaultRandom(),
  faturaDgId: uuid("fatura_dg_id")
    .notNull()
    .unique()
    .references(() => faturasDg.id, { onDelete: "cascade" }),
  installationNumber: text("installation_number"),
  competencia: text("competencia"), // "AAAA-MM"
  arquivoNome: text("arquivo_nome"),
  mimeType: text("mime_type").notNull().default("application/pdf"),
  arquivoBase64: text("arquivo_base64"), // conteúdo do PDF (base64)
  // ===== Campos extraídos do PDF =====
  cliente: text("cliente"),
  ano: integer("ano"),
  mes: integer("mes"),
  vencimento: text("vencimento"), // "AAAA-MM-DD"
  valor: doublePrecision("valor"), // normalizado (R$)
  notaFiscal: text("nota_fiscal"),
  codigoBarras: text("codigo_barras"),
  leituraAnteriorData: text("leitura_anterior_data"),
  leituraData: text("leitura_data"),
  leituraProximaData: text("leitura_proxima_data"),
  numeroDias: integer("numero_dias"),
  energiaKwh: doublePrecision("energia_kwh"),
  tributos: jsonb("tributos"), // { pis, cofins, icms }
  itensFatura: jsonb("itens_fatura"), // [{ descricao, valor }]
  aviso: text("aviso"),
  // SCEE — layout beneficiário
  sceeExcedenteKwh: doublePrecision("scee_excedente_kwh"),
  sceeCreditosKwh: doublePrecision("scee_creditos_kwh"),
  sceeSaldoProximoKwh: doublePrecision("scee_saldo_proximo_kwh"),
  // SCEE — layout gerador/consórcio
  sceeSaldoAnteriorKwh: doublePrecision("scee_saldo_anterior_kwh"),
  sceeTransfKwh: doublePrecision("scee_transf_kwh"),
  sceeInjetadoKwh: doublePrecision("scee_injetado_kwh"),
  sceeCompensadoKwh: doublePrecision("scee_compensado_kwh"),
  sceeSaldoAtualKwh: doublePrecision("scee_saldo_atual_kwh"),
  textoExtraido: text("texto_extraido"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Rateio real sincronizado do Digital Grid (Billing API /estimated-quota, somente leitura).
export const rateiosDg = pgTable(
  "rateios_dg",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    generationMonthId: integer("generation_month_id").notNull(),
    competencia: text("competencia").notNull().default(""), // "2026-06" (de monthly-generation.reference)
    generatorNumber: text("generator_number"), // número do gerador no DG
    usinaNome: text("usina_nome"), // nickname do gerador (nome da usina)
    installation: text("installation").notNull().default(""), // código da UC
    ownerName: text("owner_name"),
    ownerDocument: text("owner_document").notNull().default(""),
    percentual: doublePrecision("percentual").notNull().default(0), // `percentage`
    covering: doublePrecision("covering").notNull().default(0),
    consumoKwh: doublePrecision("consumo_kwh").notNull().default(0), // `consumption`
    creditosAcumulados: doublePrecision("creditos_acumulados").notNull().default(0), // `accumulated_credits`
    annotations: text("annotations"),
    raw: jsonb("raw"),
    sincronizadoEm: timestamp("sincronizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("rateios_dg_month_installation_owner").on(
      table.generationMonthId,
      table.installation,
      table.ownerDocument,
    ),
  ],
);

// Propostas comerciais (lançamento manual / simulador de economia).
export const propostas = pgTable("propostas", {
  id: uuid("id").primaryKey().defaultRandom(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  unidadeConsumidoraId: uuid("unidade_consumidora_id").references(
    () => unidadesConsumidoras.id,
    { onDelete: "set null" },
  ),
  distribuidoraId: uuid("distribuidora_id").references(() => distribuidoras.id, {
    onDelete: "set null",
  }),
  consumoEstimadoKwh: doublePrecision("consumo_estimado_kwh")
    .notNull()
    .default(0),
  tarifaDistribuidora: doublePrecision("tarifa_distribuidora")
    .notNull()
    .default(0),
  tarifaAscender: doublePrecision("tarifa_ascender").notNull().default(0),
  status: text("status").notNull().default("simulacao"), // simulacao|em-analise|aprovada|recusada
  observacao: text("observacao"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type IntegrationCredential = typeof integrationCredentials.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Distribuidora = typeof distribuidoras.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type UnidadeConsumidora = typeof unidadesConsumidoras.$inferSelect;
export type Usina = typeof usinas.$inferSelect;
export type Contrato = typeof contratos.$inferSelect;
export type Fatura = typeof faturas.$inferSelect;
export type FaturaDg = typeof faturasDg.$inferSelect;
export type RateioDg = typeof rateiosDg.$inferSelect;
export type ContaEnergia = typeof contasEnergia.$inferSelect;
export type MedicaoGeracao = typeof medicoesGeracao.$inferSelect;
export type Proposta = typeof propostas.$inferSelect;
