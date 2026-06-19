---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 64
chunk_id: 159fb4a0e860e218
kind: endpoint
---
# SolisCloud API - Pagina 64 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/month`
- `UNKNOWN /v1/api/month`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 64 -
dateStr String Y Data, format string
energy number N Power generation
epmSellEnergy number N Sell Energy of EPM
epmBuyEnergy number N Buy Energy of EPM
Code example
Request parameters
POST /v1/api/month
Connection: keep-alive
Time: Wed, 28 Jun 2023 02:41:59 GMT
Content-MD5: P3y0vBtI9DkzBxNo6BXInw==
Content-Type: application/json
Authorization:API
1300386381676644416:eSyNqUbYhu5z80vIKiFxMr3poNY=
token:
Date: Wed, 28 Jun 2023 02:41:59 GMT
Content-Length: 111
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.18)
{
"sn": "00FFC0011557002",
"month": "2023-06"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": [
{
"id": "1306507149539028553",
"money": 0.000,
"energy": 0.000,
"energyStr": "kWh",
"energyPec": "1",
"epmSellEnergy": 0,
"epmBuyEnergy": 0,
"date": 1687924800000,
"dateStr": "2023-06-28",
"timeZone": 8,
"gridPurchasedEnergy": 0,
"gridPurchasedIncome": 0.000,
"gridSellEnergy": 0,
"gridSellIncome": 0.000,
"consumeEnergy": 0,
"produceEnergy": 0,
"offSetEnergy": 0,
