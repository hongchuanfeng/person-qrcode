
create table if not exists public.heartbeat_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc'::text, now()),
  message text not null
);

comment on table public.heartbeat_logs is '应用保活/心跳日志记录表';
comment on column public.heartbeat_logs.id is '自增主键';
comment on column public.heartbeat_logs.created_at is '日志写入时间（UTC）';
comment on column public.heartbeat_logs.message is '日志内容（例如：定时任务心跳信息）';

-- ====================================================================================
-- 订阅表：subscriptions
-- 本项目中所有订阅/会员相关数据都存储在该表
-- ====================================================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),

  -- 业务用户 ID，一般对应 auth.users 表中的 id
  user_id uuid not null,

  -- 计费/商品信息
  product_id text not null,
  plan_type text not null check (plan_type in ('monthly', 'quarterly', 'yearly')),

  -- 外部订单/订阅系统 ID（如 creem）
  order_id text,
  subscription_id text,

  -- 订阅起止时间
  start_date timestamptz not null,
  end_date timestamptz not null,

  -- 订阅状态，如 active / canceled / expired 等
  status text not null default 'active',

  -- 审计字段
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.subscriptions is '用户订阅记录表';
comment on column public.subscriptions.id is '主键（UUID）';
comment on column public.subscriptions.user_id is '关联的业务用户 ID（可关联 auth.users.id）';
comment on column public.subscriptions.product_id is '订阅对应的商品/套餐 ID';
comment on column public.subscriptions.plan_type is '订阅类型：monthly / quarterly / yearly';
comment on column public.subscriptions.order_id is '外部订单 ID';
comment on column public.subscriptions.subscription_id is '外部订阅 ID';
comment on column public.subscriptions.start_date is '订阅开始时间';
comment on column public.subscriptions.end_date is '订阅结束时间';
comment on column public.subscriptions.status is '订阅当前状态';
comment on column public.subscriptions.created_at is '记录创建时间（UTC）';
comment on column public.subscriptions.updated_at is '记录最近更新时间（UTC）';

-- 可选：与 Supabase 内置 auth.users 建立外键关系（如不需要，可注释掉此行）
alter table public.subscriptions
  add constraint subscriptions_user_id_fkey
  foreign key (user_id) references auth.users(id)
  on delete cascade;

-- 索引：按用户 + 结束时间查询活跃订阅
create index if not exists idx_subscriptions_user_end_date
  on public.subscriptions (user_id, end_date desc);

-- 索引：按外部 subscription_id 查询
create index if not exists idx_subscriptions_subscription_id
  on public.subscriptions (subscription_id);



