# PLANO — Fase 2C-A · getOperationalOverview + contexto solar/noturno

Dois objetivos pequenos, aditivos e reversíveis:
1. **Consolidar as leituras operacionais duplicadas** numa única camada
   (`getOperationalOverview`).
2. **Reduzir falso positivo de "usina offline"** fora da janela solar, de forma
   **conservadora** (sem mascarar falhas reais).

> **Fora do escopo (2C-A):** OperationalTimeline, Heatmap, ComparisonChart,
> SiteMap, NOC/SOC completo, persistência de snapshots, migração de banco.

---

## 1. Leituras hoje duplicadas (Início)

Hoje, na Início, `getHealthScore()` e `getIncidents()` leem **os mesmos 4
conjuntos**, cada um por conta própria:

| Leitura | Vezes hoje | De onde |
|---|---|---|
| `lerEstacoesDoBanco()` | health + incidents (2×) | `getHealthScore`, `getIncidents` |
| `lerColetoresDoBanco()` | 2× | idem |
| `ultimaTelemetriaEm()` | 3× | + chamada direta da página (selo de frescor) |
| `contarFaturasVencidasDg()` | 2× | idem |

> Observação: `getUsinasComTelemetria()` e `getTelemetriaPorStation()` (que
> alimentam o **cockpit/frota**) também releem estações — isso é **fora do escopo
> 2C-A** (não são do HealthScore/AttentionCenter) e fica registrado como dívida
> separada.

---

## 2. O que será centralizado

Nova camada **`src/lib/operacao/operational-overview.ts`** com
`getOperationalOverview()` que faz **uma única** rodada de leitura:

- estações (`lerEstacoesDoBanco`) → `plants[]` (state, nome, updateTime);
- coletores (`lerColetoresDoBanco`) → `collectors[]` + `collectorSummary`;
- última telemetria (`ultimaTelemetriaEm`) → `lastTelemetryIso` + idade em min;
- faturas vencidas (`contarFaturasVencidasDg`) → `overdueInvoices`;
- **contexto solar** → `isSolarWindow` (ver §4).

Tipo de saída (`OperationalOverview`) consumido por HealthScore e AttentionCenter.

---

## 3. Como HealthScore e AttentionCenter passam a usar a mesma origem

- `computeHealthScore()` **continua pura** (ganha só o campo opcional
  `isSolarWindow` no input).
- `buildIncidents()` **continua pura** (ganha só `isSolarWindow` no input).
- `getHealthScore(overview?)` e `getIncidents(overview?)` passam a aceitar um
  **overview opcional**:
  - sem argumento → fazem `await getOperationalOverview()` (compatível com hoje);
  - com argumento → **não leem nada** (usam o overview recebido).
- A **Início** busca o overview **uma vez** e passa para ambos → leitura única.
  O selo de frescor passa a usar `overview.lastTelemetryIso` (remove a chamada
  direta a `ultimaTelemetriaEm`).
- O **Executivo** segue chamando `getHealthScore()` sem argumento (compatível).

**Resultado:** as 4 leituras do par HealthScore+AttentionCenter caem de **2×
cada → 1×**, e a leitura direta de última telemetria na página é eliminada.

---

## 4. Estratégia para contexto solar/noturno (conservadora)

### Princípios
- **Não** assumir que toda usina offline à noite é normal.
- **Datalogger (coletor) offline continua sendo problema**, dia ou noite.
- Regra **documentada e conservadora**; se faltar dado, **manter comportamento
  atual** ou marcar `[indefinido]`.
- Objetivo: **preparar a base e reduzir ruído**, **não mascarar falha real**.

### Janela solar `[aproximação]`
Não temos coordenadas por usina (sem lat/long no schema — não vamos alterar
schema). Usamos uma **janela ampla e conservadora** no fuso de São Paulo:
**06:00–18:00 = "dentro da janela solar" (dia)**; fora disso = "noite".
- Janela larga **a favor da segurança**: às 17:50 ainda é "dia" → falha real não
  é mascarada.
- Marcado como **`[aproximação]`** no código e nos relatórios.

### Diferença-chave (o que muda à noite)
| Sinal | Significado | Dia (janela solar) | Noite (fora) |
|---|---|---|---|
| **Estação `offline`** | sem produção | **incidente `critical`** + penaliza o score | **`info`** "sem geração (fora da janela solar)" + **não** penaliza o score |
| **Coletor `offline`** | sem comunicação (datalogger) | `warning` + penaliza | **`warning` + penaliza (inalterado)** |
| **Estação `alarm`** | falha sinalizada | `warning` + penaliza | **inalterado** (alarme é falha a qualquer hora) |
| Telemetria atrasada / faturas | — | inalterado | inalterado |

Racional: à noite a usina **não gera** — `offline` da estação é esperado e não
deve gerar alarme crítico nem derrubar a saúde. Mas o **datalogger deve continuar
comunicando** (reportando zero geração); se ele cai, **isso é problema real** e
permanece visível. Assim **não mascaramos** falha de comunicação.

### Efeito no HealthScore (noite)
- Penalidade de **estação offline = 0**; regras de proteção de offline (forçar
  atenção / 30% crítico) **só valem no dia**.
- Penalidades de **coletor**, **alarme**, **atraso** e **vencidas**: **inalteradas**.
- Motivo de offline vira **`info`** ("sem geração — fora da janela solar").

### Efeito no AttentionCenter (noite)
- Em vez de N incidentes `critical` "Usina offline", **um** incidente **`info`**
  agregado: "N usina(s) sem geração (fora da janela solar)".
- Coletor/alarme/atraso/faturas: **inalterados**.

---

## 5. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Mascarar usina realmente quebrada à noite | Estação offline à noite vira `info` (visível, não some); coletor offline segue `warning`. |
| Janela 06–18 não bater com estação/latitude | Janela **larga** e conservadora; marcada `[aproximação]`; ajustável depois com coordenadas (fora do escopo). |
| Quebrar compatibilidade de `getHealthScore`/`getIncidents` | Overview é **parâmetro opcional**; sem ele, comportamento atual. |
| Função pura virar impura | I/O fica **só** em `getOperationalOverview`; `computeHealthScore`/`buildIncidents` seguem puras. |
| Fuso/hora errados | Hora calculada em `America/Sao_Paulo` com `hourCycle: h23`. |

## 6. Impacto esperado

- **Menos leituras** repetidas na Início (par HealthScore+AttentionCenter: 1× cada).
- **Menos ruído noturno**: a saúde não despenca à noite por usinas sem sol, e o
  Centro de Atenção não inunda de "offline" crítico — **sem esconder** datalogger
  mudo nem alarmes.
- **Sem mudança** de contrato externo, rotas, auth, schema ou regra de negócio.

## 7. Itens marcados (não inventados)

- **Janela solar por usina (nascer/pôr do sol real):** `[depende de backend:
  coordenadas]` — fora do escopo; hoje é aproximação 06–18 SP.
- **Distinguir "quebrada à noite" de "dormindo":** `[indefinido]` com os dados
  atuais — por isso o estado noturno é `info` (não conclui falha, não a esconde).
