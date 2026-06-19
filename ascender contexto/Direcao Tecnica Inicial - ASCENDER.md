# Direcao Tecnica Inicial - ASCENDER

## Contexto

A solucao da ASCENDER ainda nao foi definida. A direcao provavel e uma aplicacao fullstack, mas a primeira necessidade parece estar relacionada a dashboards de acompanhamento de usinas de energia solar.

O sistema atual citado e o SolisCloud, da Solis, usado para monitorar a geracao de energia das usinas.

A documentacao `SolisCloud Platform API Document V2.0.pdf` foi ingerida em uma base local exclusiva da ASCENDER, com chunks Markdown e embeddings para consulta semantica.

Tambem foi identificado uso da Digital Grid para acompanhamento financeiro/comercial, faturas, pagamentos, clientes/prosumidores e kWh.

## Principio Tecnico

Nao escolher a stack antes de entender:

- fontes de dados
- forma de acesso aos dados do SolisCloud
- forma de acesso aos dados da Digital Grid
- volume de dados
- necessidade de tempo real
- usuarios e perfis de acesso
- forma de publicacao
- manutencao esperada
- integracoes obrigatorias

## Caminhos Possiveis

## Dashboard Simples

Indicado se os dados vierem de planilhas, consultas SQL simples ou exportacoes periodicas.

Possiveis entregas:

- Power BI ou ferramenta equivalente
- dashboard web estatico com carga periodica
- planilha automatizada

## Dashboard Integrado

Indicado se houver API, exportacao recorrente do SolisCloud, banco de dados ou necessidade de consulta recorrente.

Possiveis entregas:

- backend para consolidacao de dados
- frontend web para visualizacao
- banco intermediario
- camada de autenticacao
- rotina de sincronizacao com SolisCloud ou importacao controlada

## Sistema Fullstack

Indicado se o projeto evoluir para cadastros, fluxos, aprovacoes, automacoes ou operacao diaria dentro da propria ferramenta.

Possiveis componentes:

- frontend web
- backend REST
- banco relacional
- autenticacao
- controle de permissoes
- jobs de sincronizacao
- dashboards internos

## Decisoes Em Aberto

- stack frontend
- stack backend
- banco de dados
- hospedagem
- modelo de autenticacao
- ferramenta de dashboard
- estrategia de integracao
- estrategia de obtencao dos dados do SolisCloud
- estrategia de obtencao dos dados da Digital Grid
- granularidade necessaria: usina, inversor, string, dia, mes ou evento

## Base Tecnica Disponivel

- [[05 - Projetos/ascender/Status Atual do Projeto - ASCENDER|Status Atual do Projeto]]
- [[05 - Projetos/ascender/base-conhecimento/soliscloud-api/Base de Conhecimento - SolisCloud API - ASCENDER|Base de Conhecimento - SolisCloud API]]
- [[05 - Projetos/ascender/base-conhecimento/digital-grid/Analise Tecnica - Digital Grid - ASCENDER|Analise Tecnica - Digital Grid]]
- [[05 - Projetos/ascender/_analises/planilhas/Analise da Planilha - Controle de Usinas ASCENDER|Analise da Planilha - Controle de Usinas]]
- [[05 - Projetos/ascender/arquitetura/dados/Modelo Relacional Inicial - ASCENDER|Modelo Relacional Inicial]]
- [[05 - Projetos/ascender/frontend/react/Plano de Implementacao React - ASCENDER|Plano de Implementacao React]]
- chunks estruturados: `05 - Projetos/ascender/_embeddings/soliscloud-api/chunks.jsonl`
- embeddings locais: `05 - Projetos/ascender/_embeddings/soliscloud-api/embeddings.npy`
- endpoints detectados: `05 - Projetos/ascender/_embeddings/soliscloud-api/endpoints.json`

## Direcao Atual

O prototipo React com dados mockados ja foi criado e deve ser usado como base de validacao funcional com a ASCENDER. O mock simula as tres fontes principais:

- planilha de controle operacional
- SolisCloud
- Digital Grid

Esse prototipo deve validar experiencia, entidades, cadastros, dashboards e regras de leitura antes de qualquer backend definitivo.

Repositorio inicial criado:

- `C:\protheus\ascender-dashboard`

Build validado:

- `npm run build`

URL local:

- `http://127.0.0.1:5173/index.html`

Estado atual do prototipo:

- navegacao por modulos
- dashboards Executivo, SolisCloud, Usinas, Rateio, Financeiro, Propostas e Integracoes
- modulo de Cadastros para Cliente, Unidade Consumidora, Usina, Contrato/Proposta e Fonte Externa
- modo escuro com a logo adequada para layout escuro

Proxima direcao tecnica:

- componentizar o frontend
- transformar formularios mockados em estado editavel
- introduzir filtros
- preparar contratos TypeScript para futura API

## Criterio Para Escolha da Stack

A stack deve ser escolhida depois que o primeiro dashboard estiver funcionalmente claro. A prioridade inicial e reduzir incerteza sobre dados, regras e usuarios.
