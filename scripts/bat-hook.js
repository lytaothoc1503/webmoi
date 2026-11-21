// Bật hook trong repo này. Không làm gì nếu thư mục không phải git.
const { spawnSync } = require('child_process');
if (spawnSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' }).status !== 0) process.exit(0);
const set = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
process.exit(set.status || 0);
