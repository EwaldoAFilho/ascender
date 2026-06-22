# REVISÃO TÉCNICA — Fase 2C-A · getOperationalOverview + contexto solar/noturno

Branch: `ux/fase-2c-a-operational-overview`

> **Método:** revisão por **código** + **simulação determinística** (as funções
> centrais — `computeHealthScore`, `buildIncidents`, `isSolarWindowAt` — são puras
> e foram traçadas com exatidão; a `isSolarWindowAt` foi executada de fato nos
> horários de borda, sem depender do relógio do servidor).

---

## 1. Ajuste aplicado nesta revisão (pequeno)

Item 4 do pedido: extraída a função **testável** `isSolarWindowAt(date: Date)`
em `operational-overview.ts`, substituindo o helper interno. Usa
`Intl.formatToParts` (robusto em Docker/Node com ICU completo) e **fallback
conservador** (assume *dia* se a hora não vier) — não mascara offline.

---

## 2. Cenários (validação por código/simulação)

Premissa: a regra noturna afeta **apenas** "usina offline" (sem produção).
Coletor/alarme/atraso/faturas seguem inalterados.

### Cenário A — DIA, usina offline → ✔
- `isSolarWindow = true`.
- **HealthScore:** `pOffline = (offline/total)×45 > 0` → **penaliza**; regra
  "offline > 0 nunca healthy" e "≥30% → critical" **ativas**; motivo
  **`critical` "Usinas offline"**.
- **Centro de Atenção:** **1 incidente `critical` por usina** offline ("Ver
  operação" → `/soliscloud`).
- **Resultado:** offline de dia continua crítico e penalizando. ✔

### Cenário B — NOITE, usina offline → ✔
- `isSolarWindow = false`.
- **HealthScore:** `pOffline = 0` → **não penaliza**; regras de proteção de
  offline **não disparam**; motivo vira **`info` "Sem geração (fora da janela
  solar)"**. (Se não houver outro problema, status permanece `healthy` com a nota
  cheia — correto: a usina está apenas sem sol.)
- **Centro de Atenção:** **um único** item **`info`** agregado "Sem geração (fora
  da janela solar)" — **não** N críticos.
- **Resultado:** não penaliza, não inunda, vira info agregada. ✔

### Cenário C — NOITE, coletor offline → ✔
- `isSolarWindow = false`, `silentCollectors > 0`.
- **HealthScore:** `pColl = (silent/total)×20 > 0` → **penaliza** (coletor **não**
  é afetado pela regra noturna); motivo `warning` "Coletores sem comunicação".
- **Centro de Atenção:** incidente(s) `warning` "Coletor sem comunicação"
  (inalterado pela noite).
- **Resultado:** datalogger mudo **não é mascarado**; segue warning + penaliza. ✔

### Cenário D — NOITE, alarme ativo → ✔
- `isSolarWindow = false`, `plantsWithAlarm > 0`.
- **HealthScore:** `pAlarm > 0` → **penaliza**; regra "alarme > 0 nunca healthy"
  **não** é condicionada à janela solar → **rebaixa para `attention`** mesmo à
  noite; motivo `warning` "Usinas em alarme".
- **Centro de Atenção:** incidente(s) `warning` "Usina em alarme" (inalterado).
- **Resultado:** alarme continua rebaixando à noite. ✔

### Cenário E — SEM telemetria → ✔
- `totalPlants = 0` e `lastCommAgeMinutes = null`.
- **HealthScore:** retorno antecipado `noData = true`, `score = 0` **exibido como
  "—"**, `status = "attention"`, label "Sem telemetria" — **não** vira healthy.
  A janela solar não interfere (retorno antes).
- **Centro de Atenção:** **um** item `info` "Sem telemetria" → `/configuracoes/integracoes`.
- **Resultado:** mantém `noData`/"—", não vira saudável. ✔

---

## 3. `isSolarWindow` — validação (executada de fato)

- **Timezone:** `America/Sao_Paulo` (mesmo padrão já usado no app inteiro). ✔
- **Regra:** intervalo de **HORA** `[06, 18)`.
- **Bordas (saída real da função, sem depender do relógio):**

| Hora local SP | Resultado |
|---|---|
| 05:59 | noite ✔ |
| **06:00** | **DIA** ✔ |
| 12:00 | DIA ✔ |
| 17:59 | DIA ✔ |
| **18:00** | **noite** ✔ |
| 23:30 / 00:00 | noite ✔ |

- **Intl em Docker/Node:** o app já usa `Intl.DateTimeFormat` com
  `timeZone: America/Sao_Paulo` em vários pontos (formatadores de data,
  telemetria) → ICU completo presente no runtime. Para robustez extra, a
  `isSolarWindowAt` usa `formatToParts` e tem **fallback "assume dia"**. ✔

---

## 4. Testabilidade

- **`isSolarWindowAt(date)`** exposta → permite simular qualquer horário sem
  mexer no relógio do servidor (foi exatamente assim que validei as bordas).
- `computeHealthScore(input)` e `buildIncidents(input)` recebem `isSolarWindow`
  no input → cenários A–E reproduzíveis de forma determinística.
- Projeto ainda **sem estrutura formal de testes** — não criada agora (fora do
  escopo); a lógica está **isolada e testável** quando houver.

---

## 5. Confirmações (item 5)

- ✔ `getOperationalOverview()` é a **única** nova camada de I/O (verificado:
  `health-score.ts` e `incidents.ts` **não** têm mais leitura direta de banco).
- ✔ `computeHealthScore()` **continua pura**.
- ✔ `buildIncidents()` **continua pura**.
- ✔ `getHealthScore()` **sem argumento** continua funcionando (Executivo usa
  assim).
- ✔ A **Início** lê o overview **uma vez** e compartilha com HealthScore e
  AttentionCenter; selo de frescor usa `overview.lastTelemetryIso`.
- ✔ **Cockpit/frota** ainda têm leitura própria (`getUsinasComTelemetria` +
  `getTelemetriaPorStation`) — **documentado como dívida futura** no PLANO e no
  RELATORIO (dedupe total fica para a 2C-B).

---

## 6. Observações / limitações (não bloqueantes)

- **Janela por hora (não por minuto):** simplificação proposital; suficiente para
  o objetivo. Refinar com nascer/pôr do sol exige coordenadas `[depende de
  backend]`.
- **Usina offline à noite + datalogger online:** vira `info` (sem geração). Se a
  usina estiver realmente quebrada mas o datalogger comunicando, isso **só** será
  inequívoco quando houver alarme — comportamento aceito e documentado
  (`[indefinido]` com os dados atuais; não esconde — apenas não conclui).

---

## 7. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- `isSolarWindowAt` executada nas bordas → resultados corretos (tabela §3).

---

## 8. Conclusão

**Aprovado para merge.** Os cinco cenários (A–E) se comportam como especificado;
a janela solar está correta, testável e robusta; as funções puras e a
compatibilidade externa foram preservadas; a dívida de leitura do cockpit está
registrada. Único ajuste desta revisão: extração de `isSolarWindowAt` (pequeno,
aditivo).

> Aguardando **ok** para o merge na `main`. Fase 2C-B **não iniciada**.
