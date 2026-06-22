# RELATÓRIO — Fase 2D-A · ComparisonChart (Realizado vs Esperado/Meta)

Branch: `ux/fase-2d-a-comparison-chart`

Comparação **realizado × meta** com leitura executiva, aplicada no Executivo,
usando **dados já carregados pela tela** (sem nova query). Conservadora, aditiva,
reversível. **Tela Início não foi tocada** (congelada).

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_2D_A_COMPARISON_CHART.md` | Telas, dados, natureza do esperado, comparações confiáveis × evitadas, riscos. |
| `src/components/ComparisonChart.tsx` | Componente **apresentação pura** (2 barras + delta), estado vazio sem inventar meta. |
| `RELATORIO_FASE_2D_A_COMPARISON_CHART.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/app/(dashboard)/executivo/page.tsx` | **Aditivo:** novo painel "Realizado × meta (mês até hoje)" reutilizando `realTot`/`espTot` (já computados). |
| `src/app/globals.css` | **Aditivo:** CSS do ComparisonChart (barras, delta, responsivo). |

> **Sem** novas queries, sem alterar `getUsinasComTelemetria`, sem mudar regra de
> meta/geração, sem tocar Início/schema/auth/rotas/endpoints. Nenhum componente
> removido.

## 3. Dados usados

Tudo **já carregado** no `executivo/page.tsx` (via `getUsinasComTelemetria()`):
- **Realizado** = `realTot` (soma de `realizadoMesKwh` das usinas com meta > 0).
- **Meta até hoje** = `espTot` (soma de `esperadoMesKwh` = `geracaoEsperadaKwhMes
  × fração de dias do mês`) — **[derivado]** da meta mensal manual.

## 4. Comparações implementadas

- ✅ **Realizado (mês até hoje) × Meta até hoje** (consolidado), com **delta %**
  (acima/abaixo da meta) e cor por faixa (ok ≥ meta · atenção até −15% · abaixo).
- Estado vazio (`espTot === 0`) → "Defina a meta de geração das usinas" — **não
  inventa meta**.

## 5. Comparações deixadas de fora (e por quê)

| Comparação | Motivo |
|---|---|
| **Hoje × esperado de hoje** | **[indisponível]** — não há meta **diária** real (dividir o mês por dias é frágil com clima/estação). |
| **Mês × meta cheia do mês** | enganoso no meio do mês → usamos **meta até hoje**. |
| **Ano × meta anual** | **[depende de backend]** — não há meta anual persistida (não inventar). |
| **Realizado mensal histórico × meta mensal** | meta histórica não é persistida. |
| **Por usina** | já existe via `AdherenceRow`; o ComparisonChart fica **pronto para reuso** per-usina, mas não duplicado agora. |

## 6. Limitações

- O "esperado" é **[derivado]** da meta mensal manual `geracaoEsperadaKwhMes`; se
  a meta não estiver cadastrada para uma usina, ela **não entra** no consolidado
  (lógica já existente, não alterada) → o painel só compara o universo "com meta".
- Comparação **consolidada** (não por usina) nesta v1.
- Sobreposição parcial com o PowerRing (que mostra a **% de aderência**): o chart
  acrescenta a leitura em **kWh absolutos** + delta — complementar, não idêntico.

## 7. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Confundir "meta até hoje" com "meta cheia" | Rótulo "Meta até hoje" + texto do painel. |
| Comparar sem meta | Estado vazio explícito; não inventa meta. |
| Excesso de cor | 2 séries (realizado por faixa + meta como referência listrada neutra). |
| Tema/responsivo | Tokens existentes; em telas estreitas o valor vai para a 2ª linha. |

## 8. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- `ComparisonChart` é apresentação pura; nenhuma leitura nova no banco.

## 9. Recomendação para próxima fase

- **Validação visual** do painel no Executivo (claro/escuro, com e sem meta).
- Possível **2D-B:** ComparisonChart **por usina** (reuso direto) e/ou aplicação
  em **Geração/Análise** quando houver uma série de meta coerente.
- **Não iniciado:** Heatmap, SiteMap/mapa, ComparisonChart por usina, alterações
  na Início, migração.

> Trabalho em branch `ux/fase-2d-a-comparison-chart`. **Sem merge** — aguardando
> validação.
