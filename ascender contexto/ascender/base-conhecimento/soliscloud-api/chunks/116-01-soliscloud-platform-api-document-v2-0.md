---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 116
chunk_id: 3870cdc85a5fd98a
kind: resposta_erro
---
# SolisCloud API - Pagina 116 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 116 -
"msg": "success",
"data": null
}
4.13 Binding a new collector to the power station
Interface Name Binding a new collector to the power station
Interface
Description Corresponding SolisCloud platform power station binding collector.
Request URL https://www.soliscloud.com:13333/v1/api/addStationBindCollector
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
sn String N
Collector SN. Fill in the new power station and bind it.
When there are multiple, please separate them with
commas.
stationName String Y Name of station
userId Number N Default owner's account
capacity String Y Installed capacity, Unit: kWp
picName String N Picture name
latitude String N Latitude
longitude String N Longitude
dip Number N Component inclination angle
azimuth Number N Component azimuth
money String N Currency type, used to calculate revenue, e.g. EUR, CNY
addr String N Detailed address of the power station
高德地图：
gdAreaCode Integereger N Retrieve address code through Google Map API
country Integereger N Country name
region Integereger N Region name
city Integereger N City name
price Number N Revenue per kWh
offset Number N Time zone offset
type Integereger N Type of power station, see Appendix 2 for details
synchronizationType Integereger N Grid connection type: 0=Full online, 1=Self use, 2=Off
grid
installTime String N Installation time of power station
module Integereger N Number of components
installerEmail String N Installer Email
installerMobile Integereger N Installer Mobile
