import { describe, expect, it } from 'vitest'
import { clampPage, pageCount, pageRange, pageSlice } from '@/shared/utils/pagination'

describe('pagination', () => {
  it('空列表也保留 1 页，区间为 0–0', () => {
    expect(pageCount(0, 4)).toBe(1)
    expect(clampPage(3, 0, 4)).toBe(1)
    expect(pageSlice([], 1, 4)).toEqual([])
    expect(pageRange(1, 4, 0)).toEqual({ start: 0, end: 0 })
  })

  it('整除时页数精确，区间覆盖整页', () => {
    expect(pageCount(8, 4)).toBe(2)
    expect(pageRange(2, 4, 8)).toEqual({ start: 5, end: 8 })
  })

  it('非整除时最后一页只到总数', () => {
    expect(pageCount(10, 4)).toBe(3)
    expect(pageRange(3, 4, 10)).toEqual({ start: 9, end: 10 })
    expect(pageRange(1, 4, 10)).toEqual({ start: 1, end: 4 })
  })

  it('页码越界被夹取到有效范围', () => {
    expect(clampPage(0, 10, 4)).toBe(1)
    expect(clampPage(9, 10, 4)).toBe(3)
    expect(clampPage(Number.NaN, 10, 4)).toBe(1)
    expect(pageSlice([1, 2, 3, 4, 5], 9, 4)).toEqual([5])
  })

  it('非法 pageSize 不会产生 NaN 区间', () => {
    expect(pageCount(10, 0)).toBe(1)
    expect(pageSlice([1, 2, 3], 1, 0)).toEqual([])
    expect(pageRange(1, 0, 10)).toEqual({ start: 0, end: 0 })
  })
})
