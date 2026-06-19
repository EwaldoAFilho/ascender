---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 63
chunk_id: 7da37b8f312ae2c2
kind: autenticacao
---
# SolisCloud API - Pagina 63 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 63 -
{
"sn": "00FFC0011557002",
"searchinfo": "u_ac1,u_ac2,e_total_buy,e_total_sell",
"time": "2023-06-27",
"timeZone": "8"
}
Return
parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"daylightList": [ ],
"e_total_buy": [ ],
"u_ac1": [ ],
"data_timestamp": [ ],
"timeStr": [ ],
"u_ac2": [ ],
"daylightSwitch": 0,
"e_total_sell": [ ]
}
}
3.16 Obtaining Daily Data of a Single EPM for a Month
Interface Name Obtaining Daily Data of a Single EPM for a Month
Interface Description Corresponding SolisCloud Platform EPM Monthly Chart
Request URL https://www.soliscloud.com:13333/v1/api/epm/month
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
sn String Y EPM_SN
month String Y Specify to query data for a certain month,
format: yyyy-MM
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent
failure. The failure code is detailed in Appendix
1.
msg String Y Description of code values
data Array Y Data identification
date number Y Data, format timestamp
