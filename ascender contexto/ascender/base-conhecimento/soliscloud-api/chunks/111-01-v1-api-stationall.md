---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 111
chunk_id: 58023ac38e2041fa
kind: endpoint
---
# SolisCloud API - Pagina 111 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationAll`
- `UNKNOWN /v1/api/stationAll`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 111 -
gridPurchasedEnergy Number N Grid purchased energy
gridSellEnergy Number N Grid sell energy
Code example
Request parameters
POST /v1/api/stationAll
Connection: keep-alive
Date: Tue, 27 Jun 2023 11:00:40 GMT
Content-MD5: QEQONshrvlmBcpig9shdPg==
Authorization:API
1300386381676644416:/q0JL/CZU8jwSRL03QbTA9DfYgU=
Content-Type: application/json;charset=UTF-8
Content-Length: 66
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"id": "1298491919448631809",
"money": "CNY",
"nmiCode": "41028459350"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": [
{
"id": "1308652876792594370",
"money": 5616.000,
"moneyStr": "",
"moneyPec": "1",
"energy": 5616.000,
"energyStr": "MWh",
"energyPec": "0.001",
"fullHour": 468.00,
"year": 2023,
"timeZone": 8,
"batteryDischargeEnergy": 0,
"batteryChargeEnergy": 0,
"gridPurchasedEnergy": 0,
"gridPurchasedIncome": 0.000,
"gridSellEnergy": 0,
"gridSellIncome": 0.000,
"homeLoadEnergy": 0,
"oneSelf": 5616.000,
"consumeEnergy": 0,
"produceEnergy": 0,
