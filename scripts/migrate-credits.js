// scripts/migrate-credits.js
// 为已有数据库补齐积分相关结构：
//   1) 给 users 表加 credits 列（若不存在）
//   2) 创建 credit_transactions 表（若不存在）
//   3) 校验 SIGNUP_BONUS_CREDITS 是否存在；可选地为已有老用户赠送一次积分
//
// 使用方式（先确保 .env.local 中已经配置好 MYSQL_* 变量）：
//   node scripts/migrate-credits.js
//   node scripts/migrate-credits.js --grant-existing
//
// 说明：
// - --grant-existing  会给所有 credits=0 的老用户一次性补发 500 积分
//                    并写一条 type='signup_bonus' 的流水（描述区分：老用户补发）。
// - 不带参数执行   只补字段/建表，不动老用户积分。

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SIGNUP_BONUS_CREDITS = 500;

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
  const grantExisting = process.argv.includes('--grant-existing');

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

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: false
  });

  try {
    // -------- 1) 给 users 添加 credits 列（若不存在） --------
    const [columns] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'credits'`,
      [database]
    );
    if (columns.length === 0) {
      console.log('[Migrate] 添加 users.credits 列 ...');
      await conn.query(
        'ALTER TABLE `users` ADD COLUMN `credits` INT NOT NULL DEFAULT 0 COMMENT "用户积分余额" AFTER `email_verified_at`'
      );
    } else {
      console.log('[Migrate] users.credits 已存在，跳过。');
    }

    // -------- 2) 创建 credit_transactions 表（若不存在） --------
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'credit_transactions'`,
      [database]
    );
    if (tables.length === 0) {
      console.log('[Migrate] 创建 credit_transactions 表 ...');
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`credit_transactions\` (
          \`id\`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '自增主键',
          \`user_id\`       CHAR(36)     NOT NULL COMMENT '关联 users.id',
          \`type\`          VARCHAR(32)  NOT NULL COMMENT '变动类型：signup_bonus / batch_usage / admin_adjust',
          \`amount\`        INT          NOT NULL COMMENT '变动积分数量（正数=增加，负数=扣减）',
          \`balance_after\` INT          NOT NULL COMMENT '变动后积分余额',
          \`description\`   VARCHAR(255) DEFAULT NULL COMMENT '描述',
          \`created_at\`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_credit_transactions_user_id\` (\`user_id\`),
          KEY \`idx_credit_transactions_type\` (\`type\`),
          KEY \`idx_credit_transactions_created_at\` (\`created_at\`),
          CONSTRAINT \`fk_credit_transactions_user_id\`
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          COMMENT='用户积分变动记录表'
      `);
    } else {
      console.log('[Migrate] credit_transactions 表已存在，跳过。');
    }

    // -------- 3) 可选：为已有老用户赠送一次积分 --------
    if (grantExisting) {
      console.log(
        `[Migrate] --grant-existing：为所有 credits=0 的用户赠送 ${SIGNUP_BONUS_CREDITS} 积分 ...`
      );
      // 找出所有 credits=0 的用户，逐个原子更新 + 写流水
      const [targets] = await conn.query(
        'SELECT id, credits FROM users WHERE credits = 0'
      );
      let count = 0;
      for (const row of targets) {
        const userId = row.id;
        await conn.beginTransaction();
        try {
          const [upd] = await conn.query(
            'UPDATE users SET credits = credits + ? WHERE id = ? AND credits = 0',
            [SIGNUP_BONUS_CREDITS, userId]
          );
          if (!upd.affectedRows) {
            await conn.rollback();
            continue;
          }
          await conn.query(
            `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
             VALUES (?, 'signup_bonus', ?, ?, '老用户补发积分（migrate-credits）')`,
            [userId, SIGNUP_BONUS_CREDITS, SIGNUP_BONUS_CREDITS]
          );
          await conn.commit();
          count++;
        } catch (e) {
          await conn.rollback();
          throw e;
        }
      }
      console.log(`[Migrate] 已为 ${count} 个老用户补发积分。`);
    } else {
      console.log('[Migrate] 未传 --grant-existing，跳过老用户补发。');
    }

    console.log('[Migrate] 完成。');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('[Migrate] 失败:', err);
  process.exit(1);
});
