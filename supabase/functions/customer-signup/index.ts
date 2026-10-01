// Đã triển khai lên Supabase (project hkfprewiprdztmdcoxzz) với verify_jwt = false.
// Đăng ký khách bằng SĐT, không cần xác nhận email/SMS. Tài khoản = <sđt>@example.com (nội bộ, không gửi mail).
import { createClient } from "npm:@supabase/supabase-js@2";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const hits = new Map<string, number[]>();
function limited(ip: string) { const now = Date.now(); const a = (hits.get(ip) || []).filter((t) => now - t < 600000); a.push(now); hits.set(ip, a); return a.length > 8; }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "method" }, 405);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (limited(ip)) return json({ code: "rate" }, 429);
  let b: Record<string, unknown>; try { b = await req.json(); } catch { return json({ code: "bad_request" }, 400); }
  let phone = String(b.phone || "").replace(/[\s.\-()]/g, "");
  if (phone.startsWith("+84")) phone = "0" + phone.slice(3); else if (phone.startsWith("84") && phone.length === 11) phone = "0" + phone.slice(2);
  const tsSecret = Deno.env.get("TURNSTILE_SECRET"); // đặt secret này để bật chống bot; chưa đặt = bỏ qua
  if (tsSecret) {
    const f = new URLSearchParams({ secret: tsSecret, response: String(b.ts || ""), remoteip: ip });
    const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: f }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!v.success) return json({ code: "bot" }, 400);
  }
  const name = String(b.name || "").trim(), password = String(b.password || ""), year = b.year ? Number(b.year) : null;
  if (!/^0\d{9}$/.test(phone)) return json({ code: "bad_phone" }, 400);
  if (name.length < 2 || name.length > 80) return json({ code: "bad_name" }, 400);
  if (password.length < 6 || password.length > 72) return json({ code: "bad_password" }, 400);
  if (year !== null && !(year >= 1920 && year <= new Date().getFullYear())) return json({ code: "bad_year" }, 400);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
  const meta: Record<string, unknown> = { full_name: name, phone, accepted_policy_at: new Date().toISOString() };
  if (year) meta.birth_year = year;
  const { error } = await admin.auth.admin.createUser({ email: `${phone}@example.com`, password, email_confirm: true, user_metadata: meta });
  if (error) { if (/already|registered|exists/i.test(error.message)) return json({ code: "exists" }, 409); console.error("createUser", error.message); return json({ code: "failed", detail: error.message }, 400); }
  return json({ ok: true });
});
