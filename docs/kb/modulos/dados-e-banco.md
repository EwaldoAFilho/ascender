# Modulo: Dados & Banco (Drizzle/Postgres)

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/db/schema.ts, ascender-app/src/lib/db/index.ts, ascender-app/drizzle.config.ts, ascender-app/drizzle/, ascender-app/src/lib/db/seed.ts, ascender-app/docker-entrypoint.sh, ascender-app/docker-compose.yml, ascender-app/docker-compose.prod.yml, ascender-app/Dockerfile, ascender-app/src/lib/env.ts

## Visao geral
Camada de persistencia unica da aplicacao: define o modelo relacional em Drizzle ORM sobre Postgres, expoe um cliente `getDb()` (singleton preguicoso de pool `pg`) e mantem o esquema versionado por migrations SQL geradas pelo drizzle-kit. Existe para centralizar o acesso ao banco (todo modulo de dominio consome `getDb()`) e garantir que o schema aplicado no banco acompanhe o codigo. As migrations sao aplicadas automaticamente no boot do container (entrypoint) e um seed idempotente cria o usuario admin inicial. O schema atual tem 22 tabelas (o pedido original citava 15; cresceu com telemetria, Digital Grid e gerador de propostas).

## Responsabilidades
- Declarar todas as tabelas, colunas, tipos, defaults, FKs, uniques e indices (`schema.ts`).
- Fornecer o cliente de banco singleton `getDb()` reutilizado por todo o codigo (`index.ts`).
- Configurar o drizzle-kit (schema, saida `./drizzle`, dialeto postgres, URL) (`drizzle.config.ts`).
- Versionar a evolucao do schema em arquivos `.sql` numerados + snapshots/journal em `drizzle/meta/`.
- Aplicar migrations no boot e semear o admin inicial (`docker-entrypoint.sh` + `seed.ts`).
- Definir os tipos TypeScript inferidos (`$inferSelect`) reexportados para o resto da app.
- Definir o tipo customizado `bytea` (BLOB) para anexos.

## Principais arquivos
| Caminho | Papel |
| --- | --- |
| ascender-app/src/lib/db/schema.ts | Definicao das 22 tabelas, FKs, uniques, indices, tipo `bytea` e tipos inferidos |
| ascender-app/src/lib/db/index.ts | `getDb()` — singleton do `Pool` (pg) + `drizzle()` com schema; leitura lazy de `DATABASE_URL` |
| ascender-app/drizzle.config.ts | Config do drizzle-kit (schema, out `./drizzle`, dialect postgresql, `dbCredentials.url`) |
| ascender-app/drizzle/0000..0017_*.sql | 18 migrations SQL versionadas (generate) |
| ascender-app/drizzle/meta/_journal.json + NNNN_snapshot.json | Estado/historico das migrations (usado pelo drizzle-kit migrate) |
| ascender-app/src/lib/db/seed.ts | Seed idempotente do usuario admin (argon2) a partir de LOGIN_EMAIL/LOGIN_PASSWORD |
| ascender-app/docker-entrypoint.sh | Boot: `db:migrate` -> `db:seed` -> `npm start` |
| ascender-app/src/lib/env.ts | `env.databaseUrl()` (lazy/required) consumido por `getDb()` |
| ascender-app/docker-compose.yml | Servico `db` (postgres:16-alpine), volume `ascender_pgdata`, healthcheck; `DATABASE_URL` para host `db` |

## Entidades / tabelas
Nomes reais (variavel Drizzle -> tabela no Postgres):

Configuracao / integracao / auth
- `integrationCredentials` -> `integration_credentials` (provider unico; segredo cifrado AES-256-GCM)
- `appSettings` -> `app_settings` (chave/valor; PK = key)
- `usuarios` -> `usuarios` (email unico, senha_hash argon2)

Cadastros-mestre
- `distribuidoras` -> `distribuidoras` (nome unico)
- `clientes` -> `clientes`
- `unidadesConsumidoras` -> `unidades_consumidoras`
- `usinas` -> `usinas`
- `contratos` -> `contratos`

Financeiro / geracao
- `faturas` -> `faturas` (lancamento manual)
- `faturasDg` -> `faturas_dg` (sync Digital Grid, `dg_bill_id` unico)
- `contasEnergia` -> `contas_energia` (PDF em base64; 1:1 com faturas_dg)
- `rateiosDg` -> `rateios_dg` (sync Digital Grid; unique month+installation+owner)
- `medicoesGeracao` -> `medicoes_geracao` (unique usina+competencia+fonte)

Propostas
- `propostas` -> `propostas`
- `parametrosProposta` -> `parametros_proposta` (linha unica; JSON de custos/margem — SENSIVEL)

