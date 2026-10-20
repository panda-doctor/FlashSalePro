import { describe, expect, it } from 'vitest'
import {
  formatDateTime,
  formatCountdown,
  formatShortDateTime,
  formatTimestamp,
  normalizeActivityTime,
  parseActivityTime,
} from '@/shared/utils/time'

// 该文件只测试两种时间格式的解析与展示，避免混用 formatter

describe('活动时间（yyyy-MM-dd HH:mm:ss）', () => {
  it('可解析合法格式', () => {
    const date = parseActivityTime('2026-10-19 20:30:00')
    expect(date).not.toBeNull()
    expect(formatDateTime('2026-10-19 20:30:00')).toBe('2026-10-19 20:30:00')
  })

  it('拒绝 ISO 与非法输入', () => {
    expect(parseActivityTime('2026-10-19T20:30:00')).toBeNull()
    expect(parseActivityTime('not-a-date')).toBeNull()
  })

  it('提交前裁剪到 19 位，保持后端格式', () => {
    expect(normalizeActivityTime(' 2026-10-19 20:30:00.000 ')).toBe('2026-10-19 20:30:00')
  })
})

describe('ISO 时间（用户 / 订单 createdAt）', () => {
  it('解析并格式化', () => {
    expect(formatDateTime('2026-01-01T10:00:00')).toBe('2026-01-01 10:00:00')
    expect(formatShortDateTime('2026-01-01T10:05:00')).toBe('01-01 10:05')
  })

  it('空值统一显示占位符', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
    expect(formatDateTime('bad-value')).toBe('—')
  })
})

describe('倒计时与时间戳', () => {
  it('不足一天显示 HH:mm:ss', () => {
    expect(formatCountdown(3661 * 1000)).toBe('01:01:01')
    expect(formatCountdown(0)).toBe('00:00:00')
  })

  it('超过一天带天数', () => {
    expect(formatCountdown(90061 * 1000)).toBe('1天 01:01:01')
  })

  it('榜单 score 以毫秒时间戳展示', () => {
    const timestamp = Date.parse('2026-10-19T20:30:00')
    expect(formatTimestamp(timestamp)).toBe('2026-10-19 20:30:00')
    expect(formatTimestamp(0)).toBe('—')
  })
})
