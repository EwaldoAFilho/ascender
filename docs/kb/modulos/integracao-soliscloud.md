# Modulo: Integracao SolisCloud

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/soliscloud/, ascender-app/src/app/api/soliscloud/, ascender-app/src/app/api/integrations/soliscloud/, ascender-app/src/lib/db/sync-telemetria.ts, ascender-app/src/lib/db/sync-geracao.ts, ascender-app/src/lib/db/sync-run.ts, ascender-app/src/lib/cadastros/sync.ts, ascender-app/src/lib/api/soliscloud.ts, ascender-app/src/types/soliscloud.ts, ascender-app/docker-compose.yml

## Visao geral
Integra a plataforma SolisCloud (monitoramento de usinas fotovoltaicas Solis) ao ASCENDER. Faz chamadas HTTP POST assinadas (HMAC-SHA1) ao servidor Solis, coletando telemetria (estacoes, inversores, coletores, alarmes) e historico mensal de geracao. A arquitetura e "sync-first": dois workers (cron via docker-compose) gravam os dados no Postgres — telemetria a cada ~10 min e geracao mensal a cada ~6h — e as telas/rotas leem sempre do banco (nao batem na Solis ao vivo, salvo o detalhe pontual de uma estacao). O segredo (KeySecret) fica cifrado (AES-256-GCM) e nunca sai do servidor.

## Responsabilidades
- Assinar e executar chamadas a API SolisCloud (`callSolis`), com fila global de rate limit, retry em falhas transitorias e cache TTL.
- Guardar/decifrar credenciais da integracao (`integration_credentials`) e testar conexao.
- Normalizar respostas heterogeneas da Solis (paginacao variavel, nomes de campo alternativos, unidades) em tipos de dominio.
- Coletar telemetria periodicamente e persistir series historicas (append-only) e alarmes (upsert).
- Sincronizar historico mensal de geracao/receita por usina para `medicoes_geracao`.
- Importar estacoes reais da conta Solis para o cadastro de usinas.
- Servir os dados ja persistidos via rotas `/api/soliscloud/*` para o front.
- Registrar cada execucao de worker em `sync_runs` (observabilidade / "atualizado ha X").

## Principais arquivos
| Caminho | Papel |
| --- | --- |
| ascender-app/src/lib/soliscloud/client.ts | Client HTTP: `callSolis`, fila global (`reserveSlot`), retry/backoff, cache, `SolisApiError`, validacao do envelope |
| ascender-app/src/lib/soliscloud/sign.ts | `buildAuthHeaders` — assinatura HMAC-SHA1 e string-to-sign |
| ascender-app/src/lib/soliscloud/credentials.ts | CRUD das credenciais cifradas; `getSolisCredentials`, `saveSolisCredentials`, `recordSolisTestResult` |
| ascender-app/src/lib/soliscloud/endpoints.ts | `SOLIS_ENDPOINTS`, base URL default, `normalizeBaseUrl`, mapa de erros amigaveis |
| ascender-app/src/lib/soliscloud/handler.ts | `withSolis` — wrapper de route handler (sessao + creds + tratamento de erro) |
| ascender-app/src/lib/soliscloud/types.ts | Tipos parciais/tolerantes das respostas da Solis (`SolisEnvelope`, `SolisPaged`, records) |
| ascender-app/src/lib/soliscloud/mappers.ts | `extractRecords` + mapeadores para tipos de dominio; conversao de unidades e estados |
| ascender-app/src/lib/soliscloud/telemetria-sync.ts | `syncTelemetria` — coleta telemetria e grava no banco (worker) |
| ascender-app/src/lib/soliscloud/telemetria-db.ts | Leitura sync-first do banco (estado atual, curvas, uptime, historicos) |
| ascender-app/src/lib/cadastros/sync.ts | `importStationsFromSolis` e `syncGeracaoMensal` (stationYear -> `medicoes_geracao`) |
| ascender-app/src/lib/db/sync-telemetria.ts | Entrypoint CLI (tsx) do worker de telemetria |
| ascender-app/src/lib/db/sync-geracao.ts | Entrypoint CLI (tsx) do worker de geracao mensal |
| ascender-app/src/lib/db/sync-run.ts | `registrarSyncRun` / `getSyncRunsResumo` — auditoria em `sync_runs` |
| ascender-app/src/lib/api/soliscloud.ts | Client de browser para as rotas internas + tipos `GenerationSeries` |
| ascender-app/src/types/soliscloud.ts | Tipos de dominio compartilhados com a UI |
| ascender-app/src/lib/crypto/secrets.ts | AES-256-GCM (`encryptSecret`/`decryptSecret`) e `maskKey` |
| ascender-app/docker-compose.yml | Servicos de cron `sync` (6h) e `sync-telemetria` (10 min) |

