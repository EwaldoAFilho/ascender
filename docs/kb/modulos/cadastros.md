# Modulo: Cadastros (CRUD)

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/cadastros/, ascender-app/src/app/(dashboard)/cadastros/, ascender-app/src/components/cadastros/, ascender-app/src/app/api/cadastros/anexo/, ascender-app/src/lib/db/schema.ts, ascender-app/src/lib/digitalgrid/cadastros.ts

## Visao geral
Subsistema de cadastros-mestre da ASCENDER: CRUD de distribuidoras, clientes, unidades consumidoras (UCs), usinas e contratos, mais faturas e propostas (colocadas aqui mas revalidando outras telas). Existe para manter o modelo relacional que sustenta operacao, financeiro, propostas e mapa. Tudo passa por um unico componente generico de UI (`CrudSection`) e por Server Actions com validacao Zod. Registros podem ser criados manualmente ou importados de integracoes (SolisCloud, Digital Grid), preservando a proveniencia. Clientes tem "ficha" com anexos e historico de alteracoes.

## Responsabilidades
- CRUD manual das 5 entidades-mestre via modal generico (`CrudSection`).
- Validacao e coercao de entrada (Zod) em cada Server Action; erros amigaveis.
- Importar usinas reais da SolisCloud (upsert por Station ID).
- Conciliar/importar clientes, UCs e vincular usinas com o Digital Grid (sem duplicar; nada e alterado no DG).
- Proveniencia (`origem` / `origem_sincronizado_em`) e banner de aviso no modal.
- Ficha do cliente: upload/download/exclusao de anexos (bytea) e historico de alteracoes de campo.
- Fornecer opcoes de selects (FKs) e contadores/resumos para o hub e para outros modulos.

