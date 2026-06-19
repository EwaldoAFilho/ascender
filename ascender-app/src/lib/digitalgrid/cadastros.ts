import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  clientes,
  distribuidoras,
  unidadesConsumidoras,
  usinas,
} from "@/lib/db/schema";
import { dgGet } from "./client";

type DgRow = Record<string, unknown>;
type DgPage<T> = { count?: number; next?: string | null; results?: T[] };

const onlyDigits = (v: unknown): string =>
  typeof v === "string" || typeof v === "number"
    ? String(v).replace(/\D/g, "")
    : "";

const normName = (v: unknown): string =>
  (typeof v === "string" ? v : "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v : typeof v === "number" ? String(v) : null;

async function fetchAllDg<T extends DgRow>(path: string): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  while (true) {
    const data = await dgGet<DgPage<T>>(path, { page });
    const items = data.results ?? [];
    out.push(...items);
    if (!data.next || items.length === 0) break;
    page += 1;
    if (page > 100) break;
  }
  return out;
}

// ===== Relatório de conciliação (somente leitura, para a tela) =====
export type ConciliacaoReport = {
  clientes: { dgTotal: number; vinculados: number; aImportar: number; preview: string[] };
  usinas: { dgTotal: number; vinculados: number; aImportar: number; preview: string[] };
  ucs: { dgTotal: number; vinculados: number; aImportar: number; preview: string[] };
};

export async function getConciliacaoReport(): Promise<ConciliacaoReport> {
  const db = getDb();
  const [entities, generators, installations, cliRows, usiRows, ucRows] =
    await Promise.all([
      fetchAllDg("/entities/"),
      fetchAllDg("/generators/"),
      fetchAllDg("/installations/"),
      db.select().from(clientes),
      db.select().from(usinas),
      db.select().from(unidadesConsumidoras),
    ]);

  const cliDocs = new Set(cliRows.map((c) => onlyDigits(c.documento)).filter(Boolean));
  const usiCodigos = new Set(
    usiRows.map((u) => u.codigoDigitalGrid).filter(Boolean) as string[],
  );
  const usiNomes = new Set(usiRows.map((u) => normName(u.nome)));
  const ucCodigos = new Set(ucRows.map((u) => u.codigoInstalacao));

  const cliFaltam = entities.filter((e) => !cliDocs.has(onlyDigits(e.document)));
  const usiFaltam = generators.filter(
    (g) =>
      !(str(g.number) && usiCodigos.has(str(g.number) as string)) &&
      !usiNomes.has(normName(g.nickname)),
  );
  const ucFaltam = installations.filter((i) => !ucCodigos.has(str(i.number) ?? ""));

  return {
    clientes: {
      dgTotal: entities.length,
      vinculados: entities.length - cliFaltam.length,
      aImportar: cliFaltam.length,
      preview: cliFaltam.slice(0, 6).map((e) => String(e.name ?? e.document)),
    },
    usinas: {
      dgTotal: generators.length,
      vinculados: generators.length - usiFaltam.length,
      aImportar: usiFaltam.length,
      preview: usiFaltam
        .slice(0, 6)
        .map((g) => `${g.nickname ?? "(sem nome)"} — cód. ${g.number}`),
    },
    ucs: {
      dgTotal: installations.length,
      vinculados: installations.length - ucFaltam.length,
      aImportar: ucFaltam.length,
      preview: ucFaltam
        .slice(0, 6)
        .map((i) => `${i.number}${i.nickname ? ` — ${i.nickname}` : ""}`),
    },
  };
}

// ===== Importação (escrita no NOSSO banco; nada é alterado no Digital Grid) =====
export type ConciliacaoResult = {
  clientesCriados: number;
  usinasVinculadas: number;
  usinasSemVinculo: number;
  ucsCriadas: number;
};

