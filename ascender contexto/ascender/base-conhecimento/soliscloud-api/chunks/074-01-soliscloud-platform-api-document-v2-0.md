---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 74
chunk_id: b486208f988f22b2
kind: resposta_erro
---
# SolisCloud API - Pagina 74 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 74 -
Interface Description Corresponding SolisCloud Platform Power Station List
请 URL https://www.soliscloud.com:13333/v1/api/userStationList
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type
Req
uire
d
Description
pageNo number Y Specify the number of page numbers to return.
The default value is 1, representing page 1.
pageSize number Y
Specify the number of returns per page. The
default value is 20, and the maximum value is
100.
nmiCode String N
1. Specify nmiCode to represent the information
under this nmi, which can be obtained from the
list of power plants.
2. If this value is blank, it represents querying all
information under the account.
Return parameters [Body]
Parameter Name Data
Type
Req
uire
d
Description
code String Y 0 represents success, while others represent
failure. The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object Y Paging Object
current number Y Current page
pages number Y Total pages
size number Y Maximum number of entries per page
total number Y Total number
records array Y Array of record
id number N Station ID
stationName String N Name of station
addr String N Station address
userId number N Owner ID
capacity Number N Installed capacity
capacityStr String N Unit of Installed capacity
capacity1 Number N Installed capacity of plant, without carrying
fullHour Number N Full power hours, power generation divided by
Installed capacity
picName String N Picture name
installerId number N Installer Id
