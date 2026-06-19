# Plano Inicial de Dashboards - ASCENDER

## Objetivo

Estruturar a primeira frente de entrega do projeto ASCENDER como dashboards de acompanhamento. O contexto inicial aponta para monitoramento de usinas de geracao de energia solar, hoje acompanhado pelo SolisCloud, e acompanhamento financeiro/comercial pela Digital Grid.

## Escopo Inicial

Criar uma base de dashboard que permita:

- acompanhar indicadores relevantes da empresa
- acompanhar geracao de energia das usinas
- consolidar visoes hoje dependentes do SolisCloud ou de relatorios extraidos dele
- acompanhar pagamentos, faturas e valores por cliente/prosumidor
- consolidar visoes hoje dependentes da Digital Grid ou de exportacoes dela
- consolidar dados hoje dispersos
- reduzir dependencia de acompanhamentos manuais
- criar uma primeira visao operacional ou gerencial
- servir como fundacao para uma solucao fullstack futura

## Hipoteses Iniciais

- o sistema final ainda nao esta definido
- os dashboards serao a primeira entrega util
- o SolisCloud e uma fonte atual importante para monitoramento de geracao
- a Digital Grid e uma fonte atual importante para financeiro, clientes, faturas, creditos e kWh
- a viabilidade tecnica depende de entender como extrair dados do SolisCloud no ambiente da ASCENDER
- a integracao com Digital Grid depende de API oficial, exportacao autorizada ou outra forma permitida de acesso
- a arquitetura deve permanecer flexivel ate a descoberta dos dados
- a decisao de stack deve depender das fontes de dados, usuarios e frequencia de atualizacao

## Fase 1 - Descoberta

- entender o contexto da ASCENDER
- definir se o primeiro recorte sera por usina, cliente, inversor, carteira ou periodo
- listar indicadores desejados
- mapear fontes de dados
- avaliar acesso ao SolisCloud: API, exportacao manual, relatorios, integracao ou banco intermediario
- avaliar acesso a Digital Grid: API oficial, exportacao, relatorios ou integracao autorizada
- validar usuarios e rotina de consulta

## Fase 2 - Modelagem dos Indicadores

- definir nome e objetivo de cada indicador
- documentar regra de calculo
- mapear origem dos campos
- definir filtros necessarios
- definir periodicidade de atualizacao
- classificar indicadores por prioridade

## Fase 3 - Prototipo

- criar wireframe do dashboard
- validar agrupamento dos indicadores
- definir filtros principais
- validar navegacao entre visao resumida e detalhe
- confirmar se a entrega inicial sera web, BI, Fluig, planilha automatizada ou outra interface

## Fase 4 - Implementacao

- construir camada de dados
- criar consultas, views, APIs ou carga intermediaria
- implementar interface do dashboard
- validar performance
- validar seguranca e acessos
- homologar com usuarios-chave

## Indicadores Candidatos

Lista inicial baseada no contexto de geracao solar. Deve ser validada com a ASCENDER:

- energia gerada por usina
- geracao diaria, mensal e acumulada
- comparativo entre usinas
- desempenho por inversor
- alertas ou falhas reportadas pelo SolisCloud
- disponibilidade da usina
- performance esperada versus realizada
- ranking de usinas por geracao
- status de comunicacao dos equipamentos
- acompanhamento de O&M e manutencoes pendentes
- faturas por status: aguardando, pago, vencido, parcelado e negativado
- total faturado, total pago e total em aberto
- vencimentos proximos
- valor da fatura versus valor do boleto
- consumo, energia compensada e credito acumulado por cliente
- geracao por usina versus faturamento/rateio
- divergencias de gerador por fatura

## Criterios de Sucesso

- os usuarios conseguem entender a situacao atual sem consolidar dados manualmente
- os indicadores possuem regra clara e fonte rastreavel
- o dashboard ajuda a tomar uma decisao objetiva
- a informacao do SolisCloud e aproveitada sem retrabalho operacional excessivo
- a arquitetura escolhida nao bloqueia uma evolucao futura para sistema fullstack

## Pendencias

- confirmar acesso tecnico ao SolisCloud
- confirmar se a ASCENDER possui API key, relatorios exportaveis ou acesso administrativo
- confirmar acesso tecnico/autorizado a Digital Grid
- definir primeira carteira de usinas acompanhada
- listar outros sistemas ou planilhas existentes
- confirmar publico-alvo do dashboard
- priorizar primeira entrega

## Links Relacionados

- [[05 - Projetos/ascender/descoberta/Levantamento Inicial - ASCENDER|Levantamento Inicial]]
- [[05 - Projetos/ascender/descoberta/Contexto Operacional - ASCENDER Solar Tech|Contexto Operacional - ASCENDER Solar Tech]]
- [[05 - Projetos/ascender/arquitetura/Direcao Tecnica Inicial - ASCENDER|Direcao Tecnica Inicial]]
- [[05 - Projetos/ascender/decisoes/Registro de Decisoes - ASCENDER|Registro de Decisoes]]
