# Riscos de alteração (por módulo)

> Extraído do discovery inicial (2026-07-08). Ver o doc do módulo para contexto.


## Arquitetura & App Shell — [`modulos/arquitetura.md`](../modulos/arquitetura.md)

- SESSION_COOKIE 'ascender_session' esta duplicado como literal em middleware.ts:5 e session.ts:14; renomear em um so lugar quebra a autenticacao silenciosamente
- Middleware so checa presenca do cookie: confiar apenas nele (sem requireSession/getSession) deixa a rota vulneravel a cookie forjado/expirado ainda presente
- ttlCache e memoria de processo unico: multiplas replicas geram cache inconsistente e leituras desatualizadas da SolisCloud (escalar exige Redis)
- Divergencia de default de tema entre script anti-flash ('light') e ThemeProvider ('dark') pode reintroduzir flash/mismatch
- Remover 'use client' de providers.tsx ou (dashboard)/layout.tsx quebra hooks (useState, usePathname, useTheme)
- serverExternalPackages precisa ser atualizado ao adicionar novas dependencias nativas server-only, senao o build quebra
- env getters sao lazy e lancam em runtime: segredo ausente so falha ao exercer a rota (nao no build), mascarando misconfig ate producao
- Alterar o matcher do middleware pode expor rotas privadas ou bloquear assets (/brand, _next)

## Autenticacao & Autorizacao — [`modulos/auth-autorizacao.md`](../modulos/auth-autorizacao.md)

- SESSION_COOKIE duplicado como literal em middleware.ts:5 e session.ts:14 (para nao arrastar iron-session ao bundle Edge) — renomear em um lugar sem o outro quebra todo o gating
- Middleware so checa presenca do cookie: paginas que renderizem dados sem chamar requireSession confiam em cookie potencialmente invalido
- Trocar SESSION_SECRET invalida todas as sessoes; mudar algoritmo/parametros argon2 invalida senhas ja gravadas
- Regras 'ultimo usuario ativo' e 'nao mexer em si mesmo' vivem so na server action actions.ts — qualquer outro caminho de escrita em usuarios as ignora
- ensureAuth duplicado em auth/actions.ts:17 e cadastros/actions.ts:33 — risco de divergencia
- Campo roles sugere RBAC mas nao ha enforcement; introduzir permissoes exige tocar login, guard e todas as rotas
- cookieSecure atrelado ao prefixo https:// de APP_BASE_URL — config errada em producao deixa cookie sem Secure

## Cadastros (CRUD) — [`modulos/cadastros.md`](../modulos/cadastros.md)

- catch generico nas actions mascara a causa real e devolve mensagens fixas (pode enganar o usuario)
- Contradicao: painel e docstring dizem que potencia nao e sobrescrita, mas importStationsFromSolis seta potenciaKwp e nome a cada sync (apaga edicao manual)
- Anexos/historico genericos no schema, porem hardcoded para 'cliente' em varios pontos (estender exige mexer em multiplos arquivos)
- Anexos em bytea ate 25 MB no Postgres: risco de inchaco do banco e payloads grandes em Server Actions
- CrudSection carrega todas as linhas sem paginacao/busca server-side
- Conciliacao DG usa normName e match por inclusao de substring (distribuidora) - fragil a variacoes de nome
- Faturas e propostas tem actions dentro de cadastros/actions.ts mas pertencem a outros modulos
- getFichaCliente retorna vazio silenciosamente quando nao autenticado (mascara sessao expirada)

## Dados & Banco (Drizzle/Postgres) — [`modulos/dados-e-banco.md`](../modulos/dados-e-banco.md)

- Editar schema.ts sem db:generate deixa codigo e banco divergentes; migration so aplica no boot
- Adicionar coluna notNull sem default a tabela populada faz db:migrate falhar no entrypoint e o container nao sobe
- Trocar onDelete restrict<->cascade muda silenciosamente exclusoes (cascade pode apagar em massa)
- Tabelas telemetria_* append-only sem retencao: crescimento indefinido do volume ascender_pgdata
- Alterar uniques compostos de medicoes_geracao/rateios_dg quebra idempotencia dos syncs (duplicatas)
- getDb() cacheia pool em globalThis: mudar DATABASE_URL em runtime nao reconecta
- parametros_proposta como linha unica sem constraint: codigo quebra com 0 ou >1 linhas
- bytea/base64 (anexos.conteudo, contas_energia.arquivo_base64) incham banco e backups
- drizzle.config.ts tem URL fallback localhost: risco de migrar banco errado se DATABASE_URL faltar

## Financeiro & Faturas de Energia — [`modulos/financeiro-faturas.md`](../modulos/financeiro-faturas.md)

