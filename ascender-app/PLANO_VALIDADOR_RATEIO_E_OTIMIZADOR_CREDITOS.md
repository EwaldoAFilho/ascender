# PLANO — Validador Inteligente de Rateio/Faturas & Otimizador de Créditos SCEE

> Diagnóstico técnico e arquitetura incremental para dois módulos no sistema ASCENDER.
> **Princípio condutor:** primeiro extrair valor com **regra determinística, SQL e jobs**; IA/ML só onde regra simples não resolve.
> **Regra de ouro do projeto:** APIs externas (SolisCloud, Digital Grid) são **somente leitura** — estes módulos **recomendam**, nunca executam mudança no Digital Grid.
> Data: 2026-06-23 · Base: `ascender-app` (Next.js 15 + Postgres/Drizzle, sync-first).

---

## 1. Resumo executivo

É **viável hoje** implementar a maior parte do **Validador de Rateio/Faturas** usando apenas **SQL + funções puras + um job de auditoria a cada 6h** (acoplado ao ciclo de sync do Digital Grid que já existe). Cerca de **11 das 17 validações pedidas são executáveis com os dados atuais** (totalmente ou como heurística forte); as demais dependem de **dados que faltam** — principalmente **contratos preenchidos** (tarifa/desconto por UC) e **dados de vintage/vencimento de crédito SCEE** (inexistentes no banco hoje).

O **Otimizador de Créditos SCEE** é viável **em nível diagnóstico** hoje (identificar UCs sub/superalocadas, créditos parados, sobras/déficits recorrentes) e **recomendação simples** (sugerir ajuste de %), mas a **otimização prescritiva real (LP/MILP)** depende de três insumos ausentes: **saldo/vintage autoritativo de crédito**, **tarifa confiável por UC** e **restrições regulatórias de elegibilidade** (quais UCs podem receber de qual usina — mesma distribuidora/titularidade, regras do SCEE/Lei 14.300).

**Onde IA agrega valor de verdade:** apenas **(F) LLM para narrativa/explicação** dos achados e **extensão do parser de contas** a novas distribuidoras. **ML preditivo não é necessário** para nenhuma das validações nem para o otimizador inicial — tudo é regra/SQL/algoritmo determinístico. Recomenda-se **não usar IA** onde regra resolve.

| | Validador de Rateio/Faturas | Otimizador SCEE |
|---|---|---|
| Diagnóstico (Fase 1, só leitura) | ✅ viável já | ✅ viável já (com ressalvas) |
| Alertas + painel + impacto (Fase 2) | ✅ viável já | ✅ viável já |
| Recomendação/simulação (Fase 3) | ➖ parcial (depende de contrato) | ⚠️ depende de tarifa + elegibilidade |
| Otimização prescritiva (Fase 4) | n/a | 🔴 depende de dados novos |

---

## 2. Diagnóstico dos dados existentes

### 2.1 O que existe e está bom
- **Rateio real** (`rateios_dg`): `percentual`, `consumo_kwh`, `creditos_acumulados`, `covering`, por **UC × usina × competência**, com `owner_document`/`owner_name`. Atualizado a cada 6h. **Payload completo em `raw`**.
- **Faturas reais** (`faturas_dg`): `valor_total`, `valor_energia`, `valor_pago`, `economia`, `consumo_kwh`, `energia_injetada_kwh`, `payment_status`, `vencimento`, `pago_em`, por **fatura/UC/competência**. **Payload completo em `raw`** (inclui campos não promovidos a coluna, ex.: `balance_credits`).
- **Geração mensal** (`medicoes_geracao`): `geracao_kwh`, `receita`, por **usina × competência** (ano corrente).
- **Cadastro-mestre**: `usinas` (`potencia_kwp`, `geracao_esperada_kwh_mes`), `unidades_consumidoras` (`codigo_instalacao`, `consumo_medio_kwh`), `clientes` (`documento`, `status`).
- **Conta da distribuidora** (`contas_energia`): saldos **SCEE** reais (`scee_saldo_atual_kwh`, `scee_creditos_kwh`, `scee_saldo_proximo_kwh`, `scee_injetado_kwh`, `scee_compensado_kwh`…) — **mas apenas para contas anexadas manualmente** (esparso).

