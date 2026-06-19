# Plano de Implementacao React - ASCENDER

## Objetivo

Criar um prototipo React com dados mockados para validar navegacao, entidades, dashboards e fluxo de proposta comercial antes de implementar backend, banco relacional e integracoes reais com SolisCloud/Digital Grid.

## Repositorio Criado

Repositorio local:

```text
C:\protheus\ascender-dashboard
```

Comandos:

```powershell
npm install
npm run dev
npm run build
```

Assets da marca:

- `public/brand/logo-black.jpeg`
- `public/brand/logo-horizontal.jpeg`
- `public/brand/brand-board.jpeg`

Paleta aplicada:

- azul: `#0B3C5D`
- amarelo: `#F5B700`
- cinza: `#E6E8EA`
- branco: `#FAFAF7`
- dourado: `#C9A227`

## Premissas

- o primeiro ciclo sera frontend com mock de dados
- o backend real sera desenhado depois da validacao do modelo relacional
- a planilha `CONTROLE DE USINAS_EWALDO.xlsx` orienta o modelo inicial
- SolisCloud e Digital Grid entram inicialmente como fontes simuladas
- a interface deve ajudar a ASCENDER a enxergar operacao, financeiro, rateio e propostas em um so lugar

## Stack Sugerida

- React
- TypeScript
- Vite
- React Router
- TanStack Query, mesmo com mock local, para facilitar troca futura para API real
- TanStack Table para tabelas
- Recharts ou ECharts para graficos
- Zod para contratos de dados/mock
- Tailwind ou CSS modules, mantendo visual operacional e denso

## Estrutura Inicial de Pastas

```text
src/
  app/
    routes.tsx
    layout/
  features/
    dashboard/
    usinas/
    clientes/
    unidades-consumidoras/
    rateio/
    financeiro/
    propostas/
    integracoes/
  mocks/
    ascenderMockData.ts
  shared/
    components/
    formatters/
    types/
    services/
```

## Rotas Iniciais

```text
/dashboard
/usinas
/usinas/:id
/clientes
/clientes/:id
/unidades-consumidoras
/rateio
/financeiro
/propostas
/propostas/nova
/integracoes
```

## Telas do Primeiro Mock

## Atualizacao do Prototipo - Dashboards Implementaveis

Status em `C:\protheus\ascender-dashboard`:

- build validado com `npm run build`
- prototipo disponivel no Vite em `http://127.0.0.1:5173/index.html`
- mock centralizado em `src/data/mockData.ts`
- dashboards separados por contexto operacional, financeiro, comercial e integracoes
- interface refatorada para navegacao por modulos usando estado local React
- tela inicial com cards navegaveis para cada dashboard implementavel
- modulo de Cadastros criado para representar os dados mestres mapeados
- modo escuro aplicado como tema padrao do prototipo
- logo `logo-black.jpeg` usada no layout escuro; `logo-horizontal.jpeg` reservada para layout claro futuro

Dashboards atualmente implementados no mock:

- Inicio navegavel: cards para abrir Executivo, SolisCloud, Usinas, Rateio, Financeiro, Propostas e Integracoes.
- Executivo: geracao consolidada, potencia atual, valor em aberto, valor pago e economia proposta.
- Cadastros: telas mockadas para clientes, UCs, usinas, contratos/propostas e fontes externas.
- SolisCloud Operacional: telemetria por estacao, energia do dia/mes/total, potencia atual, inversores e alarmes.
- Performance de Usinas: cadastro das usinas com Digital Grid, SolisCloud, potencia, geracao mensal e previsto.
- Rateio e Compensacao: consumo da UC, energia alocada, saldo e percentual de rateio.
- Financeiro e Cobranca: faturas, boletos, vencimento, status e totais por situacao.
- Propostas Comerciais: consumo estimado, tarifa distribuidora, tarifa ASCENDER, economia anual e proxima acao.
- Contratos de Integracao: endpoints SolisCloud mapeados por uso de dashboard.

Campos mockados para SolisCloud:

