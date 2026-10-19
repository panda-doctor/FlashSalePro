import { http } from '@/http/client'
import type {
  DeadLetterBatchReplayResult,
  DeadLetterReplayRequest,
  DeadLetterReplayResult,
  OrderDetail,
  OrderListItemVO,
} from '@/types/order'

/** 订单详情：需登录 + 归属校验；不存在的单号也返回 status=QUEUING */
export function getOrderDetail(orderNo: string): Promise<OrderDetail> {
  return http.get<OrderDetail>(`/api/seckill/orders/${encodeURIComponent(orderNo)}`)
}

/** 我的订单：需登录；activityId 可选 */
export function listMyOrders(activityId?: number): Promise<OrderListItemVO[]> {
  return http.get<OrderListItemVO[]>('/api/seckill/users/me/orders', {
    params: activityId ? { activityId } : undefined,
  })
}

/** 管理端：死信回放（M6 使用） */
export function replayDeadLetter(payload: DeadLetterReplayRequest): Promise<DeadLetterReplayResult> {
  return http.post<DeadLetterReplayResult>('/api/admin/seckill/dead-letters/replay', payload, {
    admin: true,
  })
}

export function replayDeadLetterBatch(originalMessageIds: string[]): Promise<DeadLetterBatchReplayResult> {
  return http.post<DeadLetterBatchReplayResult>(
    '/api/admin/seckill/dead-letters/replay-batch',
    { originalMessageIds },
    { admin: true },
  )
}

/** 管理端：抓取活动指标快照（M6 使用） */
export function captureSnapshot(activityId: number): Promise<void> {
  return http.post<void>(`/api/admin/seckill/activities/${activityId}/snapshot`, undefined, {
    admin: true,
  })
}
