/* ===== TÀI KHOẢN KHÁCH: đăng ký / đăng nhập bằng email (không cần mã xác nhận), Facebook, Google ===== */
/* Yêu cầu Supabase: bật Sign-ups, TẮT "Confirm email" (Authentication > Sign In / Providers > Email). Facebook/Google cần cấu hình provider. */
let authMode = 'login';
const AUTH_INFO = {
  login: 'Đăng nhập để đặt phòng và xem lịch sử đơn trên mọi thiết bị.',
  signup: 'Tạo tài khoản để tích lũy điểm thưởng và quản lý đơn đặt phòng.',
  forgot: 'Nhập email đã đăng ký, nhà sẽ gửi liên kết đặt lại mật khẩu cho bạn.',
  reset: 'Nhập mật khẩu mới cho tài khoản của bạn.',
};
const AUTH_SUBMIT = { login: 'ĐĂNG NHẬP', signup: 'ĐĂNG KÝ TÀI KHOẢN', forgot: 'GỬI LIÊN KẾT ĐẶT LẠI', reset: 'ĐỔI MẬT KHẨU' };
const AUTH_TITLE = { login: 'Chào mừng bạn quay lại', signup: 'Tạo tài khoản mới', forgot: 'Quên mật khẩu', reset: 'Đặt lại mật khẩu' };
function authErr(err) {
  const m = String((err && (err.message || err.msg)) || ''), c = String((err && err.code) || '');
  if (/invalid login credentials/i.test(m) || c === 'invalid_credentials') return 'Email hoặc mật khẩu chưa đúng. Nếu chưa có tài khoản, hãy chọn tab ĐĂNG KÝ.';
  if (/email not confirmed/i.test(m) || c === 'email_not_confirmed') return 'Tài khoản này đang chờ kích hoạt. Bạn nhắn nhà qua Facebook, nhà sẽ kích hoạt ngay.';
  if (/already registered|already been registered/i.test(m) || c === 'user_already_exists') return 'Email này đã có tài khoản. Hãy chuyển sang tab ĐĂNG NHẬP.';
  if (/password should be at least|weak_password|at least \d+ char/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if (/rate limit|only request this after|too many/i.test(m) || c === 'over_email_send_rate_limit' || c === 'over_request_rate_limit') return 'Bạn thao tác hơi nhanh, vui lòng đợi khoảng 1 phút rồi thử lại.';
  if (/signups? not allowed|signup_disabled/i.test(m) || c === 'signup_disabled') return 'Hệ thống tạm thời chưa mở đăng ký. Bạn nhắn nhà qua Facebook để được hỗ trợ.';
  if (/invalid.*email|email_address_invalid/i.test(m) || c === 'email_address_invalid') return 'Email không hợp lệ, bạn kiểm tra lại nhé.';
  if (/same password|same_password/i.test(m) || c === 'same_password') return 'Mật khẩu mới phải khác mật khẩu cũ.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Mất kết nối mạng, bạn thử lại nhé.';
  return 'Chưa thực hiện được, bạn thử lại sau ít phút. (' + m + ')';
}
const authMsg = (t, ok) => { const e = $('auth-msg'); e.textContent = t || ''; e.className = 'auth-msg' + (ok ? ' ok' : ''); };
function setAuthMode(m) {
  authMode = m;
  document.querySelectorAll('#auth-form [data-m]').forEach((el) => { el.hidden = !el.dataset.m.split(' ').includes(m); });
  $('auth-tabs').hidden = !(m === 'login' || m === 'signup');
  $('auth-tab-login').classList.toggle('on', m === 'login'); $('auth-tab-signup').classList.toggle('on', m === 'signup');
  $('auth-submit').textContent = AUTH_SUBMIT[m]; $('auth-title').textContent = AUTH_TITLE[m]; $('auth-info').textContent = AUTH_INFO[m];
  $('auth-password').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  $('auth-pw-label').textContent = m === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu';
  $('auth-password').type = 'password';
  document.querySelectorAll('#auth-form input.bad').forEach((i) => i.classList.remove('bad'));
  authMsg('');
}
function openAuthModal(note, mode) {
  if (!db) { toast('Tính năng tài khoản chưa sẵn sàng.'); return; }
  setAuthMode(mode || 'login'); if (note) authMsg(note, true);
  $('auth-form').reset(); $('auth-submit').disabled = false; $('auth-modal').classList.add('active');
}
function closeAuthModal() { $('auth-modal').classList.remove('active'); $('auth-form').reset(); pendingBooking = false; }
async function signOutUser() { if (db) await db.auth.signOut(); toast('Đã đăng xuất'); }
const bad = (id, msg) => { $(id).classList.add('bad'); $(id).focus(); authMsg(msg); return false; };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validateAuth() {
  document.querySelectorAll('#auth-form input.bad').forEach((i) => i.classList.remove('bad'));
  const email = $('auth-email').value.trim(), pw = $('auth-password').value, name = $('auth-name').value.trim(), year = $('auth-year').value.trim();
  if (authMode === 'signup' && name.length < 2) return bad('auth-name', 'Vui lòng nhập họ và tên (dùng để in trên phiếu đặt phòng).');
  if (authMode !== 'reset' && !EMAIL_RE.test(email)) return bad('auth-email', 'Email chưa đúng định dạng, ví dụ ten@gmail.com.');
  if (authMode !== 'forgot' && pw.length < 6) return bad('auth-password', 'Mật khẩu cần ít nhất 6 ký tự.');
  if (authMode === 'signup' && year && !(Number(year) >= 1920 && Number(year) <= new Date().getFullYear())) return bad('auth-year', 'Năm sinh chưa hợp lệ (hoặc để trống).');
  if (authMode === 'signup' && !$('auth-agree').checked) { authMsg('Bạn cần tích đồng ý Điều khoản & Chính sách để tạo tài khoản.'); return false; }
  return true;
}
const doneAuth = (t) => { $('auth-modal').classList.remove('active'); $('auth-form').reset(); toast(t); };

$('auth-eye').addEventListener('click', () => { const p = $('auth-password'); p.type = p.type === 'password' ? 'text' : 'password'; });
$('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateAuth()) return;
  const email = $('auth-email').value.trim(), password = $('auth-password').value, btn = $('auth-submit');
  btn.disabled = true; authMsg('Đang xử lý...', true);
  try {
    if (authMode === 'login') {
      const r = await db.auth.signInWithPassword({ email, password });
      if (r.error) { authMsg(authErr(r.error)); return; }
      doneAuth('Đăng nhập thành công');
    } else if (authMode === 'signup') {
      const meta = { full_name: $('auth-name').value.trim(), accepted_policy_at: new Date().toISOString() };
      if ($('auth-year').value.trim()) meta.birth_year = Number($('auth-year').value);
      const r = await db.auth.signUp({ email, password, options: { data: meta } });
      if (r.error) { authMsg(authErr(r.error)); return; }
      // Email đã tồn tại: Supabase (khi bật Confirm email) trả về user giả không có identities, không báo lỗi
      if (r.data.user && Array.isArray(r.data.user.identities) && r.data.user.identities.length === 0) { authMsg('Email này đã có tài khoản. Hãy chuyển sang tab ĐĂNG NHẬP.'); return; }
      let session = r.data.session;
      if (!session) { const s = await db.auth.signInWithPassword({ email, password }); if (s.error) { authMsg(authErr(s.error)); return; } session = s.data.session; }
      doneAuth('Tạo tài khoản thành công');
    } else if (authMode === 'forgot') {
      const r = await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (r.error) { authMsg(authErr(r.error)); return; }
      authMsg('Nếu email này đã có tài khoản, liên kết đặt lại mật khẩu đã được gửi. Hãy kiểm tra cả mục Spam.', true);
    } else if (authMode === 'reset') {
      const r = await db.auth.updateUser({ password });
      if (r.error) { authMsg(authErr(r.error)); return; }
      doneAuth('Đã đổi mật khẩu');
    }
  } catch (err) { authMsg('Mất kết nối mạng, bạn thử lại nhé.'); } finally { btn.disabled = false; }
});
async function oauth(provider, label) {
  if (authMode === 'signup' && !$('auth-agree').checked) { authMsg('Bạn cần tích đồng ý Điều khoản & Chính sách trước khi tiếp tục.'); return; }
  const { error } = await db.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
  if (error) authMsg(/not enabled|Unsupported provider|provider is not/i.test(error.message) ? `Đăng nhập ${label} đang được cài đặt. Bạn dùng email tạm nhé.` : authErr(error));
}
$('auth-fb').addEventListener('click', () => oauth('facebook', 'Facebook'));
$('auth-gg').addEventListener('click', () => oauth('google', 'Google'));

