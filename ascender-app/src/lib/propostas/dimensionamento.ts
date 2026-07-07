// Dimensionamento de engenharia (client-safe — sem custo).
// Portado do gerador estático.

import { MODS } from "./constantes";
import type {
  InversorForcado,
  InversorResultado,
  ModuloWp,
  TelhadoInput,
  TelhadoResultado,
} from "./types";

// Geração bruta por kWp por mês (kWh) — sem a margem de segurança.
export function geracaoPorKwpMes(hsp: number, performanceRatio: number): number {
  return hsp * performanceRatio * 30;
}

// Nº de módulos e potência necessários para atender o consumo.
export function dimensionarPorConsumo(
  consumoKwh: number,
  compensacaoPct: number,
  hsp: number,
  moduloWp: ModuloWp,
  performanceRatio: number,
  margemSeguranca: number,
): { modulos: number; potenciaKwp: number; geracaoMensalKwh: number } {
  const gpkSeg = geracaoPorKwpMes(hsp, performanceRatio) * margemSeguranca;
  if (consumoKwh <= 0 || gpkSeg <= 0) {
    return { modulos: 0, potenciaKwp: 0, geracaoMensalKwh: 0 };
  }
  const modulos = Math.ceil((consumoKwh * compensacaoPct * 1000) / moduloWp / gpkSeg);
  const potenciaKwp = (modulos * moduloWp) / 1000;
  return { modulos, potenciaKwp, geracaoMensalKwh: potenciaKwp * gpkSeg };
}

// Empacotamento de um telhado retangular: escolhe a melhor orientação
// (retrato × paisagem) e aplica o fator de aproveitamento.
export function empacotarTelhado(
  telhado: TelhadoInput,
  moduloWp: ModuloWp,
): TelhadoResultado | null {
  const { largura: l, comprimento: c, aproveitamento: f } = telhado;
  if (l <= 0 || c <= 0) return null;
  const mod = MODS[moduloWp];
  const retrato = Math.floor(l / mod.l) * Math.floor(c / mod.c);
  const paisagem = Math.floor(l / mod.c) * Math.floor(c / mod.l);
  const bruto = Math.max(retrato, paisagem);
  const orientacao = retrato >= paisagem ? "Retrato" : "Paisagem";
  const modulos = Math.floor(bruto * (f / 100));
  const areaM2 = modulos * mod.l * mod.c;
  return {
    modulos,
    potenciaKwp: (modulos * moduloWp) / 1000,
    areaM2,
    ocupacaoPct: (areaM2 / (l * c)) * 100,
    orientacao,
  };
}

// Total do telhado disponível (soma de todos os telhados informados).
export function totalTelhados(
  telhados: TelhadoInput[],
  moduloWp: ModuloWp,
): { modulos: number; potenciaKwp: number; detalhes: TelhadoResultado[] } {
  let modulos = 0;
  let potenciaKwp = 0;
  const detalhes: TelhadoResultado[] = [];
  for (const t of telhados) {
    const r = empacotarTelhado(t, moduloWp);
    if (r) {
      modulos += r.modulos;
      potenciaKwp += r.potenciaKwp;
      detalhes.push(r);
    }
  }
  return { modulos, potenciaKwp, detalhes };
}

// Escolha do inversor: 3+ telhados força microinversor; senão respeita o
// forçado ou usa string por padrão.
export function resolverInversor(
  qtdTelhados: number,
  forcado: InversorForcado,
): "string" | "micro" {
  if (qtdTelhados > 2) return "micro";
  if (forcado === "micro") return "micro";
  return "string";
}

// Dimensiona inversor(es) e disjuntor de proteção.
export function calcularInversor(
  potenciaKwp: number,
  tipo: "string" | "micro",
): InversorResultado {
  if (tipo === "micro") {
    const quantidade = Math.ceil(potenciaKwp / 2.5);
    const potenciaKw = quantidade * 2.5;
    const disjuntorA = Math.ceil((potenciaKw * 1000) / (220 * 0.9));
    return {
      tipo,
      quantidade,
      potenciaKw,
      disjuntorA,
      label: `${quantidade}× micro 2,5kW`,
      disjuntor: `Disj. ${disjuntorA}A`,
    };
  }
  let potenciaKw: number;
  let descricao: string;
  if (potenciaKwp <= 15) {
    potenciaKw = 10;
    descricao = "Inv. 10kW (≤15kWp)";
  } else if (potenciaKwp <= 22.5) {
    potenciaKw = 15;
    descricao = "Inv. 15kW tri (≤22,5kWp)";
  } else {
    potenciaKw = Math.ceil(potenciaKwp / 1.5);
    descricao = `Inv. ${potenciaKw}kW`;
  }
  const disjuntorA = Math.ceil((potenciaKw * 1000) / (Math.sqrt(3) * 220 * 0.9));
  return {
    tipo,
    quantidade: 1,
    potenciaKw,
    disjuntorA,
    label: descricao,
    disjuntor: `Disj. ${disjuntorA}A`,
  };
}
