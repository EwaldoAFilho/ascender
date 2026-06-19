# Indice ASCENDER

## Contexto

Entrada principal para o projeto ASCENDER.

O sistema ainda nao foi definido. A direcao inicial e estruturar um plano de implantacao para uma solucao provavelmente fullstack, com primeiras entregas voltadas a dashboards de acompanhamento relacionados a operacao da empresa.

A ASCENDER atua no segmento de energia solar fotovoltaica. O contexto inicial indica acompanhamento de usinas de geracao de energia e uso atual do SolisCloud, sistema da Solis utilizado para monitoramento da geracao.

Resumo consolidado do que ja foi feito:

- [[05 - Projetos/ascender/Status Atual do Projeto - ASCENDER|Status Atual do Projeto - ASCENDER]]

## Perfil

- [[05 - Projetos/ascender/Perfil da Empresa|Perfil da Empresa]]
- [[05 - Projetos/ascender/descoberta/Contexto Operacional - ASCENDER Solar Tech|Contexto Operacional - ASCENDER Solar Tech]]

## Descoberta

- [[05 - Projetos/ascender/descoberta/Levantamento Inicial - ASCENDER|Levantamento Inicial]]

## Dashboards

- [[05 - Projetos/ascender/dashboards/Plano Inicial de Dashboards - ASCENDER|Plano Inicial de Dashboards]]

## Base de Conhecimento

- [[05 - Projetos/ascender/base-conhecimento/soliscloud-api/Base de Conhecimento - SolisCloud API - ASCENDER|Base de Conhecimento - SolisCloud API]]
- [[05 - Projetos/ascender/base-conhecimento/soliscloud-api/README - Ingestao SolisCloud API|README - Ingestao SolisCloud API]]
- [[05 - Projetos/ascender/base-conhecimento/digital-grid/Analise Tecnica - Digital Grid - ASCENDER|Analise Tecnica - Digital Grid]]
- [[05 - Projetos/ascender/base-conhecimento/digital-grid/README - Fontes Digital Grid|README - Fontes Digital Grid]]

## Contratos

- [[05 - Projetos/ascender/contratos/digital-grid/Contrato REST - Digital Grid Financeiro|Contrato REST - Digital Grid Financeiro]]

## Arquitetura

- [[05 - Projetos/ascender/arquitetura/Direcao Tecnica Inicial - ASCENDER|Direcao Tecnica Inicial]]
- [[05 - Projetos/ascender/arquitetura/dados/Modelo Relacional Inicial - ASCENDER|Modelo Relacional Inicial]]
- [[05 - Projetos/ascender/frontend/react/Plano de Implementacao React - ASCENDER|Plano de Implementacao React]]
- [[05 - Projetos/ascender/_analises/planilhas/Analise da Planilha - Controle de Usinas ASCENDER|Analise da Planilha - Controle de Usinas]]

## Decisoes

- [[05 - Projetos/ascender/decisoes/Registro de Decisoes - ASCENDER|Registro de Decisoes]]

## Proximas Acoes

- validar o prototipo React com a rotina real da ASCENDER
- confirmar quais usinas, clientes ou carteiras serao acompanhadas primeiro
- transformar os cadastros mockados em formularios editaveis no frontend
- separar o frontend em features/componentes menores
- adicionar filtros por competencia, usina, cliente, status e distribuidora
- levantar dados reais disponiveis no SolisCloud
- verificar se o SolisCloud oferece API, exportacao ou relatorios programados no ambiente atual da ASCENDER
- revisar endpoints detectados na base da API SolisCloud
- validar se a Digital Grid oferece API oficial, exportacao ou permissao de integracao
- mapear relacao entre dados de geracao do SolisCloud e dados financeiros/comerciais da Digital Grid
- validar modelo relacional inicial extraido da planilha `CONTROLE DE USINAS_EWALDO.xlsx`
- evoluir repositorio React em `C:\protheus\ascender-dashboard`
- identificar usuarios e rotina de uso
- definir indicadores prioritarios de geracao, disponibilidade, performance e O&M
- decidir stack inicial somente depois da descoberta funcional
