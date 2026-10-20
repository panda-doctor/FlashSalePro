/** 契约来源：flash-sale-analytics/.../analytics/vo/{RankEntryVO,ActivityMetricsVO}.java */

export interface RankEntryVO {
  rank: number
  userId: number
  /** 毫秒时间戳，越小越靠前 */
  score: number
  orderNo: string
}

export interface ActivityMetricsVO {
  activityId: number
  /** Redis 剩余库存，可空 */
  redisStock: number | null
  orderCount: number
  queuedMessageCount: number
  successCount: number
  duplicateRejectCount: number
  rateLimitRejectCount: number
  soldOutRejectCount: number
}

/** GET /api/admin/analytics/overview */
export interface AdminOverviewVO {
  summary: {
    orderCount: number
    /** 成交额，单位：分 */
    gmv: number
    userCount: number
    todayOrderCount: number
    todayGmv: number
    deadLetterCount: number
  }
  trend: Array<{ date: string; orderCount: number; gmv: number }>
  topActivities: Array<{ activityId: number; orderCount: number; gmv: number }>
}

/** GET /api/admin/analytics/activities/{id}/snapshots */
export interface SnapshotPointVO {
  activityId: number
  redisStock: number | null
  orderCount: number | null
  queuedMessageCount: number | null
  successCount: number | null
  duplicateRejectCount: number | null
  rateLimitRejectCount: number | null
  soldOutRejectCount: number | null
  snapshotTime: string
}
