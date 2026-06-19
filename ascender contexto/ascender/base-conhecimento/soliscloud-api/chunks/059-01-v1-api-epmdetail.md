---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 59
chunk_id: d2479e92b1e4f7d8
kind: endpoint
---
# SolisCloud API - Pagina 59 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/epmDetail`
- `UNKNOWN /v1/api/epmDetail`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 59 -
pAc1 number N Power U
pAc2 number N Power V
pAc3 number N Power W
powerFactor number N Power factor
facMeter number N Grid frequency
Code example
Request parameters
POST /v1/api/epmDetail
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
"sn": "00FFC0011557002"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"id": "1306507149505459510",
"sn": "00FFC0011557002",
"collectorSn": "FFC00115570",
"collectorId": "1306858901386142611",
"stationId": "1298491919448631809",
"stationType": 0,
"stationTypeNew": 3,
"epmType": 1,
"synchronizationType": 0,
"gridSwitch1": 0,
"sno": "1085AC",
"timeZone": 10.00,
"timeZoneStr": "UTC+10:00",
"daylight": 0,
"state": 1,
"stateExceptionFlag": 0,
"epmDataTime": "1624959259",
"dataTimestamp": "1687918466519",
"rs485ComAddr": "101",
