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
      const mo = (($('ai-month') || {}).value) || ymd(new Date()).slice(0, 7), inM = (d) => String(d || '').slice(0, 7) === mo, list = bks();
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
  async function ensureFinance() {
    if (!window.supabaseClient) return;
    try {
      if (!rfs().length) { const r = await supabaseClient.from('refunds').select('*').order('created_at', { ascending: false }); if (!r.error) refundsData = r.data || []; }
      if (!ents().length) { const e = await supabaseClient.from('finance_entries').select('*').order('entry_date', { ascending: false }); if (!e.error) entriesData = e.data || []; }
    } catch (e) { /* bảng tài chính chưa có thì bỏ qua */ }
  }

  window.aiInit = async function () {
    const bl = bks().slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 60);
    $('ai-bk').innerHTML = bl.length ? bl.map((b) => `<option value="${esc(b.id)}">${esc((b.booking_code || '?') + ' - ' + clip(b.fullname, 24) + ' - ' + st(b))}</option>`).join('') : '<option value="">Chưa có đơn</option>';
    if (!$('ai-month').value) $('ai-month').value = ymd(new Date()).slice(0, 7);
    await ensureFinance();
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
  /* ===== Tiện ích AI nổi (góc phải), dùng ở mọi mục admin, gợi ý theo mục Tài chính ===== */
  const WID_CSS = `
  #aiw{position:fixed;right:14px;bottom:18px;z-index:900;display:flex;flex-direction:column;align-items:flex-end;gap:10px;font-family:'Montserrat',sans-serif}
  #aiw *{box-sizing:border-box;font-family:inherit}
  #aiw-fab{width:54px;height:54px;border-radius:50%;border:0;background:#fff;box-shadow:0 4px 16px rgba(11,59,70,.22);font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative}
  #aiw-fab:hover{box-shadow:0 6px 20px rgba(11,59,70,.32)}
  #aiw-fab .dot{position:absolute;top:9px;right:9px;width:10px;height:10px;border-radius:50%;background:#e8890c;border:2px solid #fff}
  #aiw-panel{display:none;width:min(340px,calc(100vw - 28px));max-height:min(520px,calc(100vh - 100px));overflow:auto;background:#fff;border:1px solid #cfe3e3;border-radius:16px;box-shadow:0 10px 32px rgba(11,59,70,.25);padding:12px}
  #aiw.open #aiw-panel{display:block}
  #aiw-panel h4{margin:0 0 2px;font-size:14px;color:#0b3b46;display:flex;justify-content:space-between;align-items:center}
  #aiw-panel h4 button{border:0;background:none;font-size:18px;cursor:pointer;color:#7a6e65}
  #aiw-panel .sub{font-size:11.5px;color:#5f6f73;margin-bottom:8px;line-height:1.45}
  #aiw-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
  #aiw-chips button{border:1px solid #cfe3e3;background:#f4fafa;border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:600;color:#0b3b46;cursor:pointer}
  #aiw-chips button:hover{background:#e3f2f2}
  #aiw-q{width:100%;border:1px solid #cfd8dc;border-radius:10px;padding:8px;font-size:13px;resize:vertical;min-height:54px}
  #aiw-row{display:flex;gap:6px;margin-top:6px}
  #aiw-row button,#aiw-row select{flex:1;border:0;border-radius:10px;padding:8px;font-size:12.5px;font-weight:700;cursor:pointer}
  #aiw-go{background:#e8890c;color:#fff}
  #aiw-row select{background:#eef4f5;color:#0b3b46;border:1px solid #cfe3e3;font-weight:600}
  #aiw-msg{font-size:12px;color:#0b6b4a;margin-top:6px;min-height:16px}
  @media print{#aiw{display:none}}`;

  const CHIPS = [
    ['audit', '🔎 Soát đối soát'],
    ['refpend', '↩️ Hoàn trả đang treo'],
    ['month', '📊 Báo cáo tháng này'],
    ['cash', '💰 Tiền thu / chi'],
    ['today', '📋 Việc hôm nay'],
  ];
  const WID_TASKS = {
    refpend() {
      const p = rfs().filter((r) => r.status === 'Chờ xử lý');
      return HEAD + 'Đây là các yêu cầu hoàn trả đang chờ. Hãy sắp xếp việc nào làm trước, nói ngắn mỗi yêu cầu cần làm gì tiếp (đối chiếu, duyệt, chuyển khoản, báo khách).\n\n'
        + (p.length ? p.map((r) => { const b = bks().find((x) => x.booking_code === r.booking_code); return `- ${r.booking_code} | ${b ? clip(b.fullname, 30) : '?'} | hoàn ${money(r.amount)} | bước ${r.step || 1}/5 | tạo ${dmy(r.created_at)}`; }).join('\n') : '(Không có yêu cầu nào đang chờ.)');
    },
    cash() {
      const mo = ymd(new Date()).slice(0, 7), inM = (d) => String(d || '').slice(0, 7) === mo, e = ents().filter((x) => inM(x.entry_date));
      return HEAD + 'Đây là sổ thu chi tháng ' + mo.split('-').reverse().join('/') + '. Hãy tổng kết ngắn, chỉ ra khoản chi lớn/bất thường và gợi ý cắt giảm hợp lý.\n\n'
        + (e.length ? e.map((x) => `- ${dmy(x.entry_date)} | ${x.kind === 'thu' ? 'THU' : 'CHI'} | ${clip(x.category, 30)} | ${money(x.amount)} | ${clip(x.note || x.description, 60)}`).join('\n') : '(Chưa có khoản nào trong tháng.)');
    },
  };
  function snapshot() {
    const list = bks(), ok = list.filter((b) => [ST.OK, ST.DONE].includes(st(b)));
    const mo = ymd(new Date()).slice(0, 7), inM = (d) => String(d || '').slice(0, 7) === mo, sum = (a) => a.reduce((s, x) => s + Number(x.amount || 0), 0);
    const rev = ok.filter((b) => inM(b.checkin)).reduce((a, b) => a + (typeof paidOf === 'function' ? paidOf(b) : Number(b.total_price)), 0);
    return `Tóm tắt tháng ${mo.split('-').reverse().join('/')}: đơn thành công ${ok.filter((b) => inM(b.checkin)).length}, đã thu từ đơn ${money(rev)}, thu khác ${money(sum(ents().filter((x) => x.kind === 'thu' && inM(x.entry_date))))}, chi ${money(sum(ents().filter((x) => x.kind === 'chi' && inM(x.entry_date))))}, hoàn trả đang chờ ${rfs().filter((r) => r.status === 'Chờ xử lý').length}.`;
  }
  async function wCopy(text) {
    const m = $('aiw-msg');
    try { await navigator.clipboard.writeText(text); m.textContent = 'Đã sao chép. Chọn AI rồi dán và gửi.'; }
    catch (e) { const q = $('aiw-q'); q.value = text; q.select(); m.textContent = 'Không tự chép được: bấm giữ, chọn hết và chép.'; }
  }
  async function wRun(k) {
    $('aiw-msg').textContent = 'Đang gom số liệu...';
    await ensureFinance();
    const f = WID_TASKS[k] || TASKS[k];
    const t = f && f();
    if (t) wCopy(t);
  }
  function wAsk() {
    const q = $('aiw-q').value.trim();
    if (!q) { $('aiw-msg').textContent = 'Hãy gõ câu hỏi trước.'; return; }
    ensureFinance().then(() => wCopy(HEAD + snapshot() + '\n\nCâu hỏi của tôi: ' + q));
  }
  function mountWidget() {
    if ($('aiw')) return;
    const st0 = document.createElement('style'); st0.textContent = WID_CSS; document.head.appendChild(st0);
    const w = document.createElement('div'); w.id = 'aiw';
    w.innerHTML = `<div id="aiw-panel" role="dialog" aria-label="Trợ lý AI tài chính">
      <h4>🤖 Trợ lý AI · Tài chính <button type="button" id="aiw-x" aria-label="Đóng">×</button></h4>
      <div class="sub">Bấm một việc: web gom số liệu có sẵn và sao chép lời nhờ. Không gửi STK/CCCD, SĐT chỉ 3 số cuối.</div>
      <div id="aiw-chips"></div>
      <textarea id="aiw-q" placeholder="Hoặc hỏi tự do về tài chính (vd: tháng này lãi hay lỗ?)"></textarea>
      <div id="aiw-row"><button type="button" id="aiw-go">Soạn lời nhờ</button>
        <select id="aiw-open"><option value="">Mở AI...</option><option value="https://gemini.google.com/app">Gemini</option><option value="https://claude.ai/new">Claude</option><option value="https://chatgpt.com/">ChatGPT</option><option value="https://copilot.microsoft.com/">Copilot</option></select></div>
      <div id="aiw-msg"></div></div>
      <button type="button" id="aiw-fab" aria-label="Mở trợ lý AI" title="Trợ lý AI tài chính">✨<span class="dot"></span></button>`;
    document.body.appendChild(w);
    const chips = $('aiw-chips');
    CHIPS.forEach(([k, label]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = () => wRun(k); chips.appendChild(b); });
    const toggle = () => { w.classList.toggle('open'); const d = $('aiw-fab').querySelector('.dot'); if (d) d.remove(); };
    $('aiw-fab').onclick = toggle; $('aiw-x').onclick = toggle;
    $('aiw-go').onclick = wAsk;
    $('aiw-open').onchange = (e) => { if (e.target.value) { window.open(e.target.value, '_blank', 'noopener'); e.target.value = ''; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountWidget); else mountWidget();
})();
