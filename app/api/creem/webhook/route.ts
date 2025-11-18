import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import {
  getPlanTypeFromProductId,
  calculateEndDate,
  type PlanType
} from '@/utils/subscription-helper';

type CreemSubscriptionObject = {
  id: string;
  status: string;
  product?: {
    id: string;
    name: string;
    billing_period?: string;
  };
  customer?: {
    id?: string;
  };
  metadata?: {
    internal_customer_id?: string;
    [key: string]: string | undefined;
  };
  last_transaction_id?: string;
  current_period_start_date?: string;
  current_period_end_date?: string;
};

type CreemWebhookPayload = {
  id: string;
  eventType: string;
  object?: CreemSubscriptionObject;
};

const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET;

type ParsedPayload =
  | {
      raw: string;
      json: CreemWebhookPayload;
      signature?: string | null;
    }
  | { error: NextResponse };

const VALID_EVENT = 'subscription.paid';

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
  return handleWebhook(request);
}

export async function GET(request: Request) {
  return handleWebhook(request);
}

async function parsePayload(request: Request): Promise<ParsedPayload> {
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const payloadParam = url.searchParams.get('payload');
      const signature = url.searchParams.get('signature');
      console.info('[Creem Webhook] payloadParam:', payloadParam);
      console.info('[Creem Webhook] signature (query):', signature);

      if (!payloadParam) {
        return {
          error: NextResponse.json({ error: 'Missing payload parameter' }, { status: 400 })
        };
      }

      const raw = decodeURIComponent(payloadParam);
      const json = JSON.parse(raw);

      return { raw, json, signature };
    }

    const raw = await request.text();
    console.info('[Creem Webhook] raw body:', raw);
    if (!raw) {
      return { error: NextResponse.json({ error: 'Empty request body' }, { status: 400 }) };
    }

    const signature =
      request.headers.get('creem-signature') ||
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-signature');
    console.info('[Creem Webhook] signature (header):', signature);

    const json = JSON.parse(raw);
    return { raw, json, signature };
  } catch (error) {
    console.error('Failed to parse webhook payload', error);
    return {
      error: NextResponse.json({ error: 'Invalid payload body' }, { status: 400 })
    };
  }
}

function verifySignature(raw: string, signature?: string | null) {
  if (!WEBHOOK_SECRET) {
    throw new Error('CREEM_WEBHOOK_SECRET is not configured');
  }

  if (!signature) {
    return false;
  }

  const computed = createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  console.info('[Creem Webhook] computed signature:', computed);
  return computed === signature;
}

function resolvePlanType(
  productId: string | undefined,
  subscription: CreemSubscriptionObject
): PlanType | null {
  if (productId) {
    const lookup = getPlanTypeFromProductId(productId);
    if (lookup) return lookup;
  }

  const period = subscription.product?.billing_period;
  if (!period) return null;

  if (period.includes('month')) return 'monthly';
  if (period.includes('quarter')) return 'quarterly';
  if (period.includes('year')) return 'yearly';

  return null;
}

async function handleWebhook(request: Request) {
  try {
    const headersObject = Object.fromEntries(request.headers.entries());
    console.info('[Creem Webhook] incoming headers:', headersObject);
    const parsed = await parsePayload(request);
    if ('error' in parsed) {
      return parsed.error;
    }

    const { raw, json, signature } = parsed;

    if (WEBHOOK_SECRET && !verifySignature(raw, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    if (!json?.object) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (json.eventType !== VALID_EVENT) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const subscription = json.object;
    const userId =
      subscription.metadata?.internal_customer_id ||
      subscription.metadata?.user_id ||
      subscription.customer?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 });
    }

    const productId = subscription.product?.id;
    const planType = resolvePlanType(productId, subscription);
    const orderId =
      subscription.metadata?.order_id || subscription.metadata?.orderId || subscription.last_transaction_id || null;
    const subscriptionId = subscription.id;

    if (!productId || !planType) {
      return NextResponse.json({ error: 'Unsupported or missing product id' }, { status: 400 });
    }

    const startDate = subscription.current_period_start_date
      ? toIsoDate(subscription.current_period_start_date)
      : new Date().toISOString();
    const endDate = subscription.current_period_end_date
      ? toIsoDate(subscription.current_period_end_date)
      : calculateEndDate(new Date(startDate), planType).toISOString();

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
      order_id: orderId,
      subscription_id: subscriptionId,
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

