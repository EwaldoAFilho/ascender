# Modulo: Autenticacao & Autorizacao

> Status: completo  ·  Ultima analise: 2026-07-09  ·  Confianca: alta
> Codigo: ascender-app/src/lib/auth/session.ts, ascender-app/src/lib/auth/guard.ts, ascender-app/src/lib/auth/rbac.ts, ascender-app/src/lib/auth/tenant.ts, ascender-app/src/lib/auth/platform.ts, ascender-app/src/lib/auth/platform-actions.ts, ascender-app/src/lib/auth/users.ts, ascender-app/src/lib/auth/actions.ts, ascender-app/src/middleware.ts, ascender-app/src/app/api/auth/login/route.ts, ascender-app/src/app/api/me/route.ts, ascender-app/src/app/api/auth/logout/route.ts, ascender-app/src/app/api/auth/password/route.ts, ascender-app/src/app/login/page.tsx, ascender-app/src/lib/db/seed.ts, ascender-app/src/lib/crypto/secrets.ts, ascender-app/src/lib/env.ts

## Visao geral
Controla quem entra na aplicacao ASCENDER e mantem a sessao. Usa `iron-session` (cookie cifrado/assinado, sem tabela de sessoes) sobre uma tabela `usuarios` com senhas em hash argon2. O gating de rota e feito em camadas: o `middleware.ts` (Edge) bloqueia por presenca do cookie (libera `/login`, `/api/auth/login` e `/api/health`), e `requireSession`/`ensureAuth` revalidam a sessao em route handlers e server actions.

> **Atualizado nas Fases 4–8 (SaaS multi-tenant, ver [ADR-0007](../adr/ADR-0007-multi-tenancy-shared-db-rls.md)):**
> - **RBAC por tenant** (Fase 4): papeis `owner > admin > operador > leitura` em `tenant_memberships`; `rbac.ts` (`getSessionRole`, `roleAtLeast`, `requireRole`, `requireRoleResponse`) revalida no banco. O campo `roles` da sessao continua legado/nao usado.
> - **Operador da PLATAFORMA** (Passo 1, `platform.ts`): flag `usuarios.is_platform_admin` (staff Ascender) — nivel ACIMA do RBAC por-tenant. Administra TODOS os tenants no painel `/plataforma` (cross-tenant, roda FORA de `withSessionTenant`). Guards: `requirePlatformAdmin` (actions), `requirePlatformAdminPage` (paginas → redirect). `/api/me` alimenta o link do nav.
> - **Controle de ACESSO por status do tenant** (Passo 1, no login): `tenants.status` = `pendente | trial | ativo | suspenso | cancelado`; so `trial`/`ativo` entram (os demais → 403 com mensagem). O operador da plataforma nunca e bloqueado por status. *Limitacao conhecida: sessoes ativas nao sao revalidadas por request — suspender um tenant so bloqueia novos logins (a sessao vigente expira em ate 8h).*
> - **Autocadastro publico** (Passo 2, `/signup` + `signup-actions.ts`): rota PUBLICA (sem sessao, liberada no `middleware`) que cria a empresa com status `pendente` + dono via `criarEmpresaComDono` (atomico). O dono so acessa apos o operador aprovar. Defesas de endpoint publico: honeypot, `.max()` nos campos, rate-limit por IP (5/h) + teto global (`auth/rate-limit.ts`, in-memory), e erro do banco nao vaza cru (`db/erros.ts`). *Falta captcha; rate-limit e por-processo (Redis com replicas).*

## Responsabilidades
- Autenticar e-mail + senha contra a tabela `usuarios` (somente ativos) usando argon2 (`verifyLogin`).
- Criar/gravar/destruir a sessao via `iron-session` cookie `ascender_session` (`getSession`, `session.save()`, `session.destroy()`).
- Guardar rotas: `middleware.ts` (checagem leve por cookie) + `requireSession` (401 em APIs) + `ensureAuth` (server actions).
- Gerir usuarios (CRUD): criar, atualizar, listar, excluir, ativar/desativar — `lib/auth/users.ts` + `lib/auth/actions.ts`.
- Troca de senha do proprio usuario logado (`PUT /api/auth/password`), exigindo senha atual.
- Hash de senhas com argon2 (`hash`) na criacao, edicao e troca de senha.
- Seed idempotente do administrador inicial a partir de `LOGIN_EMAIL`/`LOGIN_PASSWORD` (`seed.ts`).

