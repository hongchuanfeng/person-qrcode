import { NextResponse } from 'next/server';
import { insertHeartbeatLog } from '@/utils/supabase/heartbeat-log';

// 强制动态渲染，禁用所有缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/heartbeat-log
 * 功能：向 heartbeat_logs 表写入一条日志
 *
 * 用法示例：
 *   curl "http://localhost:3000/api/heartbeat-log"
 */
export async function GET() {
  try {
    await insertHeartbeatLog();

    return NextResponse.json(
      {
        success: true,
        message: 'Heartbeat log inserted',
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('[Heartbeat Log] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : String(error)
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}



