---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 100
chunk_id: 3fbc735b121c8bcc
kind: endpoint
---
# SolisCloud API - Pagina 100 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationYearEnergyList`
- `UNKNOWN /v1/api/stationYearEnergyList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 100 -
Interface Description Corresponding SolisCloud Platform Power Station Annual Chart
Request URL https://www.soliscloud.com:13333/v1/api/stationYearEnergyList
Interface frequency
limit 10 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
pageNo number Y Specify the number of page numbers to return. The
default value is 1, representing page 1.
pageSize number Y Specify the number of returns per page. The default
value is 20, and the maximum value is 100.
stationIds String N Station Id
nmiCode String N NMI Code
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
id number Y Station ID
energy number Y Power generation
year number Y Year
money number N Income
moneyStr number N Unit of income
batteryDischargeEnergy number N Battery discharge energy
batteryChargeEnergy number N Battery charging energy
gridPurchasedEnergy number N Grid purchased energy
gridSellEnergy number N Grid sell energy
Code example
Request parameters
POST /v1/api/stationYearEnergyList
Connection: keep-alive
Date: Wed, 28 Jun 2023 02:27:57 GMT
Content-MD5: +6vavbBiUMIXHUP4LvAhMg==
Authorization:API
1300386381676644416:OjjngNHie/KHBWwAV6mPMti/fFg=
Content-Type: application/json;charset=UTF-8
Content-Length: 72
Host: test.soliscloud.com:3333
