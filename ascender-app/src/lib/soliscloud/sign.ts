import { createHash, createHmac } from "node:crypto";

// Content-Type usado tanto no header quanto na string-to-sign (devem ser
// idênticos). IMPORTANTE: a API SolisCloud valida a assinatura SEM o charset —
// usar "application/json;charset=UTF-8" resulta em HTTP 403 "wrong sign".
export const SOLIS_CONTENT_TYPE = "application/json";

/**
 * Monta os headers de autenticação da SolisCloud (assinatura HMAC-SHA1).
 *
 * string-to-sign =
 *   "POST\n" + Content-MD5 + "\n" + Content-Type + "\n" + Date + "\n" + resourcePath
 * sign = base64(HmacSHA1(keySecret, string-to-sign))
 *
 * IMPORTANTE: o `body` precisa ser exatamente a mesma string enviada no fetch.
 */
export function buildAuthHeaders(params: {
  keyId: string;
  keySecret: string;
  resourcePath: string;
  body: string;
  date?: string;
}): Record<string, string> {
  const contentMd5 = createHash("md5")
    .update(params.body, "utf8")
    .digest("base64");
  const date = params.date ?? new Date().toUTCString();
  const stringToSign = `POST\n${contentMd5}\n${SOLIS_CONTENT_TYPE}\n${date}\n${params.resourcePath}`;
  const sign = createHmac("sha1", params.keySecret)
    .update(stringToSign, "utf8")
    .digest("base64");

  return {
    "Content-MD5": contentMd5,
    "Content-Type": SOLIS_CONTENT_TYPE,
    Date: date,
    Authorization: `API ${params.keyId}:${sign}`,
  };
}
