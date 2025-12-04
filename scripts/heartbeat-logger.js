// 简单的 Node 后台定时任务示例：
// 每隔一小时向 Supabase 的 heartbeat_logs 表插入一条日志。
//
// 使用方式（需先在本地配置好 .env — 包含 NEXT_PUBLIC_SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY）：
//   node scripts/heartbeat-logger.js
//
// 注意：此脚本通常适合在自托管/长期运行的 Node 环境中使用；
// 如果部署在 Vercel 这类无状态平台，更推荐使用“定时触发 HTTP 调用 /api/heartbeat-log”的方式。

/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require('@supabase/supabase-js');

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase service role configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false
    }
  });
}

async function insertHeartbeatLog() {
  const supabase = createServiceRoleClient();
  const message = `Heartbeat (script) at ${new Date().toISOString()}`;

  const { error } = await supabase.from('heartbeat_logs').insert({
    message
  });

  if (error) {
    console.error(
      '[Heartbeat Script] Failed to insert log:',
      error.message
    );
  } else {
    console.log('[Heartbeat Script] Log inserted:', message);
  }
}

async function main() {
  console.log(
    '[Heartbeat Script] Started. It will insert a log every hour.'
  );

  // 先立即插入一次
  await insertHeartbeatLog();

  // 每隔一小时执行一次（3600000 ms）
  setInterval(() => {
    insertHeartbeatLog().catch((err) => {
      console.error(
        '[Heartbeat Script] Unexpected error:',
        err
      );
    });
  }, 60 * 60 * 1000);
}

main().catch((err) => {
  console.error('[Heartbeat Script] Fatal error:', err);
  process.exit(1);
});


