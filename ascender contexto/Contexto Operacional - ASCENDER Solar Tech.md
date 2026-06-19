# Contexto Operacional - ASCENDER Solar Tech

## Origem

Nota criada a partir de briefing inicial informado em 2026-04-30 e de imagens institucionais/proposta da ASCENDER.

Arquivos de referencia informados:

- `C:/Users/slaye/Downloads/WhatsApp Image 2026-04-30 at 18.07.05.jpeg`
- `C:/Users/slaye/Downloads/WhatsApp Image 2026-04-30 at 18.06.45.jpeg`

## Quem E

A ASCENDER Solar Tech atua com energia solar fotovoltaica. O posicionamento apresentado e:

- energia solar como investimento seguro, rentavel e bem estruturado
- solucoes completas do projeto a homologacao
- atuacao em Brasilia
- foco em resultado, transparencia, profissionalismo e compromisso com o cliente

## Proposta de Valor

O material apresenta a ASCENDER como uma empresa que entrega uma solucao completa, do projeto a operacao.

Componentes identificados:

- projeto de engenharia
- equipamentos e instalacao
- responsabilidade tecnica
- homologacao
- comissionamento
- certificacoes
- O&M: operacao, manutencao e monitoramento
- comercializacao e rateio de energia

## Sistema Atual

A empresa utiliza atualmente o SolisCloud, sistema da Solis, para monitorar a geracao de energia das usinas.

A empresa tambem utiliza a plataforma Digital Grid para acompanhar pagamentos, faturas, clientes/prosumidores e informacoes relacionadas a consumo/energia em kWh.

Este ponto e central para o projeto porque os primeiros dashboards provavelmente dependerao de dados de:

- usinas
- inversores
- geracao de energia
- eventos, alertas ou falhas
- disponibilidade
- historico de geracao

## Sistema Atual - Digital Grid

Digital Grid aparece como plataforma operacional/comercial da ASCENDER.

Funcoes identificadas nos arquivos analisados:

- acompanhamento financeiro de faturas
- status de pagamento
- boletos, linha digitavel e codigo de barras
- faturas geradas e faturas da distribuidora
- envio/reenvio por e-mail e WhatsApp
- creditos financeiros de consumidores
- consumo, energia compensada, credito acumulado e tarifa em kWh
- geracao por usina via grafico
- filtros por usina, agente, distribuidora, status, mes e ano

Nota tecnica:

- [[05 - Projetos/ascender/base-conhecimento/digital-grid/Analise Tecnica - Digital Grid - ASCENDER|Analise Tecnica - Digital Grid - ASCENDER]]

## Oportunidade Inicial

Construir dashboards que complementem ou consolidem informacoes do SolisCloud para a rotina da ASCENDER.

Possiveis objetivos:

- acompanhar performance de multiplas usinas em uma visao unica
- priorizar atendimento de O&M
- identificar queda de geracao ou falhas rapidamente
- comparar geracao esperada versus realizada
- criar visao executiva para carteira, clientes ou operacao interna
- preparar base para um sistema fullstack proprio no futuro

## Pontos Para Levantamento

- quantas usinas sao monitoradas atualmente
- se as usinas pertencem a ASCENDER, clientes ou uma carteira mista
- quais usuarios acessam o SolisCloud
- quais usuarios acessam a Digital Grid
- quais relatorios sao usados hoje
- quais informacoes o SolisCloud nao entrega bem para a ASCENDER
- quais informacoes a Digital Grid nao entrega bem para a ASCENDER
- se existe API disponivel no plano atual
- se ha exportacao de dados em CSV, Excel ou relatorio programado
- se existem planilhas internas complementando o SolisCloud
- se existem exportacoes da Digital Grid
- qual frequencia de atualizacao e necessaria

## Riscos e Dependencias

- acesso limitado aos dados do SolisCloud
- ausencia de API oficial ou permissao de integracao com Digital Grid
- dependencia de exportacao manual
- ausencia de API ou restricoes de plano/licenca
- necessidade de consolidar dados por cliente, usina ou inversor
- definicao pendente sobre o nivel de tempo real necessario

## Links Relacionados

- [[05 - Projetos/ascender/Perfil da Empresa|Perfil da Empresa]]
- [[05 - Projetos/ascender/dashboards/Plano Inicial de Dashboards - ASCENDER|Plano Inicial de Dashboards]]
- [[05 - Projetos/ascender/arquitetura/Direcao Tecnica Inicial - ASCENDER|Direcao Tecnica Inicial]]
