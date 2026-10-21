<script setup lang="ts">
import { computed, type Component } from 'vue'
import ActivityCard from '@/modules/activity/components/ActivityCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ListPagination from '@/shared/ui/ListPagination.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import type { ActivityEntry } from '@/modules/activity/utils/grouping'

const props = withDefaults(
  defineProps<{
    sectionId: string
    index: string
    tone: 'flash' | 'muted'
    title: string
    subtitle: string
    icon: Component
    total: number
    page: number
    pages: number
    pageSize: number
    items: ActivityEntry[]
    now: number
    loading?: boolean
    emptyTitle: string
    emptyDescription: string
    emptyActionText?: string
  }>(),
  {
    loading: false,
    emptyActionText: '',
  },
)

const emit = defineEmits<{ changePage: [page: number]; action: [] }>()

const isFlash = computed(() => props.tone === 'flash')
const headingId = computed(() => `${props.sectionId}-heading`)

const shellClass = computed(() =>
  isFlash.value
    ? 'border-flash/20 bg-gradient-to-b from-flash-soft/60 via-surface to-surface'
    : 'border-line bg-gradient-to-b from-muted/70 via-surface to-surface',
)
const railClass = computed(() =>
  isFlash.value
    ? 'bg-gradient-to-r from-transparent via-flash/45 to-transparent'
    : 'bg-gradient-to-r from-transparent via-line to-transparent',
)
const indexClass = computed(() =>
  isFlash.value
    ? 'border-flash/25 bg-flash-soft text-flash-dark'
    : 'border-line bg-muted text-ink-700',
)
const iconClass = computed(() => (isFlash.value ? 'text-flash' : 'text-ink-500'))
const badgeClass = computed(() =>
  isFlash.value
    ? 'border-flash/25 bg-flash-soft text-flash-dark'
    : 'border-line bg-surface text-ink-700',
)
const dividerClass = computed(() => (isFlash.value ? 'border-flash/15' : 'border-line/80'))
</script>

<template>
  <section
    :id="sectionId"
    class="section-anchor relative overflow-hidden rounded-3xl border p-5 sm:p-7"
    :class="shellClass"
    :aria-labelledby="headingId"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 h-px" :class="railClass" aria-hidden="true" />
    <span
      class="pointer-events-none absolute inset-y-6 left-0 w-1 rounded-r-full"
      :class="isFlash ? 'bg-gradient-to-b from-flash/70 to-flash/15' : 'bg-gradient-to-b from-ink-300/50 to-transparent'"
      aria-hidden="true"
    />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-3.5">
        <span class="num grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[12px] font-semibold" :class="indexClass">
          {{ index }}
        </span>
        <div class="min-w-0">
          <h2 :id="headingId" class="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink-900">
            <component :is="icon" :size="16" :class="iconClass" aria-hidden="true" />
            {{ title }}
            <span class="num rounded-full border px-2 py-0.5 text-[11px] font-medium" :class="badgeClass">
              {{ total }} 场
            </span>
          </h2>
          <p class="mt-1 max-w-2xl text-xs leading-5 text-ink-500">{{ subtitle }}</p>
        </div>
      </div>
      <p v-if="total > 0" class="hidden text-xs text-ink-500 sm:block">
        每页 <span class="num font-medium text-ink-700">{{ pageSize }}</span> 场
      </p>
    </div>

    <div v-if="loading && !items.length" class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="slot in pageSize" :key="slot" class="surface-card overflow-hidden">
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
      v-else-if="!items.length"
      compact
      :title="emptyTitle"
      :description="emptyDescription"
      :action-text="emptyActionText"
      @action="emit('action')"
    />

    <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <ActivityCard
        v-for="entry in items"
        :key="entry.item.activityId"
        :activity="entry.item"
        :now="now"
      />
    </div>

    <div
      v-if="!loading && total > 0"
      class="mt-6 border-t pt-4"
      :class="dividerClass"
    >
      <ListPagination
        :page="page"
        :pages="pages"
        :total="total"
        :page-size="pageSize"
        unit="场"
        :tone="isFlash ? 'flash' : 'brand'"
        :aria-label="`${title}分页`"
        @change="emit('changePage', $event)"
      />
    </div>
  </section>
</template>
