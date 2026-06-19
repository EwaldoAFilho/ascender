---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 97
chunk_id: ca996770c39277fe
kind: resposta_erro
---
# SolisCloud API - Pagina 97 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 97 -
"gridPurchasedEnergy": 0,
"gridPurchasedIncome": 0.000,
"gridSellEnergy": 0,
"gridSellIncome": 0.000,
"homeLoadEnergy": 761.000,
"oneSelf": 761.000,
"consumeEnergy": 761.000,
"produceEnergy": 761.000,
"consumePec": 0.00,
"producePec": 0.00,
"offSetEnergy": 0.000,
"offSetIncome": 0.000,
"totalR": 5.243000,
"directR": 3.389000,
"errorFlag": 0
}
],
"total": 1,
"size": 100,
"current": 1,
"orders": [ ],
"optimizeCountSql": true,
"searchCount": true,
"pages": 1
}
}
4.5 Obtaining Daily Data of Multiple Power Stations for a Month
Interface Name Obtaining Daily Data of Multiple Power Stations for a Month
Interface Description Corresponding monthly chart of SolisCloud platform power station
Request URL https://www.soliscloud.com:13333/v1/api/stationMonthEnergyList
Interface frequency
limit 10 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
pageNo number Y Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize number Y Specify the number of returns per page. The default
value is 20, and the maximum value is 100.
stationIds String N Station Id
nmiCode String N NMI Code
Return parameters [Body]
