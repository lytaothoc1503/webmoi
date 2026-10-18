# Hướng dẫn cho trợ lý (Claude) khi làm việc với dự án này

Chủ dự án: **Thóc** (người Việt, mới học code). Dự án: web **Nhà của An Homestay Tà Xùa** (Tà Xùa, Bắc Yên, Sơn La).

## Cách làm việc với chủ dự án (quan trọng)
- Luôn trả lời **tiếng Việt có dấu đầy đủ**, ngắn gọn, kết luận trước.
- Chủ dự án muốn trợ lý **tự làm** (sửa code, test, commit, push), không giao việc thủ công. Không liệt kê nhiều đề xuất: chỉ hỏi ngắn **có/không**.
- Làm theo từng phần: xong phần nào báo phần đó, chờ chủ dự án đồng ý rồi mới sang phần tiếp.
- **Làm xong là tự lưu vào dự án theo quy trình** (cập nhật file này, commit, push, gộp vào `main`, kiểm tra Actions xanh). KHÔNG bảo chủ dự án "xem/duyệt PR" hay "xem lệnh": cần thì chủ dự án tự vào xem. Chỉ dừng hỏi khi việc cần thông tin hoặc hành động của riêng chủ dự án (link, khóa, tài khoản).
- Ảnh/đánh giá chủ dự án đưa lên là đã được đồng ý công khai, không cản trở. Không bắt khách phải được duyệt tài khoản thủ công.
- Không ghi mật khẩu, khóa bí mật (`service_role`, Turnstile Secret...) vào code, tài liệu hay chat.
- KHÔNG ghi mã đơn, tên/SĐT khách hay số liệu tiền thật vào file trong repo (kể cả CLAUDE.md): GitHub Pages đăng công khai MỌI file (ví dụ `nhacuaantaxua.com/CLAUDE.md` mở được), mà mã đơn là chìa khóa mở phiếu `phieu.html?ma=` (lộ tên khách, ngày ở). Cần nhắc đơn nào thì mô tả bằng ngày/trạng thái, xem chi tiết trong admin.
- Chủ dự án sửa code trên điện thoại bằng github.dev và VS Code; lấy bản mới bằng `.\scripts\dong-bo.ps1` (tự bật pull.rebase + autoStash, giữ thay đổi chưa commit, báo khớp `origin/main`). Trợ lý luôn `git pull --rebase` trước khi sửa và trước khi push, và không để lại file chưa commit.

- VS Code: mở thư mục `webmoi`, cài tiện ích **Claude Code** (gợi ý sẵn trong `.vscode/extensions.json`), dùng terminal PowerShell (không dùng terminal Kali của dev-container). Ctrl+Shift+P > Tasks: Run Task > "Đồng bộ GitHub" hoặc "Kiểm tra web". Chữ Việt trong terminal: `.vscode/settings.json` mở PowerShell ở UTF-8 (chcp 65001), `dong-bo.ps1` (lưu UTF-8 có BOM) và task "Kiểm tra web" cũng tự đặt UTF-8, `dong-bo.ps1` đặt `core.quotepath false`. Mọi file trong repo là UTF-8; file `.ps1` phải có BOM (PowerShell 5.1 cần BOM mới đọc đúng chữ Việt). Chữ hiển thị (giao diện, thông báo, commit) bằng tiếng Việt; tên biến/hàm/lệnh trong code giữ nguyên như cũ.

## Kiến trúc
- Web tĩnh (HTML/CSS/JS thuần, không framework, không bước build) chạy trên **GitHub Pages**, tên miền chính https://nhacuaantaxua.com/ (`CNAME`, qua Cloudflare; github.io chỉ là địa chỉ gốc). Đẩy lên `main` là web tự cập nhật sau 1-3 phút.
- Chạy thử trên máy: `npm install` rồi `npm start` (servor, tự tải lại). Kiểm tra: `node scripts/kiem-tra.js`. Không có framework test; kiểm tra giao diện bằng trình duyệt ở 390px và 1366px.
- **Supabase** (project `hkfprewiprdztmdcoxzz`): Postgres + RLS (bật trên cả 7 bảng), Auth, Edge Function `customer-signup`.
- Tài khoản khách: đăng ký bằng **số điện thoại** (email nội bộ `<sđt>@example.com`, không OTP/email), tạo qua Edge Function. Admin tách riêng (`auth.html`, bảng `admins`, `is_admin()`).
- Ngôn ngữ: tiếng Việt mặc định, nút VI | EN; bản dịch nằm trong từ điển của `i18n.js` (chữ Việt mới cần thêm bản Anh).

