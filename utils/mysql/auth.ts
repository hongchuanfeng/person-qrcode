import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  createSession,
  deleteSession,
  findSessionWithUser
} from './sessions';

const BCRYPT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  if (email.length > 255) return false;
  // 简单的邮箱格式校验
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateId(): string {
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
 * 在服务端创建会话，并把 token 写入 HTTP-only cookie。
 * 仅供服务端 API 路由使用。
 */
export async function startSessionCookie(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const { token, expiresAt } = await createSession(userId, meta);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt
  });
  return { token, expiresAt };
}

/**
 * 销毁服务端 cookie 会话。
 */
export async function endSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const current = cookieStore.get(SESSION_COOKIE_NAME);
  if (current?.value) {
    await deleteSession(current.value);
  }
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0)
  });
}

/**
 * 在服务端获取当前已登录的用户；返回 null 表示未登录。
 */
export async function getCurrentUserServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await findSessionWithUser(token);
  return result?.user ?? null;
}
