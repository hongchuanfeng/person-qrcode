import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import {
  calculateEndDate,
  getPlanTypeFromProductId,
  type PlanType
} from '@/utils/subscription-helper';

interface TestSubscriptionRequest {
  userId: string;
  productId: string;
  planType?: PlanType;
  startDate?: string;
  endDate?: string;
  orderId?: string;
  subscriptionId?: string;
  status?: string;
}

const TEST_SECRET = process.env.SUBSCRIPTION_TEST_SECRET;

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function POST(request: Request) {
  if (!TEST_SECRET) {
    return NextResponse.json(
      { error: 'SUBSCRIPTION_TEST_SECRET is not configured.' },
      { status: 500 }
    );
  }

  const providedSecret = request.headers.get('x-test-secret');
  if (providedSecret !== TEST_SECRET) {
    return unauthorized();
  }

  let body: TestSubscriptionRequest;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body.', details: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }

  const { userId, productId, planType: explicitPlanType } = body;

  if (!userId || !productId) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, productId' },
      { status: 400 }
    );
  }

  const planType = explicitPlanType ?? getPlanTypeFromProductId(productId);
  if (!planType) {
    return NextResponse.json(
      { error: 'Unable to derive plan type from productId' },
      { status: 400 }
    );
  }

  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  const endDate = body.endDate
    ? new Date(body.endDate)
    : calculateEndDate(new Date(startDate), planType);

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      product_id: productId,
      plan_type: planType,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      order_id: body.orderId ?? null,
      subscription_id: body.subscriptionId ?? null,
      status: body.status ?? 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('[Subscription Test] Insert failed:', error);
    return NextResponse.json(
      { error: 'Failed to insert test subscription.', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    subscription: data
  });
}


