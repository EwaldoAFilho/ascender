# Estratégia de Precificação do Licenciamento — SaaS ASCENDER

> Como precificar o licenciamento da plataforma para integradoras/geradoras solares
> (cada cliente = um `tenant`). Documento de estratégia **standalone** que também
> alimenta o **critério F (Potencial Financeiro, peso 5)** do Edital FAPDF START BSB.
> Números de preço são **hipóteses a validar** (§7), não preço final.
> Confiança: alta no técnico/custo (baseado em leitura do código); preços a validar com mercado.

---

## 1. Resumo executivo

- **Unidade de licença** = **um `tenant`** (uma empresa integradora/geradora). O app já
  modela isso (`tenants`, `tenant_memberships` com papéis, ciclo de status
  `pendente/trial/ativo/suspenso/cancelado`).
- **Modelo recomendado**: **assinatura mensal recorrente (SaaS)**, régua **híbrida
  (base por empresa + valor por usina)**, posicionamento **premium** (ferramenta
  integrada única: O&M + financeiro + comercial + auditoria de rateio).
- **Faixa de partida** (ilustrativa, premium): **R$ 497 / R$ 1.297 / R$ 2.997 por mês**
  (Starter / Pro / Enterprise), + **R$ 25–40 por usina** excedente.
- **Por que assim**: o **custo marginal é quase zero** (um VPS atende todos; IA e APIs são
  pagas pelo cliente). Logo **custo-plus é só o piso** — o preço deve vir do **valor** e
  do **mercado**, cobrado numa régua que escala com o cliente (**por usina**, que também é
  o seu maior vetor de custo → preço e custo alinhados).

## 2. Economia da solução — custo-para-servir

Base para a margem e para o piso de preço (levantado do código; ver `docs/kb/` e
`HANDOFF.md`).

### 2.1. Custo fixo (compartilhado, ~flat até saturar)
- **Um único VPS (Hostinger)** rodando um Postgres, um app Next.js, **um** worker de sync
  e o Caddy (`docker-compose.yml`, `docker-compose.prod.yml`, `Caddyfile`).
- **Adicionar um cliente não cria infra nova** — o mesmo stack atende N tenants
  (isolamento lógico por Postgres RLS). Marginal de infra ≈ **zero** até o box saturar.

### 2.2. Custo variável que **é seu** (cresce por cliente)
- **Armazenamento no Postgres da telemetria append-only**: uma linha por dispositivo a
  cada ~10 min, **nunca apagada** (`sync-telemetria.ts`, `schema.ts` tabelas
  `telemetria_*`; `PLANO-PERSISTENCIA.md`: "guardar tudo, sem limpeza"). Cresce **por
  usina × tempo**, de forma monotônica. **É o principal custo marginal** → reforça cobrar
  **por usina**.
- **PDFs de contas** (`contas_energia`, base64 no banco) — cresce por fatura processada.

### 2.3. Custo variável que **NÃO é seu** (pago pelo cliente)
- **Tokens de IA** (extração de faturas): a chave Anthropic/OpenAI é **do cliente**
  (`src/lib/ai/credentials.ts`, por tenant), e há **fallback grátis por regex**. Tenant
  sem chave → custo zero de IA para todos.
- **SolisCloud e Digital Grid**: usam as **contas do próprio cliente** (credenciais por
  tenant, somente leitura). Não são custo seu.

> **Implicação de margem**: com custo marginal ~zero, qualquer preço de mercado gera
> **margem bruta alvo > 80%**. O piso de custo-plus (ordem de R$ 50–150/tenant/mês
> totalmente carregado em pequena escala) **não** deve definir o preço — só o valida.

## 3. O melhor caminho para precificar (método em 6 passos)

Metodologia reaplicável — aplique com dados reais à medida que os obtiver:

1. **Piso (custo-plus)** — custo-para-servir por tenant (rateio do VPS + storage por usina
   + horas de suporte). Serve de **piso e base da margem**, não de preço.
2. **Âncora de valor (value-based)** — quantifique o valor gerado por cliente: horas de
   analista economizadas (hoje planilha), **erros de rateio evitados** (a auditoria
   protege receita), substituição/complemento de ferramentas. Precifique em **10–30%**
   desse valor.
3. **Benchmark de mercado** — levante preços de comparáveis no Brasil (Digital Grid, SaaS
   de monitoramento/O&M por usina/kWp, SaaS de gestão para integradoras). Posicione como
   **premium integrado**.
4. **Escolha a régua de metering** que escala com valor **e** custo → **por usina**
   (ou híbrido base + por usina).
5. **Empacote em planos (Good-Better-Best)** com âncora premium — 3 faixas + preço por
   usina excedente; a âncora alta faz o plano do meio parecer o "certo".
6. **Valide com clientes reais e itere** — sensibilidade de preço (Van Westendorp ou
   3–5 entrevistas de disposição a pagar) com a Ascender e o 2º cliente; meça
   conversão/churn; ajuste.

## 4. Régua de metering recomendada — híbrido (base + por usina)

| Opção | Prós | Contras |
|-------|------|---------|
| **Híbrido: base por empresa + por usina** ✅ | Cresce com o porte do cliente; alinha ao custo (storage por usina); previsível | Um pouco mais de explicação na venda |
| Flat por faixas de porte | Simples de vender | Injusto nos extremos (cliente grande subpaga) |
| Só por usina | Proporcional puro | Cliente pequeno pode achar caro no arranque |
| Por kWp sob gestão | Alinha ao tamanho econômico | Menos intuitivo; usinas grandes ficam caras |

