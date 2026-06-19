---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 107
chunk_id: 2a54bd09e0930cf9
kind: resposta_erro
---
# SolisCloud API - Pagina 107 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 107 -
"energyStr": "kWh",
"energyPec": "1",
"fullHour": 3.74,
"date": 1687838400000,
"dateStr": "2023-06-30",
"timeZone": 8,
"batteryDischargeEnergy": 0,
"batteryChargeEnergy": 0,
"gridPurchasedEnergy": 0,
"gridPurchasedIncome": 0.000,
"gridSellEnergy": 0,
"gridSellIncome": 0.000,
"homeLoadEnergy": 44.900,
"consumeEnergy": 0,
"produceEnergy": 0,
"offSetEnergy": 0.000,
"offSetIncome": 0.000,
"totalR": 0,
"directR": 0,
"errorFlag": 0
}
]
}
4.9 Obtaining Monthly Data of a Single Power Plant for a Certain Year
Interface Name 4.9 Obtaining Monthly Data of a Single Power Plant for a Certain
Year
Interface Description Annual chart of corresponding SolisCloud platform power station details
Request URL https://www.soliscloud.com:13333/v1/api/stationYear
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
id Integer N
Query the information of the specified power
station ID or power station NMI , both cannot be
empty at the same time.
money String Y Used to calculate revenue, e.g. EUR, CNY
year String Y format: yyyy
timeZone Integer Y The time zone where the device is located.
Example: 8
nmiCode String N NMI Code
Return parameters [Body]
Parameter Name Data Required Description
