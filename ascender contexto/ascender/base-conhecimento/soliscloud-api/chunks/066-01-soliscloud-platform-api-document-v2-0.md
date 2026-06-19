---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 66
chunk_id: d09f0753eb32f072
kind: resposta_erro
---
# SolisCloud API - Pagina 66 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 66 -
{
"sn": "00FFC0011557002",
"year": "2023"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": [
{
"id": "1306507149551593479",
"money": 0.000,
"energy": 0.000,
"energyStr": "kWh",
"energyPec": "1",
"epmSellEnergy": 0,
"epmBuyEnergy": 0,
"date": 1685592000000,
"dateStr": "2023-06",
"timeZone": 8,
"gridPurchasedEnergy": 0,
"gridPurchasedIncome": 0.000,
"gridSellEnergy": 0,
"gridSellIncome": 0.000,
"consumeEnergy": 0,
"produceEnergy": 0,
"offSetEnergy": 0,
"offSetIncome": 0,
"errorFlag": 0
}
]
}
3.18 Obtaining Annual Data for a Single EPM
Interface Name Obtaining Annual Data for a Single EPM
Interface Description Corresponding SolisCloud Platform EPM Overall Chart
Request URL https://www.soliscloud.com:13333/v1/api/epm/all
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
sn String Y EPM_SN
Return parameters [Body]
