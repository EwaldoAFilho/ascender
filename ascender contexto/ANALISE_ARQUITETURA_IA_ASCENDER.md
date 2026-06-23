# ASCENDER — Análise de Arquitetura de Solução & Oportunidades de IA

> Varredura técnica completa do sistema **ASCENDER** (gestão de usinas solares fotovoltaicas / geração compartilhada).
> Documento de Arquitetura de Soluções — IA, Analytics, Data Science e Gestão de Energia.
> Base: `ascender-app` (Next.js 15 + Postgres/Drizzle), docs em `ascender contexto/`, integrações SolisCloud + Digital Grid.
> Data da análise: 2026-06-23.

---

## 0. Sumário executivo (leia primeiro)

A ASCENDER opera **geração compartilhada de energia solar**: ~6 usinas geram energia que é **rateada** entre ~48 clientes/prosumidores (~38–46 unidades consumidoras), gerando créditos na distribuidora (Neoenergia) e faturamento via Digital Grid. A ASCENDER ganha cobrando uma **tarifa com desconto sobre a tarifa da distribuidora**.

O sistema já é, tecnicamente, **uma excelente base para IA**: arquitetura *sync-first* com histórico **append-only** (telemetria a cada 10 min, faturas/rateio a cada 6h), schema relacional limpo no Postgres, integrações de leitura já estáveis (SolisCloud técnica, Digital Grid financeira) e **LLMs (Claude/OpenAI) já integrados** para extração de faturas.

**Resposta direta à pergunta final:**

- **Imediato (dados já disponíveis):** detecção de anomalias de geração (usina/inversor) para O&M, validação de consistência de rateio e de faturas, *scoring* de inadimplência, e camada de **analytics conversacional/insights via LLM** (a infra de IA já existe). → **maior ROI por menor esforço**.
- **Exige preparação:** previsão de geração, consumo e receita — falta **profundidade de histórico no banco** (a série de 12+ meses ainda vive no Excel) e **dados meteorológicos/irradiância** (não integrados, apesar de já haver lat/long das usinas).
- **Maior retorno financeiro:** **otimização prescritiva de rateio e de créditos SCEE** (reduz energia/crédito desperdiçado = dinheiro direto) e **previsão+prevenção de inadimplência**.

---

# ETAPA 1 — Mapeamento funcional

## 1.1 Módulos (navegação principal)

| Módulo | Rota | Objetivo | Usuários | Dados consumidos | Dados gerados |
|---|---|---|---|---|---|
| **Início / Operação ao vivo** | `/` | Estado da frota agora: potência, health score, centro de atenção, timeline | Operação/NOC, diretoria | telemetria_estacao/coletor, alarmes, faturas_dg | — (somente leitura/derivado) |
| **Executivo** | `/executivo` | Consolidado meta×realizado, geração/receita do ano, financeiro, heatmap | Diretoria/gestão | medicoes_geracao, usinas, telemetria, faturas_dg, health | — |
| **SolisCloud (O&M)** | `/soliscloud` | Telemetria técnica: estações, inversores, coletores, alarmes, uptime, histórico | Operação/O&M | telemetria_* , alarmes, sync_runs | status de alarme (aberto/tratativa/resolvido) |
| **Usinas** | `/usinas` | Performance por usina, potência, IDs externos, previsto×realizado | Operação/gestão | usinas, telemetria, medicoes_geracao | — |
| **Geração** | `/geracao` | Curva dia/mês/ano por usina + aderência da frota | Operação/gestão | telemetria_estacao, medicoes_geracao, usinas | — |
| **Análise** | `/analise` | Gráficos interativos (barra/rosca) por usina e período | Gestão | telemetria (estações) | — |
| **Mapa** | `/mapa` | Localização geográfica das usinas (pinos) | Gestão | usinas (lat/long) | — |
| **Rateio** | `/rateio` | Rateio real por cliente/UC (consumo, %, créditos) | Financeiro/gestão | rateios_dg | — |
| **Financeiro** | `/financeiro` | Faturas, pagamentos, inadimplência, economia, anexo de contas | Financeiro | faturas_dg, contas_energia | contas_energia (anexo + campos extraídos) |
| **Propostas** | `/propostas` | Simulador comercial de economia | Comercial | propostas, cadastros | propostas |
| **Cadastros** (hub) | `/cadastros` | CRUD de dados-mestre + conciliação DG | Backoffice | clientes, UCs, usinas, distribuidoras, contratos | todos os cadastros + histórico + anexos |
| **Integrações** | `/integracoes` | Mapa técnico de fontes, endpoints, saúde do sync | TI/gestão | integration_credentials, sync_runs | — |
| **Configurações** | `/configuracoes/*` | Credenciais (SolisCloud/DG/IA), usuários, senha | Admin | integration_credentials, usuarios | credenciais cifradas, usuários |

