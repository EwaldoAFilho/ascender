# Modelo de dados (Postgres via Drizzle)

> Fonte: `ascender-app/src/lib/db/schema.ts`. Detalhe por tabela no módulo
> [`../modulos/dados-e-banco.md`](../modulos/dados-e-banco.md). Migrações em
> `ascender-app/drizzle/`. Colunas novas em tabelas existentes são **nullable**.

São ~22 tabelas. Agrupadas por domínio:

## Cadastro
| Tabela | Papel | FKs |
|--------|-------|-----|
| `clientes` | Cliente final | — |
| `unidades_consumidoras` | UC do cliente | → `clientes` |
| `distribuidoras` | Concessionária | — |
| `usinas` | Usina/planta FV | → `distribuidoras` |
| `contratos` | Contrato cliente×usina | → `clientes`, `usinas` |
| `anexos` | Arquivos anexados (`schema.ts:509`) | ref. à entidade |
| `cadastro_historico` | Histórico/proveniência de cadastros (`schema.ts:529`) | ref. à entidade |

## Propostas
| Tabela | Papel | FKs |
|--------|-------|-----|
| `propostas` (`schema.ts:355`) | Proposta gerada/manual + snapshot `dadosGerador`; campos sensíveis `custoTotal`/`margemValor`/`margemPercent`; `clienteId` **nullable** + `clienteNomeLivre` (cliente livre) | → `clientes` (nullable), `unidades_consumidoras`, `distribuidoras` |
| `parametros_proposta` (`schema.ts:405`) | Linha única, JSON `dados` = kit + custos + margem + premissas (Fio B) | — |

## Operação / Telemetria (SolisCloud — sync-first)
| Tabela | Papel |
|--------|-------|
| `telemetria_estacao` (`schema.ts:420`) | Leituras de estação (append-only; estado atual = mais recente por entidade) |
| `telemetria_inversor` (`schema.ts:444`) | Leituras de inversor |
| `telemetria_coletor` (`schema.ts:467`) | Leituras de coletor/datalogger |
| `alarmes` | Alarmes SolisCloud |
| `medicoes_geracao` (`schema.ts:229`) | Histórico mensal de geração |
| `sync_runs` | Registro de execuções dos workers de sync |

## Financeiro / Faturas
| Tabela | Papel |
|--------|-------|
| `faturas` | Faturas (ASCENDER) |
| `contas_energia` | Contas de energia (upload/parse) |
| `faturas_dg` | Faturas importadas do Digital Grid |
| `rateios_dg` (`schema.ts:324`) | Rateio de créditos do Digital Grid | → `faturas_dg` |

## Config / Auth
| Tabela | Papel |
|--------|-------|
| `usuarios` | Usuário(s) de login (ver [ADR-0001](../adr/ADR-0001-login-unico-sem-rbac.md)) |
| `app_settings` | Configurações gerais da app |
| `integration_credentials` | Credenciais de integração (criptografadas — ver `lib/crypto/`) |

## Relacionamentos (resumo)
- `clientes` 1—N `unidades_consumidoras`, `contratos`, `propostas`.
- `usinas` é o hub operacional: referenciada por `contratos`, telemetria e financeiro
  (7 FKs → `usinas`), e aponta para `distribuidoras`.
- `faturas_dg` 1—N `rateios_dg`.

> **Pendência:** colunas exatas e todos os FKs de `faturas`, `contas_energia`,
> telemetria e `anexos`/`cadastro_historico` a confirmar diretamente em `schema.ts`
> (este doc é o mapa de alto nível). Ver `pendencias/`.
