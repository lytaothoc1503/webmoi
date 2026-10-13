/* Phiếu xác nhận đặt phòng (khổ ngang, in A4) dùng chung cho trang khách (index.html) và quản trị (admin.html).
   Thiết kế riêng của Nhà của An. Chỉ hiện thông tin có thật; ô chưa có thì để dòng chấm để điền tay. */
(function () {
  const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vd = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s.split('-').reverse().join('/') : s || '');
  const vnd = (n) => (Number(n) > 0 ? new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ' : '0 đ');
  const dots = (v, n) => (v !== undefined && v !== null && String(v).trim() !== '' ? esc(v) : '<i class="ns-dot">' + '.'.repeat(n || 18) + '</i>');
  const nights = (a, b) => { const n = Math.round((new Date(b) - new Date(a)) / 864e5); return Number.isFinite(n) && n > 0 ? n : ''; };

  function css() {
    if (document.getElementById('nca-slip-css')) return;
    const st = document.createElement('style'); st.id = 'nca-slip-css';
    st.textContent = `
.nca-slip{--g:#0b3b46;--gold:#c8902e;--cream:#fffaf0;display:flex;background:var(--cream);color:#1d2b2e;border:1px solid #d9c8a6;max-width:1060px;margin:0 auto;font-family:'Be Vietnam Pro','Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.45;page:nca-land}
.nca-slip *{box-sizing:border-box}
.ns-side{flex:0 0 190px;background:linear-gradient(180deg,#0b3b46,#082a32);color:#f6e4bd;display:flex;flex-direction:column;align-items:center;padding:26px 14px 0;text-align:center}
.ns-side svg.mark{width:64px;height:64px}.ns-side b{display:block;letter-spacing:.14em;font-size:13px;margin-top:10px}.ns-side small{letter-spacing:.3em;font-size:9px;opacity:.85}
.ns-side svg.hill{margin-top:auto;width:100%;display:block}
.ns-main{flex:1;margin:12px;border:2px solid var(--gold);outline:1px solid var(--gold);outline-offset:-6px;padding:20px 24px 14px;min-width:0}
.ns-title{text-align:center;color:var(--g);font-size:26px;letter-spacing:.06em;margin:0 0 2px;font-weight:800}
.ns-sub{text-align:center;color:#5d6b6e;font-size:12px;margin-bottom:10px}
.ns-code{display:flex;justify-content:center;margin:0 auto 12px;border:1.5px solid var(--g);max-width:420px}.ns-code span{padding:5px 14px}.ns-code span:first-child{background:var(--g);color:#fff;font-weight:700}.ns-code span:last-child{flex:1;text-align:center;font-weight:800;letter-spacing:.08em}
.ns-grid{display:grid;grid-template-columns:1fr 1.25fr;gap:10px 22px}
.ns-sec h4{margin:0 0 5px;color:var(--g);font-size:12px;letter-spacing:.05em}
.ns-sec table{width:100%;border-collapse:collapse;border:1px solid #9bb0b3;min-width:0!important;font-size:12.5px}
.ns-sec td{border:1px dashed #b7c6c8;padding:5px 8px;vertical-align:top}.ns-sec td:first-child{background:#f6efe0;width:38%;color:#33454a}
.ns-sec td b{color:#0b2a31}.ns-dot{color:#8aa;font-style:normal;letter-spacing:1px;word-break:break-all}
.ns-pay{display:grid;grid-template-columns:1fr 1.35fr auto;gap:10px 18px;margin-top:10px}
.ns-qr{width:150px;border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;text-align:center;color:var(--gold);font-weight:700;padding:6px;min-height:150px}.ns-qr img{width:100%;display:block}
.ns-flow{display:flex;gap:6px;margin:12px 0 6px;font-size:11px;color:#3c4f53}.ns-flow div{flex:1;border-top:3px solid #cdd9db;padding-top:4px}.ns-flow div.on{border-color:var(--gold);color:#6a4a0c;font-weight:700}
.ns-note{font-size:11.5px;background:#f3ead4;border-left:3px solid var(--gold);padding:6px 10px;margin-top:6px}
.ns-foot{display:flex;flex-wrap:wrap;gap:4px 24px;justify-content:center;margin-top:8px;padding-top:6px;border-top:1px solid #d9c8a6;font-size:11.5px;color:#33454a}
.ns-ok{color:#0a7a4b;font-weight:800}.ns-warn{color:#b45309;font-weight:800}
@media print{body.print-phieu>*:not(#phieu-modal){display:none!important}body.print-phieu #phieu-modal{position:static!important;background:none!important;display:block!important;padding:0!important;overflow:visible!important}body.print-phieu #phieu-modal .modal-box{box-shadow:none!important;max-width:none!important;padding:0!important}body.print-phieu #phieu-modal .modal-close,body.print-phieu #phieu-modal .oc-btn{display:none!important}}
@page nca-land{size:A4 landscape;margin:8mm}
@media print{.nca-slip{page:nca-land;width:100%;max-width:none;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
@media(max-width:760px){.nca-slip{flex-direction:column}.ns-side{flex:none;flex-direction:row;gap:12px;padding:12px;text-align:left}.ns-side svg.mark{width:42px;height:42px}.ns-side svg.hill{display:none}.ns-main{margin:8px;padding:14px 12px}.ns-title{font-size:19px}.ns-grid,.ns-pay{grid-template-columns:1fr}.ns-qr{width:100%;max-width:220px;margin:0 auto}.ns-flow{flex-wrap:wrap}.ns-flow div{flex:1 1 45%}}`;
    document.head.appendChild(st);
  }

  /* d: {code,name,phone,guests,room,roomNo,checkin,checkout,total,paid,status,nowStep(0-3),cccdLine(bool),extra(note)} */
  /* In khổ ngang: chèn @page tạm thời lúc in (cách chắc chắn nhất trên mọi trình duyệt) */
  window.NCA_printLand = function (cls) {
    const st = document.createElement('style'); st.textContent = '@page{size:A4 landscape;margin:8mm}'; document.head.appendChild(st);
    document.body.classList.add(cls);
    const done = () => { document.body.classList.remove(cls); st.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); window.print();
  };
  window.NCA_slip = function (d) {
    css();
    const S = window.SITE || {}, B = S.bank || {}, C = S.contacts || {};
    const total = Number(d.total) || 0, paid = Number(d.paid) || 0, remain = Math.max(0, total - paid);
    const n = d.nights || nights(d.checkin, d.checkout);
    // Ngân hàng/QR có thể ghi đè riêng cho từng phiếu (d.bankName/accountNo/accountName/qrImage), mặc định lấy từ config.js
    const bName = d.bankName ? String(d.bankName).trim() : '', bNo = d.accountNo ? String(d.accountNo).trim() : '', bHolder = d.accountName !== undefined && String(d.accountName).trim() !== '' ? String(d.accountName).trim() : '';
    const overridingBank = !!(bName || bNo || bHolder); // có ghi đè thì không tự tạo QR (VietQR cần mã ngân hàng, không phải tên) — bắt buộc tự tải ảnh QR
    const useBankName = bName || B.bankName || B.bankId, useAccountNo = bNo || B.accountNo, useAccountName = bHolder || B.accountName;
    const bankOn = (useAccountNo || d.qrImage) && remain > 0 && total > 0 && d.hideBank !== true; // chỉ hiện khi còn tiền phải thu
    const qr = d.qrImage ? d.qrImage : (!overridingBank && bankOn && remain > 0 && B.bankId && B.accountNo ? `https://api.vietqr.io/image/${encodeURIComponent(B.bankId)}-${encodeURIComponent(B.accountNo)}-compact2.png${B.accountName ? '?accountName=' + encodeURIComponent(B.accountName) : ''}` : ''); // không tích hợp sẵn số tiền/nội dung CK — khách tự ghi; d.qrImage (ảnh tự tải lên) luôn ưu tiên
    const steps = ['Đặt phòng', 'Chuyển khoản', 'Nhà xác nhận', 'Nhận phòng'];
    const now = d.nowStep ?? 2;
    const dep = Number(d.depositPercent) || 0; // có giá trị = hiện cọc theo % thay vì số tiền VND cụ thể
    const promo = d.promo ? String(d.promo).trim() : ''; // ưu đãi (chữ tự do, ví dụ "giảm 100.000đ")
    const remainManual = d.remainManual !== undefined && d.remainManual !== null && String(d.remainManual).trim() !== '' ? Number(d.remainManual) : null; // số tiền cọc còn lại ghi tay, thay cho số tự tính
    const pay = `<div class="ns-sec"><h4>03 THANH TOÁN</h4><table>
      <tr><td>Tổng tiền</td><td><b>${total > 0 ? vnd(total) : dots('', 12)}</b></td></tr>
      ${promo ? `<tr><td>Ưu đãi</td><td><b class="ns-ok">${esc(promo)}</b></td></tr>` : ''}
      ${dep > 0 ? `<tr><td>Đặt cọc</td><td><b class="ns-ok">${dep}% tổng tiền</b></td></tr>
      <tr><td>Còn lại</td><td><b class="ns-warn">${100 - dep}% — thanh toán khi nhận phòng</b></td></tr>`
      : `<tr><td>Đã thanh toán</td><td><b class="${paid > 0 ? 'ns-ok' : ''}">${paid > 0 ? vnd(paid) : (d.paid === undefined ? dots('', 12) : '0 đ')}</b></td></tr>
      <tr><td>Còn lại</td><td><b class="${remainManual !== null ? 'ns-warn' : (remain > 0 ? 'ns-warn' : 'ns-ok')}">${remainManual !== null ? vnd(remainManual) : (total > 0 ? (remain > 0 ? vnd(remain) : 'Đã thanh toán đủ') : dots('', 12))}</b></td></tr>`}
      </table></div>`;
    const bankBox = bankOn ? `<div class="ns-sec"><h4>04 THÔNG TIN CHUYỂN KHOẢN</h4><table>
      <tr><td>Ngân hàng</td><td>${esc(useBankName)}</td></tr>${useAccountName ? `<tr><td>Chủ tài khoản</td><td>${esc(useAccountName)}</td></tr>` : ''}
      <tr><td>Số tài khoản</td><td><b>${esc(useAccountNo)}</b></td></tr><tr><td>Nội dung CK</td><td><b>${esc(d.tcode || d.code || '')}</b></td></tr></table></div>
      <div class="ns-qr">${qr ? `<img src="${esc(qr)}" alt="QR chuyển khoản" />` : (remain > 0 ? 'Mã QR' : 'Đã thanh toán đủ')}</div>`
      : `<div class="ns-sec" style="grid-column:2/4"><h4>04 THÔNG TIN CHUYỂN KHOẢN</h4><div class="ns-note" style="margin:0">Nhà sẽ gửi thông tin chuyển khoản qua Messenger/điện thoại kèm mã đơn <b>${esc(d.code || '')}</b>.</div></div>`;
    return `<div class="nca-slip"><div class="ns-side">
      <svg class="mark" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#e8b058"/><path d="M10 23 24 11l14 12v14H10z" fill="#0b3b46"/><path d="m18 28 4 4 8-9" fill="none" stroke="#e8b058" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div><b>NHÀ CỦA AN</b><small>HOMESTAY &amp; COFFEE</small></div>
      <svg class="hill" viewBox="0 0 190 150" aria-hidden="true"><g fill="none" stroke="#c8902e" stroke-width="1.4" opacity=".85"><path d="M0 120c30-35 55-45 85-20 25-30 55-40 105 0"/><path d="M0 138c40-20 80-25 190 0"/><path d="M40 100l8-34 8 34M30 100h36M95 105l7-28 7 28M86 105h32M140 98l6-24 6 24M132 98h28"/><path d="M20 62c10-8 22-8 30 0M130 40c10-8 24-8 32 0M70 30c8-6 18-6 24 0"/></g></svg></div>
      <div class="ns-main"><h2 class="ns-title">PHIẾU XÁC NHẬN ĐẶT PHÒNG</h2>
      <div class="ns-sub">Cảm ơn Quý khách đã chọn ${esc(S.name || 'Nhà của An Homestay Tà Xùa')} làm điểm dừng chân giữa biển mây.</div>
      <div class="ns-code"><span>Mã booking</span><span>${dots(d.code, 10)}</span></div>
      <div class="ns-grid"><div class="ns-sec"><h4>01 THÔNG TIN KHÁCH</h4><table>
        <tr><td>Họ và tên</td><td><b>${dots(d.name, 20)}</b></td></tr><tr><td>Số điện thoại</td><td>${dots(d.phone, 14)}</td></tr><tr><td>Số khách</td><td>${dots(d.guests, 8)}</td></tr>
        ${d.cccdLine ? `<tr><td>CCCD/Hộ chiếu</td><td>${dots(d.cccd, 18)}</td></tr>` : ''}</table></div>
        <div class="ns-sec"><h4>02 THÔNG TIN LƯU TRÚ</h4><table>
        <tr><td>Hạng phòng</td><td><b>${dots(d.room, 20)}</b></td></tr><tr><td>Số phòng</td><td>${dots(d.roomNo, 8)}</td></tr>
        <tr><td>Nhận phòng</td><td>${dots(vd(d.checkin), 10)}${S.checkin ? ' · từ ' + esc(S.checkin) : ''}</td></tr><tr><td>Trả phòng</td><td>${dots(vd(d.checkout), 10)}${S.checkout ? ' · trước ' + esc(S.checkout) : ''}</td></tr>
        <tr><td>Số đêm</td><td>${dots(n, 4)}</td></tr></table></div></div>
      <div class="ns-pay">${pay}${bankBox}</div>
      <div class="ns-flow">${steps.map((s, i) => `<div class="${i <= now ? 'on' : ''}">${i + 1}. ${s}</div>`).join('')}</div>
      <div class="ns-note"><b>Khi nhận phòng:</b> người đại diện đặt phòng chỉ cần mang CCCD hoặc VNeID (khách nước ngoài mang hộ chiếu). Với khách đi cùng, bạn gửi nhà họ tên và số định danh để nhà khai báo lưu trú theo quy định. Muốn đổi hoặc hủy, nhắn nhà sớm kèm mã booking; hoàn tiền theo chính sách hoàn hủy đã công bố, về đúng tài khoản bạn cung cấp và có biên bản xác nhận.${d.extra ? '<br>' + esc(d.extra) : ''}</div>
      <div class="ns-foot"><span>${esc(S.name || '')}</span><span>Địa chỉ: ${esc(S.address || '')}</span>${C.phone ? `<span>Hotline: ${esc(C.phone)}</span>` : ''}</div>
      </div></div>`;
  };
})();
