import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  clientes,
  faturasDg,
  rateiosDg,
  unidadesConsumidoras,
  type FaturaDg,
  type RateioDg,
} from "@/lib/db/schema";

export async function listFaturasDg(): Promise<FaturaDg[]> {
  return getDb()
    .select()
    .from(faturasDg)
    .orderBy(desc(faturasDg.competencia), desc(faturasDg.valorTotal));
}

/**
 * Mapa `installationNumber` → nome do cliente. A fatura do Digital Grid só
 * guarda o código da UC; o nome vem do cadastro (UC → cliente) como fonte
 * primária e do `owner_name` do rateio (Digital Grid) como fallback, quando a
 * UC ainda não está cadastrada.
 */
export async function getClientePorInstalacao(): Promise<Map<string, string>> {
  const db = getDb();
  const [cadastro, rateio] = await Promise.all([
    db
      .select({
        inst: unidadesConsumidoras.codigoInstalacao,
        nome: clientes.nome,
      })
      .from(unidadesConsumidoras)
      .innerJoin(clientes, eq(clientes.id, unidadesConsumidoras.clienteId)),
    db
      .select({ inst: rateiosDg.installation, nome: rateiosDg.ownerName })
      .from(rateiosDg),
  ]);

  const map = new Map<string, string>();
  // Fallback primeiro; o cadastro sobrescreve quando existe.
  for (const r of rateio) {
    if (r.inst && r.nome) map.set(r.inst, r.nome);
  }
  for (const c of cadastro) {
    if (c.inst && c.nome) map.set(c.inst, c.nome);
  }
  return map;
}

export async function getResumoFaturasDg(): Promise<{
  total: number;
  pago: number;
  emAberto: number;
  qtd: number;
}> {
  const rows = await getDb()
    .select({ total: faturasDg.valorTotal, pago: faturasDg.valorPago })
    .from(faturasDg);
  const total = rows.reduce((s, r) => s + (r.total ?? 0), 0);
  const pago = rows.reduce((s, r) => s + (r.pago ?? 0), 0);
  return { total, pago, emAberto: Math.max(0, total - pago), qtd: rows.length };
}

export async function getUltimaSyncFaturasDg(): Promise<string | null> {
  const rows = await getDb()
    .select({ at: faturasDg.sincronizadoEm })
    .from(faturasDg)
    .orderBy(desc(faturasDg.sincronizadoEm))
    .limit(1);
  return rows[0]?.at ? rows[0].at.toISOString() : null;
}

export async function listRateioDg(): Promise<RateioDg[]> {
  return getDb()
    .select()
    .from(rateiosDg)
    .orderBy(
      desc(rateiosDg.competencia),
      desc(rateiosDg.usinaNome),
      desc(rateiosDg.percentual),
    );
}

export async function getUltimaSyncRateioDg(): Promise<string | null> {
  const rows = await getDb()
    .select({ at: rateiosDg.sincronizadoEm })
    .from(rateiosDg)
    .orderBy(desc(rateiosDg.sincronizadoEm))
    .limit(1);
  return rows[0]?.at ? rows[0].at.toISOString() : null;
}
