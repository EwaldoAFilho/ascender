# Modulo: Integracoes (config) & IA

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo:
> - ascender-app/src/lib/crypto/secrets.ts
> - ascender-app/src/lib/ai/providers.ts
> - ascender-app/src/lib/ai/credentials.ts
> - ascender-app/src/lib/ai/test.ts
> - ascender-app/src/lib/ai/extract.ts
> - ascender-app/src/app/api/integrations/ai/credentials/route.ts
> - ascender-app/src/app/api/integrations/ai/test/route.ts
> - ascender-app/src/app/api/integrations/soliscloud/credentials/route.ts
> - ascender-app/src/app/api/integrations/soliscloud/test/route.ts
> - ascender-app/src/app/api/integrations/digitalgrid/credentials/route.ts
> - ascender-app/src/app/api/integrations/digitalgrid/test/route.ts
> - ascender-app/src/lib/soliscloud/credentials.ts
> - ascender-app/src/lib/digitalgrid/credentials.ts
> - ascender-app/src/app/(dashboard)/configuracoes/integracoes/page.tsx
> - ascender-app/src/components/AiIntegrationCard.tsx
> - ascender-app/src/lib/api/ai.ts

## Visao geral
Este subsistema concentra o armazenamento seguro de credenciais das integracoes externas (SolisCloud, Digital Grid e provedores de IA) e a configuracao/uso da IA para leitura automatica de PDFs de contas de energia. Todas as credenciais ficam cifradas (AES-256-GCM) numa unica tabela `integration_credentials`, uma linha por `provider`. A tela `Configuracoes > Integracoes` permite cadastrar, mascarar/ocultar e testar cada credencial sem nunca reexibir o segredo. O modulo de IA (`lib/ai`) escolhe o provedor ativo (Anthropic ou OpenAI), valida a chave e extrai campos estruturados de faturas via chamadas HTTP cruas (sem SDK).

## Responsabilidades
- Cifrar/decifrar segredos com AES-256-GCM a partir de `APP_ENCRYPTION_KEY` (`lib/crypto/secrets.ts`).
- Persistir credenciais de SolisCloud, Digital Grid e IA na tabela `integration_credentials` (upsert por `provider`).
- Expor status/metadados das integracoes sem vazar o segredo (chave mascarada ou apenas flags).
- Testar conexao/validade das credenciais (SolisCloud: lista de usinas; DG: token; IA: `GET /v1/models`).
- Selecionar e usar o provedor de IA ativo para extrair campos da conta de energia (`lib/ai/extract.ts`).
- Renderizar a UI de configuracao das integracoes (`configuracoes/integracoes`, `AiIntegrationCard`, `DigitalGridCard`).

## Principais arquivos

| Caminho | Papel |
| --- | --- |
| ascender-app/src/lib/crypto/secrets.ts | Cifra/decifra AES-256-GCM (`encryptSecret`, `decryptSecret`) e `maskKey` para exibicao |
| ascender-app/src/lib/ai/providers.ts | Constantes compartilhadas cliente+servidor: catalogo `AI_PROVIDERS`, `aiRowKey`, `normalizeAiModel`, `isAiProvider` |
| ascender-app/src/lib/ai/credentials.ts | CRUD das linhas de IA em `integration_credentials`: status, chave decifrada, provedor ativo, salvar, registrar teste |
| ascender-app/src/lib/ai/test.ts | `testAiConnection` — valida a chave via `GET /v1/models` (header por provedor) |
| ascender-app/src/lib/ai/extract.ts | `parseContaComIA` — chama Anthropic (`/v1/messages`) ou OpenAI (`/v1/responses`) com JSON schema e normaliza para `ContaParsed` |
| ascender-app/src/app/api/integrations/ai/credentials/route.ts | GET status dos provedores de IA / PUT salvar provedor+modelo+chave |
| ascender-app/src/app/api/integrations/ai/test/route.ts | POST testa chave de IA (digitada ou salva); grava resultado quando testa a salva |
| ascender-app/src/app/api/integrations/soliscloud/credentials/route.ts | GET status (KeyId mascarado) / PUT salvar credenciais SolisCloud |
| ascender-app/src/app/api/integrations/soliscloud/test/route.ts | POST testa credenciais SolisCloud chamando `userStationList` |
| ascender-app/src/app/api/integrations/digitalgrid/credentials/route.ts | GET status / PUT salvar token do Digital Grid |
| ascender-app/src/app/api/integrations/digitalgrid/test/route.ts | POST testa token do Digital Grid |
| ascender-app/src/lib/soliscloud/credentials.ts | Persistencia/decifragem das credenciais SolisCloud (`provider = "soliscloud"`) |
| ascender-app/src/lib/digitalgrid/credentials.ts | Persistencia/decifragem do token DG (`provider = "digital_grid"`, `keyId` = scheme) |
| ascender-app/src/app/(dashboard)/configuracoes/integracoes/page.tsx | Tela: card SolisCloud + `DigitalGridCard` + `AiIntegrationCard` |
| ascender-app/src/components/AiIntegrationCard.tsx | Card client de config da IA (provedor, modelo, chave, ativo, testes) |
| ascender-app/src/lib/api/ai.ts | Client fetch usado pela UI (`fetchAiStatus`, `saveAiProvider`, `testAi`) |

