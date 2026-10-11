# Hướng dẫn cho trợ lý (Claude) khi làm việc với dự án này

Chủ dự án: **Thóc** (người Việt, mới học code). Dự án: web **Nhà của An Homestay Tà Xùa** (Tà Xùa, Bắc Yên, Sơn La).

## Cách làm việc với chủ dự án (quan trọng)
- Luôn trả lời **tiếng Việt có dấu đầy đủ**, ngắn gọn, kết luận trước.
- Chủ dự án muốn trợ lý **tự làm** (sửa code, test, commit, push), không giao việc thủ công. Không liệt kê nhiều đề xuất: chỉ hỏi ngắn **có/không**.
- Làm theo từng phần: xong phần nào báo phần đó, chờ chủ dự án đồng ý rồi mới sang phần tiếp.
- Ảnh/đánh giá chủ dự án đưa lên là đã được đồng ý công khai, không cản trở. Không bắt khách phải được duyệt tài khoản thủ công.
- Không ghi mật khẩu, khóa bí mật (`service_role`, Turnstile Secret...) vào code, tài liệu hay chat.
- Chủ dự án sửa code trên điện thoại bằng github.dev và VS Code; lấy bản mới bằng `.\scripts\dong-bo.ps1` (tự bật pull.rebase + autoStash, giữ thay đổi chưa commit, báo khớp `origin/main`). Trợ lý luôn `git pull --rebase` trước khi sửa và trước khi push, và không để lại file chưa commit.

- VS Code: mở thư mục `webmoi`, cài tiện ích **Claude Code** (gợi ý sẵn trong `.vscode/extensions.json`), dùng terminal PowerShell (không dùng terminal Kali của dev-container). Ctrl+Shift+P > Tasks: Run Task > "Đồng bộ GitHub" hoặc "Kiểm tra web".

