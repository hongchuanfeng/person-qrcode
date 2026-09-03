import { NextResponse } from 'next/server';

// 此项目已经迁移到 MySQL 邮箱/密码登录，不再使用 Supabase OAuth 回调。
// 保留这个路径用于兼容旧链接，统一跳转到首页。
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') || '/';
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
