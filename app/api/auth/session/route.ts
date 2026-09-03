import { NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/utils/mysql/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('[Auth Session] Failed:', error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error:
          error instanceof Error ? error.message : 'Failed to load session.'
      },
      { status: 500 }
    );
  }
}
