import { onBeforeUnmount, ref, type Ref } from 'vue'
import { listProducts } from '@/modules/product/api'
import { FEATURED_LIMIT, toFeaturedProducts, type FeaturedProduct } from '@/modules/home/utils/featured'

export interface CuratedProductsState {
  products: Ref<FeaturedProduct[]>
  loading: Ref<boolean>
  failed: Ref<boolean>
}

/**
 * 首屏只取 4 件商品。失败或为空都不阻塞页面：
 * 由 CuratedCollection 展示不含价格与库存的策展卡。
 */
export function useCuratedProducts(limit = FEATURED_LIMIT): CuratedProductsState {
  const products = ref<FeaturedProduct[]>([])
  const loading = ref(true)
  const failed = ref(false)
  const controller = new AbortController()

  listProducts({ page: 1, pageSize: limit }, controller.signal)
    .then((page) => {
      products.value = toFeaturedProducts(page.records ?? [], limit)
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted) return
      failed.value = true
      products.value = []
      console.error('首页甄选商品加载失败', error)
    })
    .finally(() => {
      if (!controller.signal.aborted) loading.value = false
    })

  onBeforeUnmount(() => controller.abort())

  return { products, loading, failed }
}
