---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 77
chunk_id: 79b8df5f739c214a
kind: resposta_erro
---
# SolisCloud API - Pagina 77 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 77 -
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
4.2 Obtaining Details of Individual Power Stations
Interface Name 4.2 Obtaining Details of Individual Power Stations
Interface Description Corresponding SolisCloud Platform Power Station Details
Request URL https://www.soliscloud.com:13333/v1/api/stationDetail
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type
Req
uire
d
Description
id number Y Query the detailed data of the specified Station
ID or Station nmiCode, both ID and nmiCode
cannot be empty at the same timenmiCode String N
Return parameters [Body]
Parameter Name Data
Type
Req
uire
d
Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix
1.
msg String Y Description of code values
data Object Y Data identification
id number Y Station ID
stationName number Y Name of station
