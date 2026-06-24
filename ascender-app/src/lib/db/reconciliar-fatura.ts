import "dotenv/config";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { faturasDg } from "@/lib/db/schema";

// Reconciliador de boleto — SOMENTE LEITURA (não grava nada).
// Para as UCs alvo, despeja os campos monetários do raw e testa fórmulas
// candidatas contra `total_value`, para descobrir qual termo falta na regra
// de cobrança/desconto (calibração das validações financeiras).
//
// Uso: npm run db:reconciliar-fatura  [-- --uc 2.654.166.012-62,1019883]

const args = process.argv.slice(2);
const ucIdx = args.indexOf("--uc");
const ucsAlvo =
  ucIdx >= 0 && args[ucIdx + 1]
    ? args[ucIdx + 1].split(",").map((s) => s.trim())
    : [
        "2.654.166.012-62",
        "2.353.782.012-00",
        "3.530.102.012-36",
        "1.986.095.012-34",
        "1019883", // FABIANO (fórmula fecha — controle)
        "2.045.438.012-52-CANCEL",
      ];

const n = (raw: Record<string, unknown>, k: string): number => {
  const v = raw[k];
  if (v == null) return 0;
  const x = parseFloat(String(v));
  return Number.isFinite(x) ? x : 0;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

async function main() {
  const db = getDb();
  const faturas = await db
    .select()
    .from(faturasDg)
    .orderBy(desc(faturasDg.competencia));

  console.log("\n#############################################################");
  console.log("  RECONCILIADOR DE BOLETO — somente leitura");
  console.log("#############################################################");

  for (const alvo of ucsAlvo) {
    const f = faturas.find((x) => x.installationNumber === alvo);
    if (!f || !f.raw) {
      console.log(`\n[${alvo}] (sem fatura)`);
      continue;
    }
    const raw = f.raw as Record<string, unknown>;
    const total = n(raw, "total_value");
    const semDesc = n(raw, "total_amount_without_discount");
    const saved = n(raw, "amount_saved");
    const light = n(raw, "lightning");
    const extra = n(raw, "extra_charges");
    const charges = n(raw, "charges");
    const distrib = n(raw, "total_amount_distributor");
    const compDesc = n(raw, "compensated_energy_value_with_discount");
    const taxesRef = n(raw, "taxes_refunded");
    const fiob = n(raw, "fiob_refund_value");
    const finAdj = n(raw, "financial_adjustment");
    const eventual = n(raw, "eventual_discount");
    const agentDisc = n(raw, "agent_discount");

    console.log(`\n===== [${alvo}] competência ${f.competencia} | classe ${raw.installation_class} =====`);
    console.log(
      `  total_value=${total} | total_sem_desconto=${semDesc} | total_distribuidor=${distrib} | value=${n(raw, "value")}`,
    );
    console.log(
      `  amount_saved=${saved} | agent_discount=${agentDisc}% | eventual_discount=${eventual}`,
    );
    console.log(
      `  lightning=${light} | extra_charges=${extra} | charges=${charges} | financial_adjustment=${finAdj}`,
    );
    console.log(
      `  taxes_refunded=${taxesRef} | fiob_refund=${fiob} | compensated_energy_value_with_discount=${compDesc}`,
    );
    console.log(
      `  consumption=${n(raw, "consumption")} | injected=${n(raw, "injected_energy")} | compensated_gd2=${n(raw, "compensated_energy_gd2")} | contracted_kwh=${n(raw, "contracted_kwh")}`,
    );

    // Candidatos para a COBRANÇA (alvo = total_value):
    const cobranca: Record<string, number> = {
      "f1 semDesc - saved + light + extra": semDesc - saved + light + extra,
      "f2 distribuidor - saved": distrib - saved,
      "f3 semDesc - saved - compDesc + light": semDesc - saved - compDesc + light,
      "f4 semDesc - saved - eventual + light": semDesc - saved - eventual + light,
      "f5 distribuidor + light - saved": distrib + light - saved,
    };
    console.log("  -- cobrança (alvo total_value=" + r2(total) + ") --");
    for (const [nome, val] of Object.entries(cobranca))
      console.log(`     ${nome} = ${r2(val)}  (dif ${r2(total - val)})`);

    // Candidatos para o DESCONTO EFETIVO (alvo = agent_discount):
    const desc: Record<string, number> = {
      "saved / semDesc": semDesc ? (saved / semDesc) * 100 : 0,
      "saved / distribuidor": distrib ? (saved / distrib) * 100 : 0,
      "saved / (semDesc - light)": semDesc - light ? (saved / (semDesc - light)) * 100 : 0,
      "saved / compDesc": compDesc ? (saved / compDesc) * 100 : 0,
    };
    console.log("  -- desconto efetivo (alvo agent_discount=" + r2(agentDisc) + "%) --");
    for (const [nome, val] of Object.entries(desc))
      console.log(`     ${nome} = ${r2(val)}%`);
  }

  console.log("\n(Reconciliação em memória — nada foi gravado.)\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha na reconciliação:", e);
    process.exit(1);
  });
