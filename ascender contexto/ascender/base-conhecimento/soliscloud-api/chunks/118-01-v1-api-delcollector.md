---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 118
chunk_id: c76fa6c44b864e86
kind: endpoint
---
# SolisCloud API - Pagina 118 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/delCollector`
- `UNKNOWN /v1/api/delCollector`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 118 -
"module": "",
"installerEmail ": "",
"installerMobile": "",
"nmiCode": "80023601742",
"mobile": "18957465251"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": "1298491919448634915"
}
4.14 Power station unbinding collector
Interface Name Power station unbinding collector
Interface Description Corresponding SolisCloud platform power station unbinding collector
Request URL https://www.soliscloud.com:13333/v1/api/delCollector
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
sn String N Collector SN
deleteInvert Integereger Y 1=delete all inverters together. 0=Do not delete.
Default not to delete
Return parameters [Body]
Parameter Name Data Type Required Description
code Integer Y 0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Integer Y Data identification
Code example
Request parameters
POST /v1/api/delCollector
Connection: keep-alive
Content-Type: application/json
Date: Wed, 28 Jun 2023 01:08:55 GMT
Content-MD5: 98i7tIiBFoRK45MOzLIBKw==
Authorization: API 1300386381676644416:2mxDrDd+y3032bL3g6MYX8Utcxc=
Content-Length: 39
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17){
{
"sn": "FFC00115564",
