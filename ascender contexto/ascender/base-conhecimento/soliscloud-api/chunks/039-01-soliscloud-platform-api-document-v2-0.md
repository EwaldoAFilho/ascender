---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 39
chunk_id: 8b5fc43f4c1c4795
kind: autenticacao
---
# SolisCloud API - Pagina 39 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 39 -
"timeZone": 8,
"batteryDischargeEnergy": 0,
"batteryChargeEnergy": 0,
"gridPurchasedEnergy": 0,
"gridPurchasedIncome": 0.000,
"gridSellEnergy": 0,
"gridSellIncome": 0.000,
"homeLoadEnergy": 0,
"consumeEnergy": 0,
"produceEnergy": 0,
"offSetEnergy": 0,
"offSetIncome": 0,
"errorFlag": 0
}
]
}
3.6 Obtain monthly data of a single inverter for a certain year
Interface Name Obtain monthly data of a single inverter for a certain year
Interface Description Annual chart corresponding to the inverter details of the SolisCloud
platform.
Request URL https://www.soliscloud.com:13333/v1/api/inverterYear
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
id number N Query the data of the specified inverter ID or
inverter SN, and both ID and SN cannot be
empty at the same time.sn String N
money String Y Used to calculate revenue, e.g. EUR, CNY
year String Y Query data for a specified year, time format:
"yyyy"
Return parameters [Body]
Parameter Name Data Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in
Appendix 1.
msg String Y Description of code values
data Object Y Data identification
energy number N Power generation
energyStr String N Unit of power generation
date Number N Data, format timestamp
