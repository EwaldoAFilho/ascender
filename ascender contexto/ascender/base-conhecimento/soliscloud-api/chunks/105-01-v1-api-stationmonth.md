---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 105
chunk_id: a6c38466420b4b54
kind: endpoint
---
# SolisCloud API - Pagina 105 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationMonth`
- `UNKNOWN /v1/api/stationMonth`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 105 -
Request URL https://www.soliscloud.com:13333/v1/api/stationMonth
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
id Integer N
Query the information of the specified power
station ID or power station NMI , both cannot be
empty at the same time.
money String Y Used to calculate revenue, e.g. EUR, CNY
month String Y format: yyyy-MM
timeZone Integer Y The time zone where the device is located.
Example: 8
nmiCode String N NMI Code
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix
1.
msg String Y Description of code values
data Array Y Data identification
energy Number N Power generation
energyStr String N Unit of power generation
date number Y Data update time under UTC+8. The format is a
timestamp.. The format is a timestamp.
dateStr String Y Data, format string
money Number N Income
moneyStr String N Unit of income
batteryDischargeEnergy Number N Battery discharge energy
batteryChargeEnergy Number N Battery charging energy
gridPurchasedEnergy Number N Grid purchased energy
gridSellEnergy Number N Grid sell energy
Code example
Request parameters
POST /v1/api/stationMonth
Connection: keep-alive
Date: Tue, 27 Jun 2023 10:36:58 GMT
Content-MD5: hZtPtB6r9W7eGqoUm7yTpA==
Authorization:API
1300386381676644416:4+Ci/BiGu+QAnaHn7zAIlQJZl6M=
Content-Type: application/json;charset=UTF-8
Content-Length: 84
Host: test.soliscloud.com:3333
