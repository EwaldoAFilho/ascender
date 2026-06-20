# Plano de Persistência — Histórico no banco ("sync-first")

_Planejamento. Objetivo: o backend mantém o banco atualizado; as telas só leem
do banco. Escala para muitos usuários simultâneos e acumula histórico._

## Decisões (definidas com o usuário)

- **Histórico**: estado atual **+ série temporal**.
- **Sem limpeza/retenção**: guardar **tudo** — o histórico completo permite
  avaliar como a operação se comportou ao longo do tempo. Performance vem de
  índices e (quando crescer) **particionamento por tempo**, nunca de apagar.
- **Frequência da telemetria**: a cada **10 min**.
- **Escopo**: **telemetria das usinas + inversores + alarmes + coletores**
  (além de geração mensal, faturas e rateio, que já são sincronizados).

## Princípio

Hoje a maioria das telas chama a API **ao vivo** (cache 5 min em memória, por
processo). Vamos **inverter o fluxo**:

```
ANTES:  tela ──(a cada carga)──► API SolisCloud/DG     (lento, por usuário, sem histórico)
DEPOIS: worker ──(a cada 10 min)──► API ──► Postgres ──► telas só LEEM o banco
```

- **Escala**: a carga na API independe do nº de usuários (1 chamada por ciclo).
- **Velocidade**: telas abrem instantâneas (leitura local).
- **Resiliência**: API fora do ar → telas mostram o último dado bom (e acaba o
  erro de "1ª carga").
- **Histórico**: telemetria/alarmes deixam de ser efêmeros.

## Modelo de dados (novas tabelas)

Estratégia: tabelas **append-only** (uma linha por leitura); o **"estado atual"**
é o registro mais recente por entidade (`DISTINCT ON (usina_id) … ORDER BY
capturado_em DESC`, rápido com índice) — sem duplicar dados em duas tabelas.

| Tabela | Tipo | Conteúdo | Chave / índice |
|---|---|---|---|
| `telemetria_estacao` | append | capturado_em, usina_id, estado, potência_kw, energia dia/mês/ano/total | índice `(usina_id, capturado_em desc)` |
| `telemetria_inversor` | append | capturado_em, usina_id, serial, estado, potência, energia hoje/total, temperatura | índice `(serial, capturado_em desc)` |
| `telemetria_coletor` | append | capturado_em, usina_id, sn, estado, última_comunicação, modelo | índice `(sn, capturado_em desc)` |
| `alarmes` | upsert | alarm_id (único), usina_id, device, nível, mensagem, iniciado_em, status, visto_em, atualizado_em, resolvido_em | upsert por `alarm_id` |
| `sync_runs` | append | job, iniciado_em, terminado_em, status, itens, mensagem | auditoria/saúde |

- **Alarmes**: 1 linha por alarme (upsert por `alarm_id`), com `status` e
  `resolvido_em` atualizados — fica o histórico de tudo que já alarmou (O&M).
- **`sync_runs`**: alimenta o "atualizado há X min" e a tela Integrações
  (última execução, ok/erro por job).
- **Curva intradiária**: a curva de potência do dia passa a ser construída dos
  próprios snapshots (~144 pontos/dia a 10 min) — sem precisar persistir o
  `stationDay`. Mensal/anual continuam em `medicoes_geracao`.
- Já existentes, mantidos: `medicoes_geracao` (mensal), `faturas_dg`,
  `rateios_dg` (cron 6h).

## O worker (backend)

Já existe o container **`sync`** (loop separado). Dois ritmos:

| Job | Fonte | Ritmo |
|---|---|---|
| **Telemetria** (estações, inversores, coletores, alarmes) | SolisCloud | **10 min** |
| Geração mensal | SolisCloud `stationYear` | 6h (já existe) |
| Faturas + Rateio | Digital Grid | 6h (já existe) |

- Fase inicial: novo `npm run db:sync-telemetria` + serviço no compose com loop
  de 600s (mesmo padrão do `sync` atual).
- Evolução: trocar o shell-loop por um **scheduler Node** (node-cron) num
  processo só, com logs e `sync_runs` — mais robusto.
- **Exclusão**: um worker só. Se um dia houver réplicas, usar **advisory lock**
  do Postgres para um ciclo não rodar em paralelo.
- Reusa a **fila global + retry** da SolisCloud (`client.ts`); estender o mesmo
  para o Digital Grid (hoje sem retry).

## Migração das telas (passam a ler do banco)

| Tela | Hoje | Depois |
|---|---|---|
| Início, Executivo, Usinas | telemetria ao vivo (`getTelemetriaPorStation`) | último snapshot do banco |
| SolisCloud | 4 chamadas ao vivo (hooks) | `/api/soliscloud/*` lê o banco (hooks não mudam) |
| Geração | `stationDay/Month/Year` ao vivo | curva do dia dos snapshots; mês/ano de `medicoes_geracao` |
| Análise | estações ao vivo | snapshots do banco |
| Financeiro, Rateio | já leem o banco | sem mudança |

Cada tela mostra **"atualizado há X min"** (de `capturado_em`/`sync_runs`). O
proxy ao vivo pode ficar como **fallback** se o último snapshot estiver muito
velho (worker caído).

## Dimensionamento (sem limpeza)

~8 usinas × 144 leituras/dia ≈ **1.150 linhas/dia** por série (≈ 420 mil/ano);
inversores e coletores na mesma ordem. Total ~1–2 milhões de linhas/ano — o
Postgres lida com dezenas de milhões tranquilamente. Conforme crescer (anos),
**particionar por mês** (RANGE em `capturado_em`) mantém as consultas rápidas
**sem apagar nada**. Alarmes e `sync_runs` são pequenos.

## Fases de implementação

1. **Schema + worker de telemetria** — migrations das 5 tabelas; `db:sync-telemetria`
   (estações, inversores, coletores, alarmes); serviço no compose (10 min);
   grava `sync_runs`. O banco começa a acumular (telas ainda ao vivo).
2. **Telas leem do banco** — Início, Executivo, Usinas, SolisCloud, Geração,
   Análise → queries do banco + "atualizado há X min"; proxy vira fallback.
3. **Histórico/relatórios** — visões novas que só o histórico permite: potência
   ao longo do tempo, **disponibilidade (uptime) dos coletores**, linha do tempo
   de alarmes, realizado × esperado por dia.
4. **Robustez** — scheduler Node (node-cron) no lugar do shell-loop; retry/fila
   no Digital Grid; advisory lock; particionamento quando o volume pedir.

## Decisões em aberto (antes/durante a implementação)

- **Curva intradiária**: derivar dos snapshots de 10 min (recomendado, 1 worker)
  ou persistir também o `stationDay` (curva oficial ~5 min)?
- **Worker**: começar com shell-loop (rápido) e evoluir para node-cron, ou já
  ir direto ao scheduler Node?
- **Fallback ao vivo**: manter o proxy como rede de segurança quando o snapshot
  estiver velho, ou assumir 100% banco?