## Kiến trúc
- Web tĩnh (HTML/CSS/JS thuần, không framework) chạy trên **GitHub Pages**: https://lytaothoc1503.github.io/webmoi/ (đẩy lên `main` là web tự cập nhật sau 1-3 phút).
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
`admin.html` có 2 nhóm cân bằng: Homestay & Coffee (đơn, phòng, trải nghiệm, đánh giá, ảnh, FAQ) và Tài chính (Đối soát, Hoàn trả, Thu chi). Dùng chung tài khoản admin (`is_admin()`). Bảng `finance_entries`, `refunds` tạo bằng `supabase/migrations/20261011000000_finance_tables.sql` (RLS chỉ admin; đã chạy trong SQL Editor ngày 11/10, 3 bảng + trigger + RLS đã xác nhận; trợ lý bị chặn tự tạo bảng). Tên hệ thống quản trị: "Hệ Thống Đối soát & Xử lý Hoàn trả" (logo riêng, màu xanh teal + cam; mục Đối soát có nút "Phiếu" mở Phiếu xác nhận in/lưu PDF, ô người lập và kế toán tự điền tay, KHÔNG ghi có API VNPAY/thuế vì chưa có thật) (KHÔNG dùng tên/nhãn VNPAY hay tổ chức thật khác, vì web này không phải cổng của họ). Mục "Biểu Mẫu" (`bieu-mau.js`, nhóm: Khách đặt phòng / Hoàn trả / Ủy quyền / Bộ hồ sơ in một lần; có sẵn tin nhắn gửi khách; nút "Phiếu / Gửi khách" ở Đối soát): Phiếu xác nhận đặt phòng khổ ngang A4 do `phieu.js` vẽ, dùng chung cho admin và trang khách (khách tra mã đơn, đơn thành công thì có nút "Xem / in phiếu" + "Bước tiếp theo"; link `?ma=MÃ` tự mở đơn). CCCD khách chỉ ghi tay/in trên phiếu, KHÔNG lưu CSDL. Link gửi khách là `phieu.html?ma=MÃ` (trang riêng, KHÔNG cần đăng nhập, xem/in/lưu PDF; gọi RPC `track_booking` theo mã). Phiếu chỉ mở được khi đơn đã có trong bảng `bookings`: ở Biểu Mẫu có khung "Đã đồng bộ / Chưa đồng bộ" và nút "Xác nhận tạo đơn" (admin chèn đơn vào `bookings`, ghi `notes` = "[Tạo từ Biểu Mẫu bởi <email> lúc <giờ>]"; đơn đã tạo mà phiếu bị sửa thì hiện cảnh báo "Phiếu khác hệ thống" + nút "Cập nhật đơn theo phiếu này" (thêm "[Sửa từ Biểu Mẫu...]" vào notes), KHÔNG ghi vào `admin_note` vì khách thấy được). Nhận phòng: chỉ người đại diện đặt phòng mang CCCD hoặc VNeID (khách nước ngoài: hộ chiếu); khách đi cùng gửi họ tên + số định danh để nhà khai báo lưu trú (Luật Cư trú 2020 Điều 30 yêu cầu thông tin theo từng người lưu trú; mới đọc phần tóm tắt, chưa đối chiếu văn bản gốc). 6 mẫu in (biên bản hoàn trả cọc đầy đủ/gọn, giấy ủy quyền nhận tiền hoàn, giấy ủy quyền nhận/trả phòng, giấy đề nghị hoàn tiền, phiếu thu), chọn đơn thì tự điền tên/SĐT/mã đơn/số tiền, tiền bằng chữ tự đọc; CCCD, STK chỉ nằm trong trình duyệt, không lưu. Thêm mẫu mới: thêm 1 phần tử vào `TEMPLATES`. Mục "🤖 Trợ Lý AI" trong admin (`ai-tro-ly.js`, `page-ai`): AI làm việc trên DỮ LIỆU CÓ SẴN (đơn, đối soát, hoàn trả, thu chi, đánh giá), KHÔNG tự điền thông tin của khách vào phiếu (chủ dự án đã bác ý đó). Mỗi việc (việc hôm nay, soạn tin nhắn cho đơn, soát đối soát, báo cáo tháng, trả lời đánh giá, báo tiến độ hoàn trả) gom số liệu rồi sao chép sẵn "lời nhờ" để dán vào Gemini/Claude/ChatGPT/Sider; KHÔNG khóa API, KHÔNG gửi STK/CCCD, SĐT che còn 3 số cuối. Sửa file này thì đổi `?v=` ở `admin.html`. AI trả lời khách trên web để sau (cần Cloudflare Worker giữ khóa). Số liệu tài chính chỉ lưu trong Supabase, không để trong file trên GitHub. Hoàn trả chỉ cho đơn admin đã xác nhận nhận tiền (CSDL ép bằng `20261011010000_finance_hardening.sql`: khóa dòng đơn chống hoàn trùng, che STK khi đóng yêu cầu cả Đã hoàn lẫn Từ chối, đơn đã có hoàn thì không xóa/đổi tiền, thu hẹp quyền bảng tài chính; chủ dự án chạy file này trong SQL Editor một lần). Khi bấm "Đã nhận tiền"/"Xác nhận thành công", admin nhập **số tiền thực nhận** (cột `bookings.received_amount`, file `20261011050000_received_amount.sql`); hoàn trả và doanh thu tính theo số này, đơn cũ chưa có thì dùng giá đơn. Hoàn trả bắt buộc nhập mã booking trên Phiếu xác nhận của khách để đối chiếu với đơn đang chọn (không khớp hoặc để trống thì chỉ nhắc, admin chọn Tiếp tục hoặc Hủy, KHÔNG chặn quyền admin; kết quả đối chiếu ghi vào lý do; biên bản hoàn trả cũng có dòng đối chiếu). Hoàn trả có STK nhận hoàn (bắt buộc ngân hàng, STK 6-20 số, tên chủ TK, lý do), CSDL ép: không hoàn quá số đã thu, yêu cầu đã đóng không sửa/xóa, đã hoàn thì chỉ giữ 4 số cuối STK; mọi thay đổi tự ghi vào `finance_audit` (không lưu STK đầy đủ); CSV xuất ra chống chèn công thức. Mỗi yêu cầu hoàn có nút "Tiến độ" mở Thẻ tiến độ (5 bước: Đã tiếp nhận, Đang đối chiếu, Đã duyệt - chuẩn bị chuyển, Đã chuyển khoản, Hoàn tất; câu "Nhà đang làm / Bạn cần làm" dễ hiểu, giờ từng bước, STK che) để admin chụp màn hình gửi khách; chuyển bước bằng nút, bước 5 tự đặt khi bấm Đã hoàn. Cột `step`, `step_log` do `20261011040000_refund_progress.sql` (chủ dự án chạy 1 lần; trigger ép chỉ tiến từng bước, giờ do máy chủ ghi). Chưa chạy file này thì thẻ vẫn hiện nhưng không chuyển bước được. Tham khảo ý tưởng từ dự án riêng Mây Ledger (không dùng chung code).

