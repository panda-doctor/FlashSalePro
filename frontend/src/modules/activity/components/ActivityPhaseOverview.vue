<script setup lang="ts">
import type { ActivityGroupCounts } from '@/modules/activity/utils/grouping'

defineProps<{ counts: ActivityGroupCounts }>()

const emit = defineEmits<{ jump: [id: string] }>()
</script>

<template>
  <section class="grid grid-cols-3 gap-2.5 sm:gap-3" aria-label="活动阶段概览">
    <button
      type="button"
      class="rounded-2xl border p-3 text-left transition-colors sm:p-4"
      :class="
        counts.LIVE > 0
          ? 'border-transparent bg-gradient-to-br from-flash to-flash-dark text-white shadow-[0_10px_24px_rgba(220,38,38,0.22)]'
          : 'border-flash/20 bg-flash-soft/70'
      "
      @click="emit('jump', 'live-section')"
    >
      <span
        class="flex items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs"
        :class="counts.LIVE > 0 ? 'text-white/90' : 'text-flash-dark'"
      >
        <span class="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
            :class="counts.LIVE > 0 ? 'bg-white' : 'bg-flash'"
          />
          <span
            class="relative inline-flex h-1.5 w-1.5 rounded-full"
            :class="counts.LIVE > 0 ? 'bg-white' : 'bg-flash'"
          />
        </span>
        进行中
      </span>
      <span
        class="num mt-2 block text-xl font-semibold leading-none sm:text-[26px]"
        :class="counts.LIVE > 0 ? '' : 'text-flash-dark'"
      >
        {{ counts.LIVE }}
      </span>
      <span
        class="mt-1.5 block text-[10px] leading-4 sm:text-[11px]"
        :class="counts.LIVE > 0 ? 'text-white/80' : 'text-ink-500'"
      >
        现在可以抢购
      </span>
    </button>

    <button
      type="button"
      class="rounded-2xl border border-brand/20 bg-brand-soft/70 p-3 text-left sm:p-4"
      @click="emit('jump', 'upcoming-section')"
    >
      <span class="flex items-center gap-1.5 text-[11px] text-ink-500 sm:gap-2 sm:text-xs">
        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
        未开始
      </span>
      <span class="num mt-2 block text-xl font-semibold leading-none text-brand-dark sm:text-[26px]">
        {{ counts.UPCOMING }}
      </span>
      <span class="mt-1.5 block text-[10px] leading-4 text-ink-500 sm:text-[11px]">等待时间窗开启</span>
    </button>

    <button
      type="button"
      class="rounded-2xl border border-line/80 bg-muted/80 p-3 text-left sm:p-4"
      @click="emit('jump', 'ended-section')"
    >
      <span class="flex items-center gap-1.5 text-[11px] text-ink-500 sm:gap-2 sm:text-xs">
        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300" aria-hidden="true" />
        已结束
      </span>
      <span class="num mt-2 block text-xl font-semibold leading-none text-ink-700 sm:text-[26px]">
        {{ counts.ENDED }}
      </span>
      <span class="mt-1.5 block text-[10px] leading-4 text-ink-500 sm:text-[11px]">可回看场次详情</span>
    </button>
  </section>
</template>
