# Modulo: Arquitetura & App Shell

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/app/layout.tsx, ascender-app/src/app/providers.tsx, ascender-app/src/app/(dashboard)/layout.tsx, ascender-app/src/app/(dashboard)/page.tsx, ascender-app/src/app/login/page.tsx, ascender-app/next.config.mjs, ascender-app/tsconfig.json, ascender-app/src/middleware.ts, ascender-app/src/lib/env.ts, ascender-app/src/lib/theme.tsx, ascender-app/src/lib/cache/ttlCache.ts, ascender-app/src/lib/api/soliscloud.ts, ascender-app/src/lib/api/ai.ts, ascender-app/src/lib/api/digitalgrid.ts, ascender-app/src/lib/db/index.ts, ascender-app/src/lib/soliscloud/handler.ts

## Visao geral
Camada de fundacao da aplicacao ASCENDER: define a estrutura do Next.js 15 (App Router), o casco visual (app-shell) e as convencoes transversais que todos os modulos de negocio herdam. Reune o layout raiz com script anti-flash de tema, os providers de client (React Query, Theme, Confirm, Toast), o route group `(dashboard)` que renderiza sidebar/topbar/mobile-nav, o middleware de gate de sessao na borda, o acesso preguicoso a variaveis de ambiente, o cache TTL em memoria e os helpers de fetch (`src/lib/api/*`) que o front usa para falar com os route handlers internos. Existe para padronizar Server Components + Server Actions, isolar segredos no servidor e evitar duplicacao de infra entre telas.

## Responsabilidades
- Definir o HTML raiz (`<html lang="pt-BR">`), metadata e aplicar o tema antes do primeiro paint (anti-flash).
- Montar a arvore de providers de client: `QueryClientProvider` (React Query), `ThemeProvider`, `ConfirmProvider`, `ToastProvider`.
- Renderizar o app-shell autenticado (sidebar de navegacao, topbar, hero de modulo, mobile-nav, toggle de tema, logout) via route group `(dashboard)`.
- Separar area publica (`/login`) da area autenticada (`(dashboard)`) por route groups.
- Aplicar gate de sessao na borda (middleware): libera rotas publicas, responde 401 em `/api/*` e redireciona paginas para `/login?next=...`.
- Expor acesso lazy e validado a env vars (`src/lib/env.ts`).
- Prover cache TTL em memoria (singleton por processo) para proteger rate limit da SolisCloud.
- Prover clients de browser (`src/lib/api/*`) e o wrapper de route handler `withSolis` (auth + credenciais + mapeamento de erro).
- Configurar o build Next (strict mode, pacotes nativos server-only) e o alias de import `@/*`.

