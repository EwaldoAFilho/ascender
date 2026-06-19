---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 62
chunk_id: da2dc549c8540d7b
kind: endpoint
---
# SolisCloud API - Pagina 62 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/day`
- `UNKNOWN /v1/api/day`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 62 -
dataTimestamp number Y Data update time under UTC+8. The format is a timestamp.
timeStr String Y Update time, string converted based on time zone
pEpmTotal number N
Total power of grid, where a negative value represents buying
electricity and a positive value represents selling electricity.
Transmit e_epm_total acquisition
pEpmTotalStr String N Unit of total power of grid
pEpmTotalPec number N Percentage of total power of grid
eTotalBuy number N Total active energy from grid, transmission e_total_buy Get
eTotalSell number N Total active energy transmitted by the power grid,
transmission e_total_sell acquisition
uAc1 number N EPM AC voltage U, transmission u_ac1 acquisition
iAc1 number N EPM AC current U, transmission i_ac1 acquisition
pAc1 number N EPM active power U, transmission p_ac1 acquisition
uAc2 number N EPM AC voltage V, transmission u_ac2 acquisition
iAc2 number N EPM AC current V, transmission i_ac2 acquisition
pAc2 number N EPM active power V, transmission p_ac2 acquisition
uAc3 number N EPM AC voltage W, transmission u_ac3 acquisition
iAc3 number N EPM AC current W, transmission i_ac3 acquisition
pAc3 number N EPM active power W, transmission p_ac3 acquisition
pInverterTotal number N Total power of inverter, transmission p_inverter_total
acquisition
pLimit number N Power limit percentage, transmission p_limit acquisition
ctRatio number N Current sensor ratio, transmission ct_ratio acquisition
powerFactor number N Power factor of grid, transmission power_factor acquisition
facMeter number N Grid frequency, transmission fac_meter acquisition
pLoad number N Total load power, transmission p_load acquisition
eToaalInverter number N Total generation of the inverter, transmission e_toaal_inverter
acquisition
eTotalLoad number N Total consumption of the load, transmission e_total_load
acquisition
Code example
Request
parameters
POST /v1/api/day
Connection: keep-alive
Time: Wed, 28 Jun 2023 02:41:59 GMT
Content-MD5: P3y0vBtI9DkzBxNo6BXInw==
Content-Type: application/json
Authorization:API 1300386381676644416:eSyNqUbYhu5z80vIKiFxMr3poNY=
token:
Date: Wed, 28 Jun 2023 02:41:59 GMT
Content-Length: 111
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
