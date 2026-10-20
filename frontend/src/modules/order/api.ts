import { http } from '@/shared/api/client'
import type { PageResponse } from '@/shared/types/common'
import type {
  AdminOrderQuery,
  AdminOrderVO,
  DeadLetterBatchReplayResult,
  DeadLetterItemVO,
  DeadLetterQuery,
  DeadLetterReplayRequest,
  DeadLetterReplayResult,
  OrderDetail,
  OrderListItemVO,
} from '@/modules/order/types'

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

/** 管理端订单分页 */
export function pageAdminOrders(
  query: AdminOrderQuery,
  signal?: AbortSignal,
): Promise<PageResponse<AdminOrderVO>> {
  return http.get<PageResponse<AdminOrderVO>>('/api/admin/orders', {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      orderNo: query.orderNo || undefined,
      activityId: query.activityId || undefined,
      userId: query.userId || undefined,
      status: query.status && query.status !== 'ALL' ? query.status : undefined,
    },
    admin: true,
    signal,
  })
}

export function getAdminOrder(orderNo: string): Promise<AdminOrderVO> {
  return http.get<AdminOrderVO>(`/api/admin/orders/${encodeURIComponent(orderNo)}`, { admin: true })
}

/** 管理端死信分页（只读日志，重放仍走 replay / replay-batch） */
export function pageAdminDeadLetters(
  query: DeadLetterQuery,
  signal?: AbortSignal,
): Promise<PageResponse<DeadLetterItemVO>> {
  return http.get<PageResponse<DeadLetterItemVO>>('/api/admin/seckill/dead-letters', {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      activityId: query.activityId || undefined,
    },
    admin: true,
    signal,
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