## 1.2 Telas de cadastro (CRUD)

`clientes`, `unidades` (UCs), `usinas`, `distribuidoras`, `contratos`, `propostas`, `conciliacao` (importação DG). Todas com **histórico de alterações** (quem/quando/antes→depois) e **anexos** (hoje em clientes; genérico para outras entidades).

## 1.3 Dashboards e relatórios

- **Dashboards:** Início (operacional), Executivo (gerencial), SolisCloud (técnico/O&M), Análise (exploratório).
- **Relatórios/exportação:** toda `DataTable` exporta **Excel e PDF** (xlsx + jspdf). Faturas, rateio, telemetria, cadastros, histórico de alarmes, uptime de coletores.
- **KPIs:** ver ETAPA 4.

## 1.4 Fluxos operacionais (resumo; detalhe na ETAPA 5)

Entrada de cliente → conciliação/cadastro → vínculo a usina → rateio (DG) → geração de créditos → faturamento (DG) → cobrança/anexo da conta → conciliação financeira.

## 1.5 Camada de API (route handlers)

- **Auth:** `/api/auth/login|logout|password`.
- **SolisCloud (lê do banco):** `stations`, `stations/[id]`, `stations/[id]/generation`, `inverters`, `collectors`, `alarms`, `historico-alarmes`, `historico`, `geracao-diaria`, `uptime-coletores`, `status`, `sync-status`.
- **Integrações:** `soliscloud|digitalgrid|ai` × (`credentials`, `test`).
- **Financeiro:** `conta`, `conta/[id]`, `conta/lote`, `conta/file`.
- **Cadastros:** `anexo`, `anexo/[id]`.

---

# ETAPA 2 — Mapeamento de dados (dicionário)

> Volume estimado a partir da planilha de controle (`ascender contexto/`): **~6 usinas, ~48 clientes, ~38–46 UCs**. Telemetria a 10 min ⇒ ~144 leituras/dia por entidade (frota ⇒ dezenas de milhares de linhas/mês, **append-only, sem limpeza**).

## 2.1 Entidades principais

| Entidade (tabela) | Papel | Campos-chave | Relacionamentos | Atualização | Volume aprox. |
|---|---|---|---|---|---|
| **distribuidoras** | Concessionária | nome, uf | ← UCs, usinas, contratos, propostas | Manual (raro) | unidades |
| **clientes** | Cliente/prosumidor/investidor | nome, documento(CPF/CNPJ), tipo, status, email, responsavel, origem | → UCs, contratos, faturas, propostas | Manual + conciliação DG | ~48 |
| **unidades_consumidoras** | UC (instalação) | codigoInstalacao, consumoMedioKwh, distribuidoraId, clienteId | cliente; ← contratos, faturas | Manual + conciliação DG | ~38–46 |
| **usinas** | Usina FV | nome, potenciaKwp, geracaoEsperadaKwhMes, stationIdSoliscloud, codigoDigitalGrid, lat/long, endereço, módulos, inversores, status | distribuidora; ← contratos, faturas, telemetria, medições | Manual + import SolisCloud | ~6 |
| **contratos** | Contrato comercial | tarifaDistribuidora, tarifaAscender, percentualDesconto, status | cliente, UC, usina | Manual | dezenas |
| **propostas** | Simulação comercial | consumoEstimadoKwh, tarifaDistribuidora, tarifaAscender, status | cliente, UC, distribuidora | Manual | dezenas |

## 2.2 Movimentos / séries temporais

