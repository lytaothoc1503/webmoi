# Worker báo đơn mới (Telegram)

Luồng: đơn mới/khách báo chuyển khoản -> trigger DB -> Edge Function `notify-booking` -> **Worker này** -> Telegram của chủ nhà.

## Cài một lần (PowerShell, trong thư mục này)
```powershell
npx wrangler login
npx wrangler deploy
npx wrangler secret put NOTIFY_KEY          # chuỗi ngẫu nhiên dài, tự đặt
npx wrangler secret put TELEGRAM_BOT_TOKEN  # lấy từ @BotFather
npx wrangler secret put TELEGRAM_CHAT_ID    # id chat của chủ nhà
```
Rồi đặt secret `NOTIFY_WEBHOOK_URL` trong Supabase = `https://<link-worker>/?k=<NOTIFY_KEY>`.
Không ghi token/khóa vào code hay chat.
