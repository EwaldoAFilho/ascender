// Constantes de ENGENHARIA (client-safe — não contêm custo nem margem).
// Portadas do gerador estático. Os valores de custo/kit/margem ficam em
// `parametros.ts` (server-only).

import type { ModuloWp } from "./types";

// Premissas técnicas/financeiras (default = valores do gerador original).
export const PR = 0.79; // Performance Ratio
export const SEG = 0.95; // margem de segurança (−5%)
export const DEG = 0.007; // degradação anual
export const REA = 0.08; // reajuste tarifário anual
export const CO2F = 0.29; // kg CO2 / kWh
export const TEXC = 0.4; // R$/kWh de crédito do excedente (Telhado Rentável)

// Cronograma oficial do Fio B (Lei 14.300/2022): fração da TUSD Fio B cobrada
// sobre a energia injetada, por ano-calendário a partir de 2023. A partir de
// 2029 mantém-se em 100% (usa-se o último valor do array).
export const ANO_BASE_FIOB = 2023;
export const CRONOGRAMA_FIOB_PADRAO = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0];

// Módulos: dimensões em metros (largura × comprimento) e potência.
export const MODS: Record<ModuloWp, { wp: ModuloWp; l: number; c: number; label: string }> = {
  620: { wp: 620, l: 1.13, c: 2.38, label: "620Wp (1,13×2,38m)" },
  700: { wp: 700, l: 1.3, c: 2.38, label: "700Wp (1,30×2,38m)" },
};

// Fatores sazonais de geração por mês (Jan..Dez).
export const FMES = [1.05, 1.0, 0.98, 0.95, 0.92, 0.9, 0.91, 0.94, 0.97, 1.01, 1.04, 1.06];
export const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// Irradiação (HSP) por região — para o select do formulário.
export const HSP_OPCOES: { value: number; label: string }[] = [
  { value: 5.5, label: "DF / Brasília — 5,5" },
  { value: 5.2, label: "Goiás — 5,2" },
  { value: 5.0, label: "Minas Gerais — 5,0" },
  { value: 4.8, label: "São Paulo — 4,8" },
  { value: 5.3, label: "Mato Grosso — 5,3" },
  { value: 5.4, label: "Bahia — 5,4" },
  { value: 5.1, label: "Rio de Janeiro — 5,1" },
  { value: 4.5, label: "Sul — 4,5" },
  { value: 5.6, label: "Nordeste — 5,6" },
];

// Percentual de compensação desejado.
export const COMPENSACAO_OPCOES: { value: number; label: string }[] = [
  { value: 1.0, label: "100%" },
  { value: 0.9, label: "90%" },
  { value: 0.8, label: "80%" },
  { value: 1.1, label: "110% (crédito extra)" },
];

// Opções de adequação trifásica (amperagem → custo fixo).
export const ADEQUACAO_OPCOES: { value: number; label: string }[] = [
  { value: 3500, label: "50A — R$ 3.500" },
  { value: 6000, label: "80A — R$ 6.000" },
  { value: 8000, label: "100A — R$ 8.000" },
];
