# PLANO — Fase 2B · Centro de Atenção (AttentionCenter + IncidentItem)

Transformar os "motivos" do Health Score (Fase 2A) numa **área acionável de
incidentes operacionais** — estilo Datadog / NOC-SOC — **derivada de dados que já
existem no banco**. Sem endpoints novos, sem migração, sem mock, sem alterar
regras de negócio.

> **Fora do escopo (2B):** OperationalTimeline, GenerationHeatmap,
> ComparisonChart, SiteMap, NOC/SOC completo, persistência de snapshots do score.

---

## 1. Incidentes gerados (e dados usados)

Cada incidente é **derivado** dos mesmos dados que alimentam o Health Score —
agora detalhados **por entidade** (qual usina/coletor), não só em contagem.

| Incidente | Origem (leitura já existente) | Severidade | `source` | `href` |
|---|---|---|---|---|
| **Usina offline** (1 por usina) | `lerEstacoesDoBanco()` · `state==="offline"` | `critical` | `telemetria` | `/soliscloud` |
| **Usina em alarme** (1 por usina) | `lerEstacoesDoBanco()` · `state==="alarm"` | `warning` | `alarme` | `/soliscloud` |
| **Coletor sem comunicação** (1 por coletor) | `lerColetoresDoBanco()` · `state==="offline"` | `warning` | `coletor` | `/soliscloud` |
| **Telemetria atrasada** (1) | `ultimaTelemetriaEm()` · idade > 30 min | `info` (30–60) / `warning` (>60) | `sync` | — |
| **Faturas vencidas** (1 agregado) | `contarFaturasVencidasDg()` (já criada na 2A) | `warning` | `financeiro` | `/financeiro` |
| **Ausência de telemetria** (1) | 0 usinas e sem `max(capturado_em)` | `info` | `sync` | `/configuracoes/integracoes` |

> **Decisão de agregação:** faturas vencidas viram **um** incidente com a
> contagem (link para `/financeiro`), para **não inundar** o centro com dezenas de
> itens. Usina/coletor são **por entidade** (poucos e acionáveis individualmente).

### Queries de leitura necessárias
Nenhuma nova: reusa `lerEstacoesDoBanco()`, `lerColetoresDoBanco()`,
`ultimaTelemetriaEm()` e `contarFaturasVencidasDg()` (todas já existentes,
somente leitura).

---

## 2. Severidades

- `critical` — usina offline (não comunica / possivelmente parada).
- `warning` — usina em alarme, coletor mudo, telemetria muito atrasada (>60 min),
  faturas vencidas.
- `info` — telemetria levemente atrasada (30–60 min), ausência total de telemetria
  (estado *desconhecido*, não um defeito).

Coerente com os tokens de severidade da Fase 1 (`--sev-critical/warning/info`).

---

## 3. Regras de priorização

1. Ordenar por severidade: `critical` → `warning` → `info`.
2. Exibir no máximo **6** incidentes no componente (o resto vira "+N adicionais").
3. Quando **não há incidentes**, mostrar estado positivo ("Tudo operando").
4. Caso **ausência de telemetria**: esse é o único incidente exibido (não faz
   sentido listar offline/alarme sem dados).

---

## 4. Riscos de interpretação (e mitigação)

| Risco | Mitigação |
|---|---|
| Duplicação com os "motivos" do Health Score | Health Score = **resumo agregado**; Centro de Atenção = **itens por entidade + ação**. Hierarquia resumo→detalhe (padrão Datadog). |
| "Usina em alarme" vs alarme detalhado | Nesta fase usamos `state==="alarm"` (consistente com o Health Score). Mensagem/idade fina do alarme fica para a Timeline (2C). `[depende de query futura]` |
| Inundar a tela | Cap de 6 + agregação de faturas. |
| Link levar a tela sem filtro do incidente | Usamos **rotas existentes** (`/soliscloud`, `/financeiro`); deep-link com filtro fica para depois. `[melhoria futura]` |
| "Sem dados" parecer problema | Severidade `info` + texto neutro. |

---

## 5. Contrato

```ts
type IncidentSeverity = "critical" | "warning" | "info";

type OperationalIncident = {
  id: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  source: "telemetria" | "alarme" | "coletor" | "financeiro" | "sync";
  targetLabel?: string;   // usina/coletor afetado
  createdAt?: Date | string;
  ageLabel?: string;      // "há 42 min"
  actionLabel?: string;   // "Ver operação"
  href?: string;          // rota existente
};
```

- `buildIncidents(input)` — **função pura** (sem I/O), testável.
- `getIncidents()` — **única** camada de leitura no banco; chama a pura.

---

## 6. Onde aparece (Fase 2B)

- **Início (`/`)** — novo painel **"Centro de Atenção"** (aplicação inicial).
- **Executivo / SolisCloud** — o componente é genérico (recebe a lista de
  incidentes) e fica **pronto para reuso**; a aplicação nessas telas é avaliada
  depois para **não poluir** (decisão registrada no relatório).

---

## 7. Itens marcados (não inventados)

- **Mensagem/idade real do alarme:** `[depende de query futura]` (tabela
  `alarmes` tem `mensagem`/`iniciado_em`; integrar na Fase 2C com a Timeline).
- **Deep-link filtrado** por usina/fatura: `[melhoria futura]`.
- **Tempo de incidente / MTTR:** `[depende de persistência futura]`.
