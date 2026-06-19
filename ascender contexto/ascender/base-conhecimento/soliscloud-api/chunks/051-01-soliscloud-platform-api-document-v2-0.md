---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 51
chunk_id: 069e21d35610ef01
kind: autenticacao
---
# SolisCloud API - Pagina 51 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 51 -
3.11 Obtaining Details of a Single Collector
Interface Name Obtaining Details of a Single Collector
Interface Description Corresponding SolisCloud platform collector details
Request URL https://www.soliscloud.com:13333/v1/api/collectorDetail
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
id Integer Y Query the detailed data of the specified collector
ID or collector SN, where both ID and SN cannot
be empty.sn String Y
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix
1.
msg String Y Description of code values
data Object Y Data identification
id Integer N Collector ID
stationId Integer N Station ID
stationName String N Name of station
addr String N Station address
userId Integer N Owner ID
state Integer N Plant station status: 1=online, 2=offline, 3=alarm
dataTimestamp Integer N Plant update time
totalWorkingTime Integer N Total Working Time
sn String N Collector SN
model String N Collector Model
name String N Name of the Collector
rssiLevel String N Collector signal strength
lanIp String N LAN IP
maximumNumber Integer N Maximum number of connections
actualNumber Integer N Actual number of connected units
connectedSsid String N Connected ssid
connectionOperator String N Operator Name
currentWorkingTime Integer N The working time of this power on
totalWorkingTime Integer N Total Working Time
dataUploadCycle Integer N Data upload interval
factoryTime Integer N Delivery time
