# PLANO — Fase 2D-A · ComparisonChart (Realizado vs Esperado/Meta)

Visualização comparativa **realizado × meta** com leitura executiva clara
(Grafana/SolarEdge/Tesla). Conservadora, aditiva, reversível. **A tela Início
fica congelada** nesta fase.

> **Fora do escopo (2D-A):** Heatmap, SiteMap/mapa, NOC/SOC completo,
> persistência de snapshots, deep-link avançado, migração, mock como dado real.

---

## 1. Onde aplicar primeiro

- **Executivo (`/executivo`)** — **tem os dados confiáveis já carregados** (ver
  §2). Aplicação inicial aqui.
- **Geração / Análise** — **não** nesta fase (ver §4: por que ficam de fora por
  ora).

## 2. Dados de geração que existem hoje (identificados no código)

No `executivo/page.tsx` (via `getUsinasComTelemetria()`):

| Dado | Origem | Observação |
|---|---|---|
| `realizadoMesKwh` (por usina) | telemetria no banco (`monthEnergyKwh`) | geração real do mês até agora |
| `esperadoMesKwh` (por usina) | **[derivado]** `geracaoEsperadaKwhMes × fração de dias do mês` | meta **proporcional até hoje** |
| `aderenciaPct` (por usina) | `realizado / esperado × 100` | já usado no PowerRing/AdherenceRow |
| `realTot` / `espTot` (consolidado) | soma dos acima (só usinas com meta > 0) | **base da comparação** |
| `hist.porMes` | `medicoes_geracao` agregado | geração mensal realizada (sem meta histórica) |

**Onde está a meta/esperado:** campo manual **`geracaoEsperadaKwhMes`** na tabela
`usinas` (meta **mensal**). O "esperado até hoje" é **derivado** dela
proporcionalmente aos dias decorridos (lógica já existente em
`getUsinasComTelemetria`, **não alterada**).

## 3. Natureza do "esperado"

- É **meta mensal manual** (`geracaoEsperadaKwhMes`), convertida em **meta até
  hoje** (proporcional aos dias) — `[derivado]`.
- **Não** há meta **diária real** nem meta **anual** persistida.

## 4. Comparações — confiáveis × a evitar agora

| Comparação | Status | Decisão |
|---|---|---|
| **Realizado (mês até hoje) × Meta até hoje** (consolidado) | **confiável** `[derivado]` | ✅ **implementar** (v1) |
| Realizado × Meta até hoje **por usina** | confiável | já existe (`AdherenceRow`); ComparisonChart fica pronto p/ reuso |
| **Hoje × esperado de hoje** | **[indisponível]** — não há meta diária real (dividir mês por dias é frágil c/ clima/estação) | ❌ não fazer |
| **Mês × meta cheia do mês** | enganoso no meio do mês | ❌ usar **meta até hoje**, não meta cheia |
| **Ano × meta anual** | **[depende de backend]** — não há meta anual | ❌ não fazer (não inventar) |
| Realizado mensal histórico × meta mensal | meta histórica não persiste | ❌ não fazer agora |

## 5. Riscos de interpretação (e mitigação)

| Risco | Mitigação |
|---|---|
| Confundir "meta até hoje" com "meta cheia do mês" | Rótulo explícito "Meta até hoje" + texto. |
| Comparar sem meta cadastrada | **Estado vazio** "Defina a meta de geração das usinas" — **não inventar meta**. |
| Redundância com o PowerRing (% de aderência) | O chart mostra **kWh absolutos** (realizado × meta) + **delta %**, complementando o anel (que mostra só %). |
| Excesso de cor | 2 séries apenas (realizado destacado, meta como referência). |

## 6. Componente

`src/components/ComparisonChart.tsx` — **apresentação pura**, sem buscar dados.
Contrato conservador:

```ts
type ComparisonChartProps = {
  realizado: number;
  esperado: number;       // 0 => estado vazio (sem meta)
  unidade?: string;       // "kWh"
  realizadoLabel?: string;
  esperadoLabel?: string; // "Meta até hoje"
  emptyMessage?: string;
};
```

- **Visual:** duas barras (realizado destacado, meta como referência) + **delta**
  "X% acima/abaixo da meta", com cor por faixa (ok/atenção/abaixo).
- **Implementação:** **CSS/SVG simples** (2 barras) — mais seguro e leve que
  `recharts` para esta comparação; usa **tokens existentes**; tema claro/escuro;
  responsivo.
- **Não é painel:** renderiza só o conteúdo; a página o envolve num `.panel`
  (reuso fácil).

## 7. Onde entra no Executivo

- Novo painel **"Realizado × meta (mês até hoje)"** após a faixa de MetricCards
  (reusa `realTot`/`espTot` já computados — **sem nova query**).
- Quando `espTot === 0` (sem meta) → estado vazio (não inventa meta).

## 8. Arquivos prováveis de alteração

| Arquivo | Mudança |
|---|---|
| `src/components/ComparisonChart.tsx` | **criar** (apresentação pura). |
| `src/app/(dashboard)/executivo/page.tsx` | **aditivo:** novo painel usando `realTot`/`espTot`. |
| `src/app/globals.css` | **aditivo:** CSS do ComparisonChart. |

> **Sem** novas queries, sem alterar `getUsinasComTelemetria`, sem mudar regra de
> meta/geração, sem tocar Início, schema, auth, rotas ou endpoints.
