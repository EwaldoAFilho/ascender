# RELATÓRIO — Fase 2E · GenerationHeatmap

Branch: `ux/fase-2e-generation-heatmap`

Heatmap **usina × mês** de geração (`[real]`, `medicoes_geracao`) no Executivo.
Versão conservadora: **sem inventar/interpolar**, célula sem registro = "sem
dado", mês corrente marcado "(parcial)". **Início não tocada.**

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_2E_GENERATION_HEATMAP.md` | Dados, granularidade, riscos (antes do código). |
| `src/components/GenerationHeatmap.tsx` | Componente **apresentação pura** (matriz → grid colorido + legenda + estado vazio). |
| `RELATORIO_FASE_2E_GENERATION_HEATMAP.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/lib/cadastros/queries.ts` | **Aditivo:** `geracaoPorUsinaMes()` (+ tipo `HeatmapGeracao`) — **somente leitura**. |
| `src/app/(dashboard)/executivo/page.tsx` | **Aditivo:** painel "Mapa de geração (usina × mês)" ao final + leitura no `Promise.all`. |
| `src/app/globals.css` | **Aditivo:** CSS do heatmap (grid, células, legenda). |

> **Sem** novo endpoint, sem migração, sem tocar Início, sem mudar regra de
> geração/meta, schema, auth ou rotas. Nenhum componente removido.

## 3. Dados usados

- `medicoes_geracao` (⋈ `usinas`) → soma de `geracao_kwh` por **usina ×
  competência** — **[real]**, persistido. Validado no banco real (usinas com
  cobertura parcial aparecem com células "sem dado", ex.: usina que começou em
  abril não tem jan–mar).

## 4. Granularidade escolhida

**usina × mês** (`[real]`). Justificativa e alternativas adiadas em
`PLANO_FASE_2E…`:
- **dia × usina** → `[derivado]` de snapshots, **lacunas** antes do início da
  coleta → próximo passo.
- **hora × dia** → só o dia corrente → não serve a heatmap multi-dia.

## 5. Implementação (conservadora)

- **Sem mock, sem interpolação.** Célula sem registro = **null → "sem dado"**
  (cor neutra, **não** zero).
- **Mês corrente** rotulado **"(parcial)"** (não concluir "queda" no mês incompleto).
- **Rampa única** (gold sobre surface-soft) + **legenda** (sem dado · menor → maior
  com o máximo). Sem excesso de cores.
- **Responsivo:** `overflow-x` (muitas colunas rolam); rótulos de usina com
  `ellipsis`. **Tema claro/escuro** via tokens (`color-mix` com `--surface-soft`).
- **Estado vazio:** sem `medicoes` → mensagem (não desenha grade).
- **Grid de `div`s** (não `<table>`) para **não herdar** o estilo global de tabela.

## 6. Limitações

- Só **mensal** (a granularidade diária/horária fica para fases futuras).
- Cobre o **ano corrente** (o `sync-geracao` traz o ano atual).
- "Esperado/meta" **não** entra aqui (é geração realizada); comparação com meta
  segue no Executivo (PowerRing/ComparisonChart) e Usinas.
- Cores não imprimem o número na célula (contraste) — valor no **tooltip**
  (`title`) e na legenda.

## 7. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Mês parcial parecer fraco | rótulo **"(parcial)"**. |
| Célula vazia parecer zero | **"sem dado"** (cor neutra, borda tracejada). |
| Muitas colunas no mobile | **scroll-x**; rótulo de usina fixo (sticky) à esquerda. |
| Contraste do texto nas células | célula é **cor**; valor no tooltip + legenda. |
| Executivo ficar mais longo | painel **compacto, ao final** (não empurra o topo). |

## 8. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- **Query validada no banco real** (matriz usina × mês com células "sem dado"
  reais para usinas de cobertura parcial).

## 9. Recomendação para próxima fase

- **Validação visual** do heatmap no Executivo (claro/escuro, desktop/mobile, com
  poucas e com muitas colunas).
- Futuro **2E-B (opcional):** heatmap **dia × usina** do mês corrente
  (`[derivado]` de snapshots) **com tratamento explícito de lacunas** (dias sem
  coleta marcados, não zero).
- **Não iniciado:** SiteMap/mapa, NOC/SOC completo, deep-link avançado, migração.

> Branch `ux/fase-2e-generation-heatmap`. **Sem merge** — aguardando validação.
