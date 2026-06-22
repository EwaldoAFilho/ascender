# RELATÓRIO — Fase 2C-B · OperationalTimeline

Branch: `ux/fase-2c-b-operational-timeline`

Linha do tempo operacional com **eventos reais e datados**, derivada de dados já
existentes no banco. Sem endpoints novos, sem migração, sem mock, sem alterar
regra de negócio.

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_2C_B_OPERATIONAL_TIMELINE.md` | Eventos, fontes, exclusões, ordenação, severidades, riscos (antes do código). |
| `src/lib/operacao/timeline.ts` | `buildTimeline()` (**função pura**, recebe `nowMs`) + `getTimeline()` (leitura) + tipos. |
| `src/components/operacao/OperationalTimeline.tsx` | Painel "Linha do tempo operacional" (lista cronológica, vertical, compacta). |
| `RELATORIO_FASE_2C_B_OPERATIONAL_TIMELINE.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/lib/soliscloud/telemetria-db.ts` | **Nova query de leitura** `listarSyncRunsRecentes()` + tipo `SyncRunRecente` + import de `syncRuns`. |
| `src/app/(dashboard)/page.tsx` (Início) | `getTimeline(overview)` no `Promise.all` + `<OperationalTimeline>` abaixo do Centro de Atenção. |
| `src/app/globals.css` | **Aditivo:** CSS da timeline (linha vertical, marcadores por severidade). |

> **Não** foram tocados: auth, rotas, contratos de API externa, schema, regra de
> negócio (faturas/rateio/geração/telemetria). Sem migração, sem mock.

## 3. Eventos implementados (somente com timestamp confiável)

| Evento | Severidade | Origem | `occurredAt` |
|---|---|---|---|
| Alarme ativo | `warning` | `historicoAlarmes()` | `atualizadoEm` |
| Alarme resolvido | `success` | `historicoAlarmes()` (`resolvidoEm`) | `resolvidoEm` |
| Sincronização concluída | `success` | `listarSyncRunsRecentes()` (ok) | `terminadoEm ?? iniciadoEm` |
| Falha de sincronização | `critical` | `listarSyncRunsRecentes()` (erro) | `terminadoEm ?? iniciadoEm` |
| Telemetria atualizada | `info` | `overview.lastTelemetryIso` (≤ 60 min) | `lastTelemetryIso` |
| Telemetria atrasada | `warning` | `overview.lastTelemetryIso` (> 60 min) | `lastTelemetryIso` |

- Ordenação: **mais recente primeiro**; limite inicial **8**.
- Cada alarme gera **um** evento (resolvido **ou** ativo, conforme `resolvidoEm`).

## 4. Eventos deixados de fora (e por quê)

| Evento | Motivo |
|---|---|
| **Coletor sem comunicação** | `updateTime` do coletor é string formatada (não ISO confiável para ordenar). Sem timestamp de transição, **não entra**; já aparece no **Centro de Atenção**. `[depende de query futura]` |
| **Retorno de comunicação** | **Sem histórico de transição** comprovando o retorno (só estado atual). **Não inventado.** `[indefinido]` |
| **Faturas vencidas** | Sem um instante único coerente para a timeline; já estão no **Centro de Atenção**. Fora para não criar timestamp artificial. |

## 5. Dados usados

- `alarmes` → `historicoAlarmes(20)` **(já existia)**.
- `sync_runs` → `listarSyncRunsRecentes(8)` **(nova, somente leitura)**.
- **última telemetria** → reaproveitada do `getOperationalOverview()`
  (`lastTelemetryIso` / `lastTelemetryAgeMinutes`) — **sem nova leitura**.

## 6. Uso do `getOperationalOverview()`

- **Reaproveitado** para a última telemetria (zero leitura extra).
- Leitura **própria** só para o que o overview não tem: **alarmes** e
  **sync_runs**. Documentado. Na Início, o overview é buscado **uma vez** e
  passado para HealthScore, AttentionCenter **e** Timeline.

## 7. Limitações

- **Sem eventos de coletor / retorno** na timeline (ver §4) — exige histórico de
  transição confiável `[depende de query futura]`.
- **"Alarme ativo"** usa `atualizadoEm` (não o instante exato de abertura) —
  rotulado "ativo", não "aberto".
- **Telemetria** é **um** marcador (última coleta), não um fluxo contínuo.
- Componente aplicado **só na Início** (genérico, pronto para SolisCloud/Executivo
  depois).

## 8. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Timeline dominada por alarmes | Lê no máx. ~20 alarmes; exibe 8 já mesclado/ordenado. |
| Timestamp de servidor | Convertido para ISO; exibição relativa ("há X"). |
| Confundir marcador de telemetria com evento contínuo | Texto "Última coleta da frota (...)". |
| Pureza da lógica | `buildTimeline` recebe `nowMs` (sem `Date.now()` interno) → determinística. |

## 9. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- `buildTimeline` pura; I/O só em `getTimeline` (+ a nova query de leitura).

## 10. Próximos passos sugeridos

- **Histórico de transição de coletores** (offline→online) para eventos reais de
  "caiu/voltou" — exige consulta ao histórico de `telemetria_coletor`.
- Enriquecer alarmes com **nível → severidade** (critical vs warning) quando o
  `nivel` for confiável.
- Reuso da timeline na **SolisCloud** (aba O&M) e avaliação no **Executivo**.

> **Não iniciado:** GenerationHeatmap, ComparisonChart, SiteMap, NOC/SOC completo,
> persistência de snapshots, deep-link avançado, migração.