**Recomendado: híbrido.** O app **já conta usinas e usuários por tenant**
(`src/lib/auth/platform.ts`), então a régua por usina é mensurável desde já — sem
depender de construir billing. `usinas.potencia_kwp` fica disponível caso opte pela
régua por kWp no futuro.

## 5. Planos e preços — faixas ilustrativas (a validar)

Coerentes com posicionamento premium integrado no mercado brasileiro de GD solar.
**Ponto de partida**, não preço final.

| Plano | Perfil | Usinas incluídas | Mensalidade | Observação |
|-------|--------|:----------------:|------------:|------------|
| **Starter** | Integradora pequena | até ~15 | **R$ 497/mês** | Porta de entrada |
| **Pro** (âncora do meio) | Integradora média | até ~50 | **R$ 1.297/mês** | Plano-alvo da maioria |
| **Enterprise** | Geradora/carteira grande | até ~150 | **R$ 2.997/mês** | Auditoria/O&M avançado |
| Usina adicional | acima da faixa | — | **R$ 25–40/usina/mês** | Componente "por usina" |

- **Anual**: 2 meses grátis (~17% de desconto) no pré-pagamento → melhora caixa e churn.
- **Add-on de IA**: hoje o cliente usa a própria chave (custo dele). Alternativa de
  receita: ASCENDER provê a chave e cobra repasse + margem.
- **Alternativa por kWp**: ordem de **R$ 1–5/kWp/mês** — registrar como opção.

## 6. Racional de valor e benchmark

**Por que os números se sustentam** (integradora média ~50 usinas):
- Substitui **~10–20 h/mês** de trabalho manual de planilha ≈ **R$ 300–1.000/mês**;
- **Reduz vazamento financeiro** por erro de rateio (auditoria automática de SCEE);
- Consolida O&M + financeiro + comercial + propostas num só produto.
- R$ 1.297/mês ≈ **10–30%** do valor gerado → zona saudável de captura de valor.

**Benchmark de mercado** — `[LEVANTAR]` com preços que só você conhece:
- `[LEVANTAR]` custo atual do cliente com Digital Grid (por UC / % faturado?).
- `[LEVANTAR]` plataformas de monitoramento/O&M (SolarView, SolarZ, Sunne, etc.) por usina/kWp.
- `[LEVANTAR]` SaaS de gestão para integradoras (Solarfy, Ampera, etc.) por empresa.

## 7. Projeção MRR/ARR para o edital (critério F)

Com ticket médio e meta de aquisição de tenants, monta-se a projeção. **Parametrizável** —
preencher com metas reais do Plano de Trabalho.

| Clientes ativos | Ticket médio/mês | MRR | **ARR** |
|:---------------:|:----------------:|----:|--------:|
| 10 | R$ 1.300 | R$ 13.000 | **~R$ 156 mil** |
| 20 | R$ 1.300 | R$ 26.000 | **~R$ 312 mil** |
| 30 | R$ 1.300 | R$ 39.000 | **~R$ 468 mil** |

> Narrativa para o Eixo III: a subvenção de **R$ 200 mil** financia o desenvolvimento que
> **destrava novos clientes** (onboarding self-service, conformidade LGPD, RBAC completo —
> ver `02-aderencia-ascender.md` §7), com custo marginal ~zero por tenant. Isso é
> **escalabilidade** na definição do próprio edital (item 5.2).

## 8. Riscos de precificação

- **Storage sem quota**: hoje **não há cap por tenant** (`schema.ts`; sem retenção da
  telemetria). Um cliente com muitas usinas consome storage indefinidamente — a régua
  **por usina** mitiga isso repassando o custo; a longo prazo, avaliar retenção/particionamento.
- **Ancoragem**: preço de entrada muito baixo cria teto difícil de subir depois; a âncora
  Enterprise ajuda a sustentar o Pro.
- **Canibalização/positioning**: se posicionar como "planilha melhorada", captura pouco
  valor; a mensagem deve ser **plataforma integrada + auditoria** (o diferencial).
- **Cliente âncora**: cuidado ao precificar a própria Ascender como cliente (preço de
  referência interno ≠ preço de mercado para terceiros).

## 9. Insumos necessários (para trocar hipóteses por números reais)

1. Custo mensal real da operação (VPS/Hostinger, horas suas/de dev).
2. Porte típico de um cliente (nº de usinas e UCs) — Ascender + 2º cliente são amostra.
3. Preços de concorrentes que você conhece (§6, `[LEVANTAR]`).
4. Posicionamento desejado e meta de nº de clientes em 12–24 meses.

## 10. Fora de escopo (próximo projeto, se desejado)

Implementar **cobrança no app**: catálogo de planos, quotas por tenant, faturamento
(ex.: Stripe/PagSeguro) e gating por `tenants.plano` (hoje um rótulo livre sem
enforcement). A fundação existe (tenant + ciclo de status), mas **billing/metering não
existe** — é um segundo projeto que pode ser planejado à parte.

---

### Referências
- Aderência ao edital e metas de projeto: `02-aderencia-ascender.md`.
- Memorial técnico (o que o produto faz): `03-documentacao-tecnica.md`.
- Base de Conhecimento do código: `docs/kb/`.
</content>
