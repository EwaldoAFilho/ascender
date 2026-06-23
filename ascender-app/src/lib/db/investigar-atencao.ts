import "dotenv/config";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { faturasDg, rateiosDg } from "@/lib/db/schema";

// Investigação dos pontos de atenção — SOMENTE LEITURA (não grava nada).
//   1) Crédito acumulado é por UC ou por TITULAR? (duplicidade quando o dono tem >1 UC)
//   2) FABIANO MOTA MACHADO — série temporal das 2 UCs (lockstep => crédito do titular)
//   3) UCs "-CANCEL" / encerramento — agent_discount e situação real
//   4) Distribuição de agent_discount (base p/ a futura validação de desconto)
//
// Uso: npm run db:investigar-atencao  [-- --doc 77434978104]

const args = process.argv.slice(2);
const docIdx = args.indexOf("--doc");
const docAlvo = docIdx >= 0 ? (args[docIdx + 1] ?? "").replace(/\D/g, "") : "77434978104";

const r2 = (n: number) => Math.round(n * 100) / 100;
const soDig = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
const rawNum = (raw: unknown, key: string): number | null => {
  const o = raw as Record<string, unknown> | null;
  const v = o?.[key];
  if (v == null) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};
const rawStr = (raw: unknown, key: string): string | null => {
  const o = raw as Record<string, unknown> | null;
  const v = o?.[key];
  return v == null ? null : String(v);
};

async function main() {
  const db = getDb();
  const rateios = await db.select().from(rateiosDg).orderBy(desc(rateiosDg.competencia));
  const faturas = await db.select().from(faturasDg).orderBy(desc(faturasDg.competencia));

  const competencias = [...new Set(rateios.map((r) => r.competencia))]
    .filter(Boolean)
    .sort()
    .reverse();
  const recente = competencias[0] ?? "";

  console.log("\n#############################################################");
  console.log("  INVESTIGAÇÃO DOS PONTOS DE ATENÇÃO — somente leitura");
  console.log(`  Competência recente: ${recente}`);
  console.log("#############################################################");

  // ===== 1) Crédito é por UC ou por TITULAR? =====
  console.log("\n===== 1) CRÉDITO ACUMULADO — por UC ou por TITULAR? =====");
  type Por = { doc: string; nome: string | null; ucs: Map<string, number> };
  const porDoc = new Map<string, Por>();
  for (const r of rateios) {
    if (r.competencia !== recente) continue;
    const doc = soDig(r.ownerDocument);
    if (!doc) continue;
    const p = porDoc.get(doc) ?? { doc, nome: r.ownerName, ucs: new Map() };
    p.ucs.set(r.installation, r.creditosAcumulados);
    porDoc.set(doc, p);
  }
  let achouDup = false;
  for (const p of porDoc.values()) {
    if (p.ucs.size < 2) continue;
    const vals = [...p.ucs.values()].filter((v) => v > 0);
    if (vals.length < 2) continue;
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const lockstep = max > 0 && (max - min) / max < 0.05; // <5% de diferença
    if (max < 1000) continue;
    achouDup = true;
    console.log(
      `\n  Titular: ${p.nome} (${p.doc}) — ${p.ucs.size} UCs ${lockstep ? "⚠️  CRÉDITOS EM LOCKSTEP (provável crédito do TITULAR replicado por UC)" : ""}`,
    );
    for (const [uc, cred] of p.ucs) console.log(`    UC ${uc}: ${r2(cred)} kWh`);
  }
  if (!achouDup)
    console.log("  Nenhum titular com >1 UC e crédito alto na competência recente.");

  // ===== 2) FABIANO (ou --doc) — série temporal por UC =====
  console.log(`\n===== 2) TITULAR ${docAlvo} — série temporal por UC =====`);
  const linhas = rateios
    .filter((r) => soDig(r.ownerDocument) === docAlvo)
    .sort(
      (a, b) =>
        a.competencia.localeCompare(b.competencia) ||
        a.installation.localeCompare(b.installation),
    );
  if (linhas.length === 0) console.log("  (sem linhas para esse documento)");
  console.log("  competência | UC | consumo | creditosAcumulados");
  for (const r of linhas)
    console.log(
      `   ${r.competencia} | ${r.installation} | ${r2(r.consumoKwh)} | ${r2(r.creditosAcumulados)}`,
    );
  console.log(
    "  → se as UCs do mesmo titular têm o MESMO crédito por competência, é crédito do titular (não some os valores).",
  );

  // ===== 3) UCs -CANCEL / encerramento =====
  console.log("\n===== 3) UCs '-CANCEL' / encerramento =====");
  const cancels = [
    ...new Set(
      rateios.filter((r) => /cancel/i.test(r.installation)).map((r) => r.installation),
    ),
  ];
  if (cancels.length === 0) console.log("  Nenhuma UC com '-CANCEL' no rateio.");
  for (const inst of cancels) {
    const r = rateios.find((x) => x.installation === inst);
    const fat = faturas.find((f) => f.installationNumber === inst);
    const base = inst.replace(/-cancel$/i, "");
    const irmaAtiva = rateios.find((x) => x.installation === base);
    console.log(
      `\n  ${inst} — ${r?.ownerName ?? "?"} | usina=${r?.usinaNome ?? "?"} | creditos=${r2(r?.creditosAcumulados ?? 0)}`,
    );
    if (fat)
      console.log(
        `    fatura: agent_discount=${rawStr(fat.raw, "agent_discount")}% | payment_status=${rawStr(fat.raw, "payment_status")} | amount_saved=${rawStr(fat.raw, "amount_saved")} | total_value=${rawStr(fat.raw, "total_value")}`,
      );
    console.log(
      `    UC base "${base}" no rateio? ${irmaAtiva ? "SIM (existe versão sem -CANCEL)" : "não"}`,
    );
  }

  // ===== 4) Distribuição de agent_discount (base p/ validação de desconto) =====
  console.log("\n===== 4) DISTRIBUIÇÃO DE agent_discount (amostra p/ validação futura) =====");
  const descontos = new Map<string, number>();
  for (const f of faturas) {
    const d = rawNum(f.raw, "agent_discount");
    const k = d == null ? "(sem)" : `${r2(d)}%`;
    descontos.set(k, (descontos.get(k) ?? 0) + 1);
  }
  for (const [k, n] of [...descontos.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`    ${k}: ${n} fatura(s)`);

  console.log("\n(Investigação em memória — nada foi gravado.)\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha na investigação:", e);
    process.exit(1);
  });
