---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 119
chunk_id: f1c586dd5e1259c4
kind: endpoint
---
# SolisCloud API - Pagina 119 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/addDevice`
- `UNKNOWN /v1/api/addDevice`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 119 -
"deleteInvert": "0"
}
or
{
"sn": "FFC00115569",
"deleteInvert": "1"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": null
}
4.15 Power plant binding inverter
Interface Name 4.15 Power plant binding inverter
Interface Description -
Request URL https://www.soliscloud.com:13333/v1/api/addDevice
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
id Integer N Choose between power station ID and nmiCode
sn String Y Use commas to separate multiple inverter SNs
nmiCode String N NMI Code
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y 0 represents success, while others represent
failure. The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Array Y Data identification
Code example
Request parameters
POST /v1/api/addDevice
Connection: keep-alive
Content-Type: application/json
Date: Tue, 27 Jun 2023 11:13:56 GMT
Content-MD5: K+B2qWZo6EmGpxL+p3A8rA==
Authorization:API
1300386381676644416:Nm6WNyb1BoV8nsdihYbaOMp77rY=
Content-Length: 60
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
