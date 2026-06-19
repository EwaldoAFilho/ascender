---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 86
chunk_id: 6d0340db0b49124f
kind: resposta_erro
---
# SolisCloud API - Pagina 86 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 86 -
"generatorPowerPec": "1",
"generatorTodayEnergy": 0.000,
"generatorTodayEnergyStr": "kW",
"generatorTodayEnergyPec": "1",
"generatorTotalEnergy": 0,
"generatorTotalEnergyStr": "kWh",
"generatorTotalEnergyPec": "1",
"weatherCount": 0,
"inverterPowerStr": "kW",
"homeLoadMonthEnergyStr": "kWh",
"homeLoadYearEnergyStr": "kWh",
"homeLoadTotalEnergyStr": "kWh",
"gridMonthEnergy": 0.000,
"monthEnergy1": 0,
"dayEnergy1": 0,
"yearEnergy1": 0,
"power1": 0
}
}
4.3 Obtaining Details of Multiple Power Stations
Interface Name Obtaining Details of Multiple Power Stations
Interface Description Batch access to power station details on the corresponding SolisCloud
platform.
Request URL https://www.soliscloud.com:13333/v1/api/stationDetailList
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type
Req
uire
d
Description
pageNo String N Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize Integereger Y Specify the number of returns per page. The
default value is 20, and the maximum value is 100.
Return parameters [Body]
Parameter Name Data Type
Req
uire
d
Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix 1.
msg String Y Description of code values
data array Y Data identification
