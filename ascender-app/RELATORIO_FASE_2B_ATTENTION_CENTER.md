# RELATÓRIO — Fase 2B · Centro de Atenção (AttentionCenter + IncidentItem)

Branch: `ux/fase-2b-attention-center`

Transforma os "motivos" do Health Score numa **área acionável de incidentes**
(estilo Datadog/NOC-SOC), **derivada de dados já existentes no banco**. Sem
endpoints novos, sem migração, sem mock, sem alterar regra de negócio.

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_2B_ATTENTION_CENTER.md` | Incidentes, dados, severidades, priorização, riscos (antes do código). |
| `src/lib/operacao/incidents.ts` | `buildIncidents()` (**função pura**) + `getIncidents()` (única leitura no banco) + tipos. |
| `src/components/operacao/IncidentItem.tsx` | Item acionável (ícone de severidade, alvo, idade, ação). |
| `src/components/operacao/AttentionCenter.tsx` | Painel "Centro de Atenção" (compacto, priorizado, com estado positivo). |
| `RELATORIO_FASE_2B_ATTENTION_CENTER.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/app/(dashboard)/page.tsx` (Início) | `getIncidents()` no `Promise.all` + `<AttentionCenter>` após a faixa de MetricCards. |
| `src/app/globals.css` | **Aditivo:** CSS de `.attention-center` / `.incident-item` (severidade, ação). |

> **Não** foram tocados: backend de regra de negócio, endpoints, auth, rotas,
> contratos de API externa, schema. A única query usada para faturas
> (`contarFaturasVencidasDg`) já existia da Fase 2A.

## 3. Incidentes implementados

| Incidente | Severidade | `source` | Origem (leitura) | Ação |
|---|---|---|---|---|
| Usina offline (por usina) | `critical` | `telemetria` | `lerEstacoesDoBanco()` `state==="offline"` | `/soliscloud` |
| Usina em alarme (por usina) | `warning` | `alarme` | `lerEstacoesDoBanco()` `state==="alarm"` | `/soliscloud` |
| Coletor sem comunicação (por coletor) | `warning` | `coletor` | `lerColetoresDoBanco()` `state==="offline"` | `/soliscloud` |
| Telemetria atrasada | `info` (30–60 min) / `warning` (>60) | `sync` | `ultimaTelemetriaEm()` | — |
| Faturas vencidas (agregado) | `warning` | `financeiro` | `contarFaturasVencidasDg()` | `/financeiro` |
| Ausência de telemetria | `info` | `sync` | sem usinas / sem coleta | `/configuracoes/integracoes` |

**Priorização:** ordena `critical → warning → info`; exibe até **6** itens
(resto vira "+N adicionais"); estado vazio mostra "Tudo operando".

## 4. Dados usados

Todos **leitura no banco** (sync-first), reusando os mesmos do Health Score —
agora **detalhados por entidade** (qual usina/coletor). `getIncidents()` é a
única camada com I/O; `buildIncidents()` é pura.

## 5. Limitações (marcadas, não inventadas)

- **Mensagem/idade real do alarme:** `[depende de query futura]` — hoje usamos
  `state==="alarm"` (consistente com o Health Score). Texto/idade do alarme da
  tabela `alarmes` entra na Fase 2C (Timeline).
- **Deep-link filtrado** (abrir a usina/fatura específica): `[melhoria futura]` —
  hoje os links levam às telas existentes (`/soliscloud`, `/financeiro`).
- **Faturas vencidas** são **um** incidente agregado (contagem), de propósito,
  para não inundar o centro.
- **Aplicação no Executivo:** o componente é genérico e está **pronto para
  reuso**, mas **não foi montado** no Executivo nesta fase para **não poluir** a
  visão consolidada (HealthScore + cockpit + cards já ocupam o topo). Habilitar é
  uma linha (`<AttentionCenter incidents={await getIncidents()} />`).

## 6. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Duplicar os "motivos" do Health Score | Score = resumo agregado; Centro = itens por entidade + ação (hierarquia resumo→detalhe). |
| Inundar a tela | Cap de 6 + agregação de faturas. |
| Leitura extra na Início | Consultas leves/indexadas; roda em paralelo no `Promise.all`. |
| Link sem filtro do incidente | Usa rotas existentes; deep-link filtrado fica para depois. |
| "Sem dados" parecer defeito | Severidade `info` + texto neutro. |

## 7. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- Sem migração; sem mock; sem alteração de API externa/auth/rotas/regra de
  negócio.

## 8. Próximos passos sugeridos

- **Fase 2C — OperationalTimeline:** linha do tempo de eventos (alarmes abertos/
  resolvidos, coletor caiu/voltou, execuções de sync), usando `alarmes` +
  `sync_runs` + histórico de uptime — e então enriquecer os incidentes de alarme
  com mensagem/idade reais.
- Avaliar montar o Centro de Atenção também no **Executivo** e como faixa na
  **SolisCloud** (reuso direto do componente).
- Deep-link filtrado por usina/fatura.

> **Fora desta fase (confirmado):** Timeline, Heatmap, ComparisonChart, SiteMap,
> NOC/SOC completo, persistência de snapshots. Não iniciados.
