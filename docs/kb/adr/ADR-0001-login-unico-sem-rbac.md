# ADR-0001 — Login único compartilhado, sem RBAC

## Contexto
O ASCENDER é uma ferramenta **interna** usada por uma equipe pequena; todos os
usuários são staff com o mesmo nível de acesso. Não há, hoje, necessidade de
diferenciar papéis/permissões.

## Decisão
Autenticação por **login único compartilhado** via `iron-session` (cookie
criptografado). O admin é criado por seed idempotente
(`ascender-app/src/lib/db/seed.ts`) a partir de `LOGIN_EMAIL`/`LOGIN_PASSWORD`.
Senha com `@node-rs/argon2`. **Não há RBAC** — qualquer sessão autenticada acessa
tudo. Rotas protegidas checam apenas `getSession().authenticated`.

## Consequências
- Simplicidade: a confidencialidade de custo/margem é resolvida "de graça" por
  estar atrás de login (ver [ADR-0002](ADR-0002-calculo-proposta-server-only.md)).
- Não é possível esconder telas/dados de subconjuntos de usuários.
- Painéis internos (ex.: custo/margem do gerador) ficam visíveis a todo staff logado.

## Alternativas consideradas
- RBAC por papéis: descartado por ora (overhead sem necessidade real).

## Impacto no sistema
Auth em `ascender-app/src/lib/auth/`, rotas `ascender-app/src/app/api/auth/*`.
Qualquer feature que precise de visibilidade diferenciada exigirá introduzir RBAC.

## Data
2026-07-08
