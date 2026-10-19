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
