import { http } from '@/http/client'
import type { SeckillRequest, SeckillResponse } from '@/types/activity'

/**
 * 秒杀执行：需会话 + CSRF。
 * 成功 code=0 且 result=QUEUED；业务拒绝为 HTTP 200 + 非 0 code（40901/40902/42900）。
 */
export function executeSeckill(payload: SeckillRequest): Promise<SeckillResponse> {
  return http.post<SeckillResponse>('/api/seckill/execute', payload)
}
