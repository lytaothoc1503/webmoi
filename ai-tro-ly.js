/* Trợ Lý AI trong admin: gom số liệu CÓ SẴN rồi sao chép "lời nhờ" để dán vào Gemini / Claude / ChatGPT / Sider.
   Không dùng khóa API, không gọi AI từ web. Không đưa STK, ngân hàng, CCCD; SĐT chỉ giữ 3 số cuối. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const money = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';
  const mask = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 3 ? '***' + d.slice(-3) : ''; };
  const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n || 200);
  const ymd = (d) => { const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };
  const dmy = (v) => (/^\d{4}-\d{2}-\d{2}/.test(v || '') ? String(v).slice(0, 10).split('-').reverse().join('/') : String(v || ''));
  const bks = () => (typeof allBookings !== 'undefined' ? allBookings : []);
  const rfs = () => (typeof refundsData !== 'undefined' ? refundsData : []);
  const ents = () => (typeof entriesData !== 'undefined' ? entriesData : []);
  const st = (b) => normStatus(b.status);
  const line = (b) => `- ${b.booking_code || '?'} | ${clip(b.fullname, 40)} (SĐT ${mask(b.phone)}) | ${clip(b.room, 40)} | ${dmy(b.checkin)} → ${dmy(b.checkout)} | ${clip(b.guests, 20)} | giá ${money(b.total_price)}${b.received_amount != null ? ' | đã thu ' + money(b.received_amount) : ''} | ${st(b)}`;
  const HEAD = 'Bạn là trợ lý của chủ homestay "Nhà của An" (Tà Xùa, Sơn La). Trả lời bằng tiếng Việt có dấu, ngắn gọn, thực tế. Chỉ dựa vào số liệu bên dưới, KHÔNG bịa thêm.\n\n';
  let reviews = null;

  function setOut(text) {
    $('ai-out').value = text;
    copy(true);
  }
  async function copy(auto) {
    const m = $('ai-msg'), t = $('ai-out').value;
    if (!t) { m.textContent = 'Chưa có gì để sao chép.'; return; }
    try { await navigator.clipboard.writeText(t); m.textContent = (auto ? 'Đã soạn và sao chép. ' : 'Đã sao chép. ') + 'Mở AI, dán và gửi.'; }
    catch (e) { $('ai-out').select(); m.textContent = 'Không tự sao chép được: hãy bấm giữ, chọn hết và chép.'; }
  }

  const TASKS = {
    today() {
      const now = new Date(), today = ymd(now), tm = ymd(new Date(now.getTime() + 864e5)), list = bks();
      const g = (f) => list.filter(f), pend = rfs().filter((r) => r.status === 'Chờ xử lý');
      const sec = (title, arr) => '## ' + title + ' (' + arr.length + ')\n' + (arr.length ? arr.map(line).join('\n') : '(không có)') + '\n';
      return HEAD + 'Hôm nay là ' + dmy(today) + '. Hãy lập DANH SÁCH VIỆC CẦN LÀM hôm nay theo thứ tự ưu tiên (việc nào gấp nhất lên đầu), mỗi việc một dòng kèm mã đơn.\n\n'
        + sec('Chờ khách chuyển khoản', g((b) => st(b) === ST.WAIT))
        + sec('Khách báo đã chuyển, chờ tôi xác nhận tiền', g((b) => st(b) === ST.PAID))
        + sec('Khách nhận phòng hôm nay', g((b) => [ST.OK, ST.DONE].includes(st(b)) && String(b.checkin).slice(0, 10) === today))
        + sec('Khách nhận phòng ngày mai', g((b) => [ST.OK, ST.DONE].includes(st(b)) && String(b.checkin).slice(0, 10) === tm))
        + sec('Khách trả phòng hôm nay', g((b) => [ST.OK, ST.DONE].includes(st(b)) && String(b.checkout).slice(0, 10) === today))
        + '## Hoàn trả đang chờ xử lý (' + pend.length + ')\n' + (pend.length ? pend.map((r) => `- ${r.booking_code} | ${money(r.amount)} | bước ${r.step || 1}/5`).join('\n') : '(không có)');
    },
    msg() {
      const b = bks().find((x) => x.id === $('ai-bk').value); if (!b) return null;
      const kind = $('ai-kind').value;
      return HEAD + 'Hãy soạn MỘT tin nhắn Messenger/Zalo gửi khách để ' + kind + '. Giọng thân thiện, lịch sự, tối đa 6 câu, không dùng biểu tượng cảm xúc quá nhiều, không hứa điều không có trong số liệu.\n'
        + 'Giờ nhận phòng ' + (SITE_HOURS.checkin) + ', trả phòng ' + (SITE_HOURS.checkout) + '.\n\nThông tin đơn:\n' + line(b) + (b.notes ? '\nGhi chú của khách: ' + clip(b.notes, 200) : '');
    },
    audit() {
      const list = bks(), now = Date.now(), out = [];
      list.forEach((b) => {
        const s = st(b), age = (now - new Date(b.created_at || now).getTime()) / 864e5;
        if (s === ST.WAIT && age > 2) out.push(line(b) + ' → chờ chuyển khoản đã ' + Math.floor(age) + ' ngày');
        if (b.received_amount != null && Number(b.received_amount) !== Number(b.total_price) && s !== ST.CANCEL) out.push(line(b) + ' → số thực nhận khác giá đơn');
        if ([ST.OK, ST.DONE].includes(s) && !b.confirmed_at) out.push(line(b) + ' → đã thành công nhưng chưa có thời điểm xác nhận tiền');
        if (s === ST.PAID && age > 1) out.push(line(b) + ' → khách báo đã chuyển nhưng chưa xác nhận sau ' + Math.floor(age) + ' ngày');
      });
      rfs().forEach((r) => {
        const b = list.find((x) => x.booking_code === r.booking_code);
        if (r.status === 'Chờ xử lý') out.push(`- Hoàn trả ${r.booking_code}: ${money(r.amount)}, bước ${r.step || 1}/5, tạo ${dmy(r.created_at)} → còn treo`);
        if (b && Number(r.amount) > (typeof paidOf === 'function' ? paidOf(b) : Number(b.total_price))) out.push(`- Hoàn trả ${r.booking_code}: ${money(r.amount)} vượt số đã thu`);
      });
      return HEAD + 'Đây là các điểm bất thường máy đã lọc sẵn trong phần đối soát/hoàn trả. Hãy sắp xếp theo mức nghiêm trọng, nói ngắn mỗi điểm nên kiểm tra gì và làm gì tiếp theo.\n\n' + (out.length ? out.join('\n') : '(Máy không thấy điểm bất thường nào. Hãy nói ngắn gọn tôi nên kiểm tra định kỳ những gì.)');
    },
    month() {
      const mo = $('ai-month').value || ymd(new Date()).slice(0, 7), inM = (d) => String(d || '').slice(0, 7) === mo, list = bks();
      const ok = list.filter((b) => [ST.OK, ST.DONE].includes(st(b)) && inM(b.checkin));
      const rev = ok.reduce((a, b) => a + (typeof paidOf === 'function' ? paidOf(b) : Number(b.total_price)), 0);
      const nights = ok.reduce((a, b) => { const n = Math.round((new Date(b.checkout) - new Date(b.checkin)) / 864e5); return a + (n > 0 ? n : 0); }, 0);
      const cancel = list.filter((b) => st(b) === ST.CANCEL && inM(b.checkin)).length;
      const refunded = rfs().filter((r) => r.status === 'Đã hoàn' && inM(r.created_at)).reduce((a, r) => a + Number(r.amount), 0);
      const thu = ents().filter((x) => x.kind === 'thu' && inM(x.entry_date)), chi = ents().filter((x) => x.kind === 'chi' && inM(x.entry_date));
      const sum = (a) => a.reduce((s, x) => s + Number(x.amount), 0);
      const byCat = (a) => { const m = {}; a.forEach((x) => { m[x.category || 'Khác'] = (m[x.category || 'Khác'] || 0) + Number(x.amount); }); return Object.entries(m).map(([k, v]) => `  + ${k}: ${money(v)}`).join('\n') || '  (không có)'; };
      return HEAD + 'Hãy viết BÁO CÁO NGẮN tháng ' + mo.split('-').reverse().join('/') + ' (tối đa 12 dòng) rồi đưa 3 gợi ý cụ thể để tháng sau tốt hơn.\n\nSố liệu:\n'
        + `- Đơn thành công (theo ngày nhận phòng): ${ok.length}; tổng số đêm: ${nights}; tiền đã thu từ đơn: ${money(rev)}\n- Đơn hủy: ${cancel}\n- Đã hoàn trả khách: ${money(refunded)}\n`
        + `- Thu khác (sổ thu chi): ${money(sum(thu))}\n${byCat(thu)}\n- Chi (sổ thu chi): ${money(sum(chi))}\n${byCat(chi)}\n- Chênh lệch ước tính (thu từ đơn + thu khác - chi - hoàn): ${money(rev + sum(thu) - sum(chi) - refunded)}`;
    },
    review() {
      const r = (reviews || []).find((x) => String(x.id) === $('ai-rv').value); if (!r) return null;
      return HEAD + 'Hãy soạn lời phản hồi của chủ nhà cho đánh giá sau: cảm ơn chân thành, nhắc đúng chi tiết khách khen, nếu có điểm chưa hài lòng thì xin lỗi và nói cách nhà cải thiện (không hứa quá), tối đa 5 câu, mời khách quay lại.\n\n'
        + `Đánh giá ${r.rating || 5}/5 của ${clip(r.author_name, 40)}:\n"${clip(r.content, 800)}"`;
    },
    refund() {
      const r = rfs().find((x) => String(x.id) === $('ai-rf').value); if (!r) return null;
      const step = Number(r.step || 1), names = ['Đã tiếp nhận', 'Đang đối chiếu', 'Đã duyệt - chuẩn bị chuyển', 'Đã chuyển khoản', 'Hoàn tất'], b = bks().find((x) => x.booking_code === r.booking_code);
      return HEAD + 'Hãy soạn MỘT tin nhắn ngắn, lịch sự gửi khách để báo tiến độ hoàn tiền cọc, nói rõ nhà đang làm gì và khách cần làm gì (nếu có), không nhắc số tài khoản.\n\n'
        + `Khách: ${b ? clip(b.fullname, 40) : '(không rõ)'} | Mã đơn ${r.booking_code} | Số tiền hoàn ${money(r.amount)} | Trạng thái: ${r.status} | Tiến độ: bước ${step}/5 - ${names[step - 1] || ''}${r.reason ? ' | Lý do: ' + clip(r.reason, 160) : ''}`;
    },
  };
  const SITE_HOURS = { get checkin() { return (window.SITE && SITE.checkin) || '14:00'; }, get checkout() { return (window.SITE && SITE.checkout) || '12:00'; } };

  window.aiTask = function (k) {
    const t = TASKS[k] && TASKS[k]();
    if (!t) { $('ai-msg').textContent = 'Hãy chọn một mục trong danh sách trước.'; return; }
    setOut(t);
  };
  window.aiCopy = () => copy(false);
  window.aiOpen = function (url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
    const sel = $('ai-open'); if (sel) sel.value = '';
  };
  window.aiInit = async function () {
    const bl = bks().slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 60);
    $('ai-bk').innerHTML = bl.length ? bl.map((b) => `<option value="${esc(b.id)}">${esc((b.booking_code || '?') + ' - ' + clip(b.fullname, 24) + ' - ' + st(b))}</option>`).join('') : '<option value="">Chưa có đơn</option>';
    if (!$('ai-month').value) $('ai-month').value = ymd(new Date()).slice(0, 7);
    if (window.supabaseClient) {
      try {
        if (!rfs().length) { const r = await supabaseClient.from('refunds').select('*').order('created_at', { ascending: false }); if (!r.error) refundsData = r.data || []; }
        if (!ents().length) { const e = await supabaseClient.from('finance_entries').select('*').order('entry_date', { ascending: false }); if (!e.error) entriesData = e.data || []; }
      } catch (e) { /* bảng tài chính chưa có thì bỏ qua */ }
    }
    const rl = rfs();
    $('ai-rf').innerHTML = rl.length ? rl.map((r) => `<option value="${esc(r.id)}">${esc(r.booking_code + ' - ' + money(r.amount) + ' - ' + r.status)}</option>`).join('') : '<option value="">Chưa có yêu cầu hoàn </option>';
    if (reviews === null && window.supabaseClient) {
      try {
        const { data } = await supabaseClient.from('reviews').select('id,author_name,rating,content').order('created_at', { ascending: false }).limit(40);
        reviews = data || [];
      } catch (e) { reviews = []; }
    }
    $('ai-rv').innerHTML = (reviews || []).length ? reviews.map((r) => `<option value="${esc(r.id)}">${esc(clip(r.author_name, 20) + ' - ' + (r.rating || 5) + '★ - ' + clip(r.content, 30))}</option>`).join('') : '<option value="">Chưa có đánh giá</option>';
  };
})();
