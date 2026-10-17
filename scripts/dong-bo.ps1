# Đồng bộ máy này với GitHub: lấy bản mới nhất, giữ nguyên thay đổi chưa commit.
# Cách chạy trong terminal VS Code (PowerShell):  .\scripts\dong-bo.ps1
git config pull.rebase true
git config rebase.autoStash true
git pull
if ($LASTEXITCODE -ne 0) { Write-Host "Có xung đột. Báo cho trợ lý, đừng tự xóa file." -ForegroundColor Yellow; exit 1 }
$a = git rev-parse HEAD; $b = git rev-parse origin/main
if ($a -eq $b) { Write-Host "Đã khớp GitHub ($($a.Substring(0,7)))." -ForegroundColor Green }
else { Write-Host "Máy có commit chưa đẩy. Chạy: git push" -ForegroundColor Yellow }
git status -sb

PS C:\...\webmoi\cloudflare\thong-bao>
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
