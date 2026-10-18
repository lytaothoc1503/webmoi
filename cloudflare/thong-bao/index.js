// Worker "anhomestay-web" (một Worker làm 3 việc):
//  1) Nhận báo đơn: Edge Function `notify-booking` (Supabase) gửi POST JSON { text, ... } tới link Worker kèm ?k=<NOTIFY_KEY>.
//     Tin được đưa vào Queue "notify-telegram-queue" rồi trả lời ngay (không mất tin khi Telegram chậm/lỗi).
//  2) Gửi Telegram từ Queue: lỗi thì tự gửi lại sau 30 giây, tối đa 5 lần (tin giữ trong Queue tối đa 24 giờ).
//  3) Kho ảnh R2 (bucket "banhfuli"): GET /<tên-file> ai cũng xem được; PUT/DELETE CHỈ khi gửi kèm
//     header "Authorization: Bearer <UPLOAD_KEY>" (chưa đặt UPLOAD_KEY = khóa hẳn, không ai tải lên/xóa được).
// Secrets (đặt bằng `npm run thong-bao:khoa`, KHÔNG ghi vào code): NOTIFY_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, UPLOAD_KEY (tùy chọn).
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

// So sánh chuỗi không lộ độ dài khớp qua thời gian phản hồi
function safeEqual(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

async function sendTelegram(env, text) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  }).catch(() => null);
  return !!(r && r.ok);
}

async function nhanBaoDon(request, env) {
  const k = new URL(request.url).searchParams.get('k') || '';
  if (!env.NOTIFY_KEY || !safeEqual(k, env.NOTIFY_KEY)) return json({ code: 'unauthorized' }, 401);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ code: 'not_configured' }, 503);

  let b;
  try { b = await request.json(); } catch { return json({ code: 'bad_request' }, 400); }
  const text = String(b.text || '').slice(0, 3500); // Telegram giới hạn 4096 ký tự
  if (!text) return json({ code: 'bad_request' }, 400);

  if (env.THONG_BAO_QUEUE) {
    try { await env.THONG_BAO_QUEUE.send({ text }); return json({ ok: true, queued: true }); } catch { /* Queue lỗi: gửi thẳng bên dưới */ }
  }
  // Không có Queue (hoặc Queue lỗi): gửi thẳng; lỗi thì trả 502 để Edge Function gỡ cờ "đã báo"
  return (await sendTelegram(env, text)) ? json({ ok: true }) : json({ code: 'telegram_failed' }, 502);
}

async function kho(request, env) {
  const bucket = env['banhfuli-bucket'];
  if (!bucket) return json({ code: 'no_bucket' }, 503);
  const key = decodeURIComponent(new URL(request.url).pathname.slice(1));
  if (request.method === 'GET' || request.method === 'HEAD') {
    if (!key) return new Response('AnhOMStay R2 Worker - ready', { status: 200 });
    const obj = await bucket.get(key);
    if (!obj) return new Response('Not Found', { status: 404 });
    // nosniff: trình duyệt không tự đoán kiểu file (chặn file tải lên bị chạy như trang web)
    return new Response(request.method === 'HEAD' ? null : obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' } });
  }
  // PUT/DELETE: bắt buộc khóa UPLOAD_KEY (trước đây ai cũng tải lên/xóa được)
  const auth = request.headers.get('Authorization') || '';
  if (!env.UPLOAD_KEY || !safeEqual(auth, 'Bearer ' + env.UPLOAD_KEY)) return json({ code: 'unauthorized' }, 401);
  if (!key) return json({ code: 'bad_request' }, 400);
  if (request.method === 'PUT') {
    await bucket.put(key, request.body, { httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' } });
    return json({ ok: true, key });
  }
  await bucket.delete(key);
  return json({ ok: true, key });
}

export default {
  async fetch(request, env) {
    if (request.method === 'POST') return nhanBaoDon(request, env);
    if (['GET', 'HEAD', 'PUT', 'DELETE'].includes(request.method)) return kho(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  },
  // Người nhận tin của Queue: gửi từng tin lên Telegram, lỗi thì hẹn gửi lại
  async queue(batch, env) {
    for (const msg of batch.messages) {
      const text = String((msg.body && msg.body.text) || '').slice(0, 3500);
      if (!text) { msg.ack(); continue; }
      if (await sendTelegram(env, text)) msg.ack(); else msg.retry({ delaySeconds: 30 });
    }
  },
};
