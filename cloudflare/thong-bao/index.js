// Worker "anhomestay-web" (một Worker làm 3 việc):
//  1) Nhận báo đơn: Edge Function `notify-booking` (Supabase) gửi POST JSON { text, ... } tới link Worker kèm ?k=<NOTIFY_KEY>.
//     Tin được đưa vào Queue "notify-telegram-queue" (tên cũ, giữ nguyên) rồi trả lời ngay.
//  2) Gửi Gmail từ Queue qua Cloudflare Email Routing (binding EMAIL): lỗi thì tự gửi lại sau 30 giây, tối đa 5 lần.
//  3) Kho ảnh R2 (bucket "banhfuli"): GET /<tên-file> ai cũng xem được; PUT/DELETE CHỈ khi gửi kèm
//     header "Authorization: Bearer <UPLOAD_KEY>" (chưa đặt UPLOAD_KEY = khóa hẳn, không ai tải lên/xóa được).
// Secrets (đặt bằng `npm run thong-bao:khoa`, KHÔNG ghi vào code vì repo công khai):
//   NOTIFY_KEY, NOTIFY_EMAIL_TO (Gmail nhận báo đơn, phải là địa chỉ đã xác nhận trong Email Routing), UPLOAD_KEY (tùy chọn).
import { EmailMessage } from 'cloudflare:email';

const FROM = 'baodon@nhacuaantaxua.com'; // địa chỉ gửi thuộc tên miền đã bật Email Routing
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

// So sánh chuỗi không lộ độ dài khớp qua thời gian phản hồi
function safeEqual(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

// Mã hóa base64 cho chữ có dấu (UTF-8)
function b64(s) {
  const u = new TextEncoder().encode(String(s));
  let bin = '';
  for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function sendMail(env, text) {
  const to = String(env.NOTIFY_EMAIL_TO || '').trim();
  if (!env.EMAIL || !to) return false;
  const subject = text.split('\n')[0].slice(0, 120) || 'Báo đơn Nhà của An';
  const raw = [
    `From: =?UTF-8?B?${b64('Nhà của An - Báo đơn')}?= <${FROM}>`,
    `To: <${to}>`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    `Message-ID: <${crypto.randomUUID()}@nhacuaantaxua.com>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(text).replace(/.{76}/g, '$&\r\n'),
  ].join('\r\n');
  try { await env.EMAIL.send(new EmailMessage(FROM, to, raw)); return true; } catch (e) { console.error('email', e && e.message); return false; }
}

async function nhanBaoDon(request, env) {
  const k = new URL(request.url).searchParams.get('k') || '';
  if (!env.NOTIFY_KEY || !safeEqual(k, env.NOTIFY_KEY)) return json({ code: 'unauthorized' }, 401);
  if (!env.NOTIFY_EMAIL_TO) return json({ code: 'not_configured' }, 503);

  let b;
  try { b = await request.json(); } catch { return json({ code: 'bad_request' }, 400); }
  const text = String(b.text || '').slice(0, 5000);
  if (!text) return json({ code: 'bad_request' }, 400);

  if (env.THONG_BAO_QUEUE) {
    try { await env.THONG_BAO_QUEUE.send({ text }); return json({ ok: true, queued: true }); } catch { /* Queue lỗi: gửi thẳng bên dưới */ }
  }
  // Không có Queue (hoặc Queue lỗi): gửi thẳng; lỗi thì trả 502 để Edge Function gỡ cờ "đã báo"
  return (await sendMail(env, text)) ? json({ ok: true }) : json({ code: 'email_failed' }, 502);
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
  // Người nhận tin của Queue: gửi từng tin về Gmail, lỗi thì hẹn gửi lại
  async queue(batch, env) {
    for (const msg of batch.messages) {
      const text = String((msg.body && msg.body.text) || '').slice(0, 5000);
      if (!text) { msg.ack(); continue; }
      if (await sendMail(env, text)) msg.ack(); else msg.retry({ delaySeconds: 30 });
    }
  },
};
