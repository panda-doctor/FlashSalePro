<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Archive, Flame, RefreshCw, Sparkles } from 'lucide-vue-next'
import ActivityPhaseOverview from '@/modules/activity/components/ActivityPhaseOverview.vue'
import ActivitySection from '@/modules/activity/components/ActivitySection.vue'
import ActivityToolbar from '@/modules/activity/components/ActivityToolbar.vue'
import UpcomingCarousel from '@/modules/activity/components/UpcomingCarousel.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { listActivities } from '@/modules/activity/api'
import { useNow } from '@/shared/composables/useNow'
import { ApiError, RESULT_CODE } from '@/shared/types/common'
import type { ActivityItemVO } from '@/modules/activity/types'
import { resolveActivityState } from '@/modules/activity/utils/activityPhase'
import { groupActivities } from '@/modules/activity/utils/grouping'
import { clampPage, pageCount, pageSlice } from '@/shared/utils/pagination'

const PAGE_SIZE = 4

const now = useNow(1000)

const activities = ref<ActivityItemVO[]>([])
const loading = ref(true)
const errorMessage = ref('')
const keyword = ref('')
const livePage = ref(1)
const endedPage = ref(1)

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

const groups = computed(() => groupActivities(decorated.value, keyword.value))
const liveTotal = computed(() => groups.value.live.length)
const endedTotal = computed(() => groups.value.ended.length)
const livePages = computed(() => pageCount(liveTotal.value, PAGE_SIZE))
const endedPages = computed(() => pageCount(endedTotal.value, PAGE_SIZE))
const liveItems = computed(() => pageSlice(groups.value.live, livePage.value, PAGE_SIZE))
const endedItems = computed(() => pageSlice(groups.value.ended, endedPage.value, PAGE_SIZE))
const hasMatches = computed(() => groups.value.counts.ALL > 0)
const hasKeyword = computed(() => keyword.value.trim().length > 0)

function scrollToSection(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

function clearKeyword(): void {
  keyword.value = ''
}

watch(keyword, () => {
  livePage.value = 1
  endedPage.value = 1
})

watch(liveTotal, (total) => {
  const next = clampPage(livePage.value, total, PAGE_SIZE)
  if (next !== livePage.value) livePage.value = next
})

watch(endedTotal, (total) => {
  const next = clampPage(endedPage.value, total, PAGE_SIZE)
  if (next !== endedPage.value) endedPage.value = next
})

load()
</script>

<template>
  <div class="pb-16">
    <section
      class="relative isolate overflow-hidden bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white text-ink-900"
      aria-label="限时秒杀横幅"
    >
      <div
        class="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-brand/25 blur-[90px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-[#BFDBFE]/35 blur-[110px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.12]"
        style="background-image: radial-gradient(rgba(15, 23, 42, 0.28) 1px, transparent 1px); background-size: 22px 22px"
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
      <ActivityPhaseOverview :counts="groups.counts" @jump="scrollToSection" />

      <ActivityToolbar v-model:keyword="keyword" :counts="groups.counts" @jump="scrollToSection" />

      <div v-if="loading && !activities.length" class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        <div v-for="index in 8" :key="index" class="surface-card overflow-hidden">
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
        class="mt-6"
        title="活动加载失败"
        :description="errorMessage"
        action-text="重新加载"
        @action="load"
      />

      <EmptyState
        v-else-if="!hasMatches"
        class="mt-6"
        title="没有匹配的活动"
        :description="
          hasKeyword ? '换一个关键字，或清空筛选后查看全部场次。' : '活动创建并预热后会出现在这里，刷新页面再试。'
        "
        :action-text="hasKeyword ? '清空筛选' : '重新加载'"
        @action="hasKeyword ? clearKeyword() : load()"
      />

      <div v-else class="mt-6 space-y-6">
        <UpcomingCarousel :items="groups.upcoming" :now="now" />

        <div class="flex items-center gap-3" aria-hidden="true">
          <span class="h-px flex-1 bg-gradient-to-r from-transparent via-flash/30 to-flash/40" />
          <Sparkles :size="14" class="text-flash/60" />
          <span class="h-px flex-1 bg-gradient-to-l from-transparent via-line to-line" />
        </div>

        <ActivitySection
          section-id="live-section"
          index="02"
          tone="flash"
          title="进行中"
          subtitle="时间窗已开启且仍有库存的场次，先按可抢购排序，再按开场时间先后排列；每页 4 场。"
          :icon="Flame"
          :total="liveTotal"
          :page="livePage"
          :pages="livePages"
          :page-size="PAGE_SIZE"
          :items="liveItems"
          :now="now"
          empty-title="此刻没有进行中的场次"
          empty-description="先去「即将开场」看看下一场，或回看已结束的场次详情。"
          empty-action-text="查看即将开场"
          @change-page="livePage = $event; scrollToSection('live-section')"
          @action="scrollToSection('upcoming-section')"
        />

        <div class="flex items-center gap-3" aria-hidden="true">
          <span class="h-px flex-1 bg-gradient-to-r from-transparent via-line to-line" />
          <Archive :size="14" class="text-ink-300" />
          <span class="h-px flex-1 bg-gradient-to-l from-transparent via-brand/25 to-brand/35" />
        </div>

        <ActivitySection
          section-id="ended-section"
          index="03"
          tone="muted"
          title="已结束"
          subtitle="已结束、已售罄与已取消的场次，按结束时间倒序归档，便于回看价格与库存；每页 4 场。"
          :icon="Archive"
          :total="endedTotal"
          :page="endedPage"
          :pages="endedPages"
          :page-size="PAGE_SIZE"
          :items="endedItems"
          :now="now"
          empty-title="还没有已结束的场次"
          empty-description="活动结束后会自动归档到这里。"
          @change-page="endedPage = $event; scrollToSection('ended-section')"
        />
      </div>

      <p class="mt-8 rounded-xl border border-line/70 bg-muted/50 px-4 py-3 text-xs leading-5 text-ink-500">
        说明：后端的 activity.status 是创建时快照，不会随时间自动流转；本页阶段判定以时间窗优先，status 仅作兜底。列表接口一次返回全部活动，本页在内存中按阶段分组并分页。
      </p>
    </div>
  </div>
</template>
