# TASKS: chia việc cho 2 máy Win 11

Quy ước chung
- Đồng bộ bằng Git, không dùng OneDrive/Drive để sync code.
- Mỗi máy 1 nhánh riêng, merge vào `main` qua PR. Không sửa chung 1 file cùng lúc.
- Khóa bí mật để trong `.env` từng máy (đã có trong `.gitignore`). Không dán `service_role` vào `config.js`.
- Chạy thử trên máy: `npm install && npm start` (servor, tự reload).
- Mỗi lần bắt đầu làm: `git pull`. Làm xong: commit nhỏ, push, ghi trạng thái vào bảng dưới.

Mức ưu tiên: P0 = làm ngay (ảnh hưởng doanh thu/an toàn), P1 = tuần này, P2 = khi rảnh.

## Máy A: Xây dựng (nhánh `feat/...`)

| # | Ưu tiên | Việc | File | Xong khi |
|---|---|---|---|---|
| A1 | P0 | Điền thông tin liên hệ thật: `phone`, `zalo`, `email` (đang trống) | `config.js` | Nút gọi/Zalo/email hiện và bấm được |
| A2 | P0 | Thay tài khoản ngân hàng THỬ NGHIỆM bằng tài khoản thật của nhà | `config.js` | QR chuyển khoản ra đúng tên chủ nhà |
| A3 | P0 | Thay dữ liệu MẪU: giá phòng/tour (đang 0 = "Liên hệ"), giờ nhận/trả phòng | `data.js`, `config.js` | Không còn giá 0 hoặc chữ "mẫu" |
| A4 | P1 | Quay/đặt video banner (~8 giây, dưới 3MB, không tiếng) và video giới thiệu | `images/`, `config.js` (`heroVideo`, `introVideo`) | Video chạy mượt trên điện thoại |
| A5 | P1 | Viết chính sách hoàn/hủy và câu chuyện chủ nhà thật (đang là mẫu) | `data.js`, `chinh-sach.html` | Chủ nhà duyệt nội dung |
| A6 | P1 | Bật Turnstile khi có khóa: điền `turnstileSiteKey`, kiểm tra Edge Function `customer-signup` đã xác thực token | `config.js`, `supabase/functions/customer-signup` | Đăng ký bị chặn nếu không qua Turnstile |
| A7 | P2 | Rà bản English trong `i18n.js` (chữ còn thiếu/lệch nghĩa) | `i18n.js` | Chuyển EN không còn chữ tiếng Việt lẫn |

## Máy B: Kiểm tra và hạ tầng (nhánh `qa/...`, `infra/...`)

| # | Ưu tiên | Việc | Ghi chú | Xong khi |
|---|---|---|---|---|
| B1 | P0 | Kiểm tra bảo mật Supabase: RLS từng bảng, quyền anon, chính sách admin | Dùng advisors của Supabase | Không còn cảnh báo mức cao |
| B2 | P0 | Thử luồng đặt phòng end-to-end: đăng ký SĐT, đặt, chuyển khoản, admin xác nhận, tra cứu đơn | Thử trên điện thoại thật | Cả luồng chạy, không lỗi console |
| B3 | P1 | SEO kỹ thuật: thêm `sitemap.xml`, `robots.txt`; kiểm tra `<title>`, meta description, og:image, JSON-LD (hiện có 1 khối JSON-LD) | Thêm schema `LodgingBusiness`, hreflang vi/en | Rich result test không lỗi |
| B4 | P1 | Chấm UI, UX, Conversion và so với xu hướng 2026 | Mobile trước (khách đặt bằng điện thoại) | Có bảng điểm và 5 việc sửa ưu tiên |
| B5 | P1 | Tốc độ: nén ảnh (WebP, kích thước đúng), lazy load, đo Lighthouse mobile | Thư mục `images/` đang là JPG | Lighthouse mobile Performance trên 85 |
| B6 | P1 | Cloudflare: đưa domain/CDN trước GitHub Pages, tạo khóa Turnstile, bật cache | Gửi khóa cho máy A | Có khóa Turnstile + domain chạy HTTPS |
| B7 | P2 | Dọn `.github/workflows/jekyll-docker.yml` nếu không dùng (site là static, không build) | Tránh workflow lỗi vô ích | CI xanh hoặc bỏ workflow |

## Tự động hóa (gợi ý, làm sau khi A1–A3 xong)

- Đơn mới vào Supabase thì báo ngay qua Gmail/Slack cho chủ nhà (Zapier hoặc Edge Function + webhook).
- Nhắc trước ngày nhận phòng 1 ngày.
- Báo cáo traffic hàng tuần (Supermetrics/GA) gửi vào email.

## Nhật ký trạng thái

| Ngày | Máy | Việc | Trạng thái |
|---|---|---|---|
| | | | |
