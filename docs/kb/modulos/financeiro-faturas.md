# Modulo: Financeiro & Faturas de Energia

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/financeiro/conta.ts, ascender-app/src/lib/financeiro/parse-conta.ts, ascender-app/src/lib/ai/extract.ts, ascender-app/src/app/api/financeiro/conta/route.ts, ascender-app/src/app/api/financeiro/conta/lote/route.ts, ascender-app/src/app/api/financeiro/conta/file/route.ts, ascender-app/src/app/(dashboard)/financeiro/page.tsx, ascender-app/src/components/ContaEnergiaModal.tsx, ascender-app/src/components/ImportarBoletosLote.tsx, ascender-app/src/components/FaturasDgTable.tsx, ascender-app/src/lib/db/reconciliar-fatura.ts

## Visao geral
Gerencia a parte financeira da operacao de energia: exibe as faturas sincronizadas do Digital Grid (tabela `faturas_dg`) e permite anexar a cada fatura o PDF da conta da distribuidora (Neoenergia Brasilia e outras), tabela `contas_energia`. O PDF e lido por IA (provedor ativo) com fallback para regex, tem os campos extraidos (UC, competencia, valor, tributos, leituras, creditos SCEE) e e guardado em base64 no banco. Existe upload individual (por fatura) e conciliacao em lote, que casa cada PDF com a fatura certa por UC + competencia. Existe ainda um script de reconciliacao (somente leitura) que calibra formulas de cobranca/desconto contra o `raw` do Digital Grid. Existe para dar visibilidade financeira (faturado, recebido, em aberto, economia) e para arquivar/validar a conta fisica da distribuidora contra a fatura emitida ao cliente.

## Responsabilidades
- Listar faturas do Digital Grid e KPIs financeiros (total faturado, recebido, em aberto, economia).
- Receber upload de PDF da conta de energia (individual e em lote) com validacao de tipo/tamanho.
- Extrair campos do PDF via IA (Anthropic/OpenAI) com rede de seguranca por regex (`parseContaNeoenergia`).
- Persistir a conta (upsert por fatura) com o PDF em base64 e os campos normalizados.
- Detectar divergencia UC/competencia entre PDF e fatura escolhida (upload individual) e pedir confirmacao.
- Conciliar boletos em lote: casar PDF -> fatura por UC (so digitos) + competencia, com blindagem por CNPJ/CPF do titular.
- Servir o PDF anexado (inline) e permitir exclusao do anexo.
- Reconciliar (offline, so leitura) formulas de cobranca/desconto contra o `raw` da fatura.

## Principais arquivos
| Caminho | Papel |
| --- | --- |
| ascender-app/src/lib/financeiro/conta.ts | Orquestra extracao (IA + regex), persistencia (upsert), divergencia, conciliacao em lote, leitura/exclusao/serving do PDF. |
| ascender-app/src/lib/financeiro/parse-conta.ts | Parser regex de conta Neoenergia (2 layouts: beneficiario A e gerador/consorcio B). Fallback quando nao ha IA. |
| ascender-app/src/lib/ai/extract.ts | Extracao via IA (Anthropic `/v1/messages` ou OpenAI `/v1/responses`) com JSON Schema; normalizacao defensiva para `ContaParsed`. |
| ascender-app/src/app/api/financeiro/conta/route.ts | API REST GET/POST/DELETE da conta por `faturaDgId` (upload individual). |
| ascender-app/src/app/api/financeiro/conta/lote/route.ts | API POST de conciliacao em lote (ate 60 PDFs). |
| ascender-app/src/app/api/financeiro/conta/file/route.ts | API GET que devolve o PDF armazenado (inline, no-store). |
| ascender-app/src/app/(dashboard)/financeiro/page.tsx | Pagina do dashboard financeiro: KPIs + tabela de faturas + botao de lote. |
| ascender-app/src/components/FaturasDgTable.tsx | Tabela de faturas; coluna "Conta" abre o modal por fatura. |
| ascender-app/src/components/ContaEnergiaModal.tsx | Modal de anexar/substituir/excluir/ver conta; trata guarda de divergencia. |
| ascender-app/src/components/ImportarBoletosLote.tsx | Modal de upload em lote e exibicao do resultado da conciliacao. |
| ascender-app/src/lib/db/reconciliar-fatura.ts | Script CLI (`npm run db:reconciliar-fatura`) de calibracao de formulas, so leitura. |
| ascender-app/src/lib/digitalgrid/queries.ts | Fonte das faturas e dos mapas UC->cliente e UC->documento usados na conciliacao. |

