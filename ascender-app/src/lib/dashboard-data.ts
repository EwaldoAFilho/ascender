import {
  Cable,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Network,
  ReceiptText,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ViewId =
  | "overview"
  | "executivo"
  | "cadastros"
  | "soliscloud"
  | "usinas"
  | "rateio"
  | "financeiro"
  | "propostas"
  | "integracoes";

export type Module = {
  id: Exclude<ViewId, "overview">;
  title: string;
  description: string;
  source: string;
  icon: LucideIcon;
  href: string;
};

export const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

// Exibe a competência armazenada como "AAAA-MM" no formato "MM/AAAA" (mês/ano).
// O armazenamento permanece "AAAA-MM" (ordenável); só a exibição muda.
export function formatCompetencia(competencia: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})/.exec(competencia ?? "");
  return m ? `${m[2]}/${m[1]}` : competencia || "-";
}

// Exibe uma data "AAAA-MM-DD" como "DD/MM/AAAA" (dia/mês/ano).
export function formatData(data: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : data || "—";
}

export const modules: Module[] = [
  {
    id: "executivo",
    title: "Executivo",
    description:
      "Indicadores consolidados de geracao, financeiro, potencia atual e economia.",
    source: "SolisCloud + Digital Grid",
    icon: LayoutDashboard,
    href: "/executivo",
  },
  {
    id: "cadastros",
    title: "Cadastros",
    description:
      "Telas de manutencao para clientes, UCs, usinas, contratos e fontes externas.",
    source: "Cadastro + conciliacao Digital Grid",
    icon: ClipboardList,
    href: "/cadastros",
  },
  {
    id: "soliscloud",
    title: "SolisCloud",
    description:
      "Telemetria de usinas, inversores, disponibilidade e alertas tecnicos.",
    source: "API SolisCloud",
    icon: Zap,
    href: "/soliscloud",
  },
  {
    id: "usinas",
    title: "Usinas",
    description:
      "Cadastro operacional, potencia, identificadores externos e previsto x realizado.",
    source: "SolisCloud + cadastro",
    icon: Sun,
    href: "/usinas",
  },
  {
    id: "rateio",
    title: "Rateio",
    description:
      "Consumo, energia alocada, saldo e percentual por unidade consumidora.",
    source: "Digital Grid",
    icon: Network,
    href: "/rateio",
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Faturas, boletos, vencimentos, pagamentos e inadimplencia.",
    source: "Digital Grid",
    icon: ReceiptText,
    href: "/financeiro",
  },
  {
    id: "propostas",
    title: "Propostas",
    description:
      "Simulacao comercial por consumo, tarifa, desconto e economia estimada.",
    source: "Simulador comercial",
    icon: FileText,
    href: "/propostas",
  },
  {
    id: "integracoes",
    title: "Integracoes",
    description:
      "Fontes de dados, endpoints SolisCloud e status de sincronizacao.",
    source: "SolisCloud + Digital Grid",
    icon: Cable,
    href: "/integracoes",
  },
];

export const viewTitles: Record<ViewId, string> = {
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

export const viewSubtitles: Record<ViewId, string> = {
  overview: "Escolha um modulo para navegar pelos dashboards da ASCENDER.",
  executivo: "Consolidacao para leitura rapida de diretoria e operacao.",
  cadastros: "Dados mestres, com conciliacao automatica a partir do Digital Grid.",
  soliscloud:
    "Telemetria real de estacoes, inversores, energia e alarmes da SolisCloud.",
  usinas: "Visao de cadastro e desempenho mensal por usina.",
  rateio: "Rateio real por cliente e unidade consumidora (Digital Grid).",
  financeiro: "Faturas reais sincronizadas do Digital Grid.",
  propostas:
    "Base inicial para sugerir oportunidades comerciais e gerar propostas.",
  integracoes: "Mapa tecnico das fontes que alimentam o sistema.",
};
