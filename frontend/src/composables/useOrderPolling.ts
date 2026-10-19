import { onUnmounted, ref } from 'vue'
import { ApiError } from '@/types/common'
import type { OrderDetail } from '@/types/order'

export type PollingSettleReason = 'created' | 'failed' | 'cancelled' | 'timeout'

export interface UseOrderPollingOptions {
  fetcher: (orderNo: string) => Promise<OrderDetail>
  intervalMs?: number
  maxAttempts?: number
  onUpdate?: (detail: OrderDetail, attempt: number) => void
  onSettled?: (detail: OrderDetail | null, reason: PollingSettleReason) => void
}

/**
 * 订单状态轮询：串行自调度（非 setInterval），终态/上限/卸载即停。
 * 注意：后端对不存在的单号也返回 QUEUING，因此必须设置上限并给出兜底文案。
 */
export function useOrderPolling(options: UseOrderPollingOptions) {
  const intervalMs = options.intervalMs ?? 1500
  const maxAttempts = options.maxAttempts ?? 40

  const detail = ref<OrderDetail | null>(null)
  const attempts = ref(0)
  const polling = ref(false)
  const lastError = ref<string | null>(null)

  let timer: number | null = null
  let generation = 0
  let currentOrderNo = ''

  function clearTimer(): void {
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
  }

  function settle(reason: PollingSettleReason): void {
    polling.value = false
    clearTimer()
    options.onSettled?.(detail.value, reason)
  }

  function schedule(myGeneration: number, delay: number): void {
    timer = window.setTimeout(() => tick(myGeneration), delay)
  }

  function tick(myGeneration: number): void {
    if (myGeneration !== generation || !polling.value) return

    // 页面不可见时暂停请求，但保留轮询
    if (typeof document !== 'undefined' && document.hidden) {
      schedule(myGeneration, intervalMs)
      return
    }

    attempts.value += 1

    options
      .fetcher(currentOrderNo)
      .then((data) => {
        if (myGeneration !== generation) return
        detail.value = data
        lastError.value = null
        options.onUpdate?.(data, attempts.value)

        if (data.status === 'CREATED') {
          settle('created')
          return
        }
        if (data.status === 'CREATE_FAILED') {
          settle('failed')
          return
        }
        if (data.status === 'CANCELLED') {
          settle('cancelled')
          return
        }
        if (attempts.value >= maxAttempts) {
          settle('timeout')
          return
        }
        schedule(myGeneration, intervalMs)
      })
      .catch((error: unknown) => {
        if (myGeneration !== generation) return
        lastError.value = error instanceof ApiError ? error.message : '订单状态查询失败'
        if (attempts.value >= maxAttempts) {
          settle('timeout')
          return
        }
        schedule(myGeneration, intervalMs * 2)
      })
  }

  function stop(): void {
    generation += 1
    polling.value = false
    clearTimer()
  }

  function start(orderNo: string): void {
    stop()
    currentOrderNo = orderNo
    detail.value = null
    attempts.value = 0
    lastError.value = null
    polling.value = true
    generation += 1
    tick(generation)
  }

  onUnmounted(() => {
    generation += 1
    clearTimer()
  })

  return { detail, attempts, polling, lastError, start, stop }
}
