# Contratos de API

A superfície de API do ASCENDER tem duas naturezas. Os payloads/validações detalhados
estão nos docs dos módulos; este índice mapeia onde procurar.

## 1. Server Actions (`"use server"`) — mutações internas
Validadas com **Zod** e protegidas por `getSession()`. Principais:
| Ação | Arquivo | Módulo |
|---|---|---|
| `gerarProposta`, `salvarParametrosProposta` | `ascender-app/src/lib/propostas/actions.ts` | [propostas](../modulos/propostas-gerador.md) |
| `saveProposta`, `deleteProposta`, CRUD de cadastros | `ascender-app/src/lib/cadastros/actions.ts` | [cadastros](../modulos/cadastros.md) |
| `salvarUsuario`, troca de senha | `ascender-app/src/lib/auth/actions.ts` | [auth](../modulos/auth-autorizacao.md) |

## 2. Route Handlers (`/api/*`) — HTTP
| Grupo | Rotas | Módulo |
|---|---|---|
| Auth | `POST /api/auth/login`, `logout`, `PUT /api/auth/password` | [auth](../modulos/auth-autorizacao.md) |
| SolisCloud | `/api/soliscloud/*` (stations, inverters, alarms, historico, ...) | [soliscloud](../modulos/integracao-soliscloud.md) |
| Integrações | `/api/integrations/{soliscloud,digitalgrid,ai}/{credentials,test}` | [config/ia](../modulos/integracoes-config-e-ai.md) |
| Financeiro | `/api/financeiro/conta/*` | [financeiro](../modulos/financeiro-faturas.md) |
| Cadastros | `/api/cadastros/anexo*` | [cadastros](../modulos/cadastros.md) |

## Regra transversal
Rotas internas checam sessão (middleware valida presença do cookie; validação real é
server-side). SolisCloud responde 409 (não configurado), 502 (erro da API), 401 (sem
sessão) — ver `lib/soliscloud/handler.ts`.

> **Pendência:** documentar payload/resposta/validação de cada endpoint com exemplos
> (um arquivo por grupo). Hoje o contrato vive no código (Zod schemas) e nos docs de
> módulo. Ver `pendencias/`.
