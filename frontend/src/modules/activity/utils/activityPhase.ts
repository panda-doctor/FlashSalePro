import type { ActivityStatus } from '@/modules/activity/types'
import type { TagType } from '@/shared/utils/dict'
import { parseActivityTime } from '@/shared/utils/time'

/**
 * 展示态：在后端 ActivityStatus 之外增加 NOT_PREHEATED。
 * 原因：活动 status 是创建时快照、不随时间流转，且未预热时 stock 为 null，
 * 仅靠 status 无法表达“可抢 / 不可抢”。
 */
export type ActivityDisplayState =
  | 'NOT_PREHEATED'
  | 'NOT_STARTED'
  | 'RUNNING'
  | 'SOLD_OUT'
  | 'ENDED'
  | 'CANCELLED'

export interface ActivityPhaseInput {
  startTime: string
  endTime: string
  status: ActivityStatus
  stock: number | null
  /** 列表接口有，详情接口没有；false 表示明确未预热 */
  preheated?: boolean | null
  now?: number
}

export const ACTIVITY_STATE_META: Record<
  ActivityDisplayState,
  { label: string; tagType: TagType; purchasable: boolean }
> = {
  NOT_PREHEATED: { label: '未预热', tagType: 'warning', purchasable: false },
  NOT_STARTED: { label: '未开始', tagType: 'info', purchasable: false },
  RUNNING: { label: '进行中', tagType: 'success', purchasable: true },
  SOLD_OUT: { label: '已售罄', tagType: 'danger', purchasable: false },
  ENDED: { label: '已结束', tagType: 'info', purchasable: false },
  CANCELLED: { label: '已取消', tagType: 'danger', purchasable: false },
}

function fromSnapshot(status: ActivityStatus, stock: number | null): ActivityDisplayState {
  if (status === 'CANCELLED') return 'CANCELLED'
  if (status === 'ENDED') return 'ENDED'
  if (status === 'SOLD_OUT') return 'SOLD_OUT'
  if (status === 'NOT_STARTED') return 'NOT_STARTED'
  return (stock ?? 0) <= 0 ? 'SOLD_OUT' : 'RUNNING'
}

/**
 * 判定顺序：已取消 → 时间窗 → 预热/库存 → 快照状态兜底。
 * 时间窗优先是硬规则，否则活动开始后按钮仍会被 status=NOT_STARTED 锁死。
 */
export function resolveActivityState(input: ActivityPhaseInput): ActivityDisplayState {
  if (input.status === 'CANCELLED') return 'CANCELLED'

  const start = parseActivityTime(input.startTime)
  const end = parseActivityTime(input.endTime)
  const now = input.now ?? Date.now()

  if (!start || !end) return fromSnapshot(input.status, input.stock)

  if (now < start.getTime()) return 'NOT_STARTED'
  if (now >= end.getTime()) return 'ENDED'
  if (input.preheated === false || input.stock === null) return 'NOT_PREHEATED'
  if (input.stock <= 0) return 'SOLD_OUT'
  return 'RUNNING'
}

export function isFinishedState(state: ActivityDisplayState): boolean {
  return state === 'ENDED' || state === 'CANCELLED' || state === 'SOLD_OUT'
}

/** 列表排序权重：进行中 → 未开始 → 其余 */
export function activitySortWeight(state: ActivityDisplayState): number {
  if (state === 'RUNNING') return 0
  if (state === 'NOT_STARTED') return 1
  return 2
}
