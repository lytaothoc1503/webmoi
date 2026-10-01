/* Nhà của An Homestay Tà Xùa — logic trang chủ */
const S = window.SITE, D = window.SITE_DATA, C = S.contacts;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^(https?:\/\/|images\/|\.\/)/.test(u || '') ? u : '');
const money = (n) => (Number(n) > 0 ? Number(n).toLocaleString('vi-VN') + ' đ' : 'Liên hệ');
const db = S.supabase.url && S.supabase.anonKey && window.supabase ? window.supabase.createClient(S.supabase.url, S.supabase.anonKey) : null;

let roomsData = [], toursData = [], currentItem = { name: '', price: 0 }, pending = null;

/* ===== THÔNG TIN THƯƠNG HIỆU ===== */
document.querySelectorAll('[data-site]').forEach((el) => (el.textContent = S[el.dataset.site] || ''));

/* ===== LIÊN HỆ (để trống = "Đang cập nhật") ===== */
const CONTACTS = [['facebook', 'Facebook', 'f', 'btn-fb'], ['zalo', 'Zalo', 'Z', 'btn-zalo'], ['phone', 'Gọi điện', '📞', 'btn-call'], ['email', 'Gmail', '✉', 'btn-mail']];
function chref(k) {
  const v = (C[k] || '').trim();
  if (!v) return '';
  return k === 'phone' ? 'tel:' + v.replace(/[^\d+]/g, '') : k === 'email' ? 'mailto:' + v : v;
}
function cval(k) { const v = (C[k] || '').trim(); return !v ? 'Đang cập nhật' : k === 'facebook' ? 'Fanpage Nhà của An' : k === 'zalo' ? 'Chat Zalo' : v; }
function contactList() { return CONTACTS.filter(([k]) => !(S.hideEmptyContacts && !chref(k))); }
function renderContacts() {
  $('floating-tools').innerHTML = contactList().map(([k, label, icon, cls]) => {
    const h = chref(k);
    return h ? `<a href="${esc(h)}" ${k === 'phone' || k === 'email' ? '' : 'target="_blank" rel="noopener"'} class="tool-btn ${cls}" title="${label}">${icon}</a>`
      : `<span class="tool-btn ${cls} is-empty" title="${label}: đang cập nhật" onclick="toast('${label}: thông tin đang được cập nhật')">${icon}</span>`;
  }).join('');
  $('contact-cards').innerHTML = contactList().map(([k, label, icon, cls]) => {
    const h = chref(k);
    return `<${h ? 'a href="' + esc(h) + '"' + (k === 'phone' || k === 'email' ? '' : ' target="_blank" rel="noopener"') : 'div'} class="contact-card ${h ? '' : 'is-empty'}"><span class="cc-icon ${cls}">${icon}</span><span><strong>${label}</strong><small>${esc(cval(k))}</small></span></${h ? 'a' : 'div'}>`;
  }).join('');
  $('topbar-links').innerHTML = contactList().filter(([k]) => chref(k)).map(([k, l]) => `<a href="${esc(chref(k))}" ${k === 'phone' || k === 'email' ? '' : 'target="_blank" rel="noopener"'}>${l}</a>`).join('');
  $('footer-contacts').innerHTML = contactList().map(([k, l]) => `<p>${l}: ${chref(k) ? `<a href="${esc(chref(k))}" ${k === 'phone' || k === 'email' ? '' : 'target="_blank" rel="noopener"'} style="color:#ffd2a6;text-decoration:underline">${esc(k === 'facebook' ? 'Nhà của An' : k === 'zalo' ? 'Chat Zalo' : C[k])}</a>` : '<span style="opacity:.7">Đang cập nhật</span>'}</p>`).join('');
}
let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ===== MENU + TÊN MỤC TRÊN TAB/THANH ĐỊA CHỈ ===== */
const SECTIONS = [['trang-chu', 'Trang Chủ'], ['gioi-thieu', 'Giới Thiệu'], ['hang-phong', 'Hạng Phòng'], ['tour-ta-xua', 'Tour Tà Xùa'], ['thu-vien', 'Thư Viện'], ['khach-noi', 'Khách Nói'], ['faq', 'FAQ'], ['tra-cuu-don', 'Tra Cứu Đơn'], ['dich-vu', 'Dịch Vụ'], ['lien-he', 'Liên Hệ']];
const LEGACY = { home: 'trang-chu', about: 'gioi-thieu', rooms: 'hang-phong', tours: 'tour-ta-xua', gallery: 'thu-vien', reviews: 'khach-noi', track: 'tra-cuu-don', services: 'dich-vu' };
let currentSec = '';
function visibleSections() { return SECTIONS.filter(([id]) => $(id) && !$(id).hidden); }
function buildNav() {
  const links = visibleSections().map(([id, l]) => `<li><a href="#${id}" data-sec="${id}">${l}</a></li>`).join('');
  $('nav-links').innerHTML = links + accountNavHtml() + `<li><a href="javascript:void(0)" onclick="openBookingModal('', 0)" class="btn-nav-book">Đặt Phòng</a></li>`;
  $('mobile-nav').innerHTML = visibleSections().map(([id, l]) => `<a href="#${id}" data-sec="${id}" onclick="closeMobileNav()">${l}</a>`).join('')
    + (currentUser ? `<a href="javascript:void(0)" onclick="closeMobileNav(); signOutUser()">Đăng xuất</a>` : (db ? `<a href="javascript:void(0)" onclick="closeMobileNav(); openAuthModal()">Đăng nhập / Đăng ký</a>` : ''))
    + `<a href="javascript:void(0)" onclick="closeMobileNav(); openBookingModal('', 0)" style="background: var(--accent-orange); text-align: center;">Đặt Phòng Ngay</a>`;
}
function spy() {
  const vs = visibleSections(); if (!vs.length) return;
  const line = window.innerHeight * 0.35; let cur = vs[0][0];
  for (const [id] of vs) if ($(id).getBoundingClientRect().top <= line) cur = id;
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = vs[vs.length - 1][0];
  if (cur === currentSec) return;
  currentSec = cur;
  const label = (SECTIONS.find(([i]) => i === cur) || [])[1];
  document.title = cur === 'trang-chu' ? `${S.name} | ${S.slogan}` : `${label} | ${S.name}`;
  history.replaceState(null, '', '#' + cur);
  document.querySelectorAll('[data-sec]').forEach((a) => a.classList.toggle('active', a.dataset.sec === cur));
}
let spyTick = false;
window.addEventListener('scroll', () => { if (!spyTick) { spyTick = true; requestAnimationFrame(() => { spy(); spyTick = false; }); } }, { passive: true });
function goHash() {
  let h = location.hash.slice(1);
  if (LEGACY[h]) { h = LEGACY[h]; history.replaceState(null, '', '#' + h); }
  if (h && $(h) && !$(h).hidden) $(h).scrollIntoView();
  currentSec = ''; spy();
}
window.addEventListener('hashchange', goHash);
let userMoved = false;
['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, () => (userMoved = true), { passive: true, once: true }));

/* ===== MENU DI ĐỘNG ===== */
const hamburgerBtn = $('hamburger-btn'), mobileNav = $('mobile-nav'), mobileOverlay = $('mobile-overlay');
hamburgerBtn.addEventListener('click', () => { mobileNav.classList.add('open'); mobileOverlay.classList.add('active'); hamburgerBtn.classList.add('active'); });
mobileOverlay.addEventListener('click', closeMobileNav);
function closeMobileNav() { mobileNav.classList.remove('open'); mobileOverlay.classList.remove('active'); hamburgerBtn.classList.remove('active'); }

/* ===== LỐI VÀO QUẢN TRỊ (nhấp 3 lần vào logo). Đăng nhập thật nằm ở auth.html ===== */
let secretClicks = 0, secretTimer = null;
$('admin-logo-trigger').addEventListener('click', () => {
  secretClicks++; clearTimeout(secretTimer); secretTimer = setTimeout(() => (secretClicks = 0), 700);
  if (secretClicks >= 3) { secretClicks = 0; window.location.href = 'auth.html'; }
});

/* ===== TẢI DỮ LIỆU: Supabase nếu có, không thì dùng data.js ===== */
async function getList(table, fallback, flag) {
  if (db) {
    try {
      const { data, error } = await db.from(table).select('*').eq(flag, true).order('sort_order');
      if (!error && data && data.length) return data;
    } catch (e) { /* dùng dữ liệu có sẵn */ }
  }
  return fallback || [];
}
const img = (u, alt, cls = '') => `<img ${cls ? `class="${cls}"` : ''} src="${esc(safeUrl(u))}" alt="${esc(alt)}" loading="lazy" onerror="imgFail(this)" />`;
const priceHtml = (n, unit) => (Number(n) > 0 ? `${money(n)} <span style="font-size:12px;color:var(--text-muted);font-weight:normal">${unit}</span>` : '<span style="font-size:15px">Liên hệ báo giá</span>');
const arg = (s) => esc(String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));

