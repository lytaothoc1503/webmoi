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
  const dmy = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? String(v).split('-').reverse().join('/') : (v || ''));
  const dots = (v, n) => (v && String(v).trim() ? '<b>' + esc2(dmy(v)) + '</b>' : '.'.repeat(n || 24));
  const fdate = (iso) => { const d = iso ? new Date(iso) : new Date(); return { d: d.getDate(), m: d.getMonth() + 1, y: d.getFullYear() }; };
  const money = (n) => (Number(n) > 0 ? new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đồng' : dots('', 14));

  const F = {
    ngay: ['Ngày lập', 'date'], diadiem: ['Địa điểm', 'text'], so: ['Số văn bản (nếu có)', 'text'],
    a_ten: ['Chủ homestay: họ tên', 'text'], a_cccd: ['Chủ homestay: CCCD', 'text'], a_dc: ['Địa chỉ homestay', 'text'], a_sdt: ['Chủ homestay: SĐT', 'text'],
    b_ten: ['Khách: họ tên', 'text'], b_cccd: ['Khách: CCCD', 'text'], b_dc: ['Khách: địa chỉ', 'text'], b_sdt: ['Khách: SĐT', 'text'],
    ma: ['Mã đơn', 'text'], phong: ['Hạng phòng', 'text'], nhan: ['Ngày nhận phòng', 'date'], tra: ['Ngày trả phòng', 'date'],
    tien: ['Số tiền (đ)', 'number'], lydo: ['Lý do', 'text'], hinhthuc: ['Hình thức giao nhận', 'text'],
    nh: ['Ngân hàng nhận', 'text'], stk: ['Số tài khoản nhận', 'text'], ctk: ['Tên chủ tài khoản', 'text'],
    ma_phieu: ['Mã booking trên phiếu khách xuất trình (đối chiếu)', 'text'], khach: ['Số khách', 'text'], sophong: ['Số phòng', 'text'], coc: ['Số tiền cọc (đ)', 'number'], conlai: ['Số tiền cọc còn lại (đ, để trống = web tự tính)', 'number'], uudai: ['Ưu đãi (nếu có)', 'text'], cccd_khach: ['CCCD/hộ chiếu khách (khi nhận phòng)', 'text'], ghichu: ['Ghi chú thêm trên phiếu', 'text'],
    nh_p: ['Ngân hàng hiện trên phiếu (để trống = dùng mặc định config.js)', 'text'], stk_p: ['Số tài khoản hiện trên phiếu (để trống = dùng mặc định)', 'text'], ctk_p: ['Tên chủ tài khoản hiện trên phiếu (để trống = dùng mặc định)', 'text'], qr_img: ['Ảnh QR tự tải lên (thay QR tự tạo)', 'file'],
    don_vi: ['Tên đơn vị trên phiếu (để trống = Nhà của An)', 'text'], dia_chi_dv: ['Địa chỉ đơn vị (để trống = dùng địa chỉ Nhà của An)', 'text'], hotline_dv: ['Hotline đơn vị (để trống = dùng hotline Nhà của An)', 'text'], logo_dv: ['Logo đơn vị (để trống = dùng logo Nhà của An)', 'file'],
    b_ns: ['Khách: ngày sinh', 'text'], b_cap: ['Khách: CCCD cấp ngày', 'text'], b_noicap: ['Khách: CCCD cấp tại', 'text'], songay: ['Dự kiến hoàn tiền trong (số ngày)', 'text'],
    c_ten: ['Người/đơn vị được ủy quyền: tên (để trống nếu chưa biết)', 'text'], c_cccd: ['Người được ủy quyền: CCCD', 'text'], c_sdt: ['Người được ủy quyền: SĐT', 'text'], c_dc: ['Người được ủy quyền: địa chỉ', 'text'],
    ck_ten: ['Tên người đã chuyển khoản (theo sao kê ngân hàng)', 'text'], ck_ngan_hang: ['Ngân hàng chuyển khoản', 'text'], ck_stk: ['Số tài khoản chuyển khoản (nếu có)', 'text'],
    ma_gd: ['Mã giao dịch ngân hàng (sau khi chuyển khoản xong)', 'text'], noidung_ck: ['Nội dung chuyển khoản', 'text']
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
  // Chữ ký thật của Nhà của An (images/chu-ky-an.png) — chỉ chèn vào đúng dòng ký của Nhà của An, không chèn vào dòng ký của khách/bên thứ 3
  const sigImg = '<img src="images/chu-ky-an.png" alt="Chữ ký Nhà của An" style="height:46px;display:block;margin:2px auto" />';
  const sign2 = (l, r, nha) => `<div class="dp-sign"><div><b>${l}</b><br>${nha === 'l' ? sigImg : ''}<i>(Ký, ghi rõ họ tên)</i></div><div><b>${r}</b><br>${nha === 'r' ? sigImg : ''}<i>(Ký, ghi rõ họ tên)</i></div></div>`;
  const sign1 = (l, nha) => `<div class="dp-sign"><div></div><div><b>${l}</b><br>${nha ? sigImg : ''}<i>(Ký, ghi rõ họ tên)</i></div></div>`;
  const chk = (f) => {
    const a = String(f.ma_phieu || '').trim().toUpperCase(), m = String(f.ma || '').trim().toUpperCase();
    if (!a) return '<p>Đối chiếu mã booking: mã trên Phiếu xác nhận do khách xuất trình ' + dots('', 12) + ' ☐ trùng khớp ☐ không trùng khớp với mã trên hệ thống.</p>';
    return a === m ? '<p>Đối chiếu mã booking: mã trên Phiếu xác nhận do khách xuất trình là <b>' + esc2(a) + '</b>, <b>trùng khớp</b> với mã trên hệ thống.</p>' : '<p style="color:#b91c1c"><b>CẢNH BÁO: mã trên phiếu khách xuất trình (' + esc2(a) + ') KHÔNG trùng với mã đơn (' + esc2(m || '—') + '). Chưa được hoàn tiền, cần kiểm tra lại.</b></p>';
  };
  const booking = (f) => `đơn đặt phòng mã ${dots(f.ma, 10)}, hạng phòng ${dots(f.phong, 12)}, từ ngày ${dots(f.nhan, 10)} đến ngày ${dots(f.tra, 10)}`;
  const bank = (f) => `Chuyển khoản vào tài khoản số ${dots(f.stk, 16)} tại ngân hàng ${dots(f.nh, 14)}, chủ tài khoản ${dots(f.ctk, 18)}`;

  const TEMPLATES = [
    { id: 'phieu-xn', group: 'Khách đặt phòng', name: 'Phiếu xác nhận đặt phòng (gửi khách)', note: 'Khổ ngang A4. Gửi khách sau khi chốt booking; có mã QR khi đã nhập ngân hàng trong config.js.', land: true,
      fields: ['ma', 'b_ten', 'b_sdt', 'khach', 'phong', 'sophong', 'nhan', 'tra', 'tien', 'uudai', 'coc', 'conlai', 'nh_p', 'stk_p', 'ctk_p', 'qr_img', 'b_cccd', 'ghichu'],
      body: (f) => window.NCA_slip({ code: f.ma, name: f.b_ten, phone: f.b_sdt, guests: f.khach, room: f.phong, roomNo: f.sophong, checkin: f.nhan, checkout: f.tra, total: f.tien, promo: f.uudai, paid: f.coc === '' || f.coc === undefined ? undefined : f.coc, remainManual: f.conlai === '' || f.conlai === undefined ? undefined : f.conlai, bankName: f.nh_p, accountNo: f.stk_p, accountName: f.ctk_p, qrImage: f.qr_img, cccdLine: true, cccd: f.b_cccd, extra: f.ghichu, nowStep: 2, invalid: !!f.sai_ck, invalidReason: f.sai_ly || '' }) },
    { id: 'phieu-xn-dv', group: 'Khách đặt phòng', name: 'Phiếu xác nhận đặt phòng (đơn vị khác)', note: 'Giống phiếu xác nhận của Nhà của An, nhưng tên đơn vị và logo tự gõ/tải lên — dùng khi làm sale booking online cho đơn vị khác. Để trống tên/logo thì phiếu vẫn hiện đúng như Nhà của An.', land: true,
      fields: ['don_vi', 'logo_dv', 'dia_chi_dv', 'hotline_dv', 'ma', 'b_ten', 'b_sdt', 'khach', 'phong', 'sophong', 'nhan', 'tra', 'tien', 'uudai', 'coc', 'conlai', 'nh_p', 'stk_p', 'ctk_p', 'qr_img', 'b_cccd', 'ghichu'],
      body: (f) => window.NCA_slip({ code: f.ma, name: f.b_ten, phone: f.b_sdt, guests: f.khach, room: f.phong, roomNo: f.sophong, checkin: f.nhan, checkout: f.tra, total: f.tien, promo: f.uudai, paid: f.coc === '' || f.coc === undefined ? undefined : f.coc, remainManual: f.conlai === '' || f.conlai === undefined ? undefined : f.conlai, bankName: f.nh_p, accountNo: f.stk_p, accountName: f.ctk_p, qrImage: f.qr_img, cccdLine: true, cccd: f.b_cccd, extra: f.ghichu, nowStep: 2, orgName: f.don_vi || undefined, orgAddress: f.dia_chi_dv || undefined, orgPhone: f.hotline_dv || undefined, orgLogo: f.logo_dv || undefined }) },
    { id: 'phieu-xn-hoan', group: 'Hoàn trả', name: 'Phiếu xác nhận hoàn tiền', note: 'Nhà gửi khách sau khi đã chuyển khoản hoàn tiền, ghi mã giao dịch ngân hàng thật để khách tự đối chiếu với sao kê của mình. Không phải biên bản có chữ ký hai bên.',
      fields: ['ngay', 'diadiem', 'ma', 'b_ten', 'b_sdt', 'tien', 'nh', 'stk', 'ctk', 'ma_gd', 'noidung_ck', 'lydo'],
      body: (f) => `${head(f, 'PHIẾU XÁC NHẬN HOÀN TIỀN')}
        <p><i>${when(f)}.</i></p>
        <p>Nhà của An Homestay Tà Xùa xác nhận đã hoàn tiền cho đơn đặt phòng mã ${dots(f.ma, 10)} của Ông/Bà ${dots(f.b_ten, 22)}${f.b_sdt ? ', điện thoại ' + dots(f.b_sdt, 12) : ''}.</p>
        <p>Số tiền đã hoàn: <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 24)}).</p>
        <p>${bank(f)}.</p>
        <p>Mã giao dịch ngân hàng: <b>${dots(f.ma_gd, 20)}</b>${f.noidung_ck ? '; nội dung chuyển khoản: ' + dots(f.noidung_ck, 30) : ''}.</p>
        ${f.lydo ? `<p>Ghi chú: ${dots(f.lydo, 40)}.</p>` : ''}
        <p>Phiếu này để Quý khách tự đối chiếu với sao kê ngân hàng của mình; không thay thế Biên bản hoàn trả có chữ ký hai bên khi cần.</p>${sign1('ĐẠI DIỆN NHÀ CỦA AN', true)}` },

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
        <p>5. Biên bản được lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản.</p>${sign2('BÊN A (Bên nhận tiền đặt cọc)', 'BÊN B (Bên giao tiền đặt cọc)', 'l')}` },

    { id: 'bb-hoan-coc-gon', group: 'Hoàn trả', name: 'Biên bản hoàn trả tiền (bản gọn)', note: 'Một trang ngắn, dùng cho đơn nhỏ.',
      fields: ['ma_phieu', 'ngay', 'diadiem', 'a_ten', 'b_ten', 'b_sdt', 'ma', 'tien', 'lydo', 'hinhthuc'],
      body: (f) => `${head(f, 'BIÊN BẢN HOÀN TRẢ TIỀN')}
        <p><i>${when(f)}.</i></p>
        <p>Bên hoàn trả: <b>Nhà của An Homestay Tà Xùa</b>, đại diện ${dots(f.a_ten, 20)}.</p>
        <p>Bên nhận hoàn: Ông/Bà ${dots(f.b_ten, 22)}; điện thoại ${dots(f.b_sdt, 12)}.</p>
        <p>Nội dung: hoàn trả tiền đơn đặt phòng mã ${dots(f.ma, 10)}. Số tiền: <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 24)}). Lý do: ${dots(f.lydo, 30)}. Hình thức: ${dots(f.hinhthuc, 18)}.</p>
        ${chk(f)}<p>Bên nhận hoàn xác nhận đã nhận đủ tiền và không khiếu nại gì thêm.</p>${sign2('BÊN HOÀN TRẢ', 'BÊN NHẬN HOÀN', 'l')}` },

    { id: 'uq-nhan-hoan', group: 'Ủy quyền', name: 'Giấy ủy quyền nhận tiền hoàn trả', note: 'Khách ủy quyền cho người khác nhận tiền hoàn thay.',
      fields: ['ngay', 'diadiem', 'b_ten', 'b_ns', 'b_cccd', 'b_cap', 'b_noicap', 'b_dc', 'b_sdt', 'c_ten', 'c_cccd', 'c_dc', 'c_sdt', 'ma', 'tien', 'nh', 'stk', 'ctk', 'songay'],
      body: (f) => `${head(f, 'GIẤY ỦY QUYỀN NHẬN TIỀN CÓ THỜI HẠN')}
        <p><i>${when(f)}</i></p>
        <p><b>Bên ủy quyền:</b> Ông/Bà ${dots(f.b_ten, 22)}; sinh ngày ${dots(f.b_ns, 10)}; CCCD số ${dots(f.b_cccd, 16)}, cấp ngày ${dots(f.b_cap, 10)} tại ${dots(f.b_noicap, 18)}; địa chỉ ${dots(f.b_dc, 30)}; điện thoại ${dots(f.b_sdt, 12)}; là người đặt phòng (hoặc đại diện hợp pháp của người đặt phòng) theo mã đơn ${dots(f.ma, 10)}.</p>
        <p><b>Bên được ủy quyền (đơn vị hoặc cá nhân nhận thay):</b> ${dots(f.c_ten, 22)}; CCCD số ${dots(f.c_cccd, 16)}; địa chỉ ${dots(f.c_dc, 30)}; điện thoại ${dots(f.c_sdt, 12)}.</p>
        <p><b>Nội dung ủy quyền:</b> Bằng giấy này, tôi ủy quyền cho người có tên trên thay mặt tôi nhận lại số tiền <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 24)}) mà Nhà của An Homestay Tà Xùa hoàn trả cho đơn đặt phòng mã ${dots(f.ma, 10)}${f.stk ? '; ' + bank(f) : ''}, và ký xác nhận đã nhận tiền.</p>
        <p>Phạm vi: chỉ trong nội dung nêu trên. Thời hạn ủy quyền: có hiệu lực kể từ ngày ký và tự chấm dứt khi tiền hoàn trả về thành công tài khoản nhận nêu trên (dự kiến trong vòng ${dots(f.songay, 4)} ngày theo quy trình của ngân hàng). Ủy quyền không có thù lao.</p>
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

    { id: 'tb-khong-chinh-chu', group: 'Hoàn trả', name: 'Thông báo tạm giữ hoàn tiền (không khớp chính chủ)', note: 'Dùng khi người chuyển khoản gốc và người đề nghị nhận hoàn là hai người khác nhau — tạm giữ, chưa xử lý hoàn cho đến khi đối chiếu hoặc có ủy quyền hợp lệ.',
      fields: ['ngay', 'diadiem', 'b_ten', 'b_sdt', 'ma', 'tien', 'ck_ten', 'ck_ngan_hang', 'ck_stk', 'lydo'],
      body: (f) => `${head(f, 'THÔNG BÁO TẠM GIỮ HOÀN TIỀN (KHÔNG KHỚP CHÍNH CHỦ)')}
        <p><i>${when(f)}.</i></p>
        <p>Nhà của An Homestay Tà Xùa đã nhận được yêu cầu hoàn tiền cho đơn đặt phòng mã ${dots(f.ma, 10)}, số tiền <b>${money(f.tien)}</b>, do Ông/Bà ${dots(f.b_ten, 22)} (điện thoại ${dots(f.b_sdt, 12)}) đề nghị.</p>
        <p>Tuy nhiên, theo sao kê ngân hàng, giao dịch chuyển khoản tương ứng được thực hiện bởi <b>${dots(f.ck_ten, 22)}</b>${f.ck_ngan_hang ? ', ngân hàng ' + dots(f.ck_ngan_hang, 14) : ''}${f.ck_stk ? ', số tài khoản ' + dots(f.ck_stk, 16) : ''}, <b>không trùng khớp</b> với người đề nghị nhận hoàn nêu trên.</p>
        <p>Để đảm bảo tiền hoàn trả về đúng người, đúng tài khoản, Nhà của An <b>tạm thời chưa xử lý</b> yêu cầu hoàn tiền này. Đề nghị chọn một trong các cách sau để tiếp tục:</p>
        <p>1. Nếu Ông/Bà ${dots(f.b_ten, 22)} chính là người đã chuyển khoản (dùng tài khoản đứng tên khác), gửi nhà ảnh chụp tài khoản ngân hàng dùng để chuyển khoản để đối chiếu.</p>
        <p>2. Nếu nhờ người khác chuyển khoản hộ, đề nghị người đã chuyển khoản (Ông/Bà ${dots(f.ck_ten, 22)}) lập Giấy ủy quyền nhận tiền hoàn trả, ủy quyền cho Ông/Bà ${dots(f.b_ten, 22)} nhận thay (xem mẫu "Giấy ủy quyền nhận tiền hoàn trả").</p>
        <p>3. Hoặc nhà hoàn trả trực tiếp về đúng tài khoản đã chuyển khoản ban đầu, đứng tên Ông/Bà ${dots(f.ck_ten, 22)}.</p>
        ${f.lydo ? `<p>Ghi chú thêm: ${dots(f.lydo, 40)}.</p>` : ''}
        <p>Thông báo này lập để lưu hồ sơ và gửi khách tham khảo; không phải văn bản tư vấn pháp lý.</p>${sign1('ĐẠI DIỆN NHÀ CỦA AN', true)}` },

    { id: 'phieu-thu', group: 'Khách đặt phòng', name: 'Phiếu thu tiền đặt cọc / thanh toán', note: 'Xác nhận nhà đã nhận tiền của khách.',
      fields: ['ngay', 'diadiem', 'so', 'a_ten', 'b_ten', 'b_sdt', 'ma', 'phong', 'nhan', 'tra', 'tien', 'lydo', 'hinhthuc'],
      body: (f) => `${head(f, 'PHIẾU THU TIỀN')}
        <p><i>${when(f)}</i></p>
        <p>Đơn vị thu: <b>Nhà của An Homestay Tà Xùa</b>.</p>
        <p>Người nộp tiền: Ông/Bà ${dots(f.b_ten, 24)}; điện thoại ${dots(f.b_sdt, 12)}.</p>
        <p>Nội dung: ${f.lydo ? esc2(f.lydo) : 'Tiền đặt cọc / thanh toán'} cho ${booking(f)}.</p>
        <p>Số tiền: <b>${money(f.tien)}</b> (bằng chữ: ${dots(vnWords(f.tien), 28)}).</p>
        <p>Hình thức: ${dots(f.hinhthuc, 20)}.</p>${sign2('NGƯỜI NỘP TIỀN', 'NGƯỜI THU TIỀN', 'r')}
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
    f.sai_ck = false; f.sai_ly = '';
    if (b) {
      f.b_ten = b.fullname || ''; f.b_sdt = b.phone || ''; f.ma = b.booking_code || ''; f.phong = b.room || '';
      f.nhan = b.checkin || ''; f.tra = b.checkout || ''; f.tien = Number(b.total_price || 0) || ''; f.khach = b.guests || '';
      const okSt = typeof normStatus === 'function' ? normStatus(b.status) : ''; f.coc = (okSt === 'Đặt phòng thành công' || okSt === 'Hoàn thành') ? Number(b.total_price || 0) : 0;
      // Ưu đãi/số phòng/ghi chú/ngân hàng ghi đè đã lưu cho đơn này (nếu có) — nạp lại để mọi máy chọn đơn này đều thấy đúng thông tin lần cuối đã lưu
      f.sai_ck = (typeof normStatus === 'function' ? normStatus(b.status) : b.status) === 'Sai nội dung chuyển khoản'; f.sai_ly = f.sai_ck ? (b.admin_note || '') : '';
      f.sophong = b.slip_room_no || ''; f.uudai = b.slip_promo || ''; f.ghichu = b.slip_note || '';
      f.nh_p = b.slip_bank_name || ''; f.stk_p = b.slip_bank_account || ''; f.ctk_p = b.slip_bank_holder || '';
    }
  }
  function render() {
    $('fm-preview').innerHTML = state.tpl.body(state.f); $('fm-preview').classList.toggle('is-land', !!state.tpl.land); renderMsg(); renderSync();
    $('fm-note').textContent = state.tpl.note + ' Thông tin điền ở đây chỉ nằm trong trình duyệt, không lưu lại.';
  }
  function drawFields() {
    $('fm-fields').innerHTML = state.tpl.fields.map((k) => {
      const [label, type] = F[k];
      if (type === 'file') {
        const has = !!state.f[k];
        return `<label class="fm-f"><span>${esc2(label)}</span><input data-k="${k}" type="file" accept="image/*" /><small class="fm-file-st">${has ? 'Đã chọn ảnh ✓ — <a href="#" data-clear="' + k + '">xóa ảnh</a>' : 'Chưa chọn ảnh'}</small></label>`;
      }
      return `<label class="fm-f"><span>${esc2(label)}</span><input data-k="${k}" type="${type}" value="${esc2(state.f[k] ?? '')}" maxlength="120" autocomplete="off" /></label>`;
    }).join('');
    $('fm-fields').querySelectorAll('input[type]:not([type="file"])').forEach((i) => i.addEventListener('input', () => { state.f[i.dataset.k] = i.value.trim(); render(); }));
    $('fm-fields').querySelectorAll('input[type="file"]').forEach((i) => i.addEventListener('change', () => {
      const file = i.files && i.files[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => { state.f[i.dataset.k] = rd.result; drawFields(); render(); };
      rd.readAsDataURL(file);
    }));
    $('fm-fields').querySelectorAll('[data-clear]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); state.f[a.dataset.clear] = ''; drawFields(); render(); }));
  }

  /* ===== Xác nhận tạo đơn: lưu phiếu thành đơn thật trong hệ thống (khách mới mở được link phiếu) ===== */
  const fmtT = (iso) => { try { const d = new Date(iso); return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN'); } catch (e) { return ''; } };
  const findBooking = () => {
    const list = (typeof allBookings !== 'undefined' ? allBookings : []), code = String(state.f.ma || '').trim().toUpperCase();
    const id = $('fm-booking') && $('fm-booking').value;
    return list.find((x) => (id && x.id === id) || (code && x.booking_code === code));
  };
  const missing = () => {
    const f = state.f, m = [];
    if (!String(f.b_ten || '').trim()) m.push('họ tên khách');
    if (String(f.b_sdt || '').replace(/\D/g, '').length < 9) m.push('SĐT (từ 9 số)');
    if (!String(f.phong || '').trim()) m.push('hạng phòng');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.nhan || '')) m.push('ngày nhận phòng');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.tra || '')) m.push('ngày trả phòng');
    else if (/^\d{4}-\d{2}-\d{2}$/.test(f.nhan || '') && f.tra <= f.nhan) m.push('ngày trả phải sau ngày nhận');
    const t = Number(f.tien); if (!(t > 0 && t <= 100000000)) m.push('số tiền (1 đến 100.000.000 đ)');
    if (f.ma && !/^[A-Za-z0-9]{6,20}$/.test(f.ma)) m.push('mã đơn (6-20 chữ/số, không dấu)');
    return m;
  };
  const newCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint32Array(8); (window.crypto || window.msCrypto).getRandomValues(r); return 'NA' + [...r].map((n) => a[n % a.length]).join(''); };
  const payloadOf = () => { const f = state.f; return { fullname: String(f.b_ten || '').trim().slice(0, 80), phone: String(f.b_sdt || '').replace(/[^\d+]/g, '').slice(0, 20), room: String(f.phong || '').trim().slice(0, 120), checkin: f.nhan, checkout: f.tra, guests: String(f.khach || '').slice(0, 100) || null, total_price: Math.round(Number(f.tien)) }; };
  const diffOf = (b) => {
    const p = payloadOf(), L = { fullname: 'họ tên', phone: 'SĐT', room: 'hạng phòng', checkin: 'ngày nhận', checkout: 'ngày trả', guests: 'số khách', total_price: 'số tiền' };
    return Object.keys(L).filter((k) => String(p[k] ?? '') !== String(b[k] ?? '') && !(k === 'guests' && !p[k] && !b[k])).map((k) => L[k]);
  };
  window.updateBookingFromForm = async function (id) {
    const btn = $('fm-upd'), out = $('fm-sync-msg'); if (!btn || missing().length) return;
    btn.disabled = true; out.textContent = 'Đang cập nhật...';
    try {
      const b = (typeof allBookings !== 'undefined' ? allBookings : []).find((x) => x.id === id); if (!b) { out.textContent = 'Không thấy đơn, hãy tải lại trang.'; return; }
      const ses = await supabaseClient.auth.getSession(), who = (ses.data && ses.data.session && ses.data.session.user && ses.data.session.user.email) || 'quản trị';
      const tag = '[Sửa từ Biểu Mẫu bởi ' + who + ' lúc ' + fmtT(new Date().toISOString()) + ']';
      const keep = String(b.notes || '').slice(0, 500 - tag.length - 1);
      const patch = Object.assign(payloadOf(), { notes: (keep ? keep + ' ' : '') + tag });
      const r = await supabaseClient.from('bookings').update(patch).eq('id', id).select().single();
      if (r.error) { out.textContent = 'Không cập nhật được: ' + (r.error.message || 'lỗi'); btn.disabled = false; return; }
      Object.assign(b, r.data || patch);
      if (typeof loadBookings === 'function') loadBookings();
      render();
    } catch (e) { out.textContent = 'Có lỗi kết nối, hãy thử lại.'; btn.disabled = false; }
  };
  // Lưu riêng ưu đãi/số phòng/ghi chú/ngân hàng ghi đè vào đơn — tách khỏi "Cập nhật đơn" để không ảnh hưởng các trường cốt lõi (họ tên/SĐT/ngày/giá)
  window.toggleInvalid = async function (id) {
    const btn = $('fm-inv'), out = $('fm-inv-msg'); if (!btn) return;
    const on = !state.f.sai_ck;
    let reason = '';
    if (on) { const v = prompt('Lý do thêm cho khách thấy (có thể để trống):', ''); if (v === null) return; reason = v.trim(); }
    btn.disabled = true; out.textContent = 'Đang lưu...';
    try {
      const patch = on ? { status: 'Sai nội dung chuyển khoản', admin_note: reason || null } : { status: 'Chờ thanh toán', admin_note: null };
      const r = await supabaseClient.from('bookings').update(patch).eq('id', id).select().single();
      if (r.error) { out.textContent = 'Chưa lưu được: ' + (r.error.message || 'lỗi'); btn.disabled = false; return; }
      const b = (typeof allBookings !== 'undefined' ? allBookings : []).find((x) => x.id === id); if (b) Object.assign(b, r.data || patch);
      state.f.sai_ck = on; state.f.sai_ly = on ? reason : '';
      render();
      const o2 = $('fm-inv-msg'); if (o2) o2.textContent = on ? 'Đã lưu ✓ — phiếu chuyển cam trên mọi máy và trên link phiếu của khách.' : 'Đã khôi phục ✓ — đơn về "Chờ thanh toán", phiếu xanh lại trên mọi máy.';
      if (typeof loadBookings === 'function') loadBookings();
    } catch (e) { out.textContent = 'Có lỗi kết nối, thử lại.'; btn.disabled = false; }
  };
  window.saveSlipFields = async function (id) {
    const btn = $('fm-slip-save'), out = $('fm-slip-msg'); if (!btn) return;
    btn.disabled = true; out.textContent = 'Đang lưu...';
    try {
      const f = state.f;
      const patch = { slip_room_no: f.sophong || null, slip_promo: f.uudai || null, slip_note: f.ghichu || null, slip_bank_name: f.nh_p || null, slip_bank_account: f.stk_p || null, slip_bank_holder: f.ctk_p || null };
      const r = await supabaseClient.from('bookings').update(patch).eq('id', id).select().single();
      if (r.error) { out.textContent = 'Chưa lưu được (có thể CSDL chưa chạy bước cập nhật cho tính năng này): ' + (r.error.message || 'lỗi'); btn.disabled = false; return; }
      const b = (typeof allBookings !== 'undefined' ? allBookings : []).find((x) => x.id === id); if (b) Object.assign(b, r.data || patch);
      out.textContent = 'Đã lưu ✓ — máy khác chọn lại đơn này sẽ thấy đúng thông tin vừa lưu, khách tra cứu phiếu cũng thấy đúng như vậy.';
      btn.disabled = false;
    } catch (e) { out.textContent = 'Có lỗi kết nối, thử lại.'; btn.disabled = false; }
  };
  function renderSync() {
    const box = $('fm-sync'); if (!box) return;
    if (!state.tpl.fields.includes('phong')) { box.innerHTML = ''; return; }
    const b = findBooking(), base2 = location.origin + location.pathname.replace(/[^/]*$/, '');
    if (b) {
      const via = /^\[Tạo từ Biểu Mẫu/.test(b.notes || '') ? ' ' + esc2(String(b.notes).split(']')[0].replace('[', '')) + '.' : '';
      const diff = diffOf(b), miss2 = missing();
      const slipBox = state.tpl.id === 'phieu-xn' ? '<div class="fm-sync-row"><button class="btn-export" id="fm-slip-save" onclick="saveSlipFields(\'' + esc2(b.id) + '\')">💾 Lưu ưu đãi/số phòng/ghi chú/ngân hàng cho đơn này (đồng bộ mọi máy + hiện đúng trên phiếu khách)</button></div><div id="fm-slip-msg"></div>' : '';
      const invBtn = state.tpl.id === 'phieu-xn' ? '<div class="fm-sync-row"><button class="btn-export" id="fm-inv" style="background:' + (state.f.sai_ck ? '#0b3b46' : '#ea580c') + ';color:#fff" onclick="toggleInvalid(\'' + esc2(b.id) + '\')">' + (state.f.sai_ck ? '↩️ Khôi phục phiếu xanh (đã đối chiếu xong)' : '⚠️ Sai nội dung CK → chuyển phiếu sang cam (Chờ tra soát)') + '</button></div><div id="fm-inv-msg"></div>' : '';
      box.innerHTML = '<div class="fm-sync ok"><b>✅ Đã đồng bộ</b>: đơn <b>' + esc2(b.booking_code) + '</b> có trong hệ thống (tạo lúc ' + esc2(fmtT(b.created_at)) + ', trạng thái: ' + esc2(typeof normStatus === 'function' ? normStatus(b.status) : b.status) + ').' + via + ' Khách mở được link phiếu: <a href="' + esc2(base2 + 'phieu.html?ma=' + b.booking_code) + '" target="_blank" rel="noopener">xem thử phiếu của khách</a>.' + invBtn + slipBox + '</div>'
        + (diff.length ? '<div class="fm-sync warn"><b>⚠️ Phiếu đang khác hệ thống</b>: ' + esc2(diff.join(', ')) + '. Khách sẽ chỉ thấy dữ liệu trong hệ thống cho đến khi bạn cập nhật.<div class="fm-sync-row"><button class="btn-export" id="fm-upd"' + (miss2.length ? ' disabled' : '') + ' onclick="updateBookingFromForm(\'' + esc2(b.id) + '\')">Cập nhật đơn theo phiếu này</button></div>' + (miss2.length ? '<small>Còn thiếu: ' + esc2(miss2.join(', ')) + '.</small>' : '') + '<div id="fm-sync-msg"></div></div>' : '');
      return;
    }
    const miss = missing();
    box.innerHTML = '<div class="fm-sync warn"><b>⚪ Chưa đồng bộ</b>: phiếu này mới chỉ ở trên màn hình, <u>khách chưa mở được link</u> cho đến khi bạn xác nhận tạo đơn.'
      + '<div class="fm-sync-row"><select id="fm-st"><option value="Đặt phòng thành công">Đã chốt, đã nhận tiền (Đặt phòng thành công)</option><option value="Chờ thanh toán">Chưa nhận tiền (Chờ thanh toán)</option></select>'
      + '<button class="btn-export" id="fm-create"' + (miss.length ? ' disabled' : '') + ' onclick="createBookingFromForm()">Xác nhận tạo đơn</button></div>'
      + (miss.length ? '<small>Còn thiếu: ' + esc2(miss.join(', ')) + '.</small>' : '<small>Bấm xác nhận để lưu đơn vào hệ thống. Mã đơn trống thì tự tạo.</small>') + '<div id="fm-sync-msg"></div></div>';
  }
  window.createBookingFromForm = async function () {
    const f = state.f, btn = $('fm-create'), out = $('fm-sync-msg'); if (!btn) return;
    if (missing().length) return;
    btn.disabled = true; out.textContent = 'Đang lưu...';
    try {
      if (!f.ma) { f.ma = newCode(); drawFields(); }
      const code = String(f.ma).toUpperCase(); f.ma = code;
      const ex = await supabaseClient.from('bookings').select('id').eq('booking_code', code).maybeSingle();
      if (ex.data) { out.textContent = 'Mã ' + code + ' đã có trong hệ thống. Hãy chọn đơn đó ở ô "Chọn đơn" hoặc đổi mã.'; btn.disabled = false; return; }
      const ses = await supabaseClient.auth.getSession(), who = (ses.data && ses.data.session && ses.data.session.user && ses.data.session.user.email) || 'quản trị';
      const status = $('fm-st').value, now = new Date().toISOString();
      const row = { booking_code: code, transfer_code: code, fullname: String(f.b_ten).trim().slice(0, 80), phone: String(f.b_sdt).replace(/[^\d+]/g, '').slice(0, 20), room: String(f.phong).trim().slice(0, 120), checkin: f.nhan, checkout: f.tra, guests: String(f.khach || '').slice(0, 100) || null, total_price: Math.round(Number(f.tien)), status, confirmed_at: status === 'Đặt phòng thành công' ? now : null, notes: ('[Tạo từ Biểu Mẫu bởi ' + who + ' lúc ' + fmtT(now) + ']').slice(0, 500) };
      const r = await supabaseClient.from('bookings').insert(row).select().single();
      if (r.error) { out.textContent = 'Không lưu được: ' + (r.error.message || 'lỗi'); btn.disabled = false; return; }
      if (typeof allBookings !== 'undefined') allBookings.unshift(r.data);
      if (typeof loadBookings === 'function') loadBookings();
      const bk = $('fm-booking'); if (bk) { bk.innerHTML = '<option value="">Không chọn đơn (điền tay)</option>' + allBookings.map((b) => '<option value="' + esc2(b.id) + '">' + esc2(b.booking_code) + ' - ' + esc2(b.fullname) + '</option>').join(''); bk.value = r.data.id; }
      render();
    } catch (e) { out.textContent = 'Có lỗi kết nối, hãy thử lại.'; btn.disabled = false; }
  };
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
    const link = base() + 'phieu.html?ma=' + encodeURIComponent(String(f.ma || '').toUpperCase());
    const code = f.ma ? f.ma : '(mã đơn)';
    const M = {
      xn: `Chào ${f.b_ten || 'bạn'}, Nhà của An xác nhận đơn đặt phòng mã ${code} (${f.phong || 'phòng'}, ${dmy(f.nhan) || '...'} → ${dmy(f.tra) || '...'}).\nBạn mở Phiếu xác nhận (xem, in hoặc lưu PDF, không cần đăng nhập) tại: ${link}\nNgày đến, người đặt phòng chỉ cần mang CCCD hoặc VNeID; khách đi cùng bạn gửi nhà họ tên và số CCCD để nhà khai báo lưu trú nhé. Cần hỏi đường đi hoặc đổi lịch, bạn nhắn nhà kèm mã ${code}.`,
      hoan: `Chào ${f.b_ten || 'bạn'}, Nhà của An đã ghi nhận yêu cầu hoàn tiền đơn ${code}${f.tien ? ' (' + new Intl.NumberFormat('vi-VN').format(Number(f.tien)) + ' đ)' : ''}.\nNhà sẽ chuyển về đúng tài khoản bạn cung cấp và gửi Biên bản hoàn trả để hai bên lưu. Bạn xem đơn tại: ${link}`,
      nhac: `Chào ${f.b_ten || 'bạn'}, nhắc lịch nhận phòng ${dmy(f.nhan) || '...'} tại Nhà của An (đơn ${code}). Nhận phòng từ ${(window.SITE && window.SITE.checkin) || '14:00'}. Người đặt phòng mang CCCD hoặc VNeID (khách đi cùng gửi nhà họ tên và số CCCD trước); đường đi và gửi xe nhà sẽ hướng dẫn khi bạn nhắn. Xem đơn: ${link}`,
      sai_nd: `Chào ${f.b_ten || 'Anh/Chị'}, Nhà của An đã nhận được một giao dịch chuyển khoản, nhưng nội dung chuyển khoản bị sai/thiếu mã đơn ${code}, nên nhà chưa đối chiếu được giao dịch này với đơn của mình ạ.\nAnh/Chị vui lòng gửi giúp em ảnh chụp bill chuyển khoản thành công (thấy rõ ngày giờ, số tiền, nội dung) tại đây để em kiểm tra lại sao kê ngân hàng và xác nhận phòng cho mình sớm nhất nhé ạ! Xem phiếu: ${link}`,
      qc: `☁️ MÂY ĐANG VỀ TÀ XÙA — đừng lướt qua nếu bạn đang tìm chỗ "trốn" cuối tuần này.\n\n🏡 Nhà của An Homestay — phòng gỗ, cửa sổ nhìn thẳng ra biển mây, mở mắt ra là thấy mây trôi ngang thung lũng.\n☕ Có cà phê, trà chiều ngồi ngắm mây tan dần theo nắng.\n🥾 Gần các điểm săn mây đẹp nhất Tà Xùa, đi bộ vài phút là tới.\n\n📩 Phòng mùa săn mây hết nhanh, inbox để nhà báo giá và tư vấn lịch trình phù hợp cho bạn nhé.`
    };
    box.innerHTML = [['xn', 'Tin xác nhận đặt phòng'], ['hoan', 'Tin báo hoàn tiền'], ['nhac', 'Tin nhắc lịch nhận phòng'], ['sai_nd', 'Tin báo sai nội dung chuyển khoản (chưa nhận dạng được đơn)'], ['qc', 'Tin đăng Facebook/TikTok (săn mây)']].map(([k, l]) => `<div class="fm-msg"><b>${l}</b><textarea readonly rows="6" id="fm-m-${k}">${esc2(M[k]).replace(/\\n/g, '&#10;')}</textarea><button class="btn-export" data-copy="fm-m-${k}">Sao chép</button></div>`).join('');
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
  // Xuất mẫu đang xem thành 1 file ảnh PNG (để gửi Messenger/Zalo nhanh, không cần mở file PDF)
  window.exportFormImage = async function () {
    if (!window.html2canvas) { alert('Chưa tải được công cụ xuất ảnh, thử tải lại trang.'); return; }
    const el = $('fm-preview');
    if (!el || !el.innerHTML.trim()) { alert('Chưa có nội dung để xuất ảnh.'); return; }
    try {
      const canvas = await window.html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const a = document.createElement('a');
      const ma = (state.f && state.f.ma ? String(state.f.ma).trim() : '') || new Date().toISOString().slice(0, 10);
      a.download = `nha-cua-an-${ma}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch (e) { alert('Không xuất được ảnh: ' + (e && e.message ? e.message : e)); }
  };
})();
