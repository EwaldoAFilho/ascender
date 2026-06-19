# Analise da Planilha - Controle de Usinas ASCENDER

Arquivo analisado: `C:\Users\slaye\Downloads\CONTROLE DE USINAS_EWALDO.xlsx`
Abas analisadas: `13`

## Resumo das Abas

| Aba | Linhas de dados | Colunas | Linha de cabecalho | Entidades provaveis |
|---|---:|---:|---:|---|
| Extrato 25 | 807 | 12 | 1 | faturas_pagamentos_propostas, competencias_periodos |
| Gastos Morumbi | 41 | 12 | 1 | faturas_pagamentos_propostas, competencias_periodos |
| Previsão Orç. | 30 | 18 | 2 | clientes_prosumidores, faturas_pagamentos_propostas |
| Usinas | 60 | 19 | 1 | usinas_ativos, clientes_prosumidores, medicoes_energia |
| Rateio | 56 | 12 | 2 | clientes_prosumidores, medicoes_energia |
| Dados | 51 | 11 | 1 | clientes_prosumidores, unidades_consumidoras, medicoes_energia |
| CINARA | 30 | 12 | 18 | apoio_operacional |
| Historico | 14 | 27 | 1 | usinas_ativos, clientes_prosumidores, medicoes_energia, faturas_pagamentos_propostas, competencias_periodos |
| Usina - Encontro | 7 | 11 | 4 | medicoes_energia, faturas_pagamentos_propostas, competencias_periodos |
| Usina - Vivendas | 6 | 10 | 4 | medicoes_energia, faturas_pagamentos_propostas, competencias_periodos |
| Usina - Vitor | 7 | 10 | 4 | medicoes_energia, faturas_pagamentos_propostas, competencias_periodos |
| Usina - Mardem | 12 | 11 | 4 | medicoes_energia, faturas_pagamentos_propostas, competencias_periodos |
| Usina - Ascender | 13 | 10 | 4 | medicoes_energia, faturas_pagamentos_propostas, competencias_periodos |

## Campos por Aba