- Regex do parser e especifico de 2 layouts Neoenergia; mudanca de layout da distribuidora quebra a extracao por regex (IA cobre so se houver provedor ativo)
- fatura_dg_id UNIQUE + onConflictDoUpdate assume 1 conta por fatura; permitir varias exige mudar schema, upsert e queries de conciliacao/getFaturaIdsComConta
- Match do lote depende de UC e competencia consistentes nos dois lados; mexer na normalizacao (regexp_replace) gera falsos ambiguo/sem_match
- PDF em base64 na coluna arquivo_base64: SELECT * de contas_energia trafega o PDF inteiro; camposPublicos/getContaFile foram separados de proposito para nao vazar o base64
- Contrato do JSON Schema da IA (extract.ts) precisa bater com ContaParsed; alterar ContaParsed sem atualizar schema/toContaParsed desalinha a extracao por IA
- KPIs derivam de valor_total/valor_pago/economia do sync DG; mudanca de semantica no sync altera KPIs e semaforo sem aviso
- Blindagem CNPJ so protege UCs com documento cadastrado em rateios_dg/clientes; UC sem documento anexa sem conferir

## Infra & Deploy — [`modulos/infra-e-deploy.md`](../modulos/infra-e-deploy.md)

- Migrations rodam em todo boot do app; escalar para >1 replica do app pode causar corrida no db:migrate (hoje ha 1 instancia)
- devDependencies (drizzle-kit, tsx, typescript) precisam ficar na imagem para migrate/seed/workers em runtime; um npm ci --omit=dev ou multi-stage otimizado quebraria o entrypoint e os workers
- Remover entrypoint: [] dos workers faria cada um tentar rodar migrate/seed do app
- Trocar porta/dominio exige coerencia entre APP_PORT (compose), Caddyfile (dominio) e APP_BASE_URL (.env, controla cookie Secure)
- Deploy fast-forward-only: qualquer commit local na VPS trava todos os deploys ate resolucao manual
- Reduzir demais os sleeps dos workers pode hammerar SolisCloud/Digital Grid
- Sem backup automatizado do volume ascender_pgdata: perda do volume = perda de dados
- Sem healthcheck do app nem dos workers (so do db); worker vivo-mas-travado nao e detectado alem do sync_runs
- docker image prune -f roda no host e pode remover imagens sem uso de outros projetos em host compartilhado

## Integracao Digital Grid — [`modulos/integracao-digital-grid.md`](../modulos/integracao-digital-grid.md)

- Cadencia divergente na UI: /integracoes rotula faturas_dg/rateio_dg como (6h) mas o cron real e 15 min (integracoes/page.tsx:112-113 vs docker-compose.yml:70)
- Trava page>100 trunca dados silenciosamente se o DG tiver mais de 100 paginas
- Upsert sobrescreve todos os campos e raw a cada ciclo; ajustes manuais nas tabelas espelho sao perdidos
- Sem logica de exclusao: faturas/rateios removidos na origem viram registros orfaos no banco (HIPOTESE)
- Chave do rateio depende de generation_month_id codificar o mes; risco de colisao se o DG reusar ids
- Regras !numero.includes('CANCEL') e match difuso de distribuidora sao fragies a mudanca de nomenclatura no DG
- Token novo salvo sempre entra como Bearer; esquema Token so e ajustado apos teste de conexao
- Descriptografia depende de APP_ENCRYPTION_KEY estavel; rotacao de chave invalida credenciais salvas

## Integracao SolisCloud — [`modulos/integracao-soliscloud.md`](../modulos/integracao-soliscloud.md)

- Alterar string-to-sign/Content-Type (charset, ordem, resourcePath) quebra a assinatura -> HTTP 403 wrong sign em toda a integracao
- Mexer em MIN_INTERVAL_MS/MAX_RETRIES ou remover a fila global estoura o rate limit por conta na 1a carga das telas
- Validacao do envelope usa codes hardcoded (0/1/1000000); novos codes de sucesso da Solis viram erro
- alarm_id composto e fragil: mudanca no formato de alarmBegTime/alarmCode/deviceSn duplica alarmes ou perde correlacao de resolucao
- Series append-only (telemetria a cada 10 min) crescem sem retencao/particao; tabelas telemetria_* incham
- mapStationMonth/Year nao converte unidade (base) mas mapStationDay converte W->kW; alterar distorce graficos
- geracaoDiariaFrota divide meta mensal por 30 fixo; meses de 28-31 dias e usinas sem meta distorcem/null
- /api/soliscloud/stations/[id] e a unica leitura ao vivo por request; pode falhar/atrasar sob rate limit
- Trocar APP_ENCRYPTION_KEY invalida segredos cifrados em integration_credentials (decrypt falha) e exige re-cadastro
- mapAlarmLevel nunca retorna 'alto' embora o tipo AlarmLevel inclua; filtros de UI por 'alto' ficam vazios

