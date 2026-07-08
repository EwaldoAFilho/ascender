import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/db/tenant-context";
import { faturasDg, rateiosDg } from "@/lib/db/schema";
import { dgGet } from "./client";

// Helper para referenciar a linha em conflito (EXCLUDED.<col>) no upsert.
function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

type DgPage<T> = { count: number; next: string | null; results: T[] };
type DgBill = Record<string, unknown>;

// Converte string/number do Digital Grid em número (valores vêm como "211.73").
function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number") return String(v);
  return null;
}

// "2025-09-01" -> "2025-09"
function competenciaFromRef(ref: unknown): string {
  const s = str(ref);
  return s ? s.slice(0, 7) : "";
}

function mapBill(b: DgBill) {
  const gm = (b.generation_month ?? {}) as Record<string, unknown>;
  return {
    dgBillId: Number(b.id),
    competencia: competenciaFromRef(gm.reference),
    referenceDate: str(gm.reference),
    faturaNumero: typeof b.number === "number" ? b.number : null,
    installationNumber: str(b.installation),
    installationClass: str(b.installation_class),
    paymentStatus: str(b.payment_status) ?? "",
    valorEnergia: num(b.value),
    valorTotal: num(b.total_value),
    valorPago: num(b.paid_amount),
    economia: num(b.amount_saved),
    consumoKwh: num(b.consumption),
    energiaInjetadaKwh: num(b.injected_energy),
    vencimento: str(b.due_date),
    pagoEm: str(b.paid_at),
    raw: b as Record<string, unknown>,
    sincronizadoEm: new Date(),
  };
}

/**
 * Sincroniza todas as faturas do Digital Grid (`GET /bills/`, paginado) para a
 * tabela `faturas_dg`, fazendo upsert por `dg_bill_id`. Somente leitura no DG.
 */
export async function syncFaturasDg(): Promise<{
  paginas: number;
  faturas: number;
}> {
  const db = getDb();
  // Sync sem sessão (script/worker): usa o tenant do contexto atual (fallback = tenant 0).
  const tenantId = getCurrentTenantId();
  let page = 1;
  let paginas = 0;
  let total = 0;

  while (true) {
    const data = await dgGet<DgPage<DgBill>>("/bills/", { page });
    const bills = data.results ?? [];
    if (bills.length === 0) break;
    paginas += 1;

    const rows = bills
      .filter((b) => b.id != null)
      .map(mapBill)
      .filter((r) => Number.isFinite(r.dgBillId));

    if (rows.length > 0) {
      await db
        .insert(faturasDg)
        .values(rows.map((r) => ({ ...r, tenantId })))
        .onConflictDoUpdate({
          target: [faturasDg.tenantId, faturasDg.dgBillId],
          set: {
            competencia: sqlExcluded("competencia"),
            referenceDate: sqlExcluded("reference_date"),
            faturaNumero: sqlExcluded("fatura_numero"),
            installationNumber: sqlExcluded("installation_number"),
            installationClass: sqlExcluded("installation_class"),
            paymentStatus: sqlExcluded("payment_status"),
            valorEnergia: sqlExcluded("valor_energia"),
            valorTotal: sqlExcluded("valor_total"),
            valorPago: sqlExcluded("valor_pago"),
            economia: sqlExcluded("economia"),
            consumoKwh: sqlExcluded("consumo_kwh"),
            energiaInjetadaKwh: sqlExcluded("energia_injetada_kwh"),
            vencimento: sqlExcluded("vencimento"),
            pagoEm: sqlExcluded("pago_em"),
            raw: sqlExcluded("raw"),
            sincronizadoEm: new Date(),
          },
        });
      total += rows.length;
    }

    if (!data.next) break;
    page += 1;
    if (page > 100) break; // trava de segurança
  }

  return { paginas, faturas: total };
}

type DgQuota = Record<string, unknown>;

/**
 * Sincroniza o rateio do Digital Grid (`GET /estimated-quota/`, paginado) para
 * `rateios_dg`. Resolve a competência e o nome da usina cruzando
 * `generation_month` → `/monthly-generation/` (reference, generator) →
 * `/generators/` (nickname). Somente leitura no DG.
 */
