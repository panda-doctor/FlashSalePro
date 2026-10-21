import { describe, expect, it } from 'vitest'
import type { ProductVO } from '@/modules/product/types'
import { toFeaturedProducts } from '@/modules/home/utils/featured'

function product(overrides: Partial<ProductVO> = {}): ProductVO {
  return {
    productId: 1,
    name: '手冲咖啡壶',
    description: null,
    imageUrl: null,
    originalPrice: 49900,
    totalStock: 20,
    availableStock: 12,
    status: 'ON_SHELF',
    cacheHit: false,
    ...overrides,
  }
}

describe('首页商品甄选清洗', () => {
  it('保留上架且价格有效的商品，并原样透传价格与库存', () => {
    const [item] = toFeaturedProducts([product()])
    expect(item).toEqual({
      id: 1,
      name: '手冲咖啡壶',
      imageUrl: null,
      price: 49900,
      stockLabel: '现货 12 件',
      kind: 'real',
    })
  })

  it('过滤无名称、非正价格与已下架数据', () => {
    const items = toFeaturedProducts([
      product({ productId: 1, name: '  ' }),
      product({ productId: 2, originalPrice: 0 }),
      product({ productId: 3, originalPrice: -1 }),
      product({ productId: 4, status: 'OFF_SHELF' }),
      product({ productId: 5, name: '黄铜台灯' }),
    ])
    expect(items.map((item) => item.id)).toEqual([5])
  })

  it('限制返回数量，并避免负 limit', () => {
    const items = [1, 2, 3, 4, 5].map((id) => product({ productId: id, name: `商品 ${id}` }))
    expect(toFeaturedProducts(items)).toHaveLength(4)
    expect(toFeaturedProducts(items, 2).map((item) => item.id)).toEqual([1, 2])
    expect(toFeaturedProducts(items, -1)).toHaveLength(0)
  })

  it('无库存时只给出缺货文案，不虚构数量', () => {
    const [item] = toFeaturedProducts([product({ availableStock: 0 })])
    expect(item.stockLabel).toBe('暂时缺货')
    expect(item.stockLabel).not.toMatch(/\d/)
  })
})