## Entidades / tabelas
| Tabela (real) | Uso neste modulo |
| --- | --- |
| integration_credentials | Credenciais da integracao (provider="soliscloud", keyId, key_secret_enc cifrado, base_url, is_active, last_test_at/ok) |
| telemetria_estacao | Snapshot append-only por estacao (estado, potencia_kw, energia_dia/mes/ano/total, capturado_em) |
| telemetria_inversor | Snapshot append-only por inversor (serial, estado, potencia_kw, energia, temperatura_c) |
| telemetria_coletor | Snapshot append-only por datalogger (sn, estado, ultima_comunicacao, modelo) |
| alarmes | 1 linha por alarme (upsert por alarm_id): nivel, mensagem, status, iniciado_em, resolvido_em |
| sync_runs | Auditoria de cada execucao de worker (job, status, itens, mensagem, iniciado/terminado_em) |
| medicoes_geracao | Historico mensal geracao_kwh/receita por usina+competencia+fonte (upsert; fonte="soliscloud") |
| usinas | Vinculo por station_id_soliscloud; leitura de meta (geracao_esperada_kwh_mes) e escrita em `importStationsFromSolis`/`syncGeracaoMensal` |

## Endpoints / Server Actions
Rotas de leitura (leem do banco, exigem sessao — `runtime="nodejs"`, `dynamic="force-dynamic"`):
| Rota | Funcao / origem |
| --- | --- |
| GET /api/soliscloud/stations | `lerEstacoesDoBanco` (telemetria-db.ts) |
| GET /api/soliscloud/stations/[id] | AO VIVO na Solis: `callSolis(stationDetail)` via `withSolis` — unica leitura live |
| GET /api/soliscloud/stations/[id]/generation?period=day\|month\|year | `curvaGeracaoBanco` (banco; ano vem de `medicoes_geracao`) |
| GET /api/soliscloud/inverters | `lerInversoresDoBanco` |
| GET /api/soliscloud/alarms | `lerAlarmesDoBanco` |
| GET /api/soliscloud/collectors | `lerColetoresDoBanco` |
| GET /api/soliscloud/historico | `historicoPotenciaFrota(24)` (curva de potencia da frota 24h) |
| GET /api/soliscloud/geracao-diaria | `geracaoDiariaFrota(14)` (realizado x meta, 14 dias) |
| GET /api/soliscloud/uptime-coletores | `uptimeColetores(24)` |
| GET /api/soliscloud/historico-alarmes | `historicoAlarmes(60)` |
| GET /api/soliscloud/sync-status | `ultimaTelemetriaEm` (selo "atualizado ha X") |
| GET /api/soliscloud/status | Status da credencial (configured/connected/keyIdMasked/baseUrl) |

Rotas de configuracao:
| Rota | Funcao |
| --- | --- |
| GET/PUT /api/integrations/soliscloud/credentials | Le (mascarado) / salva credenciais; PUT preserva o segredo se keySecret vazio |
| POST /api/integrations/soliscloud/test | Testa conexao (`callSolis(userStationList)`); grava `recordSolisTestResult` quando testa as salvas |

Funcoes de sincronizacao (workers / uso manual, nao sao rotas):
- `syncTelemetria()` — telemetria-sync.ts (worker ~10 min)
- `syncGeracaoMensal()` — cadastros/sync.ts (worker ~6h)
- `importStationsFromSolis()` — cadastros/sync.ts (importa estacoes -> usinas)
- `registrarSyncRun(job, fn, resumo)` — db/sync-run.ts (envelopa e audita)

Nao ha Server Actions (`"use server"`) neste modulo; tudo passa por route handlers e workers CLI.

## Telas
Rotas de pagina que consomem este modulo (via `src/lib/api/soliscloud.ts` / `useSolis`):
- /soliscloud — painel operacional Solis (estacoes, inversores, coletores, alarmes)
- /geracao — curvas e geracao diaria/mensal/anual
- /integracoes — saude da sincronizacao (`sync_runs`), historicos, uptime
- /executivo — visao consolidada
- /mapa — usinas georreferenciadas
- /usinas — lista/telemetria por usina
- /configuracoes/integracoes — cadastro/teste de credenciais SolisCloud

