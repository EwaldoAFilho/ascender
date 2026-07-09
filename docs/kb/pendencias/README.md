# Pendências / a investigar (por módulo)

> Itens que o discovery inicial não conseguiu inferir com segurança. Não são fatos.


## Arquitetura & App Shell — [`modulos/arquitetura.md`](../modulos/arquitetura.md)

- [ ] A tarefa cita route group (auth), mas a area publica e o segmento simples src/app/login/ (nao existe diretorio (auth)); confirmar se foi planejado/renomeado
- [ ] Nao foram observados error.tsx, not-found.tsx, loading.tsx ou template.tsx nesta varredura; investigar tratamento global de erro/loading
- [ ] SessionData ja modela userId/roles para RBAC futuro (session.ts:6-12), mas nao ha enforcement de roles no shell/middleware; confirmar se RBAC esta ativo em algum modulo
- [ ] globals.css (~66 KB) nao foi lido em detalhe: e o design system que sustenta as classes do shell (app-shell, sidebar, topbar, cockpit); documentar tokens/temas se necessario
- [ ] Confirmar politica de cache/revalidacao: muitos force-dynamic sem uso de revalidate/ISR; validar se e intencional (dados sempre frescos)

## Autenticacao & Autorizacao — [`modulos/auth-autorizacao.md`](../modulos/auth-autorizacao.md)

- [ ] Confirmar se app_settings (login_email/login_password_hash) ainda e lido ou e legado do login unico compartilhado
- [ ] Parametros exatos do argon2 (memoria/tempo/paralelismo) nao explicitos — usa defaults da lib
- [ ] loginAt gravado na sessao mas nao encontrado uso para expiracao server-side alem do maxAge do cookie
- [ ] Ausencia de rate limiting/lockout e de CSRF explicito (mitigado por sameSite lax) — validar se e requisito
- [ ] Confirmar se alguma pagina do grupo (dashboard) depende so do middleware, sem requireSession, para proteger dados

## Cadastros (CRUD) — [`modulos/cadastros.md`](../modulos/cadastros.md)

- [ ] Confirmar intencao sobre sobrescrita de potencia na importacao SolisCloud (docstring/painel x codigo divergem)
- [ ] Confirmar se ausencia de historico/anexos para UC, usina, contrato e distribuidora e intencional ou backlog
- [ ] Fronteira entre este modulo e operacao/geracao: medicoes_geracao esta em queries.ts daqui, mas sync-geracao vive em lib/db/
- [ ] Nao ha busca/paginacao server-side; verificar limite pratico de registros esperado
- [ ] Avaliar se save/deleteProposta e save/deleteFatura deveriam migrar para os modulos financeiro/propostas

## Dados & Banco (Drizzle/Postgres) — [`modulos/dados-e-banco.md`](../modulos/dados-e-banco.md)

- [ ] Nao ha migration garantindo unicidade de parametros_proposta (linha unica e convencao no codigo) — confirmar em src/lib/propostas/parametros.ts
- [ ] Confirmar se existe rotina de retencao/limpeza para telemetria_* (nao encontrada)
- [ ] rateios_dg/faturas_dg nao tem FK para usinas/clientes (vinculo por numero/documento) — verificar joins em src/lib/digitalgrid/queries.ts
- [ ] Confirmar que apenas o servico app roda db:migrate no boot (syncs sobrescrevem entrypoint:[]); verificar corrida de migracao paralela
- [ ] Fallback de URL localhost em drizzle.config.ts pode apontar para banco errado em migracao

## Financeiro & Faturas de Energia — [`modulos/financeiro-faturas.md`](../modulos/financeiro-faturas.md)

- [ ] Confirmar se ha intencao de promover alguma formula (f1..f5) de reconciliar-fatura.ts para validacao financeira em producao (hoje so offline/leitura)
- [ ] Nao ha teste automatizado localizado para parse-conta.ts / conciliarBoleto — verificar cobertura
- [ ] textoExtraido e persistido mas nao aparece na UI — investigar uso (debug/reprocessamento futuro)
- [ ] Comentario em parse-conta.ts:6 diz que campos ficam editaveis manualmente na tela, mas a edicao manual nao foi encontrada na UI (ContaEnergiaModal apenas exibe) — confirmar
- [ ] Nao ha validacao de conteudo/antivirus do PDF alem de mime/extensao/tamanho — verificar se e requisito

