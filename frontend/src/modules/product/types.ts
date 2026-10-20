/**
 * 契约来源：flash-sale-product-core/.../product/{vo/ProductVO,dto/request/ProductRequest}.java
 * 枚举无 @JsonValue，序列化为枚举名。
 */
export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF'

export interface ProductVO {
  productId: number
  name: string
  description: string | null
  imageUrl: string | null
  /** 单位：分 */
  originalPrice: number
  totalStock: number
  /** 普通可用库存，秒杀链路不扣减此字段 */
  availableStock: number
  status: ProductStatus
  /** 是否命中缓存，仅诊断用途 */
  cacheHit: boolean
}

export interface ProductRequest {
  /** 有值=更新，无值=创建 */
  productId?: number
  name: string
  description?: string
  imageUrl?: string
  /** 单位：分，@Min(0) */
  originalPrice: number
  /** @Min(1) */
  totalStock: number
  status: ProductStatus
}

export interface ProductQuery {
  keyword?: string
}

/** POST /api/admin/products 的返回：productId 被后端显式转成字符串 */
export interface ProductCreatedResult {
  productId: string
}
