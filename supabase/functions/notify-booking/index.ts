// Báo chủ nhà khi có đơn mới / khách báo đã chuyển khoản. Triển khai với verify_jwt = false.
// Gọi từ trigger trong DB (migration 20261012000000). Chỉ nhận {id, event}; nội dung luôn đọc lại từ DB
// và mỗi sự kiện chỉ báo 1 lần (cột notified_new_at / notified_paid_at) nên gọi bậy cũng không spam được.
// Secret NOTIFY_WEBHOOK_URL = link nhận tin (Slack Incoming Webhook, Discord, hoặc Zapier "Catch Hook" -> Gmail...). Chưa đặt = bỏ qua.
import { createClient } from "npm:@supabase/supabase-js@2";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
const vnd = (n: number) => (n ? n.toLocaleString("vi-VN") + "đ" : "Liên hệ");
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ code: "method" }, 405);
  let b: Record<string, unknown>; try { b = await req.json(); } catch { return json({ code: "bad_request" }, 400); }
  const id = String(b.id || ""), event = b.event === "paid" ? "paid" : b.event === "new" ? "new" : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !event) return json({ code: "bad_request" }, 400);
  const url = Deno.env.get("NOTIFY_WEBHOOK_URL");
  if (!url) return json({ skipped: "no_webhook" });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
  const flag = event === "paid" ? "notified_paid_at" : "notified_new_at";
  // "Giành" quyền báo: chỉ 1 lần gọi cập nhật được dòng còn trống cờ
  const { data: claimed } = await db.from("bookings").update({ [flag]: new Date().toISOString() }).eq("id", id).is(flag, null).select("*").maybeSingle();
  if (!claimed) return json({ skipped: "done_or_missing" });
  const o = claimed as Record<string, unknown>;
  const title = event === "paid" ? "💰 Khách báo ĐÃ CHUYỂN KHOẢN - cần xác nhận" : "🆕 Đơn đặt phòng mới";
  const text = `${title}\nMã đơn: ${o.booking_code}\nPhòng/Tour: ${o.room}\nKhách: ${o.fullname} - ${o.phone}\nNhận phòng: ${o.checkin} → Trả: ${o.checkout} (${o.guests || "?"} khách)\nTổng: ${vnd(Number(o.total_price) || 0)}${o.notes ? `\nGhi chú: ${o.notes}` : ""}`;
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, // `text`: Slack/Discord(content) - các trường còn lại cho Zapier
    body: JSON.stringify({ text, content: text, event, code: o.booking_code, room: o.room, name: o.fullname, phone: o.phone, checkin: o.checkin, checkout: o.checkout, total: o.total_price }) }).catch(() => null);
  if (!r || !r.ok) { await db.from("bookings").update({ [flag]: null }).eq("id", id); console.error("webhook", r?.status); return json({ code: "webhook_failed" }, 502); }
  return json({ ok: true });
});
