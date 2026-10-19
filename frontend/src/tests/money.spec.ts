import { describe, expect, it } from 'vitest'
import { discountRate, fenToYuan, formatPrice, saveAmount, yuanToFen } from '@/utils/money'

describe('分转元', () => {
  it('保留两位小数并补零', () => {
    expect(fenToYuan(1990)).toBe('19.90')
    expect(fenToYuan(5)).toBe('0.05')
    expect(fenToYuan(0)).toBe('0.00')
    expect(fenToYuan(100000)).toBe('1000.00')
  })

  it('空值与负值安全处理', () => {
    expect(fenToYuan(null)).toBe('0.00')
    expect(fenToYuan(undefined)).toBe('0.00')
    expect(fenToYuan(-1990)).toBe('-19.90')
  })

  it('展示统一带货币符号', () => {
    expect(formatPrice(888)).toBe('¥8.88')
  })
})

describe('元转分（表单输入）', () => {
  it('四舍五入到分', () => {
    expect(yuanToFen('19.99')).toBe(1999)
    expect(yuanToFen(0.1 + 0.2)).toBe(30)
    expect(yuanToFen('abc')).toBe(0)
    expect(yuanToFen(null)).toBe(0)
  })
})

describe('折扣计算', () => {
  it('仅在秒杀价低于原价时返回折扣率', () => {
    expect(discountRate(10000, 7900)).toBe(79)
    expect(discountRate(1990, 990)).toBe(49)
    expect(discountRate(1000, 1000)).toBeNull()
    expect(discountRate(1000, 1200)).toBeNull()
    expect(discountRate(0, 100)).toBeNull()
  })

  it('节省金额不为负', () => {
    expect(saveAmount(1990, 990)).toBe(1000)
    expect(saveAmount(100, 200)).toBe(0)
  })
})
