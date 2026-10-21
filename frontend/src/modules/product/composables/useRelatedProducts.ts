import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { listProducts } from '@/modules/product/api'
import type { ProductVO } from '@/modules/product/types'
import { pickRelatedProducts } from '@/modules/product/utils/presentation'

function isCanceled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as { code?: string }).code === 'ERR_CANCELED' ||
      (error as { name?: string }).name === 'CanceledError' ||
      (error as { name?: string }).name === 'AbortError')
  )
}

/** 只取真实目录中的其他商品，失败时静默隐藏推荐区，不影响主商品 */
export function useRelatedProducts(productId: Ref<number | null>, limit = 4) {
  const items = ref<ProductVO[]>([])
  const loading = ref(false)
  const failed = ref(false)

  let controller: AbortController | null = null
  let requestSeq = 0

  watch(
    productId,
    (id) => {
      controller?.abort()
      if (id === null) {
        items.value = []
        loading.value = false
        failed.value = false
        return
      }

      controller = new AbortController()
      const signal = controller.signal
      const seq = ++requestSeq

      loading.value = true
      failed.value = false

      listProducts({ page: 1, pageSize: limit + 1 }, signal)
        .then((response) => {
          if (seq !== requestSeq) return
          items.value = pickRelatedProducts(response.records ?? [], id, limit)
        })
        .catch((error: unknown) => {
          if (seq !== requestSeq || isCanceled(error)) return
          failed.value = true
          items.value = []
          console.error('更多精选加载失败', error)
        })
        .finally(() => {
          if (seq === requestSeq) loading.value = false
        })
    },
    { immediate: true },
  )

  onBeforeUnmount(() => controller?.abort())

  return { items, loading, failed }
}
