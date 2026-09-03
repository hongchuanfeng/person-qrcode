// scripts/test-mysql.js
// 验证 MySQL 连接配置是否能正常工作。
// 使用与 Next.js 完全一致的 process.env（Next.js 自动加载 .env.local）。
// 这里显式加载 .env.local 以便在 Node CLI 下也能复现。
const fs = require('fs');
const path = require('path');

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx < 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFromFile(path.join(process.cwd(), '.env.local'));

const mysql = require('mysql2/promise');

(async () => {
  const cfg = {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  };

  console.log('--- 配置 ---');
  console.log('host    :', cfg.host);
  console.log('port    :', cfg.port);
  console.log('user    :', cfg.user);
  console.log('database:', cfg.database);
  console.log('password: <hidden len=' + (cfg.password || '').length + '>');

  if (!cfg.host || !cfg.user || !cfg.password || !cfg.database) {
    console.error('缺少必要配置。');
    process.exit(2);
  }

  let conn;
  const t0 = Date.now();
  try {
    conn = await mysql.createConnection(cfg);
    console.log('\n[1/3] 握手 OK (' + (Date.now() - t0) + 'ms)');

    const [serverInfo] = await conn.query('SELECT VERSION() AS v, NOW() AS now');
    console.log('[2/3] 查询版本/时间:', serverInfo[0]);

    const [tables] = await conn.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
      [cfg.database]
    );
    console.log('[3/3] 数据库 `' + cfg.database + '` 里的表:');
    if (tables.length === 0) {
      console.log('  (空)');
    } else {
      for (const row of tables) console.log('  -', row.TABLE_NAME);
    }

    // 验证 credits 列是否存在
    const [cols] = await conn.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'credits'",
      [cfg.database]
    );
    console.log('\nusers.credits 列:', cols.length > 0 ? '✅ 已存在' : '❌ 缺失');

    const [ct] = await conn.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'credit_transactions'",
      [cfg.database]
    );
    console.log('credit_transactions 表:', ct.length > 0 ? '✅ 已存在' : '❌ 缺失');

    console.log('\n✅ MySQL 连接测试通过。');
  } catch (e) {
    console.error('\n❌ MySQL 连接测试失败:', e.code || '', e.sqlMessage || e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
