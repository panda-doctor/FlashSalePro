import { http } from '@/shared/api/client'
import type { ActivityCheckResponse, SeckillRequest, SeckillResponse } from '@/modules/seckill/types'

/**
 * 秒杀执行：需会话 + CSRF。
 * 成功 code=0 且 result=QUEUED；业务拒绝为 HTTP 200 + 非 0 code（40901/40902/42900）。
 */
export function executeSeckill(payload: SeckillRequest): Promise<SeckillResponse> {
  return http.post<SeckillResponse>('/api/seckill/execute', payload)
}

/** 资格预检：需登录；userId 可省略，传了必须等于会话用户 */
export function checkEligibility(
  activityId: number | string,
  userId?: number,
): Promise<ActivityCheckResponse> {
  return http.get<ActivityCheckResponse>(`/api/seckill/activities/${activityId}/check`, {
    params: userId ? { userId } : undefined,
  })
}