## File chính
| File | Vai trò |
| --- | --- |
| `config.js` | Liên hệ, giờ nhận/trả phòng, ngân hàng (`bank`: MB, bankId 970422, STK đã điền; `accountName` chờ chủ nhà điền tên chủ TK, để trống vẫn hiện QR nhưng không ghi dòng Chủ tài khoản), video, khóa công khai Supabase, `turnstileSiteKey` |
| `data.js` | Phòng, tour, dịch vụ, câu chuyện, chính sách hoàn hủy, FAQ, đánh giá, thư viện ảnh |
| `index.html`, `app.js`, `account.js` | Trang chủ, đặt phòng, tra cứu đơn, đăng ký/đăng nhập |
| `i18n.js` | Dịch Việt ↔ Anh |
| `admin.html`, `auth.html` | Quản trị (mở bằng cách bấm 3 lần vào logo) |
| `chinh-sach.html` | Chính sách và hoàn hủy |
| `san-may-ta-xua.html` | Bài hướng dẫn săn mây (SEO, có schema Article/FAQ) |
| `supabase/functions/customer-signup/` | Hàm đăng ký bằng SĐT, có chỗ nối Cloudflare Turnstile (tắt khi chưa có khóa) |
| `supabase/functions/notify-booking/` | Báo chủ nhà khi có đơn mới/đã thanh toán (xem mục "Báo chủ nhà khi có đơn mới") |
| `phieu.html`, `phieu.js` | Trang phiếu xác nhận cho khách (`?ma=MÃ`); `window.NCA_slip()` vẽ phiếu, dùng chung với admin |
| `admin-auth.js` | Client Supabase của admin (phiên trong `sessionStorage`) |
| `bieu-mau.js`, `vendor/html2canvas.min.js` | Mục Biểu Mẫu trong admin (mẫu in, xuất PNG) |
| `ai-tro-ly.js` | Mục Trợ Lý AI trong admin (soạn "lời nhờ" để dán vào AI ngoài) |
| `cloudflare/thong-bao/` | Worker nhận tin đơn mới, gửi Telegram |
| `scripts/kiem-tra.js`, `scripts/dong-bo.ps1` | Kiểm tra tự động; đồng bộ GitHub cho chủ dự án |
| `images/` | Ảnh web (ưu tiên `.webp`); `sitemap.xml`, `robots.txt`, `CNAME` ở gốc |
| `HUONG-DAN-SUA.md`, `README.md` | Hướng dẫn sửa nhanh cho chủ nhà; giới thiệu và cài đặt Supabase |
| `TASKS.md`, `SECURITY.md` | Bản cũ (chia việc 2 máy; mẫu mặc định của GitHub), không theo dõi việc ở đó: danh sách việc duy nhất nằm ở cuối file này |

**Cách mã chạy:** `config.js` đặt `window.SITE`, `data.js` đặt `window.SITE_DATA`; `index.html` nạp theo thứ tự supabase-js (CDN, có `integrity`) → `config.js` → `data.js` → `phieu.js` → `app.js` → `account.js` → `i18n.js`. `getList()` trong `app.js` đọc bảng Supabase (`rooms/tours/gallery/faq/reviews`); bảng trống hoặc lỗi thì dùng dữ liệu `data.js`. Đơn lưu ở bảng `bookings` (mã đơn 8 ký tự = nội dung chuyển khoản) và bản sao trong trình duyệt khách. Luồng trạng thái (`ST` trong `app.js`): Chờ thanh toán → (khách bấm "Tôi đã chuyển khoản") Đã thanh toán - chờ xác nhận → (admin xác nhận) Đặt phòng thành công → Hoàn thành, hoặc Hủy đơn. `admin.html` nạp `config.js`, `admin-auth.js`, `phieu.js`, `bieu-mau.js`, `ai-tro-ly.js`, Chart.js; đổi `?v=` của `bieu-mau.js`/`ai-tro-ly.js` trong `admin.html` khi sửa.
**Lưu ý kiểm tra:** `scripts/kiem-tra.js` soát cú pháp mọi file JS của web (`config`, `data`, `app`, `account`, `i18n`, `admin-auth`, `phieu`, `bieu-mau`, `ai-tro-ly`); thêm file JS mới thì thêm vào danh sách đó. Migration chạy tay trong SQL Editor theo thứ tự tên file.
| `supabase/migrations/` | SQL tạo bảng và quyền |

## Mục Khám phá Tà Xùa
Ghi chú 11/10: chủ dự án tự quyết định và chịu trách nhiệm dùng 5 ảnh do chủ dự án cung cấp (táo mèo, Mỏm Cá Heo, Đầu Rùa, thảo nguyên, rừng rêu; nguồn người chụp chưa rõ, một số ảnh có người thật). Chủ dự án cũng yêu cầu dùng 2 ảnh báo (rừng rêu có logo VnExpress, đồi chè đã cắt bỏ phần chữ chèn); khi có ảnh của nhà thì thay các ảnh này. Bấm vào thẻ địa điểm mở cửa sổ giới thiệu thêm (`openPlace` trong `app.js`, dữ liệu `more` và `tip` của từng điểm trong `data.js`, đã có bản Anh trong `i18n.js`).
Mục `#kham-pha` (mẹo săn mây + 9 địa điểm) lấy dữ liệu từ `cloudTips`, `attractions`, `attractionsNote` trong `data.js`; thêm/sửa điểm ở đó (chữ Việt mới cần thêm bản Anh vào `i18n.js`). Mục còn có `seasons` (Tà Xùa theo mùa) và `itinerary` (gợi ý 2 ngày 1 đêm, chỉ là gợi ý, không bán tour). Thẻ địa điểm chưa có ảnh THẬT thì hiện dạng chữ, KHÔNG dùng emoji và KHÔNG gán ảnh của chỗ khác (chỉ dùng ảnh Nhà của An hoặc ảnh đã được phép bằng văn bản; web báo/công ty du lịch đều có bản quyền). Quy ước: KHÔNG ghi nguồn/credit bên ngoài lên web, chỉ dùng nội dung cần thiết viết lại bằng lời của nhà. Chủ nhà nên rà lại và thay ảnh thật cho các điểm đang dùng biểu tượng.

Khách đã đăng nhập thấy khung "Nhà nên gọi bạn là gì?" ở mục Đặt Phòng (lưu vào `user_metadata.call_name`, hàm `renderHello` trong `account.js`); chữ điều khoản viết nhẹ nhàng và luôn bấm xem được. Đầu trang có hàng nút "Bạn đến để:" (Săn mây, Ngắm sao, Cà phê, Nghỉ dưỡng) và nút "Hỏi nhà: sáng mai có mây không?" (sao chép câu hỏi + mở Messenger). Đồng bộ 2 thiết bị: mọi thay đổi phải nằm trên `main` của GitHub (máy tính và điện thoại đều `git pull --rebase` từ đó); kiểm tra `git rev-parse HEAD origin/main` bằng nhau sau khi đẩy.