Telemetria (append-only)
- `telemetriaEstacao` -> `telemetria_estacao`
- `telemetriaInversor` -> `telemetria_inversor`
- `telemetriaColetor` -> `telemetria_coletor`
- `alarmes` -> `alarmes` (`alarm_id` unico; upsert)

Genericos / auditoria
- `anexos` -> `anexos` (polimorfico por entidade+entidadeId; conteudo `bytea`)
- `cadastroHistorico` -> `cadastro_historico` (polimorfico por entidade+entidadeId)
- `syncRuns` -> `sync_runs` (auditoria de cada execucao do worker)

## Endpoints / Server Actions
Este modulo NAO expoe rotas/actions proprias — e uma biblioteca de infra. Exporta apenas `getDb()` (index.ts) e os tipos inferidos. Scripts CLI operacionais (via `npm run db:*`, definidos em package.json) usam este modulo:
- `seed.ts` (`db:seed`) — cria admin idempotente.
- `import-usinas.ts`, `sync-geracao.ts`, `sync-faturas-dg.ts`, `sync-rateio-dg.ts`, `sync-telemetria.ts`, `conciliar-dg.ts`, `auditar-rateio.ts`, `inspecionar-rateio.ts`, `investigar-atencao.ts`, `reconciliar-fatura.ts`, `map-readiness.ts`, `dg-preview.ts` — scripts operacionais/one-off que ficam na mesma pasta `src/lib/db/`.
- `sync-run.ts` — helper de auditoria que grava em `sync_runs`.

Consumidores de `getDb()`: 26 arquivos (ex.: `src/lib/auth/users.ts`, `src/lib/cadastros/{queries,actions,anexos,historico,sync}.ts`, `src/lib/digitalgrid/{credentials,cadastros,sync,queries}.ts`, `src/lib/soliscloud/{credentials,telemetria-db,telemetria-sync}.ts`, `src/lib/propostas/{parametros,actions}.ts`, `src/lib/financeiro/conta.ts`, `src/lib/auditoria/queries.ts`, `src/lib/ai/credentials.ts`, `src/app/(dashboard)/integracoes/page.tsx`).

## Telas
Nenhuma tela pertence a este modulo. As paginas em `src/app/(dashboard)/*` consomem o banco indiretamente via modulos de dominio que chamam `getDb()`.

## Regras de negocio
Explicitas (no schema/codigo):
- FK com `onDelete: "restrict"` bloqueia apagar entidade referenciada: `unidades_consumidoras.cliente_id` e `contratos.cliente_id` (schema.ts:112, :176). Em `propostas.cliente_id` tambem e `restrict`, porem a coluna e nullable (schema.ts:359).
- FK com `onDelete: "set null"` desassocia sem apagar: distribuidora em UC/usina/proposta, usina/UC em contratos/faturas/propostas, e `usina_id` em toda telemetria e alarmes (varias linhas).
- `medicoes_geracao.usina_id` e `contas_energia.fatura_dg_id` usam `onDelete: "cascade"` — apagar a usina/fatura-DG apaga os filhos (schema.ts:235, :284).
- `contas_energia.fatura_dg_id` e `unique` -> relacao 1:1 (uma conta de energia por fatura do Digital Grid) (schema.ts:281-284).
- Uniqueness de negocio: `integration_credentials.provider`, `usuarios.email`, `distribuidoras.nome`, `alarmes.alarm_id`, `faturas_dg.dg_bill_id`; compostos `medicoes_geracao (usina_id, competencia, fonte)` e `rateios_dg (generation_month_id, installation, owner_document)` — chaves de idempotencia dos syncs (schema.ts:245, :346).
- Seed do admin so roda se `count(usuarios) == 0`; nao sobrescreve senhas geridas na app; sem `LOGIN_PASSWORD` apenas avisa e sai (seed.ts:17-31).
- `env.databaseUrl()` e `required` (lanca erro se ausente/vazio) — falha em runtime, nao no build (env.ts:5-16).
- `custo_total`, `margem_valor`, `margem_percent` e `parametros_proposta.dados` marcados como SENSIVEL/uso interno — nao expor ao cliente (schema.ts:392, :407).

