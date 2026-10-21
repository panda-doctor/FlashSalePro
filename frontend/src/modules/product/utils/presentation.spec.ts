import { describe, expect, it } from 'vitest'
import type { ProductVO } from '@/modules/product/types'
import { pickRelatedProducts, resolveStockState, stockRatio } from '@/modules/product/utils/presentation'

function product(productId: number, name = `商品 ${productId}`): ProductVO {
  return {
    productId,
    name,
    description: null,
    imageUrl: null,
    originalPrice: 9900,
    totalStock: 10,
    availableStock: 10,
    status: 'ON_SHELF',
    cacheHit: false,
  }
}

describe('pickRelatedProducts', () => {
  it('排除当前商品并保持原顺序', () => {
    const result = pickRelatedProducts([product(1), product(2), product(3)], 2)
    expect(result.map((item) => item.productId)).toEqual([1, 3])
  })

  it('按 productId 去重', () => {
    const result = pickRelatedProducts([product(1), product(1), product(2)], 99)
    expect(result.map((item) => item.productId)).toEqual([1, 2])
  })

  it('限制返回数量', () => {
    const result = pickRelatedProducts([product(1), product(2), product(3), product(4)], 99, 2)
    expect(result).toHaveLength(2)
  })

  it('空数组返回空数组', () => {
    expect(pickRelatedProducts([], 1)).toEqual([])
  })
})

describe('resolveStockState', () => {
  it('零库存为售罄', () => {
    expect(resolveStockState(0).tone).toBe('out')
  })

  it('低库存展示真实数量', () => {
    expect(resolveStockState(3).label).toBe('仅剩 3 件')
  })

  it('充足库存为可售', () => {
    expect(resolveStockState(30).tone).toBe('ready')
  })
})

describe('stockRatio', () => {
  it('按真实库存计算比例', () => {
    expect(stockRatio(3, 10)).toBe(30)
  })

  it('总库存为零时返回零', () => {
    expect(stockRatio(3, 0)).toBe(0)
  })

  it('比例被限制在 0 到 100 之间', () => {
    expect(stockRatio(12, 10)).toBe(100)
  })
})
