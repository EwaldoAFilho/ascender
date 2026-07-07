// Parâmetros de CUSTO e MARGEM — SENSÍVEIS.
// Este módulo lê os parâmetros do banco (tabela `parametros_proposta`, linha
// única com um JSON) e cai nos defaults quando não há registro. Deve ser
// importado apenas por código de servidor (server actions / server components),
// nunca por componentes "use client".

import { getDb } from "@/lib/db";
import { parametrosProposta } from "@/lib/db/schema";

export type FaixaKit = {
  kwpMax: number;
  precoMicro: number; // R$/kWp
  precoString: number; // R$/kWp
  trifasicoObrigatorio: boolean;
};

export type ParametrosProposta = {
  kit: FaixaKit[];
  ajusteString: number; // +/− R$/kWp sobre a base string
  ajusteMicro: number; // +/− R$/kWp sobre a base micro
  maoDeObraKwp: number; // R$/kWp
  materialAcKwp: number; // R$/kWp
  materialAcMin: number; // R$
  impostoPercent: number; // % sobre serviços
  margemPercent: number; // % (Sistema Necessário)
  margemPercentRentavel: number; // % (Telhado Rentável)
  soloDescontoKitKwp: number; // desconto no kit quando solo (R$/kWp)
  estruturaSoloPorModulo: number; // custo de estrutura de solo (R$/módulo)
  dataTabela: string; // rótulo livre da vigência da tabela
};

// Defaults = valores embutidos no gerador estático original.
export const PARAMETROS_PADRAO: ParametrosProposta = {
  kit: [
    { kwpMax: 2.8, precoMicro: 1655.88, precoString: 1475.86, trifasicoObrigatorio: false },
    { kwpMax: 5.6, precoMicro: 1566.62, precoString: 1475.86, trifasicoObrigatorio: false },
    { kwpMax: 8.4, precoMicro: 1561.34, precoString: 1475.86, trifasicoObrigatorio: false },
    { kwpMax: 11.2, precoMicro: 1568.71, precoString: 1432.76, trifasicoObrigatorio: false },
    { kwpMax: 14.0, precoMicro: 1576.08, precoString: 1389.65, trifasicoObrigatorio: false },
    { kwpMax: 16.8, precoMicro: 1569.12, precoString: 1397.42, trifasicoObrigatorio: true },
    { kwpMax: 19.6, precoMicro: 1562.16, precoString: 1405.18, trifasicoObrigatorio: true },
    { kwpMax: 22.4, precoMicro: 1555.2, precoString: 1412.95, trifasicoObrigatorio: true },
    { kwpMax: 25.2, precoMicro: 1555.2, precoString: 1398.76, trifasicoObrigatorio: true },
    { kwpMax: 28.0, precoMicro: 1555.2, precoString: 1384.56, trifasicoObrigatorio: true },
  ],
  ajusteString: 0,
  ajusteMicro: 0,
  maoDeObraKwp: 180,
  materialAcKwp: 130,
  materialAcMin: 1000,
  impostoPercent: 9,
  margemPercent: 20,
  margemPercentRentavel: 20,
  soloDescontoKitKwp: 150,
  estruturaSoloPorModulo: 150,
  dataTabela: "",
};

// Lê os parâmetros salvos, mesclados sobre os defaults. Nunca lança: em qualquer
// falha, retorna os defaults (o gerador precisa funcionar mesmo sem config).
export async function carregarParametros(): Promise<ParametrosProposta> {
  try {
    const rows = await getDb().select().from(parametrosProposta).limit(1);
    const salvo = rows[0]?.dados as Partial<ParametrosProposta> | undefined;
    if (!salvo) return PARAMETROS_PADRAO;
    return {
      ...PARAMETROS_PADRAO,
      ...salvo,
      kit: Array.isArray(salvo.kit) && salvo.kit.length ? salvo.kit : PARAMETROS_PADRAO.kit,
    };
  } catch {
    return PARAMETROS_PADRAO;
  }
}
