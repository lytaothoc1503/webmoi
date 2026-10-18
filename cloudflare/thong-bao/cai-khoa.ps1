# Cài khóa cho Worker anhomestay-web (báo đơn qua Gmail). Chạy 1 lần, hoặc khi nghi lộ khóa / đổi Gmail nhận.
# Cách chạy (terminal VS Code, ở thư mục webmoi):  npm run thong-bao:khoa
#   (hoặc ghi sẵn Gmail:  npm run thong-bao:khoa -- -Email ten@gmail.com)
# Script tự: tạo NOTIFY_KEY ngẫu nhiên, đặt secret NOTIFY_KEY + NOTIFY_EMAIL_TO cho Worker, gửi thử 1 email,
# rồi chép sẵn link NOTIFY_WEBHOOK_URL vào bộ nhớ tạm để dán vào Supabase. Khóa KHÔNG hiện ra màn hình, KHÔNG ghi ra file.
param([string]$Email)
$ErrorActionPreference = 'Stop'
chcp 65001 > $null
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$OutputEncoding = [Text.UTF8Encoding]::new($false)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Set-Location (Join-Path $PSScriptRoot '..\..')   # thư mục gốc webmoi (nơi có wrangler trong node_modules)
$cauHinh = 'cloudflare/thong-bao/wrangler.jsonc'
$worker = 'https://anhomestay-web.h30188410.workers.dev'
# Gọi thẳng node (KHÔNG qua npx: npx.cmd trên PowerShell 5.1 làm mất dữ liệu đưa qua đường ống -> "No content found")
$wr = Join-Path (Get-Location) 'node_modules/wrangler/bin/wrangler.js'

function Dung($loi) { Write-Host $loi -ForegroundColor Red; exit 1 }
if (-not (Test-Path $wr)) { Dung 'Chưa cài wrangler. Chạy "npm install" rồi chạy lại script.' }

if (-not $Email) { $Email = Read-Host 'Gmail nhận báo đơn (phải là địa chỉ đã xác nhận trong Cloudflare Email Routing)' }
$Email = $Email.Trim()
if ($Email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { Dung 'Địa chỉ email không đúng dạng. Chưa đặt gì.' }

# Địa chỉ nhận phải được xác nhận trong Email Routing, nếu không Cloudflare từ chối gửi
# Cảnh báo "open beta" của wrangler ghi ra stderr: tạm tắt chế độ dừng để PowerShell 5.1 không coi nó là lỗi
$ErrorActionPreference = 'Continue'
$ds = (node $wr email routing addresses list 2>$null | Out-String)
$ErrorActionPreference = 'Stop'
if ($ds -notmatch [regex]::Escape($Email)) { Dung "Email $Email chưa có trong Cloudflare > Email Routing > Destination addresses. Thêm và bấm link xác nhận trong hộp thư rồi chạy lại." }

# NOTIFY_KEY ngẫu nhiên 32 byte (64 ký tự hex)
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$khoa = -join ($b | ForEach-Object { $_.ToString('x2') })

Write-Host '1) Đặt secret cho Worker...' -ForegroundColor Cyan
$json = @{ NOTIFY_KEY = $khoa; NOTIFY_EMAIL_TO = $Email } | ConvertTo-Json -Compress
# Ghi khóa ra file tạm trong thư mục Temp riêng của người dùng, đưa cho wrangler rồi XÓA NGAY
# (đưa qua đường ống vào node khi chạy bằng npm bị rỗng -> "No content found")
$tmp = Join-Path $env:TEMP ('nca-' + [guid]::NewGuid().ToString('N') + '.json')
[IO.File]::WriteAllText($tmp, $json, [Text.UTF8Encoding]::new($false))
$ErrorActionPreference = 'Continue'
try { $ra = (node $wr secret bulk $tmp --config $cauHinh 2>&1 | Out-String); $ma = $LASTEXITCODE } finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
$ErrorActionPreference = 'Stop'
if ($ma -ne 0 -or $ra -match 'ERROR') { Dung 'Wrangler báo lỗi khi đặt secret (chạy "npx wrangler login" rồi chạy lại script).' }
Write-Host '   Đã đặt NOTIFY_KEY, NOTIFY_EMAIL_TO.' -ForegroundColor Green

Write-Host '2) Gửi thử 1 email qua Worker...' -ForegroundColor Cyan
$link = "$worker/?k=$khoa"
$noiDung = @{ text = "Thử báo đơn từ Nhà của An`nWorker đã nối Gmail thành công. Từ giờ có đơn mới hoặc khách báo đã chuyển khoản, nhà sẽ nhận email như thế này." } | ConvertTo-Json -Compress
$ok = $false
for ($lan = 1; $lan -le 5 -and -not $ok; $lan++) {   # secret mới cần vài giây để có hiệu lực
  try { Invoke-RestMethod -Method Post $link -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($noiDung)) | Out-Null; $ok = $true } catch { Start-Sleep -Seconds 3 }
}
if (-not $ok) { Dung 'Worker chưa nhận được tin thử. Đợi 1 phút rồi chạy lại script.' }
Write-Host "   Đã gửi. Kiểm tra hộp thư $Email (có thể nằm trong Spam/Quảng cáo lần đầu)." -ForegroundColor Green

Set-Clipboard -Value $link
Write-Host ''
Write-Host '3) VIỆC CUỐI (bắt buộc, vì NOTIFY_KEY vừa đổi):' -ForegroundColor Yellow
Write-Host '   Supabase > Edge Functions > Secrets > NOTIFY_WEBHOOK_URL: dán đè giá trị (link đã chép sẵn, bấm Ctrl+V) > Save.'
Write-Host '   Chưa làm bước này thì web chưa báo đơn được.'
