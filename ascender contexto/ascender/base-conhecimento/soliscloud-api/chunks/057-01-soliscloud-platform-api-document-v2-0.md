---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 57
chunk_id: 10530bc1aeed3f9b
kind: autenticacao
---
# SolisCloud API - Pagina 57 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 57 -
"stationId": "1298491919448631809",
"state": 1,
"stateExceptionFlag": 0,
"dataTimestamp": "1687918466519",
"dataTimestampStr": "2023-06-28 12:14:26
(UTC+10:00)",
"failSafe": 0,
"pEpmTotal": 3.900,
"pEpmTotalStr": "kW",
"eTotalBuy": 8.519,
"eTotalBuyStr": "MWh",
"eTotalSell": 8.819,
"eTotalSellStr": "MWh",
"pLimit": 90.190,
"timeZone": 10.00,
"timeZoneStr": "(UTC+10:00)",
"timeZoneName": "(UTC+10:00) ",
"idStr": "1306507149505459510"
}
],
"total": 1,
"size": 100,
"current": 1,
"orders": [ ],
"optimizeCountSql": false,
"searchCount": true,
"pages": 1
}
}
}
3.14 Obtaining Details of a Single EPM
Interface Name Obtaining Details of a Single EPM
Interface Description Corresponding SolisCloud Platform EPM Details
Request URL https://www.soliscloud.com:13333/v1/api/epmDetail
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
sn String Y Specify to query a certain EPM
Return parameters [Body]
Parameter Name Data
Type Required Description