## Principais arquivos
| Caminho | Papel |
| --- | --- |
| ascender-app/src/lib/auth/session.ts | Define `SessionData`, `SESSION_COOKIE`, opcoes do cookie e `getSession()` (iron-session). |
| ascender-app/src/lib/auth/guard.ts | `requireSession()` — retorna sessao ou `NextResponse` 401; defesa em profundidade para route handlers. |
| ascender-app/src/lib/auth/users.ts | Acesso a tabela `usuarios`: `verifyLogin`, `getUsuario`, `verifyUserPassword`, `setUserPassword`, `listUsuarios`, `emailEmUso`, `countAtivos`, `createUsuario`, `updateUsuario`, `deleteUsuario`. Hash/verify argon2. |
| ascender-app/src/lib/auth/actions.ts | Server actions `salvarUsuario`, `excluirUsuario` + `ensureAuth` local. Validacao zod e regras de negocio de usuario. |
| ascender-app/src/middleware.ts | Middleware Edge: libera `/login` e `/api/auth/login`; exige cookie `ascender_session`; APIs -> 401, paginas -> redirect `/login?next=`. |
| ascender-app/src/app/api/auth/login/route.ts | `POST` — valida body (zod), `verifyLogin`, grava sessao. |
| ascender-app/src/app/api/auth/logout/route.ts | `POST` — `session.destroy()`. |
| ascender-app/src/app/api/auth/password/route.ts | `PUT` — troca de senha do usuario logado (confere senha atual, minimo 8). |
| ascender-app/src/app/login/page.tsx | Tela de login (client) que chama `/api/auth/login` e redireciona para `next` ou `/`. |
| ascender-app/src/lib/db/seed.ts | Seed do admin inicial (idempotente por contagem de usuarios). |
| ascender-app/src/lib/env.ts | `sessionSecret()` (>=32 chars), `cookieSecure()`, `loginEmail/loginPassword`, etc. |
| ascender-app/src/lib/crypto/secrets.ts | AES-256-GCM para segredos de integracao (nao para senhas). Relacionado, nao e o core de auth. |

## Entidades / tabelas
- `usuarios` (`ascender-app/src/lib/db/schema.ts:56`): `id` uuid PK, `nome` text, `email` text UNIQUE, `senha_hash` text (argon2), `ativo` boolean default true, `created_at`, `updated_at`. Comentario no schema: "multiusuario; todos com acesso total nesta fase". Tipo exportado `Usuario` (`schema.ts:574`).
- `app_settings` (`schema.ts:47`): kv legado; comentario cita `login_email` e `login_password_hash` do MVP de login unico. Nao e lido pelo fluxo de auth atual (HIPOTESE: legado/nao usado por este modulo).
- Sessao NAO e persistida em banco — vive no cookie cifrado (`iron-session`).

## Endpoints / Server Actions
Route handlers (todos `runtime = "nodejs"`):
- `POST /api/auth/login` — `login/route.ts::POST`. Body `{ email, password }`; sucesso grava `authenticated/userId/email/loginAt`.
- `POST /api/auth/logout` — `logout/route.ts::POST`. Destroi a sessao.
- `PUT /api/auth/password` — `password/route.ts::PUT`. Body `{ currentPassword, newPassword(min 8) }`; confere senha atual via `verifyUserPassword`.

Server actions (`ascender-app/src/lib/auth/actions.ts`, `"use server"`):
- `salvarUsuario(input)` — cria ou atualiza usuario; valida via zod; `revalidatePath("/configuracoes/usuarios")`.
- `excluirUsuario(id)` — remove usuario.

