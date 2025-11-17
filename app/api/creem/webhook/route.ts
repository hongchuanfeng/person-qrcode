import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { getPlanTypeFromProductId } from '@/utils/subscription-helper';

type CreemSubscriptionObject = {
  id: string;
  status: string;
  product?: {
    id: string;
    name: string;
  };
  metadata?: {
    internal_customer_id?: string;
    [key: string]: string | undefined;
  };
  current_period_start_date?: string;
  current_period_end_date?: string;
};

type CreemWebhookPayload = {
  id: string;
  eventType: string;
  object?: CreemSubscriptionObject;
};

const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET;

function toIsoDate(value?: string | number | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const date =
    typeof value === 'number'
      ? new Date(value)
      : new Date(value.replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

export async function POST(request: Request) {
  try {
    if (WEBHOOK_SECRET) {
      const signature =
        request.headers.get('x-creem-signature') ||
        request.headers.get('x-webhook-secret');
      if (signature !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload: CreemWebhookPayload = await request.json();

    if (!payload?.object) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (payload.eventType !== 'subscription.paid') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const subscription = payload.object;
    const productId = subscription.product?.id;
    const planType = productId ? getPlanTypeFromProductId(productId) : null;
    const userId = subscription.metadata?.internal_customer_id;

    if (!userId) {
      return NextResponse.json({ error: 'Missing user identifier in metadata' }, { status: 400 });
    }

    if (!productId || !planType) {
      return NextResponse.json({ error: 'Unsupported or missing product id' }, { status: 400 });
    }

    const startDate = toIsoDate(subscription.current_period_start_date);
    const endDate = toIsoDate(subscription.current_period_end_date);

    const supabase = createServiceRoleClient();

    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to locate existing subscription', fetchError);
      return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 });
    }

    const record = {
      user_id: userId,
      product_id: productId,
      plan_type: planType,
      start_date: startDate,
      end_date: endDate,
      status: subscription.status ?? 'active',
      updated_at: new Date().toISOString()
    };

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(record)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Failed to update subscription', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({ ...record, status: record.status ?? 'active' });

      if (insertError) {
        console.error('Failed to insert subscription', insertError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Creem webhook error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


