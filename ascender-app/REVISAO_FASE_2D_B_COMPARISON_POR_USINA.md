# REVISÃO — Fase 2D-B · ComparisonChart por usina

Branch: `ux/fase-2d-b-comparison-por-usina`

> **Método:** revisão por **código** + **simulação determinística** da seleção
> (filtro/sort/slice) e do `ComparisonChart` (cuja lógica já foi executada na
> 2D-A). **Sem navegador/captura** → tema/pixel exigem **olho humano** (👁).

Legenda: ✔ verificado · 👁 requer olho humano · ⚠ observação

---

## 1. Ajustes aplicados nesta revisão (pequenos e seguros)

1. **Responsivo (bug real):** `minmax(320px, 1fr)` podia **estourar a largura** em
   telas < 320px. Trocado por **`minmax(min(100%, 320px), 1fr)`**.
2. **Truncamento honesto:** com > 5 usinas abaixo da meta, agora há um aviso
   **"+ N outra(s) abaixo da meta — ver tabela abaixo."** (antes truncava em
   silêncio).

## 2. Cenários (simulação da lógica de seleção)

`temMeta = vinculadas.filter(esperado>0)` ·
`abaixoMetaTodas = temMeta.filter(aderência<100).sort(asc)` ·
`abaixoMeta = abaixoMetaTodas.slice(0,5)`.

| Cenário | Saída | OK |
|---|---|---|
| Nenhuma usina com meta | `temMeta=[]` → "Defina metas… (Cadastros › Usinas)" | ✔ |
| Todas dentro da meta | `abaixoMeta=[]` → estado positivo "…dentro da meta até hoje" | ✔ |
| Uma abaixo da meta | 1 `ComparisonChart` | ✔ |
| > 5 abaixo da meta | 5 charts (piores) + **"+ N outra(s)…"** | ✔ |
| Valores muito grandes | `fmt` pt-BR (pontos de milhar); barras escaladas | ✔ |
| Valores pequenos | barras proporcionais; sem quebra | ✔ |
| Realizado = 0 | "−100% abaixo", barra realizado = sliver 2% (esperado>0 garantido) | ✔ |
| Aderência muito baixa | tom **abaixo** (bad), delta negativo grande | ✔ |
| Largura estreita (<320–560px) | grid colapsa p/ 1 coluna; `ComparisonChart` move valor p/ 2ª linha; **sem overflow** (após o fix) | ✔ |

## 3. Revisão visual (👁 + código)

| Item | Status | Observação |
|---|---|---|
| Usinas tema escuro | 👁 | cores por tokens com override dark. |
| Usinas tema claro | 👁 | idem. |
| Desktop | ✔ código | grid 2-up (auto-fit ~320px). |
| Mobile | ✔ código | 1 coluna; sem overflow (fix). |
| Seção "Abaixo da meta" pesada? | ⚠ | até 5 charts (2 barras + delta) em grid 2-up → ~3 linhas. Aceitável p/ uma tela de detalhe; cap de 5 + "+N" controla. |
| Adjacência com o BarList repetitiva? | ⚠ | ver §4. |
| Top 5 ajuda a leitura? | ✔ | exception-based (piores primeiro) é acionável. |
| Tabela continua fazendo sentido abaixo? | ✔ | a tabela é o detalhe completo/ordenável; a seção é o destaque dos críticos. |

## 4. BarList (% todas) × nova seção (kWh piores) — está claro? (tarefa 4)

- **BarList** "Aderência realizado × esperado": **% de TODAS** as usinas
  vinculadas, **melhor no topo**.
- **Nova seção** "Abaixo da meta — atenção": **kWh** (realizado × meta) das **piores
  abaixo da meta**, **pior no topo**, **só com meta**.
- **Diferença clara?** ⚠ **Razoavelmente** — os **títulos** e a **descrição** da
  nova seção ("kWh realizado × meta, pior primeiro, apenas com meta") deixam o
  recorte distinto; a unidade (% vs kWh) e a direção (melhor vs pior no topo) também
  diferenciam. **Há adjacência temática** (ambas sobre meta), mas com **lentes
  diferentes** (ranking geral % × exceção em kWh). **Aceitável.**
  - *Opção futura (não agora):* se incomodar, inverter o BarList para "pior no
    topo" ou movê-lo para baixo da tabela — fica registrado, **não aplicado**
    (mexeria em comportamento já aprovado).

## 5. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" (exit 0).

## 6. Conclusão

**Aprovado para merge.** A seleção passa em todos os cenários (incl. estados
vazios, truncamento e realizado=0), o reuso do `ComparisonChart` é correto, e a
nova seção tem papel distinto (exceção em kWh) vs BarList (ranking %) e tabela
(detalhe). Ajustes desta revisão: **fix responsivo** (overflow < 320px) e **aviso
"+N"**.

Recomendação registrada (não aplicada): reavaliar a **adjacência** BarList × nova
seção numa próxima iteração, se a validação humana achar repetitivo.

> **Sem merge.** Nenhuma nova fase iniciada.
