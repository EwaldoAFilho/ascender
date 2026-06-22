# VALIDAÇÃO VISUAL — Início (pós Fase 2C-C)

> **Honestidade de método:** **não há navegador/captura** neste ambiente — não
> consigo "ver" o deploy. Esta validação é por **análise de CSS/código** do
> comportamento responsivo (breakpoints, alinhamento, estados). Itens de
> **pixel/tema/percepção** exigem **conferência visual humana** (👁). Não afirmo
> ter visto a tela renderizada.

Legenda: ✔ verificado por código · 👁 requer olho humano

---

## 1. Como o layout responde (fatos de CSS)

- `.split-grid` → **1 coluna** abaixo de **761px**; **2 colunas** a partir de
  `@media (min-width: 761px)`.
- `.operation-split` → `align-items: start` (painéis só com a altura do próprio
  conteúdo) + `> .panel { margin-bottom: 0 }`.
- **Sidebar** vira coluna lateral (260px) só em **≥1101px**; abaixo disso fica no
  **topo**, então o `main` usa a **largura toda**.

**Implicação:** entre **761–1100px** as duas colunas dividem ~toda a largura do
`main` (folgadas); em **≥1101px**, dividem `(viewport − 260px)`. Em telas comuns
de desktop (1280–1920px) cada coluna fica confortável (~450–800px).

## 2. Matriz de condições

| Condição | Comportamento (código) | Status |
|---|---|---|
| **Desktop** | Atenção (esq.) + Timeline (dir.) em 2 colunas 1fr/1fr | ✔ / 👁 |
| **Mobile (<761px)** | 1 coluna; ordem **Atenção → Timeline** (DOM) | ✔ |
| **Tema escuro** | cores por tokens com override dark | 👁 |
| **Tema claro** | idem | 👁 |
| **Com incidentes** | Atenção lista até 6 + "+N"; Timeline ao lado | ✔ / 👁 |
| **Sem incidentes** | Atenção mostra "Tudo operando" (curto) | ✔ |
| **Timeline com eventos** | até 8 itens, recente primeiro | ✔ |
| **Timeline vazia** | "Operação sem eventos recentes" (curto) | ✔ |

## 3. Avaliações específicas (tarefa 3)

- **Atenção + Timeline lado a lado melhorou a densidade?** ✔ **Sim** (por código):
  os dois painéis que antes eram **dois blocos verticais** agora dividem **uma
  faixa** → o topo perde uma altura de painel.
- **A Frota subiu o suficiente?** ✔ **Subiu** uma altura de painel inteira.
  "Suficiente" é percepção → 👁, mas a melhora é objetiva.
- **1fr/1fr ficou equilibrado?** ✔ Provável **sim**: Atenção e Timeline têm
  densidade de conteúdo parecida (lista com ícone + texto + ação). Largura igual é
  coerente. 👁 confirmar.
- **Precisa de 3fr/2fr?** ✖ **Não há necessidade objetiva** agora. Só faria
  sentido se, com **muitos incidentes**, o Centro ficasse apertado ao lado da
  Timeline — caso a inspeção humana constate isso. Mantido como **sugestão
  futura**.
- **Há "buraco" visual entre colunas?** ⚠ Quando um painel é bem mais curto (ex.:
  Timeline vazia ao lado de Atenção com 6 incidentes), sobra **espaço em branco
  abaixo do painel mais curto**. Com `align-items: start` isso é **whitespace
  normal de dashboard** (não um buraco dentro do painel). Aceitável; 👁 confirmar
  se incomoda.
- **Mobile segue bom em coluna única?** ✔ Sim — ordem lógica preservada
  (Atenção → Timeline).
- **O conjunto HealthScore + Cockpit + Cards + Atenção + Timeline ficou pesado?**
  ✔ **Melhorou** vs 2C-B: de **6** blocos verticais para **5** (Atenção+Timeline
  agora na mesma faixa). O Cockpit (alto) segue sendo o maior; o topo continua
  "rico", mas mais equilibrado. 👁 julgamento final.

## 4. Bug visual?

- **Nenhum bug claro** identificável por código. **Nenhuma alteração de código**
  feita nesta validação (apenas este documento).

## 5. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" (exit 0).

## 6. Conclusão e recomendações

- **Conclusão visual (por código):** a 2C-C **reduziu a densidade** como
  esperado; comportamento responsivo correto (2 col ≥761px, 1 col no mobile,
  alinhamento ao topo, estados vazios discretos). Falta apenas o **carimbo visual
  humano** (temas e percepção de equilíbrio).
- **Manter 1fr/1fr?** ✅ **Sim, recomendo manter.**
- **Ajustar para 3fr/2fr?** ✖ **Não recomendo agora** (sem necessidade objetiva;
  reavaliar só se o olho humano achar o Centro apertado com muitos incidentes).
- **Pronta para a próxima fase?** ✅ **Sem bloqueio técnico** (`tsc`/`build` OK).
  Recomendo apenas o **ok visual humano** (desktop + mobile, claro/escuro, com e
  sem incidentes) antes de avançar — formalidade, não impedimento.

> Nenhuma fase nova (Heatmap/ComparisonChart/SiteMap) iniciada.
