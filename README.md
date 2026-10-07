# Nhà của An Homestay Tà Xùa

Web giới thiệu + nhận đặt phòng (Tà Xùa, Bắc Yên, Sơn La).

## Các file
- `config.js`: Facebook, SĐT, Gmail, giờ nhận/trả phòng, **tài khoản ngân hàng (để hiện QR)**, kết nối Supabase.
- `data.js`: phòng, tour, dịch vụ, ảnh, FAQ, chính sách hoàn hủy (một phần là dữ liệu tạm, giá 0 = "Liên hệ"). Sửa xong `git push` là web cập nhật.
- `index.html` + `app.js`: trang chủ, đặt phòng, Tra cứu đơn, lịch sử đơn.
- `admin.html`, `auth.html`: quản trị (đăng nhập bằng Supabase Auth). Mở bằng cách bấm 3 lần vào logo.
- `supabase/migrations/`: chạy lần lượt các file SQL trong Supabase > SQL Editor.

## Cài đặt (làm 1 lần)
1. Supabase: chạy các file SQL theo thứ tự tên file.
2. Authentication > Users > Add user (email + mật khẩu mạnh của bạn). Authentication > Providers/Settings: **tắt Allow new users to sign up**.
3. Settings > API: copy **Project URL** và **anon public key** dán vào `config.js` (KHÔNG dùng service_role, KHÔNG dán mật khẩu DB).
4. Điền `bank` (ngân hàng, STK, tên TK), `phone`, `email` trong `config.js`.
5. `git add . && git commit -m "update" && git push` -> GitHub Pages tự cập nhật sau ~1 phút.

## Luồng đơn
Chờ thanh toán -> (khách bấm "Tôi đã chuyển khoản") Đã thanh toán - chờ xác nhận -> (admin xác nhận) Đặt phòng thành công -> Hoàn thành / Hủy đơn.
Khách nhắn Facebook kèm mã đơn để nhận phiếu xác nhận chính thức. Đánh giá của khách chờ admin duyệt mới hiện lên web.

## Tài liệu cho trợ lý
Xem `CLAUDE.md`: cách làm việc, kiến trúc, quy tắc sửa và trạng thái hiện tại của dự án.
