import { NextResponse } from 'next/server';
import { isValidEmail, startSessionCookie, verifyPassword } from '@/utils/mysql/auth';
import { findUserByEmail } from '@/utils/mysql/users';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LoginRequest {
  email?: string;
  password?: string;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: LoginRequest;
  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return badRequest('Invalid JSON payload.');
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!isValidEmail(email)) {
    return badRequest('Please provide a valid email address.');
  }
  if (!password) {
    return badRequest('Password is required.');
  }

  try {
    const user = await findUserByEmail(email);
    // 注意：为了避免“邮箱是否注册”的探测，失败信息保持通用。
    const invalid = NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 }
    );
    if (!user) {
      return invalid;
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return invalid;
    }

    const userAgent = request.headers.get('user-agent');
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null;
    await startSessionCookie(user.id, { userAgent, ip });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: user.email_verified_at !== null,
        credits: Number(user.credits ?? 0)
      }
    });
  } catch (error) {
    console.error('[Auth Login] Failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to sign in.'
      },
      { status: 500 }
    );
  }
}