async function loadRooms() {
  roomsData = await getList('rooms', D.rooms, 'is_active');
  $('rooms-grid').innerHTML = roomsData.map((r) => `
    <div class="room-card">${img(r.image_url, r.name, 'room-thumb')}
      <div class="room-info"><h3 class="room-name">${esc(r.name)}</h3>
        <div class="room-price">${priceHtml(r.price, '/ đêm')}</div>
        <ul class="room-perks">${(r.perks || []).map((p) => `<li>✓ ${esc(p)}</li>`).join('')}</ul>
        <button class="btn-book-room" onclick="openBookingModal('${arg(r.name)}', ${Number(r.price) || 0})">Đặt Hạng Phòng Này</button></div></div>`).join('');
}
async function loadTours() {
  toursData = await getList('tours', D.tours, 'is_active');
  $('tours-grid').innerHTML = toursData.map((t) => `
    <div class="tour-arch-card">${img(t.image_url, t.name)}
      <div class="tour-overlay"><div class="tour-name">${esc(t.name)}</div>
        <div class="tour-price-tag">${money(t.price)}</div>
        <span class="tour-link" onclick="openBookingModal('${arg(t.name)}', ${Number(t.price) || 0})">Khám Phá Tour</span></div></div>`).join('');
}
async function loadGallery() {
  const list = await getList('gallery', D.gallery, 'is_active');
  $('gallery-grid').innerHTML = list.map((g) => `<div class="gallery-item" data-full="${esc(safeUrl(g.image_url))}">${img(g.image_url, g.caption || 'Ảnh')}<div class="gallery-caption">${esc(g.caption || '')}</div></div>`).join('');
  $('gallery-grid').querySelectorAll('.gallery-item').forEach((el) => el.addEventListener('click', () => openLightbox(el.dataset.full)));
}
async function loadReviews() {
  const list = await getList('reviews', D.reviews, 'is_published');
  if (!list.length) { $('khach-noi').hidden = true; return; }
  $('reviews-grid').innerHTML = list.map((r) => {
    const n = Math.min(5, Math.max(1, Number(r.rating) || 5));
    const av = safeUrl(r.author_avatar) || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.author_name) + '&background=3d2314&color=fff';
    return `<div class="review-card"><div class="review-header"><img src="${esc(av)}" class="review-avatar" alt="${esc(r.author_name)}" /><div><div class="review-name">${esc(r.author_name)}</div><div class="review-stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</div></div></div><p class="review-content">"${esc(r.content)}"</p></div>`;
  }).join('');
}
async function loadFAQ() {
  const list = await getList('faq', D.faq, 'is_active');
  $('faq-list').innerHTML = list.map((f) => `<div class="faq-item"><div class="faq-question" onclick="this.parentElement.classList.toggle('open')">${esc(f.question)}<span class="faq-icon">+</span></div><div class="faq-answer">${esc(f.answer)}</div></div>`).join('');
}
function openLightbox(url) { $('lightbox-img').src = url; $('lightbox').classList.add('active'); }
function closeLightbox() { $('lightbox').classList.remove('active'); }

