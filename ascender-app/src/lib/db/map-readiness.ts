import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * Prontidão dos dados geográficos das usinas para mapa (UF × pinos).
 * SOMENTE LEITURA — apenas SELECT. Não altera nada. CEP/endereço mascarados nos
 * exemplos. Rodar na produção (onde a migration 0014 já foi aplicada).
 */

const UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE",
  "TO",
]);

const num = (v: unknown): number => Number(v ?? 0);

async function main() {
  const db = getDb();

  // ----- Pré-check: colunas existem? (migration 0014) -----
  const cols = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'usinas'
      AND column_name IN ('estado', 'cep', 'endereco', 'bairro', 'latitude', 'longitude')
  `);
  const presentes = new Set(
    (cols.rows as Array<{ column_name: string }>).map((r) => r.column_name),
  );
  const faltando = [
    "estado",
    "cep",
    "endereco",
    "bairro",
    "latitude",
    "longitude",
  ].filter((c) => !presentes.has(c));

  console.log("\n=== PRONTIDÃO DE DADOS GEOGRÁFICOS — USINAS (somente leitura) ===\n");

  if (faltando.length > 0) {
    console.log(
      `⚠  Colunas ausentes em 'usinas': ${faltando.join(", ")}.\n` +
        "   A migration 0014 ainda não foi aplicada neste banco.\n" +
        "   Rode o deploy / 'npm run db:migrate' antes de medir.\n",
    );
    return;
  }

  // ----- Cobertura + qualidade (uma passada) -----
  const cov = (
    await db.execute(sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE coalesce(estado,'') <> '')::int AS com_uf,
        count(*) FILTER (WHERE coalesce(cep,'') <> '')::int AS com_cep,
        count(*) FILTER (WHERE regexp_replace(coalesce(cep,''),'[^0-9]','','g') ~ '^[0-9]{8}$')::int AS cep_8d_ok,
        count(*) FILTER (WHERE coalesce(cep,'') <> ''
              AND NOT (regexp_replace(cep,'[^0-9]','','g') ~ '^[0-9]{8}$'))::int AS cep_invalido,
        count(*) FILTER (WHERE coalesce(endereco,'') <> '')::int AS com_endereco,
        count(*) FILTER (WHERE coalesce(endereco,'') <> '' AND length(trim(endereco)) < 10)::int AS endereco_curto,
        count(*) FILTER (WHERE coalesce(bairro,'') <> '')::int AS com_bairro,
        count(*) FILTER (WHERE coalesce(estado,'') = '' AND coalesce(cep,'') = ''
              AND coalesce(endereco,'') = '' AND coalesce(bairro,'') = '')::int AS sem_geo,
        count(*) FILTER (WHERE latitude IS NOT NULL)::int AS com_lat,
        count(*) FILTER (WHERE longitude IS NOT NULL)::int AS com_lon,
        count(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL)::int AS com_coords
      FROM usinas
    `)
  ).rows[0] as Record<string, unknown>;

  const total = num(cov.total);
  const pct = (v: number) => (total > 0 ? `${Math.round((v / total) * 100)}%` : "0%");
  const comUf = num(cov.com_uf);
  const comCep = num(cov.com_cep);
  const cep8 = num(cov.cep_8d_ok);
  const cepInv = num(cov.cep_invalido);
  const comEnd = num(cov.com_endereco);
  const endCurto = num(cov.endereco_curto);
  const comBairro = num(cov.com_bairro);
  const semGeo = num(cov.sem_geo);
  const comLat = num(cov.com_lat);
  const comLon = num(cov.com_lon);
  const comCoords = num(cov.com_coords);
  const endOk = Math.max(0, comEnd - endCurto); // endereço preenchido e não-curto

  console.log("COBERTURA");
  console.log(`  total de usinas : ${total}`);
  console.log(`  com UF          : ${comUf} (${pct(comUf)})`);
  console.log(`  com CEP         : ${comCep} (${pct(comCep)})`);
  console.log(`  CEP 8 dígitos   : ${cep8} (${pct(cep8)})`);
  console.log(`  CEP inválido    : ${cepInv} (${pct(cepInv)})`);
  console.log(`  com endereço    : ${comEnd} (${pct(comEnd)})`);
  console.log(`  endereço curto  : ${endCurto} (${pct(endCurto)})`);
  console.log(`  endereço ok     : ${endOk} (${pct(endOk)})`);
  console.log(`  com bairro      : ${comBairro} (${pct(comBairro)})`);
  console.log(`  SEM dado geo    : ${semGeo} (${pct(semGeo)})`);
  console.log("\nCOORDENADAS (mapa por pino)");
  console.log(`  com latitude    : ${comLat} (${pct(comLat)})`);
  console.log(`  com longitude   : ${comLon} (${pct(comLon)})`);
  console.log(`  com AMBAS (pronta p/ pino) : ${comCoords} (${pct(comCoords)})`);

  // ----- Distribuição por UF + UFs inválidas -----
  const ufRows = (
    await db.execute(sql`
      SELECT upper(trim(estado)) AS uf, count(*)::int AS n
      FROM usinas WHERE coalesce(estado,'') <> ''
      GROUP BY 1 ORDER BY n DESC
    `)
  ).rows as Array<{ uf: string; n: number }>;

  console.log("\nDISTRIBUIÇÃO POR UF");
  if (ufRows.length === 0) {
    console.log("  (nenhuma UF preenchida)");
  } else {
    for (const r of ufRows) {
      const ok = UFS.has(r.uf) ? "" : "  <- INVÁLIDA";
      console.log(`  ${r.uf.padEnd(6)} ${num(r.n)}${ok}`);
    }
  }
  const ufInvalidas = ufRows.filter((r) => !UFS.has(r.uf));

  // ----- Exemplos mascarados -----
  const cepMasc = (
    await db.execute(sql`
      SELECT nome, left(regexp_replace(cep,'[^0-9]','','g'),5) || '-xxx' AS cep_masc
      FROM usinas WHERE coalesce(cep,'') <> '' ORDER BY nome LIMIT 8
    `)
  ).rows as Array<{ nome: string; cep_masc: string }>;

  console.log("\nEXEMPLOS — CEP MASCARADO (5 primeiros dígitos)");
  if (cepMasc.length === 0) console.log("  (nenhum CEP)");
  for (const r of cepMasc) console.log(`  ${r.nome} : ${r.cep_masc}`);

  const endTrunc = (
    await db.execute(sql`
      SELECT nome, left(trim(endereco),14) || '…' AS end_trunc
      FROM usinas WHERE coalesce(endereco,'') <> '' ORDER BY nome LIMIT 8
    `)
  ).rows as Array<{ nome: string; end_trunc: string }>;

  console.log("\nEXEMPLOS — ENDEREÇO TRUNCADO (14 caracteres)");
  if (endTrunc.length === 0) console.log("  (nenhum endereço)");
  for (const r of endTrunc) console.log(`  ${r.nome} : ${r.end_trunc}`);

  const semGeoRows = (
    await db.execute(sql`
      SELECT nome FROM usinas
      WHERE coalesce(estado,'') = '' AND coalesce(cep,'') = ''
        AND coalesce(endereco,'') = '' AND coalesce(bairro,'') = ''
      ORDER BY nome LIMIT 15
    `)
  ).rows as Array<{ nome: string }>;

  console.log("\nEXEMPLOS — USINAS SEM DADO GEOGRÁFICO (só o nome)");
  if (semGeoRows.length === 0) console.log("  (todas têm algum dado geográfico)");
  for (const r of semGeoRows) console.log(`  ${r.nome}`);

  // ----- Recomendação automática preliminar -----
  const ufPct = total > 0 ? (comUf / total) * 100 : 0;
  const cep8Pct = total > 0 ? (cep8 / total) * 100 : 0;
  const endOkPct = total > 0 ? (endOk / total) * 100 : 0;
  const ufValida = ufPct >= 80 && ufInvalidas.length === 0;

  console.log("\nRECOMENDAÇÃO AUTOMÁTICA PRELIMINAR");
  if (total === 0) {
    console.log("  • Nenhuma usina cadastrada — nada a medir.");
  } else {
    const linhas: string[] = [];
    if (ufValida) linhas.push("✅ Mapa por UF viável (UF ≥ 80% e válida).");
    else if (ufPct >= 80 && ufInvalidas.length > 0)
      linhas.push("⚠  UF ≥ 80% porém com UFs inválidas — normalizar antes do mapa por UF.");

    if (cep8Pct >= 70 || endOkPct >= 70)
      linhas.push("✅ Mapa por pinos viável após geocodificar lat/long (CEP 8d ou endereço ≥ 70%).");

    if (ufPct < 50 && cep8Pct < 50 && endOkPct < 50)
      linhas.push("⛔ Melhorar o cadastro (UF/CEP) antes de qualquer mapa.");

    if (linhas.length === 0)
      linhas.push("ℹ Dados intermediários — ver a matriz do RELATORIO_FASE_3A_1.");

    for (const l of linhas) console.log("  " + l);
    console.log(
      "  • Para experiência PREMIUM: caminho B (pinos com latitude/longitude\n" +
        "    persistidos — preenchimento manual no cadastro, sem geocodificação).",
    );
    console.log(
      `  • ${comCoords} de ${total} usina(s) já com lat+long (prontas para pino).`,
    );
  }

  console.log("\n(Somente leitura — nenhum dado foi alterado.)\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha ao medir prontidão do mapa:", e);
    process.exit(1);
  });
