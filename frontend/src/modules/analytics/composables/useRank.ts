import { ref } from 'vue'
import { ApiError } from '@/shared/types/common'
import { getTopRank } from '@/modules/analytics/api'
import type { RankEntryVO } from '@/modules/analytics/types'

/**
 * 抢购榜数据流：并发请求只保留最后一次结果，失败回退空榜并保留可读错误。
 * 榜单不自动轮询——秒杀后由页面显式调用 load() 刷新。
 */
export function useRank() {
  const entries = ref<RankEntryVO[]>([])
  const loading = ref(false)
  const errorMessage = ref('')
  let seq = 0

  async function load(activityId: number | string): Promise<void> {
    const current = ++seq
    loading.value = true
    errorMessage.value = ''

    try {
      const data = await getTopRank(activityId)
      if (current !== seq) return
      entries.value = data
    } catch (error) {
      if (current !== seq) return
      entries.value = []
      errorMessage.value = error instanceof ApiError ? error.message : '榜单加载失败'
    } finally {
      if (current === seq) loading.value = false
    }
  }

  return { entries, loading, errorMessage, load }
}