- `stationId`
- `updateTime`
- `state`
- `currentPowerKw`
- `dayEnergyKwh`
- `monthEnergyKwh`
- `yearEnergyKwh`
- `allEnergyKwh`
- `expectedMonthEnergyKwh`
- `gridSellEnergyKwh`
- `gridPurchasedEnergyKwh`
- `homeLoadEnergyKwh`
- dados de inversores: serial, estado, potencia atual, energia do dia, energia total e temperatura
- dados de alarmes: usina, serial, nivel, mensagem, abertura e status

Endpoints SolisCloud priorizados no mock:

- `POST /v1/api/userStationList`
- `POST /v1/api/stationDetail`
- `POST /v1/api/stationDay`
- `POST /v1/api/inverterList`
- `POST /v1/api/alarmList`

Arquitetura de navegacao atual:

- `overview`: mapa de modulos
- `executivo`: painel consolidado
- `cadastros`: dados mestres
- `soliscloud`: telemetria e O&M
- `usinas`: cadastro e performance
- `rateio`: energia alocada por UC
- `financeiro`: faturas e pagamentos
- `propostas`: oportunidades comerciais
- `integracoes`: fontes de dados e contratos

Proxima evolucao recomendada:

- mover cada dashboard para `src/features/<modulo>`
- introduzir React Router mantendo os mesmos IDs como rotas
- criar componentes reutilizaveis para tabelas, filtros, cards de modulo e paineis de status
- adicionar filtros por competencia, usina, cliente e status
- trocar os mocks por adapters de API mantendo os contratos TypeScript

Cadastros implementados no prototipo:

- Cliente: nome/razao social, documento, tipo, status, e-mail financeiro e responsavel.
- Unidade consumidora: cliente vinculado, codigo de instalacao, distribuidora, consumo medio, classe tarifaria e status de rateio.
- Usina: nome, distribuidora, potencia kWp, codigo Digital Grid, Station ID SolisCloud e status operacional.
- Contrato/proposta: cliente, UC, distribuidora, consumo estimado, tarifa distribuidora, tarifa ASCENDER, economia estimada e status.
- Integracao: fonte externa, identificador interno, URL base, status, ultima sincronizacao e responsavel.

Observacao:

- os formularios estao em modo mock/somente leitura para validar fluxo e campos
- a proxima etapa e separar cada cadastro em `src/features/cadastros/*` e conectar um estado local editavel antes da API real

## Dashboard Executivo

Objetivo:

- dar visao geral da operacao

Cards:

- total de usinas
- geracao mensal kWh
- energia compensada kWh
- valor faturado
- valor em aberto
- economia estimada dos clientes
- faturas vencidas/aguardando

Graficos:

- geracao por usina e competencia
- faturamento por competencia
- status de faturas
- comparativo SolisCloud x planilha/Digital Grid

Status no repositorio:

- implementado no primeiro mock
- cards de KPIs
- ranking de geracao por usina
- financeiro por status

## Usinas

Lista:

- nome
- codigo Digital Grid
- identificador SolisCloud
- distribuidora
- potencia
- geracao mensal
- liquido mensal
- status

Detalhe:

- historico de geracao
- resultado mensal
- rateio vinculado
- faturas relacionadas
- alertas da SolisCloud

Status no repositorio:

- lista inicial implementada
- campos de Digital Grid e SolisCloud ja aparecem no mock

## Clientes e Unidades Consumidoras

Lista de clientes:

- nome
- documento mascarado
- quantidade de UCs
- consumo medio
- status financeiro
- economia estimada

Detalhe:

- dados cadastrais
- UCs
- contratos
- faturas
- historico de consumo
- propostas geradas

## Rateio

Objetivo:

- validar distribuicao de energia por usina e competencia

Campos:

- competencia
- usina
- cliente
- UC
- consumo kWh
- saldo kWh
- rateio kWh
- percentual
- desconto
- previsao

Indicadores:

- percentual total alocado
- energia disponivel
- energia rateada
- sobra/deficit

## Financeiro

Objetivo:

- acompanhar faturas, pagamentos e extrato

Tabela:

- cliente
- UC
- usina
- competencia
- valor fatura
- valor boleto
- vencimento
- status
- origem

Filtros:

