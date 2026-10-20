import { computed, ref } from 'vue'
import { ApiError } from '@/shared/types/common'
import { executeSeckill } from '@/modules/seckill/api'
import type { SeckillResponse, SeckillResult } from '@/modules/seckill/types'

/** idle → submitting → queued | rejected | failed */
export type SeckillPhase = 'idle' | 'submitting' | 'queued' | 'rejected' | 'failed'

/** 后端 result 的五个取值穷举；QUEUED 之外都视为未抢到 */
export const SECKILL_RESULT_TEXT: Record<SeckillResult, string> = {
  QUEUED: '已进入队列',
  SOLD_OUT: '库存已售罄',
  DUPLICATED: '每人限购，你已参与过本场活动',
  RATE_LIMITED: '操作过于频繁，请稍后再试',
  REJECTED: '抢购被拒绝，请刷新后重试',
}

/** 同一活动的两次提交最小间隔（防连点重复下单） */
const SUBMIT_INTERVAL_MS = 1000

export interface UseSeckillOptions {
  /** 进入队列后的回调（用于启动订单轮询） */
  onQueued?: (result: SeckillResponse) => void
}

/**
 * 秒杀提交状态机：负责节流、状态流转与五分支结果文案，
 * 不关心登录态与 UI 提示（由调用方决定是否弹 ElMessage）。
 */
export function useSeckill(options: UseSeckillOptions = {}) {
  const phase = ref<SeckillPhase>('idle')
  const lastResult = ref<SeckillResponse | null>(null)
  const errorMessage = ref('')
  let lastSubmitAt = 0

  const submitting = computed(() => phase.value === 'submitting')

  async function submit(activityId: number): Promise<void> {
    if (phase.value === 'submitting') return
    const now = Date.now()
    if (now - lastSubmitAt < SUBMIT_INTERVAL_MS) return
    lastSubmitAt = now

    phase.value = 'submitting'
    errorMessage.value = ''

    try {
      const result = await executeSeckill({ activityId })
      lastResult.value = result

      if (result.result === 'QUEUED') {
        phase.value = 'queued'
        options.onQueued?.(result)
        return
      }

      phase.value = 'rejected'
      errorMessage.value = SECKILL_RESULT_TEXT[result.result]
    } catch (error) {
      phase.value = 'failed'
      errorMessage.value = error instanceof ApiError ? error.message : '抢购失败，请稍后重试'
    }
  }

  function reset(): void {
    phase.value = 'idle'
    lastResult.value = null
    errorMessage.value = ''
  }

  return { phase, submitting, lastResult, errorMessage, submit, reset }
}
