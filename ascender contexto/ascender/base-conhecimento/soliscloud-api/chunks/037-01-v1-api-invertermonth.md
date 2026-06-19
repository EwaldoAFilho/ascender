---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 37
chunk_id: e0726b2891f8d791
kind: endpoint
---
# SolisCloud API - Pagina 37 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/inverterMonth`
- `UNKNOWN /v1/api/inverterMonth`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 37 -
Request parameters [Body]
Parameter Name Data Type Required Description
id number N Query the data of the specified inverter ID
or inverter SN, and both ID and SN cannot be
empty at the same time.sn String N
money String Y Used to calculate revenue, e.g. EUR, CNY
month String Y Query data for a specified month in the format of
'yyyy MM'
Return parameters [Body]
Parameter Name Data Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
energy number N Power generation
energyStr String N Unit of power generation
date Number N Data, format timestamp
dateStr String N Data, format string
money Number N Income
moneyStr String N Unit of income
batteryDischargeEnergy number N Battery discharge energy
batteryChargeEnergy Number N Battery charging energy
gridPurchasedEnergy number N Grid purchased energy
gridSellEnergy Number N Grid sell energy
Code example
Request parameters
POST /v1/api/inverterMonth
Connection: keep-alive
Date: Tue, 27 Jun 2023 11:25:25 GMT
Content-MD5: Sdjc8y5oT63JIHwqy/J5ew==
Authorization:API 1300386381676644416:lrfIOa5z7mm6TnKGxT0lDV1lRmk=
Content-Type: application/json;charset=UTF-8
Content-Length: 98
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"id": "1308675217944611083",
"sn": "120B40198150131",
"money": "",
"month": "2023-06",
"timeZone": "8"
}
