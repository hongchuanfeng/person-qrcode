import { getPool } from './pool';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  email_verified_at: Date | null;
  credits: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * 通过邮箱查找用户
 */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    'SELECT id, email, password_hash, display_name, email_verified_at, credits, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
    [email.toLowerCase()]
  )) as [UserRow[], unknown];

  return rows.length > 0 ? rows[0] : null;
}

/**
 * 通过 ID 查找用户
 */
export async function findUserById(id: string): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    'SELECT id, email, password_hash, display_name, email_verified_at, credits, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  )) as [UserRow[], unknown];

  return rows.length > 0 ? rows[0] : null;
}

/**
 * 创建用户（初始积分由调用方控制）
 */
export async function createUser(user: {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string | null;
  credits?: number;
}): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO users (id, email, password_hash, display_name, email_verified_at, credits)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.email.toLowerCase(),
      user.passwordHash,
      user.displayName ?? null,
      new Date(),
      user.credits ?? 0
    ]
  );
}

/**
 * 获取用户当前积分
 */
export async function getUserCredits(userId: string): Promise<number> {
  const pool = getPool();
  const [rows] = (await pool.execute(
    'SELECT credits FROM users WHERE id = ? LIMIT 1',
    [userId]
  )) as [any[], unknown];
  return rows.length > 0 ? (rows[0].credits ?? 0) : 0;
}

/**
 * 变更用户积分（原子操作：先 UPDATE 再插入记录）
 */
export async function changeCredits(
  userId: string,
  amount: number,
  type: 'signup_bonus' | 'batch_usage' | 'admin_adjust',
  description?: string
): Promise<{ balanceAfter: number } | null> {
  const pool = getPool();

  // 使用事务确保原子性
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 原子加/减积分
    const [result] = (await conn.execute(
      'UPDATE users SET credits = credits + ? WHERE id = ? AND credits + ? >= 0',
      [amount, userId, amount]
    )) as [any, unknown];

    if (!(result as any).affectedRows) {
      await conn.rollback();
      return null; // 积分不足或用户不存在
    }

    // 获取变动后余额
    const [rows] = (await conn.execute(
      'SELECT credits FROM users WHERE id = ? LIMIT 1',
      [userId]
    )) as [any[], unknown];
    const balanceAfter = rows.length > 0 ? rows[0].credits : 0;

    // 记录变动流水
    await conn.execute(
      `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, amount, balanceAfter, description ?? null]
    );

    await conn.commit();
    return { balanceAfter };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
