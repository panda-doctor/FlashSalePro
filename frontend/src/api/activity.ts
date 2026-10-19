import { http } from '@/http/client'
import type {
  ActivityCheckResponse,
  ActivityItemVO,
  ActivityRequest,
  ActivitySaveResult,
  PreheatResult,
  ResetStockResult,
  SeckillActivityVO,
} from '@/types/activity'

/** 活动列表：裸数组，无分页参数 */
export function listActivities(): Promise<ActivityItemVO[]> {
  return http.get<ActivityItemVO[]>('/api/seckill/activities')
}

export function getActivity(activityId: number | string): Promise<SeckillActivityVO> {
  return http.get<SeckillActivityVO>(`/api/seckill/activities/${activityId}`)
}

/** 资格预检：需登录；userId 可省略，传了必须等于会话用户 */
export function checkEligibility(activityId: number | string, userId?: number): Promise<ActivityCheckResponse> {
  return http.get<ActivityCheckResponse>(`/api/seckill/activities/${activityId}/check`, {
    params: userId ? { userId } : undefined,
  })
}

/** 管理端：创建/更新活动（需 X-Admin-Token） */
export function saveAdminActivity(payload: ActivityRequest): Promise<ActivitySaveResult> {
  return http.post<ActivitySaveResult>('/api/admin/seckill/activities', payload, { admin: true })
}

export function preheatActivity(activityId: number): Promise<PreheatResult> {
  return http.post<PreheatResult>(`/api/admin/seckill/activities/${activityId}/preheat`, undefined, {
    admin: true,
  })
}

export function resetActivityStock(activityId: number): Promise<ResetStockResult> {
  return http.post<ResetStockResult>(`/api/admin/seckill/activities/${activityId}/reset-stock`, undefined, {
    admin: true,
  })
}
