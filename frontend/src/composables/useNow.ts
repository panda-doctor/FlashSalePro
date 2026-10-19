import { onMounted, onUnmounted, ref } from 'vue'

/**
 * 共享时钟：整页只跑一个定时器，避免每张活动卡各开一个 interval。
 * 页面卸载时自动清理。
 */
export function useNow(intervalMs = 1000) {
  const now = ref(Date.now())
  let timer: number | null = null

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = Date.now()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer !== null) window.clearInterval(timer)
  })

  return now
}
