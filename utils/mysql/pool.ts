import mysql, { Pool, PoolOptions } from 'mysql2/promise';

let cachedPool: Pool | null = null;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === '') return undefined;
  return value;
}

/**
 * 获取一个全局共享的 MySQL 连接池。
 * 仅在首次调用时创建，后续调用直接复用。
 */
export function getPool(): Pool {
  if (cachedPool) return cachedPool;

  const config: PoolOptions = {
    host: readEnv('MYSQL_HOST') ?? '127.0.0.1',
    port: Number(readEnv('MYSQL_PORT') ?? 3306),
    user: readEnv('MYSQL_USER'),
    password: readEnv('MYSQL_PASSWORD'),
    database: readEnv('MYSQL_DATABASE'),
    waitForConnections: true,
    connectionLimit: Number(readEnv('MYSQL_POOL_LIMIT') ?? 10),
    queueLimit: 0,
    timezone: 'Z',
    dateStrings: false,
    charset: 'utf8mb4'
  };

  if (!config.user || !config.database) {
    throw new Error(
      '缺少 MySQL 连接配置：请在 .env.local 中设置 MYSQL_HOST、MYSQL_USER、MYSQL_PASSWORD、MYSQL_DATABASE。'
    );
  }

  cachedPool = mysql.createPool(config);
  return cachedPool;
}

/**
 * 将 Date 转成 MySQL DATETIME 字符串（YYYY-MM-DD HH:mm:ss）
 * 避免 mysql2 默认转 UTC 字符串导致的一些边界问题。
 */
export function toMySqlDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

/**
 * 将任意 Date / ISO 字符串安全转成 MySQL DATETIME（UTC）。
 */
export function toMySqlDateTimeFromInput(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return toMySqlDateTime(d);
}
