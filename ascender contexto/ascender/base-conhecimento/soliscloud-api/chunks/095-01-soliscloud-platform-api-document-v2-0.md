---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 95
chunk_id: 209d0cdccca03cfd
kind: autenticacao
---
# SolisCloud API - Pagina 95 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 95 -
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
4.4 Obtaining real-time data of multiple power stations on a certain day
Interface Name Obtaining real-time data of multiple power stations on a certain day
Interface Description Obtain daily power generation of power stations in batches on the
corresponding SolisCloud platform.
Request URL https://www.soliscloud.com:13333/v1/api/stationDayEnergyList
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
pageNo String N Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize Integereger Y Specify the number of returns per page. The default
value is 20, and the maximum value is 100.
time String Y Specify to query data for a certain day, format:
yyyy-MM-dd
stationIds String N Station Id
Return parameters [Body]
Parameter Name Data Type Required Description
code String Y
0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data array Y Data identification
page Object Y result list
total Integer Y Total number of lists
records Array Y Array of record
id Long Y Station ID
energy Number N Power generation
energyStr String N Unit of power generation
date number Y Data update time under UTC+8. The format is a
timestamp.. The format is a timestamp.
