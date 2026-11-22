// Đối chiếu công thức giá khách (cùng quy tắc trigger bookings_set_total_price) và vài quy tắc bảo mật tĩnh.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOM = {
  name: 'Phòng Gỗ Ngắm Biển Mây',
  weekday: 600000,
  friSun: 700000,
  sat: null, // đêm thứ Bảy chủ nhà chưa gửi giá
  extraGuestFee: 200000,
  includedGuests: 2,
  maxGuests: 3,
};
const COMBO = 'Combo Săn Mây';
const COMBO_SUM = 70000 + 100000;

function dow(iso, plus) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + plus)).getUTCDay();
}
function nights(checkin, checkout) {
  const [y1, m1, d1] = checkin.split('-').map(Number);
  const [y2, m2, d2] = checkout.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
function guestsOf(text, fallback) {
  const m = String(text || '').match(/\d+/);
  if (!m) return fallback;
  return Math.max(1, Math.min(99, parseInt(m[0], 10)));
}
// null = từ chối (không có bảng giá). Khách không được tự chọn total.
function quoteCustomer(room, checkin, checkout, guestsText) {
  const n = nights(checkin, checkout);
  if (n < 1 || n > 366) return null;
  let hasCombo = false;
  let baseName = String(room || '').trim();
  const suffix = ' + ' + COMBO;
  if (baseName.endsWith(suffix) && baseName.length > suffix.length) {
    hasCombo = true;
    baseName = baseName.slice(0, -suffix.length);
  }
  if (baseName !== ROOM.name) return null;
  let g = Math.min(guestsOf(guestsText, 2), ROOM.maxGuests);
  let base = 0;
  for (let i = 0; i < n; i++) {
    const day = dow(checkin, i);
    const amt = day === 6 ? ROOM.sat : (day === 5 || day === 0) ? ROOM.friSun : ROOM.weekday;
    if (!(Number(amt) > 0)) return null;
    base += amt;
  }
  const extra = Math.max(0, g - ROOM.includedGuests) * ROOM.extraGuestFee * n;
  const combo = hasCombo ? COMBO_SUM * g * n : 0;
  return base + extra + combo;
}
function maskName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return parts.map((w, i) => (i === 0 ? w : w[0] + '*'.repeat(Math.max(w.length - 1, 1)))).join(' ');
}
function turnstileMode(secret, flag) {
  if (secret) return 'verify';
  if (flag === 'true') return 'reject';
  return 'allow';
}
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin === 'https://nhacuaantaxua.com' || origin === 'https://www.nhacuaantaxua.com') return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

