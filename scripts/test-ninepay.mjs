// Kiểm tra chữ ký 9Pay và việc không giữ dữ liệu thẻ. Chạy: node scripts/test-ninepay.mjs
import {
  allowSite,
  buildPortalUrl,
  canonicalParams,
  checksumOf,
  checksumOk,
  decodeChunked,
  decodePaymentResult,
  hmacSha256Base64,
  ninepayHost,
  paymentMessage,
  phpJson,
  phpUrlencode,
  publicPayment,
  safeEqual,
} from "../supabase/functions/ninepay-payment/sign.js";

const fail = [];
const eq = (name, got, want) => { if (got !== want) fail.push(name + "\n  got:  " + got + "\n  want: " + want); };

eq("urlencode space", phpUrlencode("a b"), "a+b");
eq("urlencode tilde", phpUrlencode("a~b"), "a%7Eb");
eq("urlencode url", phpUrlencode("https://nhacuaantaxua.com/?ma=NA"), "https%3A%2F%2Fnhacuaantaxua.com%2F%3Fma%3DNA");
eq("canonical sort", canonicalParams({ b: 2, a: "x y" }), "a=x+y&b=2");
eq("php json slash", phpJson({ u: "https://a/b" }), '{"u":"https:\\/\\/a\\/b"}');
eq("sandbox host", ninepayHost("sandbox"), "https://sand-payment.9pay.vn");
eq("production host", ninepayHost("production"), "https://payment.9pay.vn");
eq("default host", ninepayHost(""), "https://sand-payment.9pay.vn");
eq("site fallback", allowSite("https://evil.example/phish"), "https://nhacuaantaxua.com");
eq("site ok", allowSite("https://nhacuaantaxua.com/x"), "https://nhacuaantaxua.com");

const params = { merchantKey: "testkey", time: 1700000000, invoice_no: "NA7K3M9QXP-ABCDEF12", amount: 700000, description: "Dat phong NA7K3M9QXP", return_url: "https://example.supabase.co/functions/v1/ninepay-payment?action=return", currency: "VND", lang: "vi" };
const message = paymentMessage("https://sand-payment.9pay.vn", params.time, params);
if (!message.startsWith("POST\nhttps://sand-payment.9pay.vn/payments/create\n1700000000\n")) fail.push("message head");
if (!message.includes("amount=700000")) fail.push("message amount");
if (message.split("\n").length !== 4) fail.push("message lines " + message.split("\n").length);

const sig = await hmacSha256Base64("The quick brown fox jumps over the lazy dog", "key");
const sigAgain = await hmacSha256Base64("The quick brown fox jumps over the lazy dog", "key");
eq("hmac stable", sig, sigAgain);
if (!/^[A-Za-z0-9+/]{43}=$/.test(sig)) fail.push("hmac shape " + sig);

const sum = await checksumOf("abc", "secret");
eq("checksum", sum, await checksumOf("abc", "secret"));
if (!await checksumOk("abc", sum, "secret")) fail.push("checksum ok");
if (await checksumOk("abc", sum.slice(0, -1) + (sum.endsWith("A") ? "B" : "A"), "secret")) fail.push("checksum tamper accepted");
if (safeEqual("abc", "abd")) fail.push("safeEqual false positive");
if (!safeEqual("ABC", "ABC")) fail.push("safeEqual false negative");

const dirty = { amount: 700000, invoice_no: "NA7K3M9QXP-ABCDEF12", status: 5, method: "CREDIT_CARD", payment_no: 299778, card_info: { card_number: "400555xxxxxx0009", card_name: "NGUYEN VAN A", token: "secret-token" }, card_brand: "VISA" };
const clean = publicPayment(dirty);
if (!clean || clean.card_number || clean.card_info || JSON.stringify(clean).includes("400555") || JSON.stringify(clean).includes("NGUYEN") || JSON.stringify(clean).includes("token")) fail.push("card data leaked: " + JSON.stringify(clean));
eq("clean method", clean.method, "CREDIT_CARD");
eq("clean ref", clean.payment_no, "299778");
if (publicPayment({ amount: 1, status: 5, invoice_no: "x" })) fail.push("short invoice accepted");

eq("chunked", decodeChunked("4\r\nWiki\r\n5\r\npedia\r\n0\r\n\r\n"), "Wikipedia");

const portal = await buildPortalUrl("https://sand-payment.9pay.vn", "test-secret", params);
const u = new URL(portal);
eq("portal host", u.hostname, "sand-payment.9pay.vn");
eq("portal path", u.pathname, "/portal");
if (!u.searchParams.get("baseEncode") || !u.searchParams.get("signature")) fail.push("portal query");
const back = JSON.parse(Buffer.from(u.searchParams.get("baseEncode"), "base64").toString("utf8").replace(/\\\//g, "/"));
eq("roundtrip invoice", back.invoice_no, params.invoice_no);
if (JSON.stringify(back).match(/\d{12,}/)) fail.push("portal looks like a card number");

const b64 = Buffer.from(JSON.stringify(dirty)).toString("base64");
const decoded = decodePaymentResult(b64);
if (!decoded || JSON.stringify(decoded).includes("400555")) fail.push("decode kept card number");

const { execFileSync } = await import("node:child_process");
try {
  const openssl = execFileSync("openssl", ["dgst", "-sha256", "-hmac", "key", "-binary"], { input: "The quick brown fox jumps over the lazy dog" }).toString("base64");
  eq("hmac openssl", sig, openssl);
} catch { /* không có openssl thì bỏ qua đối chiếu ngoài */ }

if (fail.length) {
  console.error(fail.join("\n"));
  process.exit(1);
}
console.log("9Pay: chữ ký, checksum và lọc dữ liệu thẻ đều ổn.");
