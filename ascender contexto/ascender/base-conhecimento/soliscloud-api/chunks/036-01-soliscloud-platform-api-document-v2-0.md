---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 36
chunk_id: 99cc8c6ee8e656cf
kind: autenticacao
---
# SolisCloud API - Pagina 36 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 36 -
Content-Type: application/json;charset=UTF-8
Content-Length: 100
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"id":"1308675217944611083",
"sn":"120B40198150131",
"money":"",
"time":"2023-06-27",
"timeZone":"8"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": [
{
"dataTimestamp": "1687813291000",
"timeStr": "2023-06-27 05:01:31",
"acOutputType": 1,
"dcInputType": 3,
"state": 1,
"time": "05:01:31",
"pac": 74.000,
"pacStr": "kW",
"pacPec": "0.001",
"eToday": 0.000,
"eTotal": 36362.000,
"uPv1": 245.3,
"iPv1": 0.1,
"uPv2": 243.0,
"iPv2": 0.1,
"uPv3": 244.7,
}
]
}
3.5 Obtaining Daily Data of a Single Inverter for a Month
Interface Name Obtaining Daily Data of a Single Inverter for a Month
Interface Description Monthly chart corresponding to SolisCloud platform inverter details.
Request URL https://www.soliscloud.com:13333/v1/api/inverterMonth
Interface frequency
limit 2 times/sec