### 2.2 O que falta / fragilidades (lacunas)
1. **Contratos esparsos** — `contratos` (tarifa distribuidora, tarifa ASCENDER, `percentual_desconto`, vínculo UC↔usina) é manual e provavelmente pouco preenchido. **É a maior dependência** das validações financeiras (cobrança esperada, desconto contratado, valor calculado × faturado).
2. **Vintage/vencimento de crédito SCEE inexistente** — não há data de origem por lote de crédito. SCEE expira em 60 meses (regra ANEEL), mas o banco só tem `creditos_acumulados` (um número agregado, sem datação). **`/financial-credits/` existe no DG e NÃO é sincronizado.**
3. **Junções por string, não FK** — `rateios_dg.installation` / `faturas_dg.installation_number` ↔ `unidades_consumidoras.codigo_instalacao`; `owner_document` ↔ `clientes.documento` (precisa normalizar dígitos); `usina_nome` ↔ `usinas.nome` (fuzzy) ou via `codigo_digital_grid`↔`generator_number`. **Qualquer divergência de código quebra o cruzamento** → muitas validações dependem de cadastro conciliado.
4. **Escala do `percentual` não confirmada empiricamente** — `num(q.percentage)` pode estar em 0–100 ou 0–1. **Validar com dados reais antes de aplicar regra de soma=100%.**
5. **Restrições regulatórias de elegibilidade não modeladas** — quais UCs podem receber de qual usina (mesma distribuidora/concessão, titularidade/consórcio). Necessário para otimização real.
6. **Tarifa por UC não confiável** — tarifa só existe em `contratos`/`propostas` (manual). A `economia` do DG é o melhor proxy financeiro pronto.
7. **Histórico profundo no Excel, não ingerido** — séries de 12+ meses (sobras/déficits recorrentes) ganham robustez após o importador Excel.

---

## 3. Mapa de tabelas e fluxos (inventário — Tarefa 1)

| Dado de negócio | Tabela/arquivo | Campos relevantes | Relacionamentos | Atualização | Histórico? | Append-only? | Qualidade | Lacuna |
|---|---|---|---|---|---|---|---|---|
| **Usinas** | `usinas` (`schema.ts`) | `nome`, `potencia_kwp`, `geracao_esperada_kwh_mes`, `codigo_digital_grid`, `station_id_soliscloud`, `lat/long` | → contratos, faturas, medições, telemetria | Manual + import SolisCloud | Não (estado) | Não | Boa | Meta às vezes auto |
| **Unidades consumidoras** | `unidades_consumidoras` | `codigo_instalacao`, `consumo_medio_kwh`, `cliente_id`, `distribuidora_id`, `ativo` | cliente; ↔ DG por código | Manual + conciliação DG | Não | Não | **Depende de conciliação** | UCs só no DG não entram |
| **Clientes/prosumidores** | `clientes` | `documento`, `tipo`, `status`, `email` | → UCs, contratos, faturas | Manual + conciliação | Não | Não | Boa | — |
| **Contratos** | `contratos` | `tarifa_distribuidora`, `tarifa_ascender`, `percentual_desconto`, `status`, `cliente_id`, `unidade_consumidora_id`, `usina_id` | cliente/UC/usina | Manual | Não | Não | **Esparsa (crítico)** | Pouco preenchido |
| **Faturas** | `faturas_dg` | `valor_total`, `valor_energia`, `valor_pago`, `economia`, `consumo_kwh`, `energia_injetada_kwh`, `payment_status`, `vencimento`, `pago_em`, `installation_number`, `competencia`, `raw` | UC por `installation_number` | DG /bills, 6h | **Sim** (por competência) | Upsert por `dg_bill_id` | Boa | Sem FK p/ UC |
| **Créditos de energia** | `rateios_dg.creditos_acumulados`; `contas_energia.scee_*` | saldo acumulado por UC; SCEE real | UC/usina | 6h / sob demanda | Parcial | rateios: upsert | **rateios: proxy; contas: esparso** | **Sem vintage/vencimento** |
| **Rateio** | `rateios_dg` | `installation`, `usina_nome`, `generator_number`, `owner_document`, `percentual`, `consumo_kwh`, `covering`, `competencia`, `raw` | UC/usina/cliente por código | DG /estimated-quota, 6h | **Sim** (por competência) | Upsert por (gm_id, installation, owner_doc) | Boa | Junção por string |
| **Percentuais de distribuição** | `rateios_dg.percentual` (+ `covering`) | % por UC×usina×mês | — | 6h | Sim | Upsert | Boa | Escala a confirmar |
| **Valores cobrados** | `faturas_dg.valor_total` (+ `valor_energia`, `economia`) | cobrado/energia/economia | UC | 6h | Sim | Upsert | Boa | Tarifa implícita |
| **Leitura de geração** | `medicoes_geracao`; `telemetria_estacao` | `geracao_kwh`, `receita`; potência/energia 10 min | usina | 6h / 10 min | **Sim** | medições: upsert; telemetria: **append-only** | Boa | Profundidade rasa |
| **Leitura de consumo** | `rateios_dg.consumo_kwh`; `faturas_dg.consumo_kwh`; `contas_energia.energia_kwh`; `uc.consumo_medio_kwh` | consumo mensal por UC | UC | 6h / sob demanda | Sim | upsert | Boa | — |
| **Auditoria de sync** | `sync_runs` | `job`, `status`, `itens`, tempos | — | 10 min/6h | Sim | Append | Boa | — |
| **Trilha de alteração** | `cadastro_historico` | `entidade`, `acao`, `valor_antes/depois`, `autor` | genérico | Sob demanda | Sim | Append | Boa | — |
| **Eventos técnicos** | `alarmes` | `nivel`, `status`(aberto/tratativa/resolvido), `resolvido_em` | usina | 10 min | Sim | Upsert por `alarm_id` | Boa | — |

