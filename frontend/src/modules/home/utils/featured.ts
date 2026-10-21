import type { ProductVO } from '@/modules/product/types'

/** 首页甄选卡：只承载真实商品字段，不生成价格或库存 */
export interface FeaturedProduct {
  id: number
  name: string
  imageUrl: string | null
  price: number
  stockLabel: string
  kind: 'real'
}

export const FEATURED_LIMIT = 4

function stockLabel(availableStock: number): string {
  if (availableStock <= 0) return '暂时缺货'
  return `现货 ${availableStock} 件`
}

/**
 * 过滤后端可能存在的脏数据：无名称、无有效价格、非上架状态。
 * 首页不做二次定价，价格与库存均原样透传。
 */
export function toFeaturedProducts(products: ProductVO[], limit = FEATURED_LIMIT): FeaturedProduct[] {
  return products
    .filter(
      (product) =>
        Boolean(product.name?.trim()) &&
        Number.isFinite(product.originalPrice) &&
        product.originalPrice > 0 &&
        product.status === 'ON_SHELF',
    )
    .slice(0, Math.max(0, limit))
    .map((product) => ({
      id: product.productId,
      name: product.name.trim(),
      imageUrl: product.imageUrl,
      price: product.originalPrice,
      stockLabel: stockLabel(product.availableStock),
      kind: 'real' as const,
    }))
}
