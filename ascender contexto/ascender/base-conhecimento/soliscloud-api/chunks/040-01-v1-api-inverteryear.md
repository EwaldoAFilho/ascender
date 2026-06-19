---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 40
chunk_id: 418d6f18e5599a92
kind: endpoint
---
# SolisCloud API - Pagina 40 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/inverterYear`
- `UNKNOWN /v1/api/inverterYear`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 40 -
dateStr String N Data, format string
money Number N Income
moneyStr String N Unit of income
batteryDischargeEnergy number N Battery discharge energy
batteryChargeEnergy Number N Battery charging energy
gridPurchasedEnergy number N Grid purchased energy
gridSellEnergy Number N Grid sell energy
Code example
Request parameters
POST /v1/api/inverterYear
Connection: keep-alive
Date: Tue, 27 Jun 2023 11:27:46 GMT
Content-MD5: DX2ecuD6A/Nd1CyX7dOZyg==
Authorization: API 1300386381676644416:Sh/MgB/ddIuRItuE6zj238qkxd4=
Content-Type: application/json;charset=UTF-8
Content-Length: 94
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"id": "1308675217944611083",
"sn": "120B40198150131",
"money": "元",
"year": "2023",
"timeZone": "8"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": [
{
"inverterId": "1308675217944611083",
"id": "1308675218175749632",
"money": 359.476,
"moneyStr": "KAUD",
"moneyPec": "0.001",
"energy": 866.000,
"energyStr": "MWh",
"energyPec": "0.001",
"fullHour": 108.25000,
"date": 1672545600000,
"dateStr": "2023-01",
"timeZone": 8,
