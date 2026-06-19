# Registro de Decisoes - ASCENDER

## Objetivo

Registrar decisoes tomadas durante a evolucao do projeto ASCENDER, mantendo rastreabilidade entre necessidade de negocio, escolha tecnica e impacto no escopo.

## Decisoes

### 2026-04-30 - Criacao do projeto

Status: tomada

Decisao:

- criar projeto ASCENDER no Obsidian
- iniciar com estrutura de descoberta, dashboards, arquitetura e decisoes
- nao definir stack tecnica neste momento
- tratar dashboards como primeira frente provavel

Motivo:

- o sistema final ainda nao foi definido
- ainda faltam dados sobre empresa, processos, fontes e usuarios
- a primeira entrega deve ajudar a entender melhor o valor da solucao

Impacto:

- proximas conversas devem alimentar o levantamento inicial
- indicadores e arquitetura serao definidos a partir do contexto real informado

### 2026-04-30 - Base SolisCloud API exclusiva da ASCENDER

Status: tomada

Decisao:

- ingerir o PDF `SolisCloud Platform API Document V2.0.pdf`
- criar base de conhecimento isolada no projeto ASCENDER
- gerar chunks Markdown por trecho da documentacao
- gerar embeddings locais para busca semantica
- manter essa base separada da base geral de Fluig/Protheus

Motivo:

- a ASCENDER usa SolisCloud para monitorar a geracao das usinas
- os dashboards planejados dependem de entendimento tecnico da API
- a documentacao deve ficar rastreavel, consultavel e vinculada exclusivamente a empresa

Impacto:

- a arquitetura pode avaliar integracao direta com a API SolisCloud
- os endpoints detectados passam a orientar o desenho dos dashboards
- novas versoes do PDF devem ser reingeridas pelo script do projeto

### 2026-04-30 - Registro tecnico da Digital Grid

Status: tomada

Decisao:

- registrar a Digital Grid como sistema atual da ASCENDER para financeiro, clientes/prosumidores, faturas, pagamentos e kWh
- criar analise tecnica separada para os arquivos JavaScript/HTML recebidos
- criar contrato preliminar do endpoint financeiro observado
- nao tratar endpoints internos da Digital Grid como API publica sem validacao

Motivo:

- a ASCENDER utiliza a Digital Grid em uma parte essencial da operacao comercial
- os dashboards planejados devem considerar dados financeiros e de energia/consumo, nao apenas geracao tecnica do SolisCloud
- os arquivos recebidos contem dados sensiveis e precisam ficar restritos ao projeto ASCENDER

Impacto:

- o desenho do sistema proprio deve considerar pelo menos duas fontes: SolisCloud e Digital Grid
- a integracao com Digital Grid precisa de validacao tecnica e contratual
- os dashboards podem cruzar geracao, consumo, creditos, faturas e pagamentos

### 2026-04-30 - Prototipo React navegavel com mock

Status: tomada

Decisao:

- criar repositorio React em `C:\protheus\ascender-dashboard`
- iniciar com mock local em TypeScript
- validar dashboards e entidades antes de definir backend definitivo
- manter SolisCloud, Digital Grid e planilha operacional como fontes simuladas

Motivo:

- a maior incerteza ainda esta nos dados, regras e fluxo de uso
- um prototipo navegavel ajuda a validar telas com a ASCENDER antes de investir em integracoes reais
- o modelo relacional inicial precisa ser testado visualmente contra a rotina operacional

Impacto:

- o frontend passa a ser a principal ferramenta de descoberta funcional
- futuras APIs devem respeitar os contratos de dados que forem validados no mock
- o backend deve ser decidido depois da validacao dos dashboards, cadastros e filtros

### 2026-04-30 - Tema escuro e uso das logos

Status: tomada

Decisao:

- aplicar modo escuro como tema padrao do prototipo
- usar `logo-black.jpeg` no layout escuro
- reservar `logo-horizontal.jpeg` para layout claro futuro
- manter a paleta oficial da ASCENDER como base visual

Motivo:

- a empresa enviou versoes de logo para contextos diferentes
- o prototipo atual foi direcionado para uma experiencia operacional em modo escuro
- o uso correto da marca evita perda de contraste e melhora a percepcao visual do produto

Impacto:

- a interface atual deve continuar escura ate nova decisao
- uma alternancia claro/escuro pode ser implementada posteriormente
- assets de marca continuam organizados em `public/brand`
