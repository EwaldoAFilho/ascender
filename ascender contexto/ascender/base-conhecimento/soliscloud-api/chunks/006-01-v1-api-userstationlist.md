---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 6
chunk_id: beaeea1c0a0d2b70
kind: endpoint
---
# SolisCloud API - Pagina 6 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `POST /v1/api/userStationList`
- `UNKNOWN /v1/api/userStationList`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 6 -
"Success": true represents success, while
false represents failure.
Code: 0 represents success, while others
represent failure. Please refer to
Appendix 1 for the failure code.
"Msg": Description of the code value.
Data ": Please refer to the return
parameters of each business interface for
details.
"code": "0",
"msg": "success",
"data": { }
}
2.4 Interface Call Examples
Request parameters:
POST /v1/api/userStationList
Content-MD5: kxdxk7rbAsrzSIWgEwhH4w==
Content-Type: application/json
Date: Fri, 26 Jul 2019 06:00:46 GMT
Authorization: API {apiId}:nBYQWeuzy3Y+gp67BN8zXTmvSDk=
Body：{"pageNo":1,"pageSize":10}
Return parameters:
{
"success": true,
"code": "0",
"msg": "success",
"data": { }
}
JAVA example (please download directly):
https://ginlong-product.oss-cn-shanghai.aliyuncs.com/templet/Authorization.java
2.5 Encryption Tool Reference
Reference website https://dinochiesa.github.io/hmachash/index.html
Content MD5 calculation example {"pageNo":1,"pageSize":10}
