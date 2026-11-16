// Chỉ admin (đã đăng nhập, is_admin() = true) gọi được: tạo hoặc đổi mật khẩu tài khoản đối tác/Sale
// (email + mật khẩu do admin đặt), rồi ghi/sửa dòng trong bảng partners. Dùng service_role nên phải
// nằm trong Edge Function, không lộ ra client. verify_jwt = true (mặc định): Supabase đã xác thực
// chữ ký JWT trước khi hàm chạy, hàm chỉ còn kiểm admin đúng quyền chưa.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsFor } from "../_shared/cors.ts";
const json = (req: Request, b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsFor(req), "Content-Type": "application/json" } });

async function findUserIdByEmail(admin: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data || !data.users || !data.users.length) break;
    const u = data.users.find((x) => (x.email || "").toLowerCase() === email);
    if (u) return u.id;
    if (data.users.length < 200) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    const h = corsFor(req);
    if (req.headers.get("Origin") && !h["Access-Control-Allow-Origin"]) return new Response("origin", { status: 403, headers: h });
    return new Response("ok", { headers: h });
  }
  if (req.method !== "POST") return json(req, { code: "method" }, 405);
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(req, { code: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: isAdmin, error: isAdminErr } = await asCaller.rpc("is_admin");
  if (isAdminErr || isAdmin !== true) return json(req, { code: "forbidden" }, 403);

  let b: Record<string, unknown>; try { b = await req.json(); } catch { return json(req, { code: "bad_request" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const label = String(b.label || "").trim().slice(0, 60);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(req, { code: "bad_email" }, 400);
  if (password.length < 8 || password.length > 72) return json(req, { code: "bad_password" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { partner: true, label } });
  if (created.error) {
    if (!/already|registered|exists/i.test(created.error.message)) { console.error("createUser", created.error.message); return json(req, { code: "failed" }, 400); }
    const uid = await findUserIdByEmail(admin, email);
    if (!uid) return json(req, { code: "exists_unknown" }, 409);
    const upd = await admin.auth.admin.updateUserById(uid, { password, user_metadata: { partner: true, label } });
    if (upd.error) { console.error("updateUserById", upd.error.message); return json(req, { code: "update_failed" }, 400); }
  }
  const up = await admin.from("partners").upsert({ email, label: label || null }, { onConflict: "email" });
  if (up.error) { console.error("upsert partners", up.error.message); return json(req, { code: "db_failed" }, 400); }
  return json(req, { ok: true });
});
