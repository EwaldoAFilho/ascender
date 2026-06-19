---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 80
chunk_id: ddb044127fdeef26
kind: endpoint
---
# SolisCloud API - Pagina 80 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/stationDetail`
- `UNKNOWN /v1/api/stationDetail`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 80 -
dip Number N Component inclination angle
azimuth Number N Component azimuth
timeZone Number N The time zone where the device is located.
Example: 8
timeZoneName String N Time Zone Name
timeZoneStr String N Time zone in string format
timeZoneId Integer N Time Zone Id
daylight Number N daylight saving time
createDate Integer N Date of data creation
stationTypeNew Integer N Type of power station, see Appendix 2 for details
fisPowerTime Integer N First power on time, format timestamp
fisGenerateTime Integer N First generation time, format timestamp
Code example
Request parameters
POST /v1/api/stationDetail
Connection: keep-alive
Time: Tue, 27 Jun 2023 05:47:26 GMT
Content-MD5: sAGxE9QzeBN88qPrz+sCZQ==
Content-Type: application/json
Authorization:API
1300386381676644416:SCITzMk7U3gKp05S+d7ETIvyq4g=
token: token_cb23ed9a-ab65-4699-b942-6efbf3a6e666
Date: Tue, 27 Jun 2023 05:47:26 GMT
Content-Length: 30
Host: test.soliscloud.com:3333
User-Agent: Apache-HttpClient/4.5.13 (Java/11.0.17)
{
"id": "1298491919448631809",
"nmiCode": "41028459350"
}
Return parameters
{
"success": true,
"code": "0",
"msg": "success",
"data": {
"id": "1298491919448631809",
"dataTimestamp": "1687844402978",
"fullHour": 2.61,
"monthCarbonDioxide": 69.92,
"installerId": "1298497302686786165",
"installer": "",
"sno": "1085AC",
"country": "15",
"countryStr": "",