/* ===== ĐẶT PHÒNG ===== */
function populateRoomSelect() {
  let o = '<option value="">-- Chọn hạng phòng hoặc tour --</option>';
  if (roomsData.length) o += '<optgroup label="Hạng Phòng">' + roomsData.map((r, i) => `<option value="r:${i}">${esc(r.name)} - ${Number(r.price) > 0 ? money(r.price) + '/đêm' : 'Liên hệ báo giá'}</option>`).join('') + '</optgroup>';
  if (toursData.length) o += '<optgroup label="Tour Trải Nghiệm">' + toursData.map((t, i) => `<option value="t:${i}">${esc(t.name)} - ${money(t.price)}</option>`).join('') + '</optgroup>';
  $('bk-room-select').innerHTML = o;
}
function onRoomSelectChange() {
  const v = $('bk-room-select').value, [k, i] = v.split(':');
  const it = v ? (k === 'r' ? roomsData : toursData)[Number(i)] : null;
  currentItem = it ? { name: it.name, price: Number(it.price) || 0 } : { name: '', price: 0 };
  calculateTotal();
}
function openBookingModal(name, price) {
  const today = new Date().toISOString().split('T')[0], tom = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  $('bk-checkin').value = today; $('bk-checkout').value = tom; $('bk-checkin').min = today; $('bk-checkout').min = tom;
  const sel = $('bk-room-select'); sel.selectedIndex = 0;
  if (name) { for (const o of sel.options) { const [k, i] = o.value.split(':'); const it = o.value ? (k === 'r' ? roomsData : toursData)[Number(i)] : null; if (it && it.name === name) { o.selected = true; break; } } }
  onRoomSelectChange(); backToStep1(); $('booking-modal').classList.add('active');
}
function closeBookingModal() { $('booking-modal').classList.remove('active'); $('booking-form-step1').reset(); }
function validateDates() {
  const a = $('bk-checkin').value, b = $('bk-checkout').value, err = $('date-error'), today = new Date().toISOString().split('T')[0];
  if (a && a < today) { err.textContent = 'Ngày nhận phòng không được trong quá khứ.'; err.classList.add('show'); return false; }
  if (a && b && (new Date(b) - new Date(a)) / 864e5 < 1) { err.textContent = 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày.'; err.classList.add('show'); return false; }
  err.classList.remove('show'); calculateTotal(); return true;
}
function calculateTotal() {
  let n = Math.ceil((new Date($('bk-checkout').value) - new Date($('bk-checkin').value)) / 864e5);
  if (isNaN(n) || n < 1) n = 1;
  const total = n * currentItem.price;
  $('bk-total-display').textContent = currentItem.price > 0 ? total.toLocaleString('vi-VN') + ' đ' : 'Báo giá khi nhà liên hệ';
  return total;
}
function showStep(which) {
  $('booking-form-step1').style.display = which === 1 ? 'block' : 'none';
  $('order-view').style.display = which === 2 ? 'block' : 'none';
  $('modal-heading').textContent = which === 1 ? 'Phiếu Đặt Phòng Trực Tuyến' : 'Đơn Đặt Phòng Của Bạn';
}
function backToStep1() { showStep(1); }
const bankOn = () => S.bank.bankId && S.bank.accountNo && S.bank.accountName;

/* ===== TRẠNG THÁI ĐƠN: Chờ thanh toán -> Đã thanh toán, chờ xác nhận -> Đặt phòng thành công -> Hoàn thành (hoặc Hủy) ===== */
const ST = { WAIT: 'Chờ thanh toán', PAID: 'Đã thanh toán - chờ xác nhận', OK: 'Đặt phòng thành công', DONE: 'Hoàn thành', CANCEL: 'Hủy đơn' };
const normStatus = (s) => ({ 'Chờ duyệt tiền cọc': ST.WAIT, 'Đã duyệt phòng': ST.OK }[s] || s || ST.WAIT);
const RANK = { [ST.WAIT]: 0, [ST.PAID]: 1, [ST.OK]: 2, [ST.DONE]: 3 };
const STEPS = ['Đã tạo đơn', 'Đã thanh toán, chờ xác nhận', 'Đặt phòng thành công', 'Hoàn thành'];
const STCLASS = { [ST.WAIT]: 'st-wait', [ST.PAID]: 'st-paid', [ST.OK]: 'st-ok', [ST.DONE]: 'st-done', [ST.CANCEL]: 'st-cancel' };
const STMSG = {
  [ST.WAIT]: 'Đơn đã được tạo. Hoàn tất chuyển khoản để nhà giữ chỗ cho bạn.',
  [ST.PAID]: 'Nhà đã nhận thông báo thanh toán của bạn và đang đối chiếu giao dịch. Nhắn Facebook của nhà kèm mã đơn và ảnh chụp giao dịch để được xác nhận nhanh hơn.',
  [ST.OK]: 'Đặt phòng thành công! Hãy nhắn Facebook của nhà để nhận phiếu xác nhận dịch vụ chính thức.',
  [ST.DONE]: 'Cảm ơn bạn đã ở cùng Nhà của An. Hẹn gặp lại bạn!',
  [ST.CANCEL]: 'Đơn này đã được hủy. Cần hỗ trợ, bạn hãy liên hệ nhà qua Facebook.',
};
const vdate = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s.split('-').reverse().join('/') : s || '');
function newCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', d = new Date(), r = new Uint32Array(4);
  (window.crypto || window.msCrypto).getRandomValues(r);
  return 'NA' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + [...r].map((n) => a[n % a.length]).join('');
}

