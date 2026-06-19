# Analise Tecnica - Digital Grid - ASCENDER

## Origem

Analise criada a partir de arquivos exportados da plataforma Digital Grid.

Arquivos de referencia:

- `C:/Users/slaye/Downloads/digital grid/financeiro.txt`
- `C:/Users/slaye/Downloads/digital grid/main.txt`
- `C:/Users/slaye/Downloads/digital grid/filter.txt`
- `C:/Users/slaye/Downloads/digital grid/financeiro rest return.txt`
- `C:/Users/slaye/Downloads/digital grid/pnphtrmq.v1.txt`

## Contexto

A ASCENDER utiliza a plataforma Digital Grid para acompanhar informacoes comerciais/financeiras e dados relacionados a clientes, pagamentos, faturas e consumo/energia em kWh.

Este sistema deve ser tratado como fonte operacional complementar ao SolisCloud:

- SolisCloud: monitoramento tecnico de geracao das usinas
- Digital Grid: acompanhamento comercial, financeiro, clientes, faturas, creditos, consumo e rateio

## Modulos Identificados

Menu lateral observado:

- Dashboard
- Creditos
- Financeiro
- Prosumidores
- Relatorios
- Geracao

## Fluxo Financeiro

A tela financeira informa que nela ficam as faturas aprovadas na pagina de creditos. O usuario pode:

- conferir dados da fatura
- aprovar financeiramente
- visualizar faturas
- reenviar faturas
- tornar fatura paga
- parcelar fatura
- tornar fatura negativada
- arquivar fatura
- remover aprovacao e mover a fatura para creditos
- inserir dados de cobranca manualmente

## Endpoint Principal Observado

Tabela financeira:

- metodo: `GET`
- endpoint: `/financeiro_json`
- componente: `DataTable`
- paginacao: envia `page` com base na pagina atual do DataTable
- filtros: repassa parametros da URL atual para a chamada Ajax

Contrato documentado:

- [[05 - Projetos/ascender/contratos/digital-grid/Contrato REST - Digital Grid Financeiro|Contrato REST - Digital Grid Financeiro]]

## Campos Financeiros Observados

Campos retornados em `financeiro rest return.txt`:

- `pk`
- `payment_status`
- `a_company`
- `value`
- `a_regarding_date_str`
- `a_installation`
- `bill_generated`
- `distributor_bill`
- `is_approved_financial`
- `registered_at`
- `due_date`
- `installation_whatsapp`
- `installation_agent_whatsapp`
- `bar_code`
- `line_code`
- `billet_amount`
- `finance_can_be_approved`
- `generators_match`
- `a_generator_month`
- `generator_month_generator_representation`
- `a_regarding_date`
- `billet_pending_registration`

## Status de Pagamento Observados

No retorno de exemplo:

- `Aguardando`
- `Pago`

No JavaScript tambem aparecem acoes ou estados relacionados a:

- `Parcelado`
- `Negativado`
- `Vencido`

## Acoes de Fatura Observadas

Endpoints inferidos a partir dos links/acoes do frontend:

- `/aprovar-financeiro/{id}`
- `/cancelar-aprovacao/{id}`
- `/arquivar-fatura/{id}`
- `/tornar-negativado/{id}`
- `/tornar-parcelado/{id}`
- `/tornar-pago/{id}`
- `/reenviar-fatura/{id}?by=email`
- `/reenviar-fatura/{id}?by=whatsapp`
- `/download-fatura/{id}/bill_generated`
- `/arquivar-faturas`

Observacao: alguns endpoints sao chamados por links dinamicos montados no frontend. Antes de integrar, confirmar metodos reais, CSRF, permissoes e payloads esperados.

## Filtros Observados

O script `filter.txt` implementa filtros por checkbox e dropdown com contagem de selecao.

Filtros reconhecidos:

- distribuidora
- agente
- usina
- status
- mes
- ano

Comportamento:

- clique dentro do dropdown nao fecha o menu
- selecionar todos marca/desmarca todos os itens do grupo
- busca local filtra opcoes pelo texto do label
- ao fechar o dropdown, se houve mudanca de selecao, o formulario `filters-form` e submetido
- nomes de variaveis globais esperadas: `current_distributors`, `current_agents`, `current_plants`, `current_status`, `current_months`, `current_years`

