---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 42
chunk_id: 610d60611f68482f
kind: endpoint
---
# SolisCloud API - Pagina 42 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/userStationList`
- `UNKNOWN /v1/api/userStationList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 42 -
Interface Name Obtaining Annual Data of a Single Inverter
Interface Description The cumulative chart corresponding to the SolisCloud platform inverter.
Request URL https://www.soliscloud.com:13333/v1/api/inverterAll
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
id number N Query the data of the specified inverter ID or
inverter SN, and both ID and SN cannot be
empty at the same time.sn String N
money String Y Used to calculate revenue, e.g. EUR, CNY
Return parameters [Body]
Parameter Name Data Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix
1.
msg String Y Description of code values
data Object Y Data identification
year Integer Y Year
energy number N Power generation
energyStr String N Unit of power generation
batteryDischargeEnergy number N Battery discharge energy
batteryChargeEnergy Number N Battery charging energy
gridPurchasedEnergy number N Grid purchased energy
gridSellEnergy Number N Grid sell energy
Code example
Request parameters
POST /v1/api/userStationList
Connection: keep-alive
Date: Wed, 31 May 2023 09:12:23 GMT
Content-MD5: nyUAGqC1qeRnZ4vvgxK2ow==
Authorization: API 1300386381676565707:PqHiyhsQ8BILCrfIHshkSue5yzg=
Content-Type: application/json;charset=UTF-8
Content-Length: 70
Host: www.soliscloud.com:13333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": 1,
"pageSize": 10,
"nmiCode": ""
}
Return parameters {
"code": "0",
