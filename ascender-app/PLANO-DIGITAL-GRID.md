# Plano de Integração — Digital Grid (Billing API v1)

_Planejamento (somente leitura). Aguardando token de acesso._

## Visão geral
- **API oficial documentada**: `https://gestao.dg.energy/api/v1` (Swagger: `/api/v1/doc/`, schema público em `/api/v1/swagger.json`).
- **Autenticação**: token no header `Authorization` (securityScheme "Bearer", tipo apiKey). Formato a confirmar no 1º teste: `Authorization: Bearer <token>` (provável) ou `Authorization: Token <token>` (DRF).
- **Paginação**: padrão Django REST — endpoints de lista retornam `{ count, next, previous, results: [...] }` (tratar `next`/`page`).
- **Princípio**: **somente leitura (GET)**. Nenhum POST/PATCH/DELETE será usado — não alteramos nada no Digital Grid.

## Endpoints que VAMOS consumir (GET / leitura)
| Endpoint | Uso na ASCENDER | Tela |
|---|---|---|
| `GET /bills/` · `/bills/{id}/` | **Faturas reais** (valor, vencimento, status pagamento, consumo, energia injetada, créditos, links de boleto) | **Financeiro** |
| `GET /estimated-quota/` · `/{id}/` | **Rateio** por UC: `owner_name`, `percentage`, `consumption`, `accumulated_credits`, `generation_month` | **Rateio** |
| `GET /monthly-generation/` · `/{id}/` · `/{id}/read-apportionment/` | Geração mensal + **rateio detalhado** (apportionment) por gerador | **Rateio** / Usinas |
| `GET /financial-credits/` · `/{id}/` | Histórico de **créditos** por instalação (saldo, operações) | Financeiro / Rateio |
| `GET /installations/` · `/{number}/` | **Unidades consumidoras** (conciliar/enriquecer cadastro) | Cadastros |
| `GET /entities/` · `/{document}/` | **Clientes** (por CPF/CNPJ) | Cadastros |
| `GET /generators/` · `/{number}/` | **Geradores/usinas** (conciliar com SolisCloud) | Cadastros / Usinas |
| `GET /agents/` · `/{id}/` | Dados do agente ASCENDER (validação/teste de conexão) | Integrações |
| `GET /generation-data/` · `/{serial}/` | Geração por datalogger (conciliação com SolisCloud) | — |

## Endpoints que NÃO usaremos (escrita — fora do escopo)
`POST /entities/`, `PATCH /entities/{document}/`, `PATCH /bills/{id}/update-payment-status/`, `POST/PATCH /generators`, `POST/PATCH /installations`, `POST /financial-credits/`, `POST /monthly-generation/`, e todos os de rateio que alteram: `create/delete/import/update-apportionment`. → **não chamamos**.

## Campos-chave (mapeamento)
- **Bill → faturas**: `generation_month`→competência, `value`/`total_value`→valor, `due_date`→vencimento, `payment_status`/`paid_at`→status, `installation`/`number`→UC, `consumption`/`injected_energy`→energia, `balance_credits`→saldo, `bill_generated`/`distributor_bill`→links.
- **EstimatedQuota → rateio**: `installation`→UC, `owner_name`/`owner_document`→cliente, `percentage`→%, `consumption`→consumo, `accumulated_credits`→saldo, `covering`, `generation_month`.
- **FinancialCreditHistory**: `operation`, `value`, `balance`, `installation`, `created_at`.

## Arquitetura técnica (espelha a SolisCloud)
1. **Credencial**: token cifrado (AES-256-GCM) em `integration_credentials` com `provider = 'digital_grid'`. Reaproveita `crypto/secrets.ts`.
2. **Configuração**: habilitar o card "Digital Grid" em **Configurações › Integrações** (form de token + "Testar conexão" via `GET /agents/?page=1`).
3. **Client**: `lib/digitalgrid/client.ts` — `Authorization: Bearer <token>`, base URL, cache TTL, helper de paginação (segue `next`).
4. **Proxy read-only**: `app/api/digitalgrid/*` (route handlers GET, `requireSession`), com mappers DG→front.
5. **Persistência (recomendado)**: faturas e rateio são mensais → **sincronizar para o banco** (tabelas `faturas` já existe; criar `rateios`), via job no serviço `sync` (como `medicoes_geracao`). Mantém histórico/independência e permite cruzar com geração.

## Decisões (definidas com o usuário)
- **Prioridade 1: Financeiro** (`/bills`) — substituir as faturas manuais pelas reais do Digital Grid.
- **Estratégia: sincronizar para o banco via cron** (como o histórico de geração) — independência, histórico próprio e relatórios rápidos.

## Fases (quando o token chegar)
1. ✅ **Conexão**: card Digital Grid em Configurações › Integrações; token cifrado; "Testar conexão" detecta o esquema (descoberto: **`Token`**, não Bearer).
2. ✅ **Financeiro real**: `/bills` → tabela `faturas_dg` (migration 0005), `syncFaturasDg` (paginado, upsert por `dg_bill_id`), tela `/financeiro` com KPIs + filtros, cron 6h no serviço `sync`. **148 faturas reais** sincronizadas (~R$ 276k faturado, ~R$ 73k de economia).
3. ✅ **Rateio real**: `/estimated-quota` → tabela `rateios_dg` (migration 0006), `syncRateioDg` resolve competência+usina (`generation_month`→`monthly-generation`→`generators`), tela `/rateio` com KPIs + filtros, cron 6h. **233 cotas reais, 5 usinas** — último mock eliminado.
4. ✅ **Conciliação de cadastros**: tela `/cadastros/conciliacao` + `importarCadastrosDg` (idempotente). Importa **clientes** (por documento) e **UCs** (por número, ligando cliente via `owner`). **Usinas** não são criadas (nomes SolisCloud × DG divergem) — vínculo manual pelo `Código Digital Grid`. Real: 32 clientes + 40 UCs importados.

## Como obter o token (orientação)
1. Acesse o portal **gestao.dg.energy** com a conta da ASCENDER (perfil admin/agente).
2. Procure por **API / Integrações / Tokens** (geralmente em Configurações, Perfil da conta, ou Desenvolvedor). O guia oficial (scribehow) tem o passo a passo "autenticar e testar no Postman/Insomnia".
3. Gere/copie o **token de API** (string longa). Guarde com segurança — ele dá acesso de leitura aos dados financeiros.
4. Para validar fora do sistema: no Postman/Insomnia, `GET https://gestao.dg.energy/api/v1/agents/` com header `Authorization: Bearer <token>`. Se vier 200 com JSON, o token funciona (se 401/403, tentar `Authorization: Token <token>`).
5. Traga o token que eu cadastro na tela (cifrado) e seguimos para a Fase 1.
