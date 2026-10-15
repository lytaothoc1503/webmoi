// Cloudflare Worker: nhận tin từ Edge Function `notify-booking` (Supabase) và báo cho chủ nhà qua Telegram.
// Edge Function gửi POST JSON { text, event, code, ... } tới link của Worker kèm ?k=<NOTIFY_KEY>.
// Secrets (đặt bằng `wrangler secret put`, KHÔNG ghi vào code): NOTIFY_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

// So sánh chuỗi không lộ độ dài khớp qua thời gian phản hồi
function safeEqual(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ code: 'method' }, 405);
    const k = new URL(request.url).searchParams.get('k') || '';
    if (!env.NOTIFY_KEY || !safeEqual(k, env.NOTIFY_KEY)) return json({ code: 'unauthorized' }, 401);
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ code: 'not_configured' }, 503);

    let b;
    try { b = await request.json(); } catch { return json({ code: 'bad_request' }, 400); }
    const text = String(b.text || '').slice(0, 3500); // Telegram giới hạn 4096 ký tự
    if (!text) return json({ code: 'bad_request' }, 400);

    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    }).catch(() => null);
    // Trả lỗi để Edge Function gỡ cờ "đã báo" và thử lại ở lần sau
    if (!r || !r.ok) return json({ code: 'telegram_failed', status: r ? r.status : 0 }, 502);
    return json({ ok: true });
  },
};