## Entidades / tabelas
- `integration_credentials` (schema: `integrationCredentials` em ascender-app/src/lib/db/schema.ts:26) — tabela unica compartilhada por todas as integracoes. Colunas: `id`, `provider` (unique), `key_id`, `key_secret_enc` (cifrado "base64(iv):base64(tag):base64(ciphertext)"), `base_url` (default `https://www.soliscloud.com:13333`), `is_active`, `last_test_at`, `last_test_ok`, `created_at`, `updated_at`.
  - Valores de `provider` observados no codigo: `"soliscloud"`, `"digital_grid"`, `"ai_anthropic"`, `"ai_openai"` (os dois ultimos via `aiRowKey` em providers.ts:47).
  - Convencao por integracao (comentarios em ai/credentials.ts:14-19 e digitalgrid/credentials.ts:9-10): para IA `key_id` guarda o **modelo** (nao e segredo) e `is_active` marca o provedor de IA ativo; para DG `key_id` guarda o **scheme** do header (`Bearer`/`Token`) e `key_secret_enc` o token; para Solis `key_id` guarda o KeyId (nao cifrado) e `key_secret_enc` o KeySecret.
- `app_settings` (schema: `appSettings` em schema.ts:47) — tabela chave/valor (`key` PK, `value`, `updated_at`). Comentario indica uso previsto para `login_email` / `login_password_hash`. HIPOTESE: nao ha nenhum consumidor em `src/` (grep so encontrou a definicao no schema); provavelmente e alimentada/consumida por seed/migracao ou ainda nao integrada. Ver Pendencias.

## Endpoints / Server Actions
Todas as rotas exigem sessao via `requireSession()` (ascender-app/src/lib/auth/guard.ts), rodam em `runtime = "nodejs"` e `dynamic = "force-dynamic"`.

- `GET /api/integrations/ai/credentials` -> `GET()` (ai/credentials/route.ts:10) — retorna `getAiStatus()` (nunca a chave).
- `PUT /api/integrations/ai/credentials` -> `PUT()` (ai/credentials/route.ts:26) — valida `putSchema` (zod) e chama `saveAiProvider`.
- `POST /api/integrations/ai/test` -> `POST()` (ai/test/route.ts:16) — testa chave digitada ou salva; se salva, grava via `recordAiTestResult`.
- `GET /api/integrations/soliscloud/credentials` -> `GET()` — status + `keyIdMasked` (`maskKey`).
- `PUT /api/integrations/soliscloud/credentials` -> `PUT()` — `saveSolisCredentials` (novo segredo) ou `updateSolisCredentialMeta` (so keyId/baseUrl).
- `POST /api/integrations/soliscloud/test` -> `POST()` — chama `callSolis(...userStationList)` e conta usinas.
- `GET /api/integrations/digitalgrid/credentials` -> `GET()` — status + `scheme`.
- `PUT /api/integrations/digitalgrid/credentials` -> `PUT()` — `saveDgToken`.
- `POST /api/integrations/digitalgrid/test` -> `POST()` — `testDigitalGridConnection`.

Funcoes de dominio (nao sao server actions Next; sao helpers server-side): `getAiStatus`, `getAiApiKey`, `getActiveAiConfig`, `saveAiProvider`, `recordAiTestResult` (ai/credentials.ts); `parseContaComIA` (ai/extract.ts); `getSolisCredentials`, `saveSolisCredentials`, `updateSolisCredentialMeta`, `recordSolisTestResult` (soliscloud/credentials.ts); `getDgCredential`, `saveDgToken`, `recordDgTest` (digitalgrid/credentials.ts).

