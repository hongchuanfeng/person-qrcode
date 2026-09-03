# 批量生成订阅功能说明文档

本文档详细说明了批量生成页面的登录和订阅检查功能，以及支付成功后订阅信息的保存机制。

## 功能概述

已实现以下功能：

1. ✅ **登录检查**：点击批量生成按钮时，先检查用户是否已登录
2. ✅ **订阅检查**：验证用户是否已订阅有效套餐
3. ✅ **支付成功后订阅保存**：用户支付成功后，自动将订阅信息保存到 MySQL
4. ✅ **订阅状态实时检查**：页面加载时自动检查用户订阅状态
5. ✅ **邮箱 + 密码登录**：自建 MySQL 会话体系（替代原来的 Google OAuth）

## 数据库表结构

### MySQL `subscriptions` 表

执行 `scripts/mysql_schema.sql` 即可创建。下面这段是精简版（仅展示 `subscriptions` 表）：

```sql
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`              CHAR(36)     NOT NULL,
  `user_id`         CHAR(36)     NOT NULL,
  `product_id`      VARCHAR(128) NOT NULL,
  `plan_type`       VARCHAR(16)  NOT NULL,
  `order_id`        VARCHAR(128) DEFAULT NULL,
  `subscription_id` VARCHAR(128) DEFAULT NULL,
  `start_date`      DATETIME     NOT NULL,
  `end_date`        DATETIME     NOT NULL,
  `status`          VARCHAR(32)  NOT NULL DEFAULT 'active',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user_id` (`user_id`),
  KEY `idx_subscriptions_user_end_date` (`user_id`, `end_date`),
  KEY `idx_subscriptions_subscription_id` (`subscription_id`),
  CONSTRAINT `fk_subscriptions_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_subscriptions_plan_type`
    CHECK (`plan_type` IN ('monthly', 'quarterly', 'yearly'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 表字段说明

- `id`：订阅记录的唯一标识符（UUID，由应用层生成）
- `user_id`：本系统用户 ID，对应 `users.id`
- `product_id`：Creem 产品 ID
  - 月度计划：`prod_4L6YdpnlJEdRjzPg9OjH8Z`
  - 季度计划：`prod_6MCeuAFjzFqFZduAn74Ew7`
  - 年度计划：`prod_6LKkd6OJ8pLCesUdoVNV9I`
- `plan_type`：套餐类型（`monthly`, `quarterly`, `yearly`）
- `start_date`：订阅开始时间（UTC，MySQL `DATETIME`）
- `end_date`：订阅结束时间（UTC，MySQL `DATETIME`）
- `order_id`：Creem 订单 ID
- `subscription_id`：Creem 订阅 ID
- `status`：订阅状态（默认 `active`）
- `created_at` / `updated_at`：审计字段

## 功能流程

### 1. 批量生成流程

```
用户点击"生成二维码"按钮
    ↓
检查用户是否登录
    ↓ (未登录)
显示错误提示 → 引导用户去 /signin 登录
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
保存到 MySQL subscriptions 表
    ↓
显示成功消息
```

## API 端点

### 1. 检查订阅状态

**端点**：`GET /api/subscriptions/check`

**功能**：检查当前登录用户的订阅状态

**响应**：

```json
{
  "authenticated": true,
  "subscribed": true,
  "userId": "user-uuid"
}
```

### 2. 创建订阅

**端点**：`POST /api/subscriptions/create`

**功能**：在支付成功后创建订阅记录

**请求体**：

```json
{
  "userId": "user-uuid",
  "productId": "prod_4L6YdpnlJEdRjzPg9OjH8Z",
  "orderId": "optional-order-id",
  "subscriptionId": "optional-subscription-id"
}
```

**响应**：

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
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## 代码文件说明

### 1. 工具函数

#### `utils/mysql/subscriptions.ts`
- `hasActiveSubscription(userId)`：检查用户是否有有效订阅
- `getActiveSubscription(userId)`：获取用户的有效订阅
- `createSubscription(...)`：创建新的订阅记录
- `updateSubscription(...)`：更新订阅记录（webhook 使用）
- `findLatestSubscription(userId)`：查找用户最近一条订阅（webhook 使用）
- `listUserSubscriptions(userId)`：获取用户所有订阅

#### `utils/subscription-helper.ts`
- `getPlanTypeFromProductId(productId)`：根据产品 ID 获取套餐类型
- `calculateEndDate(startDate, planType)`：根据套餐类型计算结束日期

### 2. API 路由

#### `app/api/subscriptions/check/route.ts`
检查用户订阅状态的 API 端点

#### `app/api/subscriptions/create/route.ts`
创建订阅记录的 API 端点

#### `app/api/subscriptions/test/route.ts`
测试订阅插入 API 端点（需要 `SUBSCRIPTION_TEST_SECRET`）

#### `app/api/creem/webhook/route.ts`
Creem 支付回调，更新或新建订阅

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

- **月度计划**：30 天
- **季度计划**：90 天
- **年度计划**：365 天

结束日期 = 开始日期 + 套餐时长

## 使用说明

### 1. 初始化 MySQL

```bash
# 方式 1：使用 mysql CLI
mysql -h 127.0.0.1 -u root -p person_qrcode < scripts/mysql_schema.sql

