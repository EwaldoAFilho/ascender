---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 47
chunk_id: 817fa03bf5061395
kind: resposta_erro
---
# SolisCloud API - Pagina 47 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 47 -
"stationId": "1298491919448631809",
"alarmDeviceSn": "00FFC0011557001",
"nmiCode": "41028459350"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"records": [
{
"id": "-1",
"stationId": "1298491919448631809",
"alarmDeviceSn": "00FFC0011557001",
"alarmDeviceType": "3",
"alarmType": 0,
"alarmLevel": "1",
"alarmCode": "2129",
"alarmBeginTime": 1687918458326,
"alarmEndTime": 1687918484635,
"alarmLong": "26308",
"state": "0",
"advice": "",
"alarmMsg": "",
"model": "1e",
"warningInfoData": 0,
"type": 0
}
],
"total": 1,
"size": 10,
"current": 1,
"orders": [ ],
"optimizeCountSql": true,
"searchCount": true,
"pages": 1
}
}
3.10 Obtain the collector list under the account
Interface Name Obtain the collector list under the account
Interface Description List of collectors corresponding to the SolisCloud platform.
Request URL https://www.soliscloud.com:13333/v1/api/collectorList
Interface frequency limit 2 times/sec
