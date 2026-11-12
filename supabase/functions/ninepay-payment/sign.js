// Chữ ký 9Pay theo mẫu chính thức (gitlab.com/9pay-sample): HMAC-SHA256 rồi base64,
// chuỗi canonical dùng urlencode kiểu PHP. Không chứa khóa thật.

export function phpUrlencode(value) {
  return encodeURIComponent(String(value))
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");
}

export function canonicalParams(params) {
  return Object.keys(params)
    .sort()
    .map((k) => phpUrlencode(k) + "=" + phpUrlencode(params[k]))
    .join("&");
}

export function bytesToBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export async function hmacSha256Base64(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToBase64(new Uint8Array(sig));
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// So sánh chuỗi không phụ thuộc thời gian theo độ dài khác nhau.
export function safeEqual(a, b) {
  const x = String(a), y = String(b);
  const n = Math.max(x.length, y.length);
  let d = x.length ^ y.length;
  for (let i = 0; i < n; i++) d |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return d === 0;
}

export function paymentMessage(endpoint, time, params) {
  const uri = String(endpoint).replace(/\/$/, "") + "/payments/create";
  return ["POST", uri, String(time), canonicalParams(params)].join("\n");
}

export function inquireMessage(endpoint, time, invoiceNo) {
  const uri = String(endpoint).replace(/\/$/, "") + "/v2/payments/" + invoiceNo + "/inquire";
  return ["GET", uri, String(time)].join("\n");
}

// JSON giống json_encode của PHP (thoát dấu /) để baseEncode khớp mẫu 9Pay.
export function phpJson(obj) {
  return JSON.stringify(obj).replace(/\//g, "\\/");
}

export async function buildPortalUrl(endpoint, secretKey, params) {
  const time = params.time;
  const message = paymentMessage(endpoint, time, params);
  const signature = await hmacSha256Base64(message, secretKey);
  const baseEncode = bytesToBase64(new TextEncoder().encode(phpJson(params)));
  const root = String(endpoint).replace(/\/$/, "");
  return root + "/portal?baseEncode=" + phpUrlencode(baseEncode) + "&signature=" + phpUrlencode(signature);
}

export async function checksumOf(result, checksumKey) {
  return sha256Hex(String(result) + String(checksumKey));
}

export async function checksumOk(result, checksum, checksumKey) {
  if (!result || !checksum || !checksumKey) return false;
  const expect = await checksumOf(result, checksumKey);
  return safeEqual(expect, String(checksum).toUpperCase());
}

export function b64ToString(input) {
  let t = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const pad = t.length % 4;
  if (pad) t += "=".repeat(4 - pad);
  const bin = atob(t);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Chỉ giữ trường cần đối soát. Bỏ mọi dữ liệu thẻ (số thẻ, tên in trên thẻ, token).
export function publicPayment(raw) {
  if (!raw || typeof raw !== "object") return null;
  const src = raw.data && typeof raw.data === "object" ? raw.data : raw;
  const p = src.payment && typeof src.payment === "object" ? src.payment : src;
  if (p.invoice_no == null || p.status == null || p.amount == null) return null;
  const invoice = String(p.invoice_no).toUpperCase();
  if (!/^[A-Z0-9-]{6,30}$/.test(invoice)) return null;
  const amount = Number(p.amount);
  const status = Number(p.status);
  if (!Number.isFinite(amount) || !Number.isFinite(status)) return null;
  const method = String(p.method || "").toUpperCase().match(/^[A-Z0-9_]{1,40}/);
  const ref = String(p.payment_no || "").match(/^[0-9]{1,24}/);
  return {
    invoice_no: invoice,
    amount: Math.round(amount),
    status,
    method: method ? method[0] : "",
    payment_no: ref ? ref[0] : "",
  };
}

export function decodePaymentResult(result) {
  try {
    return publicPayment(JSON.parse(b64ToString(result)));
  } catch {
    return null;
  }
}

export function decodeChunked(body) {
  let rest = String(body).replace(/^\uFEFF/, "");
  let out = "";
  while (rest.length) {
    const nl = rest.indexOf("\r\n");
    if (nl < 0) break;
    const size = parseInt(rest.slice(0, nl), 16);
    if (!Number.isFinite(size) || size < 0) break;
    if (size === 0) break;
    const start = nl + 2;
    out += rest.slice(start, start + size);
    rest = rest.slice(start + size + 2);
  }
  return out;
}

export function ninepayHost(envName) {
  return String(envName).toLowerCase() === "production" ? "https://payment.9pay.vn" : "https://sand-payment.9pay.vn";
}

export function allowSite(raw) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const okHost = host === "nhacuaantaxua.com" || host === "www.nhacuaantaxua.com" || host === "localhost" || host === "127.0.0.1";
    const okProto = u.protocol === "https:" || ((host === "localhost" || host === "127.0.0.1") && u.protocol === "http:");
    if (!okHost || !okProto) return "https://nhacuaantaxua.com";
    return u.origin;
  } catch {
    return "https://nhacuaantaxua.com";
  }
}
