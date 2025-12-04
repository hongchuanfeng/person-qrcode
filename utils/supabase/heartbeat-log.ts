import { createServiceRoleClient } from './service-role';

/**
 * 向 Supabase 的 heartbeat_logs 表写入一条日志
 * @param message 日志内容，默认会带上当前时间
 */
export async function insertHeartbeatLog(message?: string) {
  const supabase = createServiceRoleClient();

  const logMessage =
    message ?? `Heartbeat at ${new Date().toISOString()}`;

  const { error } = await supabase.from('heartbeat_logs').insert({
    message: logMessage
  });

  if (error) {
    // 这里抛出错误，方便在调用处统一处理/记录
    throw new Error(
      `Failed to insert heartbeat log: ${error.message}`
    );
  }
}


