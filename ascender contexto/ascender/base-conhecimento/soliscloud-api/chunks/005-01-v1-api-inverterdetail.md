---
empresa: ASCENDER
dominio: soliscloud-api
source: SolisCloud Platform API Document V2.0.pdf
page: 5
chunk_id: 16f176bbc2f57a40
kind: endpoint
---
# SolisCloud API - Pagina 5 - Chunk 1

Origem: `SolisCloud Platform API Document V2.0.pdf`

## Endpoints Detectados

- `UNKNOWN /v1/api/inverterDetail`

## Conteudo Extraido

SolisCloud Platform API Document V2.0
- 5 -
Content-Type Fixed value application/json;charset=UTF-8
Date
1. Obtain the current time in the
GMT time zone;
2. Convert the current time to a
string in the following format.
Format: EEE, d MMM yyyy HH:
mm: ss' GMT '
Note: The Date time cannot
exceed the current time by more
than plus or minus 15 minutes,
otherwise a call failure may
occur.
public static String getGMTTime(){
Calendar cd =
Calendar.getInstance();
SimpleDateFormat sdf = new
SimpleDateFormat("EEE, d MMM yyyy
HH:mm:ss 'GMT'", Locale.US);
sdf.setTimeZone(TimeZone.getTimeZone("GMT"
));
String str =
sdf.format(cd.getTime());
return str;
}
Authorization
The legitimacy authentication
information of the interface
request, in the format shown in
the example, is explained as
follows:
apiId represents the visitor's
identity ID.
ApiSecret represents the key
required for signing.
CanonicalizedResource represents
the API interface path that you
want to access, such as
"/v1/api/inverterDetail"
Sign represents a digital
signature, which is obtained by
encrypting the HmacSHA1 key
with base64 encoding.
\n represents a line break.
Authorization : "API " + apiId + ":" + Sign
Sign = base64(HmacSHA1(apiSecret,POST+
"\n"
+ Content-MD5 + "\n"
+ Content-Type + "\n"
+ Date + "\n"
+ CanonicalizedResource))
Body
Please refer to the request
parameters for each business
interface for details.
{
"id": "1308675217944611083",
"sn": "120B40198150131"
}
2.3 Standard format for returns
Content-Type: application/json;charset=UTF-8
Date: [Date]
Body: [Body]
Name Description Example
Content-Type Fixed value application/json;charset=UTF-8
Date GMT time in string format Fri, 26 Jul 2019 06:00:46 GMT
Body The body content includes: {success,
code, msg, data}
{
"success": true,
