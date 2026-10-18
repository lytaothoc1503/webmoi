# Worker `anhomestay-web` (báo đơn qua Gmail + kho ảnh R2)

Luồng báo đơn: đơn mới/khách báo chuyển khoản -> trigger DB -> Edge Function `notify-booking` -> **Worker này** -> Queue `notify-telegram-queue` (tên cũ, giữ nguyên) -> email về Gmail của chủ nhà qua Cloudflare Email Routing (lỗi thì Queue tự gửi lại sau 30 giây, tối đa 5 lần, giữ tin 24 giờ).
Email gửi từ `baodon@nhacuaantaxua.com`; địa chỉ nhận nằm trong secret `NOTIFY_EMAIL_TO` (không ghi vào repo vì repo công khai) và phải là địa chỉ đã xác nhận ở Cloudflare > Email Routing > Destination addresses.
Kho ảnh R2 (bucket `banhfuli`, route `nhacuaantaxua.com/webmoi/*`): xem file thì ai cũng xem được; tải lên/xóa phải có header `Authorization: Bearer <UPLOAD_KEY>` (chưa đặt secret `UPLOAD_KEY` = khóa hẳn).
Cấu hình: `wrangler.jsonc` (file duy nhất). Link: https://anhomestay-web.h30188410.workers.dev

## Cài / đổi khóa (PowerShell, ở thư mục `webmoi`)
```powershell
npx wrangler login        # lần đầu trên máy
npm run thong-bao         # đưa code Worker lên (chỉ khi sửa index.js)
npm run thong-bao:khoa    # nhập Gmail nhận -> tạo NOTIFY_KEY mới, đặt secret, gửi email thử, chép link cho Supabase
```
Script chép sẵn link `NOTIFY_WEBHOOK_URL` vào bộ nhớ tạm: dán đè vào Supabase > Edge Functions > Secrets > `NOTIFY_WEBHOOK_URL` (bắt buộc mỗi lần chạy script, vì NOTIFY_KEY đổi mới).
Không ghi khóa vào code hay chat.
