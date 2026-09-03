import { NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/utils/mysql/auth';
import { hasActiveSubscription } from '@/utils/mysql/subscriptions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json(
        { authenticated: false, subscribed: false },
        { status: 401 }
      );
    }

    const isSubscribed = await hasActiveSubscription(user.id);

    return NextResponse.json({
      authenticated: true,
      subscribed: isSubscribed,
      userId: user.id
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
