---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 12
chunk_id: c34e213bf8799d4b
kind: resposta_erro
---
# SolisCloud API - Pagina 12 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 12 -
"mpptSwitch": 1
}
}
3.2 Obtaining Details of a Single Inverter
Interface Name Obtaining Details of a Single Inverter
Interface Description Obtain detailed data of the specified inverter, corresponding to
the inverter detailed data on the SolisCloud platform.
Request URL https://www.soliscloud.com:13333/v1/api/inverterDetail
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Requ
ired Description
id Integer Y Query the detailed data of the specified
inverter ID or inverter SN, both ID and
SN cannot be empty at the same timesn String Y
Return parameters [Body]
Parameter Name Data Type Requ
ired Description
code String Y
0 represents success, while others
represent failure. The failure code is
detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
id Integer N Inverter ID
sn String N Inverter SN
stationId Integer N Station ID
stationName String N Name of station
userId Integer N Owner ID
collectorId Integer N Collector ID
collectorName String N Name of the Collector
collectorsn String N Collector SN
currentState String N Current state
eToday Number N Daily power generation
eTodayStr String N Unit of daily power generation
eMonth Number N Monthly power generation
eMonthStr String N Unit of monthly power generation
eYear Number N Yearly power generation
eYearStr String N Unit of yearly power generation
eTotal Number N Total power generation
