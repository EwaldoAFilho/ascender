---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 110
chunk_id: b83756b91114e410
kind: autenticacao
---
# SolisCloud API - Pagina 110 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 110 -
"offSetEnergy": 0.000,
"offSetIncome": 0.000,
"totalR": 0,
"directR": 0,
"errorFlag": 0
}
]
}
4.10 Obtaining Annual Data of a Power Plant
Interface Name Obtaining Annual Data of a Power Plant
Interface Description Cumulative Chart of Power Station Details Corresponding to SolisCloud
Platform.
Request URL https://www.soliscloud.com:13333/v1/api/stationAll
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
id Integer N
Query the information of the specified power
station ID or power station NMI , both cannot be
empty at the same time.
money String Y Used to calculate revenue, e.g. EUR, CNY
timeZone Integer Y The time zone where the device is located.
Example: 8
nmiCode String N NMI Code
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix
1.
msg String Y Description of code values
data Array Y Data identification
energy Number N Power generation
energyStr String N Unit of power generation
date number Y Data update time under UTC+8. The format is a
timestamp.. The format is a timestamp.
dateStr String Y Data, format string
money Number N Income
moneyStr String N Unit of income
batteryDischargeEnergy Number N Battery discharge energy
batteryChargeEnergy Number N Battery charging energy
