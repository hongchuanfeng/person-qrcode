import { createClient } from './server';

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gte('end_date', now)
      .order('end_date', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking subscription:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gte('end_date', now)
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Create a new subscription record
 */
export async function createSubscription(
  userId: string,
  productId: string,
  planType: 'monthly' | 'quarterly' | 'yearly',
  startDate: Date,
  endDate: Date
): Promise<Subscription | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        product_id: productId,
        plan_type: planType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

