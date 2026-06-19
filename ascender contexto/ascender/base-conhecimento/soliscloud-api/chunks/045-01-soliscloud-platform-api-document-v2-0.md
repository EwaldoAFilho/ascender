---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 45
chunk_id: 1894d63fd41ce4b4
kind: parametros
---
# SolisCloud API - Pagina 45 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 45 -
"id": "1308675217944611083",
"deleteFlag": 0,
"sn": "120B40198150131",
"shelfState": "--",
"shelfTime": 0,
"shelfWarrantyType": 0
}
],
"total": 2,
"size": 20,
"current": 1,
"orders": [ ],
"optimizeCountSql": true,
"searchCount": true,
"pages": 1
}
}
3.9 Obtain the device alarm list under the account
Interface Name Obtain the device alarm list under the account
Interface Description Corresponding SolisCloud platform alarm information query.
Request URL https://www.soliscloud.com:13333/v1/api/alarmList
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
pageNo String N Specify the number of page numbers to return.
The default value is 1, representing page 1.
pageSize Integereger Y Specify the number of returns per page. The
default value is 20, and the maximum value is 100.
stationId Integereger N
1. Specify stationId to represent the information
under this power station, which can be obtained
from the list of power stations.
2. If this value is blank, it represents querying all
information under the account.
alarmDeviceSn String N
1. Specify alarmDeviceSn to represent the query
of alarm information under this inverter.
2. If this value is blank, it means querying all
alarm information of all inverters under this
account.
alarmBegIntegerime String N
1. Specify the alarm information since querying
yyyy-MM-dd
2. If this value is blank, it represents querying all.
