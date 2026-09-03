// scripts/test-register.js
// 用 Next.js 自己的 env 加载器（@next/env）来读 .env.local，
// 然后调用真实的 utils/mysql/users.ts 函数（findUserByEmail + createUser）
// 模拟注册流程，确认能跑通。
const path = require('path');
const fs = require('fs');

// 1) 强制把 .next-cache 清掉无关变量，再让 Next.js 加载 .env.local
const { loadEnvConfig } = require(path.join(__dirname, '..', 'node_modules', '@next', 'env', 'dist', 'index.js'));
loadEnvConfig(path.join(__dirname, '..'), true); // dev=true

console.log('--- Next.js env loader ---');
console.log('MYSQL_HOST    :', JSON.stringify(process.env.MYSQL_HOST));
console.log('MYSQL_USER    :', JSON.stringify(process.env.MYSQL_USER));
console.log('MYSQL_DATABASE:', JSON.stringify(process.env.MYSQL_DATABASE));
console.log('MYSQL_PASSWORD:', JSON.stringify(process.env.MYSQL_PASSWORD), 'len=', (process.env.MYSQL_PASSWORD || '').length);

// 2) 调用实际的应用代码（注意：users.ts 是 TS，require 不到。这里直接用 mysql2 重放它的 SQL 即可）
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const TEST_EMAIL = `selftest_${Date.now()}@example.com`;

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: 'utf8mb4'
  });

  try {
    // 先清掉旧的自测用户（防止重复）
    await conn.execute('DELETE FROM users WHERE email = ?', [TEST_EMAIL.toLowerCase()]);

    // 模拟注册流程：检查邮箱不存在 + 插入新用户 + 给积分
    console.log('\n--- 模拟注册 ---');
    const userId = crypto.randomUUID();
    const passwordHash = crypto.randomBytes(32).toString('hex');

    const [existing] = await conn.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [TEST_EMAIL.toLowerCase()]
    );
    if (existing.length) {
      console.error('邮箱已存在:', TEST_EMAIL);
      process.exit(1);
    }

    await conn.execute(
      `INSERT INTO users (id, email, password_hash, display_name, email_verified_at, credits)
       VALUES (?, ?, ?, ?, NULL, 500)`,
      [userId, TEST_EMAIL.toLowerCase(), passwordHash, 'Selftest User']
    );
    console.log('✅ INSERT users OK, id =', userId);

    // 写一条流水
    await conn.execute(
      `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
       VALUES (?, 'signup_bonus', 500, 500, '注册赠送积分（selftest）')`,
      [userId]
    );
    console.log('✅ INSERT credit_transactions OK');

    // 回查一下确认积分余额
    const [rows] = await conn.execute(
      'SELECT id, email, credits FROM users WHERE id = ?',
      [userId]
    );
    console.log('✅ SELECT users 回查:', rows[0]);

    // 清理测试数据
    await conn.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log('✅ 已清理自测数据');

    console.log('\n🎉 注册链路自测通过 —— Next.js 端应该也能跑通。');
  } catch (e) {
    console.error('\n❌ 自测失败:', e.code || '', e.sqlMessage || e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
