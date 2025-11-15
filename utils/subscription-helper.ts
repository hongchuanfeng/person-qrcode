/**
 * Helper functions for subscription management
 */

export const PLAN_DURATIONS = {
  monthly: 30, // days
  quarterly: 90, // days
  yearly: 365 // days
} as const;

export type PlanType = keyof typeof PLAN_DURATIONS;

/**
 * Get plan type from product ID
 */
export function getPlanTypeFromProductId(productId: string): PlanType | null {
  const PRODUCT_TO_PLAN: Record<string, PlanType> = {
    'prod_4L6YdpnlJEdRjzPg9OjH8Z': 'monthly',
    'prod_6MCeuAFjzFqFZduAn74Ew7': 'quarterly',
    'prod_6LKkd6OJ8pLCesUdoVNV9I': 'yearly'
  };

  return PRODUCT_TO_PLAN[productId] || null;
}

/**
 * Calculate end date based on plan type and start date
 */
export function calculateEndDate(startDate: Date, planType: PlanType): Date {
  const days = PLAN_DURATIONS[planType];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  return endDate;
}

