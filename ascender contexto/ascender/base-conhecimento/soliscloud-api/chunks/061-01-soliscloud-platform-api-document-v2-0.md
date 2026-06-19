---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 61
chunk_id: 0ddb05a135316d61
kind: resposta_erro
---
# SolisCloud API - Pagina 61 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 61 -
"pEpmTotalOrigin": 3900,
"pEpmTotalPec": "1",
"pInverterTotalOrigin": 2200,
"pLoadOrigin": 3400,
"pSetOrigin": 901900,
"eToaalInverterOrigin": 24019,
"eTotalLoadOrigin": 5219,
"eTotalBuyOrigin": 8519,
"eTotalSellOrigin": 8819
}
}
3.15 Obtain real-time data of a single EPM on a certain day
Interface Name Obtain real-time data of a single EPM on a certain day
Interface
Description Corresponding SolisCloud Platform EPM Daily Chart
Request URL https://www.soliscloud.com:13333/v1/api/epm/day
Interface
frequency limit 2 times/sec
Request parameters [Body]
Parameter
Name
Data
Type
Requi
red Description
sn String Y EPM_SN
searchinfo String Y
Query fields, separated by commas for multiple queries:
u_ac1=Voltage U, u_ac2=Voltage V, u_ac3=Voltage W
i_ac1=Current U, i_ac2=Current V, i_ac3=current W
p_ac1=Power U, p_ac2=Power V, p_ac3=power W
power_factor=grid power factor
fac_meter=Grid frequency (Meter)
p_load=total power of the load
e_total_inverter=total output of the inverter
e_total_load=total power consumption of the load
e_total_buy=total electricity purchased
e_total_sell=total electricity sold
time String Y Specify to query data for a certain day, format: yyyy-MM-dd
timeZone number Y The time zone where the device is located. Example: 8
Return parameters [Body]
Parameter
Name
Data
Type
Requi
red Description
code String Y
0 represents success, while others represent failure. The
failure code is detailed in Appendix 1.
msg String Y Description of code values
data Array Y Data identification