Guards reutilizaveis:
- `requireSession()` (`guard.ts`) — usado em ~14 route handlers de integracoes/soliscloud/financeiro (ex.: `api/integrations/*`, `api/soliscloud/*`, `api/financeiro/conta`).
- `ensureAuth()` — reimplementado localmente em `lib/auth/actions.ts:17` e tambem em `lib/cadastros/actions.ts:33` (padrao duplicado).

## Telas
- `/login` — `ascender-app/src/app/login/page.tsx` (publica).
- `/configuracoes/usuarios` — `ascender-app/src/app/(dashboard)/configuracoes/usuarios/page.tsx` (CRUD via `salvarUsuario`/`excluirUsuario`/`listUsuarios`).
- `/configuracoes/senha` — `ascender-app/src/app/(dashboard)/configuracoes/senha/page.tsx` (troca de senha via `PUT /api/auth/password`).
- Logout disparado pela UI: `src/app/(dashboard)/layout.tsx:78` e `src/components/MobileNav.tsx:65` (POST em `/api/auth/logout`).

## Regras de negocio
Explicitas (com fonte):
- Cookie de sessao expira em 8 horas: `maxAge: 60*60*8` (`session.ts:24`). `httpOnly: true`, `sameSite: "lax"`, `path: "/"`.
- Cookie `secure` somente quando `APP_BASE_URL` comeca com `https://` (`env.ts:31`, usado em `session.ts:22`).
- `SESSION_SECRET` deve ter >= 32 caracteres, senao lanca erro (`env.ts:18-24`).
- Login so autentica usuario existente E `ativo` (`users.ts:29`).
- E-mail normalizado (trim + lowercase) na busca e persistencia (`users.ts:6`, `norm`).
- E-mail e UNIQUE no banco e checado por `emailEmUso` antes de salvar (`users.ts:69`, `actions.ts:45`).
- Senha minima de 8 caracteres: criacao (`actions.ts:65`), edicao com troca (`actions.ts:60`), troca de senha (`password/route.ts:10` schema `min(8)`).
- Troca de senha exige senha atual correta (`password/route.ts:27` `verifyUserPassword`).
- Nao e possivel desativar o proprio usuario (`actions.ts:51`).
- Nao e possivel excluir o proprio usuario (`actions.ts:82`).
- Deve haver ao menos um usuario ativo — bloqueia desativar/excluir o ultimo ativo (`actions.ts:56`, `actions.ts:86`, via `countAtivos`).
- Seed cria o admin apenas se NAO houver nenhum usuario; nunca sobrescreve (`seed.ts:21`). Nome fixo "Administrador"; e-mail default `admin@ascender.com.br` se `LOGIN_EMAIL` ausente; nao cria sem `LOGIN_PASSWORD` (`seed.ts:26`).

Implicitas / observacoes:
- Ausencia de RBAC: qualquer sessao com `authenticated: true` acessa tudo. Nenhum ponto le/escreve `session.roles` (campo declarado em `SessionData` mas nao populado no login). Comentario no schema confirma "todos com acesso total nesta fase".
- Middleware valida apenas PRESENCA do cookie (`request.cookies.has(SESSION_COOKIE)`, `middleware.ts:15`), nao a validade/assinatura — a validacao real e adiada para `getSession`/`requireSession`. HIPOTESE: paginas que nao chamem `requireSession` no server confiam so na presenca do cookie.
- HIPOTESE: o hash argon2 usa parametros default de `@node-rs/argon2` (nenhum custo/config e passado em `hash()`).
- HIPOTESE: nao ha rate limiting nem lockout no login (`login/route.ts` nao tem contagem de tentativas).
- Redirect pos-login so aceita `next` que comece com `/` (evita open redirect) — `login/page.tsx:30`.

## Dependencias
- Depende de:
  - `iron-session` (^8.0.4) — sessao em cookie.
  - `@node-rs/argon2` (^2.0.2) — hash/verify de senha.
  - `zod` — validacao de payloads.
  - `drizzle-orm` + `@/lib/db` (`getDb`) — acesso a tabela `usuarios`.
  - `@/lib/env` — `sessionSecret`, `cookieSecure`, `loginEmail/loginPassword`.
  - `next/headers` (`cookies()`), `next/server` (middleware/NextResponse), `next/cache` (`revalidatePath`).