Bấm vào thẻ phòng mở trang chi tiết (hàm `openRoom` trong `app.js`): ảnh lớn, ô giá và thông tin bên phải, nút Đặt phòng, Gọi, Messenger. Phòng có thể thêm `images: [...]` và `description` trong `data.js` để hiện thêm ảnh nhỏ và mô tả.

## Phòng và giá (chủ nhà cung cấp)
Chỉ có **1 hạng phòng** ("Phòng Gỗ Ngắm Biển Mây", các căn giống nhau), khai báo ở `rooms` trong `data.js` với `rates` (T2-T5 700k, T6+CN 900k, T7 1,1 triệu cho 2 khách/đêm), `extraGuestFee` (khách thứ 3: 200k), `maxGuests` (3). Web tự tính giá từng đêm theo thứ trong `calculateTotal` (`app.js`). Chưa đưa giá ngày lễ lên web (chủ dự án quyết định không thêm). Trẻ dưới 6 tuổi miễn phí, giá chưa gồm ăn sáng. **Combo Săn Mây** (`combo` trong `data.js`): tùy chọn khi đặt phòng, = bữa sáng + trà chiều (giá lấy từ `services`) x khách x đêm, nước uống tặng kèm; KHÔNG kèm xe giường nằm/vận chuyển (rủi ro lữ hành). Khuyến mãi "giảm 100-150k" chưa ghi rõ điều kiện nên chưa đưa lên web.

**Chính sách hoàn hủy (chủ nhà chốt 11/10, `cancelPolicy` trong `data.js` + `chinh-sach.html` + FAQ):** hủy trước ngày nhận phòng từ 3 ngày trở lên hoàn 100%; dưới 3 ngày hoặc không đến thì không hoàn; tiền hoàn chuyển lại trong vòng 3 ngày; đổi ngày báo trước ít nhất 3 ngày; thời tiết xấu/đường chặn thì nhà hỗ trợ đổi ngày hoặc hoàn. Lý do: nhà ít phòng nên cần phòng quay vòng nhanh.

## Mục Coffee (ngang hàng Homestay)
`#coffee` lấy dữ liệu từ `coffee` trong `data.js` (giới thiệu, 4 điểm nhấn Mây/Trải nghiệm/Chill/Khách, bảng thông tin quán, menu lấy từ `services`, ảnh quán, ảnh khách hàng, đánh giá có nhắc quán). Ô nào để trống thì web tự ẩn; chủ nhà bổ sung giờ mở cửa, menu, ảnh khách thật tại đây. Menu và đầu trang có thẻ đôi Homestay | Coffee. Ba dịch vụ chính (cà phê, trà chiều, bữa sáng trên mây) nằm ở mục Coffee (khai báo ở `coffee.menuFrom`); dịch vụ không còn là một mục dài trên trang: toàn bộ `services` nằm trong menu "Dịch Vụ" (bấm vào mở cửa sổ chi tiết, gọn như trang mẫu); `#dich-vu` luôn ẩn. Chỉ phần nổi bật, quan trọng mới đặt thành mục riêng trên trang.

Phần "Ăn uống" trong mục Coffee lấy từ `coffee.dining` (nhóm Bữa sáng, Món chính, Đồ uống). Hiện chưa có món nào nên web ẩn; chủ dự án tự điền tên món và giá vào `items` (có dòng mẫu trong comment). Không dùng ảnh/tên của nhà hàng khác; chỉ dùng ảnh của chính Nhà của An.

## Trải nghiệm / tour (quan trọng về pháp lý)
Chủ dự án là hộ kinh doanh cá thể. Theo Luật Du lịch 2017, kinh doanh lữ hành (tổ chức, bán tour) cần doanh nghiệp có giấy phép và ký quỹ; hướng dẫn viên cần thẻ hướng dẫn viên. Vì vậy web KHÔNG bán "tour có hướng dẫn viên": mục `#tour-ta-xua` là "Trải Nghiệm & Gợi Ý Lịch Trình" (nhà tư vấn lộ trình, kết nối người địa phương, cho mượn đèn/áo, bữa sáng). Cờ `toursBookable` trong `data.js` = false (không đặt tour online, không hiện giá). Chỉ bật true khi đã ký hợp đồng đại lý với công ty lữ hành có giấy phép (Điều 40). Đây là thông tin tham khảo, không phải tư vấn pháp lý; nên hỏi Sở VHTTDL Sơn La hoặc luật sư. Không dùng chữ "hướng dẫn viên", "tour trọn gói" trên web nếu chưa đủ điều kiện.

## Quy trình tiêu chuẩn (làm đúng trước khi báo xong)
1. **Rà pháp lý theo loại hình trước khi thêm hoặc đổi dịch vụ.** Chủ dự án là hộ kinh doanh cá thể. Tour, hướng dẫn viên, đưa đón thu tiền, cho thuê xe, khuyến mãi, nội dung quảng cáo đều phải kiểm tra điều kiện. Nếu có rủi ro thì tự chỉnh về hướng an toàn, để cờ bật lại sau, rồi báo ngắn gọn. Không chờ bị nhắc. Trợ lý TỰ tra cứu văn bản luật (ghi rõ điều khoản đã đọc, phần nào chưa kiểm chứng được), tự chọn hướng an toàn và báo kết luận; KHÔNG giao chủ dự án đi hỏi cơ quan hay luật sư thay mình. Đây là thông tin tham khảo, không phải tư vấn pháp lý.
   Dữ liệu cá nhân của người khác (tên, SĐT, ảnh) dù đã công khai trên mạng xã hội vẫn KHÔNG tự đưa lên web nếu chưa có sự đồng ý của họ (Nghị định 13/2023/NĐ-CP). Chỉ dùng thông tin của chính Nhà của An hoặc thông tin doanh nghiệp công khai.
