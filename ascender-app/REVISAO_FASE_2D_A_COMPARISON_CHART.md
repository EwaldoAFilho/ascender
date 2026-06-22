# REVISÃO — Fase 2D-A · ComparisonChart (Realizado vs Meta)

Branch: `ux/fase-2d-a-comparison-chart`

> **Método:** revisão por **código** + **simulação determinística** da lógica do
> componente (puro). **Sem navegador/captura** → tema/pixel exigem **olho
> humano** (👁). Não afirmo ter visto a tela renderizada.

Legenda: ✔ verificado · 👁 requer olho humano · ⚠ observação

---

## 1. Ajuste aplicado nesta revisão (pequeno)

Quando `realizado == meta`, o texto saía **"+0% acima da meta"** (estranho).
Trocado para **"na meta"** quando o delta arredonda a 0% (ícone neutro). Pequeno,
seguro, melhora a clareza (tarefa 3).

## 2. Cenários (simulação determinística da lógica)

`max = max(realizado, esperado, 1)` · `pct = realizado/esperado*100 − 100` ·
tom: `pct≥0` ok · `≥−15` atenção · senão abaixo. Barras: `width =
max(valor/max*100, 2)%`.

| Cenário | Saída | OK |
|---|---|---|
| Realizado = meta (100/100) | delta **"na meta"**, tom ok, barras 100%/100% | ✔ |
| Acima (120/100) | **"+20% acima da meta"**, ok ↑ | ✔ |
| Até 15% abaixo (90/100 → −10; e 85/100 → −15) | tom **atenção**, "−10%/−15% abaixo" ↓ | ✔ |
| Muito abaixo (50/100 → −50) | tom **abaixo** (bad), "−50% abaixo" ↓ | ✔ |
| Meta = 0 | **estado vazio** "Defina a meta…" (não inventa) | ✔ |
| Realizado = 0, meta > 0 | "−100% abaixo", bad; barra realizado = sliver 2% (não some) | ✔ |
| Valores grandes (12.345.678 / 10.000.000) | "+23% acima", `fmt` pt-BR com pontos de milhar | ✔ |
| Valores pequenos (3 / 5) | "−40% abaixo", barras 60%/100% | ✔ |
| Largura estreita (<560px) | `grid 96px 1fr`; valor vai para a 2ª linha à direita | ✔ (código) |

Robustez: divisão só ocorre com `esperado > 0` (estado vazio antes); larguras têm
piso de 2% (barra sempre visível); sem `NaN`/overflow. ✔

## 3. Linguagem (tarefa 3)

- ✔ **"Meta até hoje"** — rótulo da 2ª barra + título do painel "Realizado × meta
  (mês até hoje)".
- ✔ **Não** usa "previsão"/forecast.
- ✔ **Não** chama de "meta diária".
- ✔ **Não** sugere "meta cheia do mês" — descrição diz "meta **proporcional aos
  dias decorridos**".
- ✔ **Consolidado e só com meta** — descrição: "(apenas usinas com meta
  definida)".

## 4. Revisão visual (👁 + código)

| Item | Status | Observação |
|---|---|---|
| Executivo tema escuro | 👁 | cores por tokens com override dark. |
| Executivo tema claro | 👁 | idem. |
| Desktop | 👁 (✔ código) | `grid 130px 1fr auto`; barras + valores alinhados. |
| Mobile | ✔ código | `<560px` → valor na 2ª linha; sem overflow. |
| Com meta cadastrada | ✔ | barras + delta. |
| Sem meta cadastrada | ✔ | estado vazio explícito. |

## 5. Avaliação do painel no Executivo (tarefa 5)

- **Complementa o PowerRing sem duplicar?** ⚠ **Parcialmente.** O anel já mostra a
  **% de aderência** e, no *sublabel*, "Realizado X / meta até hoje Y kWh". O
  ComparisonChart re-apresenta esses números como **barras + delta** — leitura
  **mais visual** do mesmo fato. **Veredito:** complementar e mais claro para
  diretoria, mas **há sobreposição** com o sublabel do anel. **Aceitável**;
  registro como ponto de atenção.
- **Polui a tela?** Não — é **um painel compacto** (2 barras + 1 linha de delta).
- **Ajuda na leitura executiva?** ✔ Sim — "estamos batendo a meta?" fica óbvio em
  kWh absolutos + delta.
- **Posição** (após os MetricCards, antes de "Aderência/Tendência"): **boa** e
  coerente. Alternativa possível: logo **abaixo do cockpit** (junto da aderência
  do anel) — **não recomendo mudar agora** (a posição atual flui bem).
  ⚠ *Opção futura:* se incomodar a sobreposição com o anel, **simplificar o
  sublabel do PowerRing** para só a %, deixando os kWh no ComparisonChart.

## 6. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" (exit 0).

## 7. Conclusão

**Aprovado para merge.** A lógica passa em todos os cenários (incl. limites e
estado vazio), a linguagem está correta e honesta ("meta até hoje", consolidado,
não-previsão), e o painel ajuda a leitura executiva. Único ajuste desta revisão:
texto **"na meta"** no empate. Pendente apenas o **carimbo visual humano**
(temas/mobile).

Recomendação registrada (não aplicada): avaliar simplificar o sublabel do
PowerRing para reduzir a sobreposição com o ComparisonChart — numa próxima
iteração, não agora.

> **Sem merge.** Próxima fase não iniciada.
