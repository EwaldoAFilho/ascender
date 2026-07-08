# Fluxo: geração de uma proposta

Ponta a ponta, quando o staff gera uma proposta no gerador. Módulo:
[`../modulos/propostas-gerador.md`](../modulos/propostas-gerador.md).

1. **Tela** `/(dashboard)/propostas/gerador` (`GeradorProposta.tsx`, `"use client"`).
   O usuário informa cliente (campo **livre** — cadastrado ou novo), consumo, tarifa,
   HSP, telhados, etc. Opções de cliente/UC/distribuidora vêm do server component
   `page.tsx` (`opcoesClientes/opcoesUnidades/opcoesDistribuidoras`).
2. **Server Action** `gerarProposta(input)` (`lib/propostas/actions.ts`):
   - `getSession()` → exige autenticação;
   - valida com **Zod** (`gerarSchema`);
   - resolve o cliente: se o nome casar (case-insensitive) com `clientes.nome`,
     vincula `clienteId`; senão guarda `clienteNomeLivre` (clienteId nulo).
3. **Parâmetros**: `carregarParametros()` (`parametros.ts`, server-only) lê a linha
   única `parametros_proposta` e faz merge sobre `PARAMETROS_PADRAO`.
4. **Cálculo** `gerarResultado(input, parametros, ano)` (`calcular.ts`, server-only):
   - dimensiona (`dimensionamento.ts`), precifica (`precificacao.ts`, **custo/margem
     SENSÍVEL**), calcula financeiro (`financeiro.ts`) e aplica **Fio B**
     (ver [ADR-0006](../adr/ADR-0006-premissas-configuraveis-fio-b.md));
   - monta dois cenários: **Sistema Necessário** e **Telhado Rentável**.
5. **Persistência**: insere em `propostas` com os KPIs, os campos sensíveis
   (`custoTotal`/`margemValor`/`margemPercent`) e `dadosGerador` (snapshot input+resultado).
6. **Retorno ao client**: o `GeradorResultado` volta para a tela (KPIs, gráficos
   Recharts). O painel de custo/margem só aparece ao staff logado.
7. **PDF** (`pdf.ts`, client-side): `baixarPropostaPdf` gera o PDF **sem** custo/margem.

## Regras críticas
- Custo/margem/kit **nunca** ao cliente (ver [ADR-0002](../adr/ADR-0002-calculo-proposta-server-only.md)).
- `autoconsumo = min(geração, consumo)` à tarifa cheia; sobra = excedente ao crédito.
- Com `tarifaFioB = 0`, resultado equivale ao gerador original.