**Jobs que processam DG/Neoenergia (hoje):**
- `db:sync-faturas-dg` → `syncFaturasDg()` (DG `/bills` → `faturas_dg`) — **cron 6h** (serviço `sync`).
- `db:sync-rateio-dg` → `syncRateioDg()` (DG `/estimated-quota` + `/monthly-generation` + `/generators` → `rateios_dg`) — **cron 6h**.
- `db:conciliar-dg` / `importarCadastrosDg()` (DG `/entities`,`/installations`,`/generators` → cadastros) — **manual**.
- Conta Neoenergia: `parse-conta.ts` + IA (`extract.ts`) → `contas_energia` — **sob demanda** (upload).

**Regras de negócio já existentes (reaproveitáveis):**
- `contarFaturasVencidasDg()` — vencidas e não quitadas (`vencimento < hoje AND valor_pago < valor_total`).
- `conciliarBoleto()` — confere **CNPJ/CPF** do PDF × titular esperado (`status: cnpj_divergente`).
- `checarDivergencia()` — confere **UC + competência** do PDF × fatura.
- `getDocumentoPorInstalacao()` / `getClientePorInstalacao()` — resolução de UC↔cliente↔documento.
- Lifecycle de status `aberto→em-tratativa→resolvido` em `alarmes` (modelo para findings).

---

## 4. Validador de Rateio/Faturas — viabilidade por validação (Tarefa 2)

> Severidade: 🔴 crítica · 🟠 alta · 🟡 média · 🔵 informativa.
> "Hoje?": ✅ sim · ➖ parcial/heurística · 🔴 não (falta dado).

