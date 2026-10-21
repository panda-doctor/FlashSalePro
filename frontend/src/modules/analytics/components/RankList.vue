<script setup lang="ts">
import { RefreshCw, Trophy } from 'lucide-vue-next'
import type { RankEntryVO } from '@/modules/analytics/types'
import { formatTimestamp } from '@/shared/utils/time'
import EmptyState from '@/shared/ui/EmptyState.vue'

withDefaults(defineProps<{ entries: RankEntryVO[]; loading?: boolean }>(), { loading: false })

defineEmits<{ refresh: [] }>()

function rankClass(rank: number): string {
  if (rank === 1) return 'bg-warning/10 text-warning'
  if (rank === 2) return 'bg-atelier-sand/70 text-atelier-clay'
  if (rank === 3) return 'bg-brand-soft text-brand-dark'
  return 'bg-muted text-ink-500'
}
</script>

<template>
  <section class="surface-card p-5">
    <header class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Trophy :size="17" class="text-warning" aria-hidden="true" />
        <h2 class="text-[15px] font-semibold">抢购榜 Top 10</h2>
      </div>
      <el-button text size="small" :loading="loading" @click="$emit('refresh')">
        <RefreshCw :size="13" class="mr-1" aria-hidden="true" />
        刷新
      </el-button>
    </header>

    <EmptyState
      v-if="!entries.length"
      compact
      title="暂无抢购记录"
      description="订单落库后榜单才会更新，排队中的请求不会出现在这里。"
    />

    <ol v-else class="mt-4 divide-y divide-line/60">
      <li v-for="entry in entries" :key="entry.orderNo" class="flex items-center gap-3 py-2.5">
        <span
          class="num grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-semibold"
          :class="rankClass(entry.rank)"
        >
          {{ entry.rank }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm text-ink-900">用户 <span class="num">{{ entry.userId }}</span></p>
          <p class="num truncate text-xs text-ink-500">{{ entry.orderNo }}</p>
        </div>
        <time class="num shrink-0 text-xs text-ink-500">{{ formatTimestamp(entry.score) }}</time>
      </li>
    </ol>

    <p class="mt-3 border-t border-line/60 pt-3 text-xs leading-5 text-ink-500">
      名次按请求进入 Stream 的时间升序，不是落库时间。
    </p>
  </section>
</template>
