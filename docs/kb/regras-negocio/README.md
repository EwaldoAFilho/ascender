# Regras de negócio (por módulo)

> Compilado do discovery. `explicita` = no código; `implicita`/`hipotese` = inferida (confirmar).


## Arquitetura & App Shell — [`modulos/arquitetura.md`](../modulos/arquitetura.md)

- **[explicita]** Tema aplicado antes do primeiro paint via script inline no <head> (anti-flash): le localStorage['ascender-theme'], cai para prefers-color-scheme, senao 'light' — `ascender-app/src/app/layout.tsx:12`
- **[explicita]** ThemeProvider le o data-theme do <html>; se ausente assume 'dark' (diverge do fallback 'light' do script anti-flash) — `ascender-app/src/lib/theme.tsx:31`
- **[explicita]** Gate de sessao na borda: /login e /api/auth/login publicas; sem cookie ascender_session, /api/* retorna 401 e paginas redirecionam para /login?next=<pathname> — `ascender-app/src/middleware.ts:11`
- **[explicita]** Middleware valida apenas a PRESENCA do cookie, nao a assinatura/validade; validacao real e server-side via getSession/requireSession (defesa em profundidade) — `ascender-app/src/middleware.ts:15`
- **[explicita]** Cookie de sessao: httpOnly, sameSite lax, maxAge 8h, secure apenas quando APP_BASE_URL comeca com https:// — `ascender-app/src/lib/auth/session.ts:16`
- **[explicita]** SESSION_SECRET deve ter no minimo 32 caracteres, senao lanca erro em runtime — `ascender-app/src/lib/env.ts:18`
- **[explicita]** Env vars lidas de forma lazy (so em runtime) para nao quebrar o build quando um segredo esta ausente — `ascender-app/src/lib/env.ts:1`
- **[explicita]** O front nunca fala direto com APIs externas; assinatura/segredo ficam no servidor e o browser so chama route handlers internos (/api/*) — `ascender-app/src/lib/api/soliscloud.ts:13`
- **[explicita]** Cache TTL e singleton por processo (uma instancia); multiplas replicas exigem migrar para Redis; consumido apenas por soliscloud/client.ts — `ascender-app/src/lib/cache/ttlCache.ts:1`
- **[explicita]** withSolis exige sessao, retorna 409 NOT_CONFIGURED sem credenciais, 502 em SolisApiError e 500 em erro inesperado — `ascender-app/src/lib/soliscloud/handler.ts:11`
- **[explicita]** Assets em /brand (logos) sao servidos sem passar pelo gate (matcher exclui brand) para carregar na tela de login — `ascender-app/src/middleware.ts:31`
- **[explicita]** Pacotes nativos @node-rs/argon2, pg e pdf-parse sao server-only e nao empacotados pelo bundler — `ascender-app/next.config.mjs:5`
- **[hipotese]** Padrao de renderizacao: Server Component async + export const dynamic='force-dynamic' na maioria das paginas de dados, com 'use client' reservado a shell/providers e telas interativas; e convencao por arquivo, nao config global — `ascender-app/src/app/(dashboard)/page.tsx:19`

## Autenticacao & Autorizacao — [`modulos/auth-autorizacao.md`](../modulos/auth-autorizacao.md)

- **[explicita]** Sessao iron-session em cookie 'ascender_session' expira em 8 horas (maxAge 60*60*8), httpOnly, sameSite lax — `ascender-app/src/lib/auth/session.ts:24`
- **[explicita]** Cookie 'secure' somente quando APP_BASE_URL comeca com https:// — `ascender-app/src/lib/env.ts:31`
- **[explicita]** SESSION_SECRET deve ter ao menos 32 caracteres, senao lanca erro — `ascender-app/src/lib/env.ts:18`
- **[explicita]** Login so autentica usuario existente e ativo, senha verificada com argon2 — `ascender-app/src/lib/auth/users.ts:29`
- **[explicita]** E-mail normalizado (trim + lowercase) e unico; checado por emailEmUso antes de salvar — `ascender-app/src/lib/auth/users.ts:6`
- **[explicita]** Senha minima de 8 caracteres na criacao, edicao e troca — `ascender-app/src/lib/auth/actions.ts:65`
- **[explicita]** Troca de senha exige senha atual correta (verifyUserPassword) — `ascender-app/src/app/api/auth/password/route.ts:27`
- **[explicita]** Nao e possivel desativar nem excluir o proprio usuario — `ascender-app/src/lib/auth/actions.ts:51`
- **[explicita]** Deve haver ao menos um usuario ativo (bloqueia desativar/excluir o ultimo) — `ascender-app/src/lib/auth/actions.ts:56`
- **[explicita]** Seed cria admin 'Administrador' de LOGIN_EMAIL/LOGIN_PASSWORD apenas se nao houver nenhum usuario; nunca sobrescreve — `ascender-app/src/lib/db/seed.ts:21`
- **[implicita]** Ausencia de RBAC: qualquer sessao authenticated tem acesso total; campo roles declarado mas nunca populado — `ascender-app/src/lib/auth/session.ts:11 + schema.ts:55`
- **[implicita]** Middleware valida apenas presenca do cookie (cookies.has), nao a validade; validacao real e adiada para getSession/requireSession — `ascender-app/src/middleware.ts:15`
- **[explicita]** Redirect pos-login so aceita next que comece com '/' (evita open redirect) — `ascender-app/src/app/login/page.tsx:30`
- **[hipotese]** Hash argon2 usa parametros default da lib (@node-rs/argon2), sem config explicita — `ascender-app/src/lib/auth/users.ts:57`
- **[hipotese]** Nao ha rate limiting nem lockout de tentativas no login — `ascender-app/src/app/api/auth/login/route.ts`

## Cadastros (CRUD) — [`modulos/cadastros.md`](../modulos/cadastros.md)

- **[explicita]** Toda Server Action exige sessao autenticada (ensureAuth); rotas de anexo usam requireSession (401) — `actions.ts:33-37; lib/auth/guard.ts`
- **[explicita]** Apos salvar/excluir revalida /cadastros (layout); faturas revalidam /financeiro e propostas /propostas — `actions.ts:39-41,457,508`
- **[explicita]** Validacao Zod: optText vazio->null; latitude -90..90 e longitude -180..180 (optCoord) — `actions.ts:47-69,332-333`
- **[explicita]** Historico de alteracoes so e registrado para clientes (criou / editou_campo por campo alterado); demais entidades nao geram historico — `actions.ts:139-205`
- **[explicita]** Anexos aceitam somente entidade 'cliente' (hardcoded no route e nas actions); limite 25 MB; conteudo salvo em bytea — `anexo/route.ts:9,26,34-39; anexos.ts:39-51`
- **[implicita]** Exclusao depende das FKs do banco (UC/contrato com onDelete restrict); catch generico retorna mensagem fixa sem checar vinculo real — `actions.ts:246-259,293-308; schema.ts FKs`
- **[explicita]** Importar SolisCloud faz upsert por station_id_soliscloud; capacityStr iniciando por M trata como MW (x1000); marca origem=soliscloud — `sync.ts:51-68`
- **[explicita]** Conciliacao DG: clientes por documento (CPF->prosumidor); usinas nao sao criadas (so vinculadas por codigo ou nome exato); UC ativo = !numero.includes('CANCEL'); nada e alterado no DG — `digitalgrid/cadastros.ts:132-250`
- **[explicita]** syncGeracaoMensal faz backfill de geracao_esperada_kwh_mes com a media do historico apenas onde =0 (nao sobrescreve meta manual) — `sync.ts:147-154`
- **[hipotese]** Ausencia de anexos/historico para UC, usina, contrato e distribuidora e provavelmente decisao intencional (schema generico reaproveitavel) — `schema.ts:507-549`

## Dados & Banco (Drizzle/Postgres) — [`modulos/dados-e-banco.md`](../modulos/dados-e-banco.md)

- **[explicita]** FK onDelete restrict em unidades_consumidoras.cliente_id e contratos.cliente_id impede apagar cliente referenciado — `schema.ts:112,176`
- **[explicita]** contas_energia.fatura_dg_id e unique + onDelete cascade: relacao 1:1 com faturas_dg e apaga junto — `schema.ts:281-284`
- **[explicita]** medicoes_geracao (usina_id,competencia,fonte) e rateios_dg (generation_month_id,installation,owner_document) sao uniques compostos = chaves de idempotencia dos syncs — `schema.ts:245,346`
- **[explicita]** Seed do admin so roda se count(usuarios)==0; nao sobrescreve senhas; sem LOGIN_PASSWORD apenas avisa — `seed.ts:17-31`
- **[explicita]** env.databaseUrl() e required e falha em runtime, nao no build (leitura lazy do pool) — `env.ts:5-16, index.ts:13-21`
- **[explicita]** custo_total/margem/parametros_proposta.dados sao SENSIVEL: nunca expor ao cliente — `schema.ts:392,407`
- **[hipotese]** Colunas adicionadas depois sao nullable (sem default) para nao quebrar linhas antigas / permitir backfill — `schema.ts:379; migration 0017 DROP NOT NULL cliente_id`
- **[explicita]** Tabelas telemetria_* sao append-only (1 linha por leitura, estado atual via DISTINCT ON, sem limpeza) — `schema.ts:416-418`
- **[hipotese]** anexos e cadastro_historico sao polimorficos por (entidade, entidade_id) SEM FK: integridade nao garantida pelo banco — `schema.ts:509-549`
- **[explicita]** Migrations aplicadas no boot (db:migrate) e seed idempotente, antes de npm start, via entrypoint — `docker-entrypoint.sh:4-11`

## Financeiro & Faturas de Energia — [`modulos/financeiro-faturas.md`](../modulos/financeiro-faturas.md)

- **[explicita]** Extracao prefere IA (provedor ativo) e usa o parser regex como preenchimento das lacunas; sem IA ativa usa so regex (mergePreferIa/extrairConta) — `ascender-app/src/lib/financeiro/conta.ts:19-92`
- **[explicita]** Uma conta por fatura: contas_energia.fatura_dg_id e UNIQUE e persistConta faz onConflictDoUpdate, entao reenvio substitui a conta — `ascender-app/src/lib/financeiro/conta.ts:258-267 (schema.ts:279-284)`
- **[explicita]** Guarda de divergencia no upload individual: so sinaliza quando UC (so digitos) e/ou competencia existem nos dois lados e divergem; front pede confirmacao e force=true ignora — `ascender-app/src/lib/financeiro/conta.ts:163-189`
- **[explicita]** Conciliacao em lote casa PDF->fatura por UC-so-digitos + competencia; 0 match=sem_match, >1=ambiguo, fatura ja com conta=ja_tinha (nao sobrescreve) — `ascender-app/src/lib/financeiro/conta.ts:331-374`
- **[explicita]** Blindagem CNPJ/CPF no lote: se o PDF traz documento do titular divergente do esperado da UC (mapa getDocumentoPorInstalacao), retorna cnpj_divergente e nao anexa — `ascender-app/src/lib/financeiro/conta.ts:376-391`
- **[explicita]** Upload exige PDF (mime ou extensao), rejeita vazio, limite 15 MB por arquivo e 60 arquivos por lote — `ascender-app/src/app/api/financeiro/conta/route.ts:67-76; lote/route.ts:9-33`
- **[explicita]** KPIs: emAberto = totalFaturado - totalPago; taxaReceb = pago/faturado; semaforo Em aberto por taxa de recebimento (>=95 default, >=80 warn, senao bad) — `ascender-app/src/app/(dashboard)/financeiro/page.tsx:36-61`
- **[explicita]** Parser Neoenergia cobre 2 layouts SCEE (A beneficiario, B gerador/consorcio); valor = TOTAL A PAGAR; datas BR->ISO; numeros PT-BR normalizados — `ascender-app/src/lib/financeiro/parse-conta.ts:1-243`
- **[hipotese]** Nao ha reconciliacao financeira automatica em runtime entre o valor da conta e o valor_total/raw da fatura DG; conferencia de valores existe so no script offline reconciliar-fatura.ts — `ascender-app/src/lib/db/reconciliar-fatura.ts:6-9,85-105`
- **[implicita]** O cnpj/cpf do titular extraido nao e persistido em contas_energia; e usado apenas para a blindagem do lote — `ascender-app/src/lib/db/schema.ts:279-321; conta.ts:221-247`

## Infra & Deploy — [`modulos/infra-e-deploy.md`](../modulos/infra-e-deploy.md)

- **[explicita]** Boot do app aplica migrations (db:migrate) antes de servir e faz seed idempotente do admin, tolerando falha do seed sem bloquear o start — `ascender-app/docker-entrypoint.sh:5-11`
- **[explicita]** Workers de sync sao loops sh infinitos (cron caseiro) com cadencias: geracao 6h (21600s), faturas+rateio DG 15min (900s), telemetria 10min (600s) — `ascender-app/docker-compose.yml:43-91`
- **[explicita]** app e os 3 workers usam a mesma imagem (build: .); os workers sobrescrevem entrypoint: [] para nao herdar o migrate/seed e definem command proprio — `ascender-app/docker-compose.yml:32-91`
- **[explicita]** Workers toleram falha de cada ciclo (|| echo ...) e seguem no proximo; falta de credencial/token apenas pula o ciclo — `ascender-app/docker-compose.yml:46-89`
- **[implicita]** Sleeps iniciais escalonados (30/45/50s) para dar tempo do db subir e evitar disparo simultaneo dos workers — `ascender-app/docker-compose.yml:43,64,86`
- **[explicita]** Deploy por polling e fast-forward-only: se a VPS divergir do remoto o git pull --ff-only falha e o deploy aborta; so refaz build quando HEAD != origin/BRANCH — `scripts/deploy-poll.sh:43-52`
- **[explicita]** flock -n garante um deploy por vez e docker image prune -f limpa imagens orfas apos o rebuild — `scripts/deploy-poll.sh:30-34,56-57`
- **[explicita]** Em producao o app deixa de ser publicado (ports: !reset []) e so o Caddy publica 80/443, obtendo/renovando TLS Let's Encrypt e fazendo proxy para app:3000 — `ascender-app/docker-compose.prod.yml:16-33 e Caddyfile:6`
- **[explicita]** DATABASE_URL do banco do compose e forcado no environment de app e workers, independente do .env — `ascender-app/docker-compose.yml:26,40,61,83`
- **[explicita]** Cada execucao de worker e auditada em sync_runs (inicio/fim/status/itens/mensagem) via registrarSyncRun, alimentando a tela Integracoes — `ascender-app/src/lib/db/sync-run.ts:40-74`
- **[explicita]** Cookie de sessao usa Secure apenas quando APP_BASE_URL comeca com https:// (relevante ao subir atras do Caddy) — `ascender-app/src/lib/env.ts:31-32`
- **[hipotese]** GOTCHA: Docker Desktop pode resolver DNS so em IPv6 (AAAA), fazendo o Node no container falhar ao alcancar APIs IPv4 (SolisCloud/Digital Grid) com ENETUNREACH/EAI_AGAIN; mitigacao NODE_OPTIONS=--dns-result-order=ipv4first ou rodar em Linux/VPS — nao tratado no codigo — `gotcha ambiental (nao evidenciado no repo)`

## Integracao Digital Grid — [`modulos/integracao-digital-grid.md`](../modulos/integracao-digital-grid.md)

- **[explicita]** Integracao somente leitura no DG: dgGet so faz GET; toda escrita e no banco local — `ascender-app/src/lib/digitalgrid/client.ts:13-54`
- **[explicita]** Retry do cliente: 2 tentativas extras, backoff linear 0,8s×tentativa; 429/5xx transitorios, 401/403/404 definitivos — `ascender-app/src/lib/digitalgrid/client.ts:34-53`
- **[explicita]** Teste de conexao tenta Bearer depois Token em GET /agents/ e grava o esquema que funcionou em key_id — `ascender-app/src/lib/digitalgrid/client.ts:68-127`
- **[explicita]** Faturas: upsert por dg_bill_id sobrescrevendo todos os campos e raw a cada sync — `ascender-app/src/lib/digitalgrid/sync.ts:87-107`
- **[explicita]** Rateio: upsert por chave composta (generation_month_id, installation, owner_document) com dedup no lote mantendo a ultima ocorrencia; descarta generation_month_id<=0 — `ascender-app/src/lib/digitalgrid/sync.ts:183-218`
- **[explicita]** Rateio resolve competencia via monthly-generation.reference e usina_nome via generators.nickname — `ascender-app/src/lib/digitalgrid/sync.ts:230-254`
- **[explicita]** Paginacao com trava de seguranca page>100 em todos os loops — `ascender-app/src/lib/digitalgrid/sync.ts:113,224`
- **[explicita]** Cron sync-dg roda db:sync-faturas-dg + db:sync-rateio-dg a cada 900s (15 min) — `ascender-app/docker-compose.yml:53-71`
- **[explicita]** Health score: fatura vencida = vencimento<hoje (America/Sao_Paulo) E valor_pago<valor_total — `ascender-app/src/lib/digitalgrid/queries.ts:106-116`
- **[explicita]** Conciliacao NAO cria usinas; so vincula codigo_digital_grid quando o nome normalizado bate exatamente, resto e vinculo manual — `ascender-app/src/lib/digitalgrid/cadastros.ts:169-187`
- **[explicita]** Distribuidora da UC vinculada por match difuso de nome (includes nos dois sentidos), sem criar novas — `ascender-app/src/lib/digitalgrid/cadastros.ts:190-197`
- **[explicita]** Mapa UC->cliente/documento: rateio (owner_name/owner_document) e fallback; cadastro local sobrescreve — `ascender-app/src/lib/digitalgrid/queries.ts:42-48,74-83`
- **[hipotese]** document_type=='CPF' mapeia cliente para tipo prosumidor, senao cliente — `ascender-app/src/lib/digitalgrid/cadastros.ts:145`
- **[hipotese]** UC considerada ativa quando o codigo NAO contem a substring CANCEL — `ascender-app/src/lib/digitalgrid/cadastros.ts:243`
- **[hipotese]** UC sem cliente por documento cria cliente a partir da instalacao (nickname/owner) com tipo cliente — `ascender-app/src/lib/digitalgrid/cadastros.ts:216-233`
- **[hipotese]** payment_status persistido como texto livre do DG sem enum/normalizacao — `ascender-app/src/lib/db/schema.ts:262`

## Integracao SolisCloud — [`modulos/integracao-soliscloud.md`](../modulos/integracao-soliscloud.md)

- **[explicita]** Content-Type da assinatura e 'application/json' SEM charset; incluir ;charset=UTF-8 causa HTTP 403 'wrong sign' — `src/lib/soliscloud/sign.ts:5-6,28-31`
- **[explicita]** string-to-sign = POST\n{Content-MD5}\n{Content-Type}\n{Date}\n{resourcePath}; sign=base64(HmacSHA1(keySecret,...)); Authorization: API {keyId}:{sign} — `src/lib/soliscloud/sign.ts:17-38`
- **[explicita]** Resposta OK se success===true OU code in {0,1,1000000}; senao vira SolisApiError sem retry (erro logico) — `src/lib/soliscloud/client.ts:139-151`
- **[explicita]** Retry so em falhas transitorias (rede, 429/500/502/503/504), ate MAX_RETRIES=2, backoff linear 0,8s x tentativa — `src/lib/soliscloud/client.ts:46-54,99-130`
- **[explicita]** Rate limit e por CONTA: fila global reserveSlot com MIN_INTERVAL_MS=600ms (~1,6 req/s) compartilhada entre chamadas concorrentes — `src/lib/soliscloud/client.ts:13-16,32-44`
- **[explicita]** Cache TTL 5 min por (resourcePath+body); workers usam {cache:false} para dado fresco — `src/lib/soliscloud/client.ts:12; src/lib/soliscloud/telemetria-sync.ts:34`
- **[explicita]** Estado dispositivo: 1=online, 3=alarm, outro=offline; nivel alarme >=3 critico/==2 medio/senao baixo; status 2=resolvido/1=em-tratativa/senao aberto — `src/lib/soliscloud/mappers.ts:46-65`
- **[explicita]** Chave de dedup de alarme = id real; se id -1/0/vazio usa chave composta estacao|deviceSn|alarmCode|alarmBegTime. Series append-only; alarmes upsert por alarm_id com resolvido_em quando status=resolvido — `src/lib/soliscloud/telemetria-sync.ts:133-185`
- **[explicita]** Meta diaria da frota = soma(geracao_esperada_kwh_mes)/30; realizado diario por estacao = pico (max) de energia_dia_kwh do dia somado entre estacoes — `src/lib/soliscloud/telemetria-db.ts:176-199`
- **[explicita]** syncGeracaoMensal: upsert por (usina,competencia,fonte) e preenche geracao_esperada_kwh_mes com media do historico apenas onde ainda e 0 (nao sobrescreve meta manual) — `src/lib/cadastros/sync.ts:96-154`
- **[explicita]** importStationsFromSolis: potencia em MWp quando capacityStr comeca com 'M' (*1000); atualiza so nome/potencia/origem, nao toca campos manuais — `src/lib/cadastros/sync.ts:31-84`
- **[explicita]** Rotas exigem sessao (requireSession); withSolis responde 409 NOT_CONFIGURED sem credencial, 502 em SolisApiError, 500 no resto — `src/lib/soliscloud/handler.ts:11-44`
- **[explicita]** Cadencia dos workers vem do docker-compose (config, nao codigo): geracao sleep 21600 (6h), telemetria sleep 600 (10 min), loop while true — `docker-compose.yml:43-48,86-91`
- **[hipotese]** Janela de tolerancia de +/-15 min do header Date da Solis (reassina a cada tentativa); nao verificado contra doc oficial — `src/lib/soliscloud/client.ts:103`
- **[hipotese]** Cadencia de producao presumida igual (docker-compose.prod.yml nao lido nesta analise) — `docker-compose.prod.yml`

## Integracoes (config) & IA — [`modulos/integracoes-config-e-ai.md`](../modulos/integracoes-config-e-ai.md)

- **[explicita]** Segredos cifrados com AES-256-GCM no formato base64(iv):base64(tag):base64(ciphertext); chave mestra vem de APP_ENCRYPTION_KEY (32 bytes base64 direto ou derivada via SHA-256). — `ascender-app/src/lib/crypto/secrets.ts:12-35`
- **[explicita]** Respostas de status nunca retornam o segredo: SolisCloud devolve keyIdMasked, DG/IA devolvem apenas metadados/flags. — `ascender-app/src/app/api/integrations/soliscloud/credentials/route.ts:16-27; ai/credentials/route.ts:9-16`
- **[explicita]** Salvar sem novo segredo preserva o key_secret_enc existente; primeira configuracao exige o segredo. — `ascender-app/src/lib/ai/credentials.ts:118-124; soliscloud/credentials/route.ts:51-62`
- **[explicita]** IA permite no maximo um provedor ativo: makeActive=true zera is_active dos demais ai_* (escopo restrito a AI_ROW_KEYS, sem afetar Solis/DG). — `ascender-app/src/lib/ai/credentials.ts:146-154`
- **[explicita]** normalizeAiModel forca o modelo para a lista permitida do provedor, caindo no defaultModel se invalido. — `ascender-app/src/lib/ai/providers.ts:52-57`
- **[explicita]** Teste de IA usa GET {baseUrl}/v1/models (Anthropic x-api-key + anthropic-version; OpenAI Authorization Bearer); resultado so persistido ao testar a chave salva. — `ascender-app/src/lib/ai/test.ts:21-24; ai/test/route.ts:37-39`
- **[explicita]** parseContaComIA retorna null sem provedor ativo; com provedor, chama Anthropic /v1/messages ou OpenAI /v1/responses com JSON schema CONTA_SCHEMA e timeout 60s; regex e a rede de seguranca. — `ascender-app/src/lib/ai/extract.ts:115,138-251,353-358; financeiro/conta.ts:55-91`
- **[explicita]** getSolisCredentials e getDgCredential so retornam a credencial se is_active for true. — `ascender-app/src/lib/soliscloud/credentials.ts:20; digitalgrid/credentials.ts:27`
- **[hipotese]** Autorizacao e binaria: qualquer sessao autenticada (requireSession) pode ler/salvar/testar credenciais; nao ha checagem de papel/permissao. — `rotas em ascender-app/src/app/api/integrations/*`
- **[hipotese]** app_settings destinada a login_email/login_password_hash conforme comentario, mas sem consumidor em src/ (possivel seed/migracao ou legado). — `ascender-app/src/lib/db/schema.ts:47`

## Operacao & Dashboards — [`modulos/operacao-e-dashboards.md`](../modulos/operacao-e-dashboards.md)

- **[explicita]** Health Score = clamp(100 - penalidades) com pesos W_OFFLINE=45, W_ALARM=20, W_COLLECTORS=20, W_STALE=15, W_INVOICES=10 — `ascender-app/src/lib/operacao/health-score.ts:48-133`
- **[explicita]** Faixas de status do Health Score: >=85 healthy, >=60 attention, senao critical — `ascender-app/src/lib/operacao/health-score.ts:137`
- **[explicita]** Regras de protecao: de dia offline>0 rebaixa healthy->attention; alarme rebaixa healthy->attention (nao vira critico sozinho); offline/total>=0.3 -> critical; ultima comm>60min rebaixa healthy->attention — `ascender-app/src/lib/operacao/health-score.ts:141-154`
- **[explicita]** Penalidade de atraso: 0 ate 30min, maxima a partir de 180min, linear no intervalo — `ascender-app/src/lib/operacao/health-score.ts:54-68`
- **[explicita]** noData=true (nota nao significativa, exibe '-') quando totalPlants<=0 e sem ultima comunicacao — `ascender-app/src/lib/operacao/health-score.ts:96-112`
- **[explicita]** Janela solar aproximada 06-18h America/Sao_Paulo; a noite usina offline = ausencia de geracao esperada (nao penaliza nem gera incidente critico); coletor/alarme seguem valendo — `ascender-app/src/lib/operacao/operational-overview.ts:12-57`
- **[explicita]** Incidentes: de dia cada offline e critico; a noite agrega num unico item informativo; alarme e coletor offline=warning; telemetria >30min info, >60min warning; ordenacao critical/warning/info — `ascender-app/src/lib/operacao/incidents.ts:64-161`
- **[explicita]** Fatura vencida = vencimento < hoje (SP) e valorPago < valorTotal — `ascender-app/src/lib/digitalgrid/queries.ts:106-116`
- **[explicita]** Aderencia = realizado/meta*100, com meta proporcional aos dias decorridos (geracaoEsperadaKwhMes * min(dia/diasNoMes,1)); tone >=85 ok, >=70 warn, senao bad; na meta = aderencia>=100% — `ascender-app/src/lib/cadastros/queries.ts:387-407`
- **[explicita]** Geracao diaria da frota: meta diaria = soma(geracao_esperada_kwh_mes)/30; realizado = max(energia_dia_kwh) por estacao/dia somado entre estacoes (fuso SP) — `ascender-app/src/lib/soliscloud/telemetria-db.ts:176-211`
- **[explicita]** Heatmap limitado ao ano corrente; celula sem registro = null (sem dado, nao zero); intensidade de cor 12%-100% relativa ao maximo; mes atual marcado (parcial) — `ascender-app/src/lib/cadastros/queries.ts:196-225`
- **[explicita]** Mapa: apenas usinas com latitude E longitude; cor do pino por statusReal (online/alarm/offline/sem telemetria); projecao equiretangular sobre bbox do Brasil com contorno embutido — `ascender-app/src/app/(dashboard)/mapa/page.tsx:19-35`
- **[explicita]** Uptime coletores 24h = online/total dos snapshots; verde >=95%, vermelho <80% — `ascender-app/src/lib/soliscloud/telemetria-db.ts:348-374`
- **[explicita]** Estado atual de cada entidade = registro mais recente por capturado_em (selectDistinctOn); telas leem do banco, nao da API SolisCloud ao vivo — `ascender-app/src/lib/soliscloud/telemetria-db.ts:22-135`
- **[hipotese]** SolisCloud page reconstroi incidentes no cliente replicando a logica solar 06-18h, porem com hrefs diferentes e sem itens de telemetria atrasada/faturas - risco de divergencia com incidents.ts — `ascender-app/src/app/(dashboard)/soliscloud/page.tsx:124-189`

## Propostas & Gerador FV — [`modulos/propostas-gerador.md`](../modulos/propostas-gerador.md)

- **[explicita]** Dimensionamento por consumo: modulos = ceil(consumoKwh * compensacaoPct * 1000 / moduloWp / (hsp*PR*30*margemSeguranca)); geracao/kWp/mes = hsp*PR*30 — `dimensionamento.ts:15,31`
- **[explicita]** Empacotamento do telhado escolhe max(retrato,paisagem) e aplica fator de aproveitamento floor(bruto*f/100) — `dimensionamento.ts:45-49`
- **[explicita]** 3+ telhados validos forcam microinversor; senao respeita forcado ou usa string por padrao — `dimensionamento.ts:81-88`
- **[explicita]** Faixa de kit = primeira cujo kwpMax cobre o kWp; acima da ultima usa a ultima. Preco/kWp = base(micro|string)+ajuste, menos soloDescontoKitKwp se solo — `precificacao.ts:10-28`
- **[explicita]** Imposto incide sobre maoDeObra+materiaisAc+adequacao+estruturaSolo (NAO sobre o kit); precoFinal = custoTotal*(1+margem/100); materiaisAc = max(materialAcMin, kwp*materialAcKwp) — `precificacao.ts:47-58`
- **[explicita]** Margem distinta por cenario: margemPercent (Necessario) vs margemPercentRentavel (Rentavel) — `calcular.ts:143,185`
- **[explicita]** Fio B (Lei 14.300): fracao por ano a partir de anoBaseFioB (2023, 15/30/45/60/75/90/100%); antes=0, apos o fim mantem 100%. Credito unitario liquido = max(0, creditoExcedenteBaseKwh - tarifaFioB*fracao). tarifaFioB=0 (default) nao reduz nada — `calcular.ts:33-45; constantes.ts:18-19`
- **[explicita]** Economia/receita separa autoconsumo (min(geracao,consumo)) a tarifa cheia e excedente (max(0,geracao-consumo)) ao credito unitario liquido do Fio B — `calcular.ts:120-126,149-155,190-201`
- **[explicita]** Payback: Necessario usa payback simples; Rentavel usa payback por fluxo (cruzamento acumulado x investimento interpolado). TIR por bissecao 60 iter sobre 25 anos. Fluxo aplica reajuste (1+r)^(t-1) e degradacao (1-d)^(t-1) — `calcular.ts:81-83,129-130; financeiro.ts:10-52`
- **[explicita]** Cliente livre: match case-insensitive por lower(nome); se casar vincula clienteId, senao grava clienteNomeLivre e clienteId nulo — `actions.ts:88-94`
- **[explicita]** carregarParametros nunca lanca (falha -> PARAMETROS_PADRAO) e faz merge profundo de premissas/kit; salvarParametros ordena kit por kwpMax antes de salvar — `parametros.ts:66-88; actions.ts:184-187`
- **[explicita]** PDF e bundle client-safe: PdfCenario/PdfProposta nao contem custo/margem/kit; custo so existe no servidor e no snapshot dadosGerador (uso interno) — `pdf.ts:6-34; types.ts:92-106,129`
- **[explicita]** Infinity convertido para null antes de gravar KPIs no banco (finito()) — `actions.ts:54-56,114-122`
- **[hipotese]** FMES (fatores sazonais mensais) e HSP por regiao sao valores fixos herdados do gerador antigo, nao configuraveis nem por lookup real de cidade/coordenada — `constantes.ts:28,35-45`
- **[hipotese]** Campo padrao (mono/bi/tri) e capturado e salvo no snapshot mas nao afeta o calculo nem a adequacao trifasica — `GeradorProposta.tsx:72; actions.ts:124`
- **[hipotese]** tarifaAscender e sempre gravada como 0 pela gerarProposta; a economia da lista /propostas usa modelo de simulacao manual separado do gerador — `actions.ts:107; propostas/page.tsx:36-37`
- **[hipotese]** Banner 'acima de 14 kWp' e cronograma Fio B na UI sao textos fixos que podem divergir dos parametros configurados — `GeradorProposta.tsx:569; ParametrosForm.tsx:175`

## Rateio &amp; Auditoria — [`modulos/rateio-e-auditoria.md`](../modulos/rateio-e-auditoria.md)

- **[explicita]** UC ativa sem cota na competencia recente gera achado 'uc_sem_rateio' (severidade alta); exclui geradoras/consorcio (match por generator_number ou regex consorcio/ases no nome) — `src/lib/auditoria/rules.ts:166`
- **[hipotese]** Impacto de uc_sem_rateio = consumoMedioKwh * tarifaRef * 0.15 — o fator 0.15 (~15% de margem) e constante embutida sem origem documentada — `src/lib/auditoria/rules.ts:193`
- **[explicita]** Credito acumulado > fatorCreditoExcessivo (3) x consumo mensal gera 'consumo_credito_incompativel'; dedup por titular quando 2+ UCs do mesmo owner_document tem credito em lockstep (<5% diferenca), contando o saldo 1x — `src/lib/auditoria/rules.ts:273`
- **[explicita]** Impacto do credito excessivo = excedente que expira alem de mesesExpiracaoScee (60 meses, expiracao SCEE ANEEL) x tarifaRef; UC -CANCEL vira severidade info (encerramento) — `src/lib/auditoria/rules.ts:236`
- **[explicita]** Fatura sem UC cadastrada gera 'fatura_sem_uc' (media); mesma UC+competencia com >1 fatura gera 'fatura_duplicada' (critica), impacto = soma das faturas excedentes — `src/lib/auditoria/rules.ts:379`
- **[implicita]** Competencia incorreta quando fatura sem competencia ou vencimento com lag < 0 ou > 2 meses da competencia (vencimento cai no mes da competencia ou ate 2 meses depois) — `src/lib/auditoria/rules.ts:442`
- **[explicita]** Credito parado: saldo nao-decrescente por minCompetenciasTendencia (3) competencias e saldo final > 2x consumo medio => achado alta; impacto = saldo x tarifaRef — `src/lib/auditoria/rules.ts:485`
- **[explicita]** Desconto abaixo do contratado (FIN-1): base energia = total_sem_desconto - total_distribuidor (retira residuo nao-descontavel: fio B, taxas, iluminacao — Lei 14.300); alerta quando economia/baseEnergia*100 < agent_discount - tolDescontoPct(2); pula encerramento agent_discount>=99% — `src/lib/auditoria/rules.ts:335`
- **[explicita]** Regras desativadas apos inspecao dos dados reais: soma_percentual (percentage nao particiona 100% por gerador), rateio_duplicado (multi-gerador por UC e normal na geracao compartilhada), diag uc_subalocada (covering e indice 0-3, nao kWh) — `src/lib/auditoria/rules.ts:583`
- **[explicita]** Escala do campo percentual inferida por heuristica: max<=1.5 => fracao 0-1 (fator 100); max<=100.5 => 0-100 (fator 1); senao indefinida — `src/lib/auditoria/rules.ts:38`
- **[explicita]** Sync do rateio faz upsert por chave composta generation_month_id + installation + owner_document; competencia derivada de monthly-generation.reference; usinaNome do nickname do gerador — `src/lib/digitalgrid/sync.ts:127`
- **[explicita]** Conciliacao: clientes casam por documento (so digitos), usinas por codigo_digital_grid com fallback por nome, UCs por codigo_instalacao; nao duplica; UC recebe ativo = !numero.includes('CANCEL'); usinas nao sao criadas automaticamente (vinculo manual) — `src/lib/digitalgrid/cadastros.ts:112`
- **[explicita]** Auditoria e Fase 1: SOMENTE LEITURA, nada gravado no banco; relatorio montado em memoria e impresso por CLI — `src/lib/auditoria/run.ts:1`
