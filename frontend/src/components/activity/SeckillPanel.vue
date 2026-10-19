<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Loader2 } from 'lucide-vue-next'
import { executeSeckill } from '@/api/seckill'
import { getOrderDetail } from '@/api/order'
import { useAuthStore } from '@/stores/auth'
import { useOrderPolling } from '@/composables/useOrderPolling'
import { ApiError } from '@/types/common'
import type { SeckillResponse } from '@/types/activity'
import { ACTIVITY_STATE_META, type ActivityDisplayState } from '@/utils/activityPhase'
import OrderStatusTag from '@/components/order/OrderStatusTag.vue'

const props = defineProps<{
  activityId: number
  state: ActivityDisplayState
  stock: number | null
  limitPerUser: number
}>()

const emit = defineEmits<{ ordered: [SeckillResponse]; refresh: [] }>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const submitting = ref(false)
const lastResult = ref<SeckillResponse | null>(null)

const {
  detail: pollingDetail,
  attempts: pollingAttempts,
  polling: isPolling,
  start: startPolling,
} = useOrderPolling({
  fetcher: getOrderDetail,
  intervalMs: 1500,
  maxAttempts: 40,
  onSettled: (data, reason) => {
    if (reason === 'created') {
      ElMessage.success('订单已创建')
      emit('refresh')
      return
    }
    if (reason === 'failed') {
      ElMessage.error(data?.statusDesc || '订单创建失败')
      emit('refresh')
      return
    }
    if (reason === 'timeout') {
      ElMessage.warning('排队时间较长，请稍后在“我的订单”查看')
    }
  },
})

const meta = computed(() => ACTIVITY_STATE_META[props.state])
const canBuy = computed(() => meta.value.purchasable)
const hasOrdersRoute = computed(() => router.hasRoute('orders'))

const buttonLabel = computed(() => {
  if (submitting.value) return '提交中…'
  if (!canBuy.value) return meta.value.label
  return auth.isLoggedIn ? '立即抢购' : '登录后抢购'
})

const hint = computed(() => {
  if (props.state === 'NOT_PREHEATED') return '活动尚未预热，库存未写入 Redis，此时抢购会被拒绝。'
  if (props.state === 'NOT_STARTED') return '活动未到开始时间，进入时间窗后按钮自动可用。'
  if (props.state === 'ENDED') return '活动已结束，无法继续抢购。'
  if (props.state === 'SOLD_OUT') return '库存已耗尽，可关注下一场活动。'
  if (props.state === 'CANCELLED') return '活动已取消。'
  return '提交成功仅代表进入队列，页面会自动确认订单是否落库。'
})

function onSeckill(): void {
  if (!canBuy.value || submitting.value) return

  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  submitting.value = true
  executeSeckill({ activityId: props.activityId })
    .then((result) => {
      lastResult.value = result
      ElMessage.success(`已进入队列，订单号 ${result.orderNo ?? '生成中'}`)
      emit('ordered', result)
      if (result.orderNo) startPolling(result.orderNo)
    })
    .catch((error: unknown) => {
      const message = error instanceof ApiError ? error.message : '抢购失败，请稍后重试'
      ElMessage.error(message)
    })
    .finally(() => {
      submitting.value = false
      emit('refresh')
    })
}
</script>

<template>
  <div class="rounded-xl border border-line/70 bg-muted/60 p-4">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <p class="text-xs text-ink-500">限购</p>
        <p class="mt-0.5 text-sm font-medium">每人 {{ limitPerUser }} 件</p>
      </div>
      <div>
        <p class="text-xs text-ink-500">剩余库存</p>
        <p class="num mt-0.5 text-lg font-semibold leading-tight text-ink-900">{{ stock ?? '—' }}</p>
      </div>
    </div>

    <el-button
      type="primary"
      size="large"
      class="mt-3 w-full"
      :disabled="!canBuy"
      :loading="submitting"
      @click="onSeckill"
    >
      {{ buttonLabel }}
    </el-button>

    <p class="mt-2 text-xs leading-5 text-ink-500">{{ hint }}</p>

    <div v-if="lastResult?.orderNo" class="mt-3 rounded-lg bg-surface p-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs text-ink-500">订单号</p>
          <p class="num truncate text-sm font-medium text-ink-900">{{ lastResult.orderNo }}</p>
        </div>
        <OrderStatusTag :status="pollingDetail?.status ?? 'QUEUING'" />
      </div>

      <p class="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
        <template v-if="isPolling">
          <Loader2 :size="12" class="animate-spin" aria-hidden="true" />
          正在确认落库结果（第 {{ pollingAttempts }} 次）
        </template>
        <template v-else-if="pollingDetail?.status === 'CREATED'">订单已落库，可在“我的订单”查看</template>
        <template v-else-if="pollingDetail?.status === 'CREATE_FAILED'">订单创建失败，库存将按后端策略回补</template>
        <template v-else>状态未确认，可稍后在“我的订单”查看</template>
      </p>

      <el-button
        v-if="hasOrdersRoute"
        text
        type="primary"
        size="small"
        class="mt-1 px-0"
        @click="router.push({ name: 'orders' })"
      >
        前往我的订单
        <ArrowRight :size="13" class="ml-1" aria-hidden="true" />
      </el-button>
    </div>
  </div>
</template>
