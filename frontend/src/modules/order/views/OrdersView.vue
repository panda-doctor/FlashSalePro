<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshCw, Search } from 'lucide-vue-next'
import OrderCard from '@/modules/order/components/OrderCard.vue'
import OrderStatusTag from '@/modules/order/components/OrderStatusTag.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import { getOrderDetail, listMyOrders } from '@/modules/order/api'
import { listActivities } from '@/modules/activity/api'
import { ApiError } from '@/shared/types/common'
import type { OrderDetail, OrderListItemVO } from '@/modules/order/types'
import { normalizeOrderStatus } from '@/modules/order/utils/orderStatus'
import { formatDateTime } from '@/shared/utils/time'
import { formatPrice } from '@/shared/utils/money'

type StatusFilter = 'ALL' | 'QUEUING' | 'CREATED' | 'CREATE_FAILED' | 'CANCELLED'

const router = useRouter()

const orders = ref<OrderListItemVO[]>([])
const activityNames = ref<Record<number, string>>({})
const loading = ref(true)
const errorMessage = ref('')
const keyword = ref('')
const statusFilter = ref<StatusFilter>('ALL')

const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<OrderDetail | null>(null)

const filters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: '全部' },
  { value: 'QUEUING', label: '排队中' },
  { value: 'CREATED', label: '已创建' },
  { value: 'CREATE_FAILED', label: '创建失败' },
  { value: 'CANCELLED', label: '已取消' },
]

let refreshTimer: number | null = null

function clearRefresh(): void {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

const hasQueuing = computed(() =>
  orders.value.some((order) => normalizeOrderStatus(order.status) === 'QUEUING'),
)

/** 仅当存在排队中订单时轮询列表；页面不可见时顺延 */
function scheduleRefresh(): void {
  clearRefresh()
  if (!hasQueuing.value) return

  refreshTimer = window.setTimeout(() => {
    if (typeof document !== 'undefined' && document.hidden) {
      scheduleRefresh()
      return
    }
    loadOrders(false)
  }, 5000)
}

function loadActivities(): void {
  listActivities()
    .then((list) => {
      const map: Record<number, string> = {}
      list.forEach((item) => {
        map[item.activityId] = item.activityName
      })
      activityNames.value = map
    })
    .catch((error: unknown) => {
      console.error('活动名称加载失败', error)
    })
}

function loadOrders(showSkeleton = true): void {
  if (showSkeleton) loading.value = true
  errorMessage.value = ''

  listMyOrders()
    .then((data) => {
      orders.value = data
      scheduleRefresh()
    })
    .catch((error: unknown) => {
      orders.value = []
      errorMessage.value = error instanceof ApiError ? error.message : '订单加载失败，请稍后重试'
    })
    .finally(() => {
      loading.value = false
    })
}

const visible = computed(() => {
  const term = keyword.value.trim()
  return orders.value
    .filter((order) => statusFilter.value === 'ALL' || normalizeOrderStatus(order.status) === statusFilter.value)
    .filter((order) => !term || order.orderNo.includes(term))
})

function activityName(activityId: number): string {
  return activityNames.value[activityId] ?? `活动 ${activityId}`
}

function openDetail(orderNo: string): void {
  drawerOpen.value = true
  detailLoading.value = true
  detail.value = null

  getOrderDetail(orderNo)
    .then((data) => {
      detail.value = data
    })
    .catch((error: unknown) => {
      errorMessage.value = error instanceof ApiError ? error.message : '订单详情加载失败'
    })
    .finally(() => {
      detailLoading.value = false
    })
}

function goActivity(activityId?: number): void {
  if (!activityId || !router.hasRoute('activity-detail')) return
  drawerOpen.value = false
  router.push({ name: 'activity-detail', params: { id: activityId } })
}

loadActivities()
loadOrders()

onUnmounted(clearRefresh)
</script>

<template>
  <div class="page-container py-10 sm:py-12">
    <header class="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p class="eyebrow">Orders / 04</p>
        <h1 class="page-title mt-3">我的订单</h1>
        <p class="page-intro mt-3">
          共
          <span class="num font-semibold text-ink-900">{{ orders.length }}</span>
          笔订单。排队中的订单会自动刷新，直至落库或超时。
        </p>
      </div>
      <el-button plain :loading="loading" @click="loadOrders()">
        <RefreshCw :size="14" class="mr-1.5" aria-hidden="true" />
        刷新
      </el-button>
    </header>

    <section class="surface-card mt-7 flex flex-wrap items-center gap-3 p-5">
      <div class="w-full sm:w-64">
        <label for="order-keyword" class="mb-1.5 block text-xs font-medium text-ink-700">订单号</label>
        <el-input id="order-keyword" v-model="keyword" placeholder="输入订单号筛选" clearable>
          <template #prefix>
            <Search :size="15" aria-hidden="true" />
          </template>
        </el-input>
      </div>

      <el-radio-group v-model="statusFilter" class="filter-pills sm:ml-auto">
        <el-radio-button v-for="option in filters" :key="option.value" :value="option.value">
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="mt-6">
      <div v-if="loading" class="flex flex-col gap-3">
        <div v-for="index in 4" :key="index" class="surface-card h-[92px] animate-pulse bg-muted" />
      </div>

      <EmptyState
        v-else-if="errorMessage"
        title="订单加载失败"
        :description="errorMessage"
        action-text="重新加载"
        @action="loadOrders()"
      />

      <EmptyState
        v-else-if="!visible.length"
        title="暂无订单"
        description="参与秒杀并成功入队后，订单会出现在这里。未落库的订单显示为排队中。"
        action-text="去看看活动"
        @action="router.push({ name: 'activities' })"
      />

      <div v-else class="flex flex-col gap-3">
        <OrderCard
          v-for="order in visible"
          :key="order.orderNo"
          :order="order"
          :activity-name="activityName(order.activityId)"
          @select="openDetail(order.orderNo)"
        />
      </div>
    </section>

    <el-drawer v-model="drawerOpen" title="订单详情" size="440px" :destroy-on-close="true">
      <div v-if="detailLoading" class="space-y-3">
        <div class="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div class="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div class="h-24 animate-pulse rounded bg-muted" />
      </div>

      <div v-else-if="detail">
        <div class="flex items-center justify-between gap-3">
          <span class="num break-all text-sm font-medium text-ink-900">{{ detail.orderNo }}</span>
          <OrderStatusTag :status="detail.status" :status-desc="detail.statusDesc" size="default" />
        </div>

        <dl class="mt-6 space-y-3 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-ink-500">活动 ID</dt>
            <dd class="num">{{ detail.activityId ?? '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-ink-500">商品 ID</dt>
            <dd class="num">{{ detail.productId ?? '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-ink-500">秒杀价</dt>
            <dd class="num">{{ detail.seckillPrice === undefined ? '—' : formatPrice(detail.seckillPrice) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-ink-500">订单 ID</dt>
            <dd class="num">{{ detail.orderId ?? '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-ink-500">创建时间</dt>
            <dd class="num">{{ formatDateTime(detail.createdAt) }}</dd>
          </div>
        </dl>

        <p v-if="detail.status === 'QUEUING'" class="mt-5 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
          排队中表示请求已入队、订单尚未落库。后端对不存在的单号同样返回排队中，请以订单列表为准。
        </p>

        <el-button v-if="detail.activityId" class="mt-6 w-full" @click="goActivity(detail.activityId)">
          查看对应活动
        </el-button>
      </div>

      <EmptyState v-else compact title="未获取到订单详情" />
    </el-drawer>
  </div>
</template>
