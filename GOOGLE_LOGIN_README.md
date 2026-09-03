# 邮箱注册与登录使用说明

本项目已经把原来基于 Supabase 的 Google OAuth 登录迁移到了**自建的 MySQL + 邮箱/密码**登录体系。
用户可以使用邮箱注册账号，然后通过邮箱 + 密码登录；登录态通过 HTTP-only Cookie 维持。

## 功能概述

- 邮箱 + 密码注册与登录
- bcrypt 哈希存储密码
- 基于 HTTP-only Cookie 的会话
- 多语言支持（en/zh/de/fr/ru/pt/ar/es/ja）
- 响应式 UI（兼容移动端）
- 注册/登录按钮位于 Header 右上角

## 文件结构

```
person-qrcode/
├── utils/
│   └── mysql/
│       ├── pool.ts          # MySQL 连接池
│       ├── users.ts         # 用户表 CRUD
│       ├── sessions.ts      # 会话表 CRUD
│       ├── subscriptions.ts # 订阅表 CRUD
│       ├── auth.ts          # bcrypt + Cookie 辅助函数
│       └── heartbeat-log.ts # 心跳日志写入
├── contexts/
│   └── AuthContext.tsx      # 全局认证上下文（替换原 Supabase 版本）
├── components/
│   ├── AuthForm.tsx         # 登录/注册表单
│   └── Header.tsx           # 顶部导航（含登录/注册按钮）
├── app/
│   ├── signin/page.tsx      # /signin 顶层路由
│   ├── signup/page.tsx      # /signup 顶层路由
│   ├── [locale]/signin/page.tsx
│   ├── [locale]/signup/page.tsx
│   ├── auth/callback/route.ts # 旧 OAuth 回调占位（仅做重定向）
│   └── api/
│       └── auth/
│           ├── register/route.ts  # POST 注册
│           ├── login/route.ts     # POST 登录
│           ├── logout/route.ts    # POST 登出
│           └── session/route.ts   # GET 当前会话
├── scripts/
│   ├── mysql_schema.sql     # MySQL 表结构脚本
│   └── init-mysql.js        # 通过 Node 执行上面 SQL 的脚本
└── env.example              # 已切换到 MYSQL_* 变量
```

## 环境变量配置

`.env.local` 中需要包含 MySQL 配置（其他变量保持不变）：

```env
CREEM_API_KEY=creem_4QGhR5aZTjFxJELOoLmQa6
APP_BASE_URL=http://localhost:3000
CREEM_WEBHOOK_SECRET=replace-with-strong-secret

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=person_qrcode
MYSQL_PASSWORD=replace-with-strong-password
MYSQL_DATABASE=person_qrcode
MYSQL_POOL_LIMIT=10

SUBSCRIPTION_TEST_SECRET=replace-with-test-secret
```

## 初始化 MySQL 表

### 方式 1：使用 mysql CLI

```bash
mysql -h 127.0.0.1 -u root -p person_qrcode < scripts/mysql_schema.sql
```

### 方式 2：通过 npm 脚本

```bash
npm run db:init
```

## 安装依赖

```bash
npm install
```

如果之前已经安装过 Supabase 相关包，可以删除：

```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

新增的依赖：

- `mysql2`：MySQL 驱动
- `bcryptjs`：密码哈希

## 运行项目

```bash
npm run dev
```

访问 `http://localhost:3000` 查看网站。

## 使用说明

### 注册流程

1. 点击 Header 右上角的“使用邮箱注册”按钮
2. 填写邮箱、密码（至少 6 位）、可选昵称
3. 提交后会自动创建账号并登录

### 登录流程

1. 点击 Header 右上角的“使用邮箱登录”按钮
2. 填写已注册的邮箱和密码
3. 成功后跳转回来源页面

### 登出

点击用户菜单中的“登出”即可。

## API 接口

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/auth/register` | 注册新账号，自动赠送 500 积分并写入会话，返回 `signupBonus` |
| POST | `/api/auth/login` | 邮箱 + 密码登录 |
| POST | `/api/auth/logout` | 销毁当前会话 |
| GET | `/api/auth/session` | 获取当前会话用户（含 `credits`） |

## 数据库表结构

详见 `scripts/mysql_schema.sql`：

- `users`：存储用户邮箱、密码哈希、昵称、邮箱验证时间、**积分余额（credits）**
- `user_sessions`：存储会话令牌 + 过期时间
- `subscriptions`：用户订阅记录
- `heartbeat_logs`：应用保活心跳日志
- `credit_transactions`：积分变动流水（注册赠送、消费、运营调整等）

## 初始化 / 迁移数据库

**全新部署：**

```bash
node scripts/init-mysql.js
```

**已有旧库（缺 `credits` 列 / `credit_transactions` 表）：**

```bash
# 仅补字段、建表，不动老用户积分
node scripts/migrate-credits.js

# 给所有 credits=0 的老用户一次性补发 500 积分
node scripts/migrate-credits.js --grant-existing
```

迁移脚本会幂等地检查 `information_schema`，不会重复添加列或表。

## 新用户积分奖励

注册即送 500 积分（常量 `SIGNUP_BONUS_CREDITS`，见 `utils/mysql/credits.ts`）。
- 注册接口 `/api/auth/register` 会写入 `users.credits = 500` 并在 `credit_transactions` 留下一条 `signup_bonus` 流水。
- 登录后右上角会显示金色积分徽章，悬浮菜单里也能看到完整余额。
- 首页顶部会展示醒目的"注册即送 500 积分"横幅（仅未登录用户可见）。

## 迁移提示

- 旧版本基于 Supabase Auth 注册的用户**无法自动迁移**到 MySQL，因为 Supabase 的密码哈希使用其专有算法。请让用户重新注册。
- 原有的 `subscriptions` / `heartbeat_logs` 数据可以手动迁移到 MySQL，字段含义保持一致。

## 安全注意事项

1. **不要提交 `.env.local`** 到版本控制
2. 生产环境务必使用强密码，并启用 HTTPS（让 Cookie 的 `secure` 选项生效）
3. 密码使用 bcrypt 哈希（10 rounds）存储，明文不会进入数据库
4. 会话 Cookie 始终是 HTTP-only，避免被前端 JS 读取

## 故障排除

### 1. 注册/登录报 500

检查 `.env.local` 中的 `MYSQL_*` 变量是否填写正确，并确认数据库已经运行过 `scripts/mysql_schema.sql`。

### 2. 已登录但页面仍然提示未登录

- 确认浏览器允许 HTTP-only Cookie
- 确认 `/api/auth/session` 返回了 `authenticated: true`

### 3. 想清空所有用户

```sql
DELETE FROM user_sessions;
DELETE FROM users;
```
