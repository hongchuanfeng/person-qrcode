import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createSubscription } from '@/utils/supabase/subscriptions';
import { getPlanTypeFromProductId, calculateEndDate } from '@/utils/subscription-helper';

type CreateSubscriptionRequest = {
  userId: string;
  productId: string;
  orderId?: string;
};

export async function POST(request: Request) {
  try {
    const body: CreateSubscriptionRequest = await request.json();
    const { userId, productId, orderId } = body;

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and productId' },
        { status: 400 }
      );
    }

    // Verify the user making the request
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get plan type from product ID
    const planType = getPlanTypeFromProductId(productId);
    if (!planType) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, planType);

    // Create subscription
    const subscription = await createSubscription(
      userId,
      productId,
      planType,
      startDate,
      endDate
    );

    if (!subscription) {
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

