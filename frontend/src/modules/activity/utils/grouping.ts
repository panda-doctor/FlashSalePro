import type { ActivityItemVO } from '@/modules/activity/types'
import { isFinishedState, type ActivityDisplayState } from '@/modules/activity/utils/activityPhase'
import { toTimestamp } from '@/shared/utils/time'

export interface ActivityEntry {
  item: ActivityItemVO
  state: ActivityDisplayState
}

export interface ActivityGroupCounts {
  UPCOMING: number
  LIVE: number
  ENDED: number
  ALL: number
}

export interface ActivityGroups {
  upcoming: ActivityEntry[]
  live: ActivityEntry[]
  ended: ActivityEntry[]
  counts: ActivityGroupCounts
}

/** 可抢购 + 未预热都归入「进行中」区块，与现有阶段筛选口径一致 */
export function isLiveState(state: ActivityDisplayState): boolean {
  return state === 'RUNNING' || state === 'NOT_PREHEATED'
}

function matchesKeyword(entry: ActivityEntry, term: string): boolean {
  if (!term) return true
  const name = entry.item.activityName.toLowerCase()
  const product = (entry.item.productName ?? '').toLowerCase()
  return name.includes(term) || product.includes(term)
}

function byStartAsc(a: ActivityEntry, b: ActivityEntry): number {
  return toTimestamp(a.item.startTime) - toTimestamp(b.item.startTime) || a.item.activityId - b.item.activityId
}

/**
 * 活动页三区块分组：
 * - 即将开场按开场时间升序（越早越前）
 * - 进行中先按可抢购优先，再按开场时间升序
 * - 已结束按结束时间降序（最近结束优先）
 * 关键字同时作用于三组，计数也基于过滤后的结果。
 */
export function groupActivities(entries: readonly ActivityEntry[], keyword = ''): ActivityGroups {
  const term = keyword.trim().toLowerCase()
  const filtered = term ? entries.filter((entry) => matchesKeyword(entry, term)) : [...entries]

  const upcoming = filtered.filter((entry) => entry.state === 'NOT_STARTED').sort(byStartAsc)

  const live = filtered
    .filter((entry) => isLiveState(entry.state))
    .sort((a, b) => {
      const weight = Number(a.state !== 'RUNNING') - Number(b.state !== 'RUNNING')
      return weight || byStartAsc(a, b)
    })

  const ended = filtered.filter((entry) => isFinishedState(entry.state)).sort((a, b) => {
    return toTimestamp(b.item.endTime) - toTimestamp(a.item.endTime) || b.item.activityId - a.item.activityId
  })

  return {
    upcoming,
    live,
    ended,
    counts: {
      UPCOMING: upcoming.length,
      LIVE: live.length,
      ENDED: ended.length,
      ALL: upcoming.length + live.length + ended.length,
    },
  }
}
