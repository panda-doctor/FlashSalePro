/**
 * 秒杀执行域类型：事实来源为 flash-sale-seckill / flash-sale-order 的 DTO。
 * 活动自身的展示类型在 `modules/activity/types.ts`。
 */
import type { ActivityStatus } from '@/modules/activity/types'

/** 后端无对应枚举类，result 是字符串字面量 */
export type SeckillResult = 'QUEUED' | 'SOLD_OUT' | 'DUPLICATED' | 'RATE_LIMITED' | 'REJECTED'

export type ActivityCheckReason =
  | 'ALLOW'
  | 'ACTIVITY_NOT_PREHEATED'
  | 'ACTIVITY_NOT_STARTED'
  | 'ACTIVITY_ENDED'
  | 'ACTIVITY_SOLD_OUT'
  | 'ACTIVITY_CANCELLED'

/** GET /api/seckill/activities/{id}/check（需登录） */
export interface ActivityCheckResponse {
  activityId: number
  userId: number
  canJoin: boolean
  activityStatus: ActivityStatus
  reason: ActivityCheckReason
}

export interface SeckillRequest {
  activityId: number
  /** 可空；传了必须与会话用户一致 */
  userId?: number
  /** 可空，不参与业务 */
  productId?: number
}

export interface SeckillResponse {
  activityId: number
  userId: number
  result: SeckillResult
  /** 失败时为 null，且该键会显式出现 */
  orderNo: string | null
}
