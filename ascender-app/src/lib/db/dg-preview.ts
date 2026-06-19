import "dotenv/config";
import { dgGet } from "@/lib/digitalgrid/client";

type Page<T> = { count?: number; next?: string | null; results?: T[] };

async function main() {
  // entities (clientes do DG)
  const e = await dgGet<Page<Record<string, unknown>>>("/entities/", { page: 1 });
  const ents = e.results ?? [];
  console.log(`\n=== /entities/ === count=${e.count} | next=${!!e.next}`);
  console.log("campos:", Object.keys(ents[0] ?? {}).join(", "));
  for (const r of ents.slice(0, 4))
    console.log(
      JSON.stringify({
        id: r.id,
        name: r.name,
        document_type: r.document_type,
        document: r.document,
        number: r.number,
        installations: Array.isArray(r.installations)
          ? `[${(r.installations as unknown[]).length}]`
          : r.installations,
      }),
    );

  // installations: main_document preenchido? owner? generator?
  let withDoc = 0;
  let total = 0;
  let page = 1;
  const sample: Record<string, unknown>[] = [];
  while (true) {
    const data = await dgGet<Page<Record<string, unknown>>>("/installations/", { page });
    const items = data.results ?? [];
    if (items.length === 0) break;
    for (const it of items) {
      total += 1;
      if (it.main_document) withDoc += 1;
      if (sample.length < 4) sample.push(it);
    }
    if (!data.next) break;
    page += 1;
    if (page > 100) break;
  }
  console.log(`\n=== /installations/ === total=${total} | com main_document=${withDoc}`);
  for (const r of sample)
    console.log(
      JSON.stringify({
        number: r.number,
        owner: r.owner,
        main_document: r.main_document,
        nickname: r.nickname,
        generator: r.generator,
        distributor: r.distributor,
      }),
    );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