- Consumido por:
  - Middleware global (todas as rotas exceto assets/`/brand`, `matcher` em `middleware.ts:32`).
  - Route handlers de integracoes e dados: `api/integrations/{soliscloud,ai,digitalgrid}/*`, `api/soliscloud/*`, `api/financeiro/conta*` (via `requireSession`).
  - Server actions de dominio: `lib/propostas/actions.ts`, `lib/cadastros/actions.ts`, `lib/cadastros/historico.ts` (via `getSession`/`ensureAuth`).
  - Telas de configuracao (usuarios, senha) e layout do dashboard (logout).

## Riscos de alteracao
- `SESSION_COOKIE` esta duplicado como literal em `middleware.ts:5` e `session.ts:14` (proposital, para nao arrastar iron-session ao bundle Edge). Renomear em um lugar e esquecer o outro quebra todo o gating.
- Middleware so checa presenca do cookie: se uma pagina renderizar dados sensiveis sem chamar `requireSession`, um cookie qualquer (mesmo invalido) passa pelo middleware. Ao adicionar rotas, garantir revalidacao server-side.
- Trocar `SESSION_SECRET` invalida todas as sessoes existentes (cookies deixam de decifrar); trocar parametros/algoritmo de hash argon2 pode invalidar senhas ja gravadas.
- Reduzir `maxAge` ou mudar `sameSite`/`secure` afeta logins ativos; `cookieSecure` atrelado ao prefixo `https://` de `APP_BASE_URL` — configurar errado em producao deixa o cookie sem `Secure`.
- Regras "ultimo usuario ativo" e "nao desativar/excluir a si mesmo" estao apenas na server action `actions.ts`; qualquer novo caminho de escrita em `usuarios` (script, outra action) as ignora.
- `ensureAuth` esta duplicado (auth/actions.ts e cadastros/actions.ts) — divergencia futura silenciosa.
- Campo `roles` em `SessionData` sugere RBAC mas nao ha enforcement; introduzir permissoes exige tocar login, guard e todas as rotas.

## Pendencias / a investigar
- Confirmar se `app_settings` (`login_email`/`login_password_hash`) ainda e lido em algum ponto ou e puramente legado do login unico. Grep indicou uso do modulo apenas via tabela `usuarios`.
- Parametros exatos do argon2 (memoria/tempo/paralelismo) nao estao explicitos — usa defaults da lib; confirmar se ha config global.
- Nao ha rotacao/expiracao server-side de sessao alem do `maxAge` do cookie; verificar se `loginAt` e usado para expirar sessao em algum lugar (nao encontrado).
- Ausencia de rate limiting/lockout de login e de CSRF explicito (mitigado por `sameSite: lax`) — validar se e requisito.
- Confirmar se alguma pagina do `(dashboard)` depende so do middleware (sem `requireSession`) para proteger dados.

## Fontes
- ascender-app/src/lib/auth/session.ts
- ascender-app/src/lib/auth/guard.ts
- ascender-app/src/lib/auth/users.ts
- ascender-app/src/lib/auth/actions.ts
- ascender-app/src/lib/crypto/secrets.ts
- ascender-app/src/lib/db/seed.ts
- ascender-app/src/lib/env.ts
- ascender-app/src/middleware.ts
- ascender-app/src/app/api/auth/login/route.ts
- ascender-app/src/app/api/auth/logout/route.ts
- ascender-app/src/app/api/auth/password/route.ts
- ascender-app/src/app/login/page.tsx
- ascender-app/src/app/(dashboard)/configuracoes/senha/page.tsx (parcial)
- ascender-app/src/app/(dashboard)/configuracoes/usuarios/page.tsx (parcial, via grep)
- ascender-app/src/lib/db/schema.ts (bloco usuarios/app_settings)
- package.json (versoes iron-session, @node-rs/argon2)
