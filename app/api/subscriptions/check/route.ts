import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { hasActiveSubscription } from '@/utils/supabase/subscriptions';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { authenticated: false, subscribed: false },
        { status: 401 }
      );
    }

    // Check subscription status
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

