// Hook commit: chỉ soi file đang được đưa vào commit. Ảnh và thư viện vendor bỏ qua.
const { execFileSync, spawn } = require('child_process');

if (process.env.SKIP_HOOKS === '1') process.exit(0);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const names = git(['diff', '--cached', '-z', '--name-only', '--diff-filter=ACMR'])
  .split('\0')
  .filter(Boolean)
  .filter((f) => !f.startsWith('vendor/'));

if (!names.length) process.exit(0);

const js = names.filter((f) => f.endsWith('.js'));
const scan = names.filter((f) => /\.(js|mjs|cjs|html|ts)$/.test(f) && !/^scripts\/(hook-|kiem-tra|bat-hook)/.test(f));
const started = Date.now();

function checkSyntax(files) {
  return Promise.all(files.map((f) => new Promise((resolve) => {
    const child = spawn(process.execPath, ['--check', f], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => {
      resolve(code === 0 ? null : `${f}: sai cú pháp JavaScript. ${err.split('\n').slice(0, 2).join(' ')}`);
    });
  })));
}

function scanSecrets(files) {
  const loi = [];
  for (const f of files) {
    let raw = '';
    try { raw = git(['show', `:${f}`]); } catch (e) { continue; }
    const text = raw.split('\n').filter((d) => !/^\s*(\/\/|\/\*|\*|<!--)/.test(d)).join('\n');
    if (/service_role/i.test(text)) loi.push(`${f}: có service_role (khóa bí mật không được commit)`);
    if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./.test(text)) loi.push(`${f}: có chuỗi giống khóa JWT`);
    if (/TURNSTILE_SECRET\s*[:=]\s*['"][^'"]+/.test(text)) loi.push(`${f}: có Turnstile Secret`);
  }
  return loi;
}

(async () => {
  const syntax = (await checkSyntax(js)).filter(Boolean);
  const secrets = scanSecrets(scan);
  const loi = syntax.concat(secrets);
  if (loi.length) {
    console.error('COMMIT BỊ CHẶN (' + loi.length + '):\n- ' + loi.join('\n- '));
    console.error('Bỏ qua một lần nếu cố ý: SKIP_HOOKS=1 git commit ...');
    process.exit(1);
  }
  console.log('Hook commit: ' + names.length + ' file, ' + (Date.now() - started) + ' ms.');
})();