/* ===== LIÊN HỆ QUA FACEBOOK ===== */
function fbSlug() { const m = (C.facebook || '').match(/facebook\.com\/(?:profile\.php\?id=)?([^/?#]+)/); return m ? m[1] : ''; }
function messengerHref() { return fbSlug() ? 'https://m.me/' + fbSlug() : chref('facebook'); }
function orderText(o) {
  return [`ĐƠN ĐẶT PHÒNG - ${S.name}`, `Mã đơn: ${o.code}`, `Dịch vụ: ${o.room}`, `Khách: ${o.name} - ${o.phone}`, `Nhận phòng: ${vdate(o.checkin)} | Trả phòng: ${vdate(o.checkout)}`, `Số khách: ${o.guests || ''}`, `Tổng tiền: ${o.total > 0 ? o.total.toLocaleString('vi-VN') + ' đ' : 'Chờ nhà báo giá'}`, `Nội dung chuyển khoản: ${o.tcode || o.code}`, `Ghi chú: ${o.notes || 'Không có'}`].join('\n');
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok;
  }
}
function sendViaFacebook(o) {
  const h = messengerHref();
  if (!h) { copyText(orderText(o)); toast('Facebook của nhà đang được cập nhật. Đã sao chép nội dung đơn.'); return; }
  const p = copyText(orderText(o));
  window.open(h, '_blank', 'noopener');
  p.then((ok) => toast(ok ? 'Đã sao chép nội dung đơn. Hãy dán vào tin nhắn Facebook.' : 'Hãy gửi mã đơn ' + o.code + ' cho nhà qua Facebook.'));
}

/* ===== LỊCH SỬ ĐƠN TRÊN THIẾT BỊ ===== */
const LS_KEY = 'na_orders';
function getLocal() { try { const a = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function setLocal(a) { try { localStorage.setItem(LS_KEY, JSON.stringify(a.slice(0, 20))); } catch (e) { /* bỏ qua */ } }
function saveOrder(o) { const a = getLocal().filter((x) => x.code !== o.code); a.unshift(o); setLocal(a); }
function updateLocal(code, patch) { const a = getLocal(); const o = a.find((x) => x.code === code); if (o) { Object.assign(o, patch); setLocal(a); } return o; }

/* ===== ĐẶT PHÒNG ===== */
async function createOrder(o) {
  if (!db) return { ok: true, offline: true };
  for (let i = 0; i < 3; i++) {
    let error = null;
    try {
      ({ error } = await db.from('bookings').insert({ booking_code: o.code, room: o.room, fullname: o.name, phone: o.phone, checkin: o.checkin, checkout: o.checkout, guests: o.guests, notes: o.notes, total_price: o.total, transfer_code: o.tcode, status: ST.WAIT, user_id: currentUser ? currentUser.id : null }));
    } catch (e) { error = { message: String(e && e.message || e) }; }
    if (!error) return { ok: true };
    if (error.code === '23505') { o.code = newCode(); o.tcode = o.code; continue; }
    return { ok: false, msg: error.message };
  }
  return { ok: false, msg: 'Trùng mã đơn, vui lòng thử lại.' };
}

$('booking-form-step1').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateDates()) return;
  if (!currentItem.name) { alert('Vui lòng chọn hạng phòng hoặc tour.'); return; }
  const phone = $('bk-phone').value.trim();
  if (phone.replace(/\D/g, '').length < 9) { alert('Số điện thoại chưa hợp lệ.'); return; }
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; const label = btn.textContent; btn.textContent = 'ĐANG TẠO ĐƠN...';
  const code = newCode();
  const o = { code, phone, room: currentItem.name, name: $('bk-name').value.trim(), checkin: $('bk-checkin').value, checkout: $('bk-checkout').value, guests: $('bk-guests').value.trim(), notes: $('bk-notes').value.trim() || 'Không có', total: calculateTotal(), tcode: code, status: ST.WAIT, created: new Date().toISOString() };
  const r = await createOrder(o);
  btn.disabled = false; btn.textContent = label;
  if (!r.ok) { alert('Chưa gửi được đơn: ' + r.msg + '\nBạn thử lại hoặc nhắn Facebook của nhà nhé.'); return; }
  o.synced = !r.offline;
  saveOrder(o); renderHistory(); openOrderView(o);
});

let currentOrder = null;
let currentUser = null; // khách đã đăng nhập (do account.js cập nhật)
const accountNavHtml = () => (currentUser ? `<li><a href="javascript:void(0)" onclick="signOutUser()" title="${esc(currentUser.email || '')}">Đăng xuất</a></li>` : (db ? `<li><a href="javascript:void(0)" onclick="openAuthModal()">Đăng nhập</a></li>` : ''));
function openOrderView(o) { currentOrder = o; renderOrderView(); showStep(2); $('booking-modal').classList.add('active'); }
function renderOrderView() {
  const o = currentOrder, st = normStatus(o.status), total = Number(o.total) || 0;
  const money2 = (n) => Number(n).toLocaleString('vi-VN') + ' đ';
  const hasQR = bankOn() && total > 0;
  const hours = '<small>Nhà hỗ trợ 24/7. Nhắn tin bất cứ lúc nào, nhà sẽ phản hồi sớm nhất.</small>';
  const contactOthers = [C.phone ? `<a href="tel:${esc(C.phone)}">📞 ${esc(C.phone)}</a>` : '', C.zalo ? `<a href="${esc(chref('zalo'))}" target="_blank" rel="noopener">Zalo</a>` : ''].filter(Boolean).join(' · ');
  let body = '';
  if (st === ST.WAIT) {
    if (hasQR) {
      const qr = `https://api.vietqr.io/image/${encodeURIComponent(S.bank.bankId)}-${encodeURIComponent(S.bank.accountNo)}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(o.tcode || o.code)}&accountName=${encodeURIComponent(S.bank.accountName)}`;
      body = `<h4 class="ov-h">QUÉT MÃ QR ĐỂ HOÀN TẤT ĐẶT PHÒNG</h4><p class="ov-sub">Vui lòng quét mã QR chuyển khoản giữ chỗ qua tài khoản nhà:</p>
        <div class="qr-container"><img src="${esc(qr)}" alt="VietQR" /></div>
        <table class="bank-info-table"><tr><td>Ngân hàng:</td><td>${esc(S.bank.bankName || S.bank.bankId)}</td></tr><tr><td>Số tài khoản:</td><td style="color:var(--accent-orange);font-size:16px;letter-spacing:1px">${esc(S.bank.accountNo)}</td></tr><tr><td>Chủ tài khoản:</td><td style="font-weight:bold">${esc(S.bank.accountName)}</td></tr><tr><td>Số tiền:</td><td style="font-weight:bold;color:#059669">${money2(total)}</td></tr><tr><td>Cú pháp:</td><td style="font-family:monospace;font-weight:bold">${esc(o.tcode || o.code)}</td></tr></table>
        <button type="button" class="btn-submit-booking" data-ov="paid">TÔI ĐÃ CHUYỂN KHOẢN XONG</button>
        <div class="ov-card"><strong>Chưa muốn thanh toán ngay?</strong><p>Đơn đã được lưu vào lịch sử của bạn. Bạn có thể xem lại, thanh toán sau hoặc trao đổi thêm với nhà trước khi chuyển khoản.</p>
          <div class="ov-row"><button type="button" class="oc-btn" data-ov="later">Lưu vào lịch sử, thanh toán sau</button><button type="button" class="oc-btn" data-ov="fb">Trao đổi với nhà qua Messenger</button></div></div>`;
    } else {
      body = `<div class="pay-note">Mức giá hoặc thông tin thanh toán của dịch vụ này sẽ được nhà gửi cho bạn qua Messenger. Bạn hãy nhắn kèm <strong>mã đơn</strong>.</div>
        <div class="ov-row"><button type="button" class="oc-btn" data-ov="later">Lưu vào lịch sử</button></div>`;
    }
    body += `<div class="ov-card support"><strong>🕑 Liên hệ homestay 24/7</strong><p>Cần hỏi thêm về phòng, giá, đưa đón hay lịch trình? Nhắn nhà ngay, không cần thanh toán trước.</p>${hours}${contactOthers ? `<div class="ov-others">${contactOthers}</div>` : ''}</div>`;
  } else if (st === ST.PAID) {
    body = `<div class="pay-note ok">Đã ghi nhận bạn chuyển khoản. Nhà đang đối chiếu giao dịch.</div>
      <div class="ov-card confirm"><strong>📄 Nhận phiếu xác nhận dịch vụ chính thức</strong><p>Liên hệ homestay qua Messenger kèm <strong>mã đơn ${esc(o.code)}</strong> và ảnh chụp giao dịch. Nhà sẽ gửi phiếu xác nhận dịch vụ chính thức cho bạn.</p>
      <button type="button" class="btn-send-fb" data-ov="fb">LIÊN HỆ HOMESTAY ĐỂ NHẬN PHIẾU XÁC NHẬN</button>${hours}</div>`;
  } else if (st === ST.OK) {
    body = `<div class="pay-note ok">${esc(STMSG[st])}${o.note ? '<br><em>' + esc(o.note) + '</em>' : ''}</div>
      <div class="ov-card confirm"><strong>📄 Phiếu xác nhận dịch vụ chính thức</strong><p>Liên hệ homestay qua Messenger kèm mã đơn <strong>${esc(o.code)}</strong> để nhận phiếu.</p><button type="button" class="btn-send-fb" data-ov="fb">LIÊN HỆ HOMESTAY ĐỂ NHẬN PHIẾU XÁC NHẬN</button></div>`;
  } else {
    body = `<div class="pay-note ${st === ST.CANCEL ? 'bad' : 'ok'}">${esc(STMSG[st] || '')}${o.note ? '<br><em>' + esc(o.note) + '</em>' : ''}</div>`;
  }
  $('order-view').innerHTML = `<div class="booking-code-display">MÃ ĐƠN CỦA BẠN: <strong>${esc(o.code)}</strong><br>Hãy lưu mã này để tra cứu tình trạng đơn</div>
    <div style="text-align:center;margin:8px 0"><span class="oc-badge ${STCLASS[st] || ''}">${esc(st)}</span></div>
    <p class="ov-sum">${esc(o.room)} · ${esc(vdate(o.checkin))} → ${esc(vdate(o.checkout))} · ${total > 0 ? money2(total) : 'Chờ báo giá'}</p>
    ${body}
    <div class="ov-links"><a href="#" data-ov="copy">Sao chép nội dung đơn</a><a href="#" data-ov="track">Xem tình trạng đơn</a></div>`;
}
$('order-view').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-ov]'); if (!b) return; e.preventDefault();
  const o = currentOrder; if (!o) return;
  const act = b.dataset.ov;
  if (act === 'fb') sendViaFacebook(o);
  else if (act === 'later') { closeBookingModal(); toast('Đã lưu đơn ' + o.code + ' vào lịch sử. Bạn có thể thanh toán sau.'); $('tra-cuu-don').scrollIntoView(); }
  else if (act === 'copy') { toast((await copyText(orderText(o))) ? 'Đã sao chép nội dung đơn' : 'Không sao chép được'); }
  else if (act === 'track') { closeBookingModal(); $('tra-cuu-don').scrollIntoView(); refreshHistory(); }
  else if (act === 'paid') await markPaid(o, b);
});
async function markPaid(o, btn) {
  if (!db) { toast('Chưa kết nối cơ sở dữ liệu. Hãy nhắn Facebook để nhà xác nhận.'); return; }
  btn.disabled = true;
  const { data, error } = await db.rpc('mark_booking_paid', { p_code: o.code, p_phone: o.phone });
  btn.disabled = false;
  if (error) { toast('Chưa cập nhật được. Bạn thử lại hoặc nhắn Facebook nhé.'); return; }
  if (data) { o.status = ST.PAID; updateLocal(o.code, { status: ST.PAID }); toast('Đã ghi nhận thanh toán của bạn'); }
  renderOrderView(); renderHistory(); if (!data) refreshHistory();
}

