import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Binário cru (BLOB) — guarda o conteúdo dos anexos como `bytea` no Postgres.
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

// Id fixo do "tenant 0" (instância atual — Ascender). Definido cedo para servir
// de DEFAULT da coluna tenant_id em qualquer tabela abaixo.
export const TENANT0_ID = "00000000-0000-0000-0000-000000000001";

// ===== Integrações / configurações (já existentes) =====

// Credenciais de integração (cifradas). `provider` é único: uma credencial por
// fonte. Extensível para outras integrações (ex.: 'digital_grid') no futuro.
export const integrationCredentials = pgTable("integration_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Credenciais por tenant (cada integradora tem sua própria conta).
  tenantId: uuid("tenant_id")
    .notNull()
    .default(TENANT0_ID)
    .references(() => tenants.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
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
}, (t) => [
  unique("integration_credentials_tenant_provider").on(t.tenantId, t.provider),
]);

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
  // Operador da PLATAFORMA (staff da Ascender): enxerga/administra TODOS os tenants
  // no painel /plataforma. É um nível ACIMA do RBAC por-tenant (owner/admin/...).
  // Default false — quase todo usuário é de um tenant cliente, não da plataforma.
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== Multi-tenancy (SaaS) — Fase 1: fundação de identidade =====
// Tenant = empresa integradora/instaladora que assina o SaaS. A identidade do
// usuário (`usuarios.email`) é GLOBAL; o vínculo usuário↔tenant + papel (RBAC)
// fica em `tenant_memberships`. Os dados de negócio ganham `tenant_id` na próxima
// etapa. O "tenant 0" (id fixo abaixo) representa a instância atual (Ascender),
// para a qual todos os dados existentes serão atribuídos — nada é perdido.
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  // Ciclo de vida da assinatura (controla o ACESSO no login):
  //   pendente  = cadastrou, aguarda aprovação do operador (não entra)
  //   trial     = em avaliação (entra) · ativo = cliente pagante (entra)
  //   suspenso  = inadimplente/desligado (não entra) · cancelado (não entra)
  status: text("status").notNull().default("ativo"),
  plano: text("plano").notNull().default("padrao"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Um usuário pode pertencer a 1+ tenants, com um papel por tenant.
export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("operador"), // owner | admin | operador | leitura
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("tenant_memberships_tenant_user").on(t.tenantId, t.userId)],
);

// Coluna `tenant_id` das tabelas de negócio. NOT NULL com DEFAULT = tenant 0:
// o Postgres backfilla as linhas atuais e os inserts do app (ainda sem escopo)
// caem no tenant 0 — não-quebra. O DEFAULT será removido quando o escopo por
// tenant (contexto/RLS) estiver ativo. onDelete cascade habilita offboarding.
const tenantCol = () =>
  uuid("tenant_id")
    .notNull()
    .default(TENANT0_ID)
    .references(() => tenants.id, { onDelete: "cascade" });

// ===== Cadastros-mestre (alimentados manualmente; base do modelo relacional) =====

