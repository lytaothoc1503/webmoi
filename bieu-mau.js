/* Biểu mẫu in cho trang quản trị (admin.html): chọn mẫu, chọn đơn, điền thông tin, xem trước, in/lưu PDF.
   Dữ liệu điền chỉ nằm trong trình duyệt, KHÔNG gửi lên máy chủ, KHÔNG lưu (CCCD, STK...). */
(function () {
  const D = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function read3(n, pad) {
    const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10;
    let s = '';
    if (tr > 0 || pad) s += D[tr] + ' trăm';
    if (ch > 1) { s += ' ' + D[ch] + ' mươi'; if (dv === 1) s += ' mốt'; else if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + D[dv]; }
    else if (ch === 1) { s += ' mười'; if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + D[dv]; }
    else if (dv > 0) { if (tr > 0 || pad) s += ' linh'; s += ' ' + D[dv]; }
    return s.trim();
  }
  function vnWords(n) {
    n = Math.floor(Number(n) || 0);
    if (n <= 0) return '';
    const U = ['', ' nghìn', ' triệu', ' tỷ'], g = [];
    while (n > 0) { g.push(n % 1000); n = Math.floor(n / 1000); }
    const out = [];
    for (let i = g.length - 1; i >= 0; i--) {
      if (g[i] === 0) continue;
      out.push(read3(g[i], i < g.length - 1) + (U[i] !== undefined ? U[i] : ''));
    }
    const t = out.join(' ');
    return t.charAt(0).toUpperCase() + t.slice(1) + ' đồng';
  }
  window.vnWords = vnWords;

  const esc2 = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dots = (v, n) => (v && String(v).trim() ? '<b>' + esc2(v) + '</b>' : '.'.repeat(n || 24));
  const fdate = (iso) => { const d = iso ? new Date(iso) : new Date(); return { d: d.getDate(), m: d.getMonth() + 1, y: d.getFullYear() }; };
  const money = (n) => (Number(n) > 0 ? new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đồng' : dots('', 14));

  const F = {
    ngay: ['Ngày lập', 'date'], diadiem: ['Địa điểm', 'text'], so: ['Số văn bản (nếu có)', 'text'],
    a_ten: ['Chủ homestay: họ tên', 'text'], a_cccd: ['Chủ homestay: CCCD', 'text'], a_dc: ['Địa chỉ homestay', 'text'], a_sdt: ['Chủ homestay: SĐT', 'text'],
    b_ten: ['Khách: họ tên', 'text'], b_cccd: ['Khách: CCCD', 'text'], b_dc: ['Khách: địa chỉ', 'text'], b_sdt: ['Khách: SĐT', 'text'],
    ma: ['Mã đơn', 'text'], phong: ['Hạng phòng', 'text'], nhan: ['Ngày nhận phòng', 'text'], tra: ['Ngày trả phòng', 'text'],
    tien: ['Số tiền (đ)', 'number'], lydo: ['Lý do', 'text'], hinhthuc: ['Hình thức giao nhận', 'text'],
    nh: ['Ngân hàng nhận', 'text'], stk: ['Số tài khoản nhận', 'text'], ctk: ['Tên chủ tài khoản', 'text'],
    ma_phieu: ['Mã booking trên phiếu khách xuất trình (đối chiếu)', 'text'], khach: ['Số khách', 'text'], sophong: ['Số phòng', 'text'], coc: ['Đã thanh toán / đã cọc (đ)', 'number'], cccd_khach: ['CCCD/hộ chiếu khách (khi nhận phòng)', 'text'], ghichu: ['Ghi chú thêm trên phiếu', 'text'],
    c_ten: ['Người được ủy quyền: họ tên', 'text'], c_cccd: ['Người được ủy quyền: CCCD', 'text'], c_sdt: ['Người được ủy quyền: SĐT', 'text'], c_dc: ['Người được ủy quyền: địa chỉ', 'text']
  };

  const head = (f, title, sub) => `<div class="dp-qh"><b>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b><br>-----------***-----------</div>
    <h2 class="dp-title">${title}</h2>${f.so !== undefined ? `<div class="dp-c">Số: ${dots(f.so, 12)}</div>` : ''}${sub || ''}`;
  const when = (f) => { const t = fdate(f.ngay); return `Hôm nay, ngày ${t.d} tháng ${t.m} năm ${t.y}, tại ${dots(f.diadiem, 16)}`; };
  const partyA = (f, role) => `<p><b>BÊN A: ${role}</b> (sau đây gọi là "Bên A")</p>
    <p>Đại diện: Ông/Bà ${dots(f.a_ten, 22)}; CCCD số: ${dots(f.a_cccd, 16)}</p>
    <p>Đơn vị: <b>Nhà của An Homestay Tà Xùa</b> (hộ kinh doanh); địa chỉ: ${dots(f.a_dc, 28)}; điện thoại: ${dots(f.a_sdt, 12)}</p>`;
  const partyB = (f, role) => `<p><b>BÊN B: ${role}</b> (sau đây gọi là "Bên B")</p>
    <p>Ông/Bà: ${dots(f.b_ten, 24)}; CCCD số: ${dots(f.b_cccd, 16)}</p>
    <p>Địa chỉ: ${dots(f.b_dc, 36)}; điện thoại: ${dots(f.b_sdt, 12)}</p>`;
  const sign2 = (l, r) => `<div class="dp-sign"><div><b>${l}</b><br><i>(Ký, ghi rõ họ tên)</i></div><div><b>${r}</b><br><i>(Ký, ghi rõ họ tên)</i></div></div>`;
  const sign1 = (l) => `<div class="dp-sign"><div></div><div><b>${l}</b><br><i>(Ký, ghi rõ họ tên)</i></div></div>`;
  const chk = (f) => {
    const a = String(f.ma_phieu || '').trim().toUpperCase(), m = String(f.ma || '').trim().toUpperCase();
    if (!a) return '<p>Đối chiếu mã booking: mã trên Phiếu xác nhận do khách xuất trình ' + dots('', 12) + ' ☐ trùng khớp ☐ không trùng khớp với mã trên hệ thống.</p>';
    return a === m ? '<p>Đối chiếu mã booking: mã trên Phiếu xác nhận do khách xuất trình là <b>' + esc2(a) + '</b>, <b>trùng khớp</b> với mã trên hệ thống.</p>' : '<p style="color:#b91c1c"><b>CẢNH BÁO: mã trên phiếu khách xuất trình (' + esc2(a) + ') KHÔNG trùng với mã đơn (' + esc2(m || '—') + '). Chưa được hoàn tiền, cần kiểm tra lại.</b></p>';
  };
  const booking = (f) => `đơn đặt phòng mã ${dots(f.ma, 10)}, hạng phòng ${dots(f.phong, 12)}, từ ngày ${dots(f.nhan, 10)} đến ngày ${dots(f.tra, 10)}`;
  const bank = (f) => `Chuyển khoản vào tài khoản số ${dots(f.stk, 16)} tại ngân hàng ${dots(f.nh, 14)}, chủ tài khoản ${dots(f.ctk, 18)}`;

  const TEMPLATES = [
    { id: 'phieu-xn', group: 'Khách đặt phòng', name: 'Phiếu xác nhận đặt phòng (gửi khách)', note: 'Khổ ngang A4. Gửi khách sau khi chốt booking; có mã QR khi đã nhập ngân hàng trong config.js.', land: true,
      fields: ['ma', 'b_ten', 'b_sdt', 'khach', 'phong', 'sophong', 'nhan', 'tra', 'tien', 'coc', 'b_cccd', 'ghichu'],
      body: (f) => window.NCA_slip({ code: f.ma, name: f.b_ten, phone: f.b_sdt, guests: f.khach, room: f.phong, roomNo: f.sophong, checkin: f.nhan, checkout: f.tra, total: f.tien, paid: f.coc === '' || f.coc === undefined ? undefined : f.coc, cccdLine: true, cccd: f.b_cccd, extra: f.ghichu, nowStep: 2 }) },
    { id: 'bb-hoan-coc', group: 'Hoàn trả', name: 'Biên bản hoàn trả tiền đặt cọc (đầy đủ)', note: 'Hai bên ký, dùng khi hoàn cọc/hoàn tiền cho khách.',
      fields: ['ma_phieu', 'ngay', 'diadiem', 'so', 'a_ten', 'a_cccd', 'a_dc', 'a_sdt', 'b_ten', 'b_cccd', 'b_dc', 'b_sdt', 'ma', 'phong', 'nhan', 'tra', 'tien', 'lydo', 'hinhthuc', 'nh', 'stk', 'ctk'],
      body: (f) => `${head(f, 'BIÊN BẢN HOÀN TRẢ TIỀN ĐẶT CỌC')}
        <p><i>${when(f)}, chúng tôi gồm:</i></p>${partyA(f, 'BÊN NHẬN TIỀN ĐẶT CỌC')}${partyB(f, 'BÊN GIAO TIỀN ĐẶT CỌC')}
        <p>Hai bên đã thống nhất lập Biên bản hoàn trả tiền đặt cọc đối với ${booking(f)}, với nội dung như sau:</p>
        <p>1. Bên A hoàn trả lại cho Bên B số tiền đặt cọc là: <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 30)}).</p>
        ${chk(f)}
        <p>2. Lý do hoàn trả: ${dots(f.lydo, 40)}.</p>
        <p>3. Hình thức giao nhận: ${dots(f.hinhthuc, 20)}. ${f.stk ? bank(f) + '.' : ''}</p>
        <p>4. Bên B xác nhận đã nhận đủ số tiền nêu trên. Kể từ thời điểm này, hai bên không còn quyền và nghĩa vụ nào liên quan đến khoản tiền đặt cọc này và không khiếu nại gì thêm.</p>
        <p>5. Biên bản được lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản.</p>${sign2('BÊN A (Bên nhận tiền đặt cọc)', 'BÊN B (Bên giao tiền đặt cọc)')}` },

    { id: 'bb-hoan-coc-gon', group: 'Hoàn trả', name: 'Biên bản hoàn trả tiền (bản gọn)', note: 'Một trang ngắn, dùng cho đơn nhỏ.',
      fields: ['ma_phieu', 'ngay', 'diadiem', 'a_ten', 'b_ten', 'b_sdt', 'ma', 'tien', 'lydo', 'hinhthuc'],
      body: (f) => `${head(f, 'BIÊN BẢN HOÀN TRẢ TIỀN')}
        <p><i>${when(f)}.</i></p>
        <p>Bên hoàn trả: <b>Nhà của An Homestay Tà Xùa</b>, đại diện ${dots(f.a_ten, 20)}.</p>
        <p>Bên nhận hoàn: Ông/Bà ${dots(f.b_ten, 22)}; điện thoại ${dots(f.b_sdt, 12)}.</p>
        <p>Nội dung: hoàn trả tiền đơn đặt phòng mã ${dots(f.ma, 10)}. Số tiền: <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 24)}). Lý do: ${dots(f.lydo, 30)}. Hình thức: ${dots(f.hinhthuc, 18)}.</p>
        ${chk(f)}<p>Bên nhận hoàn xác nhận đã nhận đủ tiền và không khiếu nại gì thêm.</p>${sign2('BÊN HOÀN TRẢ', 'BÊN NHẬN HOÀN')}` },

    { id: 'uq-nhan-hoan', group: 'Ủy quyền', name: 'Giấy ủy quyền nhận tiền hoàn trả', note: 'Khách ủy quyền cho người khác nhận tiền hoàn thay.',
      fields: ['ngay', 'diadiem', 'b_ten', 'b_cccd', 'b_dc', 'b_sdt', 'c_ten', 'c_cccd', 'c_dc', 'c_sdt', 'ma', 'tien', 'nh', 'stk', 'ctk'],
      body: (f) => `${head(f, 'GIẤY ỦY QUYỀN')}
        <p><i>${when(f)}</i></p>
        <p><b>Bên ủy quyền:</b> Ông/Bà ${dots(f.b_ten, 22)}; CCCD số ${dots(f.b_cccd, 16)}; địa chỉ ${dots(f.b_dc, 30)}; điện thoại ${dots(f.b_sdt, 12)}.</p>
        <p><b>Bên được ủy quyền:</b> Ông/Bà ${dots(f.c_ten, 22)}; CCCD số ${dots(f.c_cccd, 16)}; địa chỉ ${dots(f.c_dc, 30)}; điện thoại ${dots(f.c_sdt, 12)}.</p>
        <p><b>Nội dung ủy quyền:</b> Bằng giấy này, tôi ủy quyền cho người có tên trên thay mặt tôi nhận lại số tiền <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 24)}) mà Nhà của An Homestay Tà Xùa hoàn trả cho đơn đặt phòng mã ${dots(f.ma, 10)}${f.stk ? '; ' + bank(f) : ''}, và ký xác nhận đã nhận tiền.</p>
        <p>Phạm vi: chỉ trong nội dung nêu trên. Thời hạn ủy quyền: ${dots('', 14)}. Ủy quyền không có thù lao.</p>
        <p>Tôi cam đoan chịu trách nhiệm trước pháp luật về nội dung ủy quyền này và các thông tin đã nêu.</p>${sign2('NGƯỜI ĐƯỢC ỦY QUYỀN', 'NGƯỜI ỦY QUYỀN')}` },

    { id: 'uq-nhan-phong', group: 'Ủy quyền', name: 'Giấy ủy quyền làm thủ tục nhận/trả phòng', note: 'Khách nhờ người khác nhận phòng, trả phòng thay.',
      fields: ['ngay', 'diadiem', 'b_ten', 'b_cccd', 'b_dc', 'b_sdt', 'c_ten', 'c_cccd', 'c_dc', 'c_sdt', 'ma', 'phong', 'nhan', 'tra'],
      body: (f) => `${head(f, 'GIẤY ỦY QUYỀN')}
        <p><i>${when(f)}</i></p>
        <p><b>Bên ủy quyền:</b> Ông/Bà ${dots(f.b_ten, 22)}; CCCD số ${dots(f.b_cccd, 16)}; địa chỉ ${dots(f.b_dc, 30)}; điện thoại ${dots(f.b_sdt, 12)}.</p>
        <p><b>Bên được ủy quyền:</b> Ông/Bà ${dots(f.c_ten, 22)}; CCCD số ${dots(f.c_cccd, 16)}; địa chỉ ${dots(f.c_dc, 30)}; điện thoại ${dots(f.c_sdt, 12)}.</p>
        <p><b>Nội dung ủy quyền:</b> Tôi ủy quyền cho người có tên trên thay mặt tôi làm thủ tục nhận phòng, trả phòng, xuất trình giấy tờ tùy thân theo quy định và nhận bàn giao phòng tại <b>Nhà của An Homestay Tà Xùa</b> đối với ${booking(f)}.</p>
        <p>Thời hạn ủy quyền: từ ngày ${dots(f.nhan, 10)} đến hết ngày ${dots(f.tra, 10)}. Ủy quyền không có thù lao.</p>
        <p>Tôi cam đoan chịu trách nhiệm trước pháp luật về nội dung ủy quyền này.</p>${sign2('NGƯỜI ĐƯỢC ỦY QUYỀN', 'NGƯỜI ỦY QUYỀN')}` },

    { id: 'de-nghi-hoan', group: 'Hoàn trả', name: 'Giấy đề nghị hoàn tiền (khách làm)', note: 'Khách ký đề nghị, nhà xem xét rồi xử lý hoàn.',
      fields: ['ma_phieu', 'ngay', 'diadiem', 'b_ten', 'b_cccd', 'b_sdt', 'ma', 'phong', 'nhan', 'tra', 'tien', 'lydo', 'nh', 'stk', 'ctk'],
      body: (f) => `${head(f, 'GIẤY ĐỀ NGHỊ HOÀN TIỀN')}
        <p class="dp-c"><b>Kính gửi: Nhà của An Homestay Tà Xùa</b></p>
        <p><i>${when(f)}</i></p>
        <p>Tôi tên: ${dots(f.b_ten, 24)}; CCCD số ${dots(f.b_cccd, 16)}; điện thoại ${dots(f.b_sdt, 12)}.</p>
        <p>Tôi đã đặt và thanh toán ${booking(f)}, số tiền <b>${money(f.tien)}</b>.</p>
        <p>Nay tôi đề nghị Quý đơn vị hoàn lại số tiền: <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 24)}). Lý do: ${dots(f.lydo, 40)}.</p>
        ${chk(f)}<p>Thông tin nhận hoàn: ${bank(f)}.</p>
        <p>Tôi cam đoan thông tin trên là đúng và chịu trách nhiệm về thông tin đã cung cấp. Việc hoàn tiền thực hiện theo chính sách hoàn hủy của Nhà của An.</p>${sign1('NGƯỜI ĐỀ NGHỊ')}` },

    { id: 'phieu-thu', group: 'Khách đặt phòng', name: 'Phiếu thu tiền đặt cọc / thanh toán', note: 'Xác nhận nhà đã nhận tiền của khách.',
      fields: ['ngay', 'diadiem', 'so', 'a_ten', 'b_ten', 'b_sdt', 'ma', 'phong', 'nhan', 'tra', 'tien', 'lydo', 'hinhthuc'],
      body: (f) => `${head(f, 'PHIẾU THU TIỀN')}
        <p><i>${when(f)}</i></p>
        <p>Đơn vị thu: <b>Nhà của An Homestay Tà Xùa</b>.</p>
        <p>Người nộp tiền: Ông/Bà ${dots(f.b_ten, 24)}; điện thoại ${dots(f.b_sdt, 12)}.</p>
        <p>Nội dung: ${f.lydo ? esc2(f.lydo) : 'Tiền đặt cọc / thanh toán'} cho ${booking(f)}.</p>
        <p>Số tiền: <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 28)}).</p>
        <p>Hình thức: ${dots(f.hinhthuc, 20)}.</p>${sign2('NGƯỜI NỘP TIỀN', 'NGƯỜI THU TIỀN')}
        <p class="dp-c"><i>Người thu tiền: ${dots(f.a_ten, 20)}</i></p>` }
  ];

  const BUNDLES = [
    { id: 'ho-so-dat', group: 'Bộ hồ sơ (in một lần)', name: 'Hồ sơ đặt phòng: phiếu xác nhận + phiếu thu', note: 'In liền 2 trang cho một đơn đặt phòng.', parts: ['phieu-xn', 'phieu-thu'] },
    { id: 'ho-so-hoan', group: 'Bộ hồ sơ (in một lần)', name: 'Hồ sơ hoàn trả: giấy đề nghị + biên bản hoàn trả + phiếu xác nhận gốc', note: 'In đủ bộ giấy tờ cho một lần hoàn tiền.', parts: ['de-nghi-hoan', 'bb-hoan-coc', 'phieu-xn'] },
    { id: 'ho-so-uq', group: 'Bộ hồ sơ (in một lần)', name: 'Hồ sơ hoàn trả qua người được ủy quyền', note: 'Giấy ủy quyền + biên bản hoàn trả.', parts: ['uq-nhan-hoan', 'bb-hoan-coc'] }
  ].map((b) => {
    const ts = b.parts.map((id) => TEMPLATES.find((t) => t.id === id));
    return Object.assign(b, { fields: [...new Set(ts.flatMap((t) => t.fields))], body: (f) => ts.map((t) => `<section class="dp-page${t.land ? ' dp-land' : ''}">${t.body(f)}</section>`).join('') });
  });
  const ALL = TEMPLATES.concat(BUNDLES);
  const state = { tpl: ALL[0], f: {} };
  const $ = (id) => document.getElementById(id);

  function prefill(b) {
    const t = new Date().toISOString().slice(0, 10), f = state.f;
    f.ngay = f.ngay || t; f.diadiem = f.diadiem || 'Tà Xùa, Bắc Yên, Sơn La';
    f.a_dc = f.a_dc || (window.SITE && window.SITE.address ? String(window.SITE.address).replace(/, Việt Nam$/, '') : '');
    if (b) {
      f.b_ten = b.fullname || ''; f.b_sdt = b.phone || ''; f.ma = b.booking_code || ''; f.phong = b.room || '';
      f.nhan = b.checkin || ''; f.tra = b.checkout || ''; f.tien = Number(b.total_price || 0) || ''; f.khach = b.guests || '';
      const okSt = typeof normStatus === 'function' ? normStatus(b.status) : ''; f.coc = (okSt === 'Đặt phòng thành công' || okSt === 'Hoàn thành') ? Number(b.total_price || 0) : 0;
    }
  }
  function render() {
    $('fm-preview').innerHTML = state.tpl.body(state.f); $('fm-preview').classList.toggle('is-land', !!state.tpl.land); renderMsg();
    $('fm-note').textContent = state.tpl.note + ' Thông tin điền ở đây chỉ nằm trong trình duyệt, không lưu lại.';
  }
  function drawFields() {
    $('fm-fields').innerHTML = state.tpl.fields.map((k) => {
      const [label, type] = F[k];
      return `<label class="fm-f"><span>${esc2(label)}</span><input data-k="${k}" type="${type}" value="${esc2(state.f[k] ?? '')}" maxlength="120" autocomplete="off" /></label>`;
    }).join('');
    $('fm-fields').querySelectorAll('input').forEach((i) => i.addEventListener('input', () => { state.f[i.dataset.k] = i.value.trim(); render(); }));
  }
  window.initForms = function () {
    const sel = $('fm-tpl'), bk = $('fm-booking');
    if (!sel.options.length) {
      const gs = [...new Set(ALL.map((t) => t.group))];
      sel.innerHTML = gs.map((g) => `<optgroup label="${esc2(g)}">${ALL.map((t, i) => (t.group === g ? `<option value="${i}">${esc2(t.name)}</option>` : '')).join('')}</optgroup>`).join('');
      sel.onchange = () => { state.tpl = ALL[Number(sel.value)]; drawFields(); render(); };
      state.tpl = ALL[Number(sel.value)] || ALL[0];
    }
    const list = (typeof allBookings !== 'undefined' ? allBookings : []);
    bk.innerHTML = '<option value="">Không chọn đơn (điền tay)</option>' + list.map((b) => `<option value="${esc2(b.id)}">${esc2(b.booking_code)} - ${esc2(b.fullname)}</option>`).join('');
    bk.onchange = () => { prefill(list.find((x) => x.id === bk.value)); drawFields(); render(); };
    prefill(null); drawFields(); render();
  };
  const base = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  function renderMsg() {
    const f = state.f, box = $('fm-msg'); if (!box) return;
    const link = base() + '?ma=' + encodeURIComponent(f.ma || '') + '#tra-cuu-don';
    const code = f.ma ? f.ma : '(mã đơn)';
    const M = {
      xn: `Chào ${f.b_ten || 'bạn'}, Nhà của An xác nhận đơn đặt phòng mã ${code} (${f.phong || 'phòng'}, ${f.nhan || '...'} → ${f.tra || '...'}).\nBạn xem tình trạng đơn và tải/in Phiếu xác nhận tại: ${link}\nNgày đến, bạn mang CCCD/hộ chiếu của các khách để nhà làm thủ tục lưu trú nhé. Cần hỏi đường đi hoặc đổi lịch, bạn nhắn nhà kèm mã ${code}.`,
      hoan: `Chào ${f.b_ten || 'bạn'}, Nhà của An đã ghi nhận yêu cầu hoàn tiền đơn ${code}${f.tien ? ' (' + new Intl.NumberFormat('vi-VN').format(Number(f.tien)) + ' đ)' : ''}.\nNhà sẽ chuyển về đúng tài khoản bạn cung cấp và gửi Biên bản hoàn trả để hai bên lưu. Bạn xem đơn tại: ${link}`,
      nhac: `Chào ${f.b_ten || 'bạn'}, nhắc lịch nhận phòng ${f.nhan || '...'} tại Nhà của An (đơn ${code}). Nhận phòng từ ${(window.SITE && window.SITE.checkin) || '14:00'}. Bạn mang CCCD/hộ chiếu; đường đi và gửi xe nhà sẽ hướng dẫn khi bạn nhắn. Xem đơn: ${link}`
    };
    box.innerHTML = [['xn', 'Tin xác nhận đặt phòng'], ['hoan', 'Tin báo hoàn tiền'], ['nhac', 'Tin nhắc lịch nhận phòng']].map(([k, l]) => `<div class="fm-msg"><b>${l}</b><textarea readonly rows="6" id="fm-m-${k}">${esc2(M[k]).replace(/\\n/g, '&#10;')}</textarea><button class="btn-export" data-copy="fm-m-${k}">Sao chép</button></div>`).join('');
    box.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => { const t = $(b.dataset.copy); try { await navigator.clipboard.writeText(t.value); b.textContent = 'Đã chép ✓'; } catch (e) { t.select(); document.execCommand('copy'); } setTimeout(() => (b.textContent = 'Sao chép'), 1500); }));
  }
  window.openFormsFor = function (id) {
    const el = document.querySelector("[onclick*=\"showPage('forms'\"]"); if (el) window.showPage('forms', el);
    const bk = $('fm-booking'); if (bk) { bk.value = id; bk.onchange(); }
    window.scrollTo(0, 0);
  };
  window.printForm = function () {
    if (state.tpl.land) { window.NCA_printLand('print-doc'); return; }
    document.body.classList.add('print-doc');
    const done = () => { document.body.classList.remove('print-doc'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  };
})();