2. **Không ghi nguồn/credit lên web**, viết lại bằng lời của nhà. Chỉ dùng ảnh và tên của chính Nhà của An.
3. **Không bịa thông tin.** Chưa có giá, món, ảnh, giờ thì để trống hoặc ẩn và hỏi chủ dự án. Mọi con số do trợ lý đề xuất phải ghi rõ "đề xuất" và để chủ dự án chốt.
4. **Không hiện ngày "cập nhật" lên web.**
5. **Kiểm tra trước khi báo xong:** `node scripts/kiem-tra.js`, các bài test đặt phòng/tài khoản, xem cả điện thoại 390px và máy tính 1366px (không tràn ngang, không lỗi JS), chữ Việt mới đã có bản Anh trong `i18n.js`.
6. **Đồng bộ 2 thiết bị:** `git pull --rebase`, commit tiếng Việt, `git push`, rồi xác nhận `git rev-parse HEAD origin/main` bằng nhau và tab Actions xanh.
7. **Danh sách việc chờ:** giữ theo mức ưu tiên, làm việc quan trọng trước và nhắc lại phần chưa làm khi xong.
9. **Rà soát chủ động (chủ dự án dặn 11/10):** lâu lâu, hoặc trước việc có thể ảnh hưởng hệ thống đang chạy, tự rà soát và sửa (kiểm tra CSDL thật, thử gọi API như người lạ, `disable_signup` phải True, `node scripts/kiem-tra.js`). Có thông tin mới hợp lý thì tự sáng tạo thêm trong khuôn quy tắc ở trên, lưu và đồng bộ. Việc có ảnh hưởng hoặc phân vân thì hỏi có/không.
8. **Báo cáo:** kết luận trước, ngắn gọn, tối đa một câu hỏi có/không. Khi đổi cấu trúc hoặc quy trình thì cập nhật file này.

