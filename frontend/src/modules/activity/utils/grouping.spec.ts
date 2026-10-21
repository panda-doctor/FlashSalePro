import { describe, expect, it } from 'vitest'
import type { ActivityItemVO } from '@/modules/activity/types'
import type { ActivityDisplayState } from '@/modules/activity/utils/activityPhase'
import { groupActivities, type ActivityEntry } from '@/modules/activity/utils/grouping'

function entry(
  activityId: number,
  state: ActivityDisplayState,
  options: { name?: string; product?: string; start?: string; end?: string } = {},
): ActivityEntry {
  const item: ActivityItemVO = {
    activityId,
    productId: activityId,
    productName: options.product ?? `商品 ${activityId}`,
    productImage: null,
    activityName: options.name ?? `活动 ${activityId}`,
    startTime: options.start ?? '2026-10-21 10:00:00',
    endTime: options.end ?? '2026-10-21 12:00:00',
    seckillPrice: 19900,
    originalPrice: 29900,
    status: 'RUNNING',
    stock: 10,
    preheated: true,
    totalStock: 20,
    limitPerUser: 1,
  }
  return { item, state }
}

describe('groupActivities', () => {
  it('按展示态拆成即将开场 / 进行中 / 已结束三组', () => {
    const groups = groupActivities([
      entry(1, 'RUNNING'),
      entry(2, 'NOT_STARTED'),
      entry(3, 'ENDED'),
      entry(4, 'NOT_PREHEATED'),
      entry(5, 'SOLD_OUT'),
      entry(6, 'CANCELLED'),
    ])

    expect(groups.live.map((item) => item.item.activityId)).toEqual([1, 4])
    expect(groups.upcoming.map((item) => item.item.activityId)).toEqual([2])
    // 结束时间相同（同一条默认时间）时按 activityId 倒序，保证顺序稳定
    expect(groups.ended.map((item) => item.item.activityId)).toEqual([6, 5, 3])
    expect(groups.counts).toEqual({ UPCOMING: 1, LIVE: 2, ENDED: 3, ALL: 6 })
  })

  it('进行中先排可抢购，再按开场时间升序', () => {
    const groups = groupActivities([
      entry(1, 'NOT_PREHEATED', { start: '2026-10-21 09:00:00' }),
      entry(2, 'RUNNING', { start: '2026-10-21 11:00:00' }),
      entry(3, 'RUNNING', { start: '2026-10-21 08:00:00' }),
    ])

    expect(groups.live.map((item) => item.item.activityId)).toEqual([3, 2, 1])
  })

  it('即将开场按开场时间升序，已结束按结束时间降序', () => {
    const groups = groupActivities([
      entry(1, 'NOT_STARTED', { start: '2026-10-21 20:00:00' }),
      entry(2, 'NOT_STARTED', { start: '2026-10-21 18:00:00' }),
      entry(3, 'ENDED', { end: '2026-10-20 12:00:00' }),
      entry(4, 'ENDED', { end: '2026-10-21 12:00:00' }),
    ])

    expect(groups.upcoming.map((item) => item.item.activityId)).toEqual([2, 1])
    expect(groups.ended.map((item) => item.item.activityId)).toEqual([4, 3])
  })

  it('关键字同时过滤三组并匹配活动名与商品名', () => {
    const entries = [
      entry(1, 'RUNNING', { name: '键盘秒杀', product: '机械键盘' }),
      entry(2, 'NOT_STARTED', { name: '耳机预热', product: '头戴耳机' }),
      entry(3, 'ENDED', { name: '鼠标专场', product: '无线鼠标' }),
      entry(4, 'ENDED', { name: '显示器回看', product: '4K 显示器' }),
    ]

    const keyboard = groupActivities(entries, '键盘')
    expect(keyboard.counts).toEqual({ UPCOMING: 0, LIVE: 1, ENDED: 0, ALL: 1 })

    const display = groupActivities(entries, '显示器')
    expect(display.ended).toHaveLength(1)
    expect(display.ended[0].item.activityId).toBe(4)

    expect(groupActivities(entries, '  ').counts.ALL).toBe(4)
    expect(groupActivities(entries, '不存在').counts.ALL).toBe(0)
  })

  it('空列表返回空分组且计数为零', () => {
    const groups = groupActivities([])
    expect(groups.upcoming).toEqual([])
    expect(groups.live).toEqual([])
    expect(groups.ended).toEqual([])
    expect(groups.counts).toEqual({ UPCOMING: 0, LIVE: 0, ENDED: 0, ALL: 0 })
  })
})
