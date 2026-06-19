---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 43
chunk_id: 03c4db13757b6969
kind: resposta_erro
---
# SolisCloud API - Pagina 43 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 43 -
"msg": "success",
"data": {
"stationStatusVo": {
"all": 0,
"normal": 0,
"fault": 0,
"offline": 0,
"building": 0,
"mppt": 0
},
"page": {
"records": [ ],
"total": 0,
"size": 10,
"current": 1,
"orders": [ ],
"optimizeCountSql": false,
"searchCount": true,
"pages": 0
},
"mpptSwitch": 0
}
}
3.8 Obtaining Quality Assurance Data for Multiple Inverters
Interface Name Obtaining Quality Assurance Data for Multiple Inverters
Interface Description Corresponding to SolisCloud platform warranty query.
Request URL https://www.soliscloud.com:13333/v1/api/inverter/shelfTime
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
pageNo number Y Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize number Y Specify the number of returns per page. The default
value is 20, and the maximum value is 100.
sn String N
Specify to query single or multiple inverter SNs.
When querying multiple, the SN is separated by ','. A
maximum of 1000 SNs at a time.
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y 0 represents success, while others represent failure.
