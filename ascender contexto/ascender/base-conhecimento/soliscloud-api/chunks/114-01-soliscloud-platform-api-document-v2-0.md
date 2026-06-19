---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 114
chunk_id: 1faf4ef708435f1e
kind: resposta_erro
---
# SolisCloud API - Pagina 114 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 114 -
"nmiCode": "",
"language": "1"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"id": 123456
}
}
4.12 Modifying Power Station Information
Interface Name Modifying Power Station Information
Interface Description Corresponding modification of power station information on SolisCloud platform
Request URL https://www.soliscloud.com:13333/v1/api/stationUpdate
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
id number N Station ID
stationName String Y Name of station
mobile String N Owners' mobile phones
capacity String Y Installed capacity, Unit: kWp
latitude String N latitude
longitude String N Integeritude
dip Number N Component inclination angle
azimuth Number N Component azimuth
money String N Currency type, used to calculate revenue, e.g. EUR,
CNY
price Number Y Revenue per kWh
addr String Y Detailed address of the power station
gdAreaCode Integereger N Retrieve address code through Google Map API
country Integereger N Country name
region Integereger N Region name
city Integereger N City name
module number N Number of components
installerEmail String N Installer Email
installerMobile number N Installer Mobile
nmiCode String N NMI Code
