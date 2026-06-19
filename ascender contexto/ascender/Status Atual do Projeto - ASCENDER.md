# Status Atual do Projeto - ASCENDER

Atualizado em: 2026-04-30 20:14

## Resumo Executivo

O projeto ASCENDER foi estruturado no Obsidian e ja possui base tecnica suficiente para validar um primeiro prototipo de sistema fullstack. A direcao atual e manter o foco em um frontend React com dados mockados, usando as fontes reais mapeadas como referencia: planilha operacional, SolisCloud e Digital Grid.

O repositorio React foi criado em:

```text
C:\protheus\ascender-dashboard
```

URL local do prototipo:

```text
http://127.0.0.1:5173/index.html
```

Build validado:

```powershell
npm run build
```

## O Que Foi Criado No Obsidian

- Projeto ASCENDER no vault `C:\obsidian\dev_fluig_protheus`.
- Indice principal do projeto.
- Perfil da empresa.
- Contexto operacional da ASCENDER Solar Tech.
- Levantamento inicial.
- Direcao tecnica inicial.
- Plano inicial de dashboards.
- Modelo relacional inicial.
- Plano de implementacao React.
- Registro de decisoes.
- Analise tecnica da Digital Grid.
- Contrato preliminar da Digital Grid financeira.
- Analise da planilha `CONTROLE DE USINAS_EWALDO.xlsx`.
- Base de conhecimento exclusiva da API SolisCloud.

## Base SolisCloud

Fonte ingerida:

```text
C:\Users\slaye\Downloads\SolisCloud Platform API Document V2.0.pdf
```

Artefatos gerados:

- `base-conhecimento/soliscloud-api/Base de Conhecimento - SolisCloud API - ASCENDER.md`
- `base-conhecimento/soliscloud-api/chunks/*.md`
- `_embeddings/soliscloud-api/chunks.jsonl`
- `_embeddings/soliscloud-api/embeddings.npy`
- `_embeddings/soliscloud-api/endpoints.json`
- `_embeddings/soliscloud-api/manifest.json`
- `_embeddings/soliscloud-api/relationships.json`

Resultado:

- 122 paginas processadas.
- 124 chunks estruturados.
- 66 endpoints detectados.
- scripts de ingestao e busca criados em `scripts/`.

Endpoints priorizados no mock React:

- `POST /v1/api/userStationList`
- `POST /v1/api/stationDetail`
- `POST /v1/api/stationDay`
- `POST /v1/api/inverterList`
- `POST /v1/api/alarmList`

## Digital Grid

Arquivos analisados:

- `financeiro.txt`
- `main.txt`
- `filter.txt`
- `financeiro rest return.txt`
- `pnphtrmq.v1.txt`

Conclusao atual:

- A Digital Grid aparece como fonte comercial/financeira.
- Os dados observados cobrem faturas, pagamentos, clientes/prosumidores, consumo/kWh e acoes financeiras.
- O endpoint financeiro observado deve ser tratado como contrato preliminar, nao como API publica validada.

Documentos relacionados:

- [[05 - Projetos/ascender/base-conhecimento/digital-grid/Analise Tecnica - Digital Grid - ASCENDER|Analise Tecnica - Digital Grid]]
- [[05 - Projetos/ascender/contratos/digital-grid/Contrato REST - Digital Grid Financeiro|Contrato REST - Digital Grid Financeiro]]

## Planilha Operacional

Fonte analisada:

```text
C:\Users\slaye\Downloads\CONTROLE DE USINAS_EWALDO.xlsx
```

Abas identificadas:

- `Extrato 25`
- `Gastos Morumbi`
- `Previsão Orç.`
- `Usinas`
- `Rateio`
- `Dados`
- `CINARA`
- `Historico`
- `Usina - Encontro`
- `Usina - Vivendas`
- `Usina - Vitor`
- `Usina - Mardem`
- `Usina - Ascender`

Resultado:

- analise JSON gerada em `_analises/planilhas/controle-usinas-ewaldo-analise.json`
- nota tecnica gerada em `_analises/planilhas/Analise da Planilha - Controle de Usinas ASCENDER.md`
- modelo relacional inicial derivado em `arquitetura/dados/Modelo Relacional Inicial - ASCENDER.md`

## Modelo Relacional Inicial

Entidades mapeadas:

- clientes
- unidades consumidoras
- usinas
- distribuidoras
- contratos
- medicoes de geracao
- resultados mensais por usina
- rateios
- faturas
- movimentos financeiros
- propostas comerciais
- fontes de integracao
- alarmes/telemetria SolisCloud

## Prototipo React

Repositorio:

```text
C:\protheus\ascender-dashboard
```

Stack atual:

- React
- TypeScript
- Vite 4
- lucide-react
- mock local em `src/data/mockData.ts`
- CSS proprio em `src/styles/global.css`

