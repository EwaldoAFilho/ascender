# Modulo: Propostas & Gerador FV

> Status: completo  ·  Ultima analise: 2026-07-08  ·  Confianca: alta
> Codigo: ascender-app/src/lib/propostas/, ascender-app/src/app/(dashboard)/propostas/, ascender-app/src/app/(dashboard)/configuracoes/proposta-precos/

## Visao geral
Gerador de propostas fotovoltaicas: recebe consumo, tarifa, irradiacao (HSP) e dimensoes de telhado e produz dois cenarios (Sistema Necessario e Telhado Rentavel) com dimensionamento de modulos/inversor, precificacao (custo + margem) e analise financeira (payback, TIR, projecao 25 anos, CO2). Existe para tirar a precificacao do gerador estatico antigo (Moreira Camargo Eng.) e roda-la no servidor, garantindo que custo, margem e tabela de kit nunca cheguem ao navegador nem ao PDF do cliente. A tabela de precos/margem/premissas e configuravel em tela e persistida no banco (linha unica JSON). Inclui Fio B da Lei 14.300/2022 no credito do excedente e geracao de PDF branded client-side.

## Responsabilidades
- Dimensionar o sistema pelo consumo (nº de modulos, potencia kWp) com Performance Ratio e margem de seguranca.
- Empacotar telhados retangulares (retrato vs paisagem) e escolher o inversor (string/micro; 3+ telhados forca micro).
- Precificar (SERVER-ONLY): kit por faixa de kWp, mao de obra, materiais AC, estrutura de solo, adequacao trifasica, imposto e margem.
- Calcular financeiro: economia/receita mensal, payback (simples e por fluxo), TIR (bissecao), projecao 25 anos, CO2 evitado.
- Aplicar Fio B (Lei 14.300) reduzindo o credito unitario do excedente ano a ano.
- Persistir a proposta gerada (com snapshot completo) e permitir cliente livre (nao cadastrado).
- Gerar PDF branded para o cliente sem dados sensiveis.
- Gerenciar os parametros configuraveis (custo/margem/premissas/kit) via tela de configuracoes.

## Principais arquivos
| Caminho | Papel |
|---|---|
| ascender-app/src/lib/propostas/types.ts | Tipos compartilhados (client-safe): `ParametrosProposta`, `Premissas`, `FaixaKit`, `GeradorInput`, `CenarioResultado`, `CustoDetalhado`, `GeradorResultado`. |
| ascender-app/src/lib/propostas/constantes.ts | Constantes de engenharia client-safe: `PR`, `SEG`, `DEG`, `REA`, `CO2F`, `TEXC`, `CRONOGRAMA_FIOB_PADRAO`, `MODS`, `FMES`, opcoes de HSP/compensacao/adequacao. |
| ascender-app/src/lib/propostas/dimensionamento.ts | Engenharia sem custo: `geracaoPorKwpMes`, `dimensionarPorConsumo`, `empacotarTelhado`, `totalTelhados`, `resolverInversor`, `calcularInversor`. |
| ascender-app/src/lib/propostas/precificacao.ts | SENSIVEL. `faixaKit`, `precoKitPorKwp`, `trifasicoObrigatorio`, `calcularCusto` (custo + margem). Server-only. |
| ascender-app/src/lib/propostas/parametros.ts | SENSIVEL, server-only. `PARAMETROS_PADRAO` (defaults do gerador antigo) e `carregarParametros()` (le `parametros_proposta`, merge sobre defaults, nunca lanca). |
| ascender-app/src/lib/propostas/financeiro.ts | Client-safe (opera sobre preco final): `payback`, `paybackPorFluxo`, `tirPorFluxo`, `projecaoPorFluxo`, `co2Evitado`, `geracaoMensalPorMes`. |
| ascender-app/src/lib/propostas/calcular.ts | Orquestrador (SENSIVEL, server-only): `gerarResultado`, `fioBPercentual`, `creditoUnitarioReal`, `montarCenario`. Monta os dois cenarios. |
| ascender-app/src/lib/propostas/actions.ts | Server actions: `gerarProposta` (valida, calcula, persiste) e `salvarParametrosProposta`. |
| ascender-app/src/lib/propostas/pdf.ts | PDF branded client-side (jspdf + autotable). `baixarPropostaPdf`, `linhasCenario`. So dados client-safe. |
| ascender-app/src/app/(dashboard)/propostas/gerador/GeradorProposta.tsx | UI "use client" do gerador: formulario, chamada da action, resultado, graficos (recharts), toggle de custos internos, disparo do PDF. |
| ascender-app/src/app/(dashboard)/propostas/gerador/page.tsx | Server component da rota do gerador; carrega opcoes de cliente/UC/distribuidora. |
| ascender-app/src/app/(dashboard)/propostas/page.tsx | Lista/CRUD manual de propostas + KPIs; link para o gerador. |
| ascender-app/src/app/(dashboard)/configuracoes/proposta-precos/page.tsx | Server component da config; `carregarParametros()` e renderiza o form. |
| ascender-app/src/app/(dashboard)/configuracoes/proposta-precos/ParametrosForm.tsx | UI "use client" da tela Precos & Margem (kit, custos, premissas, Fio B). |

