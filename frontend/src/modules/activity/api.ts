import { http } from '@/shared/api/client'
import type {
  ActivityItemVO,
  ActivityRequest,
  ActivitySaveResult,
  PreheatResult,
  ResetStockResult,
  SeckillActivityVO,
} from '@/modules/activity/types'

/** 活动列表：裸数组，无分页参数 */
export function listActivities(): Promise<ActivityItemVO[]> {
  return http.get<ActivityItemVO[]>('/api/seckill/activities')
}

export function getActivity(activityId: number | string): Promise<SeckillActivityVO> {
  return http.get<SeckillActivityVO>(`/api/seckill/activities/${activityId}`)
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
