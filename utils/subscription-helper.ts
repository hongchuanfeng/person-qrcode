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
const PLAN_PRODUCT_IDS: Record<PlanType, string[]> = {
  monthly: [
    'prod_4L6YdpnlJEdRjzPg9OjH8Z',
    'prod_1l9cjsowPhSJlsfrTTXlKb',
    'prod_d1AY2Sadk9YAvLI0pj97f'
  ],
  quarterly: ['prod_6MCeuAFjzFqFZduAn74Ew7'],
  yearly: ['prod_6LKkd6OJ8pLCesUdoVNV9I']
};

export function getPlanTypeFromProductId(productId: string): PlanType | null {
  const entry = Object.entries(PLAN_PRODUCT_IDS).find(([, ids]) =>
    ids.includes(productId)
  );
  return (entry?.[0] as PlanType) ?? null;
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