## Entidades / tabelas
| Tabela (real) | Uso |
|---|---|
| `propostas` (schema.ts:355) | Proposta gerada/manual. Campos do gerador: `cenario`, `potenciaKwp`, `moduloWp`, `qtdModulos`, `inversorTipo`, `geracaoMensalKwh`, `precoFinal`, `precoPorKwp`, `paybackAnos`, `tirPercent`, `economia25Anos`, `co2Toneladas`. Sensiveis: `custoTotal`, `margemValor`, `margemPercent`. `dadosGerador` (jsonb) = snapshot input+resultado. `clienteId` nullable + `clienteNomeLivre` (cliente livre). |
| `parametros_proposta` (schema.ts:408) | Linha unica; coluna `dados` (jsonb) com todo o `ParametrosProposta` (kit, custos, margens, premissas, Fio B). |
| `clientes` | Match case-insensitive do nome livre em `gerarProposta` para vincular `clienteId`; join em `listPropostas`. |
| `unidadesConsumidoras` | FK opcional `unidadeConsumidoraId`. |
| `distribuidoras` | FK opcional `distribuidoraId`; nome usado como concessionaria no PDF. |

## Endpoints / Server Actions
Nao ha rotas de API REST. Tudo via Server Actions ("use server"):
- `gerarProposta(input)` — actions.ts:58. Autentica (`getSession`), valida (`gerarSchema` zod), `carregarParametros()`, `gerarResultado(...)`, resolve cliente livre vs cadastrado, insere em `propostas` (com snapshot `dadosGerador`), `revalidatePath("/propostas")`. Retorna `{ ok, id, resultado }`.
- `salvarParametrosProposta(input)` — actions.ts:176. Autentica, valida (`parametrosSchema`/`premissasSchema`), ordena `kit` por `kwpMax`, faz upsert (linha unica) em `parametros_proposta`, `revalidatePath` de `/configuracoes/proposta-precos` e `/propostas/gerador`.
- Cadastro manual de proposta usa `saveProposta`/`deleteProposta` de `src/lib/cadastros/actions.ts` (fora deste modulo, mas consome a tabela `propostas`).

## Telas
- `/propostas/gerador` — gerador (dimensionamento). Server: `gerador/page.tsx`; client: `GeradorProposta.tsx`.
- `/propostas` — lista/CRUD de propostas + KPIs (`propostas/page.tsx`).
- `/configuracoes/proposta-precos` — tela "Preços & Margem" (aba em configuracoes/layout.tsx:8). Server: `proposta-precos/page.tsx`; client: `ParametrosForm.tsx`.
Todas envoltas em `DesktopOnly` (o gerador e a lista sao desktop-only).