## Telas
- `/(dashboard)/configuracoes/integracoes` — pagina `ConfiguracoesIntegracoesPage` (client). Contem: card SolisCloud (KeyId/KeySecret/URL base, testar salva/digitada), `DigitalGridCard` e `AiIntegrationCard` (provedor Anthropic/OpenAI, modelo, chave, marcar ativo, testar salva/digitada).

## Regras de negocio
- (Explicita) Segredos sao cifrados com AES-256-GCM; formato armazenado = `base64(iv):base64(tag):base64(ciphertext)` (secrets.ts:22-35, schema.ts:31).
- (Explicita) A chave mestra vem de `APP_ENCRYPTION_KEY`: se decodificar em base64 exatamente 32 bytes, usa direto; senao deriva 32 bytes via SHA-256 do valor cru (secrets.ts:12-19).
- (Explicita) As respostas de status NUNCA retornam o segredo — SolisCloud devolve `keyIdMasked` (`maskKey`), DG devolve so flags/scheme, IA devolve so metadados (soliscloud/credentials/route.ts:16-27, ai/credentials/route.ts:9-16).
- (Explicita) Ao salvar sem novo segredo, preserva-se o `key_secret_enc` existente: Solis usa `updateSolisCredentialMeta` (soliscloud/credentials/route.ts:54), IA reaproveita `current.keySecretEnc` (ai/credentials.ts:120-124). Primeira config exige o segredo (erro se ausente).
- (Explicita) IA — no maximo um provedor ativo: ao salvar com `makeActive=true`, os demais `ai_*` recebem `is_active=false` (ai/credentials.ts:146-154). O escopo do reset e restrito a `AI_ROW_KEYS`, para nao afetar as linhas de Solis/DG na mesma tabela.
- (Explicita) `normalizeAiModel` forca o modelo para a lista permitida do provedor, caindo no `defaultModel` se vier valor invalido (providers.ts:52-57).
- (Explicita) Teste de IA e feito com `GET {baseUrl}/v1/models`; Anthropic usa header `x-api-key` + `anthropic-version: 2023-06-01`, OpenAI usa `Authorization: Bearer` (ai/test.ts:21-24). O resultado so e persistido quando se testa a chave **salva** (ai/test/route.ts:37-39).
- (Explicita) Extracao por IA: `parseContaComIA` retorna `null` se nao houver provedor de IA ativo; caso haja, chama Anthropic `/v1/messages` (bloco `document` PDF base64) ou OpenAI `/v1/responses` (`input_file` data URI), ambos com JSON schema `CONTA_SCHEMA` e timeout de 60s (extract.ts:115, 138-251, 353-358).
- (Explicita) `getSolisCredentials` e `getDgCredential` so retornam credencial se `is_active` for true (soliscloud/credentials.ts:20, digitalgrid/credentials.ts:27).
- (Explicita) Orquestracao da leitura de conta (fora deste modulo, em lib/financeiro/conta.ts:55-91): roda IA e regex; se IA ativa e OK, mescla preferindo IA e marca `fonte="ia"`; se IA nula/falha, usa so o regex (`fonte="regex"`). A IA e best-effort, com o regex como rede de seguranca.
- (Implicita) `base_url` default da tabela (`https://www.soliscloud.com:13333`) e voltado para SolisCloud; as linhas de IA/DG sobrescrevem esse default ao salvar via seus proprios helpers (ai/credentials.ts:108, digitalgrid/credentials.ts:35). HIPOTESE: uma linha de IA/DG criada sem `baseUrl` explicito herdaria o default de Solis, mas os helpers sempre passam um baseUrl proprio.
- (Implicita/HIPOTESE) Autorizacao e binaria: qualquer sessao autenticada pode ler/salvar/testar credenciais — nao ha checagem de papel/permissao nas rotas (so `requireSession`).

## Dependencias
- Depende de:
  - `lib/crypto/secrets.ts` (cifra/decifra) e `lib/env.ts` (`APP_ENCRYPTION_KEY`).
  - `lib/db` (`getDb`) + Drizzle schema `integration_credentials`.
  - `lib/auth/guard.ts` (`requireSession`) para proteger as rotas.
  - `lib/soliscloud/*` (client, endpoints, mappers, types) e `lib/digitalgrid/*` (client, endpoints) para os testes de conexao.
  - APIs externas: Anthropic, OpenAI, SolisCloud, Digital Grid.
  - UI: React Query (`@tanstack/react-query`), `ToastProvider`, `lucide-react`.
