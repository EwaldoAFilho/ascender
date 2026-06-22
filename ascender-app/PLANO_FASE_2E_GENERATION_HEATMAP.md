# PLANO — Fase 2E · GenerationHeatmap

Heatmap de geração para enxergar padrões/quedas/dias fracos por período
(Grafana/Datadog/SolarEdge). **Versão mais conservadora possível, com dado real,
sem inventar/interpolar.** Início não tocada.

> **Fora do escopo:** SiteMap/mapa, NOC/SOC completo, deep-link avançado,
> migração, mock como dado real, alteração de regra de geração/meta.

---

## 1. Dados de geração que existem hoje

| Fonte | Granularidade | Classificação |
|---|---|---|
| `medicoes_geracao` (usina_id, competencia "AAAA-MM", geracao_kwh) | **mensal por usina** | **[real]** (persistido; sync do ano corrente) |
| `telemetria_estacao` (snapshots: energia_dia_kwh por captura) | diária por usina (via `max(energia_dia)` por dia) | **[derivado]** — cobertura **só desde que o worker começou** |
| `telemetria_estacao` (potencia_kw por captura) | horária (dia corrente) | **[derivado]** — só o **dia atual** |

## 2. Granularidade confiável

- **usina × mês** → **[real]** e persistida (`medicoes_geracao`). **Confiável.**
- **dia × usina** → **[derivado]** de snapshots; **lacunas** nos dias anteriores ao
  início da coleta → risco de "dia fraco" que é só "dia sem coleta". **Não agora.**
- **hora × dia** → só o **dia corrente** existe de forma densa → **não** dá heatmap
  multi-dia. **Não agora.**

## 3. Tipo de heatmap viável agora (escolhido)

**Heatmap `usina × mês`** (linhas = usinas, colunas = competências do ano,
célula = geração kWh, cor por intensidade relativa ao máximo). É o **melhor
primeiro passo**: real, consolidado, sem lacunas artificiais.

- **dia × usina** e **dia × mês** ficam como **próximos passos** (dependem de mais
  cobertura de snapshots / decisão de tratar lacunas).

## 4. Onde será exibido primeiro

**Executivo (`/executivo`)** — é **server component**, então uso uma **query de
leitura** direto no servidor **sem criar endpoint novo**. Geração e Análise são
**client** e exigiriam um endpoint novo (evitado pela regra "não alterar
endpoints"). O heatmap usina×mês é **consolidado** (combina com o Executivo);
será um **painel compacto ao final** da página para **não poluir** o topo.

## 5. Comparações que NÃO devem ser feitas

- **Mês corrente × meses cheios** como se fossem equivalentes — o mês atual está
  **incompleto** → marcado **"(parcial)"** na coluna; não concluir "queda".
- **Interpolar** meses sem registro — célula vazia vira **"sem dado"** (neutra),
  **não** zero.
- **Comparar usinas** com históricos de tamanhos diferentes sem sinalizar — a
  ausência de célula é explícita.

## 6. Riscos de interpretação (e mitigação)

| Risco | Mitigação |
|---|---|
| Mês parcial parecer "fraco" | Rótulo **"(parcial)"** na competência corrente. |
| Célula vazia parecer "zero geração" | Renderizar **"sem dado"** (cor neutra), não 0. |
| Escala de cor confundir | **Uma única rampa** (sem excesso de cor) + legenda min→máx. |
| Pouca cobertura (poucos meses) | Estado vazio quando não houver `medicoes`; grid pequeno é válido. |

## 7. Implementação (conservadora)

- **Query nova (somente leitura):** `geracaoPorUsinaMes()` em
  `lib/cadastros/queries.ts` — soma `geracao_kwh` por `usina × competencia`
  (`medicoes_geracao` ⋈ `usinas`). **Sem** alterar schema/regra/endpoints.
- **Componente** `GenerationHeatmap` — **apresentação pura** (recebe matriz),
  rampa única, legenda simples, **overflow-x** no estreito, tema claro/escuro,
  **estado vazio**. Sem mock, sem interpolação.

## 8. Arquivos prováveis de alteração

| Arquivo | Mudança |
|---|---|
| `src/components/GenerationHeatmap.tsx` | **criar** (apresentação pura). |
| `src/lib/cadastros/queries.ts` | **aditivo:** `geracaoPorUsinaMes()` (leitura). |
| `src/app/(dashboard)/executivo/page.tsx` | **aditivo:** painel "Mapa de geração (usina × mês)" ao final. |
| `src/app/globals.css` | **aditivo:** CSS do heatmap. |

> Sem novos endpoints, sem migração, sem tocar Início, sem mudar regra de
> geração/meta, schema, auth ou rotas.