export async function importarCadastrosDg(): Promise<ConciliacaoResult> {
  const db = getDb();
  const [entities, generators, installations] = await Promise.all([
    fetchAllDg("/entities/"),
    fetchAllDg("/generators/"),
    fetchAllDg("/installations/"),
  ]);

  let clientesCriados = 0;
  let usinasVinculadas = 0;
  let usinasSemVinculo = 0;
  let ucsCriadas = 0;

  // 1) Clientes (chave: documento em dígitos) ----------------------------------
  const cliRows = await db.select().from(clientes);
  const cliPorDoc = new Map<string, string>(); // docDigits -> clienteId
  for (const c of cliRows) {
    const d = onlyDigits(c.documento);
    if (d) cliPorDoc.set(d, c.id);
  }
  for (const e of entities) {
    const doc = onlyDigits(e.document);
    if (!doc || cliPorDoc.has(doc)) continue;
    const nome = str(e.name) ?? `Cliente ${doc}`;
    const tipo = e.document_type === "CPF" ? "prosumidor" : "cliente";
    const [row] = await db
      .insert(clientes)
      .values({ nome, documento: doc, tipo, status: "ativo" })
      .returning({ id: clientes.id });
    cliPorDoc.set(doc, row.id);
    clientesCriados += 1;
  }

  // 2) Usinas (chave: codigoDigitalGrid; fallback por nome) ---------------------
  const usiRows = await db.select().from(usinas);
  const usiPorCodigo = new Map<string, string>();
  const usiPorNome = new Map<string, { id: string; codigo: string | null }>();
  for (const u of usiRows) {
    if (u.codigoDigitalGrid) usiPorCodigo.set(u.codigoDigitalGrid, u.id);
    usiPorNome.set(normName(u.nome), { id: u.id, codigo: u.codigoDigitalGrid });
  }
  // NÃO cria usinas (os nomes SolisCloud × Digital Grid divergem e não há chave
  // automática confiável). Apenas enriquece a usina existente quando o nome bate
  // exatamente; o restante fica para vínculo manual (campo "Código Digital Grid").
  for (const g of generators) {
    const numero = str(g.number);
    if (!numero) continue;
    if (usiPorCodigo.has(numero)) continue; // já vinculada por código
    const porNome = usiPorNome.get(normName(g.nickname));
    if (porNome && !porNome.codigo) {
      await db
        .update(usinas)
        .set({ codigoDigitalGrid: numero, updatedAt: new Date() })
        .where(eq(usinas.id, porNome.id));
      usiPorCodigo.set(numero, porNome.id);
      usinasVinculadas += 1;
    } else if (!porNome) {
      usinasSemVinculo += 1;
    }
  }

  // 3) Distribuidoras existentes (para vincular as UCs, sem criar novas) --------
  const distRows = await db.select().from(distribuidoras);
  const distPorNome = distRows.map((d) => ({ id: d.id, norm: normName(d.nome) }));
  const acharDistribuidora = (nome: unknown): string | null => {
    const n = normName(nome);
    if (!n) return null;
    const hit = distPorNome.find((d) => n.includes(d.norm) || d.norm.includes(n));
    return hit?.id ?? null;
  };

  // 4) UCs (chave: codigoInstalacao; cliente via owner; cria cliente se faltar) -
  const ucRows = await db.select().from(unidadesConsumidoras);
  const ucCodigos = new Set(ucRows.map((u) => u.codigoInstalacao));
  for (const inst of installations) {
    const numero = str(inst.number);
    if (!numero || ucCodigos.has(numero)) continue;

    const ownerDoc = onlyDigits(inst.owner);
    let clienteId = ownerDoc ? cliPorDoc.get(ownerDoc) : undefined;
    if (!clienteId) {
      // Cria o cliente a partir da própria instalação (nickname + owner).
      const nome = str(inst.nickname) ?? `Cliente ${ownerDoc || numero}`;
      const [row] = await db
        .insert(clientes)
        .values({
          nome,
          documento: ownerDoc,
          tipo: "cliente",
          status: "ativo",
        })
        .returning({ id: clientes.id });
      clienteId = row.id;
      if (ownerDoc) cliPorDoc.set(ownerDoc, row.id);
      clientesCriados += 1;
    }

    await db.insert(unidadesConsumidoras).values({
      clienteId,
      codigoInstalacao: numero,
      distribuidoraId: acharDistribuidora(inst.distributor),
      consumoMedioKwh: 0,
      ativo: !numero.includes("CANCEL"),
    });
    ucCodigos.add(numero);
    ucsCriadas += 1;
  }

  return { clientesCriados, usinasVinculadas, usinasSemVinculo, ucsCriadas };
}
