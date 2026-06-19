---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 48
chunk_id: 506e569b32bbf7e9
kind: autenticacao
---
# SolisCloud API - Pagina 48 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 48 -
Request parameters [Body]
Parameter Name Data
Type
Required Description
pageNo String Y Specify the number of page numbers to return.
The default value is 1, representing page 1.
pageSize String Y
Specify the number of returns per page. The
default value is 20, and the maximum value is
100.
stationId Integer N
1. Specify stationId to represent the
information under this power station, which
can be obtained from the list of power stations.
2. If this value is blank, it represents querying
all information under the account.
nmiCode String N
1. Specify nmiCode to represent the
information under this nmi, which can be
obtained from the list of power plants.
2. If this value is blank, it represents querying
the information under the account.
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in
Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object N result list
collectionStatusVo Object N Number of results
total Integer N Total number of lists
records Array N Array of record
all Integer N Total number of Collectors
normal Integer N Normal number of Collectors
offline Integer N Number of offline Collectors
fault Integer N Number of Collectors faults
id Integer N Collector ID
stationName String N Name of station
stationId Integer N Station ID
userId Integer N Owner ID
sn String N Collector SN
model String N Collector Model
name String N Name of the Collector
rssiLevel String N Collector signal strength