| # | Validação | Hoje? | Dados que existem | Faltam | Tabela | Regra / SQL (esboço) | Impacto financeiro | Sev. | Onde exibir |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Σ percentual ≠ 100%** | ➖ | `rateios_dg.percentual` por usina×mês | confirmar escala 0–100 | `rateios_dg` | `GROUP BY competencia, generator_number HAVING abs(sum(percentual)-100) > tol` | Médio (sobra/perda de alocação) | 🟠 | Rateio (aba Auditoria) |
| 2 | **UC sem rateio** | ✅ | UCs cadastradas, rateio da competência | (UCs só-DG) | `unidades_consumidoras` ⟕ `rateios_dg` | UC `ativo` sem linha em `rateios_dg` na última competência | Alto (cliente sem economia) | 🟠 | Rateio + Cadastros |
| 3 | **UC com rateio duplicado** | ✅ | `rateios_dg` | — | `rateios_dg` | `GROUP BY competencia, installation HAVING count(distinct generator_number)>1 OR count(*)>1` | Médio (dupla alocação) | 🟠 | Rateio |
| 4 | **Contrato ativo sem crédito alocado** | ➖ | `contratos.status='ativo'`, rateio | contratos preenchidos | `contratos`⟕`rateios_dg` | contrato ativo cuja UC não aparece em `rateios_dg` recente | Alto | 🟠 | Financeiro/Cadastros |
| 5 | **Crédito disponível não distribuído** | ➖ | `medicoes_geracao.geracao_kwh`, Σ`percentual` | saldo gerador autoritativo | `medicoes_geracao`+`rateios_dg` | usina com geração e Σ`percentual`<100% (ou `covering` baixo) | Alto (energia ociosa) | 🟠 | Rateio/Executivo |
| 6 | **Crédito alocado > disponível** | ➖ | `geracao_kwh`/`energia_injetada_kwh`, consumo coberto | saldo gerador real | idem | Σ(consumo coberto) > geração injetada no mês | Médio | 🟡 | Rateio |
| 7 | **Consumo incompatível com crédito** | ✅ | `rateios_dg.consumo_kwh`, `creditos_acumulados` | — | `rateios_dg` | crédito sobe enquanto consumo cai (ou consumo≫crédito) | Médio | 🟡 | Rateio |
| 8 | **Desconto abaixo do contratado** | 🔴/➖ | `economia`, `valor_energia` (efetivo) | `contratos.percentual_desconto` por UC | `contratos`+`faturas_dg` | desconto efetivo `economia/valor_energia` < `percentual_desconto` | Alto (receita errada) | 🟠 | Financeiro |
| 9 | **Cobrança diferente do esperado** | ➖ | `valor_total`, `consumo_kwh` | tarifa por UC (contrato) | `contratos`+`faturas_dg` | `valor_total` ≠ `consumo×tarifa_ascender` ± tol | Alto | 🟠 | Financeiro |
| 10 | **Fatura sem vínculo com UC** | ✅ | `faturas_dg.installation_number` | (cadastro) | `faturas_dg`⟕`unidades_consumidoras` | `installation_number` sem UC correspondente | Médio (cadastro/cobrança órfã) | 🟡 | Financeiro/Conciliação |
| 11 | **Fatura duplicada (lógica)** | ✅ | `faturas_dg` | — | `faturas_dg` | `GROUP BY installation_number, competencia HAVING count(*)>1` | Alto (cobrança em dobro) | 🔴 | Financeiro |
| 12 | **Competência incorreta** | ✅ | `competencia`, `reference_date`, `vencimento` | — | `faturas_dg` | competência vazia, ou mês de `vencimento` incoerente com `competencia` | Baixo | 🔵 | Financeiro |
| 13 | **Valor calculado ≠ faturado** | ➖ | `valor_total`, `consumo`, `economia` | tarifa/contrato | `contratos`+`faturas_dg` | igual #9, com fórmula contratual completa | Alto | 🟠 | Financeiro |
| 14 | **Créditos parados** | ✅ | `rateios_dg.creditos_acumulados` (série) | — | `rateios_dg` | saldo cresce/estável N competências e consumo coberto baixo | Alto (crédito ocioso) | 🟠 | Rateio/Otimizador |
| 15 | **Créditos próximos do vencimento** | 🔴 | — | **vintage/data do crédito** | `/financial-credits` (não sync) | — (proxy: "parado há N meses") | **Muito alto** (perda total) | 🔴 | Otimizador |
| 16 | **Créditos vencidos** | 🔴 | — | **vintage/data** | idem | — | Muito alto | 🔴 | Otimizador |
| 17 | **Divergência DG × banco × contrato** | ➖ | DG (`faturas_dg`/`rateios_dg`), banco, contrato | contratos | as três fontes | comparar tarifa/UC/usina entre as 3; reportar diferenças | Variável | 🟠 | Auditoria |

**Resumo Tarefa 2:** ✅ executáveis já: **#2, #3, #7, #10, #11, #12, #14** (7) · ➖ heurística/parcial hoje, plenas com contratos: **#1, #4, #5, #6, #8, #9, #13, #17** (8) · 🔴 bloqueadas por dado ausente: **#15, #16** (vintage de crédito).

---

## 5. Otimizador de Créditos SCEE — viabilidade (Tarefa 3)

### 5.1 Inventário de insumos
| Insumo | Existe? | Onde | Observação |
|---|---|---|---|
| Saldo de crédito por UC | ➖ proxy | `rateios_dg.creditos_acumulados`; `contas_energia.scee_saldo_atual_kwh` | proxy (agregado) / real porém esparso |
| Saldo de crédito por usina | ➖ | `contas_energia` (layout gerador, esparso); `medicoes_geracao` | sem saldo gerador consolidado |
| Consumo histórico por UC | ✅ | `rateios_dg.consumo_kwh`, `faturas_dg.consumo_kwh` | bom |
| Geração histórica por usina | ✅ | `medicoes_geracao` | ano corrente; +Excel |
| Percentual de rateio vigente | ✅ | `rateios_dg.percentual` | confirmar escala |
| Contratos ativos | ➖ | `contratos.status` | esparso |
| Desconto contratado | ➖ | `contratos.percentual_desconto` | esparso |
| **Vencimento de créditos** | 🔴 | — | **ausente (crítico)** |
| Tarifa da distribuidora | ➖ | `contratos`/`propostas` | esparso |
| Valor cobrado | ✅ | `faturas_dg.valor_total` | bom |
| Regras de elegibilidade | 🔴 | — | não modeladas |
| Restrições regulatórias | 🔴 | — | SCEE/Lei 14.300 não modelada |
| Capacidade disponível por usina | ➖ | `potencia_kwp`, `geracao_esperada_kwh_mes` vs alocado | derivável aproximada |
| Sobras/déficits recorrentes | ✅ | `medicoes_geracao` vs Σ`consumo_kwh` | derivável |

