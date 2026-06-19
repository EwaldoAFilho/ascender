---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 115
chunk_id: 94a19591288c20ed
kind: endpoint
---
# SolisCloud API - Pagina 115 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationUpdate`
- `UNKNOWN /v1/api/stationUpdate`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 115 -
Return parameters [Body]
Parameter Name Data Type Required Description
code Integer Y 0 represents success, while others represent failure. The
failure code is detailed in Appendix 1.
msg String Y Description of code values
data Integer Y Data identification
Code example
Request
parameters
POST /v1/api/stationUpdate
Connection: keep-alive
Content-Type: application/json
Date: Tue, 27 Jun 2023 11:39:26 GMT
Content-MD5: /xODsrSeC4vzAQJYwy3wxQ==
Authorization: API 1300386381676644416:qsdQn7j7OsAzm+5g0NViL2Nf2W0=
Content-Length: 474
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"id": "1298491919448632027",
"stationName": "autotest",
"addr": "hangzhouzhejiang",
"mobile": "18957465251",
"capacity": 20,
"longitude": "120.01144",
"latitude": "30.320861",
"dip": "",
"azimuth": "",
"price": "",
"gdAreaCode": "330110",
"country": 1,
"region": 862,
"city": 863,
"countryStr": "China",
"regionStr": "Zhejiang",
"cityStr": "Hangzhou",
"countyStr": "Binjiang District",
"module": "",
"installerEmail ": "",
"installerMobile": "",
"nmiCode": "",
"language": "1"
}
Return parameters
{
"success": true,
"code": "0",
