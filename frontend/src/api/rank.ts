import { http } from '@/http/client'
import type { RankEntryVO } from '@/types/analytics'

/** 榜单由单体（bootstrap）宿主提供，经网关兜底路由访问 */
export function getTopRank(activityId: number | string, top = 10): Promise<RankEntryVO[]> {
  return http.get<RankEntryVO[]>('/api/rank/top10', {
    params: { activityId, top },
  })
}