### 5.2 Oportunidades de otimização **sem IA**
| Oportunidade | Viável hoje? | Existe | Falta | Algoritmo | Risco de erro | Impacto | Esforço | Prioridade |
|---|---|---|---|---|---|---|---|---|
| Redistribuir créditos parados | ➖ (recomendar) | `creditos_acumulados`, consumo | saldo autoritativo | ranquear UCs com saldo parado → sugerir destino com déficit | Médio (proxy) | Alto | M | **Alta** |
| Priorizar créditos próx. vencimento | 🔴 | — | **vintage** | FIFO por idade do crédito | Alto sem dado | Muito alto | M (após dado) | Alta (pós-dado) |
| Evitar crédito em UC de baixo consumo | ✅ | consumo×crédito | — | flag UC `creditos>k×consumo` | Baixo | Médio | P | Alta |
| Priorizar UC com consumo crescente | ✅ | série `consumo_kwh` | — | tendência linear simples por UC | Baixo | Médio | P | Média |
| Identificar UC subalocada | ✅ | consumo vs % vs cobertura | — | `consumo>covering` recorrente | Baixo | Alto | P | **Alta** |
| Identificar UC superalocada | ✅ | crédito vs consumo | — | `crédito acumulando` + cobertura>1 | Baixo | Médio | P | Alta |
| Sugerir mudança de % de rateio | ➖ | %, consumo, geração | elegibilidade | balancear % p/ casar consumo previsto | Médio-Alto | Alto | M | Média |
| Sugerir entrada de novos clientes | ➖ | capacidade livre, sobras | demanda/pipeline | sobra recorrente → "cabe +X kWh" | Médio | Médio | M | Média |
| Realocar entre usinas | 🔴 | geração/consumo | **elegibilidade regulatória** | transferência condicionada a regras | **Alto** | Alto | G | Baixa (depende) |
| Estimar ganho financeiro da redistribuição | ➖ | crédito kWh, tarifa | tarifa confiável | `kWh_recuperado × tarifa_ref` | Médio | — | P | Alta (transversal) |

**Conclusão Tarefa 3:** o otimizador entrega valor **já** como **diagnóstico + recomendação simples** (sub/superalocação, créditos parados, sobras/déficits, estimativa de ganho com tarifa de referência configurável). A **otimização prescritiva entre usinas e por FIFO de vencimento** fica bloqueada até existirem **vintage de crédito**, **tarifa confiável** e **matriz de elegibilidade**. Como o rateio é alterado **no Digital Grid (read-only aqui)**, o módulo **sempre recomenda; nunca executa** — o que está alinhado ao pedido.

---

## 6. Classificação: regra × algoritmo × IA (Tarefa 4)

> **A** Regra determinística · **B** SQL/relatório · **C** Job de auditoria recorrente · **D** Algoritmo de otimização · **E** ML · **F** LLM (só narrativa/explicação)

| Item | Categoria |
|---|---|
| Validações #1–#13, #17 (rateio/faturas) | **A + B + C** |
| Créditos parados #14 | **B + C** |
| Créditos vencendo/vencidos #15–#16 | **A + C** *(após ingerir vintage; não é ML)* |
| Sub/superalocação, baixo consumo, tendência de consumo | **A + B** *(tendência = regressão linear trivial, não ML)* |
| Sugerir mudança de % / realocar entre usinas | **D** (LP/MILP) *(não ML)* |
| Estimativa de ganho financeiro | **A** (cálculo) |
| Explicar achados em linguagem natural / relatório executivo | **F** (LLM) |
| Extensão do parser de contas a novas distribuidoras | **F** (LLM, infra já existe) |
| Previsão de consumo/geração para alimentar o otimizador | **E** (ML) — **opcional, fase futura** |

**Veredito:** **nenhuma** validação exige ML. O otimizador inicial é **algoritmo determinístico (D)**, não ML. IA entra só como **(F) camada de explicação** e parser. **Não usar IA onde regra resolve.**

---

## 7. Arquitetura proposta (Tarefa 5)