## Regras de negocio
Explicitas (com arquivo:linha):
- Dimensionamento por consumo: `modulos = ceil(consumoKwh * compensacaoPct * 1000 / moduloWp / (hsp*PR*30*SEG))` — dimensionamento.ts:31. Geracao por kWp/mes = `hsp * PR * 30` (dimensionamento.ts:15).
- Empacotamento: escolhe max(retrato, paisagem) e aplica fator de aproveitamento (`floor(bruto * f/100)`) — dimensionamento.ts:45-49.
- Inversor: 3+ telhados validos forca micro; senao respeita forcado ou usa string — dimensionamento.ts:81-88. Micro = `ceil(kwp/2.5)` unidades de 2,5kW; disjuntor mono `pot/(220*0.9)` (dimensionamento.ts:95-106). String: faixas fixas 10kW (<=15kWp), 15kW (<=22,5kWp), senao `ceil(kwp/1.5)`; disjuntor tri `pot/(sqrt3*220*0.9)` (dimensionamento.ts:110-120).
- Faixa de kit = primeira cujo `kwpMax` cobre o kWp; acima da ultima usa a ultima — precificacao.ts:10-15.
- Preco/kWp: base micro/string da faixa + ajuste; se solo, desconta `soloDescontoKitKwp` — precificacao.ts:18-28.
- Custo: `kit = kwp*precoPorKwp`; `estruturaSolo = qtdModulos*estruturaSoloPorModulo` (so solo); `maoDeObra = kwp*maoDeObraKwp`; `materiaisAc = max(materialAcMin, kwp*materialAcKwp)`; imposto incide sobre (maoDeObra+materiaisAc+adequacao+estruturaSolo) — NAO sobre o kit; `precoFinal = custoTotal*(1+margem/100)` — precificacao.ts:47-58.
- Margem distinta por cenario: `margemPercent` (Necessario) vs `margemPercentRentavel` (Rentavel) — calcular.ts:143, 185.
- Trifasico obrigatorio = flag `trifasicoObrigatorio` da faixa do sistema necessario — precificacao.ts:31-33; banner "acima de 14 kWp" na UI (GeradorProposta.tsx:569, texto fixo).
- Economia Necessario: `autoconsumo = min(geracao, consumo)` a tarifa cheia + `excedente = max(0, geracao-consumo)` ao credito unitario liquido do Fio B — calcular.ts:149-155.
- Receita Rentavel: `autoconsumoTelhado = min(geracaoTelhado, consumo)` a tarifa cheia + `excedente` ao credito unitario — calcular.ts:120-126, 190-201.
- Fio B (Lei 14.300): fracao por ano-calendario a partir de `anoBaseFioB` (default 2023, cronograma 15/30/45/60/75/90/100%); antes do ano-base = 0; apos o fim mantem 100% (ultimo valor) — calcular.ts:33-39, constantes.ts:18-19. Credito unitario liquido = `max(0, creditoExcedenteBaseKwh - tarifaFioB*fracaoFioB)` — calcular.ts:43-45. Com `tarifaFioB=0` (default) o Fio B nao reduz nada.
- Payback: Necessario usa payback simples (`preco/retornoMensal/12`); Rentavel usa payback por fluxo (cruzamento acumulado x investimento, interpolado) — calcular.ts:81-83, financeiro.ts:10-31.
- TIR: bissecao 60 iteracoes sobre 25 anos de fluxo — financeiro.ts:34-52.
- Fluxo anual aplica crescimento tarifario `(1+reajuste)^(t-1)` e degradacao `(1-degradacao)^(t-1)` — calcular.ts:129-130, 155, 200.
- CO2 evitado = `geracaoAnual*25*(1-degradacao)*co2PorKwh/1000` — financeiro.ts:74-81.
- Cliente livre: match case-insensitive por `lower(nome)`; se casar vincula `clienteId`, senao grava `clienteNomeLivre` — actions.ts:88-94.
- `carregarParametros` nunca lanca: qualquer falha -> `PARAMETROS_PADRAO`; merge profundo de premissas e kit para linhas antigas — parametros.ts:66-88.
- `salvarParametros` ordena `kit` por `kwpMax` antes de salvar (a busca de faixa depende da ordem) — actions.ts:184-187.
- PDF/bundle client-safe: `PdfCenario`/`PdfProposta` nao tem custo, margem nem kit; PDF so recebe preco final e engenharia/financeiro — pdf.ts:6-34, 69-156.
- `finito()` converte Infinity -> null antes de gravar KPIs no banco — actions.ts:54-56, 114-122.

Implicitas / inferidas:
- HIPOTESE: `FMES` (fatores sazonais Jan..Dez, constantes.ts:28) sao valores fixos herdados do gerador antigo, nao configuraveis nem regionais.
- HIPOTESE: HSP oferecido como select por regiao (constantes.ts:35-45) sao medias fixas; nao ha lookup real por cidade/coordenada.
- HIPOTESE: o campo `padrao` (mono/bi/tri) e capturado e salvo no snapshot, mas nao afeta o calculo — nao e usado em calcular.ts nem na precificacao.
- HIPOTESE: `tarifaAscender` e sempre gravada como 0 pela `gerarProposta` (actions.ts:107); a economia da lista de propostas (`consumo*(tarifaDistribuidora-tarifaAscender)`) e um modelo separado do simulador manual, nao do gerador.
- HIPOTESE: banner "acima de 14 kWp" (GeradorProposta.tsx:569) assume o cronograma de faixas default; se a config de kit mudar os tetos/flags, o texto fixo pode divergir da regra real.

## Dependencias
- Depende de:
  - `@/lib/db` (Drizzle/Postgres) e `@/lib/db/schema` (tabelas `propostas`, `parametrosProposta`, `clientes`, `unidadesConsumidoras`, `distribuidoras`).
  - `@/lib/auth/session` (`getSession`) para autorizar as actions.
  - `@/lib/cadastros/queries` (`opcoesClientes`, `opcoesUnidades`, `opcoesDistribuidoras`) nas paginas.
  - `zod` (validacao), `next/cache` (`revalidatePath`).
  - `jspdf` + `jspdf-autotable` (import dinamico client-side) para o PDF.
  - `recharts` e `@/components/SummaryStrip`, `@/components/DesktopOnly` na UI.
