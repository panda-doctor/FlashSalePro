<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertTriangle, RefreshCw, ShoppingBag, TrendingUp, Users } from 'lucide-vue-next'
import TrendChart from '@/shared/ui/TrendChart.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { getActivitySnapshots, getAdminOverview } from '@/modules/analytics/api'
import { pageAdminActivities } from '@/modules/activity/api'
import { ApiError } from '@/shared/types/common'
import { formatPrice } from '@/shared/utils/money'
import { formatDateTime } from '@/shared/utils/time'
import type { AdminOverviewVO, SnapshotPointVO } from '@/modules/analytics/types'
import type { ActivityItemVO } from '@/modules/activity/types'

type Metric = 'orderCount' | 'gmv'

const days = ref(7)
const metric = ref<Metric>('orderCount')
const overview = ref<AdminOverviewVO | null>(null)
const loading = ref(false)
const error = ref('')

const activities = ref<ActivityItemVO[]>([])
const snapshotActivityId = ref<number | null>(null)
const snapshots = ref<SnapshotPointVO[]>([])
const snapshotLoading = ref(false)

const activityNameMap = computed(() => {
  const map = new Map<number, string>()
  activities.value.forEach((item) => map.set(item.activityId, item.activityName))
  return map
})

const trendPoints = computed(() =>
  (overview.value?.trend ?? []).map((point) => ({
    label: point.date,
    value: metric.value === 'gmv' ? point.gmv : point.orderCount,
  })),
)

const maxTopOrders = computed(() =>
  Math.max(1, ...(overview.value?.topActivities ?? []).map((item) => item.orderCount)),
)

const snapshotPoints = computed(() =>
  [...snapshots.value]
    .reverse()
    .map((point) => ({
      label: formatDateTime(point.snapshotTime).slice(5, 16),
      value: point.orderCount ?? 0,
    })),
)

const metricFormatter = computed(() =>
  metric.value === 'gmv' ? (value: number) => formatPrice(value) : (value: number) => String(value),
)

function loadOverview(): void {
  loading.value = true
  error.value = ''

  getAdminOverview(days.value)
    .then((data) => {
      overview.value = data
      if (!snapshotActivityId.value) {
        snapshotActivityId.value = data.topActivities[0]?.activityId ?? activities.value[0]?.activityId ?? null
      }
    })
    .catch((err: unknown) => {
      error.value = err instanceof ApiError ? err.message : '看板加载失败'
    })
    .finally(() => {
      loading.value = false
    })
}

function loadActivities(): void {
  pageAdminActivities({ page: 1, pageSize: 100 })
    .then((page) => {
      activities.value = page.records
      if (!snapshotActivityId.value && page.records.length) {
        snapshotActivityId.value = page.records[0].activityId
      }
    })
    .catch((err: unknown) => console.error('活动列表加载失败', err))
}

function loadSnapshots(): void {
  if (!snapshotActivityId.value) {
    snapshots.value = []
    return
  }

  snapshotLoading.value = true
  getActivitySnapshots(snapshotActivityId.value, 20)
    .then((data) => {
      snapshots.value = data
    })
    .catch((err: unknown) => {
      snapshots.value = []
      console.error('快照加载失败', err)
    })
    .finally(() => {
      snapshotLoading.value = false
    })
}

watch(days, loadOverview)
watch(snapshotActivityId, loadSnapshots)

