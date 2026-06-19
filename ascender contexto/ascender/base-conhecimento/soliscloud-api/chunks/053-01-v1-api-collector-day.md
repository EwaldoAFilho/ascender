---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 53
chunk_id: b0fd503a179f817e
kind: endpoint
---
# SolisCloud API - Pagina 53 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/collector/day`
- `UNKNOWN /v1/api/collector/day`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 53 -
3.12 Obtaining Single Collector Signal Values
Interface Name Obtaining Single Collector Signal Values
Interface Description Corresponding SolisCloud Platform Collector Signal Chart.
Request URL https://www.soliscloud.com:13333/v1/api/collector/day
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
sn String Y Query the information of the specified collector SN
time String Y Query information for a specified date, for example:
yyyy-MM-dd
timeZone number Y The time zone where the device is located. Example: 8
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
collectorId number N Collector ID
collectorSn String N Collector SN
dataTimestamp number N Data update time under UTC+8. The format is a
timestamp.
timeStr String N Update time, string converted based on the time zone
of the collector
pec number N Signal strength percentage, in%
rssi number N Signal strength value
rssiLevel number N Signal strength level
Code example
Request parameters
POST /v1/api/collector/day
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
"sn": "FFC11553396",
