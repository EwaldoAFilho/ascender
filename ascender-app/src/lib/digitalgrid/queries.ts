import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  faturasDg,
  rateiosDg,
  type FaturaDg,
  type RateioDg,
} from "@/lib/db/schema";

export async function listFaturasDg(): Promise<FaturaDg[]> {
  return getDb()
    .select()
    .from(faturasDg)
    .orderBy(desc(faturasDg.competencia), desc(faturasDg.valorTotal));
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