onMounted(() => {
  loadOverview()
  loadActivities()
})
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">经营看板</h2>
        <p class="mt-1 text-sm text-ink-500">数据来自 order 权威库聚合，不含跨服务调用。</p>
      </div>
      <div class="flex items-center gap-2">
        <el-select v-model="days" class="w-28" @change="loadOverview">
          <el-option :value="7" label="近 7 天" />
          <el-option :value="14" label="近 14 天" />
          <el-option :value="30" label="近 30 天" />
        </el-select>
        <el-button :loading="loading" @click="loadOverview">
          <RefreshCw :size="14" class="mr-1" aria-hidden="true" />
          刷新
        </el-button>
      </div>
    </header>

    <div v-if="loading && !overview" class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SkeletonBlock v-for="index in 4" :key="index" class="h-28" />
    </div>

    <EmptyState
      v-else-if="error"
      class="mt-5"
      title="看板加载失败"
      :description="error"
      action-text="重新加载"
      @action="loadOverview"
    />

    <template v-else-if="overview">
      <section class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="surface-card relative overflow-hidden p-5">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand/80 via-atelier-apricot/70 to-transparent" aria-hidden="true" />
          <div class="flex items-center justify-between">
            <p class="text-xs text-ink-500">今日订单</p>
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <ShoppingBag :size="16" aria-hidden="true" />
            </span>
          </div>
          <p class="num mt-3 text-3xl font-semibold text-ink-900">{{ overview.summary.todayOrderCount }}</p>
          <p class="mt-1 text-xs text-ink-500">累计 {{ overview.summary.orderCount }} 单</p>
        </div>

        <div class="surface-card relative overflow-hidden p-5">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-atelier-gold/80 via-atelier-gold-light/70 to-transparent" aria-hidden="true" />
          <div class="flex items-center justify-between">
            <p class="text-xs text-ink-500">今日成交额</p>
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-warning/10 text-warning">
              <TrendingUp :size="16" aria-hidden="true" />
            </span>
          </div>
          <p class="num mt-3 text-3xl font-semibold text-price">{{ formatPrice(overview.summary.todayGmv) }}</p>
          <p class="mt-1 text-xs text-ink-500">累计 {{ formatPrice(overview.summary.gmv) }}</p>
        </div>

        <div class="surface-card relative overflow-hidden p-5">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-atelier-apricot/80 via-atelier-peach/70 to-transparent" aria-hidden="true" />
          <div class="flex items-center justify-between">
            <p class="text-xs text-ink-500">成交用户</p>
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-atelier-sand/60 text-atelier-gold">
              <Users :size="16" aria-hidden="true" />
            </span>
          </div>
          <p class="num mt-3 text-3xl font-semibold text-ink-900">{{ overview.summary.userCount }}</p>
          <p class="mt-1 text-xs text-ink-500">按用户去重</p>
        </div>

        <div class="surface-card relative overflow-hidden p-5">
          <div
            class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent"
            :class="overview.summary.deadLetterCount ? 'from-danger/80 via-danger/50' : 'from-success/80 via-success/50'"
            aria-hidden="true"
          />
          <div class="flex items-center justify-between">
            <p class="text-xs text-ink-500">死信消息</p>
            <span
              class="grid h-9 w-9 place-items-center rounded-xl"
              :class="overview.summary.deadLetterCount ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'"
            >
              <AlertTriangle :size="16" aria-hidden="true" />
            </span>
          </div>
          <p class="num mt-3 text-3xl font-semibold" :class="overview.summary.deadLetterCount ? 'text-danger' : 'text-success'">
            {{ overview.summary.deadLetterCount }}
          </p>
          <p class="mt-1 text-xs text-ink-500">
            {{ overview.summary.deadLetterCount ? '需在死信管理中处理' : '消费链路正常' }}
          </p>
        </div>
      </section>

      <section class="surface-card mt-5 p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-[15px] font-semibold">成交趋势</h3>
            <p class="mt-1 text-xs text-ink-500">按天聚合已创建订单，空缺日期补 0。</p>
          </div>
          <el-radio-group v-model="metric" size="small">
            <el-radio-button value="orderCount">订单数</el-radio-button>
            <el-radio-button value="gmv">成交额</el-radio-button>
          </el-radio-group>
        </div>
        <div class="mt-4">
          <TrendChart
            :points="trendPoints"
            :value-formatter="metricFormatter"
            :height="240"
            :aria-label="metric === 'gmv' ? '每日成交额趋势' : '每日订单数趋势'"
          />
        </div>
      </section>

      <section class="mt-5 grid gap-5 xl:grid-cols-2">
        <div class="surface-card p-5">
          <h3 class="text-[15px] font-semibold">活动 Top5</h3>
          <p class="mt-1 text-xs text-ink-500">按成交订单数排序。</p>

          <ul v-if="overview.topActivities.length" class="mt-4 space-y-3">
            <li v-for="item in overview.topActivities" :key="item.activityId">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="truncate">
                  {{ activityNameMap.get(item.activityId) || `活动 #${item.activityId}` }}
                </span>
                <span class="num shrink-0 text-xs text-ink-500">
                  {{ item.orderCount }} 单 ｜ {{ formatPrice(item.gmv) }}
                </span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-atelier-sand/70">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-atelier-apricot to-brand transition-all"
                  :style="{ width: `${Math.max(6, (item.orderCount / maxTopOrders) * 100)}%` }"
                />
              </div>
            </li>
          </ul>
          <p v-else class="mt-6 text-sm text-ink-500">暂无成交订单。</p>
        </div>

        <div class="surface-card p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-[15px] font-semibold">单活动快照趋势</h3>
              <p class="mt-1 text-xs text-ink-500">最近 20 次快照的订单数，按时间正序。</p>
            </div>
            <el-select
              v-model="snapshotActivityId"
              class="w-48"
              filterable
              placeholder="选择活动"
              :loading="snapshotLoading"
            >
              <el-option
                v-for="item in activities"
                :key="item.activityId"
                :label="`${item.activityName}（#${item.activityId}）`"
                :value="item.activityId"
              />
            </el-select>
          </div>

          <div v-if="snapshotLoading" class="mt-4 space-y-2">
            <SkeletonBlock class="h-4 w-1/3" />
            <SkeletonBlock class="h-40" />
          </div>
          <div v-else class="mt-4">
            <TrendChart :points="snapshotPoints" :height="220" aria-label="单活动快照订单数趋势" />
            <p v-if="!snapshotPoints.length" class="mt-2 text-xs text-ink-500">
              该活动还没有快照，可在活动运维抽屉中执行「抓取快照」。
            </p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
