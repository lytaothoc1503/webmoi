// Kiểm tra nhanh trước khi web lên mạng. Chạy: node scripts/kiem-tra.js
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const root = path.join(__dirname, '..');
const loi = [];
const bao = (m) => loi.push(m);

// 1. Cú pháp các file JavaScript
for (const f of ['config.js', 'data.js', 'app.js', 'account.js', 'i18n.js']) {
  try { cp.execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); }
  catch (e) { bao(`${f}: sai cú pháp JavaScript. ${String(e.stderr || e.message).split('\n').slice(0, 3).join(' ')}`); }
}

// 2. Nạp config.js và data.js
const sb = { window: {} };
vm.createContext(sb);
try { vm.runInContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), sb); } catch (e) { bao('config.js không chạy được: ' + e.message); }
try { vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), sb); } catch (e) { bao('data.js không chạy được: ' + e.message); }
const D = sb.window.SITE_DATA, S = sb.window.SITE;

if (D) {
  // 3. Ảnh trong data.js phải có file thật
  const anh = [];
  for (const k of ['rooms', 'tours', 'services', 'gallery']) for (const it of D[k] || []) if (it.image_url) anh.push([k, it.name || it.caption, it.image_url]);
  for (const [k, ten, u] of anh) if (!/^https?:/.test(u) && !fs.existsSync(path.join(root, u))) bao(`data.js (${k} - ${ten}): thiếu file ảnh ${u}`);
  // 4. Cờ "mẫu" phải tắt, và không có chữ "mẫu" trong nội dung hiển thị
  for (const c of ['catalogIsSample', 'storyIsSample', 'policyIsSample']) if (D[c] !== false) bao(`data.js: ${c} phải là false`);
  const chu = [];
  (function duyet(v) { if (typeof v === 'string') chu.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(duyet); })(D);
  for (const s of chu) if (/\bmẫu\b/i.test(s)) bao(`data.js: nội dung hiển thị còn chữ "mẫu": ${s.slice(0, 60)}`);
  // 5. Dữ liệu phòng/tour phải có tên và giá hợp lệ
  for (const k of ['rooms', 'tours']) for (const it of D[k] || []) {
    if (!it.name) bao(`data.js (${k}): có mục thiếu tên`);
    if (!Number.isFinite(Number(it.price)) || Number(it.price) < 0) bao(`data.js (${k} - ${it.name}): giá không hợp lệ`);
  }
}

// 6. Không để khóa bí mật trong file web
const quet = ['index.html', 'app.js', 'account.js', 'config.js', 'data.js', 'admin.html', 'auth.html', 'chinh-sach.html'];
for (const f of quet) {
  // bỏ các dòng ghi chú (//...) để lời nhắc "đừng dán service_role" không bị coi là lỗi
  const t = fs.readFileSync(path.join(root, f), 'utf8').split('\n').filter((d) => !/^\s*(\/\/|\/\*|\*|<!--)/.test(d)).join('\n');
  if (/service_role/i.test(t)) bao(`${f}: có chữ service_role (khóa bí mật không được nằm trong web)`);
  if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./.test(t)) bao(`${f}: có chuỗi giống khóa JWT`);
  if (/TURNSTILE_SECRET\s*[:=]\s*['"][^'"]+/.test(t)) bao(`${f}: có Turnstile Secret`);
}
if (S && S.socialLogin && (S.socialLogin.facebook || S.socialLogin.google)) console.log('Lưu ý: socialLogin đang bật. Hãy chắc nhà cung cấp đã cấu hình trong Supabase.');

if (loi.length) { console.error('KIỂM TRA THẤT BẠI (' + loi.length + ' lỗi):\n- ' + loi.join('\n- ')); process.exit(1); }
console.log('Kiểm tra đạt: cú pháp, ảnh, cờ "mẫu", dữ liệu, khóa bí mật đều ổn.');
