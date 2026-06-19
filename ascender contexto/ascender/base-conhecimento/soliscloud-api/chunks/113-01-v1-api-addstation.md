---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 113
chunk_id: 30b074fe3a4bbb44
kind: endpoint
---
# SolisCloud API - Pagina 113 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/addStation`
- `UNKNOWN /v1/api/addStation`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 113 -
Return parameters [Body]
Parameter Name Data
Type Required Description
code Integer Y 0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Integer Y Data identification
stationId Integer Y Station Id
Code example
Request parameters
POST /v1/api/addStation
Connection: keep-alive
Content-Type: application/json
Date: Tue, 27 Jun 2023 06:45:14 GMT
Content-MD5: TgcpDReudwzrqpKQhQxshw==
Authorization:API
1300386381676644416:Gssn7wg9PuyniGZ5KHf1L3DCC5M=
Content-Length: 545
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"stationName": "autotest22",
"userId": "",
"mobile": "18957465251",
"capacity": "10",
"picName": "",
"longitude": "120.01144",
"latitude": "30.320861",
"dip": "45",
"azimuth": "",
"addr": "",
"money": "CNY",
"gdAreaCode": "330110",
"country": 1,
"region": 862,
"city": 863,
"countryStr": "",
"regionStr": "",
"cityStr": "",
"countyStr": "",
"price": "",
"offset": "",
"module": "",
"installerEmail ": "",
"installerMobile": "",