## Principais arquivos
| Caminho | Papel |
| --- | --- |
| ascender-app/src/app/layout.tsx | RootLayout: `<html>`/`<body>`, metadata, script anti-flash de tema, importa `globals.css`, envolve em `<Providers>`. |
| ascender-app/src/app/providers.tsx | Client. Instancia `QueryClient` (retry 1, staleTime 60s, sem refetch on focus) e aninha Theme/Confirm/Toast providers. |
| ascender-app/src/app/globals.css | Design system / folha de estilo global (~66 KB) importada no RootLayout. |
| ascender-app/src/app/(dashboard)/layout.tsx | Client. App-shell: sidebar, topbar, hero de modulo, mobile-nav, toggle de tema, logout (`fetch /api/auth/logout`). Resolve titulo/subtitulo por `usePathname`. |
| ascender-app/src/app/(dashboard)/page.tsx | Server Component async (`dynamic = "force-dynamic"`): overview/cockpit, busca dados em paralelo (`Promise.all`). Exemplo canonico do padrao SC. |
| ascender-app/src/app/login/page.tsx | Client. Tela publica de login (fora do shell), POST em `/api/auth/login`, redireciona pelo `?next`. |
| ascender-app/src/middleware.ts | Middleware Edge: gate por presenca do cookie `ascender_session`; matcher exclui estaticos e `/brand`. |
| ascender-app/src/lib/env.ts | Objeto `env` com getters lazy (databaseUrl, encryptionKey, sessionSecret, loginEmail/Password, appBaseUrl, isProd, cookieSecure). |
| ascender-app/src/lib/theme.tsx | Client. `ThemeProvider`/`useTheme`; le `data-theme` do `<html>`, persiste em `localStorage["ascender-theme"]`. |
| ascender-app/src/lib/cache/ttlCache.ts | Cache TTL em memoria (`Map` singleton): `getCached`/`setCached`/`clearCache`. |
| ascender-app/src/lib/api/soliscloud.ts | Client de browser para `/api/soliscloud/*`: classe `ApiError`, helper `getJson`, funcoes `fetch*`. |
| ascender-app/src/lib/api/ai.ts | Client de browser para `/api/integrations/ai/*`. |
| ascender-app/src/lib/api/digitalgrid.ts | Client de browser para `/api/integrations/digitalgrid/*`. |
| ascender-app/src/lib/db/index.ts | Singleton lazy do Drizzle/`Pool` (pg) via `globalThis` (`getDb`). |
| ascender-app/src/lib/soliscloud/handler.ts | `withSolis`: wrapper de route handler (exige sessao, carrega credenciais, mapeia erros para 401/409/502/500). |
| ascender-app/next.config.mjs | Config Next: `reactStrictMode`, `serverExternalPackages: [@node-rs/argon2, pg, pdf-parse]`. |
| ascender-app/tsconfig.json | Alias de path `@/*` -> `./src/*`. |

## Entidades / tabelas
Este modulo (casco/infra) nao possui tabelas proprias. Ele apenas prove o acesso ao banco:
- `getDb()` em `src/lib/db/index.ts` instancia o Drizzle sobre `* as schema` de `src/lib/db/schema.ts` — as tabelas concretas pertencem aos modulos de negocio (auth, cadastros, propostas, etc.).
- A sessao NAO e uma tabela: e um cookie assinado (`iron-session`), cookie `ascender_session`.

## Endpoints / Server Actions
Este modulo nao define endpoints de negocio; fornece a plumbing consumida por todos:
- Padrao de Server Actions (`"use server"`): arquivos `src/lib/auth/actions.ts`, `src/lib/cadastros/actions.ts`, `src/lib/propostas/actions.ts` (validam com `zod`, chamam `getSession()` e `revalidatePath()`). Detalhados nos respectivos modulos.
- Wrapper de route handler: `withSolis(fn)` em `src/lib/soliscloud/handler.ts` — usado pelos handlers `src/app/api/soliscloud/*/route.ts`.
- Guard de sessao para handlers: `requireSession()` em `src/lib/auth/guard.ts` (retorna sessao ou `NextResponse` 401).
- Clients de browser (nao sao endpoints, sao consumidores): `fetchStations/fetchGeneration/...` (`api/soliscloud.ts`), `fetchAiStatus/saveAiProvider/testAi` (`api/ai.ts`), `fetchDgStatus/saveDgToken/testDg` (`api/digitalgrid.ts`).

## Telas
- `/login` — `src/app/login/page.tsx` (publica, fora do shell).
- `/` (overview/cockpit) — `src/app/(dashboard)/page.tsx`.
- Todas as demais rotas do route group `(dashboard)` herdam o app-shell de `(dashboard)/layout.tsx`: `/executivo`, `/cadastros` (+ `clientes`, `conciliacao`, `contratos`, `distribuidoras`, `unidades`, `usinas`), `/configuracoes` (+ `integracoes`, `proposta-precos`, `senha`, `usuarios`), `/financeiro`, `/geracao`, `/analise`, `/mapa`, `/integracoes`, `/propostas` (+ `gerador`), `/rateio`, `/soliscloud`, `/usinas`.

