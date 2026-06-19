# Modelo Relacional Inicial - ASCENDER

## Objetivo

Transformar a planilha operacional `CONTROLE DE USINAS_EWALDO.xlsx`, a Digital Grid e a API SolisCloud em uma estrutura relacional futura para dashboards, propostas comerciais e acompanhamento operacional.

## Fontes Mapeadas

## Planilha Operacional

Arquivo:

- `C:/Users/slaye/Downloads/CONTROLE DE USINAS_EWALDO.xlsx`

Abas analisadas:

- `Extrato 25`
- `Gastos Morumbi`
- `Previsao Orc.`
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

Analise automatizada:

- [[05 - Projetos/ascender/_analises/planilhas/Analise da Planilha - Controle de Usinas ASCENDER|Analise da Planilha - Controle de Usinas ASCENDER]]

## Sistemas Externos

- SolisCloud: geracao tecnica, usinas, inversores, alarmes e historico de energia
- Digital Grid: clientes/prosumidores, faturas, pagamentos, creditos, consumo, rateio e dados comerciais

## Leitura de Dominios

## Cadastros Iniciais

Esses dados devem virar tabelas mestres. Devem ser cadastrados antes dos movimentos mensais.

## Empresas, Clientes e Prosumidores

Origem principal:

- aba `Dados`
- aba `Rateio`
- aba `Usinas`
- Digital Grid

Campos candidatos:

- nome do cliente
- CPF/CNPJ
- responsavel
- endereco
- codigo cliente unidade consumidora
- chave PIX, quando for investidor/recebedor
- contato para envio de faturas
- status ativo/inativo

Tabela sugerida:

```sql
clientes (
  id,
  nome,
  documento,
  tipo_pessoa,
  responsavel_documento,
  endereco,
  origem,
  ativo
)
```

## Unidades Consumidoras

Origem principal:

- aba `Dados`
- Digital Grid

Campos candidatos:

- codigo de instalacao/parceiro de negocio
- codigo cliente da unidade consumidora
- cliente vinculado
- distribuidora
- endereco
- consumo medio
- percentual de rateio

Tabela sugerida:

```sql
unidades_consumidoras (
  id,
  cliente_id,
  codigo_instalacao,
  codigo_cliente_distribuidora,
  distribuidora_id,
  endereco,
  consumo_medio_kwh,
  ativo
)
```

## Usinas

Origem principal:

- aba `Usinas`
- abas `Usina - *`
- SolisCloud
- Digital Grid

Campos candidatos:

- nome da usina
- codigo interno
- codigo Digital Grid
- stationId ou identificador SolisCloud
- potencia instalada
- distribuidora
- status operacional
- percentual administrativo
- tipo de arrendamento

Tabela sugerida:

```sql
usinas (
  id,
  nome,
  codigo_digital_grid,
  station_id_soliscloud,
  distribuidora_id,
  potencia_kwp,
  status,
  origem
)
```

## Distribuidoras

Origem:

- Digital Grid
- planilha

Tabela sugerida:

```sql
distribuidoras (
  id,
  nome,
  uf,
  ativo
)
```

## Contratos e Regras Comerciais

Origem:

- aba `Historico`
- aba `Previsao Orc.`
- proposta comercial
- regras usadas nas abas por usina

Campos candidatos:

- cliente
- unidade consumidora
- usina
- tarifa aplicada
- desconto/desagio
- percentual de administracao
- carencia
- prazo
- regra de economia
- data de inicio
- status

Tabela sugerida:

```sql
contratos (
  id,
  cliente_id,
  unidade_consumidora_id,
  usina_id,
  data_inicio,
  prazo_meses,
  carencia_meses,
  tarifa_base,
  percentual_desconto,
  percentual_administracao,
  status
)
```

## Movimentos e Fatos

Esses dados mudam mensalmente ou diariamente e devem alimentar dashboards.

## Medicoes de Geracao

Origem:

- abas `Usina - *`
- SolisCloud
- Digital Grid, quando aplicavel

Tabela sugerida:

```sql
medicoes_geracao (
  id,
  usina_id,
  competencia,
  data_medicao,
  geracao_kwh,
  compensado_kwh,
  fonte,
  importado_em
)
```

## Resultado Mensal da Usina

Origem:

- abas `Usina - Encontro`, `Usina - Vivendas`, `Usina - Vitor`, `Usina - Mardem`, `Usina - Ascender`

Campos observados:

