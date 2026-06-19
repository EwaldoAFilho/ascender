---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 22
chunk_id: 0f505008aa6873a1
kind: resposta_erro
---
# SolisCloud API - Pagina 22 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 22 -
"cReactivePower": 0,
"cLookedPower": 0,
"cPhasePowerFactor": 0,
"averagePowerFactor": 0,
"dcPacStr": "W",
"psum": 0,
"reactivePowerStr": "Var",
"apparentPowerStr": "VA",
"familyLoadPowerPec": "1",
"psumCal": 0,
"psumStr": "kW",
"psumCalStr": "kW"
}
}
3.3 Obtaining Details of Multiple Inverters
Interface Name Obtaining Details of Multiple Inverters
Interface Description Details of multiple inverters corresponding to SolisCloud
platform.
Request URL https://www.soliscloud.com:13333/v1/api/inverterDetailList
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Requi
red Description
pageNo String N
Specify the number of page numbers to
return. The default value is 1,
representing page 1.
pageSize Integereger Y
Specify the number of returns per page.
The default value is 20, and the
maximum value is 100.
Return parameters [Body]
Parameter Name Data Type Requi
red Description
code String Y
0 represents success, while others
represent failure. The failure code is
detailed in Appendix 1.
msg String Y Description of code values
data array Y Data identification
id Integereger Y Inverter ID
sn String N Inverter SN
stationId Integereger N Station ID
stationName String N Name of station
