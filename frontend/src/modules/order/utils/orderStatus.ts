import type { TagType } from '@/shared/utils/dict'
import type { OrderStatus } from '@/modules/order/types'

const KNOWN_STATUS: OrderStatus[] = ['QUEUING', 'CREATED', 'CREATE_FAILED', 'CANCELLED']

export interface OrderStatusMeta {
  label: string
  tagType: TagType
  terminal: boolean
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  QUEUING: { label: '排队中', tagType: 'warning', terminal: false },
  CREATED: { label: '已创建', tagType: 'success', terminal: true },
  CREATE_FAILED: { label: '创建失败', tagType: 'danger', terminal: true },
  CANCELLED: { label: '已取消', tagType: 'info', terminal: true },
}

/** 未知码值按 QUEUING 处理（与后端 VO 兜底口径一致） */
export function normalizeOrderStatus(value: string | null | undefined): OrderStatus {
  if (value && (KNOWN_STATUS as string[]).includes(value)) return value as OrderStatus
  return 'QUEUING'
}

export function isTerminalStatus(value: string | null | undefined): boolean {
  return ORDER_STATUS_META[normalizeOrderStatus(value)].terminal
}

/** 详情接口自带中文 statusDesc，优先使用 */
export function orderStatusLabel(value: string | null | undefined, statusDesc?: string): string {
  if (statusDesc && statusDesc.trim()) return statusDesc.trim()
  return ORDER_STATUS_META[normalizeOrderStatus(value)].label
}

export function orderStatusTagType(value: string | null | undefined): TagType {
  return ORDER_STATUS_META[normalizeOrderStatus(value)].tagType
}
