import { http } from '@/http/client'
import type { ActivityMetricsVO } from '@/types/analytics'

/** 活动实时指标：由单体（bootstrap）宿主提供，需 X-Admin-Token */
export function getActivityMetrics(activityId: number | string): Promise<ActivityMetricsVO> {
  return http.get<ActivityMetricsVO>(`/api/admin/seckill/activities/${activityId}/metrics`, {
    admin: true,
  })
}
