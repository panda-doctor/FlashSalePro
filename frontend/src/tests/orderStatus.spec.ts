import { describe, expect, it } from 'vitest'
import {
  isTerminalStatus,
  normalizeOrderStatus,
  orderStatusLabel,
  orderStatusTagType,
} from '@/utils/orderStatus'

describe('订单状态归一化', () => {
  it('识别后端四个真实枚举值', () => {
    expect(normalizeOrderStatus('QUEUING')).toBe('QUEUING')
    expect(normalizeOrderStatus('CREATED')).toBe('CREATED')
    expect(normalizeOrderStatus('CREATE_FAILED')).toBe('CREATE_FAILED')
    expect(normalizeOrderStatus('CANCELLED')).toBe('CANCELLED')
  })

  it('未知码值按排队中兜底（与后端 VO 口径一致）', () => {
    expect(normalizeOrderStatus('SUCCESS')).toBe('QUEUING')
    expect(normalizeOrderStatus(null)).toBe('QUEUING')
    expect(normalizeOrderStatus('')).toBe('QUEUING')
  })
})

describe('终态判定', () => {
  it('只有排队中不是终态', () => {
    expect(isTerminalStatus('QUEUING')).toBe(false)
    expect(isTerminalStatus('CREATED')).toBe(true)
    expect(isTerminalStatus('CREATE_FAILED')).toBe(true)
    expect(isTerminalStatus('CANCELLED')).toBe(true)
  })
})

describe('状态展示', () => {
  it('详情自带 statusDesc 时优先使用后端文案', () => {
    expect(orderStatusLabel('CREATED', '已创建（库存已确认）')).toBe('已创建（库存已确认）')
    expect(orderStatusLabel('CREATED')).toBe('已创建')
  })

  it('状态标签语义色与业务含义一致', () => {
    expect(orderStatusTagType('CREATED')).toBe('success')
    expect(orderStatusTagType('CREATE_FAILED')).toBe('danger')
    expect(orderStatusTagType('QUEUING')).toBe('warning')
    expect(orderStatusTagType('CANCELLED')).toBe('info')
  })
})