/* ===== TRA CỨU ĐƠN + LỊCH SỬ ===== */
function orderCard(o) {
  const st = normStatus(o.status), r = RANK[st] ?? 0, cancel = st === ST.CANCEL, c = esc(o.code);
  const steps = STEPS.map((l, i) => `<li class="${!cancel && r >= i ? 'done' : ''}${!cancel && r === i ? ' now' : ''}"><span>${i + 1}</span>${l}</li>`).join('');
  const act = [];
  if (st === ST.WAIT) act.push(`<button class="oc-btn primary" data-act="pay" data-code="${c}">Tiếp tục thanh toán</button>`);
  if (st === ST.WAIT || st === ST.PAID || st === ST.OK) act.push(`<button class="oc-btn" data-act="fb" data-code="${c}">${st === ST.OK ? 'Nhắn Facebook nhận phiếu xác nhận' : 'Gửi minh chứng qua Facebook'}</button>`);
  if (st === ST.OK || st === ST.DONE) {
    if (o.review === 'published') act.push('<span class="oc-chip ok">Đánh giá của bạn đã hiển thị ✓</span>');
    else if (o.review === 'pending') act.push('<span class="oc-chip">Đánh giá đang chờ nhà duyệt</span>');
    else if (db) act.push(`<button class="oc-btn" data-act="review" data-code="${c}">Viết đánh giá</button>`);
  }
  act.push(`<button class="oc-link" data-act="remove" data-code="${c}">Xóa khỏi lịch sử</button>`);
  const note = o.gone ? 'Không tìm thấy đơn này trên hệ thống của nhà (có thể đã được xóa).' : !o.synced && !db ? 'Đơn lưu trên thiết bị này. Hãy nhắn Facebook của nhà kèm mã đơn để được xác nhận.' : STMSG[st] || '';
  return `<div class="oc ${cancel ? 'is-cancel' : ''}"><div class="oc-head"><div><strong class="oc-code">${c}</strong><small>${esc(vdate((o.created || '').slice(0, 10)))}</small></div><span class="oc-badge ${STCLASS[st] || ''}">${esc(st)}</span></div>
    <div class="oc-body"><strong>${esc(o.room)}</strong><br>${esc(vdate(o.checkin))} → ${esc(vdate(o.checkout))}${o.guests ? ' · ' + esc(o.guests) : ''} · ${Number(o.total) > 0 ? Number(o.total).toLocaleString('vi-VN') + ' đ' : 'Chờ báo giá'}</div>
    ${cancel ? '' : `<ol class="oc-steps">${steps}</ol>`}
    <p class="oc-note">${esc(note)}${o.note ? '<br><em>Nhà nhắn: ' + esc(o.note) + '</em>' : ''}</p>
    <div class="oc-actions">${act.join('')}</div></div>`;
}
function renderHistory() {
  const list = getLocal(), box = $('order-history');
  box.innerHTML = list.length ? list.map(orderCard).join('') : '<div class="oh-empty">Bạn chưa có đơn nào trên thiết bị này. Sau khi đặt phòng, đơn sẽ hiện ở đây để bạn theo dõi. Nếu đặt từ thiết bị khác, hãy nhập Mã đơn và Số điện thoại ở trên.</div>';
}
let refreshing = false;
async function refreshHistory() {
  if (!db || refreshing) return; refreshing = true;
  try {
    const list = getLocal(); const updates = {};
    await Promise.all(list.map(async (o) => {
      let res; try { res = await db.rpc('track_booking', { p_code: o.code, p_phone: o.phone }); } catch (e) { return; }
      if (res.error) return;
      const r = res.data && res.data[0];
      updates[o.code] = r ? { gone: false, synced: true, status: r.status, review: r.review_status, note: r.admin_note || '', total: r.total_price } : { gone: true };
    }));
    const cur = getLocal(); cur.forEach((o) => { if (updates[o.code]) Object.assign(o, updates[o.code]); }); setLocal(cur);
  } finally { refreshing = false; renderHistory(); }
}
async function trackOrder() {
  const code = $('track-code').value.trim().toUpperCase(), phone = $('track-phone').value.trim(), out = $('track-result');
  const show = (cls, msg) => { out.className = 'track-result ' + cls + ' show'; out.textContent = msg; };
  if (!/^[A-Z0-9]{6,20}$/.test(code) || phone.replace(/\D/g, '').length < 9) { show('notfound', 'Vui lòng nhập đúng Mã đơn và Số điện thoại đã dùng khi đặt phòng.'); return; }
  if (!db) { show('notfound', 'Tra cứu trực tuyến chưa được bật. Bạn hãy nhắn Facebook của nhà kèm mã đơn để được kiểm tra.'); return; }
  let res; try { res = await db.rpc('track_booking', { p_code: code, p_phone: phone }); } catch (e) { res = { error: e }; }
  if (res.error) { show('notfound', 'Chưa tra cứu được lúc này, bạn vui lòng thử lại sau.'); return; }
  const r = res.data && res.data[0];
  if (!r) { show('notfound', 'Không tìm thấy đơn đặt phòng. Vui lòng kiểm tra lại Mã đơn và Số điện thoại.'); return; }
  saveOrder({ code: r.booking_code, phone, room: r.room, name: r.fullname, checkin: r.checkin, checkout: r.checkout, guests: r.guests || '', notes: '', total: r.total_price, tcode: r.transfer_code || r.booking_code, status: r.status, review: r.review_status, note: r.admin_note || '', created: r.created_at, synced: true });
  show('found', 'Đã tìm thấy đơn ' + r.booking_code + '. Xem chi tiết ở phần lịch sử bên dưới.');
  $('track-phone').value = ''; renderHistory();
}
$('order-history').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const o = getLocal().find((x) => x.code === b.dataset.code); if (!o) return;
  const act = b.dataset.act;
  if (act === 'pay') openOrderView(o);
  else if (act === 'fb') sendViaFacebook(o);
  else if (act === 'review') openReview(o);
  else if (act === 'remove' && confirm('Xóa đơn này khỏi lịch sử trên thiết bị? (Đơn vẫn được lưu ở nhà)')) { setLocal(getLocal().filter((x) => x.code !== o.code)); renderHistory(); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshHistory(); });