| Entidade (tabela) | Conteúdo | Campos-chave | Granularidade | Fonte | Atualização |
|---|---|---|---|---|---|
| **telemetria_estacao** | Estado/energia da usina | estado, potenciaKw, energiaDia/Mes/Ano/TotalKwh, capturadoEm | 10 min, por estação (append-only) | SolisCloud | 10 min |
| **telemetria_inversor** | Estado/energia/temp do inversor | serial, potenciaKw, energiaDia/TotalKwh, temperaturaC | 10 min, por inversor | SolisCloud | 10 min |
| **telemetria_coletor** | Datalogger | sn, estado, ultimaComunicacao, modelo | 10 min, por coletor | SolisCloud | 10 min |
| **alarmes** | Eventos técnicos | alarmId, nivel(baixo/medio/critico), mensagem, status, iniciado/resolvidoEm | 1 linha/alarme (upsert) | SolisCloud | 10 min |
| **medicoes_geracao** | Geração mensal por usina | competencia(AAAA-MM), geracaoKwh, receita, fonte | mensal, por usina | SolisCloud (stationYear) | 6 h |
| **faturas_dg** | Fatura real | competencia, valorEnergia, valorTotal, valorPago, economia, consumoKwh, energiaInjetadaKwh, paymentStatus, vencimento, pagoEm | mensal, por fatura/UC | Digital Grid `/bills` | 6 h |
| **rateios_dg** | Cota de rateio | competencia, usinaNome, installation, ownerDocument, percentual, consumoKwh, creditosAcumulados | mensal, por UC×usina | Digital Grid `/estimated-quota` | 6 h |
| **contas_energia** | Conta da distribuidora (PDF) | valor, energiaKwh, leituras, tributos, itens, **SCEE (saldos de crédito)**, arquivoBase64 | mensal, por fatura DG | Upload + extração IA/regex | sob demanda |
| **sync_runs** | Auditoria de sync | job, iniciado/terminadoEm, status, itens | por execução de worker | Sistema | 10 min / 6 h |
| **cadastro_historico** | Trilha de auditoria | entidade, acao, campo, valorAntes/Depois, autor | por alteração | Sistema | sob demanda |
| **anexos** | Documentos (bytea) | entidade, nome, mimeType, conteudo | por upload | Manual | sob demanda |

## 2.3 Diagrama de entidades (texto)

```
distribuidoras ──< unidades_consumidoras >── clientes ──< contratos >── usinas
       │                    │                    │            │           │
       │                    │                    │            │           ├─< telemetria_estacao
       └──< usinas          ├─< faturas          ├─< faturas  │           ├─< telemetria_inversor
                            │   (faturas_dg)     ├─< propostas│           ├─< telemetria_coletor
                            └─< rateios_dg       └─< faturas_dg           ├─< alarmes
                                                                          └─< medicoes_geracao

faturas_dg ──1:1── contas_energia (SCEE / saldo de créditos extraído do PDF)
integration_credentials · usuarios · app_settings · sync_runs · cadastro_historico · anexos  (transversais)
```

Chaves de junção entre o mundo técnico (SolisCloud) e financeiro (DG):
`usinas.stationIdSoliscloud` ↔ SolisCloud · `usinas.codigoDigitalGrid` ↔ DG generators · `unidades_consumidoras.codigoInstalacao` ↔ DG `installation` ↔ `faturas_dg.installationNumber` ↔ `rateios_dg.installation` · `clientes.documento` ↔ DG `ownerDocument`.

---

# ETAPA 3 — Histórico disponível

| Conjunto | Onde está | Profundidade atual | Frequência | Qualidade | Observação crítica |
|---|---|---|---|---|---|
| **Telemetria (potência/energia 10 min)** | `telemetria_*` (banco) | Desde o deploy da persistência (semanas a poucos meses) | 10 min | Alta granularidade, sem limpeza | **Pouca profundidade** — bom para curto prazo/anomalia, raso para sazonalidade anual |
| **Geração mensal** | `medicoes_geracao` | Ano corrente (até ~12 pontos/usina) | 6 h (refresh) | Boa | Vem de `stationYear` (ano atual) |
| **Geração/consumo/financeiro 12+ meses** | **Planilha Excel** (mai/2025–abr/2026) | **12+ meses** | Manual | Boa, mas **fora do banco** | **Importador Excel é pendente** — é o histórico mais valioso para previsão |
| **Faturas (financeiro)** | `faturas_dg` | Conforme o DG retorna (potencialmente vários meses) | 6 h | Boa | Depende do backfill da API |
| **Rateio / créditos** | `rateios_dg` | Conforme o DG retorna | 6 h | Boa | Inclui `creditosAcumulados` |
| **Saldo de créditos SCEE** | `contas_energia` | Apenas contas anexadas | Sob demanda | Variável (extração IA/regex) | Cobre só Neoenergia (2 layouts) |
| **Alarmes (eventos O&M)** | `alarmes` | Desde o deploy da persistência | 10 min | Alta | Histórico completo, com resolução |
| **Inadimplência / pagamentos** | `faturas_dg` (paymentStatus, valorPago, pagoEm) | Conforme DG | 6 h | Boa | **Rótulos prontos** para modelo de inadimplência |
| **Alterações contratuais / churn** | `contratos.status`, `clientes.status`, `cadastro_historico` | Desde o uso do CRUD | Sob demanda | Parcial | Poucos eventos de cancelamento rotulados |