## Infra & Deploy — [`modulos/infra-e-deploy.md`](../modulos/infra-e-deploy.md)

- [ ] Confirmar se o gotcha IPv6-only afeta a VPS Linux de producao (tipicamente e problema de Docker Desktop) e se vale fixar NODE_OPTIONS=--dns-result-order=ipv4first no compose
- [ ] APP_PORT real de producao esta no .env nao versionado (comentario do prod indica :3005) — confirmar valor efetivo
- [ ] Nao ha estrategia de backup/restore do volume ascender_pgdata no repo
- [ ] Sem healthcheck de app/workers; falta de deteccao de worker travado
- [ ] Rotacao/limite de tamanho do deploy.log e dos logs dos containers nao configurados
- [ ] Diretorio .github presente mas sem workflows — confirmar se ha CI planejado alem do polling

## Integracao Digital Grid — [`modulos/integracao-digital-grid.md`](../modulos/integracao-digital-grid.md)

- [ ] Confirmar cadencia correta a exibir em /integracoes (15 min vs '6h' atual)
- [ ] Endpoint financial-credits esta em DG_ENDPOINTS mas nao e consumido em lugar nenhum
- [ ] Nao ha rotina de reconciliacao/exclusao de registros removidos no DG
- [ ] payment_status gravado como texto livre; confirmar valores possiveis e necessidade de enum
- [ ] Semantica de covering e annotations em rateios_dg nao documentada no codigo
- [ ] Confirmar unicidade global de generation_month_id no DG (nao so por gerador/mes)

## Integracao SolisCloud — [`modulos/integracao-soliscloud.md`](../modulos/integracao-soliscloud.md)

- [ ] Confirmar cadencia dos workers em producao (docker-compose.prod.yml nao lido) e interacao com scripts/deploy-poll.sh
- [ ] Nao ha politica de retencao/limpeza das tabelas telemetria_*; avaliar crescimento e particionamento
- [ ] SOLIS_ERROR_MESSAGES cobre so I0012 e R0000; demais codes caem no msg cru — mapear os comuns
- [ ] Endpoints stationDay/stationMonth/inverterDetail declarados mas sem uso ativo (curvas vem do banco) — confirmar se sao legado/mock
- [ ] Inconsistencia AlarmLevel ('alto' no tipo, nunca gerado pelo mapper) — verificar consumidor
- [ ] Verificar se importStationsFromSolis tem gatilho por rota/tela ou e apenas manual

## Integracoes (config) & IA — [`modulos/integracoes-config-e-ai.md`](../modulos/integracoes-config-e-ai.md)

- [ ] app_settings existe no schema mas nao tem consumidor em src/; investigar se e populada por seed/migracao ou e legado nao integrado.
- [ ] Confirmar se ha checagem de acesso adicional (middleware/papel) alem de requireSession para configuracoes/integracoes.
- [ ] Nao ha processo de rotacao de chave de criptografia no codigo; verificar procedimento operacional externo.
- [ ] recordAiTestResult faz UPDATE por provider; se a linha nao existir o update nao afeta nada (teste da chave salva pressupoe linha existente).
- [ ] Nao localizado teste automatizado cobrindo cifra/decifra ou os endpoints de credenciais.

## Operacao & Dashboards — [`modulos/operacao-e-dashboards.md`](../modulos/operacao-e-dashboards.md)

- [ ] Documentos referenciados PLANO_FASE_2A_HEALTHSCORE.md e PLANO_FASE_2B_ATTENTION_CENTER.md nao foram localizados/lidos - confirmar existencia e se os pesos batem
- [ ] Confirmar onde ha escrita/edicao de coordenadas (lat/lon) das usinas - aparentemente em Cadastros > Usinas, fora deste modulo
- [ ] OperationalTimeline so aparece na tela overview; confirmar se e intencional nao expor no Executivo/SolisCloud
- [ ] Divergencia de meta diaria (/30 vs dias reais) - verificar se e decisao de produto ou inconsistencia
- [ ] Componentes compartilhados (PowerRing, ComparisonChart, GenerationChart, UsinasTable, StatusBanner) usados mas nao lidos em detalhe

