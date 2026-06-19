---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 56
chunk_id: 0ff564616b02b0e5
kind: endpoint
---
# SolisCloud API - Pagina 56 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/epmList`
- `UNKNOWN /v1/api/epmList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 56 -
pEpmTotal number N EPM total power
pEpmTotalStr String N Unit of EPM total power
eTotalBuy number N Total purchase energy of grid
eTotalBuyStr String N Unit of total energy volume of grid
eTotalSell number N Total selling energy of grid
eTotalSellStr String N Unit of total selling energy of grid
Code example
Request parameters
POST /v1/api/epmList
Connection: keep-alive
Date: Wed, 28 Jun 2023 02:35:23 GMT
Content-MD5: eJ3ZPauZc7s2G8vzz8U66Q==
Authorization:API
1300386381676644416:tlS4UEPtWVCA0/qdhKThq9A7BH8=
Content-Type: application/json;charset=UTF-8
Content-Length: 89
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": "1",
"pageSize": "100",
"stationId": "1298491919448631809",
"nmiCode": "41028459350"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"epmStatusVo": {
"all": 20,
"normal": 1,
"fault": 0,
"offline": 19,
"mppt": 0
},
"page": {
"records": [
{
"id": "1306507149505459510",
"sn": "00FFC0011557002",
"collectorId": "1306858901386142611",
"collectorSn": "FFC00115570",
"simFlowState": -4,