## Principais arquivos
| Caminho | Papel |
| --- | --- |
| ascender-app/src/lib/cadastros/actions.ts | Server Actions ("use server"): save/delete de todas as entidades + importadores + ficha do cliente |
| ascender-app/src/lib/cadastros/queries.ts | Selects de listagem, opcoes de FK, resumos/contadores e cruzamento usina x telemetria |
| ascender-app/src/lib/cadastros/anexos.ts | CRUD de anexos genericos (bytea) + registro no historico |
| ascender-app/src/lib/cadastros/historico.ts | Gravacao/leitura de `cadastro_historico` e `autorAtual()` (sessao) |
| ascender-app/src/lib/cadastros/sync.ts | `importStationsFromSolis` e `syncGeracaoMensal` (SolisCloud) |
| ascender-app/src/components/cadastros/CrudSection.tsx | Componente generico de tabela + modal de criar/editar/excluir |
| ascender-app/src/components/cadastros/ClienteFicha.tsx | Bloco de anexos + historico dentro do modal de cliente |
| ascender-app/src/components/cadastros/OrigemBanner.tsx | Aviso de proveniencia (campos que a integracao controla) |
| ascender-app/src/components/cadastros/ImportarUsinasSolis.tsx | Botao que dispara `importarUsinasSolis` |
| ascender-app/src/components/cadastros/ImportarCadastrosDg.tsx | Botao que dispara `importarCadastrosDg` |
| ascender-app/src/app/api/cadastros/anexo/route.ts | POST upload de anexo (multipart, max 25 MB, so entidade 'cliente') |
| ascender-app/src/app/api/cadastros/anexo/[id]/route.ts | GET download/visualizacao do binario do anexo |
| ascender-app/src/lib/digitalgrid/cadastros.ts | Relatorio e importacao de conciliacao com o Digital Grid |
| ascender-app/src/app/(dashboard)/cadastros/*/page.tsx | Telas (hub + uma por entidade + conciliacao) e layout com abas |

## Entidades / tabelas
Definidas em `ascender-app/src/lib/db/schema.ts`:
- `distribuidoras` — nome (unique), uf, ativo.
- `clientes` — nome, documento (default ""), tipo (cliente|prosumidor|investidor), status (ativo|inativo), email, responsavel, dadosAdicionais, origem, origemSincronizadoEm.
- `unidades_consumidoras` — clienteId (FK restrict), codigoInstalacao, distribuidoraId (FK set null), consumoMedioKwh, ativo, origem.
- `usinas` — nome, codigoDigitalGrid, stationIdSoliscloud, distribuidoraId (FK set null), potenciaKwp, geracaoEsperadaKwhMes, status (ativa|atencao|inativa), endereco/bairro/estado/cep, codigoCliente, codigoInstalacao, modulos, inversores, latitude, longitude, origem.
- `contratos` — clienteId (FK restrict), unidadeConsumidoraId (FK set null), usinaId (FK set null), tarifaDistribuidora, tarifaAscender, percentualDesconto, status (simulacao|em-analise|ativo).
- `anexos` — generico por (entidade, entidadeId); conteudo em `bytea`; metadados (nome, mimeType, tamanhoBytes, enviadoPor). Hoje so usado por 'cliente'.
- `cadastro_historico` — (entidade, entidadeId, acao, campo, valorAntes, valorDepois, detalhe, autor). Hoje so alimentado por 'cliente'.
- `medicoes_geracao` — historico mensal por usina (usado nas queries de geracao/heatmap).

Tocadas por Server Actions colocadas aqui, mas de outros modulos: `faturas` (financeiro), `propostas` (propostas comerciais).

## Endpoints / Server Actions
Server Actions em `src/lib/cadastros/actions.ts` (todas passam por `ensureAuth`):
- `saveDistribuidora`, `deleteDistribuidora`
- `saveCliente`, `deleteCliente`, `getFichaCliente`, `excluirAnexoCliente`
- `saveUnidade`, `deleteUnidade`
- `saveUsina`, `deleteUsina`
- `saveContrato`, `deleteContrato`
- `saveFatura`, `deleteFatura` (revalida `/financeiro`)
- `saveProposta`, `deleteProposta` (revalida `/propostas`)
- `importarUsinasSolis` (chama `importStationsFromSolis`)
- `importarCadastrosDg` (chama `runImportarCadastrosDg` de digitalgrid/cadastros)

Queries em `src/lib/cadastros/queries.ts`: `listDistribuidoras`, `listClientes`, `listUnidades`, `listUsinas`, `listContratos`, `listFaturas`, `listPropostas`, `opcoesDistribuidoras/Clientes/Unidades/Usinas`, `opcoesEstacoesSolis`, `getCadastrosResumo`, `getResumoFaturas`, `getHistoricoGeracaoMensal`, `geracaoPorUsinaMes`, `getTelemetriaPorStation`, `getUsinasComTelemetria`.

Rotas API (`nodejs`, `force-dynamic`, protegidas por `requireSession`):
- `POST /api/cadastros/anexo` — upload multipart de anexo (chama `salvarAnexo`).
- `GET /api/cadastros/anexo/[id]` — devolve o binario (`?download=1` forca attachment).

Conciliacao (`src/lib/digitalgrid/cadastros.ts`): `getConciliacaoReport` (leitura), `importarCadastrosDg` (escrita no banco local).

## Telas
Layout com abas em `src/app/(dashboard)/cadastros/layout.tsx` (envolto em `DesktopOnly`):
- `/cadastros` — hub com cards/contadores (`getCadastrosResumo`).
- `/cadastros/usinas` — CRUD + importar SolisCloud + banner de proveniencia; 1a coluna clicavel.
- `/cadastros/clientes` — CRUD + ficha (anexos/historico) + banner de proveniencia.
- `/cadastros/unidades` — CRUD de UCs (selects de cliente e distribuidora).
- `/cadastros/contratos` — CRUD (selects de cliente, UC, usina).
- `/cadastros/distribuidoras` — CRUD simples (nome, uf).
- `/cadastros/conciliacao` — relatorio DG + botao de importar (exige token DG configurado).

## Regras de negocio
- Autenticacao obrigatoria em toda action: `ensureAuth` verifica `session.authenticated` (actions.ts:33-37). As rotas de anexo usam `requireSession` (401).
- Apos salvar/excluir, `revalidatePath("/cadastros","layout")`; faturas revalidam `/financeiro` e propostas `/propostas` (actions.ts:39-41, 457, 508).
- Validacao Zod por entidade. `optText`: string vazia/whitespace -> null (actions.ts:47-54). `optCoord`: latitude -90..90, longitude -180..180; fora da faixa -> erro (actions.ts:56-69, 332-333).
- Defaults de cliente: `tipo`=cliente, `status`=ativo, `documento`=""; usina: `status`=ativa; contrato: `status`=simulacao (actions.ts / schema.ts).
- Historico so e registrado para clientes: na criacao acao "criou"; na edicao, um "editou_campo" por campo alterado, comparando os 7 campos de `CLIENTE_CAMPOS` com `normValor` (actions.ts:139-205). Demais entidades NAO geram historico. HIPOTESE: e uma decisao intencional (schema de historico e generico e reaproveitavel).
- Anexos so aceitam entidade 'cliente': validado no route (`ENTIDADES = new Set(["cliente"])`, anexo/route.ts:9,26) e nas actions (`getFichaCliente`/`excluirAnexoCliente` fixam "cliente"). Limite 25 MB, rejeita arquivo vazio (anexo/route.ts:8,34-39). Conteudo salvo como `bytea` no Postgres (anexos.ts:39-51).
- Salvar/excluir anexo grava historico ("anexou"/"removeu_anexo") com autor da sessao (anexos.ts:52-60, 93-101).
- Exclusao depende das FKs do banco: UC e contrato referenciam cliente com `onDelete: restrict`; ao violar, o `catch` retorna mensagem fixa (ex.: "Nao foi possivel excluir (ha UCs/contratos vinculados)."). O texto e assumido, nao ha checagem explicita de vinculo (actions.ts:246-259, 293-308, 358-371).
- `saveDistribuidora`: `nome` e unique; qualquer erro no insert/update cai em "Erro ao salvar (nome ja existe?)." (actions.ts:96-98).
- Importar SolisCloud (`importStationsFromSolis`, sync.ts): upsert por `station_id_soliscloud`; `capacityStr` iniciando por "M" trata capacidade como MW e multiplica por 1000 (sync.ts:51-52). Marca `origem="soliscloud"` e `origemSincronizadoEm`. No update, sobrescreve `nome` e `potenciaKwp` (sync.ts:59-68).
- Conciliacao DG (`importarCadastrosDg`, digitalgrid/cadastros.ts): clientes casados por documento (so digitos); CPF -> tipo "prosumidor", senao "cliente"; carimba/backfill `origem="digitalgrid"` idempotente. Usinas NAO sao criadas — so vinculadas por `codigoDigitalGrid` ou match exato de nome normalizado (`normName`); resto conta como `usinasSemVinculo`. UCs casadas por `codigoInstalacao`; cria o cliente pelo owner se faltar; `ativo = !numero.includes("CANCEL")` (cadastros.ts:243). Distribuidora casada por inclusao de nome, nunca criada (cadastros.ts:190-197). Nada e alterado no Digital Grid.
- `syncGeracaoMensal` (sync.ts): upsert de `medicoes_geracao` por (usina, competencia, fonte); depois backfill de `geracao_esperada_kwh_mes` com a media do historico, apenas onde ainda for 0 (nao sobrescreve meta manual) — sync.ts:147-154.
- `listPropostas` mostra `coalesce(clientes.nome, propostas.clienteNomeLivre)` — proposta pode existir sem cliente cadastrado (queries.ts:139).
- Heatmap `geracaoPorUsinaMes` limita ao ano corrente; celula sem registro = null (nao zero) — queries.ts:196-224.

## Dependencias
- Depende de:
  - `@/lib/db` (Drizzle/Postgres) e `@/lib/db/schema`.
  - `@/lib/auth/session` e `@/lib/auth/guard` (autenticacao).
  - `@/lib/soliscloud/*` (client, credentials, endpoints, mappers, telemetria-db) — importar usinas e cruzar telemetria.
  - `@/lib/digitalgrid/*` (client, credentials, cadastros) — conciliacao.
  - Componentes UI compartilhados: `DataTable`, `SummaryStrip`, `ConfirmProvider`, `ToastProvider`, `DesktopOnly`, `numberFormatter`.
- Consumido por:
  - `src/app/(dashboard)/page.tsx`, `executivo/page.tsx`, `mapa/page.tsx`, `usinas/page.tsx` — usam `queries.ts` (resumos, `getUsinasComTelemetria`, `listUsinas`).
  - `propostas/page.tsx` e `propostas/gerador/page.tsx` — usam `queries.ts` e `save/deleteProposta` de `actions.ts`.
  - `src/lib/db/import-usinas.ts` e `src/lib/db/sync-geracao.ts` — reutilizam funcoes de `sync.ts` nos workers.

## Riscos de alteracao
- `catch` generico nas actions mascara a causa real e devolve mensagens fixas ("ha UCs/contratos vinculados", "nome ja existe?"). Qualquer falha (rede/constraint diferente) vira a mesma mensagem, podendo enganar o usuario.
- Contradicao de proveniencia nas usinas: o painel `ImportarUsinasSolis` e o docstring de `importStationsFromSolis` dizem que a potencia NAO e sobrescrita, mas o `update` seta `potenciaKwp` (e `nome`) a cada sync. Editar potencia manualmente e re-importar apaga a edicao. (O `OrigemBanner` de usinas, por outro lado, avisa que potencia pode ser sobrescrita.)
- Anexos e historico sao genericos no schema, mas hardcoded para 'cliente' em varios pontos (route `ENTIDADES`, `getFichaCliente`, `excluirAnexoCliente`). Estender para UC/usina exige mexer em multiplos arquivos.
- Anexos gravados como `bytea` no Postgres (ate 25 MB cada) — risco de inchaco do banco e de payloads grandes nas Server Actions.
- `CrudSection` carrega TODAS as linhas de uma vez (sem paginacao/busca no servidor); tabelas grandes (usinas/UCs) podem ficar pesadas.
- Conciliacao DG depende de `normName` (normalizacao de acentos/caixa) e de match por inclusao de substring para distribuidora — fragil a variacoes de nome; pode vincular/duplicar errado.
- Faturas e propostas tem actions dentro de `cadastros/actions.ts` mas pertencem a outros modulos e revalidam outras rotas — mover/renomear pode quebrar `financeiro`/`propostas`.
- `getFichaCliente` retorna `{ anexos: [], historico: [] }` silenciosamente quando nao autenticado (nao lanca erro) — pode mascarar sessao expirada na UI.

## Pendencias / a investigar
- Confirmar a intencao sobre sobrescrita de potencia na importacao SolisCloud (docstring/painel x codigo divergem).
- Confirmar se ausencia de historico/anexos para UC, usina, contrato e distribuidora e intencional ou backlog.
- `medicoes_geracao` e as funcoes de geracao/heatmap vivem em `queries.ts` deste modulo, mas a sincronizacao (`sync-geracao.ts`) esta em `lib/db/` — fronteira do modulo x "operacao/geracao" nao esta clara.
- Nao ha busca/paginacao server-side; verificar se ha limite pratico de registros esperado.
- `deleteFatura`/`deleteProposta`/`saveProposta` colocados aqui: avaliar se deveriam migrar para os modulos financeiro/propostas.

## Fontes
- ascender-app/src/lib/cadastros/actions.ts
- ascender-app/src/lib/cadastros/queries.ts
- ascender-app/src/lib/cadastros/anexos.ts
- ascender-app/src/lib/cadastros/historico.ts
- ascender-app/src/lib/cadastros/sync.ts
- ascender-app/src/components/cadastros/CrudSection.tsx
- ascender-app/src/components/cadastros/ClienteFicha.tsx
- ascender-app/src/components/cadastros/OrigemBanner.tsx
- ascender-app/src/components/cadastros/ImportarUsinasSolis.tsx
- ascender-app/src/components/cadastros/ImportarCadastrosDg.tsx
- ascender-app/src/app/(dashboard)/cadastros/page.tsx, layout.tsx, clientes/page.tsx, unidades/page.tsx, usinas/page.tsx, contratos/page.tsx, distribuidoras/page.tsx, conciliacao/page.tsx
- ascender-app/src/app/api/cadastros/anexo/route.ts, anexo/[id]/route.ts
- ascender-app/src/lib/db/schema.ts
- ascender-app/src/lib/digitalgrid/cadastros.ts
- ascender-app/src/lib/auth/guard.ts, session.ts
- ascender-app/src/lib/db/index.ts
