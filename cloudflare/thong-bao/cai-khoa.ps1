# Cài khóa cho Worker anhomestay-web (báo đơn qua Telegram) (chạy 1 lần, hoặc khi đổi bot / nghi lộ khóa).
# Cách chạy (terminal VS Code, ở thư mục webmoi):  npm run thong-bao:khoa
# Script tự: kiểm token, lấy Chat ID, tạo NOTIFY_KEY mạnh, đặt 3 secret cho Worker, gửi thử 1 tin,
# rồi chép sẵn link NOTIFY_WEBHOOK_URL vào bộ nhớ tạm để dán vào Supabase.
# Token/khóa KHÔNG hiện ra màn hình, KHÔNG ghi ra file. Không dán token vào chat.
$ErrorActionPreference = 'Stop'
chcp 65001 > $null
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$OutputEncoding = [Text.UTF8Encoding]::new($false)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Set-Location (Join-Path $PSScriptRoot '..\..')   # thư mục gốc webmoi (nơi có wrangler trong node_modules)
$cauHinh = 'cloudflare/thong-bao/wrangler.jsonc'
$worker = 'https://anhomestay-web.h30188410.workers.dev'

function Dung($loi) { Write-Host $loi -ForegroundColor Red; exit 1 }
function DocAn($nhan) {
  $s = Read-Host $nhan -AsSecureString
  $p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)).Trim() } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }
}

Write-Host '1) Mở Telegram > @BotFather > /revoke (nếu token cũ từng lộ) để lấy token MỚI.' -ForegroundColor Cyan
$token = DocAn 'Dán token bot mới (gõ ẩn) rồi Enter'
if ($token -notmatch '^\d{6,}:[A-Za-z0-9_-]{30,}$') { Dung 'Token không đúng dạng (số:chuỗi). Chưa đặt gì.' }
$tg = "https://api.telegram.org/bot$token"
try { $me = Invoke-RestMethod "$tg/getMe" } catch { Dung 'Telegram từ chối token này (sai hoặc đã bị thu hồi). Chưa đặt gì.' }
$tenBot = $me.result.username
Write-Host "   Token đúng: bot @$tenBot" -ForegroundColor Green

Write-Host "2) Mở Telegram, nhắn 1 tin bất kỳ (ví dụ: chao) cho @$tenBot từ tài khoản sẽ NHẬN báo đơn." -ForegroundColor Cyan
$chatId = $null
for ($lan = 1; $lan -le 3 -and -not $chatId; $lan++) {
  Read-Host '   Nhắn xong thì bấm Enter'
  try { $u = Invoke-RestMethod "$tg/getUpdates" } catch { Dung 'Không đọc được tin của bot (bot có thể đang gắn webhook khác). Chưa đặt gì.' }
  $tin = @($u.result | Where-Object { $_.message -and $_.message.chat.type -eq 'private' }) | Select-Object -Last 1
  if ($tin) { $chatId = [string]$tin.message.chat.id } else { Write-Host '   Chưa thấy tin nhắn. Nhắn lại cho bot rồi bấm Enter.' -ForegroundColor Yellow }
}
if (-not $chatId) { Dung 'Không lấy được Chat ID. Chưa đặt gì.' }
Write-Host "   Chat ID: $chatId (của $($tin.message.chat.first_name))" -ForegroundColor Green

# NOTIFY_KEY ngẫu nhiên 32 byte (64 ký tự hex), mạnh hơn nhiều so với khóa tự đặt
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$khoa = -join ($b | ForEach-Object { $_.ToString('x2') })

Write-Host '3) Đặt 3 secret cho Worker...' -ForegroundColor Cyan
# Dùng "secret bulk" qua JSON: không bị dính ký tự xuống dòng như "echo ... | secret put" trên PowerShell
$json = @{ TELEGRAM_BOT_TOKEN = $token; TELEGRAM_CHAT_ID = $chatId; NOTIFY_KEY = $khoa } | ConvertTo-Json -Compress
$json | npx --no-install wrangler secret bulk --config $cauHinh | Out-Null
if ($LASTEXITCODE -ne 0) { Dung 'Wrangler báo lỗi khi đặt secret (chạy "npx wrangler login" rồi chạy lại script).' }
Write-Host '   Đã đặt TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, NOTIFY_KEY.' -ForegroundColor Green

Write-Host '4) Gửi thử 1 tin qua Worker...' -ForegroundColor Cyan
$link = "$worker/?k=$khoa"
$noiDung = @{ text = 'Thử báo đơn từ Nhà của An: Worker đã nối Telegram thành công.' } | ConvertTo-Json -Compress
$ok = $false
for ($lan = 1; $lan -le 5 -and -not $ok; $lan++) {   # secret mới cần vài giây để có hiệu lực
  try { Invoke-RestMethod -Method Post $link -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($noiDung)) | Out-Null; $ok = $true } catch { Start-Sleep -Seconds 3 }
}
if (-not $ok) { Dung 'Worker chưa gửi được tin. Đợi 1 phút rồi chạy lại script.' }
Write-Host '   Đã gửi. Kiểm tra Telegram xem có tin thử không.' -ForegroundColor Green

Set-Clipboard -Value $link
Write-Host ''
Write-Host '5) VIỆC CUỐI (bắt buộc, vì NOTIFY_KEY vừa đổi):' -ForegroundColor Yellow
Write-Host '   Supabase > Edge Functions > Secrets > NOTIFY_WEBHOOK_URL: dán đè giá trị (link đã chép sẵn, bấm Ctrl+V) > Save.'
Write-Host '   Chưa làm bước này thì web chưa báo đơn được.'
