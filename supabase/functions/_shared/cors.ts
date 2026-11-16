// Nguồn gốc trình duyệt được phép gọi Edge Function.
// Trang chính: nhacuaantaxua.com. Máy dev: http://localhost hoặc 127.0.0.1, mọi cổng (servor).
const EXACT = new Set([
  "https://nhacuaantaxua.com",
  "https://www.nhacuaantaxua.com",
]);

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (EXACT.has(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

export function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

// Turnstile khi thiếu secret. Không khóa đăng ký đang chạy (secret chưa được dán lên Supabase).
// - có secret: luôn kiểm ('verify')
// - không secret và REQUIRE_TURNSTILE === 'true': từ chối ('reject') — chỉ bật sau khi đã có secret
// - không secret, cờ bỏ trống hoặc 'false': cho qua ('allow') và caller phải ghi log cảnh báo
export function turnstileMode(secret: string | undefined, flag: string | undefined): "verify" | "reject" | "allow" {
  if (secret) return "verify";
  if (flag === "true") return "reject";
  return "allow";
}