Implicitas / convencoes:
- Estrategia nullable: colunas adicionadas depois (ex.: resultado do gerador em `propostas`, dados cadastrais em `usinas`, campos extraidos de `contas_energia`) sao nullable para nao quebrar linhas antigas — migration adiciona coluna sem default. HIPOTESE: escolha para permitir backfill/compatibilidade retroativa (evidencia: comentarios "propostas antigas ficam sem esses dados" schema.ts:379; 0017 faz `DROP NOT NULL` em `cliente_id`).
- Tabelas de telemetria sao append-only ("cada linha e uma leitura; estado atual = registro mais recente via DISTINCT ON"; sem limpeza) — comentario schema.ts:416-418. HIPOTESE de crescimento ilimitado (ver Riscos).
- `origem` (manual|digitalgrid|soliscloud) + `origem_sincronizado_em` em clientes/UCs/usinas registram proveniencia do dado (comentarios no schema).
- `anexos`/`cadastro_historico` sao polimorficos por (`entidade`, `entidade_id`) SEM FK real — integridade referencial nao e garantida pelo banco (HIPOTESE: escolha para reuso generico; hoje so `'cliente'`).

## Dependencias
- Depende de: `drizzle-orm` (node-postgres) e `pg` (Pool); `drizzle-kit` (generate/migrate); `@node-rs/argon2` (hash no seed); `@/lib/env` (`databaseUrl()`); Postgres 16 (compose) com `gen_random_uuid()`; runtime Node (o `pg`/Pool exige Node, portanto consumidores rodam em Node runtime, nao Edge).
- Consumido por: todos os modulos de dominio via `getDb()` (auth, cadastros, digitalgrid, soliscloud/telemetria, propostas, financeiro, auditoria, ai) e os scripts `db:*`. O `docker-entrypoint.sh` orquestra `db:migrate` + `db:seed` no boot; os servicos `sync`, `sync-dg`, `sync-telemetria` (compose) rodam os scripts em loop.

## Riscos de alteracao
- Editar `schema.ts` sem rodar `npm run db:generate` deixa codigo e banco divergentes; a migration so e aplicada no boot (`db:migrate` no entrypoint) — em dev sem re-boot o banco fica desatualizado.
- Adicionar coluna `notNull()` sem default a uma tabela ja populada faz a migration falhar; como o migrate roda no entrypoint, o container nao sobe (indisponibilidade). Preferir nullable ou default.
- Trocar `onDelete` (restrict<->cascade) muda silenciosamente o comportamento de exclusao — cascade pode apagar dados em massa; restrict pode travar deletes esperados.
- Tabelas de telemetria sao append-only sem retencao: crescimento indefinido de `telemetria_*` pode inchar o banco/volume `ascender_pgdata` ao longo do tempo.
- Alterar chaves unicas compostas de `medicoes_geracao`/`rateios_dg` quebra a idempotencia (upsert) dos syncs, gerando duplicatas.
- `parametros_proposta` como linha unica: codigo que assume "uma linha" quebra se houver 0 ou >1 (nao ha constraint garantindo unicidade — HIPOTESE, ver Pendencias).
- `getDb()` guarda o pool em `globalThis`; mudar a `DATABASE_URL` em runtime nao reconecta (cache do singleton).
- `contas_energia.arquivo_base64` e `anexos.conteudo` (bytea) guardam binarios no banco — linhas grandes; alterar isso afeta backups/tamanho.

## Pendencias / a investigar
- Nao ha migration que garanta unicidade de `parametros_proposta` (linha unica e por convencao no codigo); confirmar como `src/lib/propostas/parametros.ts` garante 1 linha.
- Confirmar se existe rotina de retencao/limpeza para as tabelas `telemetria_*` (nao encontrada).
- `rateios_dg`/`faturas_dg` nao tem FK para `usinas`/`clientes` (vinculo por numero/documento) — verificar como o join e feito nas queries (`src/lib/digitalgrid/queries.ts`).
- `db:migrate` usa `drizzle-kit migrate` no boot; nao ha lock/retry explicito no entrypoint alem do `depends_on: service_healthy` — investigar comportamento se varios servicos (app + syncs) subirem e tentarem migrar em paralelo (cada servico do compose usa a mesma imagem; apenas `app` roda o entrypoint com migrate — os syncs sobrescrevem `entrypoint: []`, entao so o app migra — confirmar).
- `drizzle.config.ts` tem URL default `postgresql://ascender:ascender@localhost:5432/ascender` como fallback — risco de apontar para banco errado se `DATABASE_URL` faltar em ambiente de migracao.

## Fontes
- ascender-app/src/lib/db/schema.ts (lido integralmente)
- ascender-app/src/lib/db/index.ts (lido integralmente)
- ascender-app/src/lib/db/seed.ts (lido integralmente)
- ascender-app/drizzle.config.ts (lido integralmente)
- ascender-app/drizzle/ (listado; lidos 0000, 0016, 0017; `_journal.json` completo)
- ascender-app/docker-entrypoint.sh, Dockerfile, docker-compose.yml, docker-compose.prod.yml (lidos)
- ascender-app/src/lib/env.ts (lido)
- ascender-app/package.json (scripts db:* e dependencias)
- grep de `references(`, `pgTable(`, consumidores de `getDb`
