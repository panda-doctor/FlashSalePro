import { getCurrentInstance, onBeforeUnmount, reactive, ref, type Ref } from 'vue'
import { ApiError, type PageQuery, type PageResponse } from '@/shared/types/common'

/** 第二个参数是可选的中止信号，未实现取消的接口可以忽略 */
export type PagedFetcher<T, Q> = (params: Q & PageQuery, signal?: AbortSignal) => Promise<PageResponse<T>>

export interface UsePagedQueryOptions<T, Q extends object> {
  fetcher: PagedFetcher<T, Q>
  initialQuery: Q
  pageSize?: number
  /** 默认立即加载；置 false 时由调用方决定时机 */
  immediate?: boolean
}

function isCanceled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as { code?: string }).code === 'ERR_CANCELED' ||
      (error as { name?: string }).name === 'CanceledError' ||
      (error as { name?: string }).name === 'AbortError')
  )
}

/**
 * 列表页通用编排：查询条件 + 分页 + loading/error/空态。
 * 只负责数据流，不关心具体字段，也不进入 Pinia（页面局部状态）。
 *
 * 并发保护：
 * - 每次请求前 abort 上一个在途请求；
 * - 同时用自增序号丢弃迟到的响应，避免「翻页后旧数据覆盖新数据」。
 */
export function usePagedQuery<T, Q extends object>(options: UsePagedQueryOptions<T, Q>) {
  const { fetcher, initialQuery } = options

  const items = ref([]) as Ref<T[]>
  const total = ref(0)
  const pages = ref(0)
  const page = ref(1)
  const pageSize = ref(options.pageSize ?? 12)
  const query = reactive({ ...initialQuery }) as Q
  const loading = ref(false)
  const error = ref<string | null>(null)

  let controller: AbortController | null = null
  let requestSeq = 0

  function fetchPage(): Promise<void> {
    controller?.abort()
    controller = new AbortController()
    const seq = ++requestSeq

    loading.value = true
    error.value = null

    const params = {
      ...(query as object),
      page: page.value,
      pageSize: pageSize.value,
    } as Q & PageQuery

    return fetcher(params, controller.signal)
      .then((response) => {
        if (seq !== requestSeq) return
        items.value = response.records ?? []
        total.value = response.total ?? 0
        pages.value = response.pages ?? 0
      })
      .catch((err: unknown) => {
        if (seq !== requestSeq || isCanceled(err)) return
        error.value = err instanceof ApiError ? err.message : '加载失败，请稍后重试'
        items.value = []
        total.value = 0
        pages.value = 0
      })
      .finally(() => {
        if (seq === requestSeq) loading.value = false
      })
  }

  function search(): Promise<void> {
    page.value = 1
    return fetchPage()
  }

  function reset(): Promise<void> {
    Object.assign(query, initialQuery)
    page.value = 1
    return fetchPage()
  }

  function setPage(next: number): Promise<void> {
    page.value = next
    return fetchPage()
  }

  function setPageSize(size: number): Promise<void> {
    pageSize.value = size
    page.value = 1
    return fetchPage()
  }

  if (options.immediate !== false) void fetchPage()

  if (getCurrentInstance()) {
    onBeforeUnmount(() => controller?.abort())
  }

  return {
    items,
    total,
    pages,
    page,
    pageSize,
    query,
    loading,
    error,
    fetchPage,
    search,
    reset,
    setPage,
    setPageSize,
    refresh: fetchPage,
  }
}