function run() {
  const loi = [];
  const bao = (m) => loi.push(m);
  const eq = (a, b, m) => { if (a !== b) bao(m + ' (nhận ' + a + ', mong ' + b + ')'); };

  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-16', '2026-11-17', '2 người'), 600000, 'T2 2 khách');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-13', '2026-11-14', '2'), 700000, 'T6');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-15', '2026-11-16', '2'), 700000, 'CN');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-13', '2026-11-16', '2'), null, 'có T7 thì chưa báo giá');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-14', '2026-11-15', '3 người'), null, 'T7 chưa có giá');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây + Combo Săn Mây', '2026-11-16', '2026-11-17', '3'), 1310000, 'combo 3 khách');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-16', '2026-11-17', '1'), 600000, '1 khách vẫn giá 2 người');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-16', '2026-11-17', ''), 600000, 'thiếu số khách');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-16', '2026-11-17', '10 người'), 800000, 'vượt tối đa thì tính 3');
  eq(quoteCustomer('Phòng không có', '2026-11-16', '2026-11-17', '2'), null, 'hạng lạ phải từ chối');
  eq(quoteCustomer('Phòng Gỗ Ngắm Biển Mây', '2026-11-16', '2026-11-16', '2'), null, '0 đêm từ chối');

  eq(maskName('Lý Tào Thóc'), 'Lý T** T***', 'che tên');
  eq(maskName('An'), 'An', 'một chữ');
  eq(maskName('  '), '', 'tên trống');

  eq(turnstileMode('secret', undefined), 'verify', 'có secret thì kiểm');
  eq(turnstileMode('secret', 'false'), 'verify', 'có secret thì không bỏ qua');
  eq(turnstileMode(undefined, 'true'), 'reject', 'bật cờ mà thiếu secret thì từ chối');
  eq(turnstileMode(undefined, undefined), 'allow', 'thiếu secret mặc định không khóa đăng ký');
  eq(turnstileMode('', 'false'), 'allow', 'cờ false cho qua');

  eq(isAllowedOrigin('https://nhacuaantaxua.com'), true, 'tên miền chính');
  eq(isAllowedOrigin('https://www.nhacuaantaxua.com'), true, 'www');
  eq(isAllowedOrigin('http://localhost:8080'), true, 'localhost');
  eq(isAllowedOrigin('http://127.0.0.1:3000'), true, '127');
  eq(isAllowedOrigin('https://evil.example'), false, 'nguồn lạ');
  eq(isAllowedOrigin('https://nhacuaantaxua.com.evil.test'), false, 'hậu tố giả');

  const root = path.join(__dirname, '..');
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261116000000_booking_server_price.sql'), 'utf8');
  for (const n of ['700000', '900000', '1100000', '200000', '70000', '100000']) {
    if (!sql.includes(n)) bao('migration giá thiếu mức ' + n);
  }
  const sqlMoi = fs.readFileSync(path.join(root, 'supabase/migrations/20261122000000_room_rates_600_700.sql'), 'utf8');
  for (const n of ['600000', '700000', '200000']) {
    if (!sqlMoi.includes(n)) bao('migration giá mới thiếu mức ' + n);
  }
  if (!/ON CONFLICT \(kind, name\) DO NOTHING/.test(sql)) bao('migration giá không được ghi đè khi chạy lại');
  const cors = fs.readFileSync(path.join(root, 'supabase/functions/_shared/cors.ts'), 'utf8');
  if (!cors.includes('https://nhacuaantaxua.com') || !cors.includes('REQUIRE_TURNSTILE')) bao('cors.ts thiếu tên miền hoặc cờ Turnstile');
  if (cors.includes("'*'") || cors.includes('"*"')) bao('cors.ts còn dấu sao');
  const signup = fs.readFileSync(path.join(root, 'supabase/functions/customer-signup/index.ts'), 'utf8');
  const partner = fs.readFileSync(path.join(root, 'supabase/functions/partner-invite/index.ts'), 'utf8');
  if (signup.includes('"*"') || partner.includes('"*"')) bao('Edge Function còn CORS *');
  if (!signup.includes('turnstileMode')) bao('customer-signup chưa dùng turnstileMode');

  const htmls = ['index.html', 'admin.html', 'auth.html', 'phieu.html', 'chinh-sach.html', 'san-may-ta-xua.html', 'fuli8386.html'];
  for (const f of htmls) {
    const t = fs.readFileSync(path.join(root, f), 'utf8');
    if (!t.includes('Content-Security-Policy')) bao(f + ' thiếu CSP');
    if (/unsafe-eval/.test(t)) bao(f + ' có unsafe-eval');
    if (!t.includes('https://hkfprewiprdztmdcoxzz.supabase.co')) bao(f + ' CSP thiếu Supabase');
    if (!t.includes('https://cdn.jsdelivr.net')) bao(f + ' CSP thiếu jsDelivr');
  }

  if (loi.length) {
    console.error('KIỂM TRA GIÁ/BẢO MẬT THẤT BẠI (' + loi.length + '):\n- ' + loi.join('\n- '));
    return false;
  }
  console.log('Kiểm tra giá và quy tắc bảo mật tĩnh đạt.');
  return true;
}

if (require.main === module) process.exit(run() ? 0 : 1);
module.exports = { run };
