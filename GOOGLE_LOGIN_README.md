# Google 登录功能使用说明

本文档详细说明了如何使用已实现的 Supabase Google 登录功能。

## 功能概述

已成功集成 Supabase Google 登录功能，用户可以通过 Google 账号登录网站。登录后会自动保持登录状态，用户信息会显示在导航栏中。

## 已实现的功能

1. ✅ Google OAuth 登录集成
2. ✅ 自动登录状态管理
3. ✅ 用户信息显示（显示用户名/邮箱）
4. ✅ 登出功能
5. ✅ 多语言支持（英文/中文）
6. ✅ 响应式设计（支持移动端）
7. ✅ 登录按钮位置：在语言切换按钮前面

## 文件结构

```
qrcode_web/
├── utils/
│   └── supabase/
│       ├── client.ts          # 客户端 Supabase 实例
│       └── server.ts          # 服务端 Supabase 实例
├── contexts/
│   └── AuthContext.tsx        # 认证上下文提供者
├── app/
│   └── auth/
│       └── callback/
│           └── route.ts       # OAuth 回调处理
├── components/
│   └── Header.tsx             # 已更新，包含登录按钮
├── messages/
│   ├── en.json                # 已添加登录相关翻译
│   └── zh.json                # 已添加登录相关翻译
└── env.example                # 已添加 Supabase 配置
```

## 环境变量配置

### 1. 创建 `.env.local` 文件

如果还没有 `.env.local` 文件，请从 `env.example` 复制：

```bash
cp env.example .env.local
```

### 2. 配置 Supabase 环境变量

在 `.env.local` 文件中，确保包含以下配置：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mthqwnbjxfikntnpwrnw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aHF3bmJqeGZpa250bnB3cm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQyMDMsImV4cCI6MjA3ODc5MDIwM30.ilF2ytyOX8njMTFNHBwyNnMEvVIduCfHEwCSkAtKT28
```

**注意**：这些值已经在 `env.example` 中配置好了，如果使用提供的 Supabase 项目，无需修改。

## Supabase 配置步骤

### 1. 在 Supabase 控制台配置 Google OAuth

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目：`mthqwnbjxfikntnpwrnw`
3. 进入 **Authentication** > **Providers**
4. 找到 **Google** 提供商并启用它
5. 配置 Google OAuth：
   - 需要从 Google Cloud Console 获取：
     - **Client ID**
     - **Client Secret**
   - 在 Supabase 中填入这些值
   - 设置 **Redirect URL** 为：`https://mthqwnbjxfikntnpwrnw.supabase.co/auth/v1/callback`

### 2. Google Cloud Console 配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API**
4. 创建 **OAuth 2.0 客户端 ID**：
   - 应用类型：Web 应用
   - 授权重定向 URI：
     - 开发环境：`http://localhost:3000/auth/callback`
     - 生产环境：`https://yourdomain.com/auth/callback`
     - Supabase 回调：`https://mthqwnbjxfikntnpwrnw.supabase.co/auth/v1/callback`
5. 复制 **Client ID** 和 **Client Secret** 到 Supabase

## 安装依赖

确保已安装所有必要的依赖：

```bash
npm install
```

如果之前没有安装 Supabase 相关包，运行：

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## 运行项目

### 开发环境

```bash
npm run dev
```

访问 `http://localhost:3000` 查看网站。

### 生产环境

```bash
npm run build
npm run start
```

## 使用说明

### 用户登录流程

1. **点击登录按钮**
   - 在导航栏右侧，语言切换按钮前面，有一个 "Sign in with Google" 按钮（英文）或 "使用 Google 登录" 按钮（中文）

2. **Google 授权**
   - 点击按钮后，会跳转到 Google 登录页面
   - 用户选择 Google 账号并授权

3. **自动登录**
   - 授权成功后，自动跳转回网站
   - 用户信息会显示在导航栏中
   - 显示格式：`欢迎, [用户名]` 或 `Welcome, [username]`

4. **登出**
   - 点击 "Sign Out" 或 "登出" 按钮即可退出登录

### 登录状态

- **未登录**：显示 "Sign in with Google" / "使用 Google 登录" 按钮
- **已登录**：显示用户信息和 "Sign Out" / "登出" 按钮
- **加载中**：显示 "Loading..." / "加载中..."

## 代码说明

### 认证上下文 (`contexts/AuthContext.tsx`)

提供全局认证状态管理：

```typescript
const { user, session, loading, signInWithGoogle, signOut } = useAuth();
```

- `user`: 当前登录用户对象（null 如果未登录）
- `session`: 当前会话对象
- `loading`: 是否正在加载认证状态
- `signInWithGoogle()`: 触发 Google 登录
- `signOut()`: 登出当前用户

### Header 组件 (`components/Header.tsx`)

已更新，包含登录功能：

- 使用 `useAuth()` hook 获取认证状态
- 根据登录状态显示不同的 UI
- 登录按钮位于语言切换按钮前面

### OAuth 回调 (`app/auth/callback/route.ts`)

处理 Google OAuth 回调：

- 接收授权码
- 与 Supabase 交换会话
- 重定向回原页面

## 多语言支持

登录相关的文本已添加到翻译文件：

**英文** (`messages/en.json`):
- `signIn`: "Sign In"
- `signOut`: "Sign Out"
- `signInWithGoogle`: "Sign in with Google"
- `welcome`: "Welcome"
- `loading`: "Loading..."

**中文** (`messages/zh.json`):
- `signIn`: "登录"
- `signOut`: "登出"
- `signInWithGoogle`: "使用 Google 登录"
- `welcome`: "欢迎"
- `loading`: "加载中..."

## 样式说明

登录按钮和用户信息的样式已添加到 `app/globals.css`：

- `.auth-button`: 登录/登出按钮样式
- `.user-info`: 用户信息容器
- `.user-name`: 用户名显示
- `.header-actions`: 头部操作区域（包含登录和语言切换）

## 故障排除

### 1. 登录按钮不显示

- 检查 `.env.local` 文件是否存在且包含 Supabase 配置
- 确认环境变量名称正确（必须以 `NEXT_PUBLIC_` 开头）
- 重启开发服务器

### 2. Google 登录失败

- 检查 Supabase 中 Google 提供商是否已启用
- 确认 Google Cloud Console 中的重定向 URI 配置正确
- 检查浏览器控制台是否有错误信息

### 3. 登录后立即退出

- 检查 Supabase 项目设置中的 Site URL 是否正确
- 确认回调 URL 配置正确

### 4. 环境变量未生效

- 确保变量名以 `NEXT_PUBLIC_` 开头（客户端可访问）
- 重启开发服务器
- 清除浏览器缓存

## 安全注意事项

1. **不要提交 `.env.local` 到版本控制**
   - 确保 `.env.local` 在 `.gitignore` 中

2. **生产环境配置**
   - 在生产环境中使用正确的 Supabase URL 和密钥
   - 确保 Google OAuth 重定向 URI 包含生产域名

3. **API 密钥安全**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是公开的，但 Supabase 有行级安全策略保护
   - 不要在客户端代码中暴露服务端密钥

## 下一步

登录功能已完全实现。你可以：

1. 在需要用户认证的页面中使用 `useAuth()` hook
2. 根据用户状态显示不同的内容
3. 在 API 路由中使用服务端 Supabase 客户端验证用户身份
4. 实现基于用户的数据存储和检索

## 技术支持

如有问题，请检查：
- Supabase 文档：https://supabase.com/docs
- Next.js 文档：https://nextjs.org/docs
- Google OAuth 文档：https://developers.google.com/identity/protocols/oauth2

