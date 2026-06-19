---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 112
chunk_id: 9da2b3f79264e9cd
kind: resposta_erro
---
# SolisCloud API - Pagina 112 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 112 -
"offSetEnergy": 0.000,
"offSetIncome": 0.000,
"totalR": 0,
"directR": 0,
"errorFlag": 0
}
]
}
4.11 Newly added power station information
Interface Name Newly added power station information
Interface Description Corresponding to the newly added power station on the SolisCloud
platform.
Request URL https://www.soliscloud.com:13333/v1/api/addStation
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
inverterSn String N
Fill in one inverter SN or collector SN to bind
collectorSn String N
stationName String Y Name of station
userId Integer N Default owner's account
mobile String N Owners' mobile phones
capacity String Y Installed capacity, Unit: kWp
latitude String N latitude
Integeritude String N Integeritude
dip Number N Component inclination angle
azimuth Number N Component azimuth
money String Y Currency type, used to calculate revenue, e.g.
EUR, CNY
addr String Y Detailed address of the power station
gdAreaCode String N Retrieve address code through Google Map API
countryStr Integer N Country name
regionStr Integer N Region name
cityStr Integer N City name
price Integer Y Revenue per kWh
offset Number N Time zone offset
module String N Number of components
installerEmail String N Installer Email
installerMobile String N Installer Mobile
nmiCode Number N NMI Code