## Regras de negocio
Explicitas:
- Content-Type da assinatura e "application/json" SEM charset; incluir `;charset=UTF-8` gera HTTP 403 "wrong sign" (sign.ts:5-6, sign.ts:28-31).
- string-to-sign = `POST\n{Content-MD5}\n{Content-Type}\n{Date}\n{resourcePath}`; sign = base64(HmacSHA1(keySecret, string-to-sign)); header `Authorization: API {keyId}:{sign}` (sign.ts:17-38).
- Resposta considerada OK se `success===true` OU `code` in {"0","1","1000000"}; caso contrario vira `SolisApiError` (erro logico, sem retry) (client.ts:139-151).
- Retry apenas em falhas transitorias: rede, HTTP 429/500/502/503/504 (`isTransientStatus`), ate MAX_RETRIES=2, backoff linear 0,8s x tentativa (client.ts:46-54, 99-130).
- Rate limit e por CONTA (nao por endpoint): fila global `reserveSlot` com MIN_INTERVAL_MS=600ms (~1,6 req/s) compartilhada entre chamadas concorrentes (client.ts:13-16, 32-44).
- Cache TTL de 5 min por (resourcePath+body); os workers chamam com `{cache:false}` para dado fresco (client.ts:12, 34, telemetria-sync.ts:34).
- Estado de dispositivo: 1=online, 3=alarm, qualquer outro=offline (mappers.ts:46-51).
- Nivel de alarme: >=3 critico, ==2 medio, senao baixo (mappers.ts:53-58). Status: 2=resolvido, 1=em-tratativa, senao aberto (mappers.ts:60-65).
- Chave de deduplicacao de alarme: usa o id real; se id for "-1"/"0"/vazio, monta chave composta `estacao|deviceSn|alarmCode|alarmBegTime` (telemetria-sync.ts:133-156). Series de telemetria sao append-only; alarmes sao upsert por `alarm_id`, marcando `resolvido_em` quando status="resolvido" (telemetria-sync.ts:157-185).
- Vinculo leitura->usina por `usinas.station_id_soliscloud`; sem match, grava `usinaId=null` (telemetria-sync.ts:50-55).
- Meta diaria da frota = soma de `geracao_esperada_kwh_mes` / 30 (telemetria-db.ts:176-183).
- Realizado diario por estacao = pico (max) de `energia_dia_kwh` do dia (acumulado), somado entre estacoes (telemetria-db.ts:187-199, curva month 257-267).
- `syncGeracaoMensal` faz upsert por (usina, competencia, fonte) e preenche `geracao_esperada_kwh_mes` com a media do historico APENAS onde ainda e 0 (nao sobrescreve meta manual) (cadastros/sync.ts:96-154).
- `importStationsFromSolis`: potencia em MWp quando `capacityStr` comeca com "M" (converte *1000); atualiza so nome/potencia/origem, nao toca campos manuais (cadastros/sync.ts:31-84).
- Todas as rotas exigem sessao (`requireSession`); `withSolis` responde 409 `NOT_CONFIGURED` sem credencial, 502 em `SolisApiError`, 500 no resto (handler.ts:11-44).
- Curva "day" usa grade fixa de 15 min (00:00-23:45) no fuso America/Sao_Paulo; buckets sem leitura ficam null (lacuna no grafico) (telemetria-db.ts:282-334).

Implicitas / HIPOTESE:
- Cadencia dos workers vem da config, nao do codigo: `sync` (geracao) `sleep 21600` = 6h; `sync-telemetria` `sleep 600` = 10 min; loop `while true` com restart unless-stopped (docker-compose.yml:43-48, 86-91). HIPOTESE: em producao (VPS) a mesma cadencia se mantem — confirmar em docker-compose.prod.yml.
- HIPOTESE: janela de tolerancia de +/-15 min do header Date da Solis (comentario client.ts:103); nao ha revalidacao explicita de clock skew alem de reassinar a cada tentativa.
- HIPOTESE: o dado Solis "atualiza a cada ~5 min" (comentario que justifica CACHE_TTL de 5 min, client.ts:12) — nao verificado contra a doc oficial.

## Dependencias
- Depende de:
  - ascender-app/src/lib/crypto/secrets.ts (AES-256-GCM, `maskKey`) e `@/lib/env` (APP_ENCRYPTION_KEY).
  - ascender-app/src/lib/cache/ttlCache.ts (`getCached`/`setCached`).
  - ascender-app/src/lib/auth/guard.ts (`requireSession`).
  - ascender-app/src/lib/db (Drizzle/Postgres) e schema (`integration_credentials`, `telemetria_*`, `alarmes`, `sync_runs`, `medicoes_geracao`, `usinas`).
  - Node crypto (HMAC-SHA1/MD5/AES) e `fetch`.
  - API externa SolisCloud (`https://www.soliscloud.com:13333`, `/v1/api/*`).
  - docker-compose (servicos cron) e `scripts/deploy-poll.sh` (deploy por polling na VPS).
