---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 7
chunk_id: 6be6e22e5bc3919a
kind: resposta_erro
---
# SolisCloud API - Pagina 7 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 7 -
3 DEVICE INTERFACES
3.1 Obtain the inverter list under the account
Interface Name Obtain the inverter list under the account
Interface Description Corresponding to the SolisCloud platform device overview - inverter list, a
single call can obtain the list data of up to 100 devices.
Request URL https://www.soliscloud.com:13333/v1/api/inverterList
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
pageNo String Y Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize String Y Specify the number of returns per page. The default
value is 20, and the maximum value is 100.
stationId Integer N
1. Specify stationId to represent the information
under this power station, which can be obtained
from the list of power stations.
2. If this value is blank, it represents querying all
information under the account.
nmiCode String N
1. Specify nmiCode to represent the information
under this nmi, which can be obtained from the list
of power plants.
2. If this value is blank, it represents querying all
information under the account.
Return parameters [Body]
Parameter Name Data Type Required Description
code String Y 0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object Y Result list
inverterStatusVo Object Y Number of results
total Integer N Total number of lists
records Array N Array of record
all Integer N Total number of inverters
normal Integer N Number of normal inverters
offline Integer N Number of offline inverters
fault Integer N Number of faulty inverters
id Integer N Inverter ID