- Consumido por:
  - Tela `/propostas` (`propostas/page.tsx` via `listPropostas`, `saveProposta`, `deleteProposta` de cadastros) — consome a tabela `propostas`.
  - Tela `/configuracoes/proposta-precos` — usa `carregarParametros` e `salvarParametrosProposta`.
  - `GeradorProposta.tsx` consome `gerarProposta`, `baixarPropostaPdf` e as constantes.

## Riscos de alteracao
- Isolamento cliente/servidor: `precificacao.ts`, `parametros.ts` e `calcular.ts` sao server-only. Importa-los de um componente "use client" vazaria custo/margem/kit para o bundle. `pdf.ts` (client) so deve receber `PdfCenario` — passar `CenarioResultado.custo` para o PDF vazaria dados sensiveis.
- Ordenacao do kit: se um kit for gravado fora de ordem por `kwpMax` (ou por caminho que nao passe por `salvarParametrosProposta`), `faixaKit` retorna a faixa errada. A busca depende da ordem crescente.
- Base do imposto NAO inclui o kit (precificacao.ts:52); alterar isso muda o preco de todas as propostas silenciosamente.
- Textos fixos na UI ("acima de 14 kWp", cronograma Fio B) podem divergir dos parametros configurados; sao hardcoded.
- `carregarParametros` engole erros e cai em default — uma falha de DB gera proposta com precos padrao sem alertar o usuario.
- Campos numericos do banco sao `doublePrecision` e aceitam Infinity; toda gravacao de KPI passa por `finito()`. Novos campos financeiros precisam do mesmo tratamento.
- Snapshot `dadosGerador` (jsonb) inclui o `resultado` completo COM custo/margem — e uso interno; qualquer endpoint que exponha a proposta bruta vazaria custo.
- Payback simples (Necessario) ignora reajuste/degradacao/Fio B ao longo do tempo — diverge do fluxo real; mudar para fluxo alteraria KPIs historicos.
- `moduloWp` e coagido para 620/700 apenas (actions.ts:70); novos modulos exigem atualizar `MODS`, o tipo `ModuloWp` e o coercion.

## Pendencias / a investigar
- Campo `padrao` (mono/bi/tri) nao influencia calculo nem adequacao trifasica automatica — confirmar se e intencional ou feature pendente.
- Nao ha reimpressao a partir do snapshot `dadosGerador`: a UI so gera PDF na mesma sessao (estado em memoria). Nao existe rota que reidrate uma proposta salva para PDF.
- `cronogramaFioB` nao e editavel na tela `ParametrosForm` (so exibido); anoBase/tarifa/ativo sim. Confirmar se editar o array e desejado.
- `tarifaFioB` default 0 zera o efeito do Fio B; confirmar se a equipe ja tem a TUSD Fio B real para preencher.
- KPIs da lista `/propostas` usam `tarifaAscender` (modelo de simulacao manual) que o gerador sempre grava 0 — verificar se ha intencao de unificar os dois modelos de economia.
- Autorizacao: `gerarProposta`/`salvarParametros` so checam `authenticated`, sem papel/role — confirmar se qualquer usuario logado deve ver custo/margem.

## Fontes
- ascender-app/src/lib/propostas/types.ts
- ascender-app/src/lib/propostas/constantes.ts
- ascender-app/src/lib/propostas/dimensionamento.ts
- ascender-app/src/lib/propostas/precificacao.ts
- ascender-app/src/lib/propostas/parametros.ts
- ascender-app/src/lib/propostas/financeiro.ts
- ascender-app/src/lib/propostas/calcular.ts
- ascender-app/src/lib/propostas/actions.ts
- ascender-app/src/lib/propostas/pdf.ts
- ascender-app/src/app/(dashboard)/propostas/gerador/GeradorProposta.tsx
- ascender-app/src/app/(dashboard)/propostas/gerador/page.tsx
- ascender-app/src/app/(dashboard)/propostas/page.tsx
- ascender-app/src/app/(dashboard)/configuracoes/proposta-precos/page.tsx
- ascender-app/src/app/(dashboard)/configuracoes/proposta-precos/ParametrosForm.tsx
- ascender-app/src/app/(dashboard)/configuracoes/layout.tsx
- ascender-app/src/lib/db/schema.ts (propostas: linha 355; parametros_proposta: linha 408)
- ascender-app/src/lib/cadastros/queries.ts (listPropostas: linha 134)
- ascender-app/src/lib/cadastros/actions.ts (saveProposta: 493; deleteProposta: 515)
</content>
</invoke>
