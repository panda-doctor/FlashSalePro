import { http } from '@/shared/api/client'
import type { PageResponse } from '@/shared/types/common'
import type {
  ActivityItemVO,
  ActivityRequest,
  ActivitySaveResult,
  AdminActivityQuery,
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

/** 管理端活动分页（含全部状态，关键字 + 状态过滤） */
export function pageAdminActivities(
  params: AdminActivityQuery,
  signal?: AbortSignal,
): Promise<PageResponse<ActivityItemVO>> {
  return http.get<PageResponse<ActivityItemVO>>('/api/admin/seckill/activities', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      keyword: params.keyword || undefined,
      status: params.status && params.status !== 'ALL' ? params.status : undefined,
    },
    admin: true,
    signal,
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
