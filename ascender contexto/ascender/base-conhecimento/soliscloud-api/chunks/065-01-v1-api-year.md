---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 65
chunk_id: 799ff957bb902b9b
kind: endpoint
---
# SolisCloud API - Pagina 65 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/year`
- `UNKNOWN /v1/api/year`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 65 -
"offSetIncome": 0,
"errorFlag": 0
}
]
}
3.17 Obtaining Monthly Data of a Single EPM for a Certain Year
Interface Name Obtaining Monthly Data of a Single EPM for a Certain Year
Interface Description Corresponding SolisCloud Platform EPM Annual Chart
Request URL https://www.soliscloud.com:13333/v1/api/epm/year
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
sn String Y EPM_SN
year String Y Specify to query data for a certain year, format: yyyy
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent failure.
The failure code is detailed in Appendix 1.
msg String Y Description of code values
data Array Y Data identification
date number Y Data update time under UTC+8. The format is a
timestamp.
dateStr String Y Data, format string
energy number N Power generation
epmSellEnergy number N Sell Energy of EPM
epmBuyEnergy number N Buy Energy of EPM
Code example
Request parameters
POST /v1/api/year
Connection: keep-alive
Time: Wed, 28 Jun 2023 02:41:59 GMT
Content-MD5: P3y0vBtI9DkzBxNo6BXInw==
Content-Type: application/json
Authorization:API
1300386381676644416:eSyNqUbYhu5z80vIKiFxMr3poNY=
token:
Date: Wed, 28 Jun 2023 02:41:59 GMT
Content-Length: 111
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.18)
