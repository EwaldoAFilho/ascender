---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 35
chunk_id: 69ced579e9a40230
kind: endpoint
---
# SolisCloud API - Pagina 35 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/inverterDay`
- `UNKNOWN /v1/api/inverterDay`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 35 -
iPv3 Number N DC side current-3
iPv4 Number N DC side current-4
uPv1 Number N DC side voltage-1
uPv2 Number N DC side voltage-2
uPv3 Number N DC side voltage-3
uPv4 Number N DC side voltage-4
inverterTemperature Number N Inverter temperature
acOutputType Integer
N AC output class: 0=single-phase,
others=three-phase
dcInputType Integer N
Number of DC input channels:
value+1=actual number of channels.
For example, 0=1 channel, 1=2 channels,
2=3 channels, and so on
powerFactor Number N Power factor
batteryCapacitySoc Number N Battery SOC
batteryHealthSoh Number N Battery SOH
socDischargeSet Number N Overdischarge of SOC
socChargingSet Number N Strong charging SOC
batteryVoltage Number N Battery voltage
bstteryCurrent Number N Battery current
batteryPower Number N Battery power
batteryTodayChargeEnergy Number N Daily battery charging energy
batteryTotalChargeEnergy Number N Total battery charging energy
batteryTodayDischargeEnergy Number N Daily battery discharging energy
batteryTotalDischargeEnergy Number N Total battery discharging energy
gridPurchasedTodayEnergy Number N Daily grid purchased energy
gridPurchasedTotalEnergy Number N Total grid purchased energy
gridSellTodayEnergy Number N Daily grid selling energy
gridSellTotalEnergy Number N Total grid selling energy
familyLoadPower Number N Family load power
bypassLoadPower Number N Bypass load power
pSum Number N Total active power of the grid
homeLoadTodayEnergy Number N Daily load consumption
homeLoadTotalEnergy Number N Total load consumption
Code example
Request parameters
POST /v1/api/inverterDay
Connection: keep-alive
Date: Tue, 27 Jun 2023 11:21:04 GMT
Content-MD5: uS4IZTyKQmsv606fXNjQ0A==
Authorization:API
1300386381676644416:xNtp1S0/KMJ60iUURwmsSAH7azs=
