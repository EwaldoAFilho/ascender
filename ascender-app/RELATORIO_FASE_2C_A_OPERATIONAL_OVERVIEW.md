# RELATÓRIO — Fase 2C-A · getOperationalOverview + contexto solar/noturno

Branch: `ux/fase-2c-a-operational-overview`

Duas mudanças pequenas, aditivas e reversíveis: (1) **camada única de leitura
operacional** e (2) **regra conservadora de contexto solar/noturno** para reduzir
falso positivo de "usina offline" — sem mascarar falhas reais.

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_2C_A_OPERATIONAL_OVERVIEW.md` | Duplicidades, centralização, regra solar/noturno, riscos (antes do código). |
| `src/lib/operacao/operational-overview.ts` | `getOperationalOverview()` — **única** camada de I/O + contexto solar (`isSolarWindow`). |
| `RELATORIO_FASE_2C_A_OPERATIONAL_OVERVIEW.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/lib/operacao/health-score.ts` | `getHealthScore(overview?)` passa a consumir o overview; `computeHealthScore` ganha `isSolarWindow` (continua **pura**); mapper `healthInputFromOverview`. |
| `src/lib/operacao/incidents.ts` | `getIncidents(overview?)` consome o overview; `buildIncidents` ganha `isSolarWindow` (continua **pura**); mapper `incidentsInputFromOverview`. |
| `src/app/(dashboard)/page.tsx` (Início) | Busca o overview **uma vez** e passa para Health Score e Centro de Atenção; selo de frescor usa `overview.lastTelemetryIso`. |

> **Não** foram tocados: auth, rotas, contratos de API externa, schema, regra de
> negócio (faturas/rateio/geração/telemetria). Sem migração, sem mock.

## 3. Leituras deduplicadas (Início)

| Leitura | Antes | Depois |
|---|---|---|
| `lerEstacoesDoBanco()` (Health+Incidents) | 2× | **1×** (no overview) |
| `lerColetoresDoBanco()` | 2× | **1×** |
| `ultimaTelemetriaEm()` | 3× (incl. chamada direta da página) | **1×** (no overview; a chamada direta foi removida) |
| `contarFaturasVencidasDg()` | 2× | **1×** |

> Fora do escopo (registrado): `getUsinasComTelemetria()` +
> `getTelemetriaPorStation()` ainda releem estações para o **cockpit/frota** —
> dívida separada, não tocada nesta fase.

## 4. O que mudou no HealthScore

- Internamente passa pelo **overview**; externamente **compatível**
  (`getHealthScore()` sem argumento ainda funciona — usado no Executivo).
- `computeHealthScore` segue **pura**, agora com `isSolarWindow`:
  - **Noite:** penalidade de **usina offline = 0**; regras de proteção de offline
    (forçar atenção / 30% crítico) **não** se aplicam; o motivo de offline vira
    **`info`** "Sem geração (fora da janela solar)".
  - **Coletor offline, alarme, atraso, faturas:** **inalterados** (dia e noite).

## 5. O que mudou no AttentionCenter

- `getIncidents(overview?)` consome o overview; `buildIncidents` segue **pura**.
- **Noite:** em vez de N incidentes `critical` "Usina offline", **um** incidente
  **`info`** agregado "Sem geração (fora da janela solar)".
- **Dia:** comportamento original (1 crítico por usina offline).
- Coletor/alarme/atraso/faturas: **inalterados**.

## 6. Contexto solar/noturno (como ficou)

- **Janela solar `[aproximação]`:** São Paulo **06:00–18:00 = dia**; fora = noite.
  Calculada com `Intl` (`timeZone: America/Sao_Paulo`, `hourCycle: h23`).
- **Conservadora:** janela larga (não mascara falha às 17:50, ainda "dia").
- **Não mascara falha real:**
  - usina offline à noite **não some** — vira item **informativo**;
  - **coletor (datalogger) offline segue `warning`** dia e noite — é o sinal de
    comunicação que deve continuar à noite;
  - **alarme** continua rebaixando o status a qualquer hora.
- **`[indefinido]` assumido:** com os dados atuais não dá para distinguir "usina
  quebrada à noite" de "usina dormindo" — por isso o estado noturno é `info`
  (não conclui falha, nem a esconde).

## 7. Limitações

- **Janela solar real por usina (nascer/pôr do sol):** `[depende de backend:
  coordenadas]` — hoje é aproximação 06–18 SP (sem alterar schema).
- **Cockpit/frota** ainda têm leitura própria de estações (fora do escopo).
- Dedupe **total** entre overview e cockpit exigiria refatorar
  `getUsinasComTelemetria` — **não** feito (escopo/segurança).

## 8. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- Funções puras preservadas; I/O só em `getOperationalOverview`.

## 9. Próximos passos — Fase 2C-B: OperationalTimeline

- Linha do tempo de eventos (alarmes abertos/resolvidos, coletor caiu/voltou,
  execuções de `sync_runs`), reusando o **mesmo overview** + histórico.
- Enriquecer os incidentes de alarme com **mensagem/idade reais** (tabela
  `alarmes`).
- Avaliar usar o overview para abastecer também cockpit/frota (dedupe total).

> **Não iniciado nesta fase:** Timeline, Heatmap, ComparisonChart, SiteMap,
> NOC/SOC completo, persistência de snapshots, migração.
