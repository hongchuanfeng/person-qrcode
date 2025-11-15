# 批量生成订阅功能说明文档

本文档详细说明了批量生成页面的登录和订阅检查功能，以及支付成功后订阅信息的保存机制。

## 功能概述

已实现以下功能：

1. ✅ **登录检查**：点击批量生成按钮时，先检查用户是否已登录
2. ✅ **订阅检查**：验证用户是否已订阅有效套餐
3. ✅ **支付成功后订阅保存**：用户支付成功后，自动将订阅信息保存到 Supabase
4. ✅ **订阅状态实时检查**：页面加载时自动检查用户订阅状态

## 数据库表结构

### Supabase `subscriptions` 表

需要在 Supabase 中创建以下表结构：

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_user_end_date ON subscriptions(user_id, end_date);

-- 启用行级安全策略（RLS）
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的订阅
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：服务端可以插入订阅（通过服务端密钥）
CREATE POLICY "Service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);
```

### 表字段说明

- `id`: 订阅记录的唯一标识符（UUID）
- `user_id`: 用户的 Supabase Auth UID
- `product_id`: Creem 产品 ID
  - 月度计划：`prod_4L6YdpnlJEdRjzPg9OjH8Z`
  - 季度计划：`prod_6MCeuAFjzFqFZduAn74Ew7`
  - 年度计划：`prod_6LKkd6OJ8pLCesUdoVNV9I`
- `plan_type`: 套餐类型（monthly, quarterly, yearly）
- `start_date`: 订阅开始时间
- `end_date`: 订阅结束时间
- `created_at`: 记录创建时间
- `updated_at`: 记录更新时间

## 功能流程

### 1. 批量生成流程

```
用户点击"生成二维码"按钮
    ↓
检查用户是否登录
    ↓ (未登录)
显示错误提示 → 自动跳转到 Google 登录
    ↓ (已登录)
检查用户订阅状态
    ↓ (未订阅)
显示错误提示 → 引导用户订阅
    ↓ (已订阅)
开始生成二维码
```

### 2. 支付成功流程

```
用户在 Creem 完成支付
    ↓
跳转到成功页面 (/creem/success)
    ↓
从 sessionStorage 或 URL 参数获取 product_id
    ↓
调用 /api/subscriptions/create 创建订阅记录
    ↓
保存到 Supabase subscriptions 表
    ↓
