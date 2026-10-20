import { http } from '@/shared/api/client'
import type { ActivityMetricsVO, RankEntryVO } from '@/modules/analytics/types'

/** 榜单由单体（bootstrap）宿主提供，经网关兜底路由访问 */
export function getTopRank(activityId: number | string, top = 10): Promise<RankEntryVO[]> {
  return http.get<RankEntryVO[]>('/api/rank/top10', {
    params: { activityId, top },
  })
}

/** 活动实时指标：由单体（bootstrap）宿主提供，需 X-Admin-Token */
export function getActivityMetrics(activityId: number | string): Promise<ActivityMetricsVO> {
  return http.get<ActivityMetricsVO>(`/api/admin/seckill/activities/${activityId}/metrics`, {
    admin: true,
  })
}
