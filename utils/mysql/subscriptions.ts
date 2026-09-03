import { getPool, toMySqlDateTime, toMySqlDateTimeFromInput } from './pool';
import { randomBytes } from 'crypto';

export interface SubscriptionRow {
  id: string;
  user_id: string;
  product_id: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  order_id: string | null;
  subscription_id: string | null;
  start_date: Date;
  end_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function generateId(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return (
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-` +
    `${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  );
}

/**
 * 检查某个用户是否有当前生效的订阅
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    `SELECT id
       FROM subscriptions
      WHERE user_id = ?
        AND end_date > UTC_TIMESTAMP()
      ORDER BY end_date DESC
      LIMIT 1`,
    [userId]
  )) as [any[], unknown];
  return rows.length > 0;
}

/**
 * 获取用户当前生效的订阅
 */
export async function getActiveSubscription(
  userId: string
): Promise<SubscriptionRow | null> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    `SELECT id, user_id, product_id, plan_type, order_id, subscription_id,
            start_date, end_date, status, created_at, updated_at
       FROM subscriptions
      WHERE user_id = ?
        AND end_date > UTC_TIMESTAMP()
      ORDER BY end_date DESC
      LIMIT 1`,
    [userId]
  )) as [SubscriptionRow[], unknown];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 获取用户的所有订阅记录（按创建时间倒序）
 */
export async function listUserSubscriptions(
  userId: string
): Promise<SubscriptionRow[]> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    `SELECT id, user_id, product_id, plan_type, order_id, subscription_id,
            start_date, end_date, status, created_at, updated_at
       FROM subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC`,
    [userId]
  )) as [SubscriptionRow[], unknown];
  return rows;
}

/**
 * 创建一条订阅记录
 */
export async function createSubscription(
  userId: string,
  productId: string,
  planType: 'monthly' | 'quarterly' | 'yearly',
  startDate: Date,
  endDate: Date,
  options: {
    orderId?: string | null;
    subscriptionId?: string | null;
    status?: string;
  } = {}
): Promise<SubscriptionRow | null> {
  const pool = getPool();
  const id = generateId();
  const status = options.status ?? 'active';

  try {
    await pool.execute(
      `INSERT INTO subscriptions
         (id, user_id, product_id, plan_type, order_id, subscription_id,
          start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        productId,
        planType,
        options.orderId ?? null,
        options.subscriptionId ?? null,
        toMySqlDateTime(startDate),
        toMySqlDateTime(endDate),
        status
      ]
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }

  return getSubscriptionById(id);
}

/**
 * 查找最近一条订阅（用于 webhook 中的更新场景）
 */
export async function findLatestSubscription(
  userId: string
): Promise<SubscriptionRow | null> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    `SELECT id, user_id, product_id, plan_type, order_id, subscription_id,
            start_date, end_date, status, created_at, updated_at
       FROM subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId]
  )) as [SubscriptionRow[], unknown];
  return rows.length > 0 ? rows[0] : null;
}

export async function updateSubscription(
  id: string,
  data: {
    product_id: string;
    plan_type: 'monthly' | 'quarterly' | 'yearly';
    order_id?: string | null;
    subscription_id?: string | null;
    start_date: string | Date;
    end_date: string | Date;
    status?: string;
  }
): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE subscriptions
        SET product_id = ?, plan_type = ?, order_id = ?, subscription_id = ?,
            start_date = ?, end_date = ?, status = ?, updated_at = UTC_TIMESTAMP()
      WHERE id = ?`,
    [
      data.product_id,
      data.plan_type,
      data.order_id ?? null,
      data.subscription_id ?? null,
      toMySqlDateTimeFromInput(data.start_date),
      toMySqlDateTimeFromInput(data.end_date),
      data.status ?? 'active',
      id
    ]
  );
}

async function getSubscriptionById(id: string): Promise<SubscriptionRow | null> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    `SELECT id, user_id, product_id, plan_type, order_id, subscription_id,
            start_date, end_date, status, created_at, updated_at
       FROM subscriptions
      WHERE id = ?
      LIMIT 1`,
    [id]
  )) as [SubscriptionRow[], unknown];
  return rows.length > 0 ? rows[0] : null;
}
