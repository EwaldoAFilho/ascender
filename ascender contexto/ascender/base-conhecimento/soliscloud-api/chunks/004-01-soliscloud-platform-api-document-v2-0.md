---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 4
chunk_id: d3648adfb42db57a
kind: autenticacao
---
# SolisCloud API - Pagina 4 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 4 -
1 GLOBAL DESCRIPTION
1) All interface encryption is based on the HTTPS protocol.
2) The update frequency for all interface data is 5 minutes.
3) All interface request methods are POST.
4) All interface request types are application/JSON;Charset=UTF-8.
5) All interface requests require adding Content MD5, Content Type, Date, and Authorization to the
header.
6) All interface returned data is in JSON format.
7) All interface returned data (power, energy, energy, frequency, etc.) must be used in conjunction with the
unit.
2 INTERFACE INFORMATION
2.1 Interface Address and Key
Type Content
API URL https://www.soliscloud.com:13333/
API ID Log in to www.soliscloud.com and go to "Account" - "Basic Settings" - "API
Management" to obtain. Pay attention to confidentiality and prevent Data
breach.
API Secret
2.2 Request Standard Format
POST [API URL]
Content-MD5: [Content-MD5]
Content-Type: application/json;charset=UTF-8
Date: [Date]
Authorization: API {apiId}: [sign]
Body: [Body]
Name Description Example
API URL Specific address of each interface. https://www.soliscloud.com:13333/v1/api/inverter
Detail
Content-MD5
1. Perform MD5 encryption on
the body;
2. Convert encrypted content into
a 128 bit binary array;
3. Base64 encoding of binary
arrays.
public static String getDigest(String test) {
String result = "";
try {
MessageDigest md =
MessageDigest.getInstance("MD5");
md.update(test.getBytes());
byte[] b = md.digest();
result = Base64.encodeBytes(b);
} catch (NoSuchAlgorithmException
e) {
e.prIntegerStackTrace();
}
return result;
}