- Consumido por:
  - `lib/financeiro/conta.ts` -> `parseContaComIA` / `getActiveAiConfig` (extracao de contas de energia).
  - Tela `configuracoes/integracoes` e componentes `AiIntegrationCard` / `DigitalGridCard`.
  - Os modulos SolisCloud (telemetria/sync) e Digital Grid (faturas/rateio) que chamam `getSolisCredentials` / `getDgCredential` para obter o segredo decifrado.

## Riscos de alteracao
- Trocar/perder `APP_ENCRYPTION_KEY` torna TODOS os `key_secret_enc` existentes indecifraveis (secrets.ts:12-19). Rotacao de chave exige recriptografar os segredos.
- Ambiguidade na derivacao da chave: um `APP_ENCRYPTION_KEY` cujo `Buffer.from(raw,"base64")` calhe de ter 32 bytes e tratado como base64 (nao passa pelo SHA-256). Mudar essa heuristica quebra a decifragem do que ja foi salvo.
- A tabela `integration_credentials` e compartilhada por Solis/DG/IA e a semantica de `key_id`/`is_active`/`base_url` muda por provedor. Alterar o significado dessas colunas ou mexer no reset de `is_active` da IA pode ativar/desativar a integracao errada.
- O reset de provedor ativo da IA filtra por `AI_ROW_KEYS`; se um novo provider de IA for adicionado sem incluir em `AI_PROVIDER_LIST`/`aiRowKey`, ele nao sera desativado corretamente.
- `parseContaComIA` depende do formato de resposta cru das APIs (Anthropic `content[].text`, OpenAI `output_text`/`output[].content[]`) e do suporte a `output_config`/`text.format` com JSON schema; mudancas nesses contratos quebram a extracao (mas o chamador cai para o regex).
- Adicionar campos a `CONTA_SCHEMA` exige atualizar `required` e `toContaParsed` juntos (extract.ts) — schema e normalizacao estao acoplados.

## Pendencias / a investigar
- `app_settings`: a tabela existe no schema (comentario cita `login_email`/`login_password_hash`), mas nao ha consumidor em `src/`. Investigar se e populada por seed/migracao/SQL manual ou se e legado ainda nao integrado. Nao inventar regra de login a partir dela.
- Confirmar se o middleware alem do `requireSession` aplica alguma checagem adicional de acesso a `configuracoes/integracoes` (nao verificado neste modulo).
- Nao ha rotacao/versionamento de chave de criptografia; verificar se existe processo operacional documentado fora do codigo.
- `recordAiTestResult` faz `UPDATE` por provider; se a linha ainda nao existir (provedor nunca salvo) o update nao afeta linhas — comportamento aceitavel, mas o teste da chave salva pressupoe linha existente.
- Nao localizado teste automatizado cobrindo cifra/decifra ou os endpoints de credenciais (nao pesquisado exaustivamente).

## Fontes
- ascender-app/src/lib/crypto/secrets.ts
- ascender-app/src/lib/ai/providers.ts
- ascender-app/src/lib/ai/credentials.ts
- ascender-app/src/lib/ai/test.ts
- ascender-app/src/lib/ai/extract.ts
- ascender-app/src/app/api/integrations/ai/credentials/route.ts
- ascender-app/src/app/api/integrations/ai/test/route.ts
- ascender-app/src/app/api/integrations/soliscloud/credentials/route.ts
- ascender-app/src/app/api/integrations/soliscloud/test/route.ts
- ascender-app/src/app/api/integrations/digitalgrid/credentials/route.ts
- ascender-app/src/app/api/integrations/digitalgrid/test/route.ts
- ascender-app/src/lib/soliscloud/credentials.ts
- ascender-app/src/lib/digitalgrid/credentials.ts
- ascender-app/src/app/(dashboard)/configuracoes/integracoes/page.tsx
- ascender-app/src/components/AiIntegrationCard.tsx
- ascender-app/src/lib/api/ai.ts
- ascender-app/src/lib/db/schema.ts (tabelas integration_credentials, app_settings)
- ascender-app/src/lib/env.ts (APP_ENCRYPTION_KEY)
- ascender-app/src/lib/auth/guard.ts (requireSession)
- ascender-app/src/lib/financeiro/conta.ts (consumidor de parseContaComIA)