## Quản trị: Homestay & Tài chính
`admin.html` có 2 nhóm cân bằng: Homestay & Coffee (đơn, phòng, trải nghiệm, đánh giá, ảnh, FAQ) và Tài chính (Đối soát, Hoàn trả, Thu chi). Dùng chung tài khoản admin (`is_admin()`). Bảng `finance_entries`, `refunds` tạo bằng `supabase/migrations/20261011000000_finance_tables.sql` (RLS chỉ admin; đã chạy trong SQL Editor ngày 11/10, 3 bảng + trigger + RLS đã xác nhận; trợ lý bị chặn tự tạo bảng). Tên hệ thống quản trị: "Hệ Thống Đối soát & Xử lý Hoàn trả" (logo riêng, màu xanh teal + cam; mục Đối soát có nút "Phiếu" mở Phiếu xác nhận in/lưu PDF, ô người lập và kế toán tự điền tay, KHÔNG ghi có API VNPAY/thuế vì chưa có thật) (KHÔNG dùng tên/nhãn VNPAY hay tổ chức thật khác, vì web này không phải cổng của họ). Mục "Biểu Mẫu" (`bieu-mau.js`, nhóm: Khách đặt phòng / Hoàn trả / Ủy quyền / Bộ hồ sơ in một lần; có sẵn tin nhắn gửi khách; nút "Phiếu / Gửi khách" ở Đối soát): Phiếu xác nhận đặt phòng khổ ngang A4 do `phieu.js` vẽ, dùng chung cho admin và trang khách. Có thêm mẫu "Phiếu xác nhận đặt phòng (đơn vị khác)": giao diện giống hệt phiếu Nhà của An, nhưng tên đơn vị, logo, địa chỉ, hotline gõ/tải lên được (để trống thì tự dùng thông tin Nhà của An) — dành cho chủ dự án làm sale booking online cho khách sạn/resort khác, tái dùng thiết kế phiếu mà không ảnh hưởng phiếu gốc. `window.NCA_slip()` trong `phieu.js` nhận thêm `orgName/orgTag/orgLogo/orgAddress/orgPhone` (không truyền thì giữ đúng mặc định Nhà của An). Phiếu-xn (của Nhà của An) có thêm nút "💾 Lưu ưu đãi/số phòng/ghi chú/ngân hàng cho đơn này" (`saveSlipFields` trong `bieu-mau.js`, ghi vào `bookings.slip_room_no/slip_promo/slip_note/slip_bank_name/slip_bank_account/slip_bank_holder`, tách riêng khỏi "Cập nhật đơn" để không ảnh hưởng các trường cốt lõi): bấm lưu thì máy khác chọn lại đúng đơn đó tự nạp lại y hệt, và link `phieu.html?ma=` của khách cũng hiện đúng các trường này (không bị bớt) — file `supabase/migrations/20261018000000_slip_sync_fields.sql` ĐÃ chạy (18/10, chủ dự án chạy trong SQL Editor; trợ lý đã kiểm trên CSDL thật: đủ 6 cột, ràng buộc độ dài, chính sách insert chặn khách tự điền, `track_booking` trả thêm 6 cột và giữ quyền anon/authenticated). CCCD khách và ảnh QR tự tải lên **cố ý không đồng bộ** (CCCD vẫn đúng quy định cũ KHÔNG lưu CSDL; ảnh QR là ảnh nặng không hợp lưu trong bảng đơn) — 2 mục này vẫn phải nhập lại trên từng máy. Mẫu "Phiếu xác nhận đặt phòng (đơn vị khác)" không dùng tính năng lưu đồng bộ này (dữ liệu của khách hàng sale khác, không gắn vào đơn Nhà của An). (khách tra mã đơn, đơn thành công thì có nút "Xem / in phiếu" + "Bước tiếp theo"; link `?ma=MÃ` tự mở đơn). CCCD khách chỉ ghi tay/in trên phiếu, KHÔNG lưu CSDL. Link gửi khách là `phieu.html?ma=MÃ` (trang riêng, KHÔNG cần đăng nhập, xem/in/lưu PDF; gọi RPC `track_booking` theo mã). Phiếu chỉ mở được khi đơn đã có trong bảng `bookings`: ở Biểu Mẫu có khung "Đã đồng bộ / Chưa đồng bộ" và nút "Xác nhận tạo đơn" (admin chèn đơn vào `bookings`, ghi `notes` = "[Tạo từ Biểu Mẫu bởi <email> lúc <giờ>]"; đơn đã tạo mà phiếu bị sửa thì hiện cảnh báo "Phiếu khác hệ thống" + nút "Cập nhật đơn theo phiếu này" (thêm "[Sửa từ Biểu Mẫu...]" vào notes), KHÔNG ghi vào `admin_note` vì khách thấy được). Nhận phòng: chỉ người đại diện đặt phòng mang CCCD hoặc VNeID (khách nước ngoài: hộ chiếu); khách đi cùng gửi họ tên + số định danh để nhà khai báo lưu trú (Luật Cư trú 2020 Điều 30 yêu cầu thông tin theo từng người lưu trú; mới đọc phần tóm tắt, chưa đối chiếu văn bản gốc). 8 mẫu in (phiếu xác nhận hoàn tiền, biên bản hoàn trả cọc đầy đủ/gọn, giấy ủy quyền nhận tiền hoàn, giấy ủy quyền nhận/trả phòng, giấy đề nghị hoàn tiền, phiếu thu, thông báo tạm giữ hoàn tiền không khớp chính chủ), chọn đơn thì tự điền tên/SĐT/mã đơn/số tiền, tiền bằng chữ tự đọc; CCCD, STK chỉ nằm trong trình duyệt, không lưu. Mẫu "Phiếu xác nhận hoàn tiền": nhà gửi khách SAU KHI đã chuyển khoản hoàn tiền thật, ghi ngân hàng/STK/chủ TK nhận và mã giao dịch ngân hàng để khách tự đối chiếu sao kê — KHÔNG mạo danh VNPAY hay tổ chức trung gian nào, không có QR "xác thực nhận bồi thường" (trùng mẫu lừa đảo giả mạo VNPAY hay dùng để lừa nạn nhân chuyển tiền đi khi tưởng đang nhận tiền về; đã từ chối làm theo đúng mẫu đó 16/10, chỉ làm phiếu thật dạng chữ). Mẫu "Thông báo tạm giữ hoàn tiền (không khớp chính chủ)" dùng khi người đứng tên chuyển khoản gốc (theo sao kê) khác với người đang đề nghị nhận hoàn: nêu rõ không trùng khớp, tạm chưa xử lý, và 3 hướng giải quyết (đối chiếu tài khoản, lập giấy ủy quyền, hoặc hoàn thẳng về tài khoản đã chuyển khoản ban đầu). Chữ ký thật của Nhà của An (`images/chu-ky-an.png`, chủ dự án cung cấp 16/10) tự chèn vào đúng dòng Nhà của An ký trong `bieu-mau.js` (biên bản hoàn trả cọc đầy đủ/gọn: BÊN A/BÊN HOÀN TRẢ; phiếu thu: NGƯỜI THU TIỀN; thông báo tạm giữ hoàn tiền: ĐẠI DIỆN NHÀ CỦA AN) — KHÔNG chèn vào dòng ký của khách hay bên thứ 3 (giấy ủy quyền, giấy đề nghị hoàn tiền). Thêm mẫu mới: thêm 1 phần tử vào `TEMPLATES`. Ở Biểu Mẫu có nút "🖼️ Xuất ảnh (PNG)" cạnh "In / Lưu PDF" (`exportFormImage` trong `bieu-mau.js`, dùng thư viện `vendor/html2canvas.min.js` tự host trong repo — không gọi CDN ngoài) để tải mẫu đang xem thành 1 file ảnh gửi nhanh qua Messenger/Zalo, không cần mở PDF. Mục "🤖 Trợ Lý AI" trong admin (`ai-tro-ly.js`, `page-ai`): AI làm việc trên DỮ LIỆU CÓ SẴN (đơn, đối soát, hoàn trả, thu chi, đánh giá), KHÔNG tự điền thông tin của khách vào phiếu (chủ dự án đã bác ý đó). Mỗi việc (việc hôm nay, soạn tin nhắn cho đơn, soát đối soát, báo cáo tháng, trả lời đánh giá, báo tiến độ hoàn trả) gom số liệu rồi sao chép sẵn "lời nhờ" để dán vào Gemini/Claude/ChatGPT/Sider; KHÔNG khóa API, KHÔNG gửi STK/CCCD, SĐT che còn 3 số cuối. Sửa file này thì đổi `?v=` ở `admin.html`. AI trả lời khách trên web để sau (cần Cloudflare Worker giữ khóa). Số liệu tài chính chỉ lưu trong Supabase, không để trong file trên GitHub. Hoàn trả chỉ cho đơn admin đã xác nhận nhận tiền (CSDL ép bằng `20261011010000_finance_hardening.sql`: khóa dòng đơn chống hoàn trùng, che STK khi đóng yêu cầu cả Đã hoàn lẫn Từ chối, đơn đã có hoàn thì không xóa/đổi tiền, thu hẹp quyền bảng tài chính; chủ dự án chạy file này trong SQL Editor một lần). Khi bấm "Đã nhận tiền"/"Xác nhận thành công", admin nhập **số tiền thực nhận** (cột `bookings.received_amount`, file `20261011050000_received_amount.sql`); hoàn trả và doanh thu tính theo số này, đơn cũ chưa có thì dùng giá đơn. Hoàn trả bắt buộc nhập mã booking trên Phiếu xác nhận của khách để đối chiếu với đơn đang chọn (không khớp hoặc để trống thì chỉ nhắc, admin chọn Tiếp tục hoặc Hủy, KHÔNG chặn quyền admin; kết quả đối chiếu ghi vào lý do; biên bản hoàn trả cũng có dòng đối chiếu). Hoàn trả có STK nhận hoàn (bắt buộc ngân hàng, STK 6-20 số, tên chủ TK, lý do), CSDL ép: không hoàn quá số đã thu, yêu cầu đã đóng không sửa/xóa, đã hoàn thì chỉ giữ 4 số cuối STK; mọi thay đổi tự ghi vào `finance_audit` (không lưu STK đầy đủ); CSV xuất ra chống chèn công thức. Mỗi yêu cầu hoàn có nút "Tiến độ" mở Thẻ tiến độ (5 bước: Đã tiếp nhận, Đang đối chiếu, Đã duyệt - chuẩn bị chuyển, Đã chuyển khoản, Hoàn tất; câu "Nhà đang làm / Bạn cần làm" dễ hiểu, giờ từng bước, STK che) để admin chụp màn hình gửi khách; chuyển bước bằng nút, bước 5 tự đặt khi bấm Đã hoàn. Cột `step`, `step_log` do `20261011040000_refund_progress.sql` (chủ dự án chạy 1 lần; trigger ép chỉ tiến từng bước, giờ do máy chủ ghi). Chưa chạy file này thì thẻ vẫn hiện nhưng không chuyển bước được. Tham khảo ý tưởng từ dự án riêng Mây Ledger (không dùng chung code).

