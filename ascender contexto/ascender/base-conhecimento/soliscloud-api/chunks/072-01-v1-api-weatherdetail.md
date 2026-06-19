---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 72
chunk_id: 85dcb0c27695fdc8
kind: endpoint
---
# SolisCloud API - Pagina 72 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/weatherDetail`
- `UNKNOWN /v1/api/weatherDetail`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 72 -
state number N Meteorological instrument status: 1=online, 2=offline
dataTimestamp number N Data update time under UTC+8. The format is a
timestamp.
totalR number N Total radiation, unit W/㎡
directR number N Direct radiation, unit W/㎡
scatteredR number N Scattered radiation, unit W/㎡
sunshineTim number N Sunlight duration, unit m
totalRday number N Total radiation daily accumulation, unit MJ/㎡
directRday number N Direct radiation daily accumulation, unit MJ/㎡
scatteredRday number N Accumulated daily scattered radiation,unit MJ/㎡
temp number N Temperature, unit taken as temperatureUnit
temperatureUnit String N temperature unit
humidity number N Humidity,unit %RH
windDirection number N wind direction
windSpeed number N Wind speed, unit m/s
airPressure number N Air pressure, unit Pa
rainfall number N Rainfall, unit mm
pvTemp number N Component temperature, unit taken as temperatureUnit
Code example
Request parameters
POST /v1/api/weatherDetail
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
"sn": "FFC00115570"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"collectorId": "1306858901386142611",
"simFlowState": -4,
"stationId": "1298491919448631809",
"stationName": "123",
"stationType": 0,
