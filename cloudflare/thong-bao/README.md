# Worker báo đơn mới (Telegram)

Luồng: đơn mới/khách báo chuyển khoản -> trigger DB -> Edge Function `notify-booking` -> **Worker này** -> Telegram của chủ nhà.

## Cài / đổi khóa (PowerShell, ở thư mục `webmoi`)
```powershell
npx wrangler login        # lần đầu trên máy
npm run thong-bao         # đưa code Worker lên (chỉ khi sửa index.js)
npm run thong-bao:khoa    # dán token bot (gõ ẩn) -> tự lấy Chat ID, tạo NOTIFY_KEY mạnh, đặt 3 secret, gửi tin thử
```
Script chép sẵn link `NOTIFY_WEBHOOK_URL` vào bộ nhớ tạm: dán đè vào Supabase > Edge Functions > Secrets > `NOTIFY_WEBHOOK_URL` (bắt buộc mỗi lần chạy script, vì NOTIFY_KEY đổi mới).
Token lộ ở đâu (chat, ảnh chụp...) thì vào @BotFather `/revoke` rồi chạy lại `npm run thong-bao:khoa`.
Không ghi token/khóa vào code hay chat.
