---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 8
chunk_id: f04e5f2e778961e7
kind: endpoint
---
# SolisCloud API - Pagina 8 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/inverterList`
- `UNKNOWN /v1/api/inverterList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 8 -
sn String N Inverter SN
stationId Integer N Station ID
stationName String N Name of station
userId Integer N Owner ID
power String N Installed capacity
powerStr String N Unit of installed capacity
etoday Number N Daily power generation
etoday1 Number N Original value of daily electricity generation
etodayStr Number N Unit of daily power generation
etotal Number N Total power generation
etotal1 Number N Original value of total power generation
etotalStr Number N Unit of total power generation
fullHour Number N Full power hours, power generation divided by
rated power
pac Number N Power
pacStr Number N Unit of power
state Integer N Inverter status: 1=online, 2=offline, 3=alarm
dataTimestamp Integer N Data update time under UTC+8. The format is a
timestamp.
collectorSn String N Collector SN
productModel String N Inverter type: 1=grid, 2=storage
dcInputType Integer N
Number of DC input channels: value+1=actual
number of channels.
For example, 0=1 channel, 1=2 channels, 2=3
channels, and so on
acOutputType Integer N AC output class: 0=single-phase,
others=three-phase
series String N Inverter series
name String N Inverter name
addr String N Station address
collectorState Integer N Collector status: 1=online, 2=offline
stateExceptionFlag Integer N Inverter offline status: 0=normal offline,
1=abnormal offline
totalFullHour Number N Total full power hours, total power generation
divided by rated power
inverterMeterModel Integer N Type of inverter meter, see Appendix 3 for details
createDate Integer N Date of data creation
updateShelfEndTime Integer N End time of warranty
Code example
Request parameters POST /v1/api/inverterList
Connection: keep-alive