- Consumido por:
  - Front: src/lib/api/soliscloud.ts, src/hooks/useSolis.ts, src/components/GenerationChart.tsx, src/components/states.tsx.
  - Paginas: (dashboard)/soliscloud, /geracao, /integracoes, /executivo, /mapa, /usinas, /configuracoes/integracoes.
  - Modulos: src/lib/cadastros/queries.ts, src/lib/operacao/operational-overview.ts, src/lib/operacao/timeline.ts (leem telemetria/medicoes ja persistidas).

## Riscos de alteracao
- Mexer na `string-to-sign` ou no Content-Type (adicionar charset, reordenar campos, alterar `resourcePath`) quebra a assinatura -> 403 "wrong sign" em toda a integracao (sign.ts).
- Alterar MIN_INTERVAL_MS/MAX_RETRIES ou remover a fila global pode estourar o rate limit por conta (falha na 1a carga das telas que disparam varias chamadas juntas).
- A validacao do envelope depende de codes hardcoded (0/1/1000000); se a Solis mudar/adicionar codes de sucesso, respostas validas viram erro.
- `alarm_id` composto e fragil: mudanca no formato de `alarmBegTime`/`alarmCode`/`deviceSn` altera a chave e pode duplicar alarmes ou perder a correlacao de resolucao.
- Series append-only crescem indefinidamente (telemetria a cada 10 min): sem retencao/particao, `telemetria_*` incham; consultas dependem dos indices `*_capt_idx`.
- Conversao de unidade em `mapStationMonth/Year` NAO converte (energy/money ja em base) enquanto `mapStationDay` converte W->kW; trocar isso distorce graficos.
- `geracaoDiariaFrota` divide a meta mensal por 30 fixo (meses de 28-31 dias e usinas sem meta viram distorcao/`null`).
- A leitura AO VIVO em /api/soliscloud/stations/[id] e a unica que ainda bate na Solis por request — pode falhar/atrasar sob rate limit enquanto o resto le do banco.
- Trocar `APP_ENCRYPTION_KEY` invalida os segredos ja cifrados em `integration_credentials` (decrypt falha) — exige re-cadastro do KeySecret.
- `mapAlarmLevel` nunca retorna "alto" embora o tipo `AlarmLevel` inclua; filtros de UI por "alto" ficariam sempre vazios (types/soliscloud.ts vs mappers.ts).

## Pendencias / a investigar
- Confirmar a cadencia dos workers em producao (docker-compose.prod.yml nao foi lido nesta analise) e como `scripts/deploy-poll.sh` interage com os servicos de cron.
- Nao ha politica de retencao/limpeza das tabelas `telemetria_*` — investigar crescimento e necessidade de particionamento.
- `SOLIS_ERROR_MESSAGES` cobre apenas I0012 e R0000; demais codes caem no `msg` cru da Solis — mapear os mais comuns.
- Endpoints `stationDay`, `stationMonth`, `inverterDetail` estao declarados em `SOLIS_ENDPOINTS` mas nao aparecem em uso ativo (curvas hoje vem do banco) — confirmar se sao legado/mock.
- Inconsistencia `AlarmLevel` ("alto" no tipo, nunca gerado pelo mapper) — verificar se ha consumidor que espera "alto".
- Verificar se `importStationsFromSolis` e disparado por alguma rota/tela ou apenas manualmente (nao localizado gatilho nesta analise).

## Fontes
- ascender-app/src/lib/soliscloud/client.ts
- ascender-app/src/lib/soliscloud/sign.ts
- ascender-app/src/lib/soliscloud/credentials.ts
- ascender-app/src/lib/soliscloud/endpoints.ts
- ascender-app/src/lib/soliscloud/handler.ts
- ascender-app/src/lib/soliscloud/types.ts
- ascender-app/src/lib/soliscloud/mappers.ts
- ascender-app/src/lib/soliscloud/telemetria-sync.ts
- ascender-app/src/lib/soliscloud/telemetria-db.ts
- ascender-app/src/lib/cadastros/sync.ts
- ascender-app/src/lib/db/sync-telemetria.ts
- ascender-app/src/lib/db/sync-geracao.ts
- ascender-app/src/lib/db/sync-run.ts
- ascender-app/src/lib/api/soliscloud.ts
- ascender-app/src/types/soliscloud.ts
- ascender-app/src/lib/crypto/secrets.ts
- ascender-app/src/lib/db/schema.ts (integration_credentials, telemetria_*, alarmes, sync_runs, medicoes_geracao, usinas)
- ascender-app/src/app/api/soliscloud/* (todas as rotas de leitura)
- ascender-app/src/app/api/integrations/soliscloud/credentials/route.ts
- ascender-app/src/app/api/integrations/soliscloud/test/route.ts
- ascender-app/docker-compose.yml
