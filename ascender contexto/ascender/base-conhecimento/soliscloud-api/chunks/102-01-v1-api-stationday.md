---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 102
chunk_id: c07754864c4c9bd9
kind: endpoint
---
# SolisCloud API - Pagina 102 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationDay`
- `UNKNOWN /v1/api/stationDay`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 102 -
"size": 10,
"current": 1,
"orders": [ ],
"optimizeCountSql": true,
"searchCount": true,
"pages": 1
}
}
4.7 Obtain real-time data of a single power station on a certain day
Interface Name Obtain real-time data of a single power station on a certain day
Interface Description Daily chart of corresponding SolisCloud platform power station details
Request URL https://www.soliscloud.com:13333/v1/api/stationDay
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
id Integer N
Query the information of the specified power station
ID or power station NMI , both cannot be empty at
the same time.
money String Y Used to calculate revenue, e.g. EUR, CNY
time String Y Specify to query data for a certain day, format:
yyyy-MM-dd
timeZone Integer Y The time zone where the device is located. Example:
8
nmiCode String N NMI Code
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y 0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Array Y Data identification
power Number N Power
powerStr String N Unit of power
time Long N
Code example
Request parameters
POST /v1/api/stationDay
Connection: keep-alive
Date: Tue, 27 Jun 2023 06:49:36 GMT
Content-MD5: gvXLKbqHkJRwkiPCceCtSA==
Authorization: API
