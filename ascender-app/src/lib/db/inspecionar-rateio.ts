import "dotenv/config";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { faturasDg, rateiosDg } from "@/lib/db/schema";

// Inspetor de rateio/faturas — SOMENTE LEITURA (não grava nada).
// Objetivo: decodificar a semântica real do Digital Grid antes de recalibrar as
// regras da auditoria:
//   A) soma de % agrupada por generation_month_id (gerador), não por nome.
//   B) o que é o campo `covering`.
//   C) como distinguir UC geradora de UC consumidora.
//
// Uso: npm run db:inspecionar-rateio   [-- --uc 1019883,160299,584909]

const args = process.argv.slice(2);
const ucIdx = args.indexOf("--uc");
const ucsAlvo =
  ucIdx >= 0 && args[ucIdx + 1]
    ? args[ucIdx + 1].split(",").map((s) => s.trim())
    : ["1019883", "160299", "584909", "584909-CANCEL", "16945"];

const r2 = (n: number) => Math.round(n * 100) / 100;

async function main() {
  const db = getDb();

  const rateios = await db
    .select()
    .from(rateiosDg)
    .orderBy(desc(rateiosDg.competencia));
  const faturas = await db.select().from(faturasDg);

  const competencias = [...new Set(rateios.map((r) => r.competencia))]
    .filter(Boolean)
    .sort()
    .reverse();
  const recente = competencias[0] ?? "";

  console.log("\n#############################################################");
  console.log("  INSPETOR DE RATEIO/FATURAS — somente leitura");
  console.log(`  Competência recente: ${recente} | rateios=${rateios.length} | faturas=${faturas.length}`);
  console.log("#############################################################");

  // ===== A) SOMA DE % POR generation_month_id (gerador) =====
  console.log("\n===== A) SOMA DE % POR generation_month_id (competência recente) =====");
  type G = {
    gmId: number;
    usina: string | null;
    gen: string | null;
    n: number;
    soma: number;
  };
  const porGm = new Map<number, G>();
  const usinaParaGm = new Map<string, Set<number>>();
  for (const r of rateios) {
    if (r.competencia !== recente) continue;
    const g = porGm.get(r.generationMonthId) ?? {
      gmId: r.generationMonthId,
      usina: r.usinaNome,
      gen: r.generatorNumber,
      n: 0,
      soma: 0,
    };
    g.n += 1;
    g.soma += r.percentual;
    porGm.set(r.generationMonthId, g);
    const key = r.usinaNome ?? "(sem nome)";
    const set = usinaParaGm.get(key) ?? new Set<number>();
    set.add(r.generationMonthId);
    usinaParaGm.set(key, set);
  }
  console.log("  gmId | usina | gerador | nUCs | somaPercentual");
  for (const g of [...porGm.values()].sort((a, b) => (b.soma - a.soma)))
    console.log(
      `   ${g.gmId} | ${g.usina ?? "?"} | ${g.gen ?? "?"} | ${g.n} | ${r2(g.soma)}%`,
    );
  console.log("\n  → nomes de usina com MAIS de um generation_month (causa de soma >100% por nome):");
  let colisao = false;
  for (const [usina, set] of usinaParaGm)
    if (set.size > 1) {
      colisao = true;
      console.log(`    ⚠️  ${usina}: ${set.size} generation_months [${[...set].join(", ")}]`);
    }
  if (!colisao) console.log("    (nenhuma colisão — cada usina tem 1 generation_month na competência)");

  // ===== B) COVERING — amostra crua =====
  console.log("\n===== B) COVERING — o que é? (amostra da competência recente) =====");
  const amostra = rateios.filter((r) => r.competencia === recente).slice(0, 12);
  console.log("  install | percentual | covering | consumo | creditos | pct/100 | covering*consumo");
  for (const r of amostra)
    console.log(
      `   ${r.installation} | ${r2(r.percentual)} | ${r2(r.covering)} | ${r2(r.consumoKwh)} | ${r2(r.creditosAcumulados)} | ${r2(r.percentual / 100)} | ${r2(r.covering * r.consumoKwh)}`,
    );
  const rawKeys = Object.keys(
    (rateios[0]?.raw as Record<string, unknown> | null) ?? {},
  );
  console.log(`\n  Campos do raw da cota (DG): ${rawKeys.join(", ")}`);
  console.log("\n  Raw bruto de 3 cotas (para enxergar todos os campos):");
  for (const r of amostra.slice(0, 3))
    console.log(`   [${r.installation}] ${JSON.stringify(r.raw)}`);

  // ===== C) GERADORA vs CONSUMIDORA =====
  console.log("\n===== C) GERADORA vs CONSUMIDORA =====");
  const classes = new Map<string, number>();
  for (const f of faturas) {
    const c = f.installationClass ?? "(vazio)";
    classes.set(c, (classes.get(c) ?? 0) + 1);
  }
  console.log("  faturas.installation_class (distintos):");
  for (const [c, n] of [...classes.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`    ${c}: ${n}`);

  // procura campos no raw que sugiram tipo/gerador
  const suspeitos = rawKeys.filter((k) =>
    /gener|type|class|consor|owner|kind|categ/i.test(k),
  );
  console.log(`\n  Campos do raw que podem indicar tipo/gerador: ${suspeitos.join(", ") || "(nenhum óbvio)"}`);

  console.log("\n  Raw das UCs sob suspeita (geradora?):");
  for (const alvo of ucsAlvo) {
    const linhas = rateios.filter((r) => r.installation === alvo);
    if (linhas.length === 0) {
      console.log(`   [${alvo}] (sem cota no rateio)`);
      continue;
    }
    const r = linhas[0];
    console.log(
      `   [${alvo}] usina=${r.usinaNome} owner=${r.ownerName} pct=${r2(r.percentual)} covering=${r2(r.covering)} consumo=${r2(r.consumoKwh)} creditos=${r2(r.creditosAcumulados)}`,
    );
    console.log(`        raw: ${JSON.stringify(r.raw)}`);
    const fat = faturas.find((f) => f.installationNumber === alvo);
    if (fat)
      console.log(
        `        fatura raw: class=${fat.installationClass} ${JSON.stringify(fat.raw)}`,
      );
  }

  console.log("\n(Inspeção em memória — nada foi gravado.)\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha na inspeção:", e);
    process.exit(1);
  });
