---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 44
chunk_id: 6b8f7746d5e60505
kind: endpoint
---
# SolisCloud API - Pagina 44 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/inverter/shelfTime`
- `UNKNOWN /v1/api/inverter/shelfTime`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 44 -
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object Y result list
total Integer Y Total number of lists
records Array Y Array of record
id number Y Inverter ID
sn String Y Inverter SN
shelfBeginTime number N Start time of warranty
shelfEndTime number N End time of warranty
shelfTime number N Warranty period
shelfState number N Warranty status: 0=Under warranty, 1=Over warranty
Code example
Request parameters
POST /v1/api/inverter/shelfTime
Connection: keep-alive
Date: Wed, 28 Jun 2023 06:42:38 GMT
Content-MD5: YyrTpXdCTJN377g1hYLcJw==
Authorization:API
1300386381676644416:k+aaQOt5Tr3M4YmLpKjJUoQgum4=
Content-Type: application/json;charset=UTF-8
Content-Length: 45
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": "1",
"pageSize": "20",
"sn": "120B40198150131"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"records": [
{
"id": "1308675217944612369",
"deleteFlag": 0,
"sn": "00FFC1155339601",
"shelfState": "--",
"shelfTime": 0,
"shelfWarrantyType": 0
},
{
