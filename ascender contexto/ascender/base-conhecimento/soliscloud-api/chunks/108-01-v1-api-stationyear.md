---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 108
chunk_id: 7dfbef12a07fd950
kind: endpoint
---
# SolisCloud API - Pagina 108 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationYear`
- `UNKNOWN /v1/api/stationYear`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 108 -
Type
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix
1.
msg String Y Description of code values
data Array Y Data identification
energy Number N Power generation
energyStr String N Unit of power generation
date number Y Data update time under UTC+8. The format is a
timestamp.. The format is a timestamp.
dateStr String Y Data, format string
money Number N Income
moneyStr String N Unit of income
batteryDischargeEnergy Number N Battery discharge energy
batteryChargeEnergy Number N Battery charging energy
gridPurchasedEnergy Number N Grid purchased energy
gridSellEnergy Number N Grid sell energy
Code example
Request parameters
POST /v1/api/stationYear
Connection: keep-alive
Date: Tue, 27 Jun 2023 10:57:37 GMT
Content-MD5: NXfNhwGdQe+6lxtZ4WKk/w==
Authorization:API
1300386381676644416:gSbrx4TdYOW0ljdk8Y9fFvI41xM=
Content-Type: application/json;charset=UTF-8
Content-Length: 80
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"id": "1298491919448631809",
"money": "CNY",
"year": "2023",
"nmiCode": "41028459350"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": [
{
"id": "1308652876059249630",
"money": 755.000,
