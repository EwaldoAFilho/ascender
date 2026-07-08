# Telas (rotas)

Rotas em `ascender-app/src/app/`. O grupo `(dashboard)` exige sessão; `/login` é
pública. Detalhe de comportamento no doc do módulo indicado.

| Rota | Descrição | Módulo (KB) |
|---|---|---|
| `/login` | Autenticação | [auth](../modulos/auth-autorizacao.md) |
| `/` | Home/cockpit | [operação](../modulos/operacao-e-dashboards.md) |
| `/executivo` | Visão executiva | [operação](../modulos/operacao-e-dashboards.md) |
| `/analise` | Análise | [operação](../modulos/operacao-e-dashboards.md) |
| `/geracao` | Geração | [operação](../modulos/operacao-e-dashboards.md) |
| `/mapa` | Mapa de usinas (pinos/contorno) | [operação](../modulos/operacao-e-dashboards.md) |
| `/usinas` | Usinas | [operação](../modulos/operacao-e-dashboards.md) |
| `/soliscloud` | Monitoramento SolisCloud | [soliscloud](../modulos/integracao-soliscloud.md) |
| `/financeiro` | Financeiro / faturas | [financeiro](../modulos/financeiro-faturas.md) |
| `/rateio` | Rateio de créditos | [rateio](../modulos/rateio-e-auditoria.md) |
| `/integracoes` | Integrações (visão) | [config/ia](../modulos/integracoes-config-e-ai.md) |
| `/propostas` · `/propostas/gerador` | Propostas e gerador FV | [propostas](../modulos/propostas-gerador.md) |
| `/cadastros/*` | clientes, unidades, distribuidoras, contratos, usinas, conciliação | [cadastros](../modulos/cadastros.md) · [rateio](../modulos/rateio-e-auditoria.md) |
| `/configuracoes/*` | integracoes, proposta-precos, senha, usuarios | [config/ia](../modulos/integracoes-config-e-ai.md) · [propostas](../modulos/propostas-gerador.md) · [auth](../modulos/auth-autorizacao.md) |

> **Pendência:** docs dedicados por tela (componentes, estados, interações) para as
> telas mais complexas (gerador, mapa, executivo). Ver `pendencias/`.
