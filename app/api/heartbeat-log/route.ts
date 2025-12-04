import { NextResponse } from 'next/server';
import { insertHeartbeatLog } from '@/utils/supabase/heartbeat-log';

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

    return NextResponse.json({
      success: true,
      message: 'Heartbeat log inserted'
    });
  } catch (error) {
    console.error('[Heartbeat Log] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}



