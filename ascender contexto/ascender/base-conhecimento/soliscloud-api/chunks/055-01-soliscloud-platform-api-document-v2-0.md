---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 55
chunk_id: 2c39ccaef2ea6da6
kind: autenticacao
---
# SolisCloud API - Pagina 55 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 55 -
Interface Description Corresponding SolisCloud Platform EPM List.
Request URL https://www.soliscloud.com:13333/v1/api/epmList
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
pageNo number Y Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize number Y Specify the number of returns per page. The default
value is 20, and the maximum value is 100.
stationId String N
1. Specify stationId to represent the information under
this power station, which can be obtained from the list
of power stations.
2. If this value is blank, it represents querying all
information under the account.
nmiCode String N
1. Specify nmiCode to represent the information
under this nmi, which can be obtained from the list of
power plants.
2. If this value is blank, it represents querying the
information under the account.
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object Y result list
total Integer Y Total number of lists
records Array Y Array of record
id number Y EPM_Id
sn String Y EPM_SN
collectorId number N Collector ID
collectorSn String N Collector SN
userId number N Owner ID
stationId number N Station ID
stationName String N Name of station
state number N EPM device status: 1=online, 2=offline
dataTimestamp number N Data update time under UTC+8. The format is a
timestamp.
failSafe number N FailSafe switch