## Khóa đăng nhập quản trị (PIN + mã 2 bước, không lưu phiên)
`auth.html` đăng nhập 3 lớp: mật khẩu, rồi mã 6 số ứng dụng xác thực (TOTP, nếu admin đã bật ở mục "🔐 Bảo Mật"), rồi mã PIN 6-8 số. PIN và TOTP do **máy chủ** kiểm (`supabase/migrations/20261011030000_admin_pin_mfa.sql`, chủ dự án chạy 1 lần trong SQL Editor): `is_admin()` (dùng trong mọi RLS) chỉ đúng khi phiên đã qua PIN (bảng `admin_pin_sessions`, 12 giờ) và đã aal2 nếu có TOTP; PIN băm bcrypt, sai 5 lần khóa 15 phút tăng dần; chưa đặt PIN thì lần đầu vào được và bị bắt đặt PIN ngay. Nếu chưa chạy file SQL này thì `auth.html` báo lỗi lúc gọi `admin_status` (phải chạy trước khi dùng).
`admin-auth.js` tạo client Supabase cho admin: phiên chỉ nằm trong `sessionStorage` (khóa `nca-admin-auth`), không dùng localStorage, nên đóng tab/trình duyệt là tự mất; `admin.html` giữ phiên khi tải lại trang hoặc chuyển qua lại trong admin (không bắt đăng nhập lại), chỉ tự đăng xuất sau 1 giờ không thao tác hoặc bấm Đăng xuất (gọi `admin_end_session` + signOut). Ô nhập đặt `autocomplete` để trình duyệt không nhớ. Mất điện thoại 2 bước: xóa yếu tố MFA ở Supabase Authentication > Users. Test: `/home/claude/work/pin_test.py` (cần mock Supabase có các RPC `admin_*`).

## Thông tin thanh toán chỉ hiện đúng chỗ
STK/QR chỉ hiện cho khách có đơn đang **chờ chuyển khoản** (cửa sổ đơn ở `app.js` khi trạng thái Chờ thanh toán; phiếu `phieu.js` chỉ khi `còn lại > 0` và tổng > 0, tắt được bằng `hideBank:true`). KHÔNG hiện ở trang chủ, đơn đã thanh toán đủ/đã hủy, phiếu thu, hoàn trả, biên bản, giấy ủy quyền. Thêm chỗ hiển thị STK mới phải theo đúng quy tắc này.

## Quy tắc khi sửa
00. Trình duyệt khách lưu tạm file JS (GitHub Pages cache ~10 phút, có máy giữ lâu hơn). `index.html` và `phieu.html` gọi script kèm `?v=...`; khi sửa `config.js`, `data.js`, `app.js`, `phieu.js`, `account.js`, `i18n.js` thì ĐỔI số `v` trong 2 file này để khách nhận bản mới ngay. `admin.html` và `auth.html` cũng gọi `config.js`, `phieu.js`, `admin-auth.js` kèm `?v=` (Cloudflare giữ JS 7 ngày): sửa các file này thì đổi `v` ở CẢ 4 file HTML cho cùng một số.
0. KHÔNG hiện ngày/giờ "cập nhật" lên web (chủ dự án tự chủ động khi có thông tin mới).
1. `git pull --rebase` trước khi làm.
2. Không để chữ "mẫu" hay dữ liệu thử hiển thị cho khách (cờ `catalogIsSample`, `storyIsSample`, `policyIsSample` trong `data.js` phải là `false`).
3. Mọi chuỗi chèn vào `innerHTML` phải đi qua `esc()`.
4. Kiểm tra cả điện thoại (390px) và máy tính (1366px) sau khi sửa giao diện.
5. Commit tiếng Việt ngắn gọn rồi `git push`.

