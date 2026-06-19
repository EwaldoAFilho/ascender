---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 71
chunk_id: f3c2a4c9733c59bb
kind: resposta_erro
---
# SolisCloud API - Pagina 71 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 71 -
"timeZone": 10.00,
"timeZoneStr": "(UTC+10:00)",
"timeZoneName": "(UTC+10:00) ",
"sunshineTimStr": "5h50m"
}
],
"total": 1,
"size": 20,
"current": 1,
"orders": [ ],
"optimizeCountSql": false,
"searchCount": true,
"pages": 1
}
}
}
3.20 Obtaining Details of a Single Meteorological Instrument
Interface Name Obtaining Details of a Single Meteorological Instrument
Interface Description Corresponding SolisCloud platform meteorological instrument details
Request URL https://www.soliscloud.com:13333/v1/api/weatherDetail
Interface frequency
limit 2 times/sec
Request parameters [Body]
Parameter Name Data
Type Required Description
sn String N Meteorological instrument SN
Return parameters [Body]
Parameter Name Data
Type Required Description
code String Y
0 represents success, while others represent failure. The
failure code is detailed in Appendix 1.
msg String Y Description of code values
data Object Y Data identification
id number Y Meteorological instrument ID
collectorSn String N Collector SN
collectorId number N Collector ID
name String N Meteorological instrument name
weatherModel String N Meteorological instrument model: 1=Jinzhou Sunshine,
2=Jinzhou Licheng
userId number N Owner ID
stationId number N Station ID
stationName String N Name of station