## Entidades / tabelas
- `faturas_dg` (schema.ts:254, export `faturasDg`) — fatura sincronizada do Digital Grid. Campos-chave lidos aqui: `id`, `dg_bill_id`, `competencia`, `installation_number`, `installation_class`, `payment_status`, `valor_total`, `valor_pago`, `economia`, `consumo_kwh`, `vencimento`, `pago_em`, `raw` (jsonb com a fatura completa do DG). Somente leitura neste modulo.
- `contas_energia` (schema.ts:279, export `contasEnergia`) — conta/boleto da distribuidora anexado a UMA fatura. FK `fatura_dg_id` UNIQUE -> `faturas_dg.id` com `onDelete: cascade`. Guarda `arquivo_base64` (PDF), `mime_type`, `arquivo_nome`, `texto_extraido` e os campos extraidos: `installation_number`, `competencia`, `cliente`, `ano`, `mes`, `vencimento`, `valor`, `nota_fiscal`, `codigo_barras`, leituras (`leitura_anterior_data`, `leitura_data`, `leitura_proxima_data`, `numero_dias`), `energia_kwh`, `tributos` (jsonb), `itens_fatura` (jsonb), `aviso`, e SCEE dos dois layouts (`scee_excedente_kwh`, `scee_creditos_kwh`, `scee_saldo_proximo_kwh`, `scee_saldo_anterior_kwh`, `scee_transf_kwh`, `scee_injetado_kwh`, `scee_compensado_kwh`, `scee_saldo_atual_kwh`), `criado_em`, `atualizado_em`.
- `rateios_dg` (schema.ts:324, export `rateiosDg`) — usado indiretamente via `getDocumentoPorInstalacao`/`getClientePorInstalacao` (fallback UC->documento e UC->nome).
- `unidades_consumidoras` + `clientes` — fonte primaria dos mapas UC->cliente e UC->documento (joins em queries.ts:25 e :57).

## Endpoints / Server Actions
Nao usa Server Actions; sao Route Handlers REST (todos com `runtime = "nodejs"`, `dynamic = "force-dynamic"` e `requireSession`):
- `GET /api/financeiro/conta?faturaDgId=` -> `getContaEnergia(faturaDgId)` (route.ts:14). Retorna a conta sem o base64.
- `POST /api/financeiro/conta` (multipart: `faturaDgId`, `file`, `force?`) -> `salvarContaEnergia(...)` (route.ts:45). Limite 15 MB, exige PDF. Retorna `{ ok, parsed }` ou `{ ok, divergencia, parsed }`.
- `DELETE /api/financeiro/conta?faturaDgId=` -> `excluirContaEnergia(faturaDgId)` (route.ts:26).
- `POST /api/financeiro/conta/lote` (multipart: `files[]`) -> loop de `conciliarBoleto(...)` (lote/route.ts:12). Limite 60 arquivos, 15 MB cada. Carrega `docMap` uma vez por lote.
- `GET /api/financeiro/conta/file?faturaDgId=` -> `getContaFile(faturaDgId)` (file/route.ts:7). Devolve o PDF (`Content-Disposition: inline`, `Cache-Control: private, no-store`).

Funcoes de dominio (lib/financeiro/conta.ts): `salvarContaEnergia`, `excluirContaEnergia`, `conciliarBoleto`, `getContaEnergia`, `getContaFile`, `getFaturaIdsComConta`; internas `extrairConta`, `extractText`, `mergePreferIa`, `persistConta`, `getFaturaChave`, `checarDivergencia`.

## Telas
- `/financeiro` (rota `(dashboard)/financeiro/page.tsx`) — unica pagina do modulo: KPIs (SummaryStrip), tabela `FaturasDgTable`, botao "Importar boletos em lote". `EmptyState` quando nao ha faturas sincronizadas.
- Modais (nao sao rotas): `ContaEnergiaModal` (conta por fatura) e `ImportarBoletosLote` (lote).