## Trạng thái hiện tại
**Đã có:** đặt phòng + QR, tra cứu đơn, đăng ký SĐT, tiếng Anh, thư viện ảnh thật, tour/dịch vụ công khai, SEO cơ bản (canonical, sitemap, schema), RLS.

**Chờ tiền/điều kiện:** email theo tên miền, đăng nhập Facebook/Google (tên miền `nhacuaantaxua.com` và Cloudflare đã chạy, xem mục Cloudflare).

**Việc chờ chủ dự án:** xem mục "Việc còn lại (xếp theo ưu tiên)" bên dưới (danh sách duy nhất, không lặp ở nơi khác).

## Báo chủ nhà khi có đơn mới
Code đã có trong repo nhưng **chưa bật trên Supabase thật** (chờ chủ dự án đưa link nhận tin). Gồm: Edge Function `supabase/functions/notify-booking/` (verify_jwt = false; chỉ nhận `{id, event}`, đọc lại đơn từ DB, gửi tin tới secret `NOTIFY_WEBHOOK_URL`, mỗi sự kiện báo 1 lần nhờ cột `bookings.notified_new_at` / `notified_paid_at`) và migration `20261012000000_notify_new_booking.sql` (thêm 2 cột cờ, bật `pg_net`, trigger khi có đơn mới `new` và khi đơn sang "Đã thanh toán - chờ xác nhận" `paid`; lỗi khi báo không làm hỏng việc đặt phòng).
Để bật: chủ dự án tạo link (Zapier Catch Hook gửi Gmail, hoặc Slack Incoming Webhook) và gửi cho trợ lý; trợ lý triển khai function, đặt secret `NOTIFY_WEBHOOK_URL`, rồi chủ dự án chạy file SQL một lần trong SQL Editor (quy ước như các migration khác), sau đó đặt thử 1 đơn. KHÔNG ghi link webhook vào code hay chat. File migration này đã nằm trong repo: nếu cần đổi thì tạo file mới.

**Worker Cloudflare `anhomestay-web` (18/10):** code ở `cloudflare/thong-bao/` (`index.js` + `wrangler.jsonc`, file cấu hình DUY NHẤT; đã bỏ `wrangler.toml`). Một Worker làm 3 việc: (1) nhận báo đơn POST `?k=<NOTIFY_KEY>` rồi đưa vào Queue `notify-telegram-queue` (gói Free có Queues: 10.000 lượt/ngày, giữ tin 24 giờ); (2) người nhận Queue gửi Telegram, lỗi thì gửi lại sau 30 giây, tối đa 5 lần; không có Queue thì gửi thẳng; (3) kho ảnh R2 bucket `banhfuli` (binding `banhfuli-bucket`, route `nhacuaantaxua.com/webmoi/*`): GET công khai, PUT/DELETE bắt buộc `Authorization: Bearer <UPLOAD_KEY>` (bản cũ để ai cũng tải lên/xóa được, đã bịt 18/10, đã thử như người lạ: 401). Worker cũ `nha-cua-an-thong-bao` đã bị xóa khỏi Cloudflare (18/10). Deploy: `npm run thong-bao`. Cài/đổi khóa: chủ dự án chạy `npm run thong-bao:khoa` (`cai-khoa.ps1`: token gõ ẩn, tự lấy Chat ID, NOTIFY_KEY ngẫu nhiên 64 ký tự, `wrangler secret bulk`, gửi tin thử, chép link mới cho Supabase `NOTIFY_WEBHOOK_URL`). CÒN: chủ dự án `/revoke` token cũ (đã lộ trong chat 18/10), chạy `npm run thong-bao:khoa`, dán link vào Supabase, đặt thử 1 đơn. KHÔNG dùng `echo ... | wrangler secret put`. Edge Function `notify-booking` ĐÃ deploy (bản 3 ngày 18/10 chỉ báo "đã chuyển khoản" khi đơn thật sự ở trạng thái đó; verify_jwt = false). Migration `20261012000000` đã chạy (2 cột cờ, 2 trigger, `pg_net`). Lưu ý công cụ Write/Read của trợ lý có thể hiểu sai dấu của "Tài liệu" (thư mục thật dùng dấu tách rời): tạo/sửa file bằng Bash/Python theo đường dẫn tương đối trong repo.

## Kiểm tra tự động (CI)
Chỉ giữ 1 quy trình `kiem-tra.yml` (đã bỏ `jekyll-docker.yml` vì web là HTML tĩnh, GitHub Pages tự build). File trong `supabase/migrations/` đã chạy rồi thì KHÔNG sửa hay dán đè; muốn đổi thì tạo file mới.
`.github/workflows/kiem-tra.yml` chạy `node scripts/kiem-tra.js` mỗi lần đẩy lên `main`: cú pháp JS, ảnh trong `data.js` có file thật, cờ "mẫu" = false, không có khóa bí mật. Chỉ báo lỗi, không chặn đưa web lên GitHub Pages. Chạy tay: `node scripts/kiem-tra.js`.

## Việc đang làm (cập nhật 13/10)
**Đã xong:** bỏ nhãn "mẫu"; ảnh và giao diện sáng; rà soát điện thoại/máy tính; khóa admin PIN + 2 bước; hoàn trả + thẻ tiến độ (SQL đã chạy); số thực nhận (SQL đã chạy); phiếu `phieu.html?ma=`; STK MB + QR chỉ hiện đúng chỗ; chống cache `?v=`; link Messenger (`contacts.messenger`); chính sách hoàn hủy (chủ dự án đã đồng ý bản trên web); 1 hạng phòng + ảnh từ Drive của chủ nhà; Cloudflare Web Analytics (`analyticsToken` đã điền); cấu hình VS Code + Claude Code. Danh sách tiến độ cũ hiện trong VS Code ("Đang làm phần B") là bản cũ, bỏ qua.
**Không còn việc nào chờ trợ lý** ngoài những mục cần thông tin từ chủ dự án bên dưới. Mục nào có link/khóa thì chủ dự án gửi, trợ lý làm tiếp.

