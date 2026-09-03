// 注册赠送的初始积分数
export const SIGNUP_BONUS_CREDITS = 500;

export interface CreditTransactionRow {
  id: number;
  user_id: string;
  type: 'signup_bonus' | 'batch_usage' | 'admin_adjust';
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: Date;
}
