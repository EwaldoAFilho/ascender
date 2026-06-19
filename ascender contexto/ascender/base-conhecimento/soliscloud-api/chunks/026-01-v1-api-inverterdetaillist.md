---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 26
chunk_id: 8f0dcae492d8d7c4
kind: endpoint
---
# SolisCloud API - Pagina 26 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/inverterDetailList`
- `UNKNOWN /v1/api/inverterDetailList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 26 -
homeLoadTotalEnergy Number N Total load consumption
homeLoadTotalEnergyStr String N Unit of total load consumption
model String N Inverter model
type Integereger N Inverter type: 1=grid, 2=storage
name String N Inverter name
inverterMeterModel Integereger N Type of inverter meter, see Appendix 3
for details
stateExceptionFlag Integereger N
Inverter offline status: 0=normal
offline, 1=abnormal offline
collectorState Integereger N Collector status: 1=online, 2=offline
collectorModel String N Collector model
warningInfoData Integereger N Alarm information
productModel String N Product model
nationalStandards String N National Grid Standards
version String N Inverter software version
reactivePower Number N Inverter reactive power
reactivePowerStr String N Unit inverter reactive power
apparentPower Number N Inverter apparent power
apparentPowerStr String N Unit of inverter apparent power
dcPac Number N Total DC input power of inverter
dcPacStr String N Unit of total DC input power of
inverter
updateShelfEndTime Integereger N End time of warranty
Code example
Request parameters
POST /v1/api/inverterDetailList
Connection: keep-alive
Date: Wed, 28 Jun 2023 02:18:54 GMT
Content-MD5: sAGxE9QzeBN88qPrz+sCZQ==
Authorization:API
1300386381676644416:ewHgoms8cJSVoFo9wtCb40R6n7g=
Content-Type: application/json;charset=UTF-8
Content-Length: 30
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": "1",
"pageSize": "10"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