**Conclusão da ETAPA 3:** o banco tem **alta frequência mas baixa profundidade**; a **profundidade (12+ meses)** existe no Excel e ainda **não foi ingerida**. Importar a planilha + backfill do DG é o passo habilitador nº 1 para previsão.

---

# ETAPA 4 — Indicadores existentes (KPIs)

| KPI | Fórmula (como o código calcula) | Origem | Frequência |
|---|---|---|---|
| **Health Score (0–100)** | `100 − pen_offline(≤45) − pen_alarm(≤20) − pen_coletor(≤20) − pen_atraso(≤15) − pen_faturas(≤10)`; offline só penaliza na **janela solar 06–18h** | telemetria + alarmes + faturas_dg | tempo real (banco) |
| **Status operacional** | ≥85 saudável · 60–84 atenção · <60 crítico (com regras de proteção: offline de dia / alarme → ≥atenção) | derivado do Health Score | tempo real |
| **Uptime de coletores (24h)** | `online_snapshots / total_snapshots × 100` por SN | telemetria_coletor | 24h móvel |
| **Aderência (realizado×meta)** | `realizadoDia / (geracaoEsperadaKwhMes/30) × 100`; no Executivo a meta é **proporcional aos dias decorridos** | telemetria_estacao + usinas.meta | diário / mês corrente |
| **Potência da frota (24h)** | `Σ potenciaKw` por instante | telemetria_estacao | tempo real |
| **Geração ano (kWh) / Receita ano (R$)** | `Σ medicoes_geracao.geracaoKwh` / `Σ medicoes_geracao.receita` | medicoes_geracao | 6 h |
| **Total faturado / Recebido / Em aberto** | `Σ valorTotal` / `Σ valorPago` / `max(0, faturado − pago)` | faturas_dg | 6 h |
| **Taxa de recebimento** | `pago / faturado × 100` (tom: ≥95 ok · ≥80 alerta · <80 ruim) | faturas_dg | 6 h |
| **Inadimplência (vencidas)** | `count(vencimento < hoje AND valorPago < valorTotal)` | faturas_dg | 6 h |
| **Economia gerada** | `Σ faturas_dg.economia` (`amount_saved` do DG) | faturas_dg | 6 h |
| **Cotas / UCs / usinas no rateio** | contagens distintas | rateios_dg | 6 h |
| **Consumo rateado** | `Σ rateios_dg.consumoKwh` | rateios_dg | 6 h |
| **Créditos acumulados** | `rateios_dg.creditosAcumulados` | rateios_dg | 6 h |
| **Economia da proposta** | `consumoEstimadoKwh × (tarifaDistribuidora − tarifaAscender)`; anual = ×12 | propostas | sob demanda |

---

# ETAPA 5 — Fluxo operacional ponta a ponta

