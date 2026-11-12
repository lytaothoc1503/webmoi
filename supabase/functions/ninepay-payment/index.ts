// Thanh toán thẻ / ví / QR qua 9Pay (redirect). Khách chỉ nhập thẻ trên trang của 9Pay.
// Khóa merchant / secret / checksum đọc từ biến môi trường, KHÔNG ghi trong repo.
// Triển khai với verify_jwt = false: IPN và trang quay về do 9Pay gọi, không có JWT của khách.
// Tắt mặc định. Chỉ chạy khi NINEPAY_ENABLED=true và đủ 3 khóa.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  allowSite,
  buildPortalUrl,
  checksumOk,
  decodeChunked,
  decodePaymentResult,
  hmacSha256Base64,
  inquireMessage,
  ninepayHost,
  publicPayment,
} from "./sign.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const a = (hits.get(ip) || []).filter((t) => now - t < 600000);
  a.push(now);
  hits.set(ip, a);
  return a.length > 10;
}

function keys() {
  const merchantKey = Deno.env.get("NINEPAY_MERCHANT_KEY") || "";
  const secretKey = Deno.env.get("NINEPAY_SECRET_KEY") || "";
  const checksumKey = Deno.env.get("NINEPAY_CHECKSUM_KEY") || "";
  const flag = Deno.env.get("NINEPAY_ENABLED") === "true";
  const configured = !!merchantKey && !!secretKey && !!checksumKey;
  const enabled = flag && configured;
  const endpoint = ninepayHost(Deno.env.get("NINEPAY_ENV") || "sandbox");
  const site = allowSite(Deno.env.get("NINEPAY_SITE_URL") || "https://nhacuaantaxua.com");
  const rawPct = Deno.env.get("NINEPAY_DEPOSIT_PERCENT") || "";
  const pct = /^\d{1,2}$/.test(rawPct) ? Number(rawPct) : null;
  const depositPercent = pct !== null && pct >= 1 && pct <= 99 ? pct : null;
  return { merchantKey, secretKey, checksumKey, enabled, flag, configured, endpoint, site, depositPercent };
}

function statusBody(cfg: ReturnType<typeof keys>) {
  return { enabled: cfg.enabled, depositPercent: cfg.enabled ? cfg.depositPercent : null, sandbox: !cfg.endpoint.includes("://payment.9pay.vn"), flag: cfg.flag, configured: cfg.configured };
}

function db() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clientIp(req: Request) {
  return req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
}

// 9Pay bắt header Date trùng timestamp trong chữ ký. fetch() không cho đặt header Date,
// nên inquire gọi TLS trực tiếp.
async function inquire(endpoint: string, merchantKey: string, secretKey: string, invoice: string) {
  const time = Math.floor(Date.now() / 1000);
  const uri = endpoint.replace(/\/$/, "") + "/v2/payments/" + invoice + "/inquire";
  const signature = await hmacSha256Base64(inquireMessage(endpoint, time, invoice), secretKey);
  const u = new URL(uri);
  const conn = await Deno.connectTls({ hostname: u.hostname, port: 443 });
  const req = [
    `GET ${u.pathname} HTTP/1.1`,
    `Host: ${u.hostname}`,
    `Date: ${time}`,
    `Authorization: Signature Algorithm=HS256,Credential=${merchantKey},SignedHeaders=,Signature=${signature}`,
    "Accept: application/json",
    "Accept-Encoding: identity",
    "Connection: close",
    "",
    "",
  ].join("\r\n");
  try {
    await conn.write(new TextEncoder().encode(req));
    const chunks: Uint8Array[] = [];
    const buf = new Uint8Array(8192);
    while (true) {
      const n = await conn.read(buf);
      if (n === null) break;
      chunks.push(buf.slice(0, n));
    }
    const raw = new TextDecoder().decode(concat(chunks));
    const split = raw.indexOf("\r\n\r\n");
    const head = split >= 0 ? raw.slice(0, split) : raw;
    let body = split >= 0 ? raw.slice(split + 4) : "";
    const status = Number((head.match(/HTTP\/1\.[01] (\d+)/) || [])[1] || 0);
    if (/transfer-encoding:\s*chunked/i.test(head)) body = decodeChunked(body);
    if (status < 200 || status >= 300) return null;
    return publicPayment(JSON.parse(body));
  } finally {
    try { conn.close(); } catch { /* bỏ qua */ }
  }
}

function concat(parts: Uint8Array[]) {
  const n = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function backToSite(site: string, code: string, np: string) {
  const safe = /^[A-Z0-9]{6,20}$/.test(code) ? code : "";
  const flag = ["paid", "partial", "failed", "pending"].includes(np) ? np : "pending";
  const u = new URL(site + "/");
  if (safe) u.searchParams.set("ma", safe);
  u.searchParams.set("np", flag);
  u.hash = "tra-cuu-don";
  return u.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const cfg = keys();
  const url = new URL(req.url);

  if (req.method === "GET" && url.searchParams.get("action") === "status") {
    return json(statusBody(cfg));
  }

  if (!cfg.enabled) {
    if (req.method === "GET") return Response.redirect(backToSite(cfg.site, "", "pending"), 302);
    return json({ code: "disabled" }, 403);
  }

  if (req.method === "GET") return handleReturn(cfg, url);
  if (req.method !== "POST") return json({ code: "method" }, 405);

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    let b: Record<string, unknown>;
    try { b = await req.json(); } catch { return json({ code: "bad_request" }, 400); }
    if (b.action === "status") return json(statusBody(cfg));
    if (b.action === "create") return createPayment(cfg, req, b);
    return json({ code: "bad_request" }, 400);
  }

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    return handleIpn(cfg, String(fd.get("result") || ""), String(fd.get("checksum") || ""));
  }
  const text = await req.text();
  const form = new URLSearchParams(text);
  return handleIpn(cfg, form.get("result") || "", form.get("checksum") || "");
});