/* ===== VIẾT ĐÁNH GIÁ (sau khi đặt phòng thành công; hiện lên web khi nhà duyệt) ===== */
let reviewFor = null, reviewRating = 5;
function setStars(n) { reviewRating = n; document.querySelectorAll('#rv-stars button').forEach((b) => b.classList.toggle('on', Number(b.dataset.n) <= n)); }
function openReview(o) { reviewFor = o; setStars(5); $('rv-text').value = ''; $('rv-for').textContent = `Đơn ${o.code} - ${o.room}`; $('review-modal').classList.add('active'); }
function closeReview() { $('review-modal').classList.remove('active'); }
$('rv-stars').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setStars(Number(b.dataset.n)); });
async function submitReview() {
  const text = $('rv-text').value.trim();
  if (text.length < 5) { toast('Bạn hãy viết thêm vài chữ nhé'); return; }
  if (!db || !reviewFor) return;
  const btn = $('rv-send'); btn.disabled = true;
  let res; try { res = await db.rpc('submit_review', { p_code: reviewFor.code, p_phone: reviewFor.phone, p_rating: reviewRating, p_content: text }); } catch (e) { res = { error: e }; }
  btn.disabled = false;
  const msg = { ok: 'Cảm ơn bạn! Đánh giá sẽ hiển thị sau khi nhà duyệt.', exists: 'Bạn đã gửi đánh giá cho đơn này rồi.', not_allowed: 'Chỉ viết được đánh giá sau khi đặt phòng thành công.', not_found: 'Không tìm thấy đơn.', invalid: 'Nội dung đánh giá chưa hợp lệ.' };
  if (res.error) { toast('Chưa gửi được đánh giá, bạn thử lại sau nhé'); return; }
  toast(msg[res.data] || 'Đã gửi');
  if (res.data === 'ok' || res.data === 'exists') { updateLocal(reviewFor.code, { review: 'pending' }); closeReview(); renderHistory(); }
}

/* ===== KHỞI TẠO ===== */
(async function init() {
  renderContacts();
  if (chref('facebook')) $('hero-fb').href = chref('facebook'); else $('hero-fb').hidden = true;
  $('map-frame').src = 'https://www.google.com/maps?q=' + encodeURIComponent(S.mapQuery) + '&output=embed';
  $('map-link').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(S.mapQuery);
  buildNav();
  await Promise.all([loadRooms(), loadTours(), loadGallery(), loadReviews(), loadFAQ()]);
  populateRoomSelect(); buildNav(); renderHistory(); refreshHistory(); goHash();
  setTimeout(() => { if (!userMoved) goHash(); }, 700);
})();
