# ASCENDER — Onde paramos (retomar depois)

_Atualizado em 2026-06-18._

## Status atual
- Rodando no Docker (projeto `ascender-app`), **porta 3005** → **http://localhost:3005**
  (a 3000 é do seu `vobys-web`; porta configurável via `APP_PORT` no `.env`).
- **Login:** `ewaldo.alves@gmail.com` — senha em `ascender-app/.env` (`LOGIN_PASSWORD`).
- **SolisCloud: configurada, ativa e funcionando.** Credenciais salvas (cifradas).
  Consolidado real: **8 usinas, 7 online, ~296 kW agora, ~43.834 kWh no mês**.
- **8 usinas reais importadas** e vinculadas pelo Station ID (Cadastros › Usinas).
- **Cruzamento realizado × esperado** ativo nas telas **Usinas** e **Executivo**.
- Cadastros (cliente, UC, contrato, distribuidora, usina) persistidos no Postgres
  (volume `ascender-app_ascender_pgdata`).

## ▶️ PRÓXIMOS PASSOS (executar depois)
1. ✅ Feito: usinas mock removidas (8 reais), **kWp real** importado e **meta de
   geração preenchida automaticamente** (média do histórico, no sync) — aderência ativa.
2. **Trocar a senha gerada** em **Configurações › Segurança**.
3. (Opcional) Completar distribuidora/código Digital Grid nas usinas (Cadastros › Usinas).
4. **Rateio**: aguardando acesso ao Digital Grid (ou transformar em lançamento manual).

## Telas para validar os dados reais
- **SolisCloud** (`/soliscloud`): telemetria por estação, inversores, alarmes.
- **Usinas** (`/usinas`): tabela cruzando cadastro × geração real + gráficos.
- **Executivo** (`/executivo`): KPI "Geração Solis mês" (real) + aderência.
- **Geração** (`/geracao`): curva de potência do dia + geração/receita por dia
  do mês e por mês do ano (stationDay/Month/Year), com seletor de usina/período.
- **Financeiro** (`/financeiro`): lançamento manual de faturas (CRUD com modal)
  + KPIs (faturado/pago/em aberto/vencido). Independe do Digital Grid.
- **Análise** (`/analise`): gráficos Nivo (barras + rosca) com **crossfilter por
  usina** (clicar filtra KPIs/gráficos) e seletor de período (hoje/mês/ano).
- **Início** e **Executivo**: KPIs e gráficos **dinâmicos** — geração do histórico
  (`medicoes_geracao`), potência ao vivo e financeiro das faturas reais.

- **Propostas** (`/propostas`): CRUD manual (simulador — economia calculada das
  tarifas: consumo × (tarifa distribuidora − tarifa ASCENDER)) + KPIs.

**Mock que ainda resta**: só o **Rateio** (`/rateio`) — aguardando o acesso ao
Digital Grid. A "geração esperada" por usina é meta preenchida no cadastro.

## Comandos Docker (pasta `ascender-app/`)
```bash
docker compose up -d            # subir
docker compose up -d --build    # subir reconstruindo (após mudar código)
docker compose logs -f app      # logs
docker compose stop             # pausar (mantém dados)
docker compose down             # remover containers (mantém volume/dados)
```
Sincronizar usinas da SolisCloud por linha de comando (alternativa ao botão):
```bash
docker exec ascender-app-app-1 npm run db:import-usinas
```

## Correções/funcionalidades desta fase
- SolisCloud: URL base normalizada (assume `https://`) e `Content-Type` da
  assinatura sem `charset` (senão HTTP 403 "wrong sign").
- Cruzamento usina↔SolisCloud (`getUsinasComTelemetria` em
  `src/lib/cadastros/queries.ts`) + importação (`src/lib/cadastros/sync.ts`).

## Roadmap pendente (fases seguintes)
- [ ] Metas de geração nas usinas reais (passo 1 acima) → aderência completa.
- [x] **Financeiro: lançamento manual de faturas** (CRUD) — feito.
- [ ] **Digital Grid**: verificar com eles se há API oficial / exportação de
      relatórios (checklist no histórico da conversa); integrar read-only quando
      confirmado. Hoje só há endpoints internos do portal (sessão/CSRF), não API.
- [x] **Histórico mensal de geração** (SolisCloud → banco, tabela
      `medicoes_geracao`) com **cron** (serviço `sync` no compose, a cada 6h) — feito.
- [ ] Lançamentos: rateio (manual).
- [ ] Tela de troca de senha (rota `PUT /api/auth/password` já existe; falta UI).
- [ ] Integração **Digital Grid** (financeiro) — depende de validação da API.
- [ ] Importador de planilha Excel e **RBAC** multiusuário.
