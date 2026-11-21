// Hook đẩy lên: chỉ chạy kiểm tra đầy đủ khi lần đẩy có file web.
const fs = require('fs');
const { execFileSync, spawnSync } = require('child_process');

if (process.env.SKIP_HOOKS === '1') process.exit(0);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const lines = fs.readFileSync(0, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const web = /(\.(js|mjs|cjs|html|css|sql|json|ts)$)|(^images\/)/;
let need = lines.length === 0;

for (const line of lines) {
  const parts = line.split(/\s+/);
  const localSha = parts[1];
  const remoteSha = parts[3];
  if (!localSha || /^0+$/.test(localSha)) continue;
  if (!remoteSha || /^0+$/.test(remoteSha)) {
    need = true;
    break;
  }
  const names = git(['diff', '--name-only', `${remoteSha}..${localSha}`]);
  if (names.split('\n').some((n) => web.test(n))) need = true;
}

if (!need) {
  console.log('Hook đẩy: không đụng file web, bỏ kiểm tra đầy đủ.');
  process.exit(0);
}

const started = Date.now();
const run = spawnSync(process.execPath, ['scripts/kiem-tra.js'], { stdio: 'inherit' });
if (run.status) process.exit(run.status);
console.log('Hook đẩy: kiểm tra đầy đủ xong trong ' + (Date.now() - started) + ' ms.');