## Khóa đăng nhập quản trị (PIN + mã 2 bước, không lưu phiên)
`auth.html` đăng nhập 3 lớp: mật khẩu, rồi mã 6 số ứng dụng xác thực (TOTP, nếu admin đã bật ở mục "🔐 Bảo Mật"), rồi mã PIN 6-8 số. PIN và TOTP do **máy chủ** kiểm (`supabase/migrations/20261011030000_admin_pin_mfa.sql`, chủ dự án chạy 1 lần trong SQL Editor): `is_admin()` (dùng trong mọi RLS) chỉ đúng khi phiên đã qua PIN (bảng `admin_pin_sessions`, 12 giờ) và đã aal2 nếu có TOTP; PIN băm bcrypt, sai 5 lần khóa 15 phút tăng dần; chưa đặt PIN thì lần đầu vào được và bị bắt đặt PIN ngay. Nếu chưa chạy file SQL này thì `auth.html` báo lỗi lúc gọi `admin_status` (phải chạy trước khi dùng).
`admin-auth.js` tạo client Supabase cho admin: phiên chỉ nằm trong `sessionStorage` (khóa `nca-admin-auth`), không dùng localStorage; `admin.html` tự xóa phiên khi rời trang/tải lại (`pagehide`), sau 15 phút không thao tác, hoặc bấm Đăng xuất (gọi `admin_end_session` + signOut). Ô nhập đặt `autocomplete` để trình duyệt không nhớ. Mất điện thoại 2 bước: xóa yếu tố MFA ở Supabase Authentication > Users. Test: `/home/claude/work/pin_test.py` (cần mock Supabase có các RPC `admin_*`).

## Thông tin thanh toán chỉ hiện đúng chỗ
STK/QR chỉ hiện cho khách có đơn đang **chờ chuyển khoản** (cửa sổ đơn ở `app.js` khi trạng thái Chờ thanh toán; phiếu `phieu.js` chỉ khi `còn lại > 0` và tổng > 0, tắt được bằng `hideBank:true`). KHÔNG hiện ở trang chủ, đơn đã thanh toán đủ/đã hủy, phiếu thu, hoàn trả, biên bản, giấy ủy quyền. Thêm chỗ hiển thị STK mới phải theo đúng quy tắc này.

## Quy tắc khi sửa
00. Trình duyệt khách lưu tạm file JS (GitHub Pages cache ~10 phút, có máy giữ lâu hơn). `index.html` và `phieu.html` gọi script kèm `?v=...`; khi sửa `config.js`, `data.js`, `app.js`, `phieu.js`, `account.js`, `i18n.js` thì ĐỔI số `v` trong 2 file này để khách nhận bản mới ngay.
0. KHÔNG hiện ngày/giờ "cập nhật" lên web (chủ dự án tự chủ động khi có thông tin mới).
1. `git pull --rebase` trước khi làm.
2. Không để chữ "mẫu" hay dữ liệu thử hiển thị cho khách (cờ `catalogIsSample`, `storyIsSample`, `policyIsSample` trong `data.js` phải là `false`).
3. Mọi chuỗi chèn vào `innerHTML` phải đi qua `esc()`.
4. Kiểm tra cả điện thoại (390px) và máy tính (1366px) sau khi sửa giao diện.
5. Commit tiếng Việt ngắn gọn rồi `git push`.

## Trạng thái hiện tại
**Đã có:** đặt phòng + QR, tra cứu đơn, đăng ký SĐT, tiếng Anh, thư viện ảnh thật, tour/dịch vụ công khai, SEO cơ bản (canonical, sitemap, schema), RLS.

**Chờ chủ dự án cung cấp:** tài khoản ngân hàng thật, Gmail nhận đơn, giá thật tour/dịch vụ, câu chuyện chủ nhà thật, chính sách hoàn hủy thật, video giới thiệu, link Messenger.

**Chờ tiền/điều kiện:** mua tên miền (dự kiến `nhacuaantaxua.com`, giá .com khoảng 309-429 nghìn đồng/năm ở Tenten, chưa mua), Cloudflare (DNS, HTTPS, chống DDoS, email theo tên miền), đăng nhập Facebook/Google.

**Chờ chủ dự án làm:** đổi mật khẩu admin (đang yếu) và bật 2FA GitHub/Supabase; tạo Cloudflare Turnstile rồi gửi **Site Key** (thứ tự: bật Site Key trên web trước, dán Secret vào Supabase `TURNSTILE_SECRET` sau).

## Kiểm tra tự động (CI)
Chỉ giữ 1 quy trình `kiem-tra.yml` (đã bỏ `jekyll-docker.yml` vì web là HTML tĩnh, GitHub Pages tự build). File trong `supabase/migrations/` đã chạy rồi thì KHÔNG sửa hay dán đè; muốn đổi thì tạo file mới.
`.github/workflows/kiem-tra.yml` chạy `node scripts/kiem-tra.js` mỗi lần đẩy lên `main`: cú pháp JS, ảnh trong `data.js` có file thật, cờ "mẫu" = false, không có khóa bí mật. Chỉ báo lỗi, không chặn đưa web lên GitHub Pages. Chạy tay: `node scripts/kiem-tra.js`.

