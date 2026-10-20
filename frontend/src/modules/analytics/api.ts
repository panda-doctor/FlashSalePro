import { http } from '@/shared/api/client'
import type {
  ActivityMetricsVO,
  AdminOverviewVO,
  RankEntryVO,
  SnapshotPointVO,
} from '@/modules/analytics/types'

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

/** 经营看板：order 服务聚合，需 X-Admin-Token */
export function getAdminOverview(days = 7): Promise<AdminOverviewVO> {
  return http.get<AdminOverviewVO>('/api/admin/analytics/overview', {
    params: { days },
    admin: true,
  })
}

/** 单活动快照趋势（最近 N 条，倒序） */
export function getActivitySnapshots(
  activityId: number | string,
  limit = 20,
): Promise<SnapshotPointVO[]> {
  return http.get<SnapshotPointVO[]>(`/api/admin/analytics/activities/${activityId}/snapshots`, {
    params: { limit },
    admin: true,
  })
}
