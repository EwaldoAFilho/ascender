---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 68
chunk_id: caffc0c1c5aba851
kind: resposta_erro
---
# SolisCloud API - Pagina 68 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 68 -
"gridSellEnergy": 0,
"gridSellIncome": 0.000,
"consumeEnergy": 0,
"produceEnergy": 0,
"offSetEnergy": 0,
"offSetIncome": 0,
"errorFlag": 0
}
]
}
3.19 Obtain a list of meteorological instruments under the account
Interface Name Obtain a list of meteorological instruments under the account
Interface Description List of meteorological instruments corresponding to SolisCloud platform
Request URL https://www.soliscloud.com:13333/v1/api/weatherList
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
pageNo number Y Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize number Y Specify the number of returns per page. The default
value is 20, and the maximum value is 100.
stationId number N
1. Specify stationId to represent the information under
this power station, which can be obtained from the list
of power stations.
2. If this value is blank, it represents querying all
information under the account.
nmiCode String N
1. Specify nmiCode to represent the information under
this nmi, which can be obtained from the list of power
plants.
2. If this value is blank, it represents querying the
information under the account.
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent failure. The
failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
page Object Y result list
total Integer Y Total number of lists
