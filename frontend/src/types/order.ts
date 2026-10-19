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
