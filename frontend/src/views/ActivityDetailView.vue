<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import ProductImage from '@/components/product/ProductImage.vue'
import CountdownText from '@/components/activity/CountdownText.vue'
import StockProgress from '@/components/activity/StockProgress.vue'
import RankList from '@/components/activity/RankList.vue'
import SeckillPanel from '@/components/activity/SeckillPanel.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getActivity } from '@/api/activity'
import { getProduct } from '@/api/product'
import { getTopRank } from '@/api/rank'
import { useNow } from '@/composables/useNow'
import { ApiError, RESULT_CODE } from '@/types/common'
import type { SeckillActivityVO } from '@/types/activity'
import type { ProductVO } from '@/types/product'
import type { RankEntryVO } from '@/types/analytics'
import {
  ACTIVITY_STATE_META,
  resolveActivityState,
  type ActivityDisplayState,
} from '@/utils/activityPhase'
import { discountRate, formatPrice } from '@/utils/money'

const route = useRoute()
const now = useNow(1000)

const activity = ref<SeckillActivityVO | null>(null)
const product = ref<ProductVO | null>(null)
const rank = ref<RankEntryVO[]>([])
const loading = ref(true)
const rankLoading = ref(false)
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

function loadRank(): void {
  rankLoading.value = true
  getTopRank(activityId.value)
    .then((data) => {
      rank.value = data
    })
    .catch((error: unknown) => {
      rank.value = []
      console.error('榜单加载失败', error)
    })
    .finally(() => {
      rankLoading.value = false
    })
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
  <div class="page-container py-8">
    <nav class="mb-5 flex items-center gap-2 text-sm text-ink-500" aria-label="面包屑">
      <RouterLink :to="{ name: 'activities' }" class="hover:text-brand">秒杀活动</RouterLink>
      <span aria-hidden="true">/</span>
      <span class="text-ink-900">活动详情</span>
    </nav>

    <div v-if="loading" class="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div class="surface-card aspect-square animate-pulse bg-muted" />
      <div class="space-y-4">
        <div class="h-6 w-24 animate-pulse rounded bg-muted" />
        <div class="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div class="h-24 animate-pulse rounded bg-muted" />
        <div class="h-14 animate-pulse rounded bg-muted" />
        <div class="h-32 animate-pulse rounded bg-muted" />
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
      <div class="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div>
          <div class="surface-card overflow-hidden">
            <div class="aspect-square w-full">
              <ProductImage :src="product?.imageUrl ?? null" :alt="product?.name || activity.activityName" eager />
            </div>
          </div>

          <section v-if="product" class="surface-card mt-4 p-5">
            <h2 class="text-sm font-semibold">商品信息</h2>
            <RouterLink
              :to="{ name: 'product-detail', params: { id: product.productId } }"
              class="mt-2 block text-[15px] font-medium text-ink-900 hover:text-brand"
            >
              {{ product.name }}
            </RouterLink>
            <p class="mt-1 line-clamp-3 text-sm leading-6 text-ink-500">
              {{ product.description || '商家未填写商品描述。' }}
            </p>
            <p class="num mt-3 text-sm text-ink-500">标价 {{ formatPrice(product.originalPrice) }}</p>
          </section>
        </div>

        <div>
          <div class="flex flex-wrap items-center gap-2">
            <el-tag :type="meta.tagType" effect="light">{{ meta.label }}</el-tag>
            <span class="num text-xs text-ink-500">活动 ID {{ activity.activityId }}</span>
          </div>

          <h1 class="mt-3 text-2xl font-semibold leading-snug">{{ activity.activityName }}</h1>
          <p class="mt-1 text-sm text-ink-500">{{ product?.name || '商品信息加载中' }}</p>

          <div class="mt-5 rounded-xl border border-brand/15 bg-gradient-to-r from-brand-soft to-white px-5 py-4">
            <div class="flex items-end gap-2">
              <span class="num text-3xl font-semibold leading-none text-price">
                {{ formatPrice(activity.seckillPrice) }}
              </span>
              <span
                v-if="product && product.originalPrice > activity.seckillPrice"
                class="num text-sm leading-none text-ink-300 line-through"
              >
                {{ formatPrice(product.originalPrice) }}
              </span>
            </div>
            <p v-if="discount !== null" class="mt-1.5 text-xs text-brand-dark">相当于原价 {{ discount }}%</p>
          </div>

          <div class="mt-4 rounded-lg bg-muted px-4 py-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-xs text-ink-500">时间窗（GMT+8）</p>
                <p class="num mt-0.5 text-sm text-ink-900">
                  {{ activity.startTime }} ~ {{ activity.endTime }}
                </p>
              </div>
              <CountdownText
                :start-time="activity.startTime"
                :end-time="activity.endTime"
                :now="now"
                :state="state"
              />
            </div>
          </div>

          <div class="mt-4">
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

          <p class="mt-4 text-xs leading-5 text-ink-500">
            活动 status 为创建时快照，阶段以时间窗与实时库存为准；剩余库存来自 Redis，未预热时为空。
          </p>

          <el-button class="mt-4" text @click="$router.push({ name: 'activities' })">
            <ArrowLeft :size="14" class="mr-1" aria-hidden="true" />
            返回活动大厅
          </el-button>
        </div>
      </div>

      <div class="mt-8">
        <RankList :entries="rank" :loading="rankLoading" @refresh="loadRank" />
      </div>
    </template>
  </div>
</template>
