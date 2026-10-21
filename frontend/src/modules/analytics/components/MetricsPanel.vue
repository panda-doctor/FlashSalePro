<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { getActivityMetrics } from '@/modules/analytics/api'
import { ApiError } from '@/shared/types/common'
import type { ActivityMetricsVO } from '@/modules/analytics/types'
import { formatTimestamp } from '@/shared/utils/time'

const props = defineProps<{ activityId: number | null }>()

const INTERVAL = 5000

const metrics = ref<ActivityMetricsVO | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const updatedAt = ref<number | null>(null)

let timer: number | null = null

function clearTimer(): void {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}

function schedule(): void {
  clearTimer()
  if (!props.activityId) return
  timer = window.setTimeout(() => {
    if (typeof document === 'undefined' || !document.hidden) refresh(true)
    schedule()
  }, INTERVAL)
}

function refresh(auto = false): void {
  if (!props.activityId) return
  if (!auto) loading.value = true
  errorMessage.value = ''

  getActivityMetrics(props.activityId)
    .then((data) => {
      metrics.value = data
      updatedAt.value = Date.now()
    })
    .catch((error: unknown) => {
      errorMessage.value = error instanceof ApiError ? error.message : '指标加载失败'
    })
    .finally(() => {
      loading.value = false
    })
}

watch(
  () => props.activityId,
  (id) => {
    clearTimer()
    metrics.value = null
    updatedAt.value = null
    if (id) {
      refresh()
      schedule()
    }
  },
  { immediate: true },
)

onUnmounted(clearTimer)

const cards = computed(() => [
  {
    label: 'Redis 剩余库存',
    value: metrics.value?.redisStock ?? '—',
    hint: metrics.value?.redisStock === null ? '活动未预热' : '库存唯一事实源',
  },
  { label: '有效订单', value: metrics.value?.orderCount ?? 0, hint: '已落库订单数' },
  { label: '成功计数', value: metrics.value?.successCount ?? 0, hint: '消费成功次数' },
  { label: '队列消息', value: metrics.value?.queuedMessageCount ?? 0, hint: 'XLEN 近似值' },
  { label: '重复拒绝', value: metrics.value?.duplicateRejectCount ?? 0, hint: '一人一单拦截' },
  { label: '限流拒绝', value: metrics.value?.rateLimitRejectCount ?? 0, hint: '滑动窗口超限' },
  { label: '售罄拒绝', value: metrics.value?.soldOutRejectCount ?? 0, hint: '库存不足' },
  { label: '活动 ID', value: props.activityId ?? '—', hint: '当前监控对象' },
])
</script>

<template>
  <section class="surface-card p-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-[15px] font-semibold">实时指标</h2>
        <p class="mt-1 text-xs text-ink-500">
          每 5 秒自动刷新（页面不可见时暂停）
          <span v-if="updatedAt" class="ml-2">最近更新 {{ formatTimestamp(updatedAt) }}</span>
        </p>
      </div>
      <el-button size="small" plain :loading="loading" @click="refresh()">
        <RefreshCw :size="13" class="mr-1" aria-hidden="true" />
        立即刷新
      </el-button>
    </header>

    <p v-if="errorMessage" class="mt-3 rounded-lg bg-danger/5 px-3 py-2 text-xs text-danger" role="alert">
      {{ errorMessage }}
    </p>

    <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div v-for="card in cards" :key="card.label" class="rounded-lg border border-line/70 bg-muted/60 p-3">
        <p class="text-xs text-ink-500">{{ card.label }}</p>
        <p class="num mt-1 text-xl font-semibold leading-tight text-ink-900">{{ card.value }}</p>
        <p class="mt-0.5 text-[11px] text-ink-500">{{ card.hint }}</p>
      </div>
    </div>

    <p class="mt-3 text-xs leading-5 text-ink-500">
      指标存放在 Redis Hash；queuedMessageCount 由全局 Stream 长度近似，多活动并行时会偏高。
    </p>
  </section>
</template>
