<script setup lang="ts">
import { computed, ref } from 'vue'
import { RefreshCw, Search } from 'lucide-vue-next'
import ActivityCard from '@/modules/activity/components/ActivityCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { listActivities } from '@/modules/activity/api'
import { useNow } from '@/shared/composables/useNow'
import { ApiError, RESULT_CODE } from '@/shared/types/common'
import type { ActivityItemVO } from '@/modules/activity/types'
import {
  activitySortWeight,
  isFinishedState,
  resolveActivityState,
  type ActivityDisplayState,
} from '@/modules/activity/utils/activityPhase'
import { toTimestamp } from '@/shared/utils/time'

type FilterValue = 'ALL' | 'RUNNING' | 'UPCOMING' | 'FINISHED'

const now = useNow(1000)

const activities = ref<ActivityItemVO[]>([])
const loading = ref(true)
const errorMessage = ref('')
const keyword = ref('')
const filter = ref<FilterValue>('ALL')

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: 'ALL', label: '全部' },
  { value: 'RUNNING', label: '进行中' },
  { value: 'UPCOMING', label: '未开始' },
  { value: 'FINISHED', label: '已结束' },
]

function load(): void {
  loading.value = true
  errorMessage.value = ''

  listActivities()
    .then((data) => {
      activities.value = data
    })
    .catch((error: unknown) => {
      activities.value = []
      errorMessage.value =
        error instanceof ApiError
          ? error.message
          : error instanceof Error && error.message.includes('无法连接')
            ? '无法连接后端服务，请确认网关 8090 已启动'
            : '活动加载失败，请稍后重试'
      if (error instanceof ApiError && error.code === RESULT_CODE.SYSTEM_ERROR) {
        errorMessage.value = error.message
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const decorated = computed(() =>
  activities.value.map((item) => ({
    item,
    state: resolveActivityState({
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      stock: item.stock,
      preheated: item.preheated,
      now: now.value,
    }),
  })),
)

function matchesFilter(state: ActivityDisplayState, value: FilterValue): boolean {
  if (value === 'ALL') return true
  if (value === 'RUNNING') return state === 'RUNNING' || state === 'NOT_PREHEATED'
  if (value === 'UPCOMING') return state === 'NOT_STARTED'
  return isFinishedState(state)
}

const visible = computed(() => {
  const term = keyword.value.trim().toLowerCase()
  return decorated.value
    .filter((entry) => matchesFilter(entry.state, filter.value))
    .filter((entry) => {
      if (!term) return true
      const name = entry.item.activityName.toLowerCase()
      const product = (entry.item.productName ?? '').toLowerCase()
      return name.includes(term) || product.includes(term)
    })
    .sort((a, b) => {
      const weight = activitySortWeight(a.state) - activitySortWeight(b.state)
      if (weight !== 0) return weight
      return toTimestamp(a.item.startTime) - toTimestamp(b.item.startTime)
    })
})

const counts = computed(() => ({
  ALL: decorated.value.length,
  RUNNING: decorated.value.filter((entry) => matchesFilter(entry.state, 'RUNNING')).length,
  UPCOMING: decorated.value.filter((entry) => matchesFilter(entry.state, 'UPCOMING')).length,
  FINISHED: decorated.value.filter((entry) => matchesFilter(entry.state, 'FINISHED')).length,
}))

load()
</script>

<template>
  <div class="pb-16">
    <section
      class="relative isolate overflow-hidden bg-gradient-to-br from-[#FBF0E6] via-[#F8EADD] to-[#FAF6F1] text-ink-900"
      aria-label="限时秒杀横幅"
    >
      <div
        class="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-brand/25 blur-[90px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-[#FFB266]/20 blur-[110px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.12]"
        style="background-image: radial-gradient(rgba(184, 132, 102, 0.38) 1px, transparent 1px); background-size: 22px 22px"
        aria-hidden="true"
      />
      <div class="page-container relative py-10 sm:py-12">
        <header class="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-dark">
              <span class="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              Live Sell / 02
            </p>
            <h1 class="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-bold leading-tight tracking-tight">
              秒杀活动
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-7 text-ink-500">
              按时间窗实时判定阶段，进行中的场次优先展示。库存、倒计时与价格均来自活动接口。
            </p>
          </div>
          <el-button
            plain
            :loading="loading"
            class="!border-line !bg-surface !text-ink-700 hover:!border-brand/50 hover:!bg-surface hover:!text-brand-dark"
            @click="load"
          >
            <RefreshCw :size="14" class="mr-1.5" aria-hidden="true" />
            刷新
          </el-button>
        </header>
      </div>
    </section>

    <div class="page-container py-8 sm:py-10">
      <section class="grid grid-cols-3 gap-2.5 sm:gap-3" aria-label="活动阶段概览">
        <div class="rounded-2xl border border-brand/30 bg-gradient-to-br from-[#B8543A] to-[#8B2F1D] p-3 text-[#FFFBF5] shadow-[0_10px_24px_rgba(120,72,48,0.22)] sm:p-4">
          <p class="flex items-center gap-1.5 text-[11px] text-[#FFFBF5]/90 sm:gap-2 sm:text-xs">
            <span class="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFFBF5] opacity-60 motion-reduce:hidden" />
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFFBF5]" />
            </span>
            进行中
          </p>
          <p class="num mt-2 text-xl font-semibold leading-none sm:text-[26px]">{{ counts.RUNNING }}</p>
          <p class="mt-1.5 text-[10px] leading-4 text-[#FFFBF5]/80 sm:text-[11px]">现在可以抢购</p>
        </div>
        <div class="rounded-2xl border border-warning/25 bg-warning/10 p-3 sm:p-4">
          <p class="flex items-center gap-1.5 text-[11px] text-ink-500 sm:gap-2 sm:text-xs">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
            未开始
          </p>
          <p class="num mt-2 text-xl font-semibold leading-none text-warning sm:text-[26px]">{{ counts.UPCOMING }}</p>
          <p class="mt-1.5 text-[10px] leading-4 text-ink-500 sm:text-[11px]">等待时间窗开启</p>
        </div>
        <div class="rounded-2xl border border-line/80 bg-muted/80 p-3 sm:p-4">
          <p class="flex items-center gap-1.5 text-[11px] text-ink-500 sm:gap-2 sm:text-xs">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300" aria-hidden="true" />
            已结束
          </p>
          <p class="num mt-2 text-xl font-semibold leading-none text-ink-700 sm:text-[26px]">{{ counts.FINISHED }}</p>
          <p class="mt-1.5 text-[10px] leading-4 text-ink-500 sm:text-[11px]">可回看场次详情</p>
        </div>
      </section>

    <section class="surface-card mt-6 flex flex-wrap items-center gap-3 p-5">
      <div class="w-full sm:w-80">
        <label for="activity-keyword" class="mb-1.5 block text-xs font-medium text-ink-700">活动 / 商品名称</label>
        <el-input id="activity-keyword" v-model="keyword" placeholder="输入名称筛选已加载的活动" clearable>
          <template #prefix>
            <Search :size="15" aria-hidden="true" />
          </template>
        </el-input>
      </div>

      <div class="flex flex-wrap gap-2 sm:ml-auto" role="group" aria-label="活动阶段筛选">
        <el-radio-group v-model="filter" size="default" class="filter-pills">
          <el-radio-button v-for="option in filters" :key="option.value" :value="option.value">
            {{ option.label }}
            <span class="num ml-1 text-xs opacity-70">{{ counts[option.value] }}</span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </section>

    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs tracking-wide text-ink-500">
        当前筛选
        <span class="num font-semibold text-brand">{{ visible.length }}</span>
        场
      </p>
      <p class="hidden text-xs text-ink-500 sm:block">进行中优先 · 未开始其次 · 已结束置后</p>
    </div>

    <section class="mt-4">
      <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="index in 6" :key="index" class="surface-card overflow-hidden">
          <SkeletonBlock class="aspect-[4/3]" rounded="sm" />
          <div class="space-y-2 p-5">
            <SkeletonBlock class="h-3 w-1/3" />
            <SkeletonBlock class="h-5 w-3/4" />
            <SkeletonBlock class="h-6 w-1/2" />
            <SkeletonBlock class="h-2 w-full" />
            <SkeletonBlock class="h-8 w-full" />
          </div>
        </div>
      </div>

      <EmptyState
        v-else-if="errorMessage"
        title="活动加载失败"
        :description="errorMessage"
        action-text="重新加载"
        @action="load"
      />

      <EmptyState
        v-else-if="!visible.length"
        title="当前筛选下没有活动"
        description="切换阶段筛选，或清空关键字后再试。活动列表由后端一次性返回，不做分页。"
        action-text="查看全部"
        @action="filter = 'ALL'"
      />

      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ActivityCard
          v-for="entry in visible"
          :key="entry.item.activityId"
          :activity="entry.item"
          :now="now"
        />
      </div>
    </section>

    <p class="mt-8 rounded-xl border border-line/70 bg-muted/50 px-4 py-3 text-xs leading-5 text-ink-500">
      说明：后端的 activity.status 是创建时快照，不会随时间自动流转；本页阶段判定以时间窗优先，status 仅作兜底。
    </p>
    </div>
  </div>
</template>