## Regras de negocio
- Tema aplicado antes do primeiro paint para evitar flash: script inline no `<head>` le `localStorage["ascender-theme"]` e cai para `prefers-color-scheme`, senao `light` (layout.tsx:12,22). Explicita.
- `ThemeProvider` le o `data-theme` ja aplicado no `<html>`; se ausente, assume `dark` (theme.tsx:31). Explicita. OBSERVACAO: o fallback do provider (`dark`) difere do fallback do script anti-flash (`prefers-color-scheme` -> `light`) — divergencia real de default.
- Gate de sessao na borda: `/login` e `/api/auth/login` sao publicas; sem cookie, `/api/*` responde 401 e paginas redirecionam para `/login?next=<pathname>` (middleware.ts:11-27). Explicita.
- O middleware valida apenas a PRESENCA do cookie `ascender_session`, nao sua assinatura/validade; a validacao real e feita server-side por `getSession()`/`requireSession()` (defesa em profundidade) (middleware.ts:15; guard.ts:9-24). Explicita.
- Cookie de sessao: `httpOnly`, `sameSite: "lax"`, `maxAge` 8h, `secure` apenas quando `APP_BASE_URL` comeca com `https://` (session.ts:16-28; env.ts:31-32). Explicita.
- `SESSION_SECRET` deve ter no minimo 32 caracteres, senao lanca erro (env.ts:18-24). Explicita.
- Env vars sao lidas de forma lazy (so em runtime) para nao quebrar o build quando um segredo esta ausente (env.ts:1-13; db/index.ts:6-7). Explicita.
- Defaults de env: `LOGIN_EMAIL` -> `admin@ascender.com.br`; `APP_BASE_URL` -> `http://localhost:3000` (env.ts:25,27). Explicita.
- O front nunca fala direto com APIs externas; assinatura/segredo ficam no servidor e o browser so chama route handlers internos (api/soliscloud.ts:13-16). Explicita.
- Cache TTL e singleton por processo, adequado a UMA instancia; para multiplas replicas exige migrar para Redis (ttlCache.ts:1-3). Explicita (restricao). Consumido apenas por `soliscloud/client.ts`.
- `withSolis` exige sessao, retorna 409 `NOT_CONFIGURED` se faltam credenciais, 502 em `SolisApiError` e 500 em erro inesperado (handler.ts:11-49). Explicita.
- Assets em `/brand` (logos) sao servidos sem passar pelo gate (matcher exclui `brand`) para carregar na tela de login (middleware.ts:31-32). Explicita.
- Pacotes nativos `@node-rs/argon2`, `pg`, `pdf-parse` sao marcados server-only e nao empacotados pelo bundler (next.config.mjs:5). Explicita.
- HIPOTESE: o padrao de renderizacao adotado e Server Component async + `export const dynamic = "force-dynamic"` na maioria das paginas de dados (vistas em `page.tsx`, `financeiro`, `rateio`, `cadastros/*`, etc.), reservando `"use client"` para shell/providers e telas interativas — nao ha config global forcando isso, e convencao por arquivo.

## Dependencias
- Depende de:
  - Next.js 15 App Router, React 18.3 (`next`, `react`, `react-dom`).
  - `@tanstack/react-query` (estado de servidor no client, configurado em providers.tsx).
  - `iron-session` + `next/headers` (sessao — via `src/lib/auth/session.ts`).
  - `drizzle-orm` + `pg` (banco — via `src/lib/db/index.ts` e `schema.ts`).
  - `lucide-react` (icones da navegacao em `dashboard-data.ts` e no shell).
  - `src/lib/env.ts` (todas as leituras de config passam por aqui).
  - Componentes de UI do shell: `@/components/MobileNav`, `@/components/ConfirmProvider`, `@/components/ToastProvider` e `@/lib/dashboard-data` (lista `modules`, `viewTitles`, `viewSubtitles`).
