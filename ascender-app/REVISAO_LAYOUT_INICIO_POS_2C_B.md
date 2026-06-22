# REVISÃO DE LAYOUT — Início (pós Fase 2C-B)

> **Método:** revisão por **código** + raciocínio de hierarquia/altura. **Sem
> navegador/captura** neste ambiente → itens de tema/pixel exigem **olho humano**
> (👁). **Nenhum código alterado** — este arquivo é só documentação.

## 1. Estado atual da Início (ordem real)

| # | Bloco | Largura | Altura aproximada | Papel |
|---|---|---|---|---|
| 1 | **HealthScore** | full | média (~130–170px) | saúde geral (nota + motivos) |
| 2 | **Cockpit** (PowerRing) | full | alta (~220–280px) | "ao vivo" — potência agora |
| 3 | **MetricCards** (2) | full (grid) | baixa (~110px) | capacidade / aproveitamento |
| 4 | **Centro de Atenção** | full | variável (vazio ~80px / cheio alto) | incidentes acionáveis |
| 5 | **Linha do tempo** | full | variável (até 8 itens, alto) | eventos recentes |
| 6 | **Frota ao vivo** | full | média | cards por usina |

São **6 blocos full-width empilhados** → a tela ficou **bastante vertical**.

## 2. Avaliação (tarefa 2)

- **HealthScore + Centro + Timeline ocupam altura demais?** ⚠ **Sim.** Três
  painéis "de texto/lista" (1, 4, 5) + o cockpit alto (2) entre eles deixam o topo
  longo. Há ~5 blocos antes da Frota.
- **A Frota ficou muito para baixo?** ⚠ **Sim** — é o 6º bloco; no desktop exige
  rolagem considerável para chegar nela.
- **Cockpit continua visível/importante?** ✔ Sim (2º bloco, hero com PowerRing),
  mas agora "imprensado" entre HealthScore e os cards.
- **Centro de Atenção compete com a Timeline?** ⚠ **Sim, parcialmente** — são dois
  painéis de **lista com ícone/severidade**, visualmente parecidos e **empilhados**
  → leitura repetitiva. Lado a lado se diferenciariam melhor.
- **Mobile mantém boa ordem?** ✔ Sim — coluna única na sequência saúde → resolver
  → histórico → frota faz sentido. Manter.
- **Tema claro/escuro?** 👁 tokens têm override no dark; revisar contraste real.
- **Estados vazios elegantes?** ✔ "Tudo operando" e "Operação sem eventos
  recentes" são linhas verdes curtas e discretas. ⚠ Porém, com **ambos vazios**,
  dois painéis quase-vazios empilhados desperdiçam altura — lado a lado ficaria
  mais limpo.

## 3. Proposta de layout (desktop) — **não implementada**

Colocar **Centro de Atenção** e **Linha do tempo** **lado a lado** num
`split-grid`:

```
Desktop (≥ ~900px)            Mobile (1 coluna)
┌───────────── HealthScore ─────────────┐   HealthScore
┌───────────── Cockpit ─────────────────┐   Cockpit
┌──────────── MetricCards ──────────────┐   MetricCards
┌── Centro de Atenção ──┬─ Timeline ────┐   Centro de Atenção
│  (incidentes)         │ (eventos)     │   Timeline
└───────────────────────┴───────────────┘   Frota
┌───────────── Frota ao vivo ───────────┐
```

- **Reaproveita** a classe `.split-grid` já existente (2 col no desktop, 1 col no
  mobile) — mudança pequena e reversível.
- **Mobile:** mantém **tudo em uma coluna**, na ordem atual.
- **Opção (refinamento):** Centro de Atenção **mais largo** quando houver
  incidentes (ex.: `3fr / 2fr`) e largura igual quando vazio — via classe
  modificadora condicional (`incidents.length > 0`). Pode ficar para um passo
  seguinte; o split 1fr/1fr já resolve a altura.

**Ganho esperado:** elimina **um** bloco de altura no topo (Atenção e Timeline
passam a dividir a mesma faixa) → a **Frota sobe** e o topo fica mais equilibrado,
sem remover nada.

## 4. Microfase sugerida

A revisão conclui que a tela está **vertical/densa**. Sugiro uma microfase
pequena e segura:

### Fase 2C-C — Layout Polish da Início
- Envolver **Centro de Atenção + Timeline** num `.split-grid` (desktop 2 col,
  mobile 1 col).
- (Opcional) largura assimétrica do Centro quando houver incidentes.
- **Sem** novas queries, sem novos dados, sem mudar componentes internos — só
  **composição/CSS** na `page.tsx` (+ ajuste mínimo de CSS se necessário).
- Aditiva e reversível; `tsc` + `build` ao final.

## 5. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — 12/12 páginas (exit 0).
- Nenhum código alterado nesta revisão (apenas este documento).

## 6. Recomendação final

**Aplicar o layout lado a lado** (microfase **2C-C**) **antes** de partir para
Heatmap/ComparisonChart:

- ✅ **Recomendado:** aplicar **Centro de Atenção + Timeline lado a lado**
  (`split-grid`), mobile em coluna única. Pequeno, seguro, resolve a densidade.
- ⏸️ **Não recomendado agora:** manter exatamente como está (a tela ficou densa).
- ⏸️ **Não recomendado agora:** seguir direto para Heatmap/ComparisonChart sem
  antes aliviar o topo da Início (acrescentariam mais altura).

> Aguardando seu **ok** para a microfase **2C-C**. Nenhuma funcionalidade nova
> (Heatmap/ComparisonChart/SiteMap) foi iniciada.