## Regras de negocio
Explicitas (com arquivo:linha):
- Extracao prefere IA e usa regex como preenchimento de lacunas; sem IA ativa, usa so regex (conta.ts:19-92, `mergePreferIa`/`extrairConta`). `itensFatura` da IA so e usado se nao estiver vazio (conta.ts:42).
- Upsert por fatura: `contas_energia` tem `fatura_dg_id` UNIQUE; `persistConta` faz `onConflictDoUpdate` no `faturaDgId` (conta.ts:258-267). Ou seja, 1 conta por fatura; reenvio substitui.
- Divergencia (upload individual): so sinaliza quando os DOIS lados tem o dado e divergem, comparando UC por so-digitos e competencia (conta.ts:163-189). Front pede confirmacao "Anexar mesmo assim"; `force=true` ignora (ContaEnergiaModal.tsx:127-137, route.ts:57).
- Conciliacao em lote precisa de UC (so digitos) E competencia lidas do PDF; senao `sem_match` (conta.ts:331-337).
- Match de fatura no lote: `regexp_replace(installation_number, '[^0-9]', '')` = UC-digitos AND `competencia` = comp (conta.ts:339-345). 0 -> `sem_match`; >1 -> `ambiguo` (conta.ts:347-360).
- Nao sobrescreve conta ja existente no lote: se a fatura ja tem conta -> `ja_tinha` (mantida) (conta.ts:362-374).
- Blindagem CNPJ/CPF no lote: se o PDF traz documento do titular e diverge do documento esperado da UC (mapa `getDocumentoPorInstalacao`) -> `cnpj_divergente` (nao anexa) (conta.ts:376-391).
- Validacoes de upload: exige PDF por mime ou extensao; rejeita vazio; limite 15 MB (route.ts:67-76); lote limita 60 arquivos (lote/route.ts:10,29).
- KPIs: `emAberto = totalFaturado - totalPago`; `taxaReceb = totalPago/totalFaturado*100`; semaforo "Em aberto" por taxa de recebimento (>=95 default, >=80 warn, senao bad), nao por valor absoluto (page.tsx:36-61).
- Parser: numeros PT-BR normalizados (ptNum, parse-conta.ts:52); datas BR->ISO (isoDate, parse-conta.ts:60); competencia via cadeia de fallback (parse-conta.ts:74-97); `valor` = "TOTAL A PAGAR" (parse-conta.ts:210); dois layouts SCEE A/B (parse-conta.ts:168-241).
- IA: instrucao trata qualquer distribuidora, datas AAAA-MM-DD, competencia AAAA-MM, numeros decimais com ponto, `valor` = TOTAL A PAGAR, UC/cnpj so digitos, preencher so o layout SCEE existente (extract.ts:99-113); timeout 60s (extract.ts:115).

Implicitas / HIPOTESE:
- HIPOTESE: o `valor` extraido da conta da distribuidora nao e comparado com `valor_total` da fatura DG em runtime; a conferencia de valores fica so no script offline `reconciliar-fatura.ts`. Nao ha regra automatica de reconciliacao financeira aplicada na UI.
- HIPOTESE: as formulas candidatas de cobranca (f1..f5) e de desconto em reconciliar-fatura.ts:85-105 sao exploratorias/calibracao, nao regra de producao (o proprio arquivo diz "somente leitura / nada gravado").
- HIPOTESE: como o PDF fica em base64 na tabela, o tamanho da linha e o custo de trafego crescem com o numero de contas (nao ha storage externo).
- HIPOTESE: `cnpj` do titular so e persistido implicitamente? Nao — nao ha coluna `cnpj` em `contas_energia`; o `cnpj` extraido e usado apenas para a blindagem do lote e nao e salvo. (confirmado em schema.ts:279-321 e conta.ts:221-247)

## Dependencias
- Depende de:
  - `@/lib/db` (Drizzle/Postgres) e schema `contasEnergia`/`faturasDg`.
  - `@/lib/digitalgrid/queries` — `listFaturasDg`, `getClientePorInstalacao`, `getDocumentoPorInstalacao`, `getUltimaSyncFaturasDg` (modulo Digital Grid alimenta `faturas_dg`/`rateios_dg`).
  - `@/lib/ai/extract` -> `@/lib/ai/credentials` (`getActiveAiConfig`) e `@/lib/ai/providers` — provedor de IA (Anthropic/OpenAI) configurado em Configuracoes > Integracoes.
  - `pdf-parse` (import dinamico, `PDFParse`) para texto do PDF.
  - `@/lib/auth/guard` (`requireSession`) — todas as rotas exigem sessao.
  - Componentes UI: `SummaryStrip`, `EmptyState`, `ConfirmProvider`, `ToastProvider`, `lucide-react`.
