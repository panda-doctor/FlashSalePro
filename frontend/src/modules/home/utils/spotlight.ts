import type { ActivityItemVO } from '@/modules/activity/types'
import {
  activitySortWeight,
  isFinishedState,
  resolveActivityState,
  type ActivityDisplayState,
} from '@/modules/activity/utils/activityPhase'
import { toTimestamp } from '@/shared/utils/time'

export const SPOTLIGHT_LIMIT = 3

export interface SpotlightActivity {
  activity: ActivityItemVO
  state: ActivityDisplayState
}

/**
 * 首页只展示仍在进行或即将开始的活动：
 * 已完成（结束 / 取消 / 售罄）的场次不占用首屏位置。
 * 进行中优先，其次按开始时间升序，保证“最近一场”先出现。
 */
export function selectSpotlightActivities(
  activities: ActivityItemVO[],
  now: number,
  limit = SPOTLIGHT_LIMIT,
): SpotlightActivity[] {
  return activities
    .map((activity) => ({
      activity,
      state: resolveActivityState({
        startTime: activity.startTime,
        endTime: activity.endTime,
        status: activity.status,
        stock: activity.stock,
        preheated: activity.preheated,
        now,
      }),
    }))
    .filter((item) => !isFinishedState(item.state))
    .sort(
      (left, right) =>
        activitySortWeight(left.state) - activitySortWeight(right.state) ||
        toTimestamp(left.activity.startTime) - toTimestamp(right.activity.startTime),
    )
    .slice(0, Math.max(0, limit))
}
