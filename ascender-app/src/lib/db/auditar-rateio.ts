import "dotenv/config";
import { gerarRelatorioAuditoria } from "@/lib/auditoria/run";
import { ORDEM_SEVERIDADE } from "@/lib/auditoria/rules";
import type { Finding, Severidade } from "@/lib/auditoria/types";

// Auditoria de Rateio/Faturas — Fase 1 (SOMENTE LEITURA, não grava no banco).
// Uso:
//   npm run db:auditar-rateio              (relatório legível)
//   npm run db:auditar-rateio -- --json    (saída JSON p/ pipeline)
//   npm run db:auditar-rateio -- --limit 5 (exemplos por regra)

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const limIdx = args.indexOf("--limit");
const limite = limIdx >= 0 ? Number(args[limIdx + 1]) || 10 : 10;

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function imprimirLegivel(rel: Awaited<ReturnType<typeof gerarRelatorioAuditoria>>) {
  const d = rel.diagnostico;
  console.log("\n========================================================");
  console.log("  AUDITORIA DE RATEIO/FATURAS — Fase 1 (somente leitura)");
  console.log("========================================================");
  console.log(`  Gerado em: ${rel.geradoEm}`);
  console.log(`  Tarifa de referência (estimativas): ${brl(rel.tarifaRef)}/kWh`);

  console.log("\n--- DIAGNÓSTICO DE DADOS ---------------------------------");
  console.log(`  Rateios: ${d.rateios} | Faturas: ${d.faturas} | UCs cadastradas: ${d.ucsCadastradas}`);
  console.log(`  Competência recente — rateio: ${d.competenciaRateioRecente ?? "—"} | fatura: ${d.competenciaFaturaRecente ?? "—"}`);
  console.log(
    `  percentual: escala=${d.percentual.escala} (fator→100: ${d.percentual.fatorPara100}) ` +
      `min=${d.percentual.min} max=${d.percentual.max} média=${d.percentual.media.toFixed(2)}`,
  );
  console.log("  Junção DG ↔ cadastro local:");
  console.log(
    `    rateio.installation → UC: ${d.juncao.rateioComUc}/${d.juncao.rateioInstalacoes} (${d.juncao.rateioJoinPct}%)`,
  );
  console.log(
    `    fatura.installation → UC: ${d.juncao.faturaComUc}/${d.juncao.faturaInstalacoes} (${d.juncao.faturaJoinPct}%)`,
  );
  console.log(
    `    rateio.owner_document → cliente: ${d.juncao.rateioComCliente}/${d.juncao.rateioDocumentos} (${d.juncao.documentoJoinPct}%)`,
  );
  if (d.percentual.escala === "indefinida")
    console.log("  ⚠️  Escala do percentual INDEFINIDA — confira antes de confiar na regra de soma=100%.");
  if (d.juncao.rateioJoinPct < 80)
    console.log("  ⚠️  Junção UC baixa — muitas UCs do DG podem não estar cadastradas (calibre antes de agir).");

  // Agrupa por regra, ordenado por severidade.
  const porRegra = new Map<string, Finding[]>();
  for (const f of rel.findings) {
    const arr = porRegra.get(f.regra) ?? [];
    arr.push(f);
    porRegra.set(f.regra, arr);
  }
  // Ordena dentro de cada grupo por severidade — o cabeçalho reflete a pior.
  for (const lista of porRegra.values())
    lista.sort(
      (a, b) => ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade],
    );
  const regrasOrdenadas = [...porRegra.entries()].sort(
    (a, b) =>
      ORDEM_SEVERIDADE[a[1][0].severidade] - ORDEM_SEVERIDADE[b[1][0].severidade],
  );

  console.log("\n--- ACHADOS ---------------------------------------------");
  if (rel.findings.length === 0) {
    console.log("  ✅ Nenhuma inconsistência encontrada.");
  }
  const porSev: Record<Severidade, number> = { critica: 0, alta: 0, media: 0, info: 0 };
  let impactoTotal = 0;
  for (const f of rel.findings) {
    porSev[f.severidade] += 1;
    impactoTotal += f.impactoFinanceiro;
  }

  for (const [regra, lista] of regrasOrdenadas) {
    const impacto = lista.reduce((s, f) => s + f.impactoFinanceiro, 0);
    console.log(
      `\n  [${lista[0].severidade.toUpperCase()}] ${regra} — ${lista.length} achado(s)` +
        (impacto > 0 ? ` | impacto estimado: ${brl(impacto)}` : ""),
    );
    for (const f of lista.slice(0, limite)) {
      console.log(
        `    • ${f.entidadeRef}${f.competencia ? ` (${f.competencia})` : ""}: ${f.titulo}` +
          (f.impactoFinanceiro > 0 ? ` [${brl(f.impactoFinanceiro)}]` : ""),
      );
    }
    if (lista.length > limite) console.log(`    … +${lista.length - limite} (use --limit)`);
  }

  console.log("\n--- RESUMO ----------------------------------------------");
  console.log(
    `  Total: ${rel.findings.length} | 🔴 ${porSev.critica} · 🟠 ${porSev.alta} · 🟡 ${porSev.media} · 🔵 ${porSev.info}`,
  );
  console.log(`  Impacto financeiro estimado (somatório): ${brl(impactoTotal)}`);
  console.log("  (Fase 1: diagnóstico em memória — nada foi gravado no banco.)\n");
}

async function main() {
  const rel = await gerarRelatorioAuditoria();
  if (asJson) {
    console.log(JSON.stringify(rel, null, 2));
  } else {
    imprimirLegivel(rel);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha na auditoria de rateio/faturas:", e);
    process.exit(1);
  });
