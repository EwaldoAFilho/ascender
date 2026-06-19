import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeDollarSign,
  BatteryCharging,
  Building2,
  Cable,
  ChartNoAxesColumn,
  CircleDollarSign,
  ClipboardList,
  Database,
  FileText,
  FileWarning,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  Moon,
  Network,
  PlugZap,
  ReceiptText,
  Search,
  ShieldCheck,
  Sun,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  allocationRows,
  consumerUnits,
  customers,
  dashboardIdeas,
  generationReadings,
  integrations,
  inverterTelemetries,
  invoices,
  plants,
  proposals,
  solisAlarms,
  solisApiEndpoints,
  solisTelemetries,
} from "./data/mockData";
import { BarList } from "./components/BarList";
import { KpiCard } from "./components/KpiCard";

type ViewId =
  | "overview"
  | "executivo"
  | "cadastros"
  | "soliscloud"
  | "usinas"
  | "rateio"
  | "financeiro"
  | "propostas"
  | "integracoes";

type RegistryTab = "clientes" | "unidades" | "usinas" | "contratos" | "integracoes";
type Theme = "light" | "dark";

type Module = {
  id: ViewId;
  title: string;
  description: string;
  source: string;
  metric: string;
  icon: LucideIcon;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = window.localStorage.getItem("ascender-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getCustomerName(customerId: string) {
  return customers.find((customer) => customer.id === customerId)?.name ?? "Cliente nao encontrado";
}

function getPlantName(plantId: string) {
  return plants.find((plant) => plant.id === plantId)?.name ?? "Usina nao encontrada";
}

function getConsumerUnitCode(consumerUnitId: string) {
  return consumerUnits.find((unit) => unit.id === consumerUnitId)?.installationCode ?? "UC nao encontrada";
}

const totalGeneration = sum(generationReadings.map((item) => item.generationKwh));
const totalOpen = sum(invoices.filter((invoice) => invoice.status !== "pago").map((invoice) => invoice.billetAmount));
const totalPaid = sum(invoices.filter((invoice) => invoice.status === "pago").map((invoice) => invoice.billetAmount));
const totalSavings = sum(proposals.map((proposal) => proposal.estimatedYearlySavings));
const currentPower = sum(solisTelemetries.map((item) => item.currentPowerKw));
const monthSolisGeneration = sum(solisTelemetries.map((item) => item.monthEnergyKwh));
const expectedSolisGeneration = sum(solisTelemetries.map((item) => item.expectedMonthEnergyKwh));
const allocatedEnergy = sum(allocationRows.map((row) => row.allocatedKwh));
const allocationBalance = sum(allocationRows.map((row) => row.balanceKwh));

const modules: Module[] = [
  {
    id: "executivo",
    title: "Executivo",
    description: "Indicadores consolidados de geracao, financeiro, potencia atual e economia.",
    source: "Planilha + SolisCloud + Digital Grid",
    metric: `${numberFormatter.format(totalGeneration)} kWh`,
    icon: LayoutDashboard,
  },
  {
    id: "cadastros",
    title: "Cadastros",
    description: "Telas de manutencao para clientes, UCs, usinas, contratos e fontes externas.",
    source: "Modelo relacional inicial",
    metric: `${customers.length + consumerUnits.length + plants.length} registros`,
    icon: ClipboardList,
  },
  {
    id: "soliscloud",
    title: "SolisCloud",
    description: "Telemetria de usinas, inversores, disponibilidade e alertas tecnicos.",
    source: "API SolisCloud mockada",
    metric: `${numberFormatter.format(currentPower)} kW agora`,
    icon: Zap,
  },
  {
    id: "usinas",
    title: "Usinas",
    description: "Cadastro operacional, potencia, identificadores externos e previsto x realizado.",
    source: "Planilha + SolisCloud",
    metric: `${plants.length} usinas`,
    icon: Sun,
  },
  {
    id: "rateio",
    title: "Rateio",
    description: "Consumo, energia alocada, saldo e percentual por unidade consumidora.",
    source: "Planilha + Digital Grid",
    metric: `${numberFormatter.format(allocatedEnergy)} kWh`,
    icon: Network,
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Faturas, boletos, vencimentos, pagamentos e inadimplencia.",
    source: "Digital Grid mockado",
    metric: moneyFormatter.format(totalOpen),
    icon: ReceiptText,
  },
  {
    id: "propostas",
    title: "Propostas",
    description: "Simulacao comercial por consumo, tarifa, desconto e economia estimada.",
    source: "Regras comerciais mockadas",
    metric: moneyFormatter.format(totalSavings),
    icon: FileText,
  },
  {
    id: "integracoes",
    title: "Integracoes",
    description: "Fontes de dados, endpoints SolisCloud e status de sincronizacao.",
    source: "SolisCloud + Digital Grid + Excel",
    metric: `${solisApiEndpoints.length} endpoints`,
    icon: Cable,
  },
];

const viewTitles: Record<ViewId, string> = {
  overview: "Mapa navegavel",
  executivo: "Dashboard executivo",
  cadastros: "Cadastros operacionais",
  soliscloud: "Operacao SolisCloud",
  usinas: "Performance de usinas",
  rateio: "Rateio e compensacao",
  financeiro: "Financeiro e cobranca",
  propostas: "Propostas comerciais",
  integracoes: "Integracoes e contratos",
};

const viewSubtitles: Record<ViewId, string> = {
  overview: "Escolha um modulo para validar os dashboards implementaveis da ASCENDER.",
  executivo: "Consolidacao para leitura rapida de diretoria e operacao.",
  cadastros: "Telas iniciais para dados mestres antes do banco relacional.",
  soliscloud: "Mock baseado em estacoes, inversores, energia e alarmes da SolisCloud.",
  usinas: "Visao de cadastro e desempenho mensal por usina.",
  rateio: "Validacao da energia distribuida para clientes e unidades consumidoras.",
  financeiro: "Acompanhamento das faturas simuladas a partir do comportamento da Digital Grid.",
  propostas: "Base inicial para sugerir oportunidades comerciais e gerar propostas.",
  integracoes: "Mapa tecnico das fontes que vao alimentar o futuro backend.",
};

function buildRows() {
  const generationByPlant = plants
    .map((plant) => {
      const readings = generationReadings.filter((reading) => reading.plantId === plant.id);
      return {
        label: plant.name,
        value: sum(readings.map((reading) => reading.generationKwh)),
        caption: `${readings.length} medicoes no mock`,
      };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const financeByStatus = ["aguardando", "pago", "vencido", "parcelado", "negativado"].map((status) => {
    const rows = invoices.filter((invoice) => invoice.status === status);
    return {
      label: status,
      value: sum(rows.map((invoice) => invoice.billetAmount)),
      caption: `${rows.length} fatura(s)`,
    };
  });

  const monthlyGenerationRows = ["2026-01", "2026-02", "2026-03", "2026-04"].map((month) => ({
    label: month,
    value: sum(generationReadings.filter((reading) => reading.month === month).map((reading) => reading.generationKwh)),
    caption: "Geracao consolidada por competencia",
  }));

  const solisPerformanceRows = solisTelemetries
    .map((telemetry) => ({
      label: getPlantName(telemetry.plantId),
      value: (telemetry.monthEnergyKwh / telemetry.expectedMonthEnergyKwh) * 100,
      caption: `${numberFormatter.format(telemetry.monthEnergyKwh)} de ${numberFormatter.format(
        telemetry.expectedMonthEnergyKwh
      )} kWh esperados`,
    }))
    .sort((a, b) => b.value - a.value);

  const opportunityRows = proposals.map((proposal) => ({
    label: getCustomerName(proposal.customerId),
    value: proposal.estimatedYearlySavings,
    caption: `${numberFormatter.format(proposal.estimatedConsumptionKwh)} kWh/mes estimados`,
  }));

  return { generationByPlant, financeByStatus, monthlyGenerationRows, solisPerformanceRows, opportunityRows };
}

export function App() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const rows = useMemo(buildRows, []);
  const activeModule = modules.find((module) => module.id === activeView);
  const isDarkTheme = theme === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("ascender-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (window.localStorage.getItem("ascender-theme")) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-lockup" type="button" onClick={() => setActiveView("overview")}>
          <img src="/brand/logo-black.jpeg" alt="ASCENDER" />
        </button>
        <nav>
          <button className={activeView === "overview" ? "active" : ""} type="button" onClick={() => setActiveView("overview")}>
            <LayoutDashboard size={18} /> Inicio
          </button>
          {modules.map((module) => (
            <button
              key={module.id}
              className={activeView === module.id ? "active" : ""}
              type="button"
              onClick={() => setActiveView(module.id)}
            >
              <module.icon size={18} /> {module.title}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">ASCENDER Solar Tech</p>
            <h1>{viewTitles[activeView]}</h1>
            <span>{viewSubtitles[activeView]}</span>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <span>Mock local: planilha, SolisCloud e Digital Grid</span>
            </div>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
              aria-label={isDarkTheme ? "Ativar tema claro" : "Ativar tema escuro"}
              title={isDarkTheme ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDarkTheme ? "Claro" : "Escuro"}</span>
            </button>
          </div>
        </header>

        {activeView === "overview" ? (
          <Overview rows={rows} setActiveView={setActiveView} />
        ) : (
          <>
            {activeModule ? (
              <section className="module-hero">
                <div className="module-hero-icon">
                  <activeModule.icon size={28} />
                </div>
                <div>
                  <p className="eyebrow">{activeModule.source}</p>
                  <h2>{activeModule.title}</h2>
                  <p>{activeModule.description}</p>
                </div>
                <strong>{activeModule.metric}</strong>
              </section>
            ) : null}
            {activeView === "executivo" ? <ExecutiveDashboard rows={rows} /> : null}
            {activeView === "cadastros" ? <RegistryDashboard /> : null}
            {activeView === "soliscloud" ? <SolisDashboard rows={rows} /> : null}
            {activeView === "usinas" ? <PlantsDashboard rows={rows} /> : null}
            {activeView === "rateio" ? <AllocationDashboard /> : null}
            {activeView === "financeiro" ? <FinanceDashboard rows={rows} /> : null}
            {activeView === "propostas" ? <ProposalsDashboard rows={rows} /> : null}
            {activeView === "integracoes" ? <IntegrationsDashboard /> : null}
          </>
        )}
      </main>
    </div>
  );
}

function Overview({ rows, setActiveView }: { rows: ReturnType<typeof buildRows>; setActiveView: (view: ViewId) => void }) {
  return (
    <>
      <section className="hero compact-hero">
        <div>
          <p className="eyebrow">Projeto React inicial</p>
          <h2>Uma central navegavel para operar usinas, rateios, financeiro e propostas.</h2>
          <p>
            Esta versao transforma o mock em modulos de produto para validar a rotina da ASCENDER antes de backend,
            banco relacional e integracoes reais.
          </p>
        </div>
        <img src="/brand/logo-black.jpeg" alt="" />
      </section>

      <section className="module-grid">
        {modules.map((module) => (
          <button key={module.id} type="button" className="module-card" onClick={() => setActiveView(module.id)}>
            <div className="module-card-icon">
              <module.icon size={24} />
            </div>
            <div>
              <strong>{module.title}</strong>
              <span>{module.description}</span>
            </div>
            <small>{module.metric}</small>
          </button>
        ))}
      </section>

      <section className="kpi-grid">
        <KpiCard title="Geracao mapeada" value={`${numberFormatter.format(totalGeneration)} kWh`} detail="SolisCloud e planilha" icon={Gauge} tone="success" />
        <KpiCard title="Potencia agora" value={`${numberFormatter.format(currentPower)} kW`} detail="Telemetria simulada" icon={Zap} tone="success" />
        <KpiCard title="Em aberto" value={moneyFormatter.format(totalOpen)} detail="Aguardando ou vencido" icon={BadgeDollarSign} tone="warning" />
        <KpiCard title="Pago" value={moneyFormatter.format(totalPaid)} detail="Base Digital Grid" icon={ShieldCheck} tone="success" />
        <KpiCard title="Economia proposta" value={moneyFormatter.format(totalSavings)} detail="Estimativa anual" icon={Lightbulb} />
      </section>

      <section className="dashboard-grid">
        <BarList title="Geracao por usina" rows={rows.generationByPlant} formatter={(value) => `${numberFormatter.format(value)} kWh`} />
        <BarList title="Financeiro por status" rows={rows.financeByStatus} formatter={moneyFormatter.format} />
      </section>
    </>
  );
}

function ExecutiveDashboard({ rows }: { rows: ReturnType<typeof buildRows> }) {
  return (
    <>
      <section className="kpi-grid">
        <KpiCard title="Geracao total" value={`${numberFormatter.format(totalGeneration)} kWh`} detail="Historico mapeado" icon={Gauge} tone="success" />
        <KpiCard title="Geracao Solis mes" value={`${numberFormatter.format(monthSolisGeneration)} kWh`} detail={`${numberFormatter.format(expectedSolisGeneration)} kWh previstos`} icon={Sun} tone="success" />
        <KpiCard title="Valor em aberto" value={moneyFormatter.format(totalOpen)} detail="Faturas nao pagas" icon={BadgeDollarSign} tone="warning" />
        <KpiCard title="Valor pago" value={moneyFormatter.format(totalPaid)} detail="Recebido no mock" icon={ShieldCheck} tone="success" />
        <KpiCard title="Economia anual" value={moneyFormatter.format(totalSavings)} detail="Propostas em simulacao" icon={Lightbulb} />
      </section>
      <section className="dashboard-grid">
        <BarList title="Geracao mensal consolidada" rows={rows.monthlyGenerationRows} formatter={(value) => `${numberFormatter.format(value)} kWh`} />
        <BarList title="Aderencia SolisCloud x previsto" rows={rows.solisPerformanceRows} formatter={(value) => `${numberFormatter.format(value)}%`} />
      </section>
    </>
  );
}

function RegistryDashboard() {
  const [activeTab, setActiveTab] = useState<RegistryTab>("clientes");
  const tabs: Array<{ id: RegistryTab; label: string; icon: LucideIcon }> = [
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "unidades", label: "UCs", icon: Building2 },
    { id: "usinas", label: "Usinas", icon: Sun },
    { id: "contratos", label: "Contratos", icon: FileText },
    { id: "integracoes", label: "Integracoes", icon: Cable },
  ];

  return (
    <>
      <section className="registry-tabs" aria-label="Cadastros mapeados">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={17} />
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "clientes" ? <CustomerRegistry /> : null}
      {activeTab === "unidades" ? <ConsumerUnitRegistry /> : null}
      {activeTab === "usinas" ? <PlantRegistry /> : null}
      {activeTab === "contratos" ? <ContractRegistry /> : null}
      {activeTab === "integracoes" ? <IntegrationRegistry /> : null}
    </>
  );
}

function FormField({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string;
  type?: "text" | "number" | "date";
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input readOnly type={type} value={value} />
    </label>
  );
}

function SelectField({ label, value, options }: { label: string; value: string; options: string[] }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select value={value} disabled>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function CustomerRegistry() {
  const customer = customers[0];

  return (
    <section className="split-grid registry-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Cadastro de cliente</h2>
            <p>Dados mestres para contrato, rateio, fatura e proposta comercial.</p>
          </div>
          <span>mock somente leitura</span>
        </div>
        <div className="form-grid">
          <FormField label="Nome / Razao social" value={customer.name} />
          <FormField label="Documento" value={customer.documentMasked} />
          <SelectField label="Tipo" value={customer.type} options={["cliente", "prosumidor", "investidor"]} />
          <SelectField label="Status" value={customer.status} options={["ativo", "inativo"]} />
          <FormField label="E-mail financeiro" value="financeiro@cliente.com.br" />
          <FormField label="Responsavel" value="Contato comercial" />
        </div>
        <div className="form-actions">
          <button type="button">Salvar mock</button>
          <button type="button" className="secondary">Limpar</button>
        </div>
      </section>
      <RegistryTable
        title="Clientes cadastrados"
        columns={["Cliente", "Documento", "Tipo", "Status"]}
        rows={customers.map((item) => [item.name, item.documentMasked, item.type, item.status])}
      />
    </section>
  );
}

function ConsumerUnitRegistry() {
  const unit = consumerUnits[0];

  return (
    <section className="split-grid registry-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Cadastro de unidade consumidora</h2>
            <p>Vincula cliente, distribuidora, instalacao e consumo medio para rateio e propostas.</p>
          </div>
          <span>{consumerUnits.length} UCs</span>
        </div>
        <div className="form-grid">
          <SelectField label="Cliente" value={getCustomerName(unit.customerId)} options={customers.map((customer) => customer.name)} />
          <FormField label="Codigo de instalacao" value={unit.installationCode} />
          <SelectField label="Distribuidora" value={unit.distributor} options={["CEMIG", "Neoenergia", "Equatorial GO"]} />
          <FormField label="Consumo medio kWh" value={String(unit.averageConsumptionKwh)} type="number" />
          <FormField label="Classe tarifaria" value="Comercial" />
          <SelectField label="Status de rateio" value="ativo" options={["ativo", "pausado", "pendente"]} />
        </div>
        <div className="form-actions">
          <button type="button">Salvar mock</button>
          <button type="button" className="secondary">Validar UC</button>
        </div>
      </section>
      <RegistryTable
        title="Unidades consumidoras"
        columns={["UC", "Cliente", "Distribuidora", "Consumo medio"]}
        rows={consumerUnits.map((item) => [
          item.installationCode,
          getCustomerName(item.customerId),
          item.distributor,
          `${numberFormatter.format(item.averageConsumptionKwh)} kWh`,
        ])}
      />
    </section>
  );
}

function PlantRegistry() {
  const plant = plants[0];

  return (
    <section className="split-grid registry-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Cadastro de usina</h2>
            <p>Base para monitoramento SolisCloud, rateio, performance e conciliacao financeira.</p>
          </div>
          <span>{plants.length} usinas</span>
        </div>
        <div className="form-grid">
          <FormField label="Nome da usina" value={plant.name} />
          <SelectField label="Distribuidora" value={plant.distributor} options={["Neoenergia", "Equatorial GO", "CEMIG"]} />
          <FormField label="Potencia kWp" value={String(plant.capacityKwp)} type="number" />
          <FormField label="Codigo Digital Grid" value={plant.digitalGridCode ?? ""} />
          <FormField label="Station ID SolisCloud" value={plant.solisStationId ?? ""} />
          <SelectField label="Status operacional" value={plant.status} options={["ativa", "atencao", "inativa"]} />
        </div>
        <div className="form-actions">
          <button type="button">Salvar mock</button>
          <button type="button" className="secondary">Sincronizar Solis</button>
        </div>
      </section>
      <RegistryTable
        title="Usinas cadastradas"
        columns={["Usina", "Distribuidora", "SolisCloud", "Potencia", "Status"]}
        rows={plants.map((item) => [
          item.name,
          item.distributor,
          item.solisStationId ?? "-",
          `${item.capacityKwp} kWp`,
          item.status,
        ])}
      />
    </section>
  );
}

function ContractRegistry() {
  const proposal = proposals[0];

  return (
    <section className="split-grid registry-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Contrato comercial inicial</h2>
            <p>Estrutura preliminar para transformar proposta em contrato e regra de faturamento.</p>
          </div>
          <span>pre-contrato</span>
        </div>
        <div className="form-grid">
          <SelectField label="Cliente" value={getCustomerName(proposal.customerId)} options={customers.map((customer) => customer.name)} />
          <SelectField
            label="Unidade consumidora"
            value={getConsumerUnitCode(proposal.consumerUnitId)}
            options={consumerUnits.map((unit) => unit.installationCode)}
          />
          <SelectField label="Distribuidora" value={proposal.distributor} options={["Neoenergia", "CEMIG", "Equatorial GO"]} />
          <FormField label="Consumo estimado kWh" value={String(proposal.estimatedConsumptionKwh)} type="number" />
          <FormField label="Tarifa distribuidora" value={String(proposal.distributorTariff)} type="number" />
          <FormField label="Tarifa ASCENDER" value={String(proposal.ascenderTariff)} type="number" />
          <FormField label="Economia mensal estimada" value={moneyFormatter.format(proposal.estimatedMonthlySavings)} />
          <SelectField label="Status" value={proposal.status} options={["simulacao", "em-analise", "aprovada"]} />
        </div>
        <div className="form-actions">
          <button type="button">Gerar proposta mock</button>
          <button type="button" className="secondary">Simular economia</button>
        </div>
      </section>
      <RegistryTable
        title="Propostas/contratos base"
        columns={["Cliente", "UC", "Tarifa ASCENDER", "Economia anual", "Status"]}
        rows={proposals.map((item) => [
          getCustomerName(item.customerId),
          getConsumerUnitCode(item.consumerUnitId),
          moneyFormatter.format(item.ascenderTariff),
          moneyFormatter.format(item.estimatedYearlySavings),
          item.status,
        ])}
      />
    </section>
  );
}

function IntegrationRegistry() {
  return (
    <section className="split-grid registry-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Cadastro de fonte externa</h2>
            <p>Controle de origem dos dados para SolisCloud, Digital Grid e importacao Excel.</p>
          </div>
          <span>{integrations.length} fontes</span>
        </div>
        <div className="form-grid">
          <SelectField label="Fonte" value="SolisCloud" options={integrations.map((integration) => integration.name)} />
          <FormField label="Identificador interno" value="soliscloud" />
          <FormField label="URL base" value="https://www.soliscloud.com:13333" />
          <SelectField label="Status" value="mock" options={["mock", "pendente-validacao", "importado-para-analise"]} />
          <FormField label="Ultima sincronizacao" value="2026-04-30 18:20" />
          <SelectField label="Responsavel" value="Operacao" options={["Operacao", "Financeiro", "Comercial", "TI"]} />
        </div>
        <div className="form-actions">
          <button type="button">Salvar fonte</button>
          <button type="button" className="secondary">Testar conexao</button>
        </div>
      </section>
      <RegistryTable
        title="Fontes e endpoints"
        columns={["Fonte/Endpoint", "Uso", "Campos", "Status"]}
        rows={[
          ...integrations.map((item) => [item.name, item.description, "cadastro", item.status]),
          ...solisApiEndpoints.map((item) => [item.path, item.dashboardUse, item.mappedFields.join(", "), item.status]),
        ]}
      />
    </section>
  );
}

function RegistryTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <span>{rows.length} registros</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SolisDashboard({ rows }: { rows: ReturnType<typeof buildRows> }) {
  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Telemetria por estacao</h2>
            <p>Campos equivalentes ao retorno esperado de detalhe de estacao na SolisCloud.</p>
          </div>
          <span>{solisAlarms.length} alerta(s)</span>
        </div>
        <div className="telemetry-grid">
          {solisTelemetries.map((telemetry) => (
            <article key={telemetry.stationId} className="telemetry-card">
              <div className="telemetry-head">
                <strong>{getPlantName(telemetry.plantId)}</strong>
                <span className={`status status-${telemetry.state}`}>{telemetry.state}</span>
              </div>
              <dl>
                <div><dt>Agora</dt><dd>{numberFormatter.format(telemetry.currentPowerKw)} kW</dd></div>
                <div><dt>Hoje</dt><dd>{numberFormatter.format(telemetry.dayEnergyKwh)} kWh</dd></div>
                <div><dt>Mes</dt><dd>{numberFormatter.format(telemetry.monthEnergyKwh)} kWh</dd></div>
                <div><dt>Total</dt><dd>{numberFormatter.format(telemetry.allEnergyKwh)} kWh</dd></div>
              </dl>
              <small>Atualizado em {telemetry.updateTime}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="dashboard-grid">
        <BarList title="Aderencia de geracao" rows={rows.solisPerformanceRows} formatter={(value) => `${numberFormatter.format(value)}%`} />
        <AlarmPanel />
      </section>
      <InverterTable />
    </>
  );
}

function PlantsDashboard({ rows }: { rows: ReturnType<typeof buildRows> }) {
  return (
    <>
      <section className="dashboard-grid">
        <BarList title="Geracao por usina" rows={rows.generationByPlant} formatter={(value) => `${numberFormatter.format(value)} kWh`} />
        <BarList title="Realizado x previsto" rows={rows.solisPerformanceRows} formatter={(value) => `${numberFormatter.format(value)}%`} />
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Usinas monitoradas</h2>
            <p>Cadastro inicial unido aos indicadores mensais mockados da SolisCloud.</p>
          </div>
          <span>{plants.length} registros</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usina</th><th>Distribuidora</th><th>Digital Grid</th><th>SolisCloud</th><th>Potencia</th><th>Mes Solis</th><th>Previsto</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant) => {
                const telemetry = solisTelemetries.find((item) => item.plantId === plant.id);
                return (
                  <tr key={plant.id}>
                    <td>{plant.name}</td>
                    <td>{plant.distributor}</td>
                    <td>{plant.digitalGridCode}</td>
                    <td>{plant.solisStationId}</td>
                    <td>{plant.capacityKwp} kWp</td>
                    <td>{numberFormatter.format(telemetry?.monthEnergyKwh ?? 0)} kWh</td>
                    <td>{numberFormatter.format(telemetry?.expectedMonthEnergyKwh ?? 0)} kWh</td>
                    <td><span className={`status status-${plant.status}`}>{plant.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AllocationDashboard() {
  return (
    <>
      <section className="kpi-grid compact-kpis">
        <KpiCard title="Energia alocada" value={`${numberFormatter.format(allocatedEnergy)} kWh`} detail="Competencia 2026-04" icon={Network} tone="success" />
        <KpiCard title="Saldo acumulado" value={`${numberFormatter.format(allocationBalance)} kWh`} detail="Sobra ou deficit" icon={Activity} tone="warning" />
        <KpiCard title="UCs no mock" value={String(consumerUnits.length)} detail="Unidades consumidoras" icon={Users} />
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Rateio por unidade consumidora</h2>
            <p>Relacao entre consumo da UC, energia alocada e saldo para acompanhar divergencias.</p>
          </div>
          <span>{numberFormatter.format(allocatedEnergy)} kWh alocados</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th><th>UC</th><th>Usina</th><th>Consumo</th><th>Alocado</th><th>Saldo</th><th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {allocationRows.map((row) => (
                <tr key={row.id}>
                  <td>{getCustomerName(row.customerId)}</td>
                  <td>{getConsumerUnitCode(row.consumerUnitId)}</td>
                  <td>{getPlantName(row.plantId)}</td>
                  <td>{numberFormatter.format(row.consumptionKwh)} kWh</td>
                  <td>{numberFormatter.format(row.allocatedKwh)} kWh</td>
                  <td><span className={row.balanceKwh < 0 ? "negative-value" : "positive-value"}>{numberFormatter.format(row.balanceKwh)} kWh</span></td>
                  <td>{row.allocationPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function FinanceDashboard({ rows }: { rows: ReturnType<typeof buildRows> }) {
  return (
    <>
      <section className="dashboard-grid">
        <BarList title="Financeiro por status" rows={rows.financeByStatus} formatter={moneyFormatter.format} />
        <section className="panel">
          <div className="panel-header">
            <h2>Resumo de cobranca</h2>
            <span>Digital Grid mockado</span>
          </div>
          <div className="summary-list">
            <div><span>Em aberto</span><strong>{moneyFormatter.format(totalOpen)}</strong></div>
            <div><span>Pago</span><strong>{moneyFormatter.format(totalPaid)}</strong></div>
            <div><span>Faturas</span><strong>{invoices.length}</strong></div>
          </div>
        </section>
      </section>
      <InvoiceTable />
    </>
  );
}

function ProposalsDashboard({ rows }: { rows: ReturnType<typeof buildRows> }) {
  return (
    <>
      <section className="dashboard-grid">
        <BarList title="Potencial comercial" rows={rows.opportunityRows} formatter={moneyFormatter.format} />
        <section className="panel">
          <div className="panel-header">
            <h2>Oportunidades</h2>
            <span>Simulador futuro</span>
          </div>
          <div className="summary-list">
            <div><span>Propostas</span><strong>{proposals.length}</strong></div>
            <div><span>Economia anual</span><strong>{moneyFormatter.format(totalSavings)}</strong></div>
            <div><span>Ticket medio</span><strong>{moneyFormatter.format(totalSavings / proposals.length)}</strong></div>
          </div>
        </section>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Propostas comerciais</h2>
          <span>Cards navegaveis por cliente</span>
        </div>
        <div className="proposal-list">
          {proposals.map((proposal) => (
            <article key={proposal.id} className="proposal-card">
              <div><strong>{getCustomerName(proposal.customerId)}</strong><span>{proposal.estimatedConsumptionKwh.toLocaleString("pt-BR")} kWh estimados</span></div>
              <div><small>Tarifa distribuidora</small><strong>{moneyFormatter.format(proposal.distributorTariff)}</strong></div>
              <div><small>Tarifa ASCENDER</small><strong>{moneyFormatter.format(proposal.ascenderTariff)}</strong></div>
              <div><small>Economia anual</small><strong>{moneyFormatter.format(proposal.estimatedYearlySavings)}</strong></div>
              <div><small>Proxima acao</small><strong>{proposal.status === "simulacao" ? "Validar UC" : "Gerar proposta"}</strong></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function IntegrationsDashboard() {
  return (
    <section className="split-grid">
      <section className="panel">
        <div className="panel-header">
          <h2>Fontes de dados</h2>
          <span>Status de integracao</span>
        </div>
        <div className="integration-list">
          {integrations.map((integration) => (
            <article key={integration.id}>
              <div className="source-icon">
                {integration.id === "soliscloud" ? <PlugZap size={20} /> : null}
                {integration.id === "digital-grid" ? <CircleDollarSign size={20} /> : null}
                {integration.id === "planilha-controle-usinas" ? <Database size={20} /> : null}
              </div>
              <div><strong>{integration.name}</strong><span>{integration.description}</span></div>
              <span className={`status status-${integration.status}`}>{integration.status}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Contratos SolisCloud</h2>
          <span>{solisApiEndpoints.length} endpoints</span>
        </div>
        <div className="endpoint-list">
          {solisApiEndpoints.map((endpoint) => (
            <article key={endpoint.id}>
              <div>
                <strong>{endpoint.method} {endpoint.path}</strong>
                <span>{endpoint.dashboardUse}</span>
                <small>{endpoint.mappedFields.join(", ")}</small>
              </div>
              <span className={`status status-${endpoint.status}`}>{endpoint.status}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="panel full-span">
        <div className="panel-header">
          <h2>Roadmap de dashboards</h2>
          <span>Priorizacao</span>
        </div>
        <div className="idea-grid">
          {dashboardIdeas.map((idea) => (
            <article key={idea.id} className="idea-card">
              <div>
                {idea.id === "executivo" ? <ChartNoAxesColumn size={19} /> : null}
                {idea.id === "usinas" ? <BatteryCharging size={19} /> : null}
                {idea.id === "financeiro" ? <Activity size={19} /> : null}
                {idea.id === "rateio" ? <Users size={19} /> : null}
                {idea.id === "propostas" ? <FileText size={19} /> : null}
                {idea.id === "integracoes" ? <Cable size={19} /> : null}
                <strong>{idea.title}</strong><span>{idea.priority}</span>
              </div>
              <p>{idea.goal}</p>
              <small>{idea.source}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function AlarmPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Alertas tecnicos</h2>
        <span>Acionamento futuro</span>
      </div>
      <div className="alarm-list">
        {solisAlarms.map((alarm) => (
          <article key={alarm.id}>
            <FileWarning size={20} />
            <div>
              <strong>{getPlantName(alarm.plantId)}</strong>
              <span>{alarm.message}</span>
              <small>{alarm.deviceSerialNumber} - {alarm.startedAt}</small>
            </div>
            <span className={`status status-${alarm.level}`}>{alarm.level}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function InverterTable() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Inversores</h2>
        <span>Base para O&M</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Serial</th><th>Usina</th><th>Potencia</th><th>Hoje</th><th>Temp.</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inverterTelemetries.map((inverter) => (
              <tr key={inverter.id}>
                <td>{inverter.serialNumber}</td>
                <td>{getPlantName(inverter.plantId)}</td>
                <td>{numberFormatter.format(inverter.currentPowerKw)} kW</td>
                <td>{numberFormatter.format(inverter.todayEnergyKwh)} kWh</td>
                <td>{numberFormatter.format(inverter.temperatureC)} C</td>
                <td><span className={`status status-${inverter.state}`}>{inverter.state}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvoiceTable() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Faturas e pagamentos</h2>
        <span>Contrato inspirado na Digital Grid</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th><th>Usina</th><th>Competencia</th><th>Fatura</th><th>Boleto</th><th>Vencimento</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{getCustomerName(invoice.customerId)}</td>
                <td>{getPlantName(invoice.plantId)}</td>
                <td>{invoice.month}</td>
                <td>{moneyFormatter.format(invoice.invoiceAmount)}</td>
                <td>{moneyFormatter.format(invoice.billetAmount)}</td>
                <td>{invoice.dueDate}</td>
                <td><span className={`status status-${invoice.status}`}>{invoice.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
