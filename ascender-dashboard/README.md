# ASCENDER Dashboard

Prototipo React para validar dashboards, modelo de dados e fluxo comercial da ASCENDER antes das integracoes reais com SolisCloud, Digital Grid e importacao recorrente da planilha operacional.

## Stack

- React
- TypeScript
- Vite 4
- lucide-react
- mock local em `src/data/mockData.ts`

## Rodar

```powershell
npm install
npm run dev
```

## Tema e Marca

O prototipo esta em modo escuro por padrao.

- Layout escuro: usa `public/brand/logo-black.jpeg`.
- Layout claro futuro: manter `public/brand/logo-horizontal.jpeg`.
- Paleta principal preservada: azul `#0B3C5D`, amarelo `#F5B700`, cinza `#E6E8EA`, branco `#FAFAF7` e dourado `#C9A227`.

## Dashboards Implementaveis

- Inicio navegavel: cards de entrada para cada modulo do produto.
- Executivo: geracao, faturamento, inadimplencia, potencia atual e economia consolidada.
- Cadastros: clientes, unidades consumidoras, usinas, contratos/propostas e fontes externas.
- SolisCloud Operacional: estacoes, potencia atual, energia do dia/mes/total, inversores e alarmes.
- Performance de Usinas: cadastro operacional, Digital Grid, SolisCloud, geracao real e previsto mensal.
- Rateio e Compensacao: energia alocada, consumo, saldo e percentual por unidade consumidora.
- Financeiro e Cobranca: faturas por status, vencimentos, pago e em aberto.
- Propostas Comerciais: simulacao de tarifa, desconto, economia estimada e proxima acao comercial.
- Saude das Integracoes: SolisCloud, Digital Grid, importador Excel e contratos de endpoints mapeados.

## Contratos Mockados da SolisCloud

- `POST /v1/api/userStationList`: cadastro/reconciliacao de usinas.
- `POST /v1/api/stationDetail`: KPIs de energia, potencia e atualizacao.
- `POST /v1/api/stationDay`: curva diaria e comparativo esperado x realizado.
- `POST /v1/api/inverterList`: inventario e telemetria de inversores.
- `POST /v1/api/alarmList`: fila de alertas para O&M.

## Fontes Simuladas

- Planilha `CONTROLE DE USINAS_EWALDO.xlsx`
- API SolisCloud
- Plataforma Digital Grid

## Navegacao Atual

O prototipo usa estado local React para navegar entre os modulos sem backend ou roteador. A troca futura para React Router deve manter os mesmos IDs de tela:

- `overview`
- `executivo`
- `cadastros`
- `soliscloud`
- `usinas`
- `rateio`
- `financeiro`
- `propostas`
- `integracoes`

## Cadastros Mapeados

As telas de cadastro ainda sao mockadas e somente leitura, mas ja representam os campos principais do futuro banco relacional:

- Cliente: nome, documento, tipo, status, e-mail financeiro e responsavel.
- Unidade consumidora: cliente, codigo de instalacao, distribuidora, consumo medio, classe tarifaria e status de rateio.
- Usina: nome, distribuidora, potencia, codigo Digital Grid, Station ID SolisCloud e status operacional.
- Contrato/proposta: cliente, UC, distribuidora, consumo estimado, tarifas, economia e status.
- Integracao: fonte externa, identificador, URL base, status, ultima sincronizacao e responsavel.
