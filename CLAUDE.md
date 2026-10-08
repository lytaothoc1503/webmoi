# Hướng dẫn cho trợ lý (Claude) khi làm việc với dự án này

Chủ dự án: **Thóc** (người Việt, mới học code). Dự án: web **Nhà của An Homestay Tà Xùa** (Tà Xùa, Bắc Yên, Sơn La).

## Cách làm việc với chủ dự án (quan trọng)
- Luôn trả lời **tiếng Việt có dấu đầy đủ**, ngắn gọn, kết luận trước.
- Chủ dự án muốn trợ lý **tự làm** (sửa code, test, commit, push), không giao việc thủ công. Không liệt kê nhiều đề xuất: chỉ hỏi ngắn **có/không**.
- Làm theo từng phần: xong phần nào báo phần đó, chờ chủ dự án đồng ý rồi mới sang phần tiếp.
- Ảnh/đánh giá chủ dự án đưa lên là đã được đồng ý công khai, không cản trở. Không bắt khách phải được duyệt tài khoản thủ công.
- Không ghi mật khẩu, khóa bí mật (`service_role`, Turnstile Secret...) vào code, tài liệu hay chat.
- Chủ dự án sửa code trên điện thoại bằng github.dev; luôn `git pull --rebase` trước khi sửa và trước khi push.

## Kiến trúc
- Web tĩnh (HTML/CSS/JS thuần, không framework) chạy trên **GitHub Pages**: https://lytaothoc1503.github.io/webmoi/ (đẩy lên `main` là web tự cập nhật sau 1-3 phút).
- **Supabase** (project `hkfprewiprdztmdcoxzz`): Postgres + RLS (bật trên cả 7 bảng), Auth, Edge Function `customer-signup`.
- Tài khoản khách: đăng ký bằng **số điện thoại** (email nội bộ `<sđt>@example.com`, không OTP/email), tạo qua Edge Function. Admin tách riêng (`auth.html`, bảng `admins`, `is_admin()`).
- Ngôn ngữ: tiếng Việt mặc định, nút VI | EN; bản dịch nằm trong từ điển của `i18n.js` (chữ Việt mới cần thêm bản Anh).

## File chính
| File | Vai trò |
| --- | --- |
| `config.js` | Liên hệ, giờ nhận/trả phòng, ngân hàng (đang là **tài khoản thử**), video, khóa công khai Supabase, `turnstileSiteKey` |
| `data.js` | Phòng, tour, dịch vụ, câu chuyện, chính sách hoàn hủy, FAQ, đánh giá, thư viện ảnh |
| `index.html`, `app.js`, `account.js` | Trang chủ, đặt phòng, tra cứu đơn, đăng ký/đăng nhập |
| `i18n.js` | Dịch Việt ↔ Anh |
| `admin.html`, `auth.html` | Quản trị (mở bằng cách bấm 3 lần vào logo) |
| `chinh-sach.html` | Chính sách và hoàn hủy |
| `supabase/functions/customer-signup/` | Hàm đăng ký bằng SĐT, có chỗ nối Cloudflare Turnstile (tắt khi chưa có khóa) |
| `supabase/migrations/` | SQL tạo bảng và quyền |

## Quy tắc khi sửa
1. `git pull --rebase` trước khi làm.
2. Không để chữ "mẫu" hay dữ liệu thử hiển thị cho khách (cờ `catalogIsSample`, `storyIsSample`, `policyIsSample` trong `data.js` phải là `false`).
3. Mọi chuỗi chèn vào `innerHTML` phải đi qua `esc()`.
4. Kiểm tra cả điện thoại (390px) và máy tính (1366px) sau khi sửa giao diện.
5. Commit tiếng Việt ngắn gọn rồi `git push`.

## Trạng thái hiện tại
**Đã có:** đặt phòng + QR, tra cứu đơn, đăng ký SĐT, tiếng Anh, thư viện ảnh thật, tour/dịch vụ công khai, SEO cơ bản (canonical, sitemap, schema), RLS.

**Chờ chủ dự án cung cấp:** tài khoản ngân hàng thật, Gmail nhận đơn, giá thật từng phòng/tour/dịch vụ, ảnh thật phòng Gia Đình và Dorm, câu chuyện chủ nhà thật, chính sách hoàn hủy thật, video giới thiệu, link Messenger.

**Chờ tiền/điều kiện:** mua tên miền (dự kiến `nhacuaantaxua.com`, giá .com khoảng 309-429 nghìn đồng/năm ở Tenten, chưa mua), Cloudflare (DNS, HTTPS, chống DDoS, email theo tên miền), đăng nhập Facebook/Google.

**Chờ chủ dự án làm:** đổi mật khẩu admin (đang yếu) và bật 2FA GitHub/Supabase; tạo Cloudflare Turnstile rồi gửi **Site Key** (thứ tự: bật Site Key trên web trước, dán Secret vào Supabase `TURNSTILE_SECRET` sau).

## Việc đang làm (chia phần, mỗi phần chờ chủ dự án đồng ý)
- **A (xong):** bỏ mọi nhãn "mẫu" hiển thị công khai.
- **B (xong, commit `7a883d6`):** ảnh phòng/tour dùng ảnh trong `images/`, ép giao diện sáng (`color-scheme`), bỏ `backdrop-filter` ở hộp thoại, dùng `dvh`. Còn chờ chủ dự án nói rõ lỗi "tiện ích" là mục nào (dịch vụ không có nút đặt? hay dòng ✓ dưới mỗi phòng?).
- **C (xong phần rà soát):** điện thoại 390px và máy tính 1366px cùng dữ liệu (3 phòng, 3 tour, 6 dịch vụ), không tràn ngang, không lỗi JS. Bảng Supabase `rooms/tours/gallery/faq/reviews` đang **trống**, web dùng `data.js` làm nguồn; `bookings` có 2 đơn, `admins` có 1.

## Điểm bảo mật đã rà (không cần sửa)
RLS bật cả 7 bảng; mã đơn 8 ký tự ngẫu nhiên; tra cứu theo SĐT chỉ trả thông tin tối thiểu; không có khóa bí mật trong code/lịch sử git; hàm đăng ký có giới hạn theo IP. Chấp nhận có chủ ý: đăng ký SĐT không xác minh.