## Việc còn lại (xếp theo ưu tiên, nhắc chủ dự án khi phù hợp)
**P0: ảnh hưởng tiền và an toàn (làm trước)**
1. Tên chủ tài khoản MB (`config.js` > `bank.accountName`, đang để trống): chủ dự án nói là "CONG TY CNHH KE TAO" (chưa rõ có phải TNHH không; đây là tài khoản công ty trong khi nhà là hộ kinh doanh) và sẽ xác nhận lại thứ Sáu 16/10. CHƯA điền, chờ chữ chính xác.
2. Đổi mật khẩu admin (đang yếu) + bật 2FA GitHub/Supabase.
3. Đối chiếu và xác nhận đơn nhận phòng 11/10 đang ở trạng thái "Đã thanh toán - chờ xác nhận" (xem trong admin).
4. Gửi link nhận tin đơn mới để bật báo đơn (mục "Báo chủ nhà khi có đơn mới").

**P1: nội dung và chống gian lận**
5. Giá thật tour/dịch vụ (đang là giá tạm trong `data.js`; giá phòng đã là giá thật). Dịch vụ "Thuê xe máy" và "Hỗ trợ hành lý & đưa đón" tạm ẩn trong `servicesPaused` (data.js), chờ xác nhận đăng ký ngành.
6. Turnstile: Site Key ĐÃ bật trên web (`config.js`, 16/10). CÒN LẠI: chủ dự án vào Cloudflare > Turnstile > widget "Nha cua An dang ky" copy **Secret Key**, dán vào Supabase > Edge Functions > Secrets với tên `TURNSTILE_SECRET` (không gửi Secret vào chat/code).
7. Câu chuyện chủ nhà thật, video giới thiệu/banner.
8. Ảnh thật cho 7 địa điểm chưa có ảnh của nhà (Cây táo mèo, Đầu Rùa, Cá Heo, thảo nguyên, ngắm sao, đồi chè, rừng rêu); đang dùng ảnh chủ dự án cung cấp theo ghi chú ở mục Khám phá.

**P2: khi có điều kiện**
9. (Tên miền + Cloudflare đã xong 16/10.) Còn: email theo tên miền, rồi bật đăng nhập Facebook/Google (`socialLogin` trong `config.js` = false vì chưa cấu hình Providers trong Supabase).
10. Lỗi "tiện ích": chủ dự án chưa nói rõ mục nào (dịch vụ không có nút đặt? hay dòng ✓ dưới mỗi phòng?).
11. Hướng 2 (chuyển nội dung sang Supabase): làm sau khi khách đông, xem `supabase/ke-hoach/`. Hiện theo Hướng 1: `data.js` là nơi sửa giá/ảnh/mô tả; các bảng `rooms/tours/gallery/faq/reviews` để TRỐNG (nếu có dữ liệu thì web dùng dữ liệu đó thay hoàn toàn `data.js`).

## Cloudflare (cập nhật 16/10)
Tên miền `nhacuaantaxua.com` chạy qua Cloudflare (gói Free) trước GitHub Pages. Canonical, og, sitemap, robots, JSON-LD đều dùng `https://nhacuaantaxua.com/` (KHÔNG dùng github.io). Cache Rule "Cache anh va tai nguyen tinh": ảnh/JS/CSS/font/mp4 edge TTL 7 ngày, browser TTL 1 ngày; HTML không bị cache (sửa là thấy ngay). Khi đổi file JS/CSS vẫn phải đổi `?v=` như quy tắc 00. Gói Workers for Platforms (25$/tháng) chưa dùng cho web này.

## Điểm bảo mật đã rà (không cần sửa)
Đã siết CSDL bằng `supabase/migrations/20261009000000_harden_bookings_and_grants.sql` (đã áp dụng): bỏ quyền thừa của khách chưa đăng nhập, giới hạn giá/độ dài/ngày của đơn. Chưa kiểm tra giá phía máy chủ vì giá nằm ở `data.js` (làm khi chuyển Hướng 2).
RLS bật cả 7 bảng; mã đơn 8 ký tự ngẫu nhiên; tra cứu theo SĐT chỉ trả thông tin tối thiểu; không có khóa bí mật trong code/lịch sử git; hàm đăng ký có giới hạn theo IP. Chấp nhận có chủ ý: đăng ký SĐT không xác minh. `20261018010000_rls_select_auth_uid.sql` (tối ưu RLS bookings bằng `(SELECT auth.uid())`, quyền không đổi): phần `customer_read_own_bookings` chủ dự án đã chạy 18/10; phần `public_insert_bookings` CHỜ chủ dự án chạy file này trong SQL Editor. Cột chủ đơn là `user_id` (KHÔNG có `customer_id`). Viết SQL thành file trong `supabase/migrations/`, không để file SQL lẻ ở gốc repo (GitHub Pages đăng công khai mọi file).

## Agent skills

### Issue tracker

Issue nằm ở GitHub Issues của repo `lytaothoc1503/webmoi` (dùng `gh` CLI). Xem `docs/agents/issue-tracker.md`.

### Triage labels

Dùng 5 nhãn mặc định: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Xem `docs/agents/triage-labels.md`.

### Domain docs

Single-context (một `GLOSSARY.md` + `docs/adr/` ở gốc repo). Xem `docs/agents/domain.md`.