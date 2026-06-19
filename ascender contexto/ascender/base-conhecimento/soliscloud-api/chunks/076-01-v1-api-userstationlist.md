---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 76
chunk_id: 751e8576da39ad43
kind: endpoint
---
# SolisCloud API - Pagina 76 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/userStationList`
- `UNKNOWN /v1/api/userStationList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 76 -
batteryTodayChargeEnergy Number N Daily battery charging energy
gridPurchasedTodayEnergy Number N Daily grid purchased energy
gridSellTodayEnergy Number N Daily grid selling energy
homeLoadTodayEnergy Number N Daily load consumption
money String N Used to calculate revenue, e.g. EUR, CNY
fisPowerTime number N First power on time, format timestamp
fisGenerateTime number N First generation time, format timestamp
remark1 String N Remark 1
remark2 String N Remark 2
remark3 String N Remark 3
state number N Plant station status: 1=online, 2=offline, 3=alarm
dataTimestamp number N Data update time under UTC+8. The format is a
timestamp.
inverterPower String N Total rated power of inverter
nmiCode String N NMI Code
stationStatusVo Object N Power station status object
all number N Total number of power stations
normal number N Number of normal power stations
offline number N Number of offline power stations
fault number N Number of faulty power stations
Code example
Request parameters
POST /v1/api/userStationList
Connection: keep-alive
Date: Wed, 31 May 2023 09:12:23 GMT
Content-MD5: nyUAGqC1qeRnZ4vvgxK2ow==
Authorization: API 1300386381676565707:PqHiyhsQ8BILCrfIHshkS
ue5yzg=
Content-Type: application/json;charset=UTF-8
Content-Length: 70
Host: www.soliscloud.com:13333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": 1,
"pageSize": 10,
"nmiCode": ""
}
Return parameters
{
"code": "0",
"msg": "success",
"data": {
"stationStatusVo": {
"all": 0,
