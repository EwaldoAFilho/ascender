---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 69
chunk_id: 3c481993d814db3b
kind: endpoint
---
# SolisCloud API - Pagina 69 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/weatherList`
- `UNKNOWN /v1/api/weatherList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 69 -
records Array Y Array of record
id number Y Meteorological instrument ID
collectorSn String N Collector SN
collectorId number N Collector ID
name String N Meteorological instrument name
weatherModel String N Meteorological instrument model: 1=Jinzhou Sunshine,
2=Jinzhou Licheng
userId number N Owner ID
stationId number N Station ID
stationName String N Name of station
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
POST /v1/api/weatherList
Connection: keep-alive
Date: Wed, 28 Jun 2023 06:42:38 GMT
Content-MD5: YyrTpXdCTJN377g1hYLcJw==
Authorization: API
1300386381676644416:k+aaQOt5Tr3M4YmLpKjJUoQgum4=
Content-Type: application/json;charset=UTF-8
Content-Length: 45
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"pageNo": "1",
