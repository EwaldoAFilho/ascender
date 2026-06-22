# REVISÃO — Fase 2E · GenerationHeatmap

Branch: `ux/fase-2e-generation-heatmap`

> **Método:** revisão por **código** + **consulta ao banco real** (query) e
> raciocínio determinístico do componente (puro). **Sem navegador/captura** →
> tema/pixel exigem **olho humano** (👁).

Legenda: ✔ verificado · 👁 requer olho humano · ⚠ observação

---

## 1. Ajuste aplicado nesta revisão (pequeno, seguro)

**Query sem filtro de ano** (o PLANO dizia "competências do ano"). Adicionado
**`WHERE competencia LIKE '<ano corrente>-%'`** — hoje inócuo (o sync só grava o
ano atual), mas evita **acúmulo de colunas ao virar o ano**. Somente leitura.

> Nota: `getHistoricoGeracaoMensal()` (pré-existente) também não filtra ano — é
> dívida **separada**, fora do escopo desta fase.

## 2. Cenários (código + dados reais)

Validação no banco real: **8 usinas × 6 meses (2026)**, **1 zero real** presente.

| Cenário | Saída | OK |
|---|---|---|
| Sem dados em `medicoes_geracao` | `competencias=[]`/`linhas=[]` → estado vazio | ✔ |
| Uma usina com poucos meses | linha com células `null` nos meses ausentes | ✔ (ex.: usina que começa em abril) |
| Várias usinas, meses diferentes | colunas = união das competências; faltantes = `null` | ✔ |
| Mês corrente "(parcial)" | `colLabel` anexa "(parcial)" quando `c === currentCompetencia` | ✔ |
| Célula sem registro = "sem dado" | `null` → `is-empty` (tracejada, neutra) + glifo "·" + tooltip "sem dado" | ✔ |
| **Zero real × sem dado** | `0` → tom **faint** (gold 12%) + tooltip **"0 kWh"** (não `is-empty`); `null` → tracejada "sem dado" → **diferenciados** | ✔ (há 1 zero real no banco) |
| Valores muito altos | `fmt` pt-BR (milhar); cor relativa ao máx | ✔ |
| Valores muito baixos | tom faint; proporcional | ✔ |
| Muitas usinas | muitas linhas; rola na página | ✔ |
| Muitos meses | colunas além da largura → **scroll-x** | ✔ |
| Responsivo scroll horizontal | `.heatmap-scroll { overflow-x:auto }`; rótulo de usina **sticky** à esquerda | ✔ código |

## 3. Revisão da query `geracaoPorUsinaMes()` (tarefa 3)

- ✔ **Somente leitura** (`select`; sem insert/update/delete).
- ✔ **Não altera regra de geração** (apenas lê/soma).
- ✔ **Ano correto** — agora com `WHERE competencia LIKE '<ano>-%'` (fix §1).
- ✔ **Soma correta por usina × competência** — `sum(geracao_kwh)` agrupado por
  `usina.nome, competencia` (cobre múltiplas `fonte` por competência).
- ✔ **Sem duplicação por join** — `innerJoin` por FK `usina_id` (1 usina por
  medição); agregado por grupo. ⚠ *Caveat raro:* agrupa por **nome** — duas
  usinas com o **mesmo nome** se fundiriam (nomes costumam ser únicos).
- ✔ **Ordenação** por `usina` e `competencia` (asc); `competencias` reordenadas
  no JS.

## 4. Revisão visual (👁 + código)

| Item | Status | Observação |
|---|---|---|
| Executivo tema escuro | 👁 | `color-mix(--brand-gold, --surface-soft)` adapta ao tema. |
| Executivo tema claro | 👁 | idem. |
| Desktop | ✔ código | grid `120px + 46px×N`; cabe e/ou rola. |
| Mobile | ✔ código | **scroll-x**; rótulo de usina fixo à esquerda. |
| Painel ao final polui? | ✔ | compacto, **no fim** da página (não empurra o topo). |
| Legível com poucas/muitas usinas | ✔ código | linhas com `ellipsis`; rampa única. |
| Scroll-x no mobile aceitável | 👁 (✔ código) | padrão de heatmap; sticky ajuda. |
| "Sem dado" ≠ geração zero | ✔ | tracejada/neutra vs faint sólida + tooltip "0 kWh". |
| "(parcial)" claro | ✔ / 👁 | texto no cabeçalho da coluna corrente. |

## 5. Executivo é o melhor local? (tarefa 5 — só documentar)

- **Sim para a v1:** é **server component** (query direta, **sem endpoint novo**) e
  o heatmap usina×mês é **consolidado** (combina com o Executivo). Painel ao final
  não polui o topo.
- **Futuro (não agora):** faria sentido também em **Geração** e/ou **Análise**
  (telas de histórico/análise). Como são **client components**, exigiria um
  **endpoint de leitura** — **não** nesta fase (regra "não criar endpoint"). Fica
  **documentado** como evolução.

## 6. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" (exit 0).
- **Query validada no banco real** (com filtro de ano: 8 usinas × 6 meses; 1 zero
  real confirmado para o teste 0×sem-dado).

## 7. Conclusão

**Aprovado para merge.** Cenários corretos (incl. **0 real ≠ sem dado** e
"(parcial)"), query **somente leitura** e agora **filtrada por ano**, sem
duplicação. Ajuste desta revisão: **filtro de ano** na query. Pendente apenas o
**carimbo visual humano** (temas/mobile no deploy).

Recomendação registrada (não aplicada): avaliar o heatmap também em
Geração/Análise no futuro (exige endpoint de leitura).

> **Sem merge.** Nenhuma nova fase iniciada.
