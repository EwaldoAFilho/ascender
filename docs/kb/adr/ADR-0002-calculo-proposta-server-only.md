# ADR-0002 — Cálculo de propostas no servidor (custo/margem nunca vão ao cliente)

## Contexto
O gerador de propostas foi portado de um site estático que expunha **custo, margem
e tabela de kit no código-fonte do navegador**. Esses dados são confidenciais e não
podem chegar ao cliente (nem no bundle client, nem no PDF).

## Decisão
Toda a matemática de **precificação** roda no **servidor**. Os módulos que contêm
custo/margem/kit levam `import "server-only"` no topo
(`ascender-app/src/lib/propostas/precificacao.ts`,
`ascender-app/src/lib/propostas/parametros.ts`). A geração é uma **Server Action**
(`ascender-app/src/lib/propostas/actions.ts`) que só retorna ao cliente o resultado
sem os campos sensíveis; o PDF do cliente não inclui custo/margem. O painel interno
de custo/margem é visível só ao staff logado (ver [ADR-0001](ADR-0001-login-unico-sem-rbac.md)).

## Consequências
- Custo/margem/kit **não entram** em chunks client compartilhados (validar com
  `grep` nos `.next/static/chunks`).
- A tela de configuração de preços (`configuracoes/proposta-precos`) envia os valores
  para o browser do staff (é o editor) — aceitável por estar autenticada.

## Alternativas consideradas
- Cálculo no client com ofuscação: rejeitado (não protege de verdade).

## Impacto no sistema
Mexer em `lib/propostas/precificacao.ts`/`parametros.ts` exige garantir que nenhum
componente `"use client"` os importe direta ou transitivamente.

## Data
2026-07-08
