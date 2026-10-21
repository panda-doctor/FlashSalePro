import { describe, expect, it } from 'vitest'
import type { ActivityItemVO } from '@/modules/activity/types'
import { buildPreviewReply } from '@/modules/ai/utils/previewReply'

const NOW = new Date('2026-10-21 20:00:00').getTime()

function activity(overrides: Partial<ActivityItemVO> = {}): ActivityItemVO {
  return {
    activityId: 1,
    productId: 1,
    productName: '机械键盘',
    productImage: null,
    activityName: '夜间键盘闪购',
    startTime: '2026-10-21 19:30:00',
    endTime: '2026-10-21 21:00:00',
    seckillPrice: 19900,
    originalPrice: 29900,
    status: 'RUNNING',
    stock: 12,
    preheated: true,
    totalStock: 20,
    limitPerUser: 1,
    ...overrides,
  }
}

describe('buildPreviewReply', () => {
  it('进行中且有库存时引用真实活动字段', () => {
    const reply = buildPreviewReply(activity(), NOW)
    expect(reply.live).toBe(true)
    expect(reply.text).toContain('夜间键盘闪购')
    expect(reply.text).toContain('¥199.00')
    expect(reply.text).toContain('还剩 12 件')
    expect(reply.text).toContain('10-21 21:00 结束')
  })

  it('未预热但仍在时间窗内同样视为可抢购', () => {
    const reply = buildPreviewReply(activity({ preheated: false }), NOW)
    expect(reply.live).toBe(true)
  })

  it('已结束、未开始、售罄都退回通用说明', () => {
    const ended = buildPreviewReply(activity({ endTime: '2026-10-21 19:59:00' }), NOW)
    const upcoming = buildPreviewReply(activity({ startTime: '2026-10-21 21:00:00' }), NOW)
    const soldOut = buildPreviewReply(activity({ stock: 0 }), NOW)

    for (const reply of [ended, upcoming, soldOut]) {
      expect(reply.live).toBe(false)
      expect(reply.text).toContain('商品与活动目录')
      expect(reply.text).not.toContain('夜间键盘闪购')
    }
  })

  it('没有活动时返回通用能力说明', () => {
    const reply = buildPreviewReply(null, NOW)
    expect(reply.live).toBe(false)
    expect(reply.text).toContain('一人一单')
    expect(reply.text).not.toContain('¥')
  })
})
