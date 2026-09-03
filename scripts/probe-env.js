// 模拟不同写法，看 Next.js env 加载器会得到什么
const fs = require('fs');
const path = require('path');
const os = require('os');

const cases = [
  'MYSQL_PASSWORD=$$HCFabc786483815',
  'MYSQL_PASSWORD="$$HCFabc786483815"',
  'MYSQL_PASSWORD=\\$\\$HCFabc786483815',
  'MYSQL_PASSWORD="\\$\\$HCFabc786483815"',
  'MYSQL_PASSWORD=$$$$HCFabc786483815',
  "MYSQL_PASSWORD='$$HCFabc786483815'"
];

const nextEnv = require(path.join(process.cwd(), 'node_modules', '@next', 'env', 'dist', 'index.js'));

for (const line of cases) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envtest-'));
  const envFile = path.join(tmpDir, '.env.local');
  fs.writeFileSync(envFile, line + '\n');

  // 清空 process.env.MYSQL_PASSWORD 以免被覆盖
  delete process.env.MYSQL_PASSWORD;
  // 强制重置 Next.js env 缓存
  nextEnv.resetEnv && nextEnv.resetEnv();

  nextEnv.loadEnvConfig(tmpDir, true, console, true);
  const result = process.env.MYSQL_PASSWORD;
  console.log(JSON.stringify(line).padEnd(60), '→', JSON.stringify(result), 'len=', (result || '').length);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}