```
1. ENTRADA DO CLIENTE
   • Manual (Cadastros › Clientes) OU
   • Conciliação Digital Grid: /entities → cria clientes (match por documento/CNPJ),
     /installations → cria UCs, /generators → vincula usinas (por código DG ou nome normalizado)

2. VINCULAÇÃO À USINA
   • Contrato liga cliente + UC + usina (tarifaDistribuidora, tarifaAscender, % desconto)
   • Usina vinculada à SolisCloud (stationIdSoliscloud) e ao DG (codigoDigitalGrid)

3. GERAÇÃO  (técnico — SolisCloud)
   • Telemetria 10 min → telemetria_estacao/inversor/coletor; alarmes
   • Geração mensal (stationYear) → medicoes_geracao (kWh + receita)

4. DISTRIBUIÇÃO DE CRÉDITOS / RATEIO  (financeiro — Digital Grid)
   • /estimated-quota → rateios_dg: % de participação, consumo, créditos acumulados por UC
   • Energia injetada compensa o consumo das UCs na distribuidora (SCEE)

5. FATURAMENTO  (Digital Grid)
   • /bills → faturas_dg: valorTotal, valorEnergia, economia, consumo, vencimento, status

6. COBRANÇA / CONCILIAÇÃO
   • Cliente paga boleto/PIX; paymentStatus/valorPago/pagoEm atualizam via sync
   • Conta da distribuidora (PDF) é anexada → extração IA/regex → contas_energia (SCEE, valor, leituras)
   • Blindagem: confere UC+competência e CNPJ do PDF contra a fatura (status cnpj_divergente)

7. RENOVAÇÃO / CANCELAMENTO
   • contratos.status (simulacao→em-analise→ativo); clientes.status (ativo/inativo)
   • cadastro_historico registra alterações (auditoria)
```

**APIs externas são somente leitura** — o sistema nunca escreve no SolisCloud nem no Digital Grid.

---

# ETAPA 6 — Integrações

| Integração | Tipo | Dados recebidos | Dados enviados | Frequência | Auth |
|---|---|---|---|---|---|
| **SolisCloud** | API REST (técnica) | `userStationList`, `inverterList`, `alarmList`, `collectorList`, `stationDay/Month/Year` → telemetria, energia, alarmes | Apenas parâmetros de consulta (read-only) | 10 min (telemetria) / 6 h (geração) | HMAC-SHA1 (keyId/secret), `Content-Type: application/json` sem charset; fila global + backoff |
| **Digital Grid (Billing API v1)** | API REST (financeira) | `/bills`, `/estimated-quota`, `/monthly-generation`, `/generators`, `/installations`, `/entities` → faturas, rateio, cadastros | Parâmetros de consulta (read-only) | 6 h | `Authorization: Token <token>` (Bearer/Token auto), paginação DRF, retry/backoff |
| **Provedores de IA (Claude / OpenAI)** | API LLM | Texto/JSON estruturado extraído de PDFs de contas | PDF (base64) + prompt + schema | Sob demanda | API key cifrada (AES-256-GCM); 1 provedor ativo |
| **Distribuidora (Neoenergia)** | PDF (manual) | Conta de energia → valor, consumo, leituras, tributos, **SCEE** | — | Sob demanda | Upload manual; parser por regex + IA (2 layouts) |
| **ERP / CRM financeiro** | — | **Não existe** | — | — | Lacuna: cobrança/baixa ainda via DG + planilha |

**Segredos:** todas as credenciais ficam **cifradas (AES-256-GCM)** no banco; nada vai para o git.

---

# ETAPA 7 — Avaliação para IA

## 7.1 IA Preditiva

| Caso de uso | Dados que sustentam | Lacuna principal |
|---|---|---|
| **Previsão de geração** | telemetria_estacao (10 min), medicoes_geracao, meta, lat/long | **Irradiância/clima não integrados**; histórico raso no banco (Excel não importado) |
| **Previsão de consumo** | rateios_dg.consumoKwh, contas_energia.energiaKwh, UC.consumoMedio | Profundidade (12+ meses no Excel) |
| **Previsão de receita** | medicoes_geracao.receita, faturas_dg | Mais meses de histórico no banco |
| **Previsão de ocupação/capacidade livre da usina** | potenciaKwp, geração, Σ percentual de rateio, consumo das UCs | Definição de "capacidade alvo" por usina |
| **Previsão de inadimplência** | faturas_dg (paymentStatus, valorPago, vencimento, pagoEm) — **rótulos prontos** | Base pequena (~48 clientes) → começar por *scoring*, evoluir p/ ML |
| **Previsão de churn/cancelamento** | contratos.status, clientes.status, cadastro_historico | **Poucos eventos rotulados** de cancelamento |

## 7.2 IA de Detecção de Anomalias

