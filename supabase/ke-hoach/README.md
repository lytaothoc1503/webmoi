# Kế hoạch chuyển nội dung sang Supabase (Hướng 2) — CHƯA ÁP DỤNG

Hiện web lấy nội dung từ `data.js`. Khi lượng khách tăng và cần sửa giá/ảnh ngay trong trang quản trị, làm theo thứ tự:

1. Chạy `1_them_cot_va_bang_dich_vu.sql` trong Supabase → SQL Editor (thêm cột chi tiết, bảng dịch vụ, quyền đọc cho khách đã đăng nhập).
2. Chạy `2_nap_du_lieu_tu_data_js.sql` (chỉ nạp khi bảng còn trống). Trước đó cập nhật `data.js` bằng giá/ảnh thật rồi tạo lại file này.
3. Sửa `app.js` (đọc bảng `services`, các cột mới) và `admin.html` (form sửa các cột mới, thêm tab dịch vụ), kiểm tra lại điện thoại + máy tính.

Hai file này nằm ngoài `migrations/` có chủ ý để không bị nhầm là đã áp dụng.
