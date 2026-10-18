# Worker `anhomestay-web` (báo đơn Telegram + kho ảnh R2)

Luồng báo đơn: đơn mới/khách báo chuyển khoản -> trigger DB -> Edge Function `notify-booking` -> **Worker này** -> Queue `notify-telegram-queue` -> Telegram của chủ nhà (Telegram lỗi thì Queue tự gửi lại sau 30 giây, tối đa 5 lần, giữ tin 24 giờ).
Kho ảnh R2 (bucket `banhfuli`, route `nhacuaantaxua.com/webmoi/*`): xem file thì ai cũng xem được; tải lên/xóa phải có header `Authorization: Bearer <UPLOAD_KEY>` (chưa đặt secret `UPLOAD_KEY` = khóa hẳn).
Cấu hình: `wrangler.jsonc` (file duy nhất). Link: https://anhomestay-web.h30188410.workers.dev

## Cài / đổi khóa (PowerShell, ở thư mục `webmoi`)
```powershell
npx wrangler login        # lần đầu trên máy
npm run thong-bao         # đưa code Worker lên (chỉ khi sửa index.js)
npm run thong-bao:khoa    # dán token bot (gõ ẩn) -> tự lấy Chat ID, tạo NOTIFY_KEY mạnh, đặt 3 secret, gửi tin thử
```
Script chép sẵn link `NOTIFY_WEBHOOK_URL` vào bộ nhớ tạm: dán đè vào Supabase > Edge Functions > Secrets > `NOTIFY_WEBHOOK_URL` (bắt buộc mỗi lần chạy script, vì NOTIFY_KEY đổi mới).
Token lộ ở đâu (chat, ảnh chụp...) thì vào @BotFather `/revoke` rồi chạy lại `npm run thong-bao:khoa`.
Không ghi token/khóa vào code hay chat.
