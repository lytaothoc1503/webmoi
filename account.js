/* ===== TÀI KHOẢN KHÁCH: đăng ký / đăng nhập bằng email (không cần mã xác nhận) hoặc Facebook ===== */
/* Yêu cầu: bật Sign-ups trong Supabase, tắt "Confirm email". Đăng nhập Facebook cần cấu hình Facebook provider trong Supabase. */
let authMode = 'login';
const AUTH_ERR = {
  'Invalid login credentials': 'Email hoặc mật khẩu chưa đúng.',
  'User already registered': 'Email này đã có tài khoản. Hãy chuyển sang Đăng nhập.',
  'Email not confirmed': 'Email chưa được xác nhận. Hãy báo nhà để được hỗ trợ.',
  'Password should be at least 6 characters': 'Mật khẩu cần ít nhất 6 ký tự.',
};
const authMsg = (t, ok) => { const e = $('auth-msg'); e.textContent = t || ''; e.className = 'auth-msg' + (ok ? ' ok' : ''); };
function setAuthMode(m) {
  authMode = m;
  $('auth-tab-login').classList.toggle('on', m === 'login'); $('auth-tab-signup').classList.toggle('on', m === 'signup');
  $('auth-submit').textContent = m === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ TÀI KHOẢN';
  $('auth-password').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  authMsg('');
}
function updateAuthButtons() { const ok = $('auth-agree').checked; $('auth-submit').disabled = !ok; $('auth-fb').disabled = !ok; }
function openAuthModal(note) { if (!db) { toast('Tính năng tài khoản chưa sẵn sàng.'); return; } authMsg(note || '', true); $('auth-agree').checked = false; updateAuthButtons(); $('auth-modal').classList.add('active'); }
function closeAuthModal() { $('auth-modal').classList.remove('active'); pendingBooking = false; }
async function signOutUser() { if (db) await db.auth.signOut(); toast('Đã đăng xuất'); }

$('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!$('auth-agree').checked) { authMsg('Bạn cần tích đồng ý Chính sách để tiếp tục.'); return; }
  const email = $('auth-email').value.trim(), password = $('auth-password').value;
  const btn = $('auth-submit'); btn.disabled = true; authMsg('Đang xử lý...', true);
  try {
    let r;
    if (authMode === 'login') r = await db.auth.signInWithPassword({ email, password });
    else r = await db.auth.signUp({ email, password, options: { data: { accepted_policy_at: new Date().toISOString() } } });
    if (r.error) { authMsg(AUTH_ERR[r.error.message] || 'Không thực hiện được: ' + r.error.message); return; }
    if (!r.data.session) { authMsg('Đã tạo tài khoản. Nếu hệ thống yêu cầu xác nhận, hãy kiểm tra email rồi đăng nhập.', true); return; }
    $('auth-modal').classList.remove('active'); toast(authMode === 'login' ? 'Đăng nhập thành công' : 'Tạo tài khoản thành công');
  } catch (err) { authMsg('Lỗi kết nối, bạn thử lại nhé.'); } finally { updateAuthButtons(); }
});
$('auth-fb').addEventListener('click', async () => {
  if (!$('auth-agree').checked) { authMsg('Bạn cần tích đồng ý Chính sách để tiếp tục.'); return; }
  const { error } = await db.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: location.origin + location.pathname } });
  if (error) authMsg(/not enabled|Unsupported provider/i.test(error.message) ? 'Đăng nhập Facebook đang được cài đặt. Bạn dùng email tạm nhé.' : 'Không đăng nhập được: ' + error.message);
});
$('auth-agree').addEventListener('change', updateAuthButtons);

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
  db.auth.onAuthStateChange((_ev, session) => { setTimeout(() => applySession(session), 0); });
}
