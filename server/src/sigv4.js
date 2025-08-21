import crypto from "crypto";
import { cfg } from "./config.js";

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(key, str) {
  return crypto.createHmac("sha256", key).update(str).digest();
}

function hmacHex(key, str) {
  return crypto.createHmac("sha256", key).update(str).digest("hex");
}

export function signAws({
  method,
  host,
  path,
  query = "",
  header = {},
  body = "",
}) {
  const server = "execute-api";
  const region = cfg.region;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "") + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const canonicalHeaderObj = {
    host,
    "x-amz-date": amzDate,
    ...Object.fromEntries(
      Object.entries(header).map(([k, v]) => [
        k.toLowerCase(),
        String(v).trim(),
      ])
    ),
  };
  const signedHeaders = Object.keys(canonicalHeaderObj).sort().join(";");

  const canonicalHeaders = Object.keys(canonicalHeaderObj)
    .sort()
    .map((k) => `${k}:${canonicalHeaderObj[k]}\n`)
    .join("");

  const canonicalQuery = query;
  const payloadHash = sha256Hex(body);
  const canonicalRequest = [
    method.toUpperCase(),
    path,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${server}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    dateStamp,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  // IMPORTANT: For SP_API we no longer need real AWS keys instead we use DUMMY_DATA
  const kDate = hmac("AWS4" + "DUMMY_DATA", dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, server);
  const kSigning = hmac(kService, "aws4_request");

  const signature = hmacHex(kSigning, stringToSign);

  const authorization = `${algorithm} Credential=DUMMY_DATA/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    amzDate,
    authorization,
    signedHeadersList: signedHeaders,
  };
}
