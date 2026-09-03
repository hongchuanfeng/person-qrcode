import { NextResponse } from 'next/server';
import { findUserById } from '@/utils/mysql/users';
import {
  calculateEndDate,
  getPlanTypeFromProductId,
  type PlanType
} from '@/utils/subscription-helper';
import { getPool, toMySqlDateTime } from '@/utils/mysql/pool';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // 校验目标用户确实存在（避免测试 API 把数据写入不存在的用户）
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    return NextResponse.json(
      { error: 'User does not exist.' },
      { status: 404 }
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

  const pool = getPool();
  const id = generateId();
  await pool.execute(
    `INSERT INTO subscriptions
       (id, user_id, product_id, plan_type, start_date, end_date,
        order_id, subscription_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      productId,
      planType,
      toMySqlDateTime(startDate),
      toMySqlDateTime(endDate),
      body.orderId ?? null,
      body.subscriptionId ?? null,
      body.status ?? 'active'
    ]
  );

  const [rows] = (await pool.execute(
    `SELECT id, user_id, product_id, plan_type, order_id, subscription_id,
            start_date, end_date, status, created_at, updated_at
       FROM subscriptions WHERE id = ? LIMIT 1`,
    [id]
  )) as [any[], unknown];

  return NextResponse.json({
    success: true,
    subscription: rows[0]
  });
}