### Extrato 25

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| Dia | `texto` | 100% | 807 | =DAY(E2), =DAY(E3), =DAY(E4), =DAY(E5) |
| Mês | `data_periodo` | 100% | 807 | =TEXT(E2,"mmmm"), =TEXT(E3,"mmmm"), =TEXT(E4,"mmmm"), =TEXT(E5,"mmmm") |
| Periodo | `categoria_status` | 100% | 1 | =MONTH(DATE(2024,MATCH(Tabela2[[#This Row],[Mês]],{"janeiro";"fevereiro";"março";"abril";"maio";"junho";"julho";"agosto";"setembro";"outubro";"novembro";"dezembro"},0),1)) |
| Ano | `data_periodo` | 100% | 807 | =YEAR(E2), =YEAR(E3), =YEAR(E4), =YEAR(E5) |
| Data | `data_periodo` | 100% | 249 | 2024-03-14T00:00:00, 2024-03-15T00:00:00, 2024-04-08T00:00:00, 2024-04-09T00:00:00 |
| Descrição | `categoria_status` | 100% | 143 | PIX RECEBIDO, ABERTURA, PIX ENVIADO, CR COB BLOQ COMP CONF RECEBIMENTO |
| Crédito (R$) | `monetario` | 72% | 264 | 911.29, 0, 1000, 1059.3 |
| Débito (R$) | `monetario` | 20% | 90 | 0, 494.9, 400, 392.46 |
| Valor | `monetario` | 100% | 318 | =G2+(H2*-1), =G3+(H3*-1), =G4+(H4*-1), =G5+(H5*-1) |
| TIPO | `categoria_status` | 32% | 2 | RECEITA, DESPESA |
| MOTIVO | `categoria_status` | 99% | 50 | DESPESA ADMINISTRATIVA, ABERTURA, ALUGUEL TERRENO, PORKS |
| DESCRIÇÃO2 | `texto` | 75% | 178 | REPOSIÇÃO DE VALORES, ABERTURA, LUZIA DOS SANTOS, NEOENERGIA |

### Gastos Morumbi

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| Dia | `numero` | 95% | 21 | 24, 20, 14, 6 |
| Mês | `data_periodo` | 95% | 6 | janeiro, fevereiro, março, outubro |
| Coluna1 | `numero` | 95% | 6 | 1, 2, 3, 10 |
| Ano | `data_periodo` | 95% | 2 | 2025, 2024 |
| Data | `data_periodo` | 95% | 25 | 24/01/2025, 20/01/2025, 14/01/2025, 06/01/2025 |
| Descrição | `texto` | 98% | 22 | PIX ENVIADO RAIMUNDO NONATO FERREIRA, PAGAMENTO CONTA LUZ EM CANAIS INTERNET NEOENERGIA BRASI, PIX ENVIADO KIWIFY, PIX ENVIADO METAL DESIGN FERRAGENS LT |
| Crédito (R$) | `monetario` | 24% | 10 | - 100,00, - 467,54, - 180,00, - 35,00 |
| Débito (R$) | `monetario` | 5% | 2 | 1000, 0.2 |
| Valor | `monetario` | 100% | 41 | -1500, -359, -137, -302.4 |
| TIPO | `categoria_status` | 32% | 1 | DESPESA |
| MOTIVO | `categoria_status` | 95% | 1 | USINA MORUMBI |
| DESCRIÇÃO2 | `texto` | 95% | 21 | PORTÃO DA USINA, NEOENERGIA, MATRIAL BASICO, CERCAMENTO MORUMBI |

### Previsão Orç.

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| NOME | `cadastro_pessoa_empresa` | 93% | 26 | ANDREA FALCÃO, NATALIA JURY, GIOVANA, ELIANA |
| CHAVE PIX: | `texto` | 73% | 13 | andreaduda@gmail.com, 61991282943, pejury@gmail.com, 09894632149 |
| VALOR | `monetario` | 40% | 12 | 30000, 5000, 60000, 7000 |
| 0.02 | `texto` | 30% | 9 | =C4*$D$3, =C5*$D$3, =C6*$D$3, =C7*0.02 |
| 2024-11-01T00:00:00 | `numero` | 27% | 8 | 100, 9619.62, 50, 1000 |
| 2024-12-01T00:00:00 | `texto` | 37% | 11 | =D4, =D5, 9619.62, 50 |
| 2025-01-01T00:00:00 | `numero` | 53% | 16 | =F4, =F5, 9619.62, 50 |
| 2025-02-01T00:00:00 | `numero` | 67% | 20 | =G4, =G5, 1200, 2000 |
| 2025-03-01T00:00:00 | `numero` | 53% | 16 | =H4, =H5, 1200, 2000 |
| 2025-04-01T00:00:00 | `numero` | 57% | 17 | =I4, =I5, 1200, 140 |
| 2025-05-01T00:00:00 | `numero` | 60% | 18 | =J4, =J5, 1200, 140 |
| 2025-06-01T00:00:00 | `numero` | 60% | 18 | =K4, =K5, 1200, 140 |
| 2025-07-01T00:00:00 | `numero` | 60% | 18 | =L4, =L5, 1200, 140 |
| 2025-08-01T00:00:00 | `numero` | 57% | 17 | =M4, =M5, 1200, 140 |
| 2025-09-01T00:00:00 | `numero` | 57% | 17 | =N4, =N5, 1200, 140 |
| 2025-10-01T00:00:00 | `numero` | 57% | 17 | =O4, =O5, 1200, 140 |
| 2025-11-01T00:00:00 | `numero` | 57% | 17 | =P4, =P5, 1200, 140 |
| 2025-12-01T00:00:00 | `numero` | 57% | 17 | =Q4, =Q5, 1200, 140 |

### Usinas

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| CLIENTE | `cadastro_pessoa_empresa` | 88% | 50 | USINA 01, USINA VITOR, USINA MORUMBI, VIVENDAS DO CAMPO |
| USINA | `cadastro_usina_ativo` | 78% | 6 | USINA VITOR, ASCENDER, MORUMBI, IGREJA AGUAS CLARAS |
| CONSUMO | `energia` | 95% | 41 | 11435, 12807, 10374, 13254 |
| SALDO | `numero` | 28% | 15 | 19416, 12431, 7908, 140000 |
| INJEÇÃO | `texto` | 2% | 1 | =C9-C3 |
| RATEIO | `texto` | 78% | 46 | 1, =C11/$C$25, =C12/$C$25, =C13/$C$25 |
| PERCENTUAL | `numero` | 78% | 9 | 0.22, 1, 0.25, 0.2 |
| NEOENERGIA | `energia` | 35% | 21 | 4.62, 1937.8, 1262.34, 147.31 |
| DIGITALGRID | `numero` | 33% | 20 | 9859.82, 4936.06, 492.89, 313.04 |
| GANHO | `texto` | 80% | 48 | =I9-H9, =I11-H11, =I12-H12, =I13-H13 |
| NEOENERGIA (2) | `energia` | 40% | 24 | 4.62, 2109.61, 1405.28, 152.09 |
| DIGITALGRID (2) | `texto` | 38% | 23 | 9093.19, 4667.2, 362.69, 389.22 |
| GANHO (2) | `texto` | 85% | 51 | =L9-K9, =L11-K11, =L12-K12, =L13-K13 |
| NEOENERGIA (3) | `energia` | 45% | 26 | 93.06, 113.58, 2303.93, 1521.84 |
| DIGITALGRID (3) | `numero` | 40% | 24 | 10600.23, 6021.82, 483.91, 450.54 |
| GANHO (3) | `texto` | 85% | 51 | =O9-N9, =O11-N11, =O12-N12, =O13-N13 |
| NEOENERGIA (4) | `energia` | 38% | 23 | 96.86, 2188.66, 1390.16, 147.54 |
| DIGITALGRID (4) | `numero` | 37% | 22 | 9706.24, 4932.53, 483.17, 376.55 |
| GANHO (4) | `texto` | 87% | 52 | =R2-Q2, =R9-Q9, =R11-Q11, =R12-Q12 |

### Rateio

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| CLIENTE | `cadastro_pessoa_empresa` | 93% | 45 | TT BURGER, CAROL ZAGAYA, HUGO FALCÃO, LUZIA DOS SANTOS |
| CONSUMO | `energia` | 82% | 25 | 6550, 3100, 650, 220 |
| SALDO | `numero` | 55% | 24 | 12431, 4135, 7908, 19 |
| RATEIO | `texto` | 62% | 31 | =SUM(D18:D31), RATEIO, =$C$1*E18, =$C$1*E19 |
| RATEIO % | `texto` | 86% | 22 | =B3/$C$1, =B4/$C$1, =B5/$C$1, =B6/$C$1 |
| DESCONTO | `texto` | 41% | 7 | 0.2, 0.25, 0.99, 0.15 |
| PREVISÃO | `texto` | 38% | 17 | =B3-D3, =B4-D4, =B5-D5, =B6-D6 |
| Coluna 8 | `texto` | 20% | 11 | =C3/G3, =C4/G4, =C5/G5, =C6/G6 |
| Coluna 9 | `numero` | 27% | 14 | 7523, 13830, 6471, 11548 |
| Coluna 10 | `vazio` | 0% | 0 |  |
| Coluna 11 | `vazio` | 0% | 0 |  |
| Coluna 12 | `vazio` | 0% | 0 |  |

### Dados

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| CLIENTE | `cadastro_pessoa_empresa` | 98% | 48 | USINA 01, USINA VITOR, USINA MORUMBI, VIVENDAS DO CAMPO |
| CPF / CNPJ | `texto` | 88% | 30 | 58.719.289/0001-83, 43.544.224/0001-77, 54.070.332/0001-71, 011.828.171-22 |
| RESPONSÁVEL | `texto` | 84% | 24 | 713.822.671-34, 851.617.301-10, 011.828.171-22, 694.116.971-00 |
| SENHA | `vazio` | 0% | 0 |  |
| COD INSTALAÇÃO PARC DE NEGOCIO | `cadastro_unidade_consumidora` | 75% | 38 | 1357213, 743102, 845590, 32903 |
| COD CLIENTE UNID CONSUMIDORA | `cadastro_pessoa_empresa` | 92% | 46 | 3.046.266-5, 3.172.067-6, 3.031.306-6, 431107101247 |
| ENDEREÇO | `texto` | 29% | 14 | SQNW 109 BL J SERVICO, CLS 202 BL A LJ 18, SQN 303 BL H AP 523, TERCEIRA AV AE 06 LT F P LJ 01 |
| CONSUMO | `energia` | 94% | 35 | 11435, 12807, 10374, 13254 |
| PERCENTUAL | `numero` | 84% | 9 | 0.22, 1, 0.25, 0.2 |
| Coluna 10 | `vazio` | 0% | 0 |  |
| Coluna 11 | `vazio` | 0% | 0 |  |

### CINARA

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| Coluna 1 | `texto` | 97% | 15 | 2026-04-01T00:00:00, 2026-03-01T00:00:00, 2026-02-01T00:00:00, 2026-01-01T00:00:00 |
| CASA 01 | `numero` | 100% | 29 | 234, 222, 157, 229 |
| CASA 02 | `numero` | 100% | 28 | 158, 131, 168, 165 |
| CASA 03 | `texto` | 90% | 26 | 297, 314, 272, 381 |
| CASA 04 | `numero` | 50% | 15 | 227, 255, 208, 233 |
| CASA 05 | `numero` | 50% | 15 | 323, 330, 261, 313 |
| CASA 06 | `numero` | 50% | 12 | 359, 254, 332, 310 |
| CASA 07 | `numero` | 50% | 12 | 178, 207, 184, 206 |
| CASA 08 | `numero` | 50% | 15 | 253, 311, 230, 316 |
| CASA 09 | `numero` | 50% | 15 | 683, 797, 500, 639 |
| CASA 10 | `numero` | 50% | 12 | 84, 81, 48, 30 |
| Coluna 12 | `texto` | 43% | 13 | =SUM(B20:K20), =SUM(B21:K21), =SUM(B22:K22), =SUM(B23:K23) |

### Historico

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| CLIENTE | `cadastro_pessoa_empresa` | 36% | 1 | FERNANDO GUIMARAES |
| DATA | `data_periodo` | 36% | 5 | 2026-04-01T00:00:00, 2026-03-01T00:00:00, 2026-02-01T00:00:00, 2026-01-01T00:00:00 |
| LEITURA ANTERIOR | `numero` | 36% | 5 | 88253, 89432, 90824, 92076 |
| LEITUTRA ATUIAL | `numero` | 36% | 5 | 89432, 90824, 92076, 93155 |
| CONSUMO | `energia` | 43% | 6 | 1155, 1068, 1271, 1310 |
| PARCELAMENTO | `numero` | 36% | 2 | 255.95, 403.13 |
| FIO B | `numero` | 36% | 5 | 108.19, 100.89, 119.01, 113.34 |
| CIP | `numero` | 36% | 2 | 150.6, 144.56 |
| TARIFA NEOENERGIA | `monetario` | 36% | 5 | 1.07, 0.9768639, 0.9682829, 0.9703436 |
| VALOR NEOENERGIA | `monetario` | 43% | 6 | =E3*I3+F3+H3, =E4*I4+F4+H4, =E5*I5+F5+H5, =E6*I6+F6+H6 |
| CONTA NEOENERGIA | `energia` | 36% | 1 | =#REF!+#REF! |
| TARIFA USINA | `monetario` | 36% | 5 | =I3*0.8, =I4*0.8, =I5*0.8, =I6*0.8 |
| DESCONTO NA TARIFA | `monetario` | 36% | 5 | =L3/I3-1, =L4/I4-1, =L5/I5-1, =L6/I6-1 |
| VALOR USINA | `monetario` | 43% | 6 | =L3*E3+F3+H3, =L4*E4+F4+H4, =L5*E5+F5+H5, =L6*E6+F6+H6 |
| ECONOMIA | `texto` | 43% | 6 | =J3-N3, =J4-N4, =J5-N5, =J6-N6 |
| GANHO REAL USINA | `cadastro_usina_ativo` | 100% | 14 | =N3-K3, =N4-K4, =N5-K5, =N6-K6 |
| Coluna 17 | `vazio` | 0% | 0 |  |
| Coluna 18 | `vazio` | 0% | 0 |  |
| Coluna 19 | `vazio` | 0% | 0 |  |
| Coluna 20 | `vazio` | 0% | 0 |  |
| Coluna 21 | `vazio` | 0% | 0 |  |
| Coluna 22 | `vazio` | 0% | 0 |  |
| Coluna 23 | `vazio` | 0% | 0 |  |
| PROPOSTA COMERCIAL | `texto` | 86% | 12 | Comercializadora/Representante, CONSORCIO ASCENDER SOLUCOES ENERGETICAS, CNPJ: 58.719.289/0001-83, Endereço: COL ÁGUAS CLARAS CH 57 |
| Coluna 25 | `texto` | 29% | 4 | Carência, 24 meses, Tarifa aplicada no último mês, =I3 |
| Coluna 26 | `texto` | 79% | 11 | Cliente/ Representada, ABENÇOADO BAR E RESTAURANTE LTDA, CNPJ nº: 21.584.723/0001-27, Endereço: CLN 207 BL A LJ 35 |
| Coluna 27 | `texto` | 29% | 4 | Distribuidora, Neoenergia Brasília S.A., Previsão de Economia - 12 meses, =O16 |

### Usina - Encontro

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| MÊS | `data_periodo` | 86% | 6 | 2025-11-01T00:00:00, 2025-12-01T00:00:00, 2026-01-01T00:00:00, 2026-02-01T00:00:00 |
| GERAÇÃO kWh | `energia` | 86% | 5 | 8091, 14996.55, 13204, 10137.93 |
| TARIFA | `monetario` | 86% | 6 | 1.095185, 1.169735, 1.125214, 1.12652 |
| BRUTO | `texto` | 86% | 6 | =B6*C6, =B7*C7, =B8*C8, =B9*C9 |
| FIO B | `numero` | 86% | 2 | 0.12, 0.17 |
| DESAGIO | `texto` | 86% | 6 | =C6*0.3, =C7*0.3, =C8*0.3, =C9*0.3 |
| ADM CONSORCIO | `texto` | 86% | 6 | =D6*0.08, =D7*0.08, =D8*0.08, =D9*0.08 |
| PARCELAMENTO LOTE | `numero` | 86% | 1 | 719 |
| LIQUIDO | `texto` | 86% | 6 | =((C6-E6-F6)*B6)-G6-H6, =((C7-E7-F7)*B7)-G7-H7, =((C8-E8-F8)*B8)-G8-H8, =((C9-E9-F9)*B9)-G9-H9 |
| PERCENTUAL | `texto` | 100% | 7 | =I6/$G$3, =I7/$G$3, =I8/$G$3, =I9/$G$3 |
| Coluna 11 | `texto` | 14% | 1 | MÉDIA |

### Usina - Vivendas

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| MÊS | `data_periodo` | 100% | 6 | 2025-11-01T00:00:00, 2025-12-01T00:00:00, 2026-01-01T00:00:00, 2026-02-01T00:00:00 |
| GERAÇÃO kWh | `energia` | 100% | 5 | 8091, 13371, 13205, 10171.81 |
| TARIFA | `monetario` | 100% | 6 | 1.095185, 1.169735, 1.125214, 1.12652 |
| BRUTO | `texto` | 100% | 6 | =B6*C6, =B7*C7, =B8*C8, =B9*C9 |
| FIO B | `numero` | 100% | 2 | 0.12, 0.17 |
| DESAGIO | `texto` | 100% | 6 | =C6*0.3, =C7*0.3, =C8*0.3, =C9*0.3 |
| ADM CONSORCIO | `texto` | 100% | 6 | =D6*0.1, =D7*0.1, =D8*0.1, =D9*0.1 |
| ARRENDAMENTO | `numero` | 100% | 1 | 719 |
| LIQUIDO | `texto` | 100% | 6 | =((C6-E6-F6)*B6)-G6-H6, =((C7-E7-F7)*B7)-G7-H7, =((C8-E8-F8)*B8)-G8-H8, =((C9-E9-F9)*B9)-G9-H9 |
| PERCENTUAL | `texto` | 100% | 6 | =I6/$G$3, =I7/$G$3, =I8/$G$3, =I9/$G$3 |

### Usina - Vitor

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| MÊS | `data_periodo` | 100% | 7 | 2025-10-01T00:00:00, 2025-11-01T00:00:00, 2025-12-01T00:00:00, 2026-01-01T00:00:00 |
| GERAÇÃO kWh | `energia` | 86% | 6 | 6394, 12678, 12130, 11569 |
| TARIFA | `monetario` | 86% | 6 | 0.9664579, 1.0013833, 1.0324457, 0.9800064 |
| BRUTO | `texto` | 100% | 7 | =B6*C6, =B7*C7, =B8*C8, =B9*C9 |
| FIO B | `numero` | 100% | 2 | 0.12, 0.17 |
| DESAGIO | `texto` | 100% | 7 | =C6*0.25, =C7*0.25, =C8*0.25, =C9*0.25 |
| ADM CONSORCIO | `texto` | 100% | 7 | =D6*0.1, =D7*0.1, =D8*0.1, =D9*0.1 |
| ARRENDAMENTO | `numero` | 100% | 1 | 0 |
| LIQUIDO | `texto` | 100% | 7 | =((C6-E6-F6)*B6)-G6-H6, =((C7-E7-F7)*B7)-G7-H7, =((C8-E8-F8)*B8)-G8-H8, =((C9-E9-F9)*B9)-G9-H9 |
| PERCENTUAL | `texto` | 100% | 7 | =I6/$G$3, =I7/$G$3, =I8/$G$3, =I9/$G$3 |

### Usina - Mardem

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| MÊS | `data_periodo` | 100% | 12 | 2025-05-01T00:00:00, 2025-06-01T00:00:00, 2025-07-01T00:00:00, 2025-08-01T00:00:00 |
| GERAÇÃO kWh | `energia` | 100% | 11 | 9004, 2708, 8342, 10105 |
| COMPENSADO kWh | `energia` | 67% | 8 | 0.8799221, 0.8956183, 6608, 7730 |
| TARIFA | `monetario` | 100% | 11 | 0.8799221, 0.8956183, 0.9284669, 0.9406574 |
| BRUTO | `texto` | 100% | 12 | =C6*D6, =C7*D7, =C8*D8, =C9*D9 |
| FIO B | `numero` | 75% | 5 | 0.0717771, 0.07171636363636363, 0.07620616570327553, 0.09364091858037579 |
| DESAGIO | `texto` | 100% | 12 | =D6*0.25, =D7*0.25, =D8*0.25, =D9*0.25 |
| ADM CONSORCIO | `texto` | 100% | 12 | =E6*0.08, =E7*0.08, =E8*0.08, =E9*0.08 |
| ARRENDAMENTO | `numero` | 100% | 2 | 0, 1 |
| LIQUIDO | `texto` | 100% | 12 | =((D6-F6-G6)*B6)-H6-I6, =((D7-F7-G7)*B7)-H7-I7, =((D8-F8-G8)*B8)-H8-I8, =((D9-F9-G9)*B9)-H9-I9 |
| PERCENTUAL | `texto` | 100% | 12 | =J6/$H$3, =J7/$H$3, =J8/$H$3, =J9/$H$3 |

### Usina - Ascender

| Campo | Classificacao | Preenchimento | Distintos | Exemplos |
|---|---|---:|---:|---|
| MÊS | `data_periodo` | 92% | 12 | 2025-05-01T00:00:00, 2025-06-01T00:00:00, 2025-07-01T00:00:00, 2025-08-01T00:00:00 |
| GERAÇÃO kWh | `energia` | 92% | 12 | 10724, 10706, 10344, 12011 |
| TARIFA | `monetario` | 92% | 11 | 0.8799221, 0.8956183, 0.9284669, 0.9406574 |
| BRUTO | `texto` | 92% | 12 | =B6*C6, =B7*C7, =B8*C8, =B9*C9 |
| FIO B | `numero` | 69% | 5 | 0.0717771, 0.07171636363636363, 0.07620616570327553, 0.09364091858037579 |
| DESAGIO | `texto` | 92% | 12 | =C6*0.3, =C7*0.3, =C8*0.3, =C9*0.3 |
| ADM CONSORCIO | `numero` | 92% | 1 | 0 |
| ARRENDAMENTO | `numero` | 92% | 2 | 400, 425 |
| LIQUIDO | `texto` | 100% | 13 | =((C6-E6-F6)*B6)-G6-H6, =((C7-E7-F7)*B7)-G7-H7, =((C8-E8-F8)*B8)-G8-H8, =((C9-E9-F9)*B9)-G9-H9 |
| PERCENTUAL | `texto` | 92% | 12 | =I6/$G$3, =I7/$G$3, =I8/$G$3, =I9/$G$3 |

## Leitura Inicial

- campos classificados como `cadastro_*` tendem a compor tabelas mestres
- campos classificados como `energia`, `monetario` e `data_periodo` tendem a compor fatos/transacoes
- a planilha deve ser normalizada antes de virar banco relacional
- dados de SolisCloud e Digital Grid devem entrar como fontes externas vinculadas por usina, unidade consumidora, cliente e competencia

## Proximos Passos

- validar com a ASCENDER quais abas sao alimentadas diariamente
- confirmar significado de cada coluna operacional
- definir chaves reais: usina, UC/instalacao, cliente, contrato e competencia
- separar cadastro inicial de movimentos mensais
- gerar mock de dados para o prototipo React
