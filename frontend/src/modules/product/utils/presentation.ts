import type { ProductVO } from '@/modules/product/types'

export type StockTone = 'ready' | 'low' | 'out'

export interface ProductStockState {
  tone: StockTone
  label: string
  description: string
}

/** 将真实普通库存映射为可读状态，不推断秒杀库存 */
export function resolveStockState(availableStock: number): ProductStockState {
  if (availableStock <= 0) {
    return {
      tone: 'out',
      label: '暂时售罄',
      description: '普通库存已用尽，可关注后续补货或秒杀活动。',
    }
  }
  if (availableStock <= 10) {
    return {
      tone: 'low',
      label: `仅剩 ${availableStock} 件`,
      description: '普通库存偏低，实际可售数量以接口实时返回为准。',
    }
  }
  return {
    tone: 'ready',
    label: '现货充足',
    description: '普通库存可售，价格与库存均来自商品接口。',
  }
}

/** 普通库存占比，仅用于可视化；秒杀库存不能与该值互相换算 */
export function stockRatio(availableStock: number, totalStock: number): number {
  if (!Number.isFinite(totalStock) || totalStock <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((availableStock / totalStock) * 100)))
}

/** 推荐商品只取真实目录数据，排除当前商品并去重 */
export function pickRelatedProducts(
  products: ProductVO[],
  currentId: number,
  limit = 4,
): ProductVO[] {
  const seen = new Set<number>()
  const result: ProductVO[] = []

  for (const product of products) {
    if (product.productId === currentId || seen.has(product.productId)) continue
    seen.add(product.productId)
    result.push(product)
    if (result.length >= limit) break
  }

  return result
}