Segue os padrões reais do projeto: **funções puras testáveis** (como `getHealthScore`/`buildIncidents`), **jobs no serviço `sync`** (como os crons DG), **auditoria via `sync_runs`**, **lifecycle de status como `alarmes`**, **histórico como `cadastro_historico`**.

### 7.1 Tabelas novas (nomes adaptados ao padrão PT/snake do projeto)

```
auditoria_runs            -- 1 linha por execução do job (espelha sync_runs)
  id, job ('rateio'|'creditos'), iniciado_em, terminado_em,
  status ('ok'|'erro'), achados_total, competencia_ref, mensagem

insights_operacionais     -- findings unificados (validador + otimizador)
  id, run_id (fk auditoria_runs),
  tipo ('validacao'|'otimizacao'),
  regra (ex.: 'soma_percentual', 'fatura_duplicada', 'credito_parado', 'uc_subalocada'),
  severidade ('critica'|'alta'|'media'|'info'),
  entidade ('uc'|'usina'|'cliente'|'fatura'|'rateio'),
  entidade_ref (codigo_instalacao / usina_nome / documento / dg_bill_id),
  competencia,
  titulo, detalhe (jsonb: valores observados × esperados),
  impacto_financeiro (numeric, R$ estimado),
  recomendacao (text, p/ otimizador),
  status ('aberto'|'em-tratativa'|'resolvido'|'ignorado'),  -- igual alarmes
  visto_em, atualizado_em, resolvido_em,
  resolvido_por, resolvido_por_id, nota_resolucao
  UNIQUE(regra, entidade_ref, competencia)  -- idempotência entre execuções (upsert)
```

> Tabela **única** `insights_operacionais` (discriminada por `tipo`/`regra`) segue o padrão genérico já usado em `anexos`/`cadastro_historico`. Alternativa "à inglesa" pedida no enunciado mapeia 1:1: `rateio_audit_runs`/`credit_optimization_runs` → `auditoria_runs`; `rateio_audit_findings`/`credit_optimization_suggestions`/`operational_insights` → `insights_operacionais`.

### 7.2 Camadas
```
src/lib/auditoria/
  rules/                 -- FUNÇÕES PURAS (entrada: rows → saída: Finding[]); 100% testáveis sem DB
    soma-percentual.ts, uc-sem-rateio.ts, rateio-duplicado.ts,
    fatura-duplicada.ts, fatura-sem-uc.ts, competencia-incorreta.ts,
    consumo-incompativel.ts, credito-parado.ts, ...
  otimizacao/            -- algoritmos determinísticos (sub/superalocação, ganho estimado)
  impacto.ts             -- cálculo de R$ (tarifa de referência configurável em app_settings)
  queries.ts             -- leitura agregada (SQL) que alimenta as regras
  persist.ts             -- upsert em auditoria_runs + insights_operacionais
  run.ts                 -- orquestra: lê → roda regras puras → persiste → registra run
src/lib/db/auditar-rateio.ts      -- entrypoint CLI (npm run db:auditar-rateio)
```

### 7.3 Execução (job)
Acoplar ao serviço `sync` existente, **depois** do `sync-faturas-dg`/`sync-rateio-dg` (dados frescos), no mesmo ciclo de 6h:
```
npm run db:sync-faturas-dg
npm run db:sync-rateio-dg
npm run db:auditar-rateio        # ← novo: roda validador + otimizador, persiste insights
```

### 7.4 Endpoints
- `GET /api/auditoria/insights?tipo=&severidade=&status=&competencia=` — lista findings.
- `PATCH /api/auditoria/insights/[id]` — muda status (aberto→em-tratativa→resolvido/ignorado) + `nota_resolucao` (grava autor, como `cadastro_historico`).
- `GET /api/auditoria/resumo` — contadores por severidade + Σ impacto financeiro (para Início/Executivo).
- `POST /api/auditoria/run` — disparo manual (botão "Reauditar agora").

### 7.5 Frontend
- **Nova tela `/auditoria`** (ou aba "Auditoria" em Rateio e em Financeiro): `DataTable` de findings (filtros por severidade/status/competência, export Excel/PDF que já existe), com Σ impacto financeiro no `SummaryStrip`.
- **Início / Centro de Atenção**: injetar findings 🔴/🟠 abertos (reusa `AttentionCenter`).
- **Otimizador**: aba "Sugestões" mostrando recomendação + ganho estimado (somente leitura; sem botão de "aplicar").