export async function syncRateioDg(): Promise<{
  paginas: number;
  rateios: number;
}> {
  const db = getDb();
  // Sync sem sessão (script/worker): usa o tenant do contexto atual (fallback = tenant 0).
  const tenantId = getCurrentTenantId();

  // 1) Mapa generation_month_id -> { reference, generator }
  const mgMap = new Map<
    number,
    { reference: string | null; generator: string | null }
  >();
  let mp = 1;
  while (true) {
    const data = await dgGet<DgPage<Record<string, unknown>>>(
      "/monthly-generation/",
      { page: mp },
    );
    const items = data.results ?? [];
    if (items.length === 0) break;
    for (const it of items) {
      const id = Number(it.id);
      if (Number.isFinite(id)) {
        mgMap.set(id, {
          reference: str(it.reference),
          generator: str(it.generator),
        });
      }
    }
    if (!data.next) break;
    mp += 1;
    if (mp > 100) break;
  }

  // 2) Mapa generator_number -> nickname (nome da usina)
  const genMap = new Map<string, string | null>();
  {
    const data = await dgGet<DgPage<Record<string, unknown>>>("/generators/", {
      page: 1,
    });
    for (const it of data.results ?? []) {
      const number = str(it.number);
      if (number) genMap.set(number, str(it.nickname));
    }
  }

  // 3) Paginar estimated-quota e fazer upsert
  let page = 1;
  let paginas = 0;
  let total = 0;
  while (true) {
    const data = await dgGet<DgPage<DgQuota>>("/estimated-quota/", { page });
    const quotas = data.results ?? [];
    if (quotas.length === 0) break;
    paginas += 1;

    // Deduplica por chave composta dentro do lote (evita conflito no mesmo INSERT).
    const byKey = new Map<string, ReturnType<typeof mapQuota>>();
    for (const q of quotas) {
      const row = mapQuota(q, mgMap, genMap);
      if (!Number.isFinite(row.generationMonthId) || row.generationMonthId <= 0)
        continue;
      byKey.set(
        `${row.generationMonthId}|${row.installation}|${row.ownerDocument}`,
        row,
      );
    }
    const rows = [...byKey.values()];

    if (rows.length > 0) {
      await db
        .insert(rateiosDg)
        .values(rows.map((r) => ({ ...r, tenantId })))
        .onConflictDoUpdate({
          target: [
            rateiosDg.tenantId,
            rateiosDg.generationMonthId,
            rateiosDg.installation,
            rateiosDg.ownerDocument,
          ],
          set: {
            competencia: sqlExcluded("competencia"),
            generatorNumber: sqlExcluded("generator_number"),
            usinaNome: sqlExcluded("usina_nome"),
            ownerName: sqlExcluded("owner_name"),
            percentual: sqlExcluded("percentual"),
            covering: sqlExcluded("covering"),
            consumoKwh: sqlExcluded("consumo_kwh"),
            creditosAcumulados: sqlExcluded("creditos_acumulados"),
            annotations: sqlExcluded("annotations"),
            raw: sqlExcluded("raw"),
            sincronizadoEm: new Date(),
          },
        });
      total += rows.length;
    }

    if (!data.next) break;
    page += 1;
    if (page > 100) break;
  }

  return { paginas, rateios: total };
}

function mapQuota(
  q: DgQuota,
  mgMap: Map<number, { reference: string | null; generator: string | null }>,
  genMap: Map<string, string | null>,
) {
  const gmId = Number(q.generation_month);
  const mg = mgMap.get(gmId);
  const generator = mg?.generator ?? null;
  return {
    generationMonthId: Number.isFinite(gmId) ? gmId : 0,
    competencia: mg?.reference ? mg.reference.slice(0, 7) : "",
    generatorNumber: generator,
    usinaNome: generator ? (genMap.get(generator) ?? null) : null,
    installation: str(q.installation) ?? "",
    ownerName: str(q.owner_name),
    ownerDocument: str(q.owner_document) ?? "",
    percentual: num(q.percentage),
    covering: num(q.covering),
    consumoKwh: num(q.consumption),
    creditosAcumulados: num(q.accumulated_credits),
    annotations: str(q.annotations),
    raw: q as Record<string, unknown>,
    sincronizadoEm: new Date(),
  };
}
