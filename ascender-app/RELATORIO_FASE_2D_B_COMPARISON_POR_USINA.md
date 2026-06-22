# RELATÓRIO — Fase 2D-B · ComparisonChart por usina

Branch: `ux/fase-2d-b-comparison-por-usina`

Comparação **realizado × meta por usina**, **exception-based** (foco nas que
estão abaixo da meta), **reaproveitando** o `ComparisonChart` da 2D-A, na tela
**Usinas**. Conservadora, aditiva, reversível. **Início não tocada.**

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_2D_B_COMPARISON_POR_USINA.md` | Decisão de tela, dados, anti-duplicação, formato (antes do código). |
| `RELATORIO_FASE_2D_B_COMPARISON_POR_USINA.md` | Este relatório. |

> **Nenhum componente novo criado** — reuso direto de `ComparisonChart`.

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/app/(dashboard)/usinas/page.tsx` | **Aditivo:** seção "Abaixo da meta — atenção" (Top 5 piores, com `ComparisonChart` por usina) após o BarList, antes da tabela. |
| `src/app/globals.css` | **Aditivo:** CSS do grid por usina (`.cmp-usina-grid`, `.cmp-usina`, `.cmp-usina-nome`). |

> **Sem** novas queries, novos componentes, ou mudança em
> Início/Executivo/schema/auth/rotas/endpoints/regra de meta-geração. Nenhum
> componente removido.

## 3. Dados usados

Já carregados em `usinas/page.tsx` via `getUsinasComTelemetria()` — **sem nova
query**:
- `realizadoMesKwh` (telemetria), `esperadoMesKwh` **[derivado]** (meta mensal
  manual × fração de dias do mês), `aderenciaPct` **[derivado]**, `nome`, `id`.

## 4. Decisão de tela

**Usinas** (não Executivo). O Executivo já tem `AdherenceRow` (realizado × meta
por usina); colocar a comparação por usina lá **duplicaria na mesma tela**. A
Usinas é a tela de **performance** e ainda não tinha os **kWh absolutos**
realizado × meta por usina de forma visual.

## 5. Como evitou duplicação

- **vs `AdherenceRow` (Executivo):** **outra tela**.
- **vs `BarList` "Aderência…" (Usinas):** o BarList mostra **% de TODAS**,
  **melhor no topo**; o novo mostra **kWh**, **só as abaixo da meta**, **pior no
  topo** → lente **exception-based** ("top offenders"), distinta.
- **vs `UsinasTable`:** a tabela é grid denso; o novo é **visual dos poucos
  críticos**.

## 6. Comparações / usinas

- **Entram:** `esperadoMesKwh > 0` **e** `aderenciaPct < 100`, ordenadas por
  `aderenciaPct` crescente (pior primeiro), **Top 5**.
- **Ficam fora:** sem meta (não comparar) e as que estão **na meta** (≥ 100%).
- **Estados vazios:** sem nenhuma meta → orienta cadastrar metas; todas na meta →
  estado **positivo** "Todas as usinas com meta estão dentro da meta até hoje."

## 7. Limitações

- "Esperado" é **[derivado]** da meta mensal manual; usina sem meta **não** entra
  (proposital).
- Mostra **até 5** (exception-based) — não é o ranking completo (esse fica no
  BarList/tabela).
- Comparação **consolidada por usina do mês até hoje** (não diária, não anual).

## 8. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Adjacência com o BarList de aderência | Título/escopo distintos ("abaixo da meta", kWh); cap de 5; lente exception-based. |
| Poluir com muitos gráficos | **Top 5** + grid 2-up; cada chart é 2 barras + delta. |
| Comparar sem meta | Filtro `esperado > 0` + estado vazio. |
| Barras estreitas no grid | `ComparisonChart` responsivo (valor desce em largura estreita). |

## 9. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- Reuso de `ComparisonChart` (apresentação pura); nenhuma leitura nova no banco.

## 10. Recomendação para próxima fase

- **Validação visual** da seção na Usinas (com usinas abaixo da meta, todas na
  meta, e sem metas).
- Avaliar (futuro) se o **BarList** e a nova seção convivem bem ou se um deles
  pode ser ajustado para reduzir adjacência.
- **Não iniciado:** Heatmap, SiteMap/mapa, NOC/SOC completo, migração.

> Branch `ux/fase-2d-b-comparison-por-usina`. **Sem merge** — aguardando
> validação.
