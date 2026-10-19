/**
 * 契约来源：
 * flash-sale-domain-model/.../domain/enums/ActivityStatusEnum.java
 * flash-sale-activity-core/.../activity/{vo/ActivityItemVO,vo/SeckillActivityVO}.java
 * flash-sale-activity-core/.../activity/dto/request/ActivityRequest.java
 * flash-sale-seckill-core/.../seckill/dto/{request/SeckillRequest,response/SeckillResponse}.java
 */

export type ActivityStatus = 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'SOLD_OUT' | 'CANCELLED'

/** 后端无对应枚举类，result 是字符串字面量 */
export type SeckillResult = 'QUEUED' | 'SOLD_OUT' | 'DUPLICATED' | 'RATE_LIMITED' | 'REJECTED'

export type ActivityCheckReason =
  | 'ALLOW'
  | 'ACTIVITY_NOT_PREHEATED'
  | 'ACTIVITY_NOT_STARTED'
  | 'ACTIVITY_ENDED'
  | 'ACTIVITY_SOLD_OUT'
  | 'ACTIVITY_CANCELLED'

/** GET /api/seckill/activities 的元素（裸数组，无分页） */
export interface ActivityItemVO {
  activityId: number
  productId: number
  productName: string | null
  productImage: string | null
  activityName: string
  /** yyyy-MM-dd HH:mm:ss（GMT+8） */
  startTime: string
  /** yyyy-MM-dd HH:mm:ss（GMT+8） */
  endTime: string
  seckillPrice: number
  originalPrice: number
  status: ActivityStatus
  /** Redis 实时库存；未预热时可能为 null 或回退 DB 配置值 */
  stock: number | null
  /** 可空（历史数据） */
  preheated: boolean | null
  totalStock: number
  limitPerUser: number
}

/** GET /api/seckill/activities/{id}，无 preheated 字段；stock === null 即未预热 */
export interface SeckillActivityVO {
  activityId: number
  productId: number
  activityName: string
  startTime: string
  endTime: string
  status: ActivityStatus
  seckillPrice: number
  stock: number | null
  totalStock: number
  limitPerUser: number
}

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

/** 管理端 POST /api/admin/seckill/activities */
export interface ActivityRequest {
  activityId?: number
  productId: number
  activityName: string
  /** yyyy-MM-dd HH:mm:ss */
  startTime: string
  /** yyyy-MM-dd HH:mm:ss */
  endTime: string
  seckillPrice: number
  seckillStock: number
  /** 后端 @Min(1) @Max(1)，只能为 1 */
  limitPerUser: number
}

export interface ActivitySaveResult {
  activityId: number
  status: ActivityStatus
}

export interface PreheatResult {
  activityId: number
  activityKey: string
  stockKey: string
  stock: number
}

export interface ResetStockResult {
  activityId: number
  stockKey: string
  stock: number
}
