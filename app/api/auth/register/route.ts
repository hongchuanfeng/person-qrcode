import { NextResponse } from 'next/server';
import {
  generateId,
  hashPassword,
  isValidEmail,
  startSessionCookie
} from '@/utils/mysql/auth';
import { createUser, findUserByEmail } from '@/utils/mysql/users';
import { SIGNUP_BONUS_CREDITS } from '@/utils/mysql/credits';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RegisterRequest {
  email?: string;
  password?: string;
  displayName?: string;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: RegisterRequest;
  try {
    body = (await request.json()) as RegisterRequest;
  } catch {
    return badRequest('Invalid JSON payload.');
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const displayName = (body.displayName ?? '').trim() || null;

  if (!isValidEmail(email)) {
    return badRequest('Please provide a valid email address.');
  }
  if (password.length < 6) {
    return badRequest('Password must be at least 6 characters long.');
  }
  if (password.length > 128) {
    return badRequest('Password is too long (max 128 characters).');
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const id = generateId();

    // 注册即赠送积分；为简化事务，我们把积分写入放在 user 创建时直接带上。
    await createUser({
      id,
      email,
      passwordHash,
      displayName,
      credits: SIGNUP_BONUS_CREDITS
    });

    // 由于 createUser 没有写流水，再补一条 signup_bonus 记录
    const { getPool } = await import('@/utils/mysql/pool');
    const pool = getPool();
    await pool.execute(
      `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
       VALUES (?, 'signup_bonus', ?, ?, ?)`,
      [id, SIGNUP_BONUS_CREDITS, SIGNUP_BONUS_CREDITS, '注册赠送积分']
    );

    const userAgent = request.headers.get('user-agent');
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null;
    await startSessionCookie(id, { userAgent, ip });

    return NextResponse.json({
      success: true,
      user: {
        id,
        email,
        displayName,
        emailVerified: true,
        credits: SIGNUP_BONUS_CREDITS
      },
      signupBonus: SIGNUP_BONUS_CREDITS
    });
  } catch (error) {
    console.error('[Auth Register] Failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to register account.'
      },
      { status: 500 }
    );
  }
}