## Integracoes (config) & IA — [`modulos/integracoes-config-e-ai.md`](../modulos/integracoes-config-e-ai.md)

- Trocar ou perder APP_ENCRYPTION_KEY torna todos os key_secret_enc indecifraveis (sem rotacao/versionamento de chave no codigo).
- Heuristica ambigua da chave: APP_ENCRYPTION_KEY que decodifica em 32 bytes base64 e usado direto (nao passa por SHA-256); mudar isso quebra a decifragem do que ja foi salvo.
- Tabela integration_credentials e compartilhada por Solis/DG/IA com semantica diferente de key_id/is_active/base_url por provedor; mexer nisso pode ativar/desativar a integracao errada.
- Novo provider de IA sem inclusao em AI_PROVIDER_LIST/aiRowKey nao sera desativado no reset de is_active.
- parseContaComIA depende do formato cru de resposta das APIs Anthropic/OpenAI e do suporte a JSON schema; mudanca de contrato quebra a extracao (cai para regex).
- CONTA_SCHEMA e toContaParsed estao acoplados: adicionar campo exige atualizar required e a normalizacao juntos.

## Operacao & Dashboards — [`modulos/operacao-e-dashboards.md`](../modulos/operacao-e-dashboards.md)

- Logica solar/incidentes duplicada entre servidor (incidents.ts) e cliente (soliscloud/page.tsx) pode divergir em comportamento e href
- Pesos e limiares do Health Score sao constantes magicas acopladas ao doc PLANO_FASE_2A; alterar quebra a calibracao de status/rotulo
- Duas convencoes de meta diaria coexistem: metaMensal/30 (geracaoDiariaFrota) vs proporcional aos dias reais (getUsinasComTelemetria)
- Heatmap e geracaoPorUsinaMes filtram por ano corrente; na virada de ano as colunas zeram
- Mapa usa projecao equiretangular e contorno simplificado; mexer no bbox/project() desalinha pinos e contorno
- Janela solar fixa 06-18h ignora estacao/localizacao real
- Se o worker sync-telemetria parar, dashboards mostram dados velhos sem erro (so o selo de frescor denuncia)
- contarFaturasVencidasDg tem catch(()=>0): falha nao derruba overview mas mascara o numero de vencidas

## Propostas & Gerador FV — [`modulos/propostas-gerador.md`](../modulos/propostas-gerador.md)

- Importar precificacao.ts/parametros.ts/calcular.ts (server-only) de componente 'use client' vazaria custo/margem/kit para o bundle; passar CenarioResultado.custo ao pdf.ts (client) vazaria dados sensiveis
- Kit gravado fora de ordem por kwpMax (fora de salvarParametrosProposta) faz faixaKit retornar a faixa errada
- Base do imposto exclui o kit (precificacao.ts:52); mudar isso altera o preco de todas as propostas silenciosamente
- carregarParametros engole erros e cai em PARAMETROS_PADRAO: falha de DB gera proposta com precos padrao sem alertar
- Campos doublePrecision aceitam Infinity; novos KPIs financeiros precisam passar por finito()
- Snapshot dadosGerador (jsonb) inclui custo/margem completos; expor a proposta bruta vazaria dados sensiveis
- Payback simples do Necessario ignora reajuste/degradacao/Fio B; migrar para fluxo mudaria KPIs historicos
- moduloWp coagido para 620/700; novos modulos exigem atualizar MODS, tipo ModuloWp e o coercion
- Textos fixos na UI (14 kWp, cronograma) podem divergir dos parametros configuraveis

## Rateio &amp; Auditoria — [`modulos/rateio-e-auditoria.md`](../modulos/rateio-e-auditoria.md)

- Auditoria depende da semantica do raw do DG (agent_discount, total_amount_without_discount, total_amount_distributor); mudanca de nome/escala quebra silenciosamente (campo vira null e regra e pulada)
- Constantes embutidas fragil: fator 0.15 do impacto uc_sem_rateio, limiar lockstep 5%, '>2x consumo' do credito parado, agent_discount>=99% como encerramento
- Reativar regras desativadas (soma_percentual, rateio_duplicado, diag uc_subalocada) sem reinterpretar percentage/covering gera enxurrada de falsos positivos
- Escala do percentual e inferida por heuristica; dados atipicos caem em 'indefinida' e desvirtuam regras que dependem de percentual
- Conciliacao (importarCadastrosDg) escreve no banco local e cria clientes/UCs; alterar o match por documento/nome pode duplicar cadastros ou vincular UC ao cliente errado
- covering NAO e kWh (indice 0-3 do DG); regra nova que o trate como energia estara errada
- fatura_duplicada marca critica e soma impacto; reprocessar faturas ou mudar chave dg_bill_id pode gerar falsos criticos
