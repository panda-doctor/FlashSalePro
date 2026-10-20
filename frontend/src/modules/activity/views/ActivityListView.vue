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
  <div class="page-container py-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">秒杀活动</h1>
        <p class="mt-1 text-sm text-ink-500">
          当前
          <span class="num font-medium text-ink-900">{{ counts.RUNNING }}</span>
          场进行中，
          <span class="num font-medium text-ink-900">{{ counts.UPCOMING }}</span>
          场即将开始。阶段按时间窗实时计算。
        </p>
      </div>
      <el-button plain :loading="loading" @click="load">
        <RefreshCw :size="14" class="mr-1.5" aria-hidden="true" />
        刷新
      </el-button>
    </header>

    <section class="surface-card mt-6 flex flex-wrap items-center gap-3 p-4">
      <div class="w-full sm:w-72">
        <label for="activity-keyword" class="mb-1 block text-xs text-ink-500">活动 / 商品名称</label>
        <el-input id="activity-keyword" v-model="keyword" placeholder="输入名称筛选已加载的活动" clearable>
          <template #prefix>
            <Search :size="15" aria-hidden="true" />
          </template>
        </el-input>
      </div>

      <div class="flex flex-wrap gap-2 sm:ml-auto" role="group" aria-label="活动阶段筛选">
        <el-radio-group v-model="filter" size="default">
          <el-radio-button v-for="option in filters" :key="option.value" :value="option.value">
            {{ option.label }}
            <span class="num ml-1 text-xs opacity-70">{{ counts[option.value] }}</span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </section>

    <section class="mt-6">
      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="index in 6" :key="index" class="surface-card overflow-hidden">
          <SkeletonBlock class="aspect-[4/3]" rounded="sm" />
          <div class="space-y-2 p-4">
            <SkeletonBlock class="h-3 w-1/3" />
            <SkeletonBlock class="h-4 w-3/4" />
            <SkeletonBlock class="h-6 w-1/2" />
            <SkeletonBlock class="h-2 w-full" />
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

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActivityCard
          v-for="entry in visible"
          :key="entry.item.activityId"
          :activity="entry.item"
          :now="now"
        />
      </div>
    </section>

    <p class="mt-8 text-xs leading-5 text-ink-500">
      说明：后端的 activity.status 是创建时快照，不会随时间自动流转；本页阶段判定以时间窗优先，status 仅作兜底。
    </p>
  </div>
</template>