/* Đồng bộ lịch sử đơn theo tài khoản (xem được trên mọi thiết bị) */
async function syncAccountOrders() {
  if (!db || !currentUser) return;
  const { data, error } = await db.from('bookings').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  if (error || !data) return;
  data.forEach((r) => saveOrder({ code: r.booking_code, phone: r.phone, room: r.room, name: r.fullname, checkin: r.checkin, checkout: r.checkout, guests: r.guests || '', notes: r.notes || '', total: r.total_price, tcode: r.transfer_code || r.booking_code, status: r.status, review: 'none', note: r.admin_note || '', created: r.created_at, synced: true }));
  renderHistory(); refreshHistory();
}
async function applySession(session) {
  const before = currentUser && currentUser.id;
  currentUser = session ? session.user : null;
  // Thiết bị dùng chung: đăng xuất thì xóa lịch sử đơn lưu trên máy (đăng nhập lại sẽ tự đồng bộ về)
  if (before && !currentUser) { try { localStorage.removeItem('na_orders:' + before); } catch (e) { /* bỏ qua */ } renderHistory(); }
  buildNav(); renderHistory();
  if (currentUser && currentUser.id !== before) {
    if (!$('bk-name').value) $('bk-name').value = (currentUser.user_metadata && currentUser.user_metadata.full_name) || '';
    syncAccountOrders();
    if (pendingBooking) { pendingBooking = false; $('auth-modal').classList.remove('active'); if ($('booking-modal').classList.contains('active')) setTimeout(() => $('booking-form-step1').requestSubmit(), 50); }
  }
}
if (db) {
  db.auth.getSession().then(({ data }) => applySession(data && data.session));
  db.auth.onAuthStateChange((ev, session) => { setTimeout(() => { applySession(session); if (ev === 'PASSWORD_RECOVERY') openAuthModal('Bạn đang đặt lại mật khẩu.', 'reset'); }, 0); });
}