## Việc đang làm (cập nhật 11/10)
- **Xong:** phần A (bỏ nhãn "mẫu"), B (ảnh, giao diện sáng), C (rà soát điện thoại/máy tính, đồng bộ dữ liệu), khóa admin PIN + 2 bước, hoàn trả + thẻ tiến độ (SQL đã chạy), số thực nhận (SQL đã chạy), phiếu `phieu.html?ma=`, STK MB + QR chỉ hiện đúng chỗ, chống cache `?v=`, cấu hình VS Code + Claude Code. Danh sách tiến độ cũ hiện trong VS Code ("Đang làm phần B") là bản cũ, bỏ qua.
- **Không còn việc nào chờ trợ lý.** Mọi mục còn lại ở dưới đều cần thông tin hoặc hành động từ chủ dự án.
- **Đăng nhập Facebook/Google:** nút đang ẩn (`socialLogin` trong `config.js` = false) vì chưa cấu hình nhà cung cấp trong Supabase. Khi có tên miền và đã bật Providers thì đổi thành true.
- **Nguồn nội dung (đã chốt Hướng 1):** `data.js` là nơi sửa giá/ảnh/mô tả. Các bảng Supabase `rooms/tours/gallery/faq/reviews` để TRỐNG; nếu có dữ liệu thì web dùng dữ liệu đó thay hoàn toàn `data.js`. Chuyển sang Supabase (Hướng 2) làm sau, khi lượng khách tăng: xem `supabase/ke-hoach/README.md`.

## Việc còn lại (nhắc chủ dự án khi phù hợp)
-1. (Xong 11/10) Link Messenger: `contacts.messenger` = m.me/mã Trang (lấy từ link Meta Business của chủ nhà); chính sách hoàn hủy thật: chủ dự án đã đồng ý bản hiện có trên web. Dịch vụ "Thuê xe máy" và "Hỗ trợ hành lý & đưa đón" tạm ẩn trong `servicesPaused` (data.js) chờ xác nhận đăng ký ngành.
-2. Đo lượt xem: `config.js` > `analyticsToken` (Cloudflare Web Analytics, 32 ký tự hex). Chủ dự án tạo site ở Cloudflare > Analytics & Logs > Web Analytics rồi gửi token; để trống thì không nạp gì.
0. Tên chủ tài khoản MB (`config.js` > `bank.accountName`): chủ dự án nói tên là "CONG TY CNHH KE TAO" (chưa rõ có phải TNHH không, và đây là tài khoản công ty trong khi nhà là hộ kinh doanh) và sẽ xác nhận lại vào thứ Sáu 16/10; CHƯA điền, chờ chữ chính xác; ảnh thật 7 địa điểm chưa có ảnh (Cây táo mèo, Đầu Rùa, Cá Heo, thảo nguyên, ngắm sao, đồi chè, rừng rêu); đối chiếu và xác nhận đơn `NAPYCT3TMX` (đã chuyển khoản, chờ xác nhận).
1. Giá thật tour/dịch vụ (đang là giá tạm trong `data.js`; giá phòng đã là giá thật của chủ nhà).
2. (Xong) Phòng: chủ nhà xác nhận chỉ có 1 hạng phòng; ảnh lấy từ Drive của chủ nhà.
3. Lỗi "tiện ích": chủ dự án chưa nói rõ mục nào (dịch vụ không có nút đặt? hay dòng ✓ dưới mỗi phòng?).
4. Ngân hàng thật, Gmail nhận đơn, câu chuyện chủ nhà, chính sách hoàn hủy thật, video, link Messenger.
5. Đổi mật khẩu admin + bật 2FA; Turnstile Site Key; mua tên miền rồi bật Facebook/Google.
6. Hướng 2 (chuyển nội dung sang Supabase): làm sau khi khách đông, xem `supabase/ke-hoach/`.

## Điểm bảo mật đã rà (không cần sửa)
Đã siết CSDL bằng `supabase/migrations/20261009000000_harden_bookings_and_grants.sql` (đã áp dụng): bỏ quyền thừa của khách chưa đăng nhập, giới hạn giá/độ dài/ngày của đơn. Chưa kiểm tra giá phía máy chủ vì giá nằm ở `data.js` (làm khi chuyển Hướng 2).
RLS bật cả 7 bảng; mã đơn 8 ký tự ngẫu nhiên; tra cứu theo SĐT chỉ trả thông tin tối thiểu; không có khóa bí mật trong code/lịch sử git; hàm đăng ký có giới hạn theo IP. Chấp nhận có chủ ý: đăng ký SĐT không xác minh.
