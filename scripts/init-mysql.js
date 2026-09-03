// scripts/init-mysql.js
// 初始化 MySQL 数据库：执行 scripts/mysql_schema.sql 来创建所有表。
// 使用方式（确保 .env.local 中已经配置好 MYSQL_* 变量）：
//   node scripts/init-mysql.js
//
// 也可以使用 mysql CLI 直接执行：
//   mysql -h <host> -u <user> -p <db> < scripts/mysql_schema.sql

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

async function main() {
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

  const sqlPath = path.join(process.cwd(), 'scripts', 'mysql_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 注意：先以不带数据库名的方式连接，确保目标数据库存在（脚本里包含 CREATE DATABASE）
  const initialConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    console.log('[MySQL Init] 正在执行 mysql_schema.sql ...');
    await initialConn.query(sql);
    console.log('[MySQL Init] 完成。');
  } finally {
    await initialConn.end();
  }
}

main().catch((err) => {
  console.error('[MySQL Init] 失败:', err);
  process.exit(1);
});