- competencia
- usina
- cliente
- status
- distribuidora

Status no repositorio:

- tabela inicial implementada
- valores e status simulam retorno da Digital Grid

## Propostas Comerciais

Objetivo:

- sugerir propostas a partir de consumo, tarifa, desconto e economia estimada

Fluxo:

1. selecionar cliente ou criar lead
2. informar UC e distribuidora
3. informar consumo medio ou importar historico
4. escolher usina/carteira
5. simular tarifa da distribuidora
6. aplicar desconto/desagio
7. calcular economia mensal e 12 meses
8. gerar resumo da proposta

Saidas:

- tarifa atual
- tarifa ASCENDER
- economia estimada
- payback, se houver investimento
- observacoes comerciais
- status da proposta

Status no repositorio:

- cards iniciais implementados
- fluxo detalhado ainda pendente

## Integracoes

Primeira versao:

- cards simulando status das fontes
- SolisCloud: conectado/mock, ultima sincronizacao, endpoints prioritarios
- Digital Grid: pendente de validacao oficial, dados financeiros simulados
- Planilha: ultima importacao e abas processadas

Status no repositorio:

- cards de fontes implementados
- SolisCloud, Digital Grid e planilha aparecem como fontes do mock

## Contratos de Mock

Tipos principais:

```ts
type Usina = {
  id: string;
  nome: string;
  codigoDigitalGrid?: string;
  stationIdSoliscloud?: string;
  distribuidora: string;
  potenciaKwp?: number;
  status: "ativa" | "atencao" | "inativa";
};

type Cliente = {
  id: string;
  nome: string;
  documentoMascarado?: string;
  tipo: "cliente" | "prosumidor" | "investidor";
  status: "ativo" | "inativo";
};

type UnidadeConsumidora = {
  id: string;
  clienteId: string;
  codigoInstalacao: string;
  distribuidora: string;
  consumoMedioKwh: number;
};

type MedicaoGeracao = {
  id: string;
  usinaId: string;
  competencia: string;
  geracaoKwh: number;
  compensadoKwh?: number;
  fonte: "planilha" | "soliscloud" | "digital-grid";
};

type Fatura = {
  id: string;
  clienteId: string;
  unidadeConsumidoraId: string;
  usinaId: string;
  competencia: string;
  valorFatura: number;
  valorBoleto: number;
  vencimento: string;
  status: "aguardando" | "pago" | "vencido" | "parcelado" | "negativado";
};
```

## Fase 1 - Prototipo Visual

Entregas:

- layout base
- navegacao lateral
- dashboard executivo
- mocks em TypeScript
- tabelas principais
- graficos com dados simulados

Resultado esperado:

- validar se as telas representam a rotina real da ASCENDER

## Fase 2 - Modelo de Dados

Entregas:

- revisar entidades com base na planilha
- normalizar nomes e chaves
- definir contratos JSON equivalentes ao futuro backend
- mapear regras de calculo das planilhas

Resultado esperado:

- fechar o modelo relacional v1

## Fase 3 - Importacao da Planilha

Entregas:

- endpoint ou rotina local para importar Excel
- preview de dados importados
- validacao de campos obrigatorios
- relatorio de inconsistencias

Resultado esperado:

- trocar parte do mock por dados importados

## Fase 4 - Integracoes

Entregas:

- conector SolisCloud
- conector/exportacao Digital Grid, se autorizado
- jobs de sincronizacao
- logs de importacao

Resultado esperado:

- dashboard alimentado por fontes reais

## Fase 5 - Propostas Comerciais

Entregas:

- simulador de proposta
- regras de tarifa, desconto, fio B e economia
- historico de propostas
- geracao de documento/preview

Resultado esperado:

- apoiar vendas com dados reais de consumo, tarifa e economia

## Criterios de Sucesso do Mock

- usuario consegue navegar por usina, cliente, UC, rateio e financeiro
- dashboard mostra geracao, faturamento, pagamentos e economia
- proposta comercial usa dados do cliente e regras comerciais simuladas
- estrutura do mock se parece com o futuro banco relacional
- troca de mock por API futura nao exige refazer a interface
