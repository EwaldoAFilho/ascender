---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 98
chunk_id: f1f531f3d0ddeec9
kind: endpoint
---
# SolisCloud API - Pagina 98 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationMonthEnergyList`
- `UNKNOWN /v1/api/stationMonthEnergyList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 98 -
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object Y result list
total Integer Y Total number of lists
records Array Y Array of record
id number Y Station ID
energy number Y Power generation
date number Y Data update time under UTC+8. The format is a
timestamp.. The format is a timestamp.
dateStr String Y Data, format string
money number N Income
moneyStr number N Unit of income
batteryDischargeEnergy number N Battery discharge energy
batteryChargeEnergy number N Battery charging energy
gridPurchasedEnergy number N Grid purchased energy
gridSellEnergy number N Grid sell energy
Code example
Request parameters
POST /v1/api/stationMonthEnergyList
Connection: keep-alive
Date: Wed, 28 Jun 2023 02:27:57 GMT
Content-MD5: +6vavbBiUMIXHUP4LvAhMg==
Authorization:API
1300386381676644416:OjjngNHie/KHBWwAV6mPMti/fFg=
Content-Type: application/json;charset=UTF-8
Content-Length: 72
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": "1",
"pageSize": "100",
"time": "2023-06",
"nmiCode": "41028459350"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
