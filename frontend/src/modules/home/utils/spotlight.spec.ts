import { describe, expect, it } from 'vitest'
import type { ActivityItemVO } from '@/modules/activity/types'
import { selectSpotlightActivities } from '@/modules/home/utils/spotlight'
import { parseActivityTime } from '@/shared/utils/time'

const NOW = parseActivityTime('2026-10-20 12:00:00')?.getTime() ?? 0

function activity(overrides: Partial<ActivityItemVO> = {}): ActivityItemVO {
  return {
    activityId: 1,
    productId: 10,
    productName: '手冲咖啡壶',
    productImage: null,
    activityName: '正午场',
    startTime: '2026-10-20 11:00:00',
    endTime: '2026-10-20 13:00:00',
    seckillPrice: 29900,
    originalPrice: 49900,
    status: 'RUNNING',
    stock: 5,
    preheated: true,
    totalStock: 20,
    limitPerUser: 1,
    ...overrides,
  }
}

describe('首页活动场次筛选', () => {
  it('进行中优先，未开始按开始时间升序', () => {
    const items = [
      activity({ activityId: 1, startTime: '2026-10-20 14:00:00', endTime: '2026-10-20 16:00:00' }),
      activity({ activityId: 2 }),
      activity({ activityId: 3, startTime: '2026-10-20 13:00:00', endTime: '2026-10-20 15:00:00' }),
    ]
    const picked = selectSpotlightActivities(items, NOW)
    expect(picked.map((item) => item.activity.activityId)).toEqual([2, 3, 1])
    expect(picked[0].state).toBe('RUNNING')
  })

  it('过滤已结束、已取消与已售罄场次', () => {
    const items = [
      activity({ activityId: 1, endTime: '2026-10-20 11:30:00' }),
      activity({ activityId: 2, status: 'CANCELLED' }),
      activity({ activityId: 3, stock: 0 }),
      activity({ activityId: 4 }),
    ]
    expect(selectSpotlightActivities(items, NOW).map((item) => item.activity.activityId)).toEqual([4])
  })

  it('未预热活动仍进入列表，并保留对应展示态', () => {
    const picked = selectSpotlightActivities([activity({ stock: null })], NOW)
    expect(picked).toHaveLength(1)
    expect(picked[0].state).toBe('NOT_PREHEATED')
  })

  it('最多返回 limit 场', () => {
    const items = [1, 2, 3, 4].map((id) => activity({ activityId: id }))
    expect(selectSpotlightActivities(items, NOW)).toHaveLength(3)
    expect(selectSpotlightActivities(items, NOW, 2)).toHaveLength(2)
    expect(selectSpotlightActivities(items, NOW, 0)).toHaveLength(0)
  })
})