## Propostas & Gerador FV — [`modulos/propostas-gerador.md`](../modulos/propostas-gerador.md)

- [ ] Campo padrao (mono/bi/tri) nao influencia calculo nem adequacao trifasica automatica - confirmar se e intencional ou feature pendente
- [ ] Nao ha reimpressao a partir do snapshot dadosGerador: PDF so na mesma sessao (estado em memoria); nenhuma rota reidrata proposta salva
- [ ] cronogramaFioB nao e editavel no ParametrosForm (so exibido); confirmar se editar o array e desejado
- [ ] tarifaFioB default 0 zera o efeito do Fio B; confirmar se a equipe ja tem a TUSD Fio B real
- [ ] KPIs da lista /propostas usam tarifaAscender (simulacao manual) que o gerador grava 0 - verificar unificacao dos dois modelos de economia
- [ ] Autorizacao das actions so checa authenticated, sem papel/role - confirmar se qualquer usuario logado pode ver custo/margem

## Rateio &amp; Auditoria — [`modulos/rateio-e-auditoria.md`](../modulos/rateio-e-auditoria.md)

- [ ] Confirmar se/como os scripts db:sync-rateio-dg e db:auditar-rateio sao disparados por cron/deploy na VPS (commit recente cita polling/cron, mas o agendamento nao esta nestes arquivos)
- [ ] Origem/justificativa do fator 0.15 no impacto de uc_sem_rateio (HIPOTESE) precisa ser documentada ou parametrizada
- [ ] Fase 2 (persistencia dos achados / tela de auditoria) prevista nos comentarios mas inexistente: sem tabela de findings, sem historico, sem UI
- [ ] Nao ha testes automatizados das funcoes puras de rules.ts, apesar de projetadas para serem 100% testaveis
- [ ] Confirmar aderencia de mesesExpiracaoScee=60 a Lei 14.300 (prazo/condicoes de expiracao do saldo SCEE) no cenario real dos clientes
- [ ] Vinculo Lei 14.300 aparece so indiretamente (residuo fio B na base de desconto + expiracao SCEE 60m); nao ha modulo dedicado a Fio B dentro deste subsistema

## Multi-tenancy / SaaS (Fase 6+) — [`adr/ADR-0007`](../adr/ADR-0007-multi-tenancy-shared-db-rls.md)

Resolvido na Fase 6 (fecha pendências antigas de infra/soliscloud/rateio): a cadência
dos syncs agora é cron do pg-boss (telemetria */10, DG */15, geração 6h) num serviço
único `worker`; o agendamento vive em `src/lib/worker/index.ts` (não mais nos loops
shell do compose). Sync é por tenant, com lock `stately` por `(tenant, job)`.

Feito na Fase 7 (ops hardening):

- [x] **Migrations fora do boot:** serviço one-shot `migrate` (compose) roda antes de
      `app`/`worker` (`service_completed_successfully`); entrypoint do `app` só faz `start`.
- [x] **Backup automático (local):** serviço `backup` (`pg_dump` diário no volume
      `ascender_backups`, retenção). Runbook `runbooks/backup-restore.md`.
- [x] **Healthchecks:** `app` (`/api/health`) e `worker` (heartbeat).

Deferidos (endereçar nas Fases 7 restante / 8):

- [ ] **Redis + réplicas horizontais** (Fase 7, quando houver carga): cache/rate-limit do
      Solis e a fila são in-process/por-conta; com réplicas será preciso store compartilhado.
- [ ] **Cópia offsite dos backups** (S3-compatível): hoje o dump é só local (mesmo VPS);
      requer credenciais do bucket. Ver `runbooks/backup-restore.md`.
- [ ] **Rotação de chave de cripto por tenant** (envelope/KEK): herdada da Fase 5 — o
      blob ainda usa a chave mestra única (`APP_ENCRYPTION_KEY`), sem key-id/rotação.
- [ ] **Senha de `ascender_app`** fixa na migração 0021 (dev) — parametrizar em prod.
- [ ] **pg-boss como dono**: o `worker` conecta com a role dona (DATABASE_URL) p/ criar
      o schema `pgboss`; avaliar pré-criar o schema e rodar o worker com role restrita.
- [ ] **Quotas/planos por tenant** (Fase 8): sem limite de usinas/usuários/cadência.
