---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 67
chunk_id: 97cb52d54e7ec53c
kind: endpoint
---
# SolisCloud API - Pagina 67 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/epm/all`
- `UNKNOWN /v1/api/epm/all`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 67 -
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Array Y Data identification
year number Y Year
energy number N Power generation
epmSellEnergy number N Sell Energy of EPM
epmBuyEnergy number N Buy Energy of EPM
Code example
Request parameters
POST /v1/api/epm/all
Connection: keep-alive
Time: Wed, 28 Jun 2023 02:46:19 GMT
Content-MD5: TopIFbbEpLD0N0xViocHCw==
Content-Type: application/json
Authorization:API
1300386381676644416:6IlPSU37PZ0+0UnjQ8NE4DTLYFI=
token:
Date: Wed, 28 Jun 2023 02:46:19 GMT
Content-Length: 24
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"sn": "00FFC0011557002"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": [
{
"id": "1306507149559981588",
"money": 0.000,
"energy": 0.000,
"energyStr": "kWh",
"energyPec": "1",
"epmSellEnergy": 0,
"epmBuyEnergy": 0,
"year": 2023,
"timeZone": 8,
"gridPurchasedEnergy": 0,
"gridPurchasedIncome": 0.000,
