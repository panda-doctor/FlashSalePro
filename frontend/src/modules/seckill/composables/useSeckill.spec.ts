import { describe, expect, it } from 'vitest'
import { SECKILL_RESULT_TEXT } from './useSeckill'

describe('SECKILL_RESULT_TEXT', () => {
  it('穷举后端 result 的五个取值', () => {
    expect(Object.keys(SECKILL_RESULT_TEXT).sort()).toEqual([
      'DUPLICATED',
      'QUEUED',
      'RATE_LIMITED',
      'REJECTED',
      'SOLD_OUT',
    ])
  })

  it('每个取值都有非空可读文案', () => {
    for (const text of Object.values(SECKILL_RESULT_TEXT)) {
      expect(text.trim().length).toBeGreaterThan(0)
    }
  })
})
