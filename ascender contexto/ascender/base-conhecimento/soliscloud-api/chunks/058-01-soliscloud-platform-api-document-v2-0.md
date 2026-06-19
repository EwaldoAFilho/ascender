---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 58
chunk_id: c92f2e761fb2b178
kind: autenticacao
---
# SolisCloud API - Pagina 58 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 58 -
code String Y
0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
id number Y EPM_Id
sn String Y EPM_SN
collectorId number N Collector ID
collectorSn String N Collector SN
userId number N Owner ID
stationId number N Station ID
stationName String N Name of station
state number N EPM status: 1=online, 2=offline
dataTimestamp number N Data update time under UTC+8. The format is a
timestamp.
failSafe number N FailSafe switch
empSoftwareVersion String N EPM software version
pLimit number N Power limit percentage
ctRatio number N Current sensor ratio
pSet number N Return power setting value
pSetStr String N Unit of return power setting value
pInverterTotal number Total power of inverter
pInverterTotalStr String Unit of total power of inverter
eToaalInverter number Total generation energy of inverter
eToaalInverterStr String Unit of total generation energy of inverter
pLoad number Total power consumption
pLoadStr String Unit of total power consumption
eTotalLoad number Total energy consumption
eTotalLoadStr String Unit of total energy consumption
pEpmTotal number N EPM total power
pEpmTotalStr String N Unit of EPM total power
eTotalBuy number N Total purchased energy
eTotalBuyStr String N Unit of total purchased energy
eTotalSell number N Total sell energy
eTotalSellStr String N Unit of total sell energy
iAc1 number N Current U
iAc2 number N Current V
iAc3 number N Current W
uAc1 number N Voltage U
uAc2 number N Voltage V
uAc3 number N Voltage W
