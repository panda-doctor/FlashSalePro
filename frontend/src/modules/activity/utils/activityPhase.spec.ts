import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_STATE_META,
  activitySortWeight,
  isFinishedState,
  resolveActivityState,
} from '@/modules/activity/utils/activityPhase'
import { parseActivityTime } from '@/shared/utils/time'

const NOW = parseActivityTime('2026-10-19 12:00:00')?.getTime() ?? 0

function input(overrides: Partial<Parameters<typeof resolveActivityState>[0]> = {}) {
  return {
    startTime: '2026-10-19 10:00:00',
    endTime: '2026-10-19 14:00:00',
    status: 'RUNNING' as const,
    stock: 10,
    preheated: true,
    now: NOW,
    ...overrides,
  }
}

describe('活动阶段判定（时间窗优先）', () => {
  it('未到开始时间：即使 status=RUNNING 也显示未开始', () => {
    expect(resolveActivityState(input({ startTime: '2026-10-19 13:00:00' }))).toBe('NOT_STARTED')
  })

  it('时间窗内：即使 status=NOT_STARTED 也显示进行中', () => {
    expect(resolveActivityState(input({ status: 'NOT_STARTED' }))).toBe('RUNNING')
  })

  it('时间窗内库存为 0：已售罄', () => {
    expect(resolveActivityState(input({ stock: 0 }))).toBe('SOLD_OUT')
  })

  it('时间窗内库存为 null：视为未预热', () => {
    expect(resolveActivityState(input({ stock: null }))).toBe('NOT_PREHEATED')
  })

  it('preheated=false 优先于库存值', () => {
    expect(resolveActivityState(input({ stock: 5, preheated: false }))).toBe('NOT_PREHEATED')
  })

  it('已过结束时间：即使还有库存也显示已结束', () => {
    expect(resolveActivityState(input({ endTime: '2026-10-19 11:00:00' }))).toBe('ENDED')
  })

  it('已取消优先级最高', () => {
    expect(resolveActivityState(input({ status: 'CANCELLED' }))).toBe('CANCELLED')
  })

  it('时间不可解析时退回后端快照状态', () => {
    expect(resolveActivityState(input({ startTime: 'bad', endTime: 'bad' }))).toBe('RUNNING')
    expect(resolveActivityState(input({ startTime: 'bad', endTime: 'bad', stock: 0 }))).toBe('SOLD_OUT')
    expect(
      resolveActivityState(input({ startTime: 'bad', endTime: 'bad', status: 'NOT_STARTED' })),
    ).toBe('NOT_STARTED')
  })
})

describe('展示元数据', () => {
  it('只有进行中可抢购', () => {
    const purchasable = Object.entries(ACTIVITY_STATE_META)
      .filter(([, meta]) => meta.purchasable)
      .map(([state]) => state)
    expect(purchasable).toEqual(['RUNNING'])
  })

  it('排序权重：进行中 < 未开始 < 其余', () => {
    expect(activitySortWeight('RUNNING')).toBeLessThan(activitySortWeight('NOT_STARTED'))
    expect(activitySortWeight('NOT_STARTED')).toBeLessThan(activitySortWeight('ENDED'))
  })

  it('终态集合包含结束/取消/售罄', () => {
    expect(isFinishedState('ENDED')).toBe(true)
    expect(isFinishedState('SOLD_OUT')).toBe(true)
    expect(isFinishedState('CANCELLED')).toBe(true)
    expect(isFinishedState('RUNNING')).toBe(false)
  })
})