## Geracao e kWh

O `main.txt` contem fluxo para buscar dados de geracao:

- funcao: `getGenerationData`
- endpoint inferido: `buscar-dados-geracao?plant_id={plant_id}&regarding={data}&step={step}`
- componente: grafico de linha com Chart.js
- campos esperados na resposta: `labels` e `values`
- indicadores calculados no front: total, minimo, maximo e media

Steps observados:

- `60`: visao por dia
- `1440`: visao mensal/dia
- `10080`: visao semanal
- `43200`: visao anual/mes
- `525600`: visao anual

## Energia Transferida e Faturamento

O fluxo `BillEnergyTransferred` mostra que a plataforma permite faturar energia transferida.

Campos de entrada observados:

- `kwh_with_tax`: tarifa de faturamento
- `due_date`: vencimento
- `injected_energy`: energia compensada
- `consumption`: consumo
- `balance_credits`: credito acumulado

Regras observadas:

- para uma unica fatura, aparecem tarifa, vencimento, energia compensada, consumo e credito acumulado
- para multiplas faturas, aparecem tarifa e vencimento
- `kwh_with_tax` e validado como valor monetario com ate 8 casas decimais

## Prosumidores e Creditos Financeiros

Fluxo identificado para historico financeiro de creditos:

- endpoint: `/consumidores/historico-financeiro-de-creditos/{installationId}`
- retorno esperado: objeto com `instances`
- campos exibidos: operacao, usuario, data/hora, valor, fatura, notas e saldo atual

Validacao local:

- valor da operacao deve ser maior que zero
- operacao de debito nao pode deixar saldo negativo

## Dados Operacionais Identificados

O retorno financeiro de exemplo indica:

- registros de faturas por cliente/prosumidor
- valor da fatura da ASCENDER
- valor do boleto
- referencia mensal
- instalacao/UC
- gerador/usina vinculada
- links temporarios para fatura gerada e fatura da distribuidora
- codigo de barras e linha digitavel
- controle de envio por e-mail/WhatsApp

Usinas/geradores vistos no material:

- `ASCENDER 01 (1357213)`
- `MORUMBI (845590)`
- `USINA ENCONTRO DAS AGUAS GO (4.317.640.012-22)`
- `USINA VITOR (743102)`
- `USINA VIVENDAS DO CAMPO (4.311.071.012-47)`

Distribuidoras vistas no material:

- `EQUATORIAL GO`
- `CEMIG`

Agente visto no material:

- `ASCENDER`

## Oportunidades Para Dashboard Proprio

Possiveis visoes a consolidar fora da Digital Grid:

- faturas por status
- inadimplencia por cliente, usina e mes
- total faturado versus total pago
- faturas aguardando pagamento
- vencimentos proximos
- faturas com falha de registro
- clientes com WhatsApp/e-mail habilitado
- valor de boleto versus valor de fatura
- consumo, energia compensada e credito acumulado por cliente
- geracao por usina comparada com rateio/faturamento
- divergencias de gerador: `generators_match = false`

## Riscos e Cuidados

- os arquivos contem dados sensiveis de clientes, boletos e URLs assinadas temporarias
- `bar_code`, `line_code`, links de faturas e nomes de clientes devem ser tratados como dado restrito
- qualquer integracao com Digital Grid deve confirmar permissao contratual, autenticacao, CSRF, limites e termos de uso
- nao assumir que os endpoints internos observados no frontend sao API publica
- URLs do S3 parecem temporarias e nao devem ser persistidas como fonte definitiva de arquivo

## Proximas Perguntas

- A ASCENDER tem acesso administrativo/API oficial da Digital Grid?
- O objetivo e apenas consolidar dashboard ou automatizar operacoes financeiras?
- A Digital Grid permite exportacao de relatorios?
- Os dados financeiros precisam ser conciliados com banco/ERP?
- Qual e a relacao esperada entre SolisCloud, Digital Grid e o sistema proprio?
- O dashboard proprio deve mostrar dados por cliente, usina, agente, distribuidora ou competencia?