- Consumido por:
  - Todas as telas do route group `(dashboard)` (herdam layout, providers e tema).
  - Todos os route handlers (`src/app/api/*`) que usam `requireSession`/`withSolis`.
  - Modulos de negocio (auth, cadastros, propostas, soliscloud, digitalgrid, financeiro, operacao) que consomem `getDb`, `env`, cache e os clients `api/*`.

## Riscos de alteracao
- O nome do cookie `SESSION_COOKIE = "ascender_session"` esta duplicado como literal em `middleware.ts:5` e `session.ts:14` (intencional, para nao arrastar `iron-session` ao bundle Edge). Renomear em um so lugar quebra o gate de autenticacao silenciosamente.
- Middleware so checa presenca do cookie: qualquer codigo que confie apenas no middleware para autorizar (sem `requireSession`/`getSession`) fica vulneravel a cookie forjado/expirado ainda presente.
- `ttlCache` e memoria de processo unico: rodar em multiplas replicas gera cache inconsistente e leituras desatualizadas da SolisCloud. Escalonar horizontalmente exige Redis.
- Divergencia de default de tema entre script anti-flash (`light`) e `ThemeProvider` (`dark`) pode reintroduzir flash/mismatch se o script for alterado.
- Remover `"use client"` de `providers.tsx` ou de `(dashboard)/layout.tsx` quebra hooks (`useState`, `usePathname`, `useTheme`).
- `serverExternalPackages` precisa ser atualizado ao adicionar novas dependencias nativas server-only, senao o build/bundle quebra.
- `env.getters` sao lazy e lancam em runtime: um segredo ausente so falha quando a rota e exercida (nao no build) — pode mascarar misconfig ate producao.
- Mexer no `matcher` do middleware pode expor rotas privadas ou bloquear assets (`/brand`, `_next`).

## Pendencias / a investigar
- A tarefa cita um route group `(auth)`, mas o codigo tem a area publica como segmento simples `src/app/login/` (nao ha diretorio `(auth)`). Confirmar se `(auth)` foi planejado/renomeado.
- Nao ha `error.tsx`, `not-found.tsx`, `loading.tsx` ou `template.tsx` observados nesta varredura (checar se existem em subrotas nao inspecionadas) — investigar tratamento global de erro/loading.
- `SessionData` ja modela `userId`/`roles` para RBAC futuro (session.ts:6-12), mas nao ha enforcement de roles no shell/middleware; confirmar se RBAC esta ativo em algum modulo.
- `globals.css` (~66 KB) nao foi lido em detalhe — e o design system que sustenta as classes do shell (`app-shell`, `sidebar`, `topbar`, `cockpit`...); documentar tokens/temas se necessario.
- Confirmar politica de cache/revalidacao: muitos `force-dynamic`, sem uso aparente de `revalidate`/ISR — validar se e intencional (dados sempre frescos).

## Fontes
- ascender-app/package.json
- ascender-app/next.config.mjs
- ascender-app/tsconfig.json
- ascender-app/src/middleware.ts
- ascender-app/src/app/layout.tsx
- ascender-app/src/app/providers.tsx
- ascender-app/src/app/(dashboard)/layout.tsx
- ascender-app/src/app/(dashboard)/page.tsx
- ascender-app/src/app/login/page.tsx
- ascender-app/src/lib/env.ts
- ascender-app/src/lib/theme.tsx
- ascender-app/src/lib/cache/ttlCache.ts
- ascender-app/src/lib/api/soliscloud.ts
- ascender-app/src/lib/api/ai.ts
- ascender-app/src/lib/api/digitalgrid.ts
- ascender-app/src/lib/db/index.ts
- ascender-app/src/lib/auth/session.ts
- ascender-app/src/lib/auth/guard.ts
- ascender-app/src/lib/soliscloud/handler.ts
- ascender-app/src/lib/soliscloud/client.ts (grep de consumidores do cache)
- ascender-app/src/lib/propostas/actions.ts (padrao "use server")
- ascender-app/src/lib/dashboard-data.ts (parcial)