Observacao tecnica:

- ambiente atual usa Node `v14.19.3`
- Vite e plugin React foram mantidos em versoes compativeis com esse ambiente

## Funcionalidades Implementadas No React

Navegacao:

- layout navegavel por estado React
- sidebar por modulos
- tela inicial com cards de entrada
- modo escuro como tema padrao
- logo `logo-black.jpeg` aplicada no layout escuro
- `logo-horizontal.jpeg` reservada para layout claro futuro

Modulos implementados:

- Inicio navegavel
- Executivo
- Cadastros
- SolisCloud
- Usinas
- Rateio
- Financeiro
- Propostas
- Integracoes

Dashboards implementados:

- executivo com geracao, potencia atual, financeiro e economia
- SolisCloud operacional com estacoes, energia dia/mes/total, inversores e alarmes
- performance de usinas com previsto x realizado
- rateio e compensacao por UC
- financeiro e cobranca baseado no comportamento observado da Digital Grid
- propostas comerciais com economia e proxima acao
- integracoes com fontes e contratos de endpoints

Cadastros implementados:

- Cliente
- Unidade consumidora
- Usina
- Contrato/proposta
- Fonte externa/integracao

Campos principais dos cadastros:

- cliente: nome, documento, tipo, status, e-mail financeiro, responsavel
- unidade consumidora: cliente, codigo de instalacao, distribuidora, consumo medio, classe tarifaria, status de rateio
- usina: nome, distribuidora, potencia kWp, codigo Digital Grid, Station ID SolisCloud, status operacional
- contrato/proposta: cliente, UC, distribuidora, consumo estimado, tarifa distribuidora, tarifa ASCENDER, economia, status
- integracao: fonte, identificador, URL base, status, ultima sincronizacao, responsavel

## Assets Da Marca

Arquivos copiados para o projeto React:

- `public/brand/logo-black.jpeg`
- `public/brand/logo-horizontal.jpeg`
- `public/brand/brand-board.jpeg`

Paleta registrada:

- azul: `#0B3C5D`
- amarelo: `#F5B700`
- cinza: `#E6E8EA`
- branco: `#FAFAF7`
- dourado: `#C9A227`

## Decisoes Tomadas

- O projeto deve continuar primeiro como prototipo React com mock.
- O backend ainda nao deve ser fechado antes da validacao funcional.
- SolisCloud sera a fonte tecnica principal para geracao, inversores, alarmes e disponibilidade.
- Digital Grid sera tratada como fonte financeira/comercial, mas depende de validacao de API oficial ou autorizacao de integracao.
- A planilha operacional orienta o modelo de dados inicial.
- O tema padrao do prototipo sera escuro, respeitando a logo adequada para layout escuro.

## Pendencias Tecnicas

- tornar formularios de cadastro editaveis em estado local
- separar `App.tsx` em features/componentes menores
- introduzir React Router
- adicionar filtros por competencia, usina, cliente, status e distribuidora
- adicionar graficos reais com biblioteca apropriada
- criar adapters para SolisCloud, Digital Grid e importacao Excel
- definir backend e banco apos validacao dos fluxos
- validar credenciais, limites e assinatura da API SolisCloud
- validar permissao tecnica/contratual para integracao com Digital Grid

## Proxima Fase Recomendada

Fase 1.1:

- organizar o frontend em `src/features/*`
- transformar os cadastros mockados em estado local editavel
- criar filtros de dashboard
- refinar mock para ficar mais proximo do banco relacional

Fase 2:

- desenhar backend e banco relacional
- criar importador inicial da planilha
- criar camada de sincronizacao SolisCloud em ambiente de teste

## Links Principais

- [[05 - Projetos/ascender/Indice ASCENDER|Indice ASCENDER]]
- [[05 - Projetos/ascender/arquitetura/Direcao Tecnica Inicial - ASCENDER|Direcao Tecnica Inicial]]
- [[05 - Projetos/ascender/frontend/react/Plano de Implementacao React - ASCENDER|Plano de Implementacao React]]
- [[05 - Projetos/ascender/arquitetura/dados/Modelo Relacional Inicial - ASCENDER|Modelo Relacional Inicial]]
- [[05 - Projetos/ascender/_analises/planilhas/Analise da Planilha - Controle de Usinas ASCENDER|Analise da Planilha - Controle de Usinas]]
- [[05 - Projetos/ascender/base-conhecimento/soliscloud-api/Base de Conhecimento - SolisCloud API - ASCENDER|Base SolisCloud API]]
- [[05 - Projetos/ascender/base-conhecimento/digital-grid/Analise Tecnica - Digital Grid - ASCENDER|Analise Tecnica - Digital Grid]]
- [[05 - Projetos/ascender/decisoes/Registro de Decisoes - ASCENDER|Registro de Decisoes]]
