// Đã triển khai lên Supabase (project hkfprewiprdztmdcoxzz) với verify_jwt = false.
// Đăng ký khách bằng SĐT, không cần xác nhận email/SMS. Tài khoản = <sđt>@example.com (nội bộ, không gửi mail).
// Xác minh chủ số (SMS/Zalo OTP) là tính năng trả phí — chưa làm. email_confirm: true giữ nguyên vì
// hộp thư @example.com không nhận được thư; tắt cờ này sẽ khóa luôn đăng nhập.
// Turnstile: có TURNSTILE_SECRET thì luôn kiểm. Thiếu secret thì ghi cảnh báo và VẪN cho đăng ký,
// trừ khi REQUIRE_TURNSTILE='true' (chỉ đặt cờ này sau khi đã có secret, kẻo khóa mất đăng ký).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsFor, turnstileMode } from "../_shared/cors.ts";

const json = (req: Request, b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsFor(req), "Content-Type": "application/json" } });
const hits = new Map<string, number[]>();
function limited(ip: string) { const now = Date.now(); const a = (hits.get(ip) || []).filter((t) => now - t < 600000); a.push(now); hits.set(ip, a); return a.length > 8; }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    const h = corsFor(req);
    if (req.headers.get("Origin") && !h["Access-Control-Allow-Origin"]) return new Response("origin", { status: 403, headers: h });
    return new Response("ok", { headers: h });
  }
  if (req.method !== "POST") return json(req, { code: "method" }, 405);
  const ip = req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",").pop()!.trim() || "?"; // IP do hạ tầng gắn, không lấy phần client tự đặt
  if (limited(ip)) return json(req, { code: "rate" }, 429);
  let b: Record<string, unknown>; try { b = await req.json(); } catch { return json(req, { code: "bad_request" }, 400); }
  let phone = String(b.phone || "").replace(/[\s.\-()]/g, "");
  if (phone.startsWith("+84")) phone = "0" + phone.slice(3); else if (phone.startsWith("84") && phone.length === 11) phone = "0" + phone.slice(2);
  const tsSecret = Deno.env.get("TURNSTILE_SECRET");
  const tsMode = turnstileMode(tsSecret, Deno.env.get("REQUIRE_TURNSTILE"));
  if (tsMode === "reject") {
    console.warn("CANH BAO: TURNSTILE_SECRET chua dat va REQUIRE_TURNSTILE=true nen tu choi dang ky. Dat secret roi moi bat co nay.");
    return json(req, { code: "bot" }, 400);
  }
  if (tsMode === "allow") {
    console.warn("CANH BAO: TURNSTILE_SECRET chua dat. Dang ky bang SDT khong kiem tra bot. Hay dat secret TURNSTILE_SECRET. Muon tu choi khi thieu secret thi dat REQUIRE_TURNSTILE=true (chi sau khi da co secret). Xac minh chu so bang SMS/Zalo OTP la tinh nang tra phi, chua lam.");
  } else {
    const f = new URLSearchParams({ secret: tsSecret!, response: String(b.ts || ""), remoteip: ip });
    const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: f }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!v.success) return json(req, { code: "bot" }, 400);
  }
  const name = String(b.name || "").trim(), password = String(b.password || ""), year = b.year ? Number(b.year) : null;
  if (!/^0\d{9}$/.test(phone)) return json(req, { code: "bad_phone" }, 400);
  if (name.length < 2 || name.length > 80) return json(req, { code: "bad_name" }, 400);
  if (password.length < 6 || password.length > 72) return json(req, { code: "bad_password" }, 400);
  if (year !== null && !(year >= 1920 && year <= new Date().getFullYear())) return json(req, { code: "bad_year" }, 400);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
  const meta: Record<string, unknown> = { full_name: name, phone, accepted_policy_at: new Date().toISOString() };
  if (year) meta.birth_year = year;
  const { error } = await admin.auth.admin.createUser({ email: `${phone}@example.com`, password, email_confirm: true, user_metadata: meta });
  if (error) { if (/already|registered|exists/i.test(error.message)) return json(req, { code: "exists" }, 409); console.error("createUser", error.message); return json(req, { code: "failed" }, 400); }
  return json(req, { ok: true });
});