async function createPayment(cfg: ReturnType<typeof keys>, req: Request, b: Record<string, unknown>) {
  if (limited(clientIp(req))) return json({ code: "rate" }, 429);
  const code = String(b.code || "").trim().toUpperCase();
  const kind = b.kind === "deposit" ? "deposit" : b.kind === "full" ? "full" : "";
  const lang = b.lang === "en" ? "en" : "vi";
  if (!/^[A-Z0-9]{6,20}$/.test(code) || !kind) return json({ code: "bad_request" }, 400);
  if (kind === "deposit" && cfg.depositPercent === null) return json({ code: "deposit" }, 400);

  const { data, error } = await db().rpc("create_ninepay_invoice", {
    p_code: code,
    p_kind: kind,
    p_deposit_percent: cfg.depositPercent,
  });
  if (error) {
    console.error("create_ninepay_invoice", error.code || "err");
    return json({ code: /create_ninepay_invoice|schema cache|does not exist/i.test(error.message || "") ? "not_ready" : "failed" }, 503);
  }
  const row = data as { ok?: boolean; code?: string; invoice_no?: string; amount?: number } | null;
  if (!row || !row.ok || !row.invoice_no || !row.amount) return json({ code: row?.code || "failed" }, row?.code === "not_found" || row?.code === "closed" || row?.code === "amount" || row?.code === "deposit" ? 400 : 503);

  const fn = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "") + "/functions/v1/ninepay-payment";
  const time = Math.floor(Date.now() / 1000);
  const params = {
    merchantKey: cfg.merchantKey,
    time,
    invoice_no: row.invoice_no,
    amount: Number(row.amount),
    description: "Dat phong " + code,
    back_url: cfg.site + "/?ma=" + code + "#tra-cuu-don",
    return_url: fn + "?action=return",
    currency: "VND",
    lang,
  };
  const portal = await buildPortalUrl(cfg.endpoint, cfg.secretKey, params);
  return json({ url: portal });
}

async function applyResult(cfg: ReturnType<typeof keys>, payment: { invoice_no: string; amount: number; status: number; method: string; payment_no: string }) {
  const { data, error } = await db().rpc("apply_ninepay_result", {
    p_invoice: payment.invoice_no,
    p_amount: payment.amount,
    p_status: payment.status,
    p_ref: payment.payment_no || null,
    p_method: payment.method || null,
  });
  if (error) {
    console.error("apply_ninepay_result", error.code || "err");
    return null;
  }
  return data as { ok?: boolean; code?: string; booking_code?: string; pay_state?: string } | null;
}

function npOf(applied: { pay_state?: string } | null, status: number) {
  if (applied?.pay_state === "paid") return "paid";
  if (applied?.pay_state === "partial") return "partial";
  if (status === 6 || status === 8 || status === 15) return "failed";
  return "pending";
}

async function handleIpn(cfg: ReturnType<typeof keys>, result: string, checksum: string) {
  if (!result || result.length > 12000 || checksum.length > 128) return json({ code: "bad_result" }, 400);
  if (!await checksumOk(result, checksum, cfg.checksumKey)) return json({ code: "bad_checksum" }, 400);
  const payment = decodePaymentResult(result);
  if (!payment) return json({ code: "bad_result" }, 400);
  const applied = await applyResult(cfg, payment);
  if (!applied) return json({ code: "failed" }, 503);
  return json({ ok: true });
}

async function handleReturn(cfg: ReturnType<typeof keys>, url: URL) {
  const result = (url.searchParams.get("result") || "").slice(0, 12000);
  const checksum = (url.searchParams.get("checksum") || "").slice(0, 128);
  let payment = null;
  if (result && checksum && await checksumOk(result, checksum, cfg.checksumKey)) payment = decodePaymentResult(result);
  else if (result) payment = decodePaymentResult(result);
  let booking = "";
  let np = "pending";
  if (payment) {
    let confirmed = payment;
    if (!(result && checksum && await checksumOk(result, checksum, cfg.checksumKey))) {
      const looked = await inquire(cfg.endpoint, cfg.merchantKey, cfg.secretKey, payment.invoice_no).catch(() => null);
      confirmed = looked && looked.invoice_no === payment.invoice_no ? looked : null;
    }
    if (confirmed) {
      const applied = await applyResult(cfg, confirmed);
      booking = applied?.booking_code || "";
      np = npOf(applied, confirmed.status);
      if (!booking) {
        const code = confirmed.invoice_no.split("-")[0];
        if (/^[A-Z0-9]{6,20}$/.test(code)) booking = code;
      }
    }
  }
  return Response.redirect(backToSite(cfg.site, booking, np), 302);
}
