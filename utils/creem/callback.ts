import { createHmac } from 'crypto';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import {
  calculateEndDate,
  getPlanTypeFromProductId,
  type PlanType
} from '@/utils/subscription-helper';

type SearchParamValue = string | string[] | undefined;
export type SearchParamsRecord = Record<string, SearchParamValue>;

interface CreemProductInfo {
  id?: string;
  name?: string;
  billing_period?: string;
}

interface CreemMetadata {
  internal_customer_id?: string;
  user_id?: string;
  [key: string]: string | undefined;
}

export interface CreemSubscriptionPayload {
  id: string;
  status?: string;
  product?: CreemProductInfo;
  metadata?: CreemMetadata;
  current_period_start_date?: string;
  current_period_end_date?: string;
}

export interface CreemCallbackResult {
  processed: boolean;
  success?: boolean;
  message?: string;
}

const CREEM_SECRET = process.env.CREEM_WEBHOOK_SECRET;
const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_API_BASE_URL = process.env.CREEM_API_BASE_URL;

const CREEM_SUBSCRIPTION_ENDPOINTS = [
  CREEM_API_BASE_URL ? `${CREEM_API_BASE_URL.replace(/\/$/, '')}/subscriptions` : null,
  'https://api.creem.io/v1/subscriptions',
  'https://test-api.creem.io/v1/subscriptions'
].filter(Boolean) as string[];

function getSingleParam(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function buildPayloadString(params: SearchParamsRecord) {
  const entries = Object.entries(params)
    .filter(([key, value]) => key !== 'signature' && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => `${key}=${item}`);
      }
      return `${key}=${value}`;
    });

  return entries.join('&');
}

function verifySignature(payload: string, signature: string | null) {
  if (!CREEM_SECRET || !signature) {
    return false;
  }

  const computed = createHmac('sha256', CREEM_SECRET).update(payload).digest('hex');
  console.info('[Creem Callback] computed signature:', computed);
  return computed === signature;
}

function resolvePlanType(product?: CreemProductInfo): PlanType | null {
  if (product?.id) {
    const mapped = getPlanTypeFromProductId(product.id);
    if (mapped) {
      return mapped;
    }
  }

  const period = product?.billing_period?.toLowerCase();
  if (!period) {
    return null;
  }

  if (period.includes('quarter')) {
    return 'quarterly';
  }
  if (period.includes('year')) {
    return 'yearly';
  }

  return 'monthly';
}

async function fetchSubscriptionDetails(
  subscriptionId: string
): Promise<CreemSubscriptionPayload | null> {
  if (!CREEM_API_KEY) {
    console.error('CREEM_API_KEY is not configured.');
    return null;
  }

  for (const endpoint of CREEM_SUBSCRIPTION_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/${subscriptionId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-api-key': CREEM_API_KEY
        },
        cache: 'no-store'
      });

      if (response.ok) {
        return (await response.json()) as CreemSubscriptionPayload;
      }

      console.warn(
        `Creem subscription fetch failed at ${endpoint}: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      console.error(`Creem subscription fetch error at ${endpoint}`, error);
    }
  }

  return null;
}

async function persistSubscription(
  payload: CreemSubscriptionPayload
): Promise<{ success: boolean; message?: string }> {
  const userId =
    payload.metadata?.internal_customer_id ||
    payload.metadata?.user_id ||
    undefined;

  if (!userId) {
    return {
      success: false,
      message: 'Missing user identifier in subscription metadata.'
    };
  }

  const planType = resolvePlanType(payload.product);
  if (!planType || !payload.product?.id) {
    return {
      success: false,
      message: 'Unsupported or missing product information.'
    };
  }

  const startDateIso = payload.current_period_start_date
    ? new Date(payload.current_period_start_date).toISOString()
    : new Date().toISOString();

  const endDateIso = payload.current_period_end_date
    ? new Date(payload.current_period_end_date).toISOString()
    : calculateEndDate(new Date(startDateIso), planType).toISOString();

  const supabase = createServiceRoleClient();

  const { data: existing, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to query existing subscription', fetchError);
    return {
      success: false,
      message: 'Failed to load subscription data.'
    };
  }

  const record = {
    user_id: userId,
    product_id: payload.product.id,
    plan_type: planType,
    start_date: startDateIso,
    end_date: endDateIso,
    status: payload.status ?? 'active',
    updated_at: new Date().toISOString()
  };

  if (existing?.id) {
    const { error } = await supabase
      .from('subscriptions')
      .update(record)
      .eq('id', existing.id);

    if (error) {
      console.error('Failed to update subscription record', error);
      return {
        success: false,
        message: 'Failed to update subscription.'
      };
    }
  } else {
    const { error } = await supabase.from('subscriptions').insert(record);
    if (error) {
      console.error('Failed to insert subscription record', error);
      return {
        success: false,
        message: 'Failed to create subscription.'
      };
    }
  }

  return {
    success: true,
    message: 'Subscription activated successfully.'
  };
}

export async function handleCreemCallbackFromSearchParams(
  params: SearchParamsRecord,
  headerSignature?: string | null
): Promise<CreemCallbackResult | null> {
  const querySignature = getSingleParam(params.signature);
  const signature = headerSignature ?? querySignature;

  if (!signature) {
    return null;
  }

  console.info('[Creem Callback] header signature (creem-signature):', headerSignature ?? null);
  console.info('[Creem Callback] query signature:', querySignature ?? null);

  console.info('[Creem Callback] raw search params:', params);
  const payloadString = buildPayloadString(params);
  if (!payloadString) {
    return {
      processed: true,
      success: false,
      message: 'Missing callback payload.'
    };
  }

  console.info('[Creem Callback] payload:', payloadString);

  if (!verifySignature(payloadString, signature)) {
    console.warn('[Creem Callback] signature verification failed');
    return {
      processed: true,
      success: false,
      message: 'Invalid callback signature.'
    };
  }

  console.info('[Creem Callback] signature verification succeeded');

  const subscriptionId = getSingleParam(params.subscription_id);
  if (!subscriptionId) {
    return {
      processed: true,
      success: false,
      message: 'Missing subscription identifier.'
    };
  }

  const subscription = await fetchSubscriptionDetails(subscriptionId);
  if (!subscription) {
    return {
      processed: true,
      success: false,
      message: 'Unable to load subscription details from Creem.'
    };
  }

  const result = await persistSubscription(subscription);
  return {
    processed: true,
    success: result.success,
    message: result.message
  };
}