# 方式 2：使用 npm 脚本（需要 .env.local 中已配置 MYSQL_*）
npm run db:init
```

### 2. 配置环境变量

确保 `.env.local` 文件包含 MySQL 配置：

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=person_qrcode
MYSQL_PASSWORD=replace-with-strong-password
MYSQL_DATABASE=person_qrcode
MYSQL_POOL_LIMIT=10

CREEM_API_KEY=...
APP_BASE_URL=...
CREEM_WEBHOOK_SECRET=...
SUBSCRIPTION_TEST_SECRET=...
```

### 3. 测试流程

#### 测试登录检查
1. 未登录状态下访问批量生成页面
2. 上传文件并点击"生成二维码"
3. 应该显示"请先登录"提示，并引导到 `/signin`

#### 测试订阅检查
1. 已登录但未订阅状态下
2. 上传文件并点击"生成二维码"
3. 应该显示"需要订阅套餐"提示

#### 测试支付成功
1. 选择套餐并完成支付
2. 跳转到成功页面
3. 应该自动创建订阅记录
4. 返回批量生成页面，应该可以正常生成

## 错误处理

### 常见错误及解决方案

1. **"请先登录才能生成二维码"**
   - 原因：用户未登录
   - 解决：点击登录按钮完成邮箱 + 密码登录

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

1. **密码哈希**：使用 bcrypt（10 rounds）存储密码哈希
2. **HTTP-only Cookie**：会话 Cookie 是 HTTP-only，避免被前端 JS 读取
3. **用户验证**：所有订阅相关 API 都会验证当前会话用户身份
4. **数据完整性**：通过外键约束保证 `subscriptions.user_id` 必须存在于 `users` 中
5. **删除级联**：删除用户时自动删除其订阅记录

## 多语言支持

所有错误消息和提示都已添加到翻译文件：

**英文** (`messages/en.json`):
- `error.loginRequired`：Please log in to generate QR codes...
- `error.subscriptionRequired`：A subscription is required...
- `error.subscriptionCheckFailed`：Failed to check subscription status...

**中文** (`messages/zh.json`):
- `error.loginRequired`：请先登录才能生成二维码...
- `error.subscriptionRequired`：批量生成功能需要订阅套餐...
- `error.subscriptionCheckFailed`：检查订阅状态失败...

## 产品 ID 映射

| 套餐类型 | 产品 ID | 价格 | 时长 |
|---------|---------|------|------|
| 月度计划 | `prod_4L6YdpnlJEdRjzPg9OjH8Z` | $9.9 | 30 天 |
| 季度计划 | `prod_6MCeuAFjzFqFZduAn74Ew7` | $19.9 | 90 天 |
| 年度计划 | `prod_6LKkd6OJ8pLCesUdoVNV9I` | $69.9 | 365 天 |

## 故障排除

### 订阅记录未创建

1. 检查 MySQL 表是否正确创建（`scripts/mysql_schema.sql`）
2. 检查 `.env.local` 中的 `MYSQL_*` 变量是否正确
3. 检查 API 端点日志是否有错误
4. 验证用户是否已登录

### 订阅检查总是返回 false

1. 检查 `end_date` 是否在未来
2. 验证数据库查询是否正确
3. 检查用户 ID 是否匹配

### 支付成功后页面报错

1. 检查 Creem webhook 是否正确收到回调
2. 检查 Creem webhook 中的 `metadata.internal_customer_id` 是否包含用户 UUID
3. 查看 `app/api/creem/webhook/route.ts` 的日志输出
