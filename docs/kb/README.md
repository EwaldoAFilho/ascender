# Base de Conhecimento (KB) — ASCENDER

Documentação viva da aplicação para acelerar manutenção e reduzir alucinação de
IAs. **Consulte antes de alterar código; atualize depois.** Regras de uso em
[`../../CLAUDE.md`](../../CLAUDE.md).

> A informação aqui reflete o código no momento da análise (ver `manifest.json`).
> Sempre confirme contra o código atual antes de afirmar como fato.

## Como usar

1. **Antes de mexer:** leia o(s) doc(s) do módulo em [`modulos/`](modulos/) e o
   [`cobertura.json`](cobertura.json) (status/confiança). Faça análise de impacto.
2. **Depois de mexer:** atualize os docs tocados, o `cobertura.json` (status +
   `ultima_analise`) e rode `python3 scripts/kb/gen_manifest.py`. Registre pendências.
3. Decisão arquitetural nova → ADR em [`adr/`](adr/).

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| [`modulos/`](modulos/) | Um doc por subsistema (arquitetura, auth, propostas, integrações, ...) |
| [`entidades/`](entidades/) | Modelo de dados — tabelas do Postgres |
| [`contratos/`](contratos/) | Contratos de API (Server Actions, rotas /api, integrações externas) |
| [`fluxos/`](fluxos/) | Fluxos de negócio ponta a ponta |
| [`telas/`](telas/) | Telas relevantes |
| [`integracoes/`](integracoes/) | SolisCloud, Digital Grid, IA |
| [`decisoes/`](decisoes/) · [`adr/`](adr/) | Decisões arquiteturais |
| [`runbooks/`](runbooks/) | Como rodar, deployar, investigar |
| [`riscos/`](riscos/) · [`pendencias/`](pendencias/) · [`regras-negocio/`](regras-negocio/) | Riscos, itens a investigar, regras extraídas |

## Arquivos de controle

- [`cobertura.json`](cobertura.json) — status de documentação por módulo
  (`nao_mapeado` \| `parcial` \| `completo` \| `desatualizado`), riscos e pendências.
- [`manifest.json`](manifest.json) — documentos da KB, hashes, data e código analisado.

## Ferramentas (`scripts/kb/`)

```bash
python3 scripts/kb/check_links.py     # valida links internos da KB
python3 scripts/kb/drift.py           # aponta código sem cobertura / docs desatualizadas
python3 scripts/kb/gen_manifest.py    # regera manifest.json
```

## Convenções

- PT-BR, objetivo, rastreável. Sempre com **caminho real do código**.
- Não inventar regra de negócio — o incerto é **hipótese** ou vai para `pendencias/`.
- Marcar `> Confiança: alta|media|baixa` no topo de cada doc de módulo.
