/**
 * 契约来源：
 * flash-sale-domain-model/.../domain/enums/ActivityStatusEnum.java
 * flash-sale-activity-core/.../activity/{vo/ActivityItemVO,vo/SeckillActivityVO}.java
 * flash-sale-activity-core/.../activity/dto/request/ActivityRequest.java
 * flash-sale-seckill-core/.../seckill/dto/{request/SeckillRequest,response/SeckillResponse}.java
 */

export type ActivityStatus = 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'SOLD_OUT' | 'CANCELLED'

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

/** GET /api/admin/seckill/activities 的查询参数 */
export interface AdminActivityQuery {
  page: number
  pageSize: number
  keyword?: string
  /** ALL 或空表示不过滤 */
  status?: ActivityStatus | 'ALL'
}
