---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 49
chunk_id: 4ed8e1b5a36e1cc0
kind: endpoint
---
# SolisCloud API - Pagina 49 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/collectorList`
- `UNKNOWN /v1/api/collectorList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 49 -
state Integer N Inverter status: 1=online, 2=offline, 3=alarm
dataTimestamp Integer N Data update time under UTC+8. The format is
a timestamp.
contractTime Integer N Traffic expiration time
Code example
Request parameters
POST /v1/api/collectorList
Connection: keep-alive
Date: Tue, 27 Jun 2023 06:08:42 GMT
Content-MD5: Trz24rS6Ot0X3mHzTjNPww==
Authorization:API
1300386381676644416:H5snoTcVYy8btETT9efTikfo1Vk=
Content-Type: application/json;charset=UTF-8
Content-Length: 84
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": 1,
"pageSize": 10,
"stationId": "",
"nmiCode": "41028459350"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"collectionStatusVo": {
"all": 9,
"normal": 0,
"fault": 0,
"offline": 9
},
"page": {
"records": [
{
"id": "1306858901386141423",
"sn": "404314859",
"stationId": "1298491919448631809",
"state": 1,
"stateExceptionFlag": 0,
"gprsPackage": "A",
"simFlowState": -5,
"model": "",