- Consumido por:
  - Pagina `/financeiro` e seus componentes (`FaturasDgTable` -> `ContaEnergiaModal`; `ImportarBoletosLote`).
  - `getFaturaIdsComConta` alimenta o marcador "tem conta" da tabela (page.tsx:10, FaturasDgTable comConta).
  - Script `npm run db:reconciliar-fatura` (uso manual/CLI).

## Riscos de alteracao
- Regex do parser Neoenergia e fragil e especifico de layout (2 layouts codificados). Mudanca de layout da distribuidora quebra a extracao por regex; a IA cobre parte, mas so se houver provedor ativo.
- `fatura_dg_id` UNIQUE + `onConflictDoUpdate`: mudar a cardinalidade (permitir varias contas por fatura) exige mudar schema, upsert e as queries de conciliacao/`getFaturaIdsComConta`.
- Match do lote depende de UC e competencia estarem no formato certo em ambos os lados (`installation_number` do DG vs UC so-digitos do PDF). Alterar normalizacao (regexp_replace) pode gerar falsos `ambiguo`/`sem_match`.
- Blindagem CNPJ depende de `rateios_dg`/`clientes` terem documento; UC sem documento cadastrado nao e blindada (anexa sem conferir).
- PDF em base64 na coluna `arquivo_base64`: consultas que selecionam `*` de `contas_energia` trafegam o PDF inteiro; `camposPublicos`/`getContaFile` foram separados de proposito (conta.ts:94-125) — mexer nisso pode vazar o base64 em respostas ou pesar queries.
- Contrato do JSON Schema da IA (extract.ts:25-97) precisa bater com `ContaParsed`; alterar `ContaParsed` sem atualizar o schema/`toContaParsed` desalinha a extracao por IA.
- KPIs derivam de campos do DG (`valor_total`, `valor_pago`, `economia`); se o sync mudar semantica desses campos, os KPIs e o semaforo mudam sem aviso.

## Pendencias / a investigar
- Nao existe reconciliacao financeira automatica em runtime entre o `valor` da conta e o `valor_total`/`raw` da fatura DG — so o script offline. Confirmar se ha intencao de promover alguma formula (f1..f5) para validacao em producao.
- Autenticidade/limites: nao ha antivirus/validacao de conteudo do PDF alem de mime/extensao/tamanho; investigar se e requisito.
- Testes: `parse-conta.ts` coberto por `src/lib/financeiro/parse-conta.test.ts` (textos sinteticos dos layouts A e B; `npm test`). `conciliarBoleto`/`conta.ts` (com I/O) seguem sem teste. Ao calibrar o parser com uma conta real, acrescentar o trecho anonimizado como caso de teste.
- parse-conta.ts:163 faz `raw.replace(/ /g, " ")` (espaco por espaco, no-op). Parece que o NBSP (U+00A0) que deveria ser normalizado se perdeu; `\s` das regex ja cobre NBSP, mas `[ \t]*` em extractCliente nao. Confirmar intencao antes de mudar.
- `textoExtraido` e persistido mas nao aparece na UI; investigar uso (debug? reprocessamento futuro?).
- Comportamento quando a IA retorna campos parciais e o regex tambem falha: conta e salva com varios null (editaveis?). A UI (`ContaEnergiaModal`) exibe mas nao parece permitir edicao manual dos campos — confirmar se ha edicao em outro ponto (comentario em parse-conta.ts:6 fala em "editaveis manualmente na tela", mas nao foi encontrada a edicao).

## Fontes
- ascender-app/src/lib/financeiro/conta.ts
- ascender-app/src/lib/financeiro/parse-conta.ts
- ascender-app/src/lib/ai/extract.ts
- ascender-app/src/app/api/financeiro/conta/route.ts
- ascender-app/src/app/api/financeiro/conta/lote/route.ts
- ascender-app/src/app/api/financeiro/conta/file/route.ts
- ascender-app/src/app/(dashboard)/financeiro/page.tsx
- ascender-app/src/components/ContaEnergiaModal.tsx
- ascender-app/src/components/ImportarBoletosLote.tsx
- ascender-app/src/components/FaturasDgTable.tsx (parcial)
- ascender-app/src/lib/db/reconciliar-fatura.ts
- ascender-app/src/lib/db/schema.ts (faturas_dg, contas_energia, rateios_dg)
- ascender-app/src/lib/digitalgrid/queries.ts (parcial)
- ascender-app/package.json (scripts db:*)