显示成功消息
```

## API 端点

### 1. 检查订阅状态

**端点**: `GET /api/subscriptions/check`

**功能**: 检查当前登录用户的订阅状态

**响应**:
```json
{
  "authenticated": true,
  "subscribed": true,
  "userId": "user-uuid"
}
```

### 2. 创建订阅

**端点**: `POST /api/subscriptions/create`

**功能**: 在支付成功后创建订阅记录

**请求体**:
```json
{
  "userId": "user-uuid",
  "productId": "prod_4L6YdpnlJEdRjzPg9OjH8Z",
  "orderId": "optional-order-id"
}
```

**响应**:
```json
{
  "success": true,
  "subscription": {
    "id": "subscription-uuid",
    "user_id": "user-uuid",
    "product_id": "prod_4L6YdpnlJEdRjzPg9OjH8Z",
    "plan_type": "monthly",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## 代码文件说明

### 1. 工具函数

#### `utils/supabase/subscriptions.ts`
- `hasActiveSubscription(userId)`: 检查用户是否有有效订阅
- `getActiveSubscription(userId)`: 获取用户的有效订阅
- `createSubscription(...)`: 创建新的订阅记录

#### `utils/subscription-helper.ts`
- `getPlanTypeFromProductId(productId)`: 根据产品 ID 获取套餐类型
- `calculateEndDate(startDate, planType)`: 根据套餐类型计算结束日期

### 2. API 路由

#### `app/api/subscriptions/check/route.ts`
检查用户订阅状态的 API 端点

#### `app/api/subscriptions/create/route.ts`
创建订阅记录的 API 端点

### 3. 页面组件

#### `app/[locale]/batch/page.tsx`
- 添加了登录和订阅检查逻辑
- 在 `generateQRCodes` 函数中验证用户状态
- 使用 `useAuth` hook 获取用户信息
- 使用 `useEffect` 自动检查订阅状态

#### `app/[locale]/creem/success/page.tsx`
- 支付成功后的处理页面
- 自动创建订阅记录
- 从 sessionStorage 或 URL 参数获取产品 ID

## 订阅时长计算

- **月度计划**: 30 天
- **季度计划**: 90 天
- **年度计划**: 365 天

结束日期 = 开始日期 + 套餐时长

## 使用说明

### 1. 设置 Supabase 表

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目：`mthqwnbjxfikntnpwrnw`
3. 进入 **SQL Editor**
4. 执行上述 SQL 语句创建表结构

### 2. 配置环境变量

确保 `.env.local` 文件包含 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://mthqwnbjxfikntnpwrnw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 测试流程

#### 测试登录检查：
1. 未登录状态下访问批量生成页面
2. 上传文件并点击"生成二维码"
3. 应该显示"请先登录"提示，并自动跳转到登录

#### 测试订阅检查：
1. 已登录但未订阅状态下
2. 上传文件并点击"生成二维码"
3. 应该显示"需要订阅套餐"提示

#### 测试支付成功：
1. 选择套餐并完成支付
2. 跳转到成功页面
3. 应该自动创建订阅记录
4. 返回批量生成页面，应该可以正常生成

## 错误处理

### 常见错误及解决方案

1. **"请先登录才能生成二维码"**
   - 原因：用户未登录
   - 解决：点击登录按钮完成 Google 登录

2. **"批量生成功能需要订阅套餐"**
   - 原因：用户未订阅或订阅已过期
   - 解决：在页面底部选择套餐并完成支付

3. **"检查订阅状态失败"**
   - 原因：API 调用失败或网络问题
   - 解决：刷新页面重试，或检查网络连接

4. **"Product information not found"**
   - 原因：支付成功页面无法获取产品 ID
   - 解决：检查 sessionStorage 或联系技术支持

## 安全注意事项

1. **行级安全策略（RLS）**
   - Supabase 表已启用 RLS
   - 用户只能查看自己的订阅记录
   - 服务端可以插入订阅记录

2. **用户验证**
   - API 端点会验证用户身份
   - 只有登录用户才能创建订阅
   - 订阅记录与用户 ID 绑定

3. **数据完整性**
   - 使用外键约束确保数据一致性
   - 删除用户时自动删除相关订阅记录

## 多语言支持

所有错误消息和提示都已添加到翻译文件：

**英文** (`messages/en.json`):
- `error.loginRequired`: "Please log in to generate QR codes..."
- `error.subscriptionRequired`: "A subscription is required..."
- `error.subscriptionCheckFailed`: "Failed to check subscription status..."

**中文** (`messages/zh.json`):
- `error.loginRequired`: "请先登录才能生成二维码..."
- `error.subscriptionRequired`: "批量生成功能需要订阅套餐..."
- `error.subscriptionCheckFailed`: "检查订阅状态失败..."

## 产品 ID 映射

| 套餐类型 | 产品 ID | 价格 | 时长 |
|---------|---------|------|------|
| 月度计划 | `prod_4L6YdpnlJEdRjzPg9OjH8Z` | $9.9 | 30 天 |
| 季度计划 | `prod_6MCeuAFjzFqFZduAn74Ew7` | $19.9 | 90 天 |
| 年度计划 | `prod_6LKkd6OJ8pLCesUdoVNV9I` | $69.9 | 365 天 |

## 故障排除

### 订阅记录未创建

1. 检查 Supabase 表是否正确创建
2. 检查 RLS 策略是否配置正确
3. 检查 API 端点日志是否有错误
4. 验证用户是否已登录

### 订阅检查总是返回 false

1. 检查 `end_date` 是否在未来
2. 验证数据库查询是否正确
3. 检查用户 ID 是否匹配

### 支付成功后页面报错

1. 检查 sessionStorage 中是否有 `lastProductId`
2. 验证 URL 参数是否包含产品 ID
3. 检查 API 端点是否正常工作

## 下一步优化建议

1. **订阅续费提醒**：在订阅即将到期时发送提醒
2. **订阅历史记录**：显示用户的订阅历史
3. **自动续费**：集成自动续费功能
4. **订阅管理页面**：允许用户查看和管理订阅
5. **Webhook 支持**：如果 Creem 支持，可以添加 webhook 处理支付事件

## 技术支持

如有问题，请检查：
- Supabase 文档：https://supabase.com/docs
- Next.js 文档：https://nextjs.org/docs
- Creem API 文档：https://creem.io/docs

