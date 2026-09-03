import { getPool, toMySqlDateTime } from './pool';
import { randomBytes } from 'crypto';

export const SESSION_COOKIE_NAME = 'pqc_session';
export const SESSION_TTL_DAYS = 30;

export interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  user_agent: string | null;
  ip: string | null;
  expires_at: Date;
  created_at: Date;
}

export interface UserSummary {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
  credits: number;
}

export interface SessionWithUser {
  session: SessionRow;
  user: UserSummary;
}

function generateToken(): string {
  return randomBytes(48).toString('hex');
}

function generateId(): string {
  // 生成 UUID v4（项目运行时无需引入额外依赖）
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return (
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-` +
    `${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  );
}

/**
 * 为用户创建一个新的会话记录，并返回 token + 过期时间。
 */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const pool = getPool();
  const id = generateId();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.execute(
    `INSERT INTO user_sessions (id, user_id, token, user_agent, ip, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      token,
      meta.userAgent ?? null,
      meta.ip ?? null,
      toMySqlDateTime(expiresAt)
    ]
  );

  return { token, expiresAt };
}

/**
 * 通过 token 查询有效会话（未过期）。返回 null 表示无效。
 */
export async function findSessionWithUser(token: string): Promise<SessionWithUser | null> {
  if (!token) return null;

  const pool = getPool();
  const [rows] = (await pool.execute(
    `SELECT s.id, s.user_id, s.token, s.user_agent, s.ip, s.expires_at, s.created_at,
            u.email, u.display_name, u.email_verified_at, u.credits
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > UTC_TIMESTAMP()
      LIMIT 1`,
    [token]
  )) as [any[], unknown];

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    session: {
      id: r.id,
      user_id: r.user_id,
      token: r.token,
      user_agent: r.user_agent,
      ip: r.ip,
      expires_at: r.expires_at,
      created_at: r.created_at
    },
    user: {
      id: r.user_id,
      email: r.email,
      displayName: r.display_name,
      emailVerified: r.email_verified_at !== null,
      credits: Number(r.credits ?? 0)
    }
  };
}

/**
 * 销毁会话（登出时调用）
 */
export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  const pool = getPool();
  await pool.execute('DELETE FROM user_sessions WHERE token = ?', [token]);
}

/**
 * 清理过期会话（可由后台任务调用）
 */
export async function purgeExpiredSessions(): Promise<number> {
  const pool = getPool();
  const [result] = (await pool.execute(
    'DELETE FROM user_sessions WHERE expires_at <= UTC_TIMESTAMP()'
  )) as [any, unknown];
  return (result && (result as any).affectedRows) || 0;
}
