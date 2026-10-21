<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import CountdownText from '@/modules/activity/components/CountdownText.vue'
import StockProgress from '@/modules/activity/components/StockProgress.vue'
import RankList from '@/modules/analytics/components/RankList.vue'
import SeckillPanel from '@/modules/seckill/components/SeckillPanel.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import { getActivity } from '@/modules/activity/api'
import { getProduct } from '@/modules/product/api'
import { useRank } from '@/modules/analytics/composables/useRank'
import { useNow } from '@/shared/composables/useNow'
import { ApiError, RESULT_CODE } from '@/shared/types/common'
import type { SeckillActivityVO } from '@/modules/activity/types'
import type { ProductVO } from '@/modules/product/types'
import {
  ACTIVITY_STATE_META,
  resolveActivityState,
  type ActivityDisplayState,
} from '@/modules/activity/utils/activityPhase'
import { discountRate, formatPrice } from '@/shared/utils/money'

const route = useRoute()
const now = useNow(1000)

const activity = ref<SeckillActivityVO | null>(null)
const product = ref<ProductVO | null>(null)
const rankState = useRank()
const rank = rankState.entries
const loading = ref(true)
const rankLoading = rankState.loading
const notFound = ref(false)
const errorMessage = ref('')

const activityId = computed(() => String(route.params.id ?? ''))

const state = computed<ActivityDisplayState>(() =>
  activity.value
    ? resolveActivityState({
        startTime: activity.value.startTime,
        endTime: activity.value.endTime,
        status: activity.value.status,
        stock: activity.value.stock,
        now: now.value,
      })
    : 'NOT_STARTED',
)

const meta = computed(() => ACTIVITY_STATE_META[state.value])
const discount = computed(() =>
  activity.value && product.value
    ? discountRate(product.value.originalPrice, activity.value.seckillPrice)
    : null,
)

const stateClass = computed(() => {
  if (state.value === 'RUNNING') return 'border-flash bg-flash text-white'
  if (state.value === 'NOT_STARTED' || state.value === 'NOT_PREHEATED') {
    return 'border-warning/25 bg-warning/10 text-warning'
  }
  if (state.value === 'SOLD_OUT' || state.value === 'CANCELLED') {
    return 'border-danger/25 bg-danger/10 text-danger'
  }
  return 'border-line bg-surface/90 text-ink-700'
})

const steps = [
  { no: '01', title: '进入活动', note: '确认时间窗与实时库存' },
  { no: '02', title: '提交抢购', note: '登录后由 Lua 原子预扣' },
  { no: '03', title: '等待落库', note: '异步创建订单，可轮询结果' },
]


function loadRank(): void {
  void rankState.load(activityId.value)
}

function loadProduct(productId: number): void {
  getProduct(productId)
    .then((data) => {
      product.value = data
    })
    .catch((error: unknown) => {
      product.value = null
      console.error('商品信息加载失败', error)
    })
}

function load(): void {
  loading.value = true
  notFound.value = false
  errorMessage.value = ''

  getActivity(activityId.value)
    .then((data) => {
      activity.value = data
      loadProduct(data.productId)
      loadRank()
    })
    .catch((error: unknown) => {
      activity.value = null
      if (error instanceof ApiError && error.code === RESULT_CODE.NOT_FOUND) {
        notFound.value = true
        return
      }
      errorMessage.value = error instanceof ApiError ? error.message : '活动加载失败，请稍后重试'
    })
    .finally(() => {
      loading.value = false
    })
}

/** 抢购后只刷新实时库存与榜单，不触发整页骨架 */
function refreshLive(): void {
  getActivity(activityId.value)
    .then((data) => {
      activity.value = data
    })
    .catch((error: unknown) => {
      console.error('活动库存刷新失败', error)
    })
  loadRank()
}

watch(activityId, load, { immediate: true })
</script>