| Caso de uso | Dados que sustentam | Viabilidade |
|---|---|---|
| **Queda de geração (usina)** | telemetria_estacao + meta + comparação entre usinas irmãs no mesmo dia | **Alta** — peer-relative dispensa clima |
| **Falha/baixa de inversor / superaquecimento** | telemetria_inversor (potência, energiaDia, **temperaturaC**) | **Alta** — comparação entre inversores/strings |
| **Consumo fora do padrão (UC)** | rateios_dg.consumoKwh, contas_energia.energiaKwh ao longo do tempo | Média-alta |
| **Erros de rateio** | rateios_dg: Σ percentual por usina/competência ≈ 100%, créditos vs consumo | **Alta** (regras) |
| **Faturas inconsistentes** | faturas_dg × contas_energia (valor×consumo×tarifa); CNPJ divergente (já parcial) | **Alta** (regras + IA já existente) |
| **Coletor/comunicação intermitente** | telemetria_coletor, uptime 24h | Alta |

## 7.3 IA Prescritiva

| Caso de uso | Dados que sustentam | Natureza |
|---|---|---|
| **Redistribuição ótima de clientes (rateio)** | geração por usina, consumo por UC, percentuais atuais, créditos | Otimização (LP/MILP) — **alto impacto financeiro** |
| **Aproveitamento de créditos SCEE** | contas_energia (saldo, injetado, compensado, saldo próximo) | Otimização anti-expiração de crédito |
| **Alocação de novas UCs** | capacidade livre por usina × consumo do novo cliente | Recomendação/otimização |
| **Recomendação de O&M (priorização)** | alarmes + telemetria + aderência | Ranking/prescrição |

## 7.4 IA com LLM (infra já existe — Claude/OpenAI integrados)

| Caso de uso | Por que é viável já | 
|---|---|
| **Analytics conversacional ("pergunte aos seus dados")** | Schema limpo + read-only → *text-to-SQL* seguro |
| **Narrativa executiva automática** | LLM resume o dashboard Executivo em relatório textual |
| **Extensão do parser a outras distribuidoras** | A extração via LLM generaliza melhor que regex |
| **Triagem/explicação de alarmes** | LLM classifica/explica alarme e sugere ação de O&M |

---

# ETAPA 8 — Maturidade dos dados

| Caso de uso | Viável hoje? | Dados disponíveis | Dados faltantes | Complexidade |
|---|---|---|---|---|
| Anomalia de geração (peer-relative) | **Sim** | telemetria_estacao, meta | (clima opcional p/ refinar) | Baixa-Média |
| Anomalia de inversor / superaquecimento | **Sim** | telemetria_inversor (potência, temp) | — | Baixa-Média |
| Consistência de rateio (regras) | **Sim** | rateios_dg | — | Baixa |
| Faturas inconsistentes (regras) | **Sim** | faturas_dg, contas_energia | — | Baixa |
| Scoring de inadimplência | **Sim (regras→ML)** | faturas_dg (rótulos) | Mais histórico p/ ML | Média |
| Analytics conversacional / insights LLM | **Sim** | schema + infra IA | Guardrails de text-to-SQL | Baixa-Média |
| Narrativa executiva (LLM) | **Sim** | KPIs já calculados | — | Baixa |
| Parser outras distribuidoras (LLM) | **Sim** | infra de extração | Amostras de PDFs | Baixa-Média |
| Previsão de geração | **Parcial** | telemetria + medicoes | **Clima/irradiância** + histórico (Excel) | Média-Alta |
| Previsão de consumo / receita | **Parcial** | rateios/faturas | Profundidade histórica (Excel/backfill) | Média |
| Otimização de rateio / créditos SCEE | **Parcial** | geração, consumo, %, SCEE | SCEE completo p/ todas UCs; modelagem | Alta |
| Previsão de churn | **Não ainda** | status atuais | **Eventos rotulados** de cancelamento | Alta |

---

# ETAPA 9 — Roadmap de IA

## 🟢 Quick Wins (até 30 dias) — usam dados já existentes
1. **Detecção de anomalia de geração e inversor (O&M)** — *peer-relative* sobre `telemetria_*` + alerta no Centro de Atenção. Reaproveita Health Score/incidentes.
2. **Validador de consistência de rateio e de faturas** — regras determinísticas (Σ% ≈ 100%, valor×consumo×tarifa, CNPJ). Estende a blindagem já existente.
3. **Scoring de inadimplência (regras)** — *score* por cliente a partir de `faturas_dg`; destaca risco no Financeiro.
4. **Camada LLM: analytics conversacional + narrativa executiva + triagem de alarmes** — infra de IA já pronta; risco baixo (read-only).
5. **Extensão do parser de contas a outras distribuidoras via LLM**.

