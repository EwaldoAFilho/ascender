---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 34
chunk_id: f3ed32c75c3599bc
kind: autenticacao
---
# SolisCloud API - Pagina 34 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 34 -
3.4 Obtain real-time data of a single inverter on a certain day
Interface Name Obtain real-time data of a single inverter on a certain day
Interface Description Corresponding daily chart of SolisCloud platform inverter details.
Request URL https://www.soliscloud.com:13333/v1/api/inverterDay
Interface frequency limit 2 times/sec
Request parameters [Body]
Parameter Name Data Type Required Description
id Integer N Query the data of the specified inverter ID or
inverter SN, and both ID and SN cannot be
empty at the same time.sn String
N
money String Y Used to calculate revenue, e.g. EUR, CNY
time String Y Specify to query data for a certain day,
format: yyyy-MM-dd
timeZone Integer Y The time zone where the device is located.
Example: 8
Return parameters [Body]
Parameter Name Data Type Required Description
code String Y 0 represents success, while others represent
failure. The failure code is detailed in
Appendix 1.
msg String Y Description of code values
data Array Y Data identification
dataTimestamp Integer N Data update time under UTC+8. The format
is a timestamp.
timeStr String N Update time, string converted based on time
zone
eToday Number N Daily power generation
eTotal Number N Total power generation
fac Number N Grid frequency
pac Number N Real time power
pacStr String N Unit of real time power
pacPec Number N Power percentage
iAc1 Number N AC side current-R
iAc2 Number N AC side current-S
iAc3 Number N AC side current-T
uAc1 Number N AC side voltage-R
uAc2 Number N AC side voltage-S
uAc3 Number N AC side voltage-T
iPv1 Number N DC side current-1
iPv2 Number N DC side current-2
