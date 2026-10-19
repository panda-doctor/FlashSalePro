import { http } from '@/http/client'
import type { PageResponse } from '@/types/common'
import type { ProductCreatedResult, ProductRequest, ProductVO } from '@/types/product'

export interface ProductListParams {
  page: number
  pageSize: number
  keyword?: string
}

/** 公开商品：flash-sale-product ProductController */
export function listProducts(params: ProductListParams): Promise<PageResponse<ProductVO>> {
  return http.get<PageResponse<ProductVO>>('/api/products', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      keyword: params.keyword || undefined,
    },
  })
}

export function getProduct(productId: number | string): Promise<ProductVO> {
  return http.get<ProductVO>(`/api/products/${productId}`)
}

/** 管理端商品：需 X-Admin-Token（M5 使用） */
export function getAdminProduct(productId: number | string): Promise<ProductVO> {
  return http.get<ProductVO>(`/api/admin/products/${productId}`, { admin: true })
}

export function saveAdminProduct(payload: ProductRequest): Promise<ProductCreatedResult> {
  return http.post<ProductCreatedResult>('/api/admin/products', payload, { admin: true })
}

export interface UploadImageResult {
  url: string
  storageType: 'local' | 'oss'
}

/** multipart 字段名必须是 file */
export function uploadProductImage(file: File): Promise<UploadImageResult> {
  const body = new FormData()
  body.append('file', file)
  return http.post<UploadImageResult>('/api/admin/files/image', body, {
    admin: true,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
}
