# PLANO — Fase 2C-B · OperationalTimeline

Linha do tempo operacional (estilo Datadog/Grafana/NOC-SOC) com **eventos reais e
datados** da operação solar, derivada de dados já existentes no banco. Sem
endpoints novos, sem migração, sem mock, sem alterar regra de negócio.

> **Fora do escopo (2C-B):** GenerationHeatmap, ComparisonChart, SiteMap, NOC/SOC
> completo, persistência de snapshots, deep-link avançado.

---

## 1. Eventos que entram na timeline (só com timestamp confiável)

| Evento | Severidade | `type` | Origem (leitura) | Timestamp (`occurredAt`) |
|---|---|---|---|---|
| **Alarme ativo** | `warning` | `alarm` | `historicoAlarmes()` (status ≠ resolvido) | `atualizadoEm` |
| **Alarme resolvido** | `success` | `alarm` | `historicoAlarmes()` (`resolvidoEm` ≠ null) | `resolvidoEm` |
| **Sincronização concluída** | `success` | `sync` | `listarSyncRunsRecentes()` (status `ok`) | `terminadoEm ?? iniciadoEm` |
| **Falha de sincronização** | `critical` | `sync` | `listarSyncRunsRecentes()` (status `erro`) | `terminadoEm ?? iniciadoEm` |
| **Telemetria atualizada** | `info` | `telemetry` | `overview.lastTelemetryIso` (idade ≤ 60 min) | `lastTelemetryIso` |
| **Telemetria atrasada** | `warning` | `telemetry` | `overview.lastTelemetryIso` (idade > 60 min) | `lastTelemetryIso` |

- Cada alarme gera **um** evento (resolvido **ou** ativo, conforme `resolvidoEm`).
- `listarSyncRunsRecentes()` é uma **nova query de leitura** (tabela `sync_runs`,
  somente leitura).

## 2. Tabelas/queries usadas

- `alarmes` → via `historicoAlarmes()` **(já existia)**.
- `sync_runs` → via `listarSyncRunsRecentes()` **(nova, somente leitura)**.
- **última telemetria** → reaproveitada do **`getOperationalOverview()`**
  (`lastTelemetryIso` / `lastTelemetryAgeMinutes`) — **sem nova leitura**.

## 3. Eventos deixados de fora (e por quê)

| Evento | Motivo |
|---|---|
| **Coletor sem comunicação** | O `updateTime` do coletor é **string formatada** (não ISO confiável p/ ordenar). Sem timestamp de transição confiável, **não entra** na timeline — já aparece no **Centro de Atenção** (estado atual). `[depende de query futura]` |
| **Retorno de comunicação** (coletor/usina voltou) | **Não há histórico de transição** comprovando o retorno (só estado atual). **Não inventar** evento de "voltou". `[indefinido]` |
| **Faturas vencidas** | Não têm um instante único coerente para a timeline (várias datas de vencimento); já estão no **Centro de Atenção**. Mantidas fora p/ não criar timestamp artificial. |

## 4. Regras de ordenação

- **Mais recentes primeiro** (`occurredAt` desc).
- Limite inicial de **8** eventos exibidos (ajustável por prop).
- Empate de timestamp: ordem estável de inserção.

## 5. Severidades

- `critical` — falha de sincronização.
- `warning` — alarme ativo, telemetria atrasada (> 60 min).
- `info` — telemetria atualizada.
- `success` — alarme resolvido, sincronização concluída.

Coerente com os tokens de severidade da Fase 1.

## 6. Riscos de interpretação (e mitigação)

| Risco | Mitigação |
|---|---|
| "Alarme ativo" com `occurredAt = atualizadoEm` ≠ momento exato da abertura | Rotulamos "Alarme ativo" (não "aberto"); usamos o timestamp real disponível. |
| Timeline dominada por muitos alarmes | Lemos no máx. ~20 alarmes e exibimos 8 no total já mesclado/ordenado. |
| `sync_runs` com horário de servidor | Datas convertidas para ISO; exibição relativa ("há X min"). |
| Confundir "telemetria atualizada" (1 marcador) com fluxo contínuo | Texto claro: "Última coleta ...". |

## 7. Onde aparece

- **Início (`/`)** — novo painel **"Linha do tempo operacional"**, logo **abaixo
  do Centro de Atenção**.
- **SolisCloud / Executivo** — componente **genérico** (recebe a lista de
  eventos), **pronto para reuso**; aplicação avaliada depois (não nesta fase).

## 8. Uso do `getOperationalOverview()`

- **Reaproveita** o overview para a **última telemetria** (sem nova leitura).
- **Própria leitura** apenas para o que o overview não tem: **alarmes**
  (`historicoAlarmes`) e **sync_runs** (`listarSyncRunsRecentes`) — ambas
  somente leitura. Documentado.

## 9. Contrato

```ts
type TimelineSeverity = "critical" | "warning" | "info" | "success";

type OperationalTimelineEvent = {
  id: string;
  severity: TimelineSeverity;
  type: "alarm" | "telemetry" | "collector" | "sync" | "finance";
  title: string;
  description: string;
  occurredAt: Date | string;
  ageLabel?: string;       // "há 12 min"
  targetLabel?: string;    // usina/job
  href?: string;           // rota existente
};
```

- `buildTimeline(input, nowMs)` — **função pura** (recebe `nowMs` para o
  `ageLabel`, sem `Date.now()` interno).
- `getTimeline(overview?)` — camada de leitura (alarmes + sync_runs + overview).
