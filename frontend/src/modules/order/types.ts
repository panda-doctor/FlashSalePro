/** 契约来源：flash-sale-domain-model/.../enums/OrderStatusEnum.java 与 flash-sale-order-core order/vo/* */

export type OrderStatus = 'QUEUING' | 'CREATED' | 'CREATE_FAILED' | 'CANCELLED'

/**
 * GET /api/seckill/orders/{orderNo}
 * 后端使用 Map 拼装：orderNo/status/statusDesc 必有，落库后追加其余字段。
 */
export interface OrderDetail {
  orderNo: string
  status: OrderStatus
  statusDesc: string
  activityId?: number
  productId?: number
  userId?: number
  /** 单位：分 */
  seckillPrice?: number
  orderId?: number
  /** 无 @JsonFormat → ISO-8601 */
  createdAt?: string
}

export interface OrderListItemVO {
  orderNo: string
  activityId: number
  productId: number
  /** 枚举名；未知码值后端兜底为 QUEUING */
  status: string
  /** ISO-8601 */
  createdAt: string
}

export interface DeadLetterReplayRequest {
  originalMessageId: string
}

export interface DeadLetterReplayResult {
  originalMessageId: string
  replayMessageId: string
}

export interface DeadLetterBatchReplayResult {
  attempted: number
  succeeded: number
  failed: number
  /** 元素格式 "<id>：<错误信息>" */
  failures: string[]
}

/** GET /api/admin/orders 的元素（仅管理令牌可达） */
export interface AdminOrderVO {
  orderId: number
  orderNo: string
  activityId: number
  productId: number
  userId: number
  /** 单位：分 */
  seckillPrice: number
  status: OrderStatus
  statusDesc: string
  failureReason: string | null
  streamMessageId: string | null
  createdAt: string
  updatedAt: string | null
}

export interface AdminOrderQuery {
  page: number
  pageSize: number
  orderNo?: string
  activityId?: number
  userId?: number
  status?: OrderStatus | 'ALL'
}

/** GET /api/admin/seckill/dead-letters 的元素（message_log.status=3） */
export interface DeadLetterItemVO {
  streamMessageId: string
  orderNo: string | null
  activityId: number | null
  productId: number | null
  userId: number | null
  retryCount: number | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface DeadLetterQuery {
  page: number
  pageSize: number
  keyword?: string
  activityId?: number
}
