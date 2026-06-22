# RELATÓRIO — Fase 2C-C · Layout Polish da Início

Branch: `ux/fase-2c-c-layout-polish`

Microfase **puramente de composição/CSS**: reduzir a densidade vertical da Início
colocando **Centro de Atenção** e **Linha do tempo operacional** **lado a lado no
desktop**, mantendo **uma coluna no mobile**. Sem lógica, sem dados, sem queries.

---

## 1. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/app/(dashboard)/page.tsx` | `<AttentionCenter>` e `<OperationalTimeline>` agora ficam dentro de `<div className="split-grid operation-split">` (lado a lado no desktop). |
| `src/app/globals.css` | **Aditivo:** classe pequena `.operation-split` (alinha os painéis ao topo + zera a margem inferior deles dentro do grid). |

> Nenhum outro arquivo tocado. **Componentes inalterados** (mesmas props, mesma
> lógica interna).

## 2. O que mudou no layout

- **Antes:** 6 blocos full-width empilhados (…→ Centro de Atenção → Timeline →
  Frota), topo muito vertical.
- **Depois (desktop ≥ ~761px):** Centro de Atenção (**esquerda**) e Timeline
  (**direita**) dividem **a mesma faixa** → o topo perde um bloco de altura e a
  **Frota sobe**.
- Reaproveita a classe **`.split-grid`** já existente (2 col no desktop via
  `@media (min-width:761px)`, 1 col abaixo disso). `.operation-split` só ajusta:
  - `align-items: start` → os dois painéis ficam só com a altura do próprio
    conteúdo (não estica o mais curto);
  - `.operation-split > .panel { margin-bottom: 0 }` → espaçamento fica por conta
    do grid (`gap`) + da margem do `.split-grid`.

## 3. O que foi preservado

- **Mobile:** **uma coluna**, ordem **Centro de Atenção → Timeline** (ordem do
  DOM; o `.split-grid` colapsa para 1 col abaixo de 761px). ✔
- **Componentes:** `AttentionCenter` e `OperationalTimeline` **separados e
  inalterados** (props e lógica idênticas).
- **Dados/queries/regras/rotas/auth/schema:** **nada alterado**. Sem novas
  leituras, sem migração, sem mock.
- Demais blocos da Início (HealthScore, Cockpit, MetricCards, Frota) intactos.

## 4. Decisão sobre largura (tarefa 4)

- Implementado **1fr / 1fr** (via `.split-grid` existente) — simples e suficiente.
- **Largura condicional 3fr/2fr (Centro maior quando há incidentes):** **não
  aplicada** (evitar complexidade agora). **Sugestão futura:** se, na validação
  visual, o Centro com muitos incidentes parecer apertado ao lado da Timeline,
  adicionar um modificador condicional (`incidents.length > 0` → `3fr/2fr` no
  desktop). Fica documentado para um próximo passo, não agora.

## 5. Riscos visuais (e mitigação)

| Risco | Mitigação |
|---|---|
| Colunas com alturas diferentes deixarem "buraco" | `align-items: start` (não estica); cada painel só ocupa seu conteúdo. |
| Dois painéis estreitos no desktop com muitos itens | 1fr/1fr dá ~metade da largura a cada; itens são compactos. Se ficar apertado → sugestão 3fr/2fr (§4). |
| Margem dupla (painel + grid) | `.operation-split > .panel { margin-bottom: 0 }`. |
| Telas intermediárias (~761px) | breakpoint do `.split-grid` já testado no app; abaixo dele vira 1 coluna. |

## 6. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" (exit 0).
- Mudança **apenas de composição/CSS**; nenhuma alteração de lógica/dados.

## 7. Recomendação para validação visual real

Após o deploy, na **Início** (desktop e mobile, tema claro e escuro), conferir:
1. **Desktop:** Centro de Atenção à **esquerda** e Timeline à **direita**, na
   mesma faixa; a **Frota** subiu (menos rolagem).
2. **Mobile:** uma coluna, Centro de Atenção **primeiro**, Timeline **depois**.
3. **Alturas:** sem "buraco" grande quando um painel é mais curto que o outro.
4. **Estados vazios** ("Tudo operando" / "sem eventos") lado a lado ficam
   elegantes.
5. Se o Centro com muitos incidentes ficar apertado → avaliar a **largura 3fr/2fr**
   (sugestão §4).

> Sem merge. Aguardando validação visual.