<template>
  <div class="page-container py-10 sm:py-12">
    <nav class="mb-6 flex items-center gap-2 text-sm text-ink-500" aria-label="面包屑">
      <RouterLink :to="{ name: 'activities' }" class="transition-colors hover:text-brand-dark">秒杀活动</RouterLink>
      <span aria-hidden="true" class="text-ink-300">/</span>
      <span class="text-ink-900">活动详情</span>
    </nav>

    <div v-if="loading" class="grid gap-10 lg:grid-cols-[minmax(0,440px)_1fr]">
      <div class="surface-card aspect-square animate-pulse bg-muted" />
      <div class="space-y-4">
        <div class="h-6 w-24 animate-pulse rounded bg-muted" />
        <div class="h-9 w-2/3 animate-pulse rounded bg-muted" />
        <div class="h-28 animate-pulse rounded-2xl bg-muted" />
        <div class="h-16 animate-pulse rounded-2xl bg-muted" />
        <div class="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>

    <EmptyState
      v-else-if="notFound"
      title="活动不存在"
      description="该活动可能已被删除，或链接中的活动 ID 有误。"
      action-text="返回活动大厅"
      @action="$router.push({ name: 'activities' })"
    />

    <EmptyState
      v-else-if="errorMessage"
      title="活动加载失败"
      :description="errorMessage"
      action-text="重新加载"
      @action="load"
    />

    <template v-else-if="activity">
      <div class="grid gap-10 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-14">
        <div class="lg:sticky lg:top-24 lg:self-start">
          <div class="relative">
            <div class="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-atelier-rose/70 via-atelier-sand/40 to-transparent" aria-hidden="true" />
            <div class="surface-card relative overflow-hidden rounded-3xl">
              <div class="aspect-[4/3] w-full sm:aspect-square">
                <ProductImage :src="product?.imageUrl ?? null" :alt="product?.name || activity.activityName" eager />
              </div>
              <span
                class="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm"
                :class="stateClass"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ meta.label }}
              </span>
            </div>
          </div>

          <section v-if="product" class="surface-card mt-5 hidden p-5 lg:block">
            <p class="text-[10px] uppercase tracking-[0.22em] text-ink-500">Linked product</p>
            <RouterLink
              :to="{ name: 'product-detail', params: { id: product.productId } }"
              class="mt-1.5 block text-[15px] font-medium text-ink-900 transition-colors hover:text-brand-dark"
            >
              {{ product.name }}
            </RouterLink>
            <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-ink-500">
              {{ product.description || '商家未填写商品描述。' }}
            </p>
            <p class="num mt-3 text-sm text-ink-500">标价 {{ formatPrice(product.originalPrice) }}</p>
          </section>
        </div>

        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="num text-xs text-ink-500">活动 ID {{ activity.activityId }}</span>
          </div>

          <h1 class="page-title mt-3">{{ activity.activityName }}</h1>
          <p class="mt-2 text-sm text-ink-500">{{ product?.name || '商品信息加载中' }}</p>

          <div class="mt-6 overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand-soft via-atelier-rose/60 to-surface p-6">
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p class="text-xs font-medium tracking-wide text-brand-dark">秒杀价</p>
                <div class="mt-2 flex items-end gap-3">
                  <span class="num text-[36px] font-semibold leading-none text-price sm:text-[40px]">
                    {{ formatPrice(activity.seckillPrice) }}
                  </span>
                  <span
                    v-if="product && product.originalPrice > activity.seckillPrice"
                    class="num pb-1 text-sm leading-none text-ink-500 line-through"
                  >
                    {{ formatPrice(product.originalPrice) }}
                  </span>
                </div>
              </div>
              <span v-if="discount !== null" class="rounded-full bg-surface/80 px-3 py-1.5 text-xs font-medium text-brand-dark">
                省 {{ Math.max(0, 100 - discount) }}%
              </span>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/80 bg-surface px-4 py-3">
            <div>
              <p class="text-xs text-ink-500">时间窗（GMT+8）</p>
              <p class="num mt-0.5 text-sm text-ink-900">{{ activity.startTime }} ~ {{ activity.endTime }}</p>
            </div>
            <CountdownText
              :start-time="activity.startTime"
              :end-time="activity.endTime"
              :now="now"
              :state="state"
            />
          </div>

          <div class="mt-4 rounded-2xl border border-line/80 bg-surface px-4 py-3.5">
            <StockProgress :total="activity.totalStock" :remaining="activity.stock" />
          </div>

          <div class="mt-5">
            <SeckillPanel
              :activity-id="activity.activityId"
              :state="state"
              :stock="activity.stock"
              :limit-per-user="activity.limitPerUser"
              @refresh="refreshLive"
            />
          </div>

          <section class="mt-6 rounded-2xl border border-line/80 bg-surface p-4" aria-label="抢购流程">
            <div class="grid gap-3 sm:grid-cols-3">
              <div v-for="step in steps" :key="step.no" class="flex items-start gap-2.5">
                <span class="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-dark">
                  {{ step.no }}
                </span>
                <div>
                  <p class="text-xs font-medium text-ink-900">{{ step.title }}</p>
                  <p class="mt-0.5 text-[11px] leading-5 text-ink-500">{{ step.note }}</p>
                </div>
              </div>
            </div>
          </section>

          <p class="mt-4 text-xs leading-5 text-ink-500">
            活动 status 为创建时快照，阶段以时间窗与实时库存为准；剩余库存来自 Redis，未预热时为空。
          </p>

          <el-button class="mt-3" text @click="$router.push({ name: 'activities' })">
            <ArrowLeft :size="14" class="mr-1" aria-hidden="true" />
            返回活动大厅
          </el-button>
        </div>
      </div>

      <div class="mt-10">
        <RankList :entries="rank" :loading="rankLoading" @refresh="loadRank" />
      </div>
    </template>
  </div>
</template>
