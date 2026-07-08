# ADR-0006 — Premissas configuráveis e Fio B (Lei 14.300) no gerador

## Contexto
As premissas de engenharia/financeiras do gerador (Performance Ratio, degradação,
reajuste, CO₂, crédito do excedente) eram constantes fixas no código. O cenário
Telhado Rentável valorizava o excedente a um R$/kWh fixo, ignorando o **Fio B da Lei
14.300/2022**, que encarece a injeção de forma escalonada (15% em 2023 → 100% em
2029) e derruba o valor do crédito ano a ano — tornando o retorno otimista.

## Decisão
As premissas foram movidas para o objeto configurável `Premissas` dentro de
`parametros_proposta` (JSON, sem migração de coluna). O Fio B é modelado por
cronograma oficial aplicado sobre uma **tarifa Fio B configurável** (default `0`,
para não mudar números até a equipe informar o valor real). Funções puras recebem as
premissas por argumento (`ascender-app/src/lib/propostas/calcular.ts`,
`dimensionamento.ts`, `financeiro.ts`).

Regras-chave (ver `calcular.ts`):
- `autoconsumo = min(geração, consumo)` à tarifa cheia; a sobra é **excedente**
  creditado ao crédito unitário (aplicado tanto no Necessário quanto no Rentável).
- `creditoUnitarioReal(ano) = max(0, creditoBase − tarifaFioB × fioBPercentual(ano))`.
- `fioBPercentual` retorna 0 para anos anteriores a `anoBaseFioB`; senão o cronograma
  (clamp no último valor).

## Consequências
- Com `tarifaFioB = 0`, os números permanecem equivalentes ao gerador original.
- Com Fio B > 0, o retorno do Rentável cai e o payback sobe (correto).
- Premissas são client-safe (não são custo) — mas nenhum preço de kit/margem pode
  entrar no bundle client (ver [ADR-0002](ADR-0002-calculo-proposta-server-only.md)).

## Alternativas consideradas
- Manter constantes fixas: rejeitado (exigia deploy a cada ajuste e ignorava Fio B).

## Impacto no sistema
`lib/propostas/*`, tela `configuracoes/proposta-precos`. Alterar as fórmulas muda
número exibido ao cliente — exige aval da engenharia.

## Data
2026-07-08