- mes
- geracao kWh
- tarifa
- bruto
- fio B
- desagio
- administracao consorcio
- arrendamento
- liquido
- percentual

Tabela sugerida:

```sql
resultados_usina_mensal (
  id,
  usina_id,
  competencia,
  geracao_kwh,
  compensado_kwh,
  tarifa,
  valor_bruto,
  fio_b,
  valor_desagio,
  valor_administracao,
  valor_arrendamento,
  valor_liquido,
  percentual_resultado
)
```

## Rateio de Energia

Origem:

- aba `Rateio`
- aba `Usinas`
- Digital Grid

Tabela sugerida:

```sql
rateios (
  id,
  competencia,
  usina_id,
  unidade_consumidora_id,
  consumo_kwh,
  saldo_kwh,
  rateio_kwh,
  percentual_rateio,
  desconto_percentual,
  previsao_kwh
)
```

## Faturas e Pagamentos

Origem:

- Digital Grid
- aba `Extrato 25`
- aba `Historico`

Tabela sugerida:

```sql
faturas (
  id,
  origem_id,
  cliente_id,
  unidade_consumidora_id,
  usina_id,
  competencia,
  valor_fatura,
  valor_boleto,
  vencimento,
  status_pagamento,
  linha_digitavel_hash,
  url_fatura_temporaria,
  origem
)
```

## Extrato Financeiro

Origem:

- aba `Extrato 25`
- aba `Gastos Morumbi`

Tabela sugerida:

```sql
movimentos_financeiros (
  id,
  data_movimento,
  tipo,
  motivo,
  descricao_original,
  descricao_normalizada,
  valor_credito,
  valor_debito,
  valor_liquido,
  usina_id,
  cliente_id,
  origem
)
```

## Propostas Comerciais

Origem:

- aba `Historico`
- aba `Previsao Orc.`
- dados de consumo, tarifa e economia

Tabela sugerida:

```sql
propostas_comerciais (
  id,
  cliente_id,
  unidade_consumidora_id,
  distribuidora_id,
  consumo_estimado_kwh,
  tarifa_distribuidora,
  tarifa_usina,
  economia_estimada_mensal,
  economia_estimada_12m,
  percentual_desconto,
  status,
  criada_em
)
```

## Relacionamentos Principais

- `clientes` 1:N `unidades_consumidoras`
- `distribuidoras` 1:N `unidades_consumidoras`
- `distribuidoras` 1:N `usinas`
- `usinas` 1:N `medicoes_geracao`
- `usinas` 1:N `resultados_usina_mensal`
- `usinas` 1:N `rateios`
- `unidades_consumidoras` 1:N `rateios`
- `unidades_consumidoras` 1:N `faturas`
- `clientes` 1:N `faturas`
- `clientes` 1:N `propostas_comerciais`
- `usinas` 1:N `contratos`

## Dados de Cadastro Inicial

Prioridade para carga manual/importacao inicial:

1. distribuidoras
2. usinas
3. clientes/prosumidores
4. unidades consumidoras
5. contratos/regras comerciais
6. parametros de tarifa, desconto, administracao e arrendamento

## Dados de Movimento

Entram de forma recorrente:

1. geracao por usina
2. consumo por unidade consumidora
3. rateio mensal
4. faturas
5. pagamentos/status financeiro
6. movimentos de extrato
7. resultados mensais por usina

## Integracao com SolisCloud

Objetivo:

- alimentar `medicoes_geracao`
- validar geracao informada na planilha
- permitir dashboard tecnico por usina

Chaves a validar:

- nome da usina na planilha
- codigo Digital Grid
- `stationId` SolisCloud
- identificador de inversor/coletor, se necessario

## Integracao com Digital Grid

Objetivo:

- alimentar `faturas`
- alimentar status de pagamento
- alimentar consumo, energia compensada e credito acumulado
- validar rateio e valores cobrados

Chaves a validar:

- codigo de instalacao/UC
- cliente/prosumidor
- gerador/usina
- competencia
- identificador interno da fatura

## Pontos de Atencao

- a planilha mistura cadastro, movimentos, formulas e proposta comercial
- algumas abas por usina possuem estrutura semelhante, mas nao identica
- nomes de clientes e usinas precisam ser normalizados
- formulas com `#REF!` devem ser revisadas antes de virar regra de sistema
- dados sensiveis como CPF/CNPJ, responsaveis, boleto e linha digitavel devem ter controle de acesso
- URLs assinadas da Digital Grid nao devem ser persistidas como documento definitivo