## 🟡 Médio prazo (30–90 dias) — exigem preparação de dados
6. **Importador da planilha Excel + backfill do Digital Grid** → dá profundidade de 12+ meses no banco (**habilitador de previsão**).
7. **Integração meteorológica/irradiância** (usa lat/long já cadastrado) → insumo do forecast de geração.
8. **Previsão de geração e de receita** (sazonal + clima) após (6) e (7).
9. **Previsão de consumo por UC** e detecção de consumo anômalo por série temporal.
10. **Inadimplência via ML** (quando houver histórico) substituindo o *scoring* por regras.

## 🔴 Estratégicos (90+ dias) — modelos avançados / otimização
11. **Otimização prescritiva de rateio + aproveitamento de créditos SCEE** (LP/MILP) — maior retorno financeiro.
12. **Recomendação de alocação de novas UCs** por capacidade livre.
13. **Previsão de churn** (após acumular eventos de cancelamento rotulados).
14. **"Digital twin" de performance** por usina (esperado dado clima) para detecção fina de degradação.

---

# Ranking por ROI (esforço × retorno)

| # | Iniciativa | Esforço | Retorno | ROI |
|---|---|---|---|---|
| 1 | Anomalia de geração/inversor (O&M) | Baixo | Alto (evita perda de geração e multas/indisponibilidade) | ⭐⭐⭐⭐⭐ |
| 2 | Validador de rateio/faturas | Baixo | Alto (evita erro de cobrança/perda financeira) | ⭐⭐⭐⭐⭐ |
| 3 | Otimização de rateio + créditos SCEE | Alto | Muito alto (reduz crédito desperdiçado = R$ direto) | ⭐⭐⭐⭐⭐ |
| 4 | Scoring/Previsão de inadimplência | Médio | Alto (reduz perdas e melhora caixa) | ⭐⭐⭐⭐ |
| 5 | Analytics conversacional + narrativa LLM | Baixo | Médio-Alto (produtividade/decisão) | ⭐⭐⭐⭐ |
| 6 | Importador Excel + backfill (habilitador) | Médio | Alto (destrava todas as previsões) | ⭐⭐⭐⭐ |
| 7 | Previsão de geração/receita (com clima) | Médio-Alto | Alto (planejamento/comercial) | ⭐⭐⭐ |
| 8 | Parser outras distribuidoras (LLM) | Baixo | Médio (escala operacional) | ⭐⭐⭐ |
| 9 | Previsão de churn | Alto | Médio (depende de dados) | ⭐⭐ |

---

# Resposta final

**"Com os dados atualmente disponíveis na ASCENDER, quais soluções de IA podem ser implementadas imediatamente, quais exigem preparação adicional e quais possuem maior potencial de retorno financeiro?"**

- **Imediatamente (sem novos dados):** detecção de **anomalias de geração e inversor** (O&M), **validação de consistência de rateio e faturas**, **scoring de inadimplência** por regras, e uma **camada de IA com LLM** (analytics conversacional, narrativa executiva, triagem de alarmes, parser de novas distribuidoras) — porque a infraestrutura de IA, o histórico de telemetria e os dados financeiros do Digital Grid já existem no banco.

- **Com preparação adicional:** **previsões de geração, consumo e receita** — dependem de (a) **importar o histórico de 12+ meses do Excel** e fazer **backfill do Digital Grid** para dar profundidade ao banco, e (b) **integrar dados meteorológicos/irradiância** (a lat/long das usinas já está cadastrada). **Inadimplência via ML** e **previsão de churn** entram quando houver mais histórico e eventos rotulados.

- **Maior retorno financeiro:** **otimização prescritiva de rateio e de créditos SCEE** (reduz energia/crédito desperdiçado, impacto direto na receita) e **previsão+prevenção de inadimplência** (protege o fluxo de caixa). No curtíssimo prazo, **anomalia de geração/inversor** e **validação de rateio/faturas** entregam o melhor retorno por esforço, evitando perdas que hoje passam despercebidas.

> **Pré-requisito transversal nº 1:** executar o **importador Excel + backfill DG** e a **integração de clima**. São o gargalo que separa "detecção/otimização sobre o presente" (já viável) de "previsão sobre o futuro" (a oportunidade de maior valor estratégico).
