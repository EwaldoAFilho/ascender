# PLANO — Fase 2A · HealthScore

Primeira camada real de **inteligência operacional**: um **Health Score (0–100)**
da operação, **derivado de dados que já existem no banco**. Sem endpoints novos,
sem migração, sem mock. Tudo aditivo e reversível.

> Escopo restrito (2A): apenas o HealthScore + sua exibição na Início e no
> Executivo. **Fora do escopo agora:** AttentionCenter, Timeline, Heatmap,
> ComparisonChart, SiteMap, NOC/SOC.

---

## 1. Dados usados (todos leitura no banco)

| Fator | Origem (já existe) | Campo |
|---|---|---|
| Usinas online/offline/alarme | `lerEstacoesDoBanco()` (`telemetria_estacao`, último por estação) | `state` ∈ `online \| alarm \| offline` |
| Coletores sem comunicação | `lerColetoresDoBanco()` (`telemetria_coletor`) | `resumo.total`, `resumo.offline` |
| Idade da última comunicação | `ultimaTelemetriaEm()` (`max(capturado_em)`) | timestamp → minutos |
| Faturas vencidas | **nova query de leitura** `contarFaturasVencidasDg()` (`faturas_dg`) | `vencimento < hoje` e `valor_pago < valor_total` |
| Financeiro em aberto (contexto) | `getResumoFaturasDg()` | `emAberto` (não entra no cálculo; só contexto) |

A nova query é **somente leitura**, agregada (`count(*)`), sem regra de negócio
nova:

```sql
select count(*) from faturas_dg
where vencimento is not null
  and vencimento < to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM-DD')
  and coalesce(valor_pago,0) < coalesce(valor_total,0)
```

> Se a contagem de vencidas falhar ou não houver faturas, o fator é **omitido**
> (não derruba a nota nem inventa valor).

---

## 2. Fórmula inicial (penalidades sobre 100)

Começa em **100** e subtrai penalidades por fator. O score é **majoritariamente
operacional**; o financeiro entra com peso pequeno e secundário.

| Fator | Cálculo | Peso máx. | Categoria |
|---|---|---|---|
| Usinas offline | `(offline / total) × 45` | −45 | operacional |
| Usinas em alarme | `(alarme / total) × 20` | −20 | operacional |
| Coletores offline | `(coletoresOffline / coletoresTotal) × 20` | −20 | operacional |
| Telemetria atrasada | 0 até 30 min; linear 30→180 min; −15 acima | −15 | confiabilidade |
| Faturas vencidas | `min(vencidas, 20)/20 × 10` | −10 | financeiro (secundário) |

```
score = clamp( round(100 − pOffline − pAlarme − pColetores − pAtraso − pVencidas), 0, 100 )
```

### Faixas de status
- **healthy** — score ≥ 85
- **attention** — 60 ≤ score < 85
- **critical** — score < 60

### Regras de proteção (evitam nota enganosa)
1. **Qualquer usina offline** ⇒ status nunca é `healthy` (mínimo `attention`).
2. **≥ 30% das usinas offline** ⇒ status `critical` independente do score.
3. **Telemetria > 60 min atrasada** ⇒ mínimo `attention` (os contadores "online"
   podem estar velhos — não dá para afirmar saúde).
4. **Sem telemetria** (0 usinas / sem `max(capturado_em)`) ⇒ status `attention`,
   rótulo "Sem telemetria", e a nota é exibida como **"—"** (não como 100 nem 0).

---

## 3. Por que esses pesos

- **Offline pesa mais (45):** usina sem comunicar é o pior sintoma operacional
  (pode estar parada e não gerando).
- **Alarme e coletores (20 cada):** degradam, mas a usina ainda pode estar
  gerando; coletor mudo = risco de cegueira de dados.
- **Atraso (15):** mede confiabilidade do dado, não da usina.
- **Vencidas (10):** sinal de negócio; entra leve para **não** transformar um
  problema financeiro em "operação crítica".

Pesos e fórmula ficam **versionados** neste doc e centralizados em
`computeHealthScore` (fácil de ajustar depois com base no uso real).

---

## 4. Riscos de interpretação (e mitigação)

| Risco | Mitigação |
|---|---|
| Nota "saudável" com uma usina offline | Regra de proteção #1 (nunca healthy com offline). |
| Dados velhos darem falsa sensação de saúde | Regra #3 (atraso > 60 min força atenção) + fator de atraso. |
| Misturar financeiro e operação | Peso baixo (−10) e rótulo separado nos motivos; documentado. |
| "Sem dados" virar 0 (crítico) ou 100 (saudável) | Regra #4: exibe "—" e status atenção. |
| Score parecer preciso demais | Sempre acompanhado dos **motivos** (por que a nota é essa). |
| Divergência entre telas | Início e Executivo chamam **a mesma** `getHealthScore()`. |

---

## 5. Contrato de saída

```ts
type HealthScoreResult = {
  score: number;                 // 0–100 (exibido como "—" no caso sem-dados)
  status: "healthy" | "attention" | "critical";
  label: string;
  reasons: Array<{
    severity: "success" | "warning" | "critical" | "info";
    title: string;
    description: string;
  }>;
  counters: {
    onlinePlants?: number;
    offlinePlants?: number;
    plantsWithAlarm?: number;
    silentCollectors?: number;
    overdueInvoices?: number;
  };
};
```

`computeHealthScore(input)` é **função pura** (sem I/O, testável);
`getHealthScore()` faz as leituras no banco e chama a pura.

---

## 6. Onde aparece (Fase 2A)

- **Início (`/`)** — substitui o `StatusBanner` de Fase 1 pela versão com
  HealthScore (mesmo "slot" no topo, agora com nota + motivos).
- **Executivo (`/executivo`)** — novo `HealthScore` no topo do consolidado.
- `StatusBanner` **evolui** para aceitar `health?` (compatível com o uso por
  contagens da Fase 1) e fica disponível para reuso futuro (ex.: SolisCloud).

---

## 7. Itens marcados (não inventados)

- **Severidade real por usina/alarme (P1/P2/P3):** `[depende de query futura]`
  (hoje só temos `state` e `nivel` do alarme; classificação fina fica para 2B).
- **MTTR / tempo de incidente:** `[depende de query futura]` (precisa de janela
  histórica de `alarmes`/uptime — Fase 2B com a Timeline).
- **Tendência do próprio score:** `[depende de persistência futura]` (hoje o
  score é instantâneo; histórico exigiria gravar snapshots — fora do escopo 2A).
