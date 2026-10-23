# Nhà của An Homestay Tà Xùa

Web giới thiệu và nhận đặt phòng của **Nhà của An Homestay** (Tà Xùa, Bắc Yên, Sơn La): https://nhacuaantaxua.com/

Web tĩnh (HTML/CSS/JS thuần, không framework, không bước build) chạy trên GitHub Pages, qua Cloudflare. Dữ liệu động (đơn, tài khoản, quản trị) dùng Supabase. Đẩy lên `main` là web tự cập nhật sau 1-3 phút.

## Tính năng
- Giới thiệu phòng, Coffee, Khám phá Tà Xùa, thư viện ảnh, FAQ, đánh giá; tiếng Việt và tiếng Anh (nút VI | EN).
- Đặt phòng, tính giá theo thứ trong tuần, mã QR chuyển khoản, tra cứu đơn bằng mã, phiếu xác nhận (`phieu.html?ma=MÃ`) để xem, in, tải ảnh.
- Tài khoản khách đăng ký bằng số điện thoại.
- Quản trị (`admin.html`, bấm 3 lần vào logo): đơn, phòng, đánh giá, ảnh, tài chính (đối soát, hoàn trả, thu chi), Biểu Mẫu, cài đặt chung. Đăng nhập mật khẩu + mã 2 bước + PIN.
- Trang Biểu Mẫu riêng cho đối tác/Sale (`fuli8386.html`), mỗi đối tác chỉ thấy đơn được giao.
- Báo chủ nhà qua Gmail khi có đơn mới (Cloudflare Worker, `cloudflare/thong-bao/`).

## Cấu trúc thư mục
| Đường dẫn | Vai trò |
| --- | --- |
| `index.html`, `app.js`, `account.js`, `i18n.js` | Trang chủ, đặt phòng, tra cứu, tài khoản, bản dịch |
| `config.js` | Liên hệ, giờ nhận/trả phòng, ngân hàng, khóa công khai Supabase |
| `data.js` | Phòng, giá, dịch vụ, chính sách, FAQ, ảnh (nơi sửa nội dung) |
| `admin.html`, `auth.html`, `admin-auth.js` | Quản trị và đăng nhập quản trị |
| `phieu.html`, `phieu.js`, `bieu-mau.js` | Phiếu xác nhận và các mẫu in |
| `fuli8386.html` | Trang Biểu Mẫu cho đối tác |
| `chinh-sach.html`, `san-may-ta-xua.html` | Chính sách hoàn hủy, bài hướng dẫn săn mây |
| `supabase/migrations/` | SQL tạo bảng và quyền (chạy tay theo thứ tự tên file) |
| `supabase/functions/` | Edge Functions: `customer-signup`, `notify-booking`, `partner-invite` |
| `cloudflare/thong-bao/` | Worker báo đơn qua Gmail và kho ảnh R2 |
| `scripts/` | `kiem-tra.js` (kiểm tra tự động), `dong-bo.ps1` (đồng bộ GitHub) |
| `images/`, `vendor/` | Ảnh (ưu tiên `.webp`) và thư viện tự host |

## Chạy thử trên máy
```bash
npm install
npm start                  # servor, tự tải lại khi sửa file
node scripts/kiem-tra.js   # kiểm tra cú pháp JS, ảnh, cờ dữ liệu mẫu, khóa bí mật
```
Kiểm tra giao diện bằng trình duyệt ở 390px (điện thoại) và 1366px (máy tính).

## Sửa nội dung
- Giá, phòng, ảnh, mô tả: `data.js`. Liên hệ, giờ nhận/trả, ngân hàng: `config.js` (hoặc mục "Cài Đặt Chung" trong admin).
- Sửa `config.js`, `data.js`, `app.js`, `phieu.js`, `account.js`, `i18n.js` thì đổi số `?v=` trong các file HTML gọi chúng để khách nhận bản mới ngay.
- Chữ Việt mới hiển thị cho khách cần thêm bản Anh trong `i18n.js`. Mọi chuỗi chèn vào `innerHTML` phải qua `esc()`.
- Hướng dẫn từng bước cho chủ nhà: [HUONG-DAN-SUA.md](HUONG-DAN-SUA.md).

## Cài đặt Supabase (làm 1 lần)
1. SQL Editor: chạy các file trong `supabase/migrations/` theo thứ tự tên file (file đã chạy rồi thì không sửa; muốn đổi thì tạo file mới).
2. Authentication: tạo tài khoản admin, **tắt Allow new users to sign up**.
3. Settings > API: dán **Project URL** và **anon public key** vào `config.js`. Tuyệt đối không dùng `service_role` hay mật khẩu CSDL trong code.
4. Điền thông tin liên hệ và ngân hàng trong `config.js`.
5. `git push` lên `main`.

## Luồng đơn
Chờ thanh toán → (khách bấm "Tôi đã chuyển khoản") Đã thanh toán - chờ xác nhận → (admin đối chiếu sao kê, xác nhận) Đặt phòng thành công → Hoàn thành, hoặc Hủy đơn. Ngoài ra có trạng thái "Sai nội dung chuyển khoản" và "Cần liên hệ nhà".

Hệ thống **không** kết nối API ngân hàng: admin tự kiểm tra sao kê rồi xác nhận. Mã đơn 8 ký tự chính là nội dung chuyển khoản.

## Quy tắc quan trọng
- Không ghi mật khẩu, khóa bí mật, mã đơn, tên/SĐT khách hay số liệu tiền thật vào repo: GitHub Pages đăng công khai mọi file.
- Chỉ dùng ảnh và thông tin của chính Nhà của An; không ghi nguồn bên ngoài lên web.
- Web không bán tour có hướng dẫn viên (cờ `toursBookable` = false) vì chủ nhà là hộ kinh doanh cá thể.

## Tài liệu liên quan
- [CLAUDE.md](CLAUDE.md): kiến trúc chi tiết, quy trình làm việc, danh sách việc còn lại (dành cho trợ lý).
- [HUONG-DAN-SUA.md](HUONG-DAN-SUA.md): hướng dẫn sửa nhanh cho chủ nhà.
- [SECURITY.md](SECURITY.md), [TASKS.md](TASKS.md): bản cũ, không dùng để theo dõi việc.