export const distribuidoras = pgTable("distribuidoras", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
  nome: text("nome").notNull(),
  uf: text("uf"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [unique("distribuidoras_tenant_nome").on(t.tenantId, t.nome)]);

export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
  nome: text("nome").notNull(),
  documento: text("documento").notNull().default(""),
  tipo: text("tipo").notNull().default("cliente"), // cliente | prosumidor | investidor
  status: text("status").notNull().default("ativo"), // ativo | inativo
  email: text("email"),
  responsavel: text("responsavel"),
  // Texto livre para anotações do cliente (manual).
  dadosAdicionais: text("dados_adicionais"),
  // Proveniência do registro: manual ou de qual integração veio.
  origem: text("origem").notNull().default("manual"), // manual | digitalgrid | soliscloud
  origemSincronizadoEm: timestamp("origem_sincronizado_em", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const unidadesConsumidoras = pgTable("unidades_consumidoras", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
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
  origem: text("origem").notNull().default("manual"), // manual | digitalgrid | soliscloud
  origemSincronizadoEm: timestamp("origem_sincronizado_em", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usinas = pgTable("usinas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
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
  // Dados cadastrais (manuais) da usina.
  endereco: text("endereco"),
  bairro: text("bairro"),
  estado: text("estado"), // UF
  cep: text("cep"),
  codigoCliente: text("codigo_cliente"),
  codigoInstalacao: text("codigo_instalacao"), // UC
  modulos: text("modulos"), // ex.: "164 × 600 W"
  inversores: text("inversores"), // ex.: "Solis 30 kW + Solis 37,5 kW"
  // Coordenadas para o mapa por pinos (manuais, opcionais). Fase 3B-A.
  latitude: doublePrecision("latitude"), // -90..90
  longitude: doublePrecision("longitude"), // -180..180
  origem: text("origem").notNull().default("manual"), // manual | digitalgrid | soliscloud
  origemSincronizadoEm: timestamp("origem_sincronizado_em", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contratos = pgTable("contratos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
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
  tenantId: tenantCol(),
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
    tenantId: tenantCol(),
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
    unique("medicoes_geracao_tenant_usina_competencia_fonte").on(
      table.tenantId,
      table.usinaId,
      table.competencia,
      table.fonte,
    ),
  ],
);

// Faturas reais sincronizadas do Digital Grid (Billing API /bills, somente leitura).
export const faturasDg = pgTable("faturas_dg", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
  dgBillId: integer("dg_bill_id").notNull(), // id da fatura no Digital Grid
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
}, (t) => [unique("faturas_dg_tenant_bill").on(t.tenantId, t.dgBillId)]);

// Conta de energia (distribuidora) anexada a uma fatura do Digital Grid.
// O PDF é guardado em base64 no banco; os campos são extraídos do PDF.
export const contasEnergia = pgTable("contas_energia", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
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
    tenantId: tenantCol(),
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
    unique("rateios_dg_tenant_month_installation_owner").on(
      table.tenantId,
      table.generationMonthId,
      table.installation,
      table.ownerDocument,
    ),
  ],
);

// Propostas comerciais (lançamento manual / simulador de economia).
export const propostas = pgTable("propostas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
  // Nullable: propostas podem ser geradas para cliente ainda NÃO cadastrado
  // (nesse caso guarda-se o nome digitado em `clienteNomeLivre`).
  clienteId: uuid("cliente_id").references(() => clientes.id, {
    onDelete: "restrict",
  }),
  clienteNomeLivre: text("cliente_nome_livre"),
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
  // ── Resultado do gerador (nullable — propostas antigas ficam sem esses dados) ──
  cenario: text("cenario"), // necessario|rentavel
  potenciaKwp: doublePrecision("potencia_kwp"),
  moduloWp: integer("modulo_wp"),
  qtdModulos: integer("qtd_modulos"),
  inversorTipo: text("inversor_tipo"), // string|micro
  geracaoMensalKwh: doublePrecision("geracao_mensal_kwh"),
  precoFinal: doublePrecision("preco_final"),
  precoPorKwp: doublePrecision("preco_por_kwp"),
  paybackAnos: doublePrecision("payback_anos"),
  tirPercent: doublePrecision("tir_percent"),
  economia25Anos: doublePrecision("economia_25_anos"),
  co2Toneladas: doublePrecision("co2_toneladas"),
  // Custo/margem — SENSÍVEL: nunca expor ao cliente (só uso interno).
  custoTotal: doublePrecision("custo_total"),
  margemValor: doublePrecision("margem_valor"),
  margemPercent: doublePrecision("margem_percent"),
  // Snapshot completo (input + saída) do gerador, para reimpressão.
  dadosGerador: jsonb("dados_gerador"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Parâmetros de custo/margem do gerador de propostas (linha única; um JSON com
// tabela de kit, custos, margem e premissas). SENSÍVEL — só uso interno.
export const parametrosProposta = pgTable(
  "parametros_proposta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: tenantCol(),
    dados: jsonb("dados").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("parametros_proposta_tenant").on(t.tenantId)],
);

// ===== Histórico de telemetria (sync-first; worker a cada ~10 min) =====
// Tabelas append-only: cada linha é uma leitura. O "estado atual" é o registro
// mais recente por entidade (DISTINCT ON). Sem limpeza — histórico permanente.

export const telemetriaEstacao = pgTable(
  "telemetria_estacao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: tenantCol(),
    usinaId: uuid("usina_id").references(() => usinas.id, {
      onDelete: "set null",
    }),
    stationId: text("station_id").notNull(),
    estado: text("estado").notNull().default("offline"), // online|alarm|offline
    potenciaKw: doublePrecision("potencia_kw").notNull().default(0),
    energiaDiaKwh: doublePrecision("energia_dia_kwh").notNull().default(0),
    energiaMesKwh: doublePrecision("energia_mes_kwh").notNull().default(0),
    energiaAnoKwh: doublePrecision("energia_ano_kwh").notNull().default(0),
    energiaTotalKwh: doublePrecision("energia_total_kwh").notNull().default(0),
    capturadoEm: timestamp("capturado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("telemetria_estacao_station_capt_idx").on(t.stationId, t.capturadoEm),
    index("telemetria_estacao_usina_capt_idx").on(t.usinaId, t.capturadoEm),
  ],
);

export const telemetriaInversor = pgTable(
  "telemetria_inversor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: tenantCol(),
    usinaId: uuid("usina_id").references(() => usinas.id, {
      onDelete: "set null",
    }),
    stationId: text("station_id"),
    serial: text("serial").notNull(),
    estado: text("estado").notNull().default("offline"),
    potenciaKw: doublePrecision("potencia_kw").notNull().default(0),
    energiaDiaKwh: doublePrecision("energia_dia_kwh").notNull().default(0),
    energiaTotalKwh: doublePrecision("energia_total_kwh").notNull().default(0),
    temperaturaC: doublePrecision("temperatura_c").notNull().default(0),
    capturadoEm: timestamp("capturado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("telemetria_inversor_serial_capt_idx").on(t.serial, t.capturadoEm),
  ],
);

export const telemetriaColetor = pgTable(
  "telemetria_coletor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: tenantCol(),
    usinaId: uuid("usina_id").references(() => usinas.id, {
      onDelete: "set null",
    }),
    stationId: text("station_id"),
    sn: text("sn").notNull(),
    estado: text("estado").notNull().default("offline"),
    ultimaComunicacao: text("ultima_comunicacao"),
    modelo: text("modelo"),
    capturadoEm: timestamp("capturado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("telemetria_coletor_sn_capt_idx").on(t.sn, t.capturadoEm)],
);

// Alarmes: 1 linha por alarme (upsert por alarm_id), com status/resolução
// atualizados — guarda o histórico de tudo que já alarmou (O&M).
export const alarmes = pgTable("alarmes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
  alarmId: text("alarm_id").notNull(),
  usinaId: uuid("usina_id").references(() => usinas.id, {
    onDelete: "set null",
  }),
  stationId: text("station_id"),
  deviceSn: text("device_sn"),
  nivel: text("nivel").notNull().default("baixo"), // baixo|medio|critico
  mensagem: text("mensagem"),
  iniciadoEm: text("iniciado_em"),
  status: text("status").notNull().default("aberto"), // aberto|em-tratativa|resolvido
  vistoEm: timestamp("visto_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvidoEm: timestamp("resolvido_em", { withTimezone: true }),
}, (t) => [unique("alarmes_tenant_alarm").on(t.tenantId, t.alarmId)]);

// Anexos de qualquer cadastro (genérico por entidade+id). Conteúdo em bytea
// (BLOB no banco). Hoje usado por 'cliente'; reaproveitável em UCs/usinas etc.
export const anexos = pgTable(
  "anexos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: tenantCol(),
    entidade: text("entidade").notNull(), // 'cliente'
    entidadeId: uuid("entidade_id").notNull(),
    nome: text("nome").notNull(),
    mimeType: text("mime_type").notNull().default("application/octet-stream"),
    tamanhoBytes: integer("tamanho_bytes").notNull().default(0),
    conteudo: bytea("conteudo").notNull(),
    enviadoPor: text("enviado_por"), // e-mail de quem subiu
    enviadoPorId: uuid("enviado_por_id"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("anexos_entidade_idx").on(t.entidade, t.entidadeId)],
);

// Histórico de alterações dos cadastros (campos e anexos) para rastreabilidade.
export const cadastroHistorico = pgTable(
  "cadastro_historico",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: tenantCol(),
    entidade: text("entidade").notNull(), // 'cliente'
    entidadeId: uuid("entidade_id").notNull(),
    acao: text("acao").notNull(), // criou | editou_campo | anexou | removeu_anexo
    campo: text("campo"),
    valorAntes: text("valor_antes"),
    valorDepois: text("valor_depois"),
    detalhe: text("detalhe"),
    autor: text("autor"), // e-mail de quem fez
    autorId: uuid("autor_id"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("cadastro_historico_entidade_idx").on(t.entidade, t.entidadeId),
  ],
);

// Auditoria de cada execução do worker (alimenta "atualizado há X" e a saúde).
export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantCol(),
  job: text("job").notNull(), // telemetria|geracao|faturas_dg|rateio_dg
  iniciadoEm: timestamp("iniciado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
  terminadoEm: timestamp("terminado_em", { withTimezone: true }),
  status: text("status").notNull().default("ok"), // ok|erro
  itens: integer("itens").notNull().default(0),
  mensagem: text("mensagem"),
});

export type TelemetriaEstacao = typeof telemetriaEstacao.$inferSelect;
export type TelemetriaInversor = typeof telemetriaInversor.$inferSelect;
export type TelemetriaColetor = typeof telemetriaColetor.$inferSelect;
export type Alarme = typeof alarmes.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;
export type Anexo = typeof anexos.$inferSelect;
export type CadastroHistorico = typeof cadastroHistorico.$inferSelect;

export type Tenant = typeof tenants.$inferSelect;
export type TenantMembership = typeof tenantMemberships.$inferSelect;

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
export type ParametrosPropostaRow = typeof parametrosProposta.$inferSelect;
