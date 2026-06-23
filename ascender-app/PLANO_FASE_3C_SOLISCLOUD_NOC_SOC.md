# PLANO — Fase 3C · SolisCloud em modo NOC/SOC

Evoluir a tela **SolisCloud** para uma leitura **operacional NOC/SOC**
(tiles + agrupamento + incidentes), **reaproveitando componentes existentes** e
**mantendo** as tabelas/operação atuais. Sem migration, sem API/tiles externos,
sem mexer na Início.

> **Fora do escopo:** migration, geocodificação, API/tiles externos, novo mapa,
> novo heatmap, alteração de regra de geração/meta/rateio/faturas/telemetria,
> tela Início, QA final.

---

## 1. Diagnóstico atual

A SolisCloud já é **sync-first** (lê do banco via hooks React Query) e tem 2 abas:

- **Operação ao vivo:** `SummaryStrip` (Potência agora, Energia hoje, Comunicação,
  Alarmes) · **Telemetria por estação** (cards) · **Comunicação dos coletores**
  (tabela) · BarList "Energia de hoje" · **Alertas por usina** (`AlarmsByStation`)
  · **Inversores** (tabela).
- **Histórico & O&M:** Potência da frota 24h (gráfico) · Disponibilidade dos
  coletores (tabela) · Histórico de alarmes (tabela).

**Onde há excesso de tabela:** muitos `DataTable` empilhados (coletores,
inversores, uptime, alarmes) — denso, sem "primeiro olhar" do que está ruim.

## 2. Restrição arquitetural (decisiva)

A SolisCloud é **client component** (hooks → `/api/soliscloud/*`). As funções
`getHealthScore/getIncidents/getTimeline` são **de servidor** (leem o banco) e
seus módulos importam código de DB → **não podem ser importadas no cliente**.

**Solução (sem endpoint, sem refatorar cores):** reusar os **componentes de
apresentação** — `StatusBanner`, `AttentionCenter`, `IncidentItem` — que usam só
`import type` (client-safe), **alimentando-os com dados montados no cliente** a
partir dos hooks já carregados (`useStations`, `useCollectors`, `useAlarms`,
`useSyncStatus`). **HealthScore/Timeline** ficam para um próximo incremento
(exigiriam endpoint ou extração dos cores puros).

## 3. Componentes reaproveitados / novos

| Componente | Origem | Uso |
|---|---|---|
| `StatusBanner` (modo contagens) | existente, client-safe | faixa de saúde no topo |
| `AttentionCenter` + `IncidentItem` | existente, client-safe | incidentes (offline/alarme/coletor mudo/atraso) montados no cliente |
| **`StatTile`** | **novo** (apresentação pura) | tiles NOC clicáveis (filtram as estações) |
| `SummaryStrip`, `AlarmsByStation`, `DataTable`, `GenerationChart`, `BarList`, `FrescorTelemetria` | existentes | **mantidos** |

## 4. Proposta de layout NOC/SOC (aba "Operação ao vivo")

```
StatusBanner (saúde, contagens)               <- novo (reuso)
[ Online ][ Em alarme ][ Offline ][ Coletores mudos ][ Alarmes ]   <- StatTiles (novo); os 3 de estação FILTRAM as estações
Centro de Atenção (incidentes críticos)        <- novo (reuso)
Potência agora · Energia hoje (strip enxuto)   <- mantém geração
Telemetria por estação (FILTRADA pelo tile)    <- mantém, agora filtrável
Comunicação dos coletores (tabela)             <- mantém
Energia de hoje por usina (BarList)            <- mantém
Alertas por usina (AlarmsByStation)            <- mantém
Inversores (tabela)                            <- mantém
```
A aba **"Histórico & O&M"** fica **inalterada**.

## 5. Avaliação dos dados (já disponíveis no cliente)

- **Estações:** `useStations()` → `state` (online/alarm/offline), potência, energia.
- **Coletores:** `useCollectors()` → `resumo {online,offline,alarme,total}` + lista.
- **Alarmes:** `useAlarms()` → ativos por usina.
- **Última comunicação:** `useSyncStatus()` → `iso`.
- **Tiles filtráveis:** ✅ viável — estado local `filtroEstado` filtra os cards.
- **Atenção/incidentes específicos:** ✅ montados no cliente (offline → crítico de
  dia / info à noite; alarme/coletor mudo → atenção; telemetria atrasada → atenção)
  — replicando a regra solar/noturna com um check local pequeno.

## 6. Implementação incremental (esta fase)

1. **`StatTile`** (novo, apresentação pura) + CSS.
2. Topo da "Operação ao vivo": `StatusBanner` + **linha de StatTiles** (NOC) +
   `AttentionCenter` (incidentes montados no cliente).
3. **Filtro** por estado nos tiles → filtra "Telemetria por estação" (com "limpar").
4. **Manter** todas as tabelas/blocos atuais abaixo. **Nada removido.**

## 7. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Duplicar lógica de incidentes (vs `buildIncidents`) | helper **pequeno e local** na página; cores não tocados (sem risco p/ Início/Executivo). |
| Poluir mais a tela | tiles **substituem** parte do SummaryStrip; tabelas seguem abaixo; cap no Centro de Atenção. |
| Regra noturna divergir | check solar **local** (mesma janela 06–18 SP) — documentado. |
| Quebrar dados/hooks atuais | mudança **aditiva** no render; hooks e queries **intactos**. |

## 8. Arquivos prováveis

| Arquivo | Mudança |
|---|---|
| `src/components/operacao/StatTile.tsx` | **criar** (apresentação pura). |
| `src/app/(dashboard)/soliscloud/page.tsx` | **aditivo:** StatusBanner + StatTiles + AttentionCenter + filtro. |
| `src/app/globals.css` | **aditivo:** CSS dos StatTiles. |

> Sem endpoint novo, sem query nova, sem migration/schema, sem API/tiles externos,
> sem tocar Início; tabelas e operação atuais preservadas.
