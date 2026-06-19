---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 46
chunk_id: 71b941c86594157a
kind: endpoint
---
# SolisCloud API - Pagina 46 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/alarmList`
- `UNKNOWN /v1/api/alarmList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 46 -
alarmEndTime String N
1. Specify the alarm information found for
yyyy-MM-dd.
2. If this value is blank, it represents querying all.
nmiCode String N
1. Specify nmiCode to represent the information
under this nmi, which can be obtained from the list
of power plants.
2. If this value is blank, it represents querying the
information under the account.
Return parameters [Body]
Parameter Name Data Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object Y result list
total Integer Y Total number of lists
records Array Y Array of record
stationId Long Y Station ID
stationName String N Name of station
alarmDeviceSn String N Inverter SN
alarmCode String N Alarm code. Please refer to the fault information
table for detailed analysis.
alarmLevel String N Alarm level: 1=tip, 2=general, 3=emergency
alarmBegIntegerime Long N Alarm start time
alarmEndTime Long N Alarm end time
alarmMsg String N Alarm content
advice String N Alarm handling suggestions
state String N Alarm status: 0=pending, 1=processed, 2=restored
warningInfoData Integereger N Sub alarm code
Code example
Request parameters
POST /v1/api/alarmList
Connection: keep-alive
Date: Wed, 28 Jun 2023 02:14:44 GMT
Content-MD5: vSNnxiqefqgVUnS7iLaT5Q==
Authorization: API 1300386381676644416:0AkbOnxxeTgBIo9mjy2811KB98o=
Content-Type: application/json;charset=UTF-8
Content-Length: 122
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": "1",
"pageSize": "10",
