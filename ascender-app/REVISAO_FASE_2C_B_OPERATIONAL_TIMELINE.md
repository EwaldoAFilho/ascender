# REVISÃO — Fase 2C-B · OperationalTimeline

Branch: `ux/fase-2c-b-operational-timeline`

> **Método:** revisão por **código** + **execução real da função pura**
> `buildTimeline` com dados sintéticos (não é mock em produção — é teste da
> lógica). Itens de **renderização/tema/responsivo** exigem **olho humano** (👁),
> pois não há navegador/captura neste ambiente.

Legenda: ✔ verificado (executado) · 👁 requer olho humano · ⚠ recomendação

---

## 1. Cenários (executados de fato em `buildTimeline`)

| Cenário | Saída | OK |
|---|---|---|
| Sem eventos | `[]` → estado vazio positivo no componente | ✔ |
| Só telemetria atualizada (5 min) | `info` "Telemetria atualizada" | ✔ |
| Telemetria atrasada (120 min) | `warning` "Telemetria atrasada · há 2h" | ✔ |
| Alarme ativo | `warning` **"Alarme ativo"** (não "aberto") | ✔ |
| Alarme resolvido | `success` "Alarme resolvido" | ✔ |
| Sync erro | `critical` "Falha de sincronização" | ✔ |
| Sync ok | `success` "Sincronização concluída" | ✔ |
| Timestamp ausente/inválido | **ignorado** (0 eventos), **sem quebra**, sem desordenar | ✔ |
| > 8 eventos | **limita a 8**, mais recente primeiro | ✔ |
| Mistura (alarme/sync/telemetria) | ordenada recente→antigo (2 min, 59 min, 3 h) | ✔ |

Robustez: `ms()` retorna `null` para timestamp ausente/inválido (`NaN`) e o
evento é **descartado** (`continue`) — não entra no `sort` nem quebra a tela. ✔

---

## 2. Linguagem (tarefa 3)

- **"Alarme ativo"** (não "aberto"): o título não afirma o instante de abertura.
  Usa `atualizadoEm` (última atualização). **Documentado** no PLANO/RELATORIO.
  ⚠ *Observação:* o `ageLabel` ("há X") reflete o `atualizadoEm`, não a abertura —
  aceitável e honesto (não alega "aberto há X"). Refinar com o instante real de
  abertura depende de campo/consulta futura `[depende de query futura]`.
- **"Telemetria atualizada / atrasada"** + descrição "Última coleta da frota
  (...)" deixa claro que é **um marcador** (última coleta), não fluxo contínuo. ✔
- **Sync com erro:** "Falha de sincronização" + `Job "x" falhou: <msg>`. Claro,
  porém **um item** entre os 8 (não toma a tela) e cor crítica só nesse item —
  **não alarmista demais**. ✔

---

## 3. Revisão visual (👁 + código)

| Item | Status | Observação |
|---|---|---|
| Início tema escuro | 👁 | tokens com override dark; conferir contraste real. |
| Início tema claro | 👁 | idem. |
| Mobile/responsivo | 👁 (✔ código) | `.tl-top` quebra (flex-wrap); itens empilham; sem largura fixa. |
| Linha vertical / ícones / severidades | 👁 (✔ código) | marcador circular + linha `::before` por item (some no último); cor por severidade via tokens. |
| Timeline empurrou a Frota? | ⚠ | sim, soma mais um painel antes da Frota (ver §4). |
| HealthScore + Atenção + Timeline pesado? | ⚠ | topo da Início ficou **denso** (ver §4). |

---

## 4. Posição da timeline (tarefa 5) — avaliação

Hoje a Início empilha: **HealthScore → cockpit → MetricCards → Centro de Atenção
→ Timeline → Frota**. Funciona e é coerente (saúde → o que resolver → o que
aconteceu → frota), mas o **topo ficou longo/denso**.

- **Decisão:** **não alterar agora** (conforme a regra "não mudar se não for
  necessário").
- **Recomendação futura (documentada):** colocar **Centro de Atenção** e
  **Timeline** lado a lado num **`split-grid`** (2 colunas no desktop, 1 no
  mobile) para reduzir a altura — pequena mudança de layout, reversível. Avaliar
  na próxima fase de polimento, não agora.

---

## 5. Confirmações técnicas (tarefa 6)

- ✔ `buildTimeline()` **pura** — verificado: nenhum `await`/`getDb` na função (o
  único I/O está em `getTimeline`); recebe `nowMs` (sem `Date.now()` interno).
- ✔ `getTimeline()` é a camada de leitura.
- ✔ `getTimeline(overview)` **reaproveita o overview** (última telemetria) e lê só
  alarmes + `sync_runs`; na Início o overview é buscado **uma vez** e compartilhado
  por HealthScore, AttentionCenter e Timeline.
- ✔ `listarSyncRunsRecentes()` é **somente leitura** — verificado: apenas
  `select` (sem insert/update/delete).
- ✔ **Sem** mudança de schema, auth, rotas, endpoints ou regra de negócio. Sem
  migração, sem mock.

---

## 6. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- `buildTimeline` executada nos 10 cenários → todos corretos (§1).

---

## 7. Conclusão

**Aprovado para merge.** A lógica passa em todos os cenários (incl. timestamps
inválidos e limite), a linguagem é honesta ("ativo" não "aberto"; telemetria como
marcador), e as garantias técnicas (pureza, leitura única, read-only) se
confirmam. **Nenhum ajuste de código foi necessário.**

Recomendação registrada (não aplicada): avaliar **Atenção + Timeline lado a lado**
num `split-grid` para aliviar a altura do topo da Início — numa próxima fase de
polimento.

> Aguardando **ok** para o merge na `main`. Próxima fase **não iniciada**.
