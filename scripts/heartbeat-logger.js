// 简单的 Node 后台定时任务示例：
// 每隔一小时向 MySQL 的 heartbeat_logs 表插入一条日志。
//
// 使用方式（需先在本地配置好 .env.local — 包含 MYSQL_* 变量）：
//   node scripts/heartbeat-logger.js
//
// 注意：此脚本通常适合在自托管/长期运行的 Node 环境中使用；
// 如果部署在 Vercel 这类无状态平台，更推荐使用“定时触发 HTTP 调用 /api/heartbeat-log”的方式。

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

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
loadEnvFromFile(path.join(process.cwd(), '.env'));

async function createPool() {
  const host = process.env.MYSQL_HOST;
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !database) {
    throw new Error(
      '缺少必要的 MySQL 配置：请在 .env.local 中设置 MYSQL_HOST、MYSQL_USER、MYSQL_PASSWORD、MYSQL_DATABASE。'
    );
  }

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 2
  });
}

async function insertHeartbeatLog(pool, message) {
  await pool.execute('INSERT INTO heartbeat_logs (message) VALUES (?)', [message]);
}

async function main() {
  console.log('[Heartbeat Script] 正在连接 MySQL ...');
  const pool = await createPool();
  console.log('[Heartbeat Script] 连接成功。每小时写入一条日志。');

  const insert = async () => {
    try {
      const message = `Heartbeat (script) at ${new Date().toISOString()}`;
      await insertHeartbeatLog(pool, message);
      console.log('[Heartbeat Script] Log inserted:', message);
    } catch (error) {
      console.error(
        '[Heartbeat Script] Failed to insert log:',
        error instanceof Error ? error.message : error
      );
    }
  };

  // 先立即插入一次
  await insert();

  // 每隔一小时执行一次（3600000 ms）
  setInterval(() => {
    insert().catch((err) => {
      console.error('[Heartbeat Script] Unexpected error:', err);
    });
  }, 60 * 60 * 1000);
}

main().catch((err) => {
  console.error('[Heartbeat Script] Fatal error:', err);
  process.exit(1);
});
