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
  /** "desktop" = tela de trabalho/edição, oculta na navegação mobile. */
  scope?: "all" | "desktop";
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

// "há X min/h/d" a partir de um ISO — para indicar o frescor das sincronizações.
export function tempoRelativo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

export const modules: Module[] = [
  {
    id: "executivo",
    title: "Executivo",
    description:
      "Indicadores consolidados de geração, financeiro, potência atual e economia.",
    source: "SolisCloud + Digital Grid",
    icon: LayoutDashboard,
    href: "/executivo",
  },
  {
    id: "cadastros",
    title: "Cadastros",
    description:
      "Telas de manutenção para clientes, UCs, usinas, contratos e fontes externas.",
    source: "Cadastro + conciliação Digital Grid",
    icon: ClipboardList,
    href: "/cadastros",
    scope: "desktop",
  },
  {
    id: "soliscloud",
    title: "SolisCloud",
    description:
      "Telemetria de usinas, inversores, disponibilidade e alertas técnicos.",
    source: "API SolisCloud",
    icon: Zap,
    href: "/soliscloud",
  },
  {
    id: "usinas",
    title: "Usinas",
    description:
      "Cadastro operacional, potência, identificadores externos e previsto x realizado.",
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
    description: "Faturas, boletos, vencimentos, pagamentos e inadimplência.",
    source: "Digital Grid",
    icon: ReceiptText,
    href: "/financeiro",
  },
  {
    id: "propostas",
    title: "Propostas",
    description:
      "Simulação comercial por consumo, tarifa, desconto e economia estimada.",
    source: "Simulador comercial",
    icon: FileText,
    href: "/propostas",
    scope: "desktop",
  },
  {
    id: "integracoes",
    title: "Integrações",
    description:
      "Fontes de dados, endpoints SolisCloud e status de sincronização.",
    source: "SolisCloud + Digital Grid",
    icon: Cable,
    href: "/integracoes",
  },
];

export const viewTitles: Record<ViewId, string> = {
  overview: "Operação ao vivo",
  executivo: "Dashboard executivo",
  cadastros: "Cadastros operacionais",
  soliscloud: "Operação SolisCloud",
  usinas: "Performance de usinas",
  rateio: "Rateio e compensação",
  financeiro: "Financeiro e cobrança",
  propostas: "Propostas comerciais",
  integracoes: "Integrações e contratos",
};

export const viewSubtitles: Record<ViewId, string> = {
  overview: "Potência agora e estado da frota, em tempo real.",
  executivo: "Consolidado de meta, geração do ano e financeiro para a diretoria.",
  cadastros: "Dados mestres, com conciliação automática a partir do Digital Grid.",
  soliscloud:
    "Telemetria real de estações, inversores, energia e alarmes da SolisCloud.",
  usinas: "Visão de cadastro e desempenho mensal por usina.",
  rateio: "Rateio real por cliente e unidade consumidora (Digital Grid).",
  financeiro: "Faturas reais sincronizadas do Digital Grid.",
  propostas:
    "Base inicial para sugerir oportunidades comerciais e gerar propostas.",
  integracoes: "Mapa técnico das fontes que alimentam o sistema.",
};
