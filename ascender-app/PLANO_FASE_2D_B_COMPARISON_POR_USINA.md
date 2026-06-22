# PLANO — Fase 2D-B · ComparisonChart por usina

Aprofundar a leitura de performance mostrando **realizado × meta por usina**,
**reaproveitando** o `ComparisonChart` (2D-A), de forma **conservadora e
exception-based** (foco em quem está abaixo da meta). Sem visualização pesada,
sem tocar a Início, sem nova query.

> **Fora do escopo:** Heatmap, SiteMap/mapa, NOC/SOC completo, migração,
> alteração de regra de meta/geração, mock como dado real.

---

## 1. Onde exibir (decisão)

**Tela Usinas (`/usinas`).** Justificativa:
- O **Executivo** já tem `AdherenceRow` (realizado × meta **por usina**, pior no
  topo). Colocar a comparação por usina **lá** duplicaria **na mesma tela**.
- A **Usinas** é a tela de **performance** e ainda **não** mostra os **kWh
  absolutos** realizado × meta por usina de forma visual (só % no BarList e
  números na tabela).

## 2. Dados usados

Já carregados em `usinas/page.tsx` via `getUsinasComTelemetria()` — **sem nova
query**:
- `realizadoMesKwh` (telemetria), `esperadoMesKwh` **[derivado]** (meta mensal
  manual × fração de dias), `aderenciaPct` **[derivado]**, `nome`.

## 3. Como evitar duplicação (o ponto-chave)

| Já existe | O que mostra | O novo bloco |
|---|---|---|
| `AdherenceRow` (Executivo) | % por usina, pior no topo | **outra tela** (não compete) |
| `BarList` "Aderência…" (Usinas) | **% de TODAS**, **melhor no topo** | o novo é **kWh**, **só as abaixo da meta**, **pior no topo** |
| `UsinasTable` (Usinas) | grid denso (colunas realizado/meta/aderência) | o novo é **visual** dos **poucos críticos** |

**Lente nova = exception-based:** apenas **as que estão abaixo da meta**, com os
**kWh absolutos** (realizado × meta) + delta — diferente do ranking completo (%)
e da tabela. Padrão "top offenders" (Datadog/SolarEdge).

## 4. Formato

- Uma **seção compacta** "**Abaixo da meta — atenção**".
- **Top 5** piores aderências (entre as com meta), cada uma um **`ComparisonChart`
  compacto** (reuso **direto**, sem variante nova) + nome da usina.
- **Grid responsivo** (auto-fit) → ~2 por linha no desktop, 1 no mobile.
- **Sem dezenas de gráficos:** cap de **5**.

## 5. Quais usinas entram / ficam fora

- **Entram:** `esperadoMesKwh > 0` (meta cadastrada) **e** `aderenciaPct < 100`
  (abaixo da meta até hoje). Ordenadas por `aderenciaPct` **crescente** (pior
  primeiro), **top 5**.
- **Ficam fora:** sem meta (`esperado = 0`) — **não comparar sem meta**; e as que
  estão **na meta** (≥ 100%) — não são "atenção".
- **Estados vazios:**
  - nenhuma usina com meta → "Defina metas de geração (Cadastros › Usinas)…";
  - todas com meta dentro da meta → estado **positivo** "Todas as usinas com meta
    estão dentro da meta até hoje."

## 6. Reuso vs variante

- **Reaproveitar `ComparisonChart` diretamente** (já é compacto e parametrizável).
  **Não** criar variante nova nem componente novo — só **composição** na página +
  um pouco de **CSS** (grid + rótulo da usina).

## 7. Riscos visuais (e mitigação)

| Risco | Mitigação |
|---|---|
| Adjacência com o BarList de aderência | Título/escopo claros ("abaixo da meta", kWh); cap de 5; lente exception-based distinta. |
| Muitos gráficos poluírem | **Top 5** apenas; grid 2-up; cada chart é 2 barras + delta. |
| Comparar usina sem meta | Filtro `esperado > 0`; estado vazio explícito. |
| Barras estreitas dentro do grid | `ComparisonChart` já responsivo (valor desce no estreito). |

## 8. Arquivos prováveis de alteração

| Arquivo | Mudança |
|---|---|
| `src/app/(dashboard)/usinas/page.tsx` | **aditivo:** nova seção "Abaixo da meta" reusando `ComparisonChart`. |
| `src/app/globals.css` | **aditivo:** CSS do grid por usina + rótulo. |

> **Sem** novas queries, sem novos componentes, sem tocar Início/Executivo/
> schema/auth/rotas/endpoints, sem mudar regra de meta/geração, sem remover
> `BarList`/`UsinasTable`/`AdherenceRow`.
