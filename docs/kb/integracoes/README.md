# Integrações externas

Detalhe de cada integração está no doc do módulo correspondente. Fluxo geral em
[`../fluxos/sincronizacao-dados.md`](../fluxos/sincronizacao-dados.md).

| Integração | Sentido | Módulo (KB) | Código |
|---|---|---|---|
| **SolisCloud** | leitura (telemetria, geração, alarmes) | [`../modulos/integracao-soliscloud.md`](../modulos/integracao-soliscloud.md) | `ascender-app/src/lib/soliscloud/`, `src/app/api/soliscloud/*`, `src/lib/db/sync-{geracao,telemetria}.ts` |
| **Digital Grid** | **somente leitura** (faturas, rateio) | [`../modulos/integracao-digital-grid.md`](../modulos/integracao-digital-grid.md) | `ascender-app/src/lib/digitalgrid/`, `src/lib/db/sync-{faturas,rateio}-dg.ts` |
| **IA** (credenciais/uso) | — | [`../modulos/integracoes-config-e-ai.md`](../modulos/integracoes-config-e-ai.md) | `ascender-app/src/lib/ai/`, `src/app/api/integrations/ai/*` |

## Comuns a todas
- **Credenciais** ficam em `integration_credentials` (criptografadas, `lib/crypto/`),
  geridas em `/configuracoes/integracoes`. Endpoints de teste:
  `api/integrations/{soliscloud,digitalgrid,ai}/test`.
- O **front nunca** fala direto com a API externa — sempre via route handlers internos
  (`/api/*`), que assinam/autenticam no servidor.
- SolisCloud tem cache TTL por processo (`lib/cache/ttlCache.ts`) para as rotas ao vivo.

> **Pendência:** extrair os **contratos** externos (endpoints, assinatura, payloads,
> limites) para [`../contratos/`](../contratos/). Ver `pendencias/`.
