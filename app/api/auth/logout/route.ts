import { NextResponse } from 'next/server';
import { endSessionCookie } from '@/utils/mysql/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    await endSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth Logout] Failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to sign out.'
      },
      { status: 500 }
    );
  }
}
