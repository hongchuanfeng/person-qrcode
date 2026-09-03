import { getPool } from './pool';

/**
 * 向 heartbeat_logs 表写入一条日志
 */
export async function insertHeartbeatLog(message?: string): Promise<void> {
  const pool = getPool();
  const logMessage = message ?? `Heartbeat at ${new Date().toISOString()}`;

  await pool.execute('INSERT INTO heartbeat_logs (message) VALUES (?)', [logMessage]);
}
