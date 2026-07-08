# Decisões arquiteturais

As decisões formais ficam como **ADRs** em [`../adr/`](../adr/). Índice:

| ADR | Decisão |
|---|---|
| [ADR-0001](../adr/ADR-0001-login-unico-sem-rbac.md) | Login único compartilhado, sem RBAC |
| [ADR-0002](../adr/ADR-0002-calculo-proposta-server-only.md) | Cálculo de propostas no servidor (custo/margem nunca vão ao cliente) |
| [ADR-0003](../adr/ADR-0003-arquitetura-sync-first.md) | Arquitetura sync-first (workers → banco; telas leem do banco) |
| [ADR-0004](../adr/ADR-0004-migracoes-drizzle-no-boot.md) | Migrações Drizzle aplicadas no boot do container |
| [ADR-0005](../adr/ADR-0005-deploy-por-polling.md) | Deploy por polling na VPS |
| [ADR-0006](../adr/ADR-0006-premissas-configuraveis-fio-b.md) | Premissas configuráveis e Fio B (Lei 14.300) no gerador |

Para registrar uma nova decisão: crie `../adr/ADR-000X-titulo.md` (template em
`/create-adr` no [`CLAUDE.md`](../../../CLAUDE.md)) e adicione a linha aqui.