### 7.6 Testes, logs, auditoria
- **Testes unitários** de cada regra pura (tabela de casos entrada→findings), sem DB — mesmo estilo das funções puras atuais.
- **Logs** padronizados via `sync_runs`/`auditoria_runs` (início/fim/itens/erro).
- **Auditoria de resolução**: transições de status gravadas com autor/horário (modelo `alarmes` + `cadastro_historico`).

---

## 8. Roadmap técnico (Tarefa 6)

### Fase 1 — Diagnóstico (somente leitura, sem persistir, sem mudar regra de negócio)
- Implementar `queries.ts` + regras puras das validações **✅ viáveis** (#2,#3,#7,#10,#11,#12,#14) e diagnósticos do otimizador (sub/superalocação, créditos parados, sobras/déficits).
- Entregar como **script CLI/relatório** (`npm run db:auditar-rateio -- --dry`) que imprime os achados. Validar **escala do `percentual`** e a **taxa de junção UC↔cadastro** com dados reais.
- **Saída:** relatório de inconsistências; zero risco.

### Fase 2 — Alertas e painel
- Migration das tabelas `auditoria_runs` + `insights_operacionais`; `persist.ts` (upsert idempotente).
- Acoplar job ao ciclo `sync` (6h) + disparo manual.
- Cálculo de **impacto financeiro** (tarifa de referência em `app_settings`).
- Tela `/auditoria` + integração no Centro de Atenção; **marcar como resolvido/ignorado** com auditoria.

### Fase 3 — Recomendações
- Ativar validações que dependem de **contrato** (#1 refinado, #4, #8, #9, #13, #17) — **após campanha de preenchimento de contratos**.
- Otimizador: sugerir ajuste de % e "cabe novo cliente"; **simular economia** (cenário atual × sugerido); **nunca aplicar** (alteração é no DG).

### Fase 4 — Otimização avançada
- Sincronizar **`/financial-credits`** (vintage/saldo) → habilita #15/#16 (vencimento) e **FIFO por idade**.
- Modelar **elegibilidade/restrições regulatórias** (matriz UC↔usina permitida).
- **Algoritmo prescritivo (LP/MILP)** de redistribuição com comparação de cenários.
- ML preditivo (consumo/geração) **apenas** como insumo do otimizador, se houver histórico suficiente (pós-importador Excel).

---

## 9. Estimativa de esforço (Tarefa 10)

| Fase | Escopo | Esforço (dev) |
|---|---|---|
| Fase 1 | Queries + 7 regras puras + relatório CLI + validação empírica (escala %, junção) | **3–5 dias** |
| Fase 2 | 2 migrations + persist + job 6h + endpoints + tela `/auditoria` + impacto financeiro + Centro de Atenção | **5–8 dias** |
| Fase 3 | Validações dependentes de contrato + recomendações + simulação de cenário | **5–7 dias** (+ campanha de cadastro de contratos) |
| Fase 4 | Sync `/financial-credits` + modelo de elegibilidade + LP/MILP + comparação de cenários | **3–4 semanas** |
| LLM (F) | Narrativa dos achados + extensão parser distribuidoras | **2–4 dias** (infra de IA já existe) |

---

## 10. Riscos e premissas (Tarefa 11)

- **Premissa crítica:** a **escala do `percentual`** e a **qualidade da junção UC↔cadastro** precisam ser validadas com dados reais na Fase 1 (sem isso, #1/#2/#10 geram falsos positivos).
- **Contratos esparsos** limitam todas as validações financeiras (#4,#8,#9,#13). Mitigação: priorizar Fase 1/2 (não dependem de contrato) e rodar campanha de preenchimento antes da Fase 3.
- **Vintage de crédito ausente** bloqueia vencimento (#15/#16) — maior risco financeiro do negócio (crédito SCEE expira em 60 meses). Mitigação: Fase 4 sincroniza `/financial-credits`; até lá, usar "parado há N meses" como proxy de alerta.
- **Regulatório (Lei 14.300/REN 1000):** créditos só são alocáveis dentro de regras de titularidade/concessão. Qualquer sugestão de realocação **deve** respeitar elegibilidade — não modelada hoje. Risco de recomendar realocação inválida → manter como **recomendação revisável por humano**, nunca automática.
- **DG é read-only:** o módulo **recomenda**; a aplicação do ajuste é feita manualmente no Digital Grid. Premissa alinhada ao projeto.
- **Falsos positivos** corroem confiança: começar com tolerâncias conservadoras e severidades baixas; calibrar com feedback (status "ignorado" alimenta ajuste de regra).
- **Defasagem de 6h** do sync: aceitável para auditoria (não é tempo real).

---

## 11. Arquivos e tabelas analisados (Tarefa 12)

**Schema:** `src/lib/db/schema.ts` (todas as tabelas).
**Digital Grid:** `src/lib/digitalgrid/{sync,queries,client,endpoints,cadastros,credentials}.ts`; `src/lib/db/{sync-faturas-dg,sync-rateio-dg,conciliar-dg}.ts`.
**Financeiro/contas:** `src/lib/financeiro/{conta,parse-conta}.ts`; `src/lib/ai/{extract,providers,credentials}.ts`.
**Operação (padrões de função pura/saúde):** `src/lib/operacao/{health-score,incidents,timeline,operational-overview}.ts`; `src/lib/db/sync-run.ts`.
**Cadastros:** `src/lib/cadastros/{queries,actions,historico,anexos,sync}.ts`.
**Telas:** `src/app/(dashboard)/{financeiro,rateio,executivo,cadastros/conciliacao}/page.tsx`.
**Infra:** `docker-compose.yml` (cron `sync` 6h), `PLANO-DIGITAL-GRID.md`.

**Tabelas existentes relevantes:** `rateios_dg`, `faturas_dg`, `contas_energia`, `medicoes_geracao`, `usinas`, `unidades_consumidoras`, `clientes`, `contratos`, `sync_runs`, `cadastro_historico`, `alarmes`.
**Tabelas propostas:** `auditoria_runs`, `insights_operacionais`.

---

## 12. Conclusão — respostas diretas (Tarefa 7, regra final)

**✅ O que já é possível agora (sem dados novos, só regra/SQL/job):**
Validações **#2 UC sem rateio, #3 rateio duplicado, #7 consumo×crédito incompatível, #10 fatura sem UC, #11 fatura duplicada, #12 competência incorreta, #14 créditos parados**; e diagnósticos do otimizador: **UC sub/superalocada, baixo consumo, sobras/déficits recorrentes, estimativa de ganho** (com tarifa de referência). Tudo entregável nas Fases 1–2.

**➖ O que depende de ajuste de dados:**
- **Preencher `contratos`** (tarifa/desconto por UC) → libera #1 (refinado), #4, #8, #9, #13, #17 e a simulação de cenários.
- **Conciliar cadastro** (UC/cliente com códigos do DG) → melhora a confiabilidade de quase tudo que cruza string.
- **Confirmar escala do `percentual`** empiricamente.
- **Importar histórico Excel** → robustez de tendências e sobras/déficits.

**🔴 O que não é viável ainda:**
- **#15/#16 créditos próximos do vencimento / vencidos** — falta **vintage/data de crédito** (exige sincronizar `/financial-credits` do DG ou capturar do PDF/distribuidora).
- **Otimização prescritiva entre usinas (LP/MILP)** — falta **elegibilidade regulatória modelada** + **tarifa confiável** + **saldo autoritativo**.

**🤖 Onde IA realmente agrega valor:**
- **(F) LLM** para **explicar achados** em linguagem natural e gerar **relatório executivo** — produtividade, baixo risco.
- **(F) LLM** para **estender o parser de contas** a novas distribuidoras (captura SCEE de fontes além da Neoenergia).
- **(E) ML** só faz sentido **depois**, como previsor de consumo/geração para alimentar o otimizador — **não** para as validações.

**🧩 Onde regra de negócio simples já resolve (não usar IA):**
Praticamente **todo o Validador** e o **núcleo diagnóstico do Otimizador** são **regra determinística + SQL + job**. ML/IA seriam over-engineering aqui e introduziriam imprevisibilidade onde se quer auditoria exata e explicável.

---

### Próximos passos recomendados (Tarefa 13)
1. **Fase 1 (3–5 dias):** implementar as 7 validações ✅ + diagnósticos do otimizador como **relatório só-leitura**; rodar contra produção e **validar escala do `percentual` e taxa de junção UC↔cadastro**.
2. Revisar os achados com o time de operação/financeiro para **calibrar tolerâncias** e confirmar impacto.
3. **Fase 2:** persistir + painel `/auditoria` + impacto financeiro + Centro de Atenção.
4. Em paralelo: **campanha de preenchimento de contratos** (destrava Fase 3) e avaliação de **sincronizar `/financial-credits`** (destrava vencimento de créditos).
5. Só então **Fase 3/4** (recomendações e otimização prescritiva).

> **Nota:** conforme as convenções do projeto (`HANDOFF.md`), nenhum código foi implementado nesta etapa — este é o diagnóstico técnico. A Fase 1 é segura (somente leitura) e pode começar assim que aprovada.
