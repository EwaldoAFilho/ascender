import { desc, eq, sql } from "drizzle-orm";
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

/**
 * Mapa UC (só dígitos) → documento do titular (só dígitos). Fonte: `owner_document`
 * do rateio (Digital Grid) e `documento` do cliente cadastrado (UC → cliente),
 * com o cadastro sobrescrevendo o rateio. Usado para conferir o CNPJ/CPF do PDF
 * antes de anexar a conta em lote.
 */
export async function getDocumentoPorInstalacao(): Promise<Map<string, string>> {
  const db = getDb();
  const soDigitos = (s: string) => s.replace(/\D/g, "");
  const [cadastro, rateio] = await Promise.all([
    db
      .select({
        inst: unidadesConsumidoras.codigoInstalacao,
        doc: clientes.documento,
      })
      .from(unidadesConsumidoras)
      .innerJoin(clientes, eq(clientes.id, unidadesConsumidoras.clienteId)),
    db
      .select({ inst: rateiosDg.installation, doc: rateiosDg.ownerDocument })
      .from(rateiosDg),
  ]);

  const map = new Map<string, string>();
  for (const r of rateio) {
    const inst = soDigitos(r.inst ?? "");
    const doc = soDigitos(r.doc ?? "");
    if (inst && doc) map.set(inst, doc);
  }
  for (const c of cadastro) {
    const inst = soDigitos(c.inst ?? "");
    const doc = soDigitos(c.doc ?? "");
    if (inst && doc) map.set(inst, doc);
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

/**
 * Conta faturas vencidas e ainda não quitadas (leitura agregada, sem regra de
 * negócio nova): vencimento anterior a hoje (fuso de São Paulo) e valor pago
 * menor que o total. Usado pelo Health Score.
 */
export async function contarFaturasVencidasDg(): Promise<number> {
  const [r] = await getDb()
    .select({ n: sql<number>`count(*)` })
    .from(faturasDg)
    .where(
      sql`${faturasDg.vencimento} is not null
          and ${faturasDg.vencimento} < to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
          and coalesce(${faturasDg.valorPago}, 0) < coalesce(${faturasDg.valorTotal}, 0)`,
    );
  return Number(r?.n ?? 0);
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
