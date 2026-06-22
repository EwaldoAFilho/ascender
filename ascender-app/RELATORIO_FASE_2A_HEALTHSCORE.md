# RELATÓRIO — Fase 2A · HealthScore

Primeira camada de inteligência operacional: **Health Score (0–100)** derivado
**apenas de dados já existentes no banco**. Sem endpoints novos, sem migração,
sem mock. Tudo aditivo e reversível.

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_2A_HEALTHSCORE.md` | Documento da fórmula, pesos, riscos e dados usados (escrito antes do código). |
| `src/lib/operacao/health-score.ts` | `computeHealthScore()` (função **pura**) + `getHealthScore()` (camada de leitura no banco) + tipos. |
| `src/components/operacao/HealthScore.tsx` | Widget premium: medidor 0–100 + status + principais motivos. |
| `RELATORIO_FASE_2A_HEALTHSCORE.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/lib/digitalgrid/queries.ts` | Nova **query de leitura** `contarFaturasVencidasDg()` (count agregado; sem regra nova). |
| `src/components/StatusBanner.tsx` | Passa a aceitar `health?` (modo Health Score) **mantendo** o modo por contagens da Fase 1 (compatível). |
| `src/app/(dashboard)/page.tsx` (Início) | O `StatusBanner` do topo foi **substituído** pelo `HealthScore` (mesmo slot); `getHealthScore()` no `Promise.all`. |
| `src/app/(dashboard)/executivo/page.tsx` | `HealthScore` adicionado no topo; `getHealthScore()` no `Promise.all`. |
| `src/app/globals.css` | **Aditivo:** CSS do `.healthscore` (medidor, motivos, severidade). |

## 3. Fórmula usada (resumo)

Começa em 100 e subtrai penalidades (detalhe e justificativa no
`PLANO_FASE_2A_HEALTHSCORE.md`):

| Fator | Peso máx. |
|---|---|
| Usinas offline `(offline/total)×45` | −45 |
| Usinas em alarme `(alarme/total)×20` | −20 |
| Coletores offline `(offline/total)×20` | −20 |
| Telemetria atrasada (30→180 min) | −15 |
| Faturas vencidas `min(n,20)/20×10` | −10 |

`score = clamp(round(100 − penalidades), 0, 100)`

**Status:** ≥85 `healthy` · 60–84 `attention` · <60 `critical`, com regras de
proteção: qualquer offline nunca é `healthy`; **qualquer alarme nunca é
`healthy`** (mínimo `attention`, sem virar crítico por um alarme isolado); ≥30%
offline ⇒ `critical`; telemetria > 60 min ⇒ no mínimo `attention`; sem telemetria
⇒ `attention` e nota exibida como **"—"** (nunca 0 nem 100), em **tom neutro/info**.

## 4. Dados usados (todos leitura no banco)

- `lerEstacoesDoBanco()` → `state` (online/alarm/offline) por usina.
- `lerColetoresDoBanco()` → `resumo.total` / `resumo.offline`.
- `ultimaTelemetriaEm()` → idade da última coleta (minutos).
- `contarFaturasVencidasDg()` → faturas vencidas e não quitadas.

`getHealthScore()` é a **única** fonte da nota — Início e Executivo a chamam,
garantindo consistência.

## 5. Limitações (marcadas, não inventadas)

- **Severidade fina por alarme (P1/P2/P3):** `[depende de query futura]` — hoje só
  há `state`/`nivel`.
- **Tempo de incidente / MTTR:** `[depende de query futura]` (janela histórica —
  Fase 2B com Timeline).
- **Tendência do próprio score:** `[depende de persistência futura]` — o score é
  instantâneo; histórico exigiria gravar snapshots (fora do escopo 2A).
- **`StatusBanner` em modo `health`:** implementado e compatível, porém **não
  montado** em nenhuma tela nesta fase (Início usa o `HealthScore` premium). Fica
  disponível para reuso (ex.: cabeçalho da SolisCloud na 2B).

## 6. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Nota "saudável" com usina offline | Regra de proteção (nunca healthy com offline). |
| Dado velho dar falsa saúde | Fator de atraso + regra > 60 min força atenção. |
| Misturar financeiro e operação | Peso baixo (−10) e motivo separado; score é majoritariamente operacional. |
| "Sem dados" virar 0/100 | Caso `noData` ⇒ exibe "—" + status atenção. |
| Divergência entre telas | Mesma `getHealthScore()` nas duas. |
| Nota parecer "absoluta" | Sempre acompanhada dos **motivos** que a explicam. |
| Custo de leitura extra nas páginas | Consultas leves/agregadas; `getHealthScore()` roda em paralelo no `Promise.all`. |

## 7. O que foi preservado

- Dados, rotas, **APIs externas**, autenticação e regras de negócio: inalterados.
- Tema escuro + identidade ASCENDER: preservados (CSS aditivo, tokens de Fase 1).
- `StatusBanner` da Fase 1: **API compatível** (modo contagens intacto).
- Nenhuma migração de banco.

## 8. Verificação (resultados reais)

- `npx tsc --noEmit` → **OK** (exit 0, sem erros).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas geradas
  (exit 0).

**Ajustes feitos após a validação:** nenhum. O `tsc` e o `build` passaram na
primeira execução de validação; não houve erro a corrigir.

### Contrato do caso "sem telemetria" (revisado)
O `HealthScoreResult` **já possui campo explícito** `noData: boolean`. Quando
não há telemetria confiável (`totalPlants <= 0` e sem `max(capturado_em)`):
- `noData = true`, `status = "attention"`, `label = "Sem telemetria"`;
- o componente `HealthScore` exibe **"—"** no medidor (não 0 nem 100);
- o `StatusBanner` (modo health) omite o `/100`.

Ou seja, o produto **não depende de número falso** no estado sem dados — sem
necessidade de alteração adicional.

### Confirmações (tarefa 5)
- `computeHealthScore()` é **função pura** (sem I/O — só recebe contagens).
- `getHealthScore()` é a **única** camada com leitura de banco.
- **Início e Executivo** usam a **mesma** `getHealthScore()` (nota consistente).
- `StatusBanner` mantém **compatível** o modo por contagens da Fase 1.
- **Sem mock** criado.
- **Sem migração** de banco.
- **Sem alteração** de API externa, autenticação, rotas ou regra de negócio.

## 8.1 Ajustes aplicados após a revisão visual (branch `ux/fase-2a-healthscore`)

Pequenos, seguros e reversíveis — sem iniciar Fase 2B:

1. **Início:** removido o `MetricCard` "Usinas online" (a contagem já aparece no
   HealthScore e nos chips do cockpit). Mantidos "Capacidade instalada" e
   "Aproveitamento agora".
2. **Sem telemetria:** mantém `noData=true` e o `"—"`; apresentação mudou para
   **tom neutro/info** (antes âmbar), pois é estado *desconhecido*, não alerta.
   Rótulo segue "Sem telemetria".
3. **Alarme ativo (regra de produto aprovada):** uma ou mais usinas em alarme
   força status mínimo `attention` (rótulo deixa de ser "Operação saudável");
   a nota pode seguir alta e **um alarme isolado não torna `critical`**.

`computeHealthScore()` segue **pura**; nada de endpoints/auth/rotas/regra de
negócio fora do HealthScore foi tocado.

## 9. Próximos passos sugeridos — Fase 2B

1. **`AttentionCenter` + `IncidentItem`** — transformar os "motivos" do Health
   Score em incidentes priorizados e acionáveis (offline, coletor mudo, alarme,
   vencidas), com link para a tela de origem.
2. **`OperationalTimeline`** — linha do tempo (de `alarmes` + `sync_runs` +
   uptime de coletores).
3. Montar o `StatusBanner` (modo `health`) como faixa compacta no cabeçalho da
   **SolisCloud**.
4. Avaliar **persistir snapshots do score** para exibir tendência (decisão de
   produto + possível migração — fora de 2A).

---

**Resumo:** Fase 2A entrega a **fundação confiável** do Health Score — fórmula
documentada e versionada, função pura testável, dados 100% derivados do banco,
exibido na Início e no Executivo, com salvaguardas contra nota enganosa. Pronto
para validação antes do `AttentionCenter` (Fase 2B).
