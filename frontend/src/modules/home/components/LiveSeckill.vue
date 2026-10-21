<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Clock3, Flame } from 'lucide-vue-next'
import type { SpotlightActivity } from '@/modules/home/utils/spotlight'
import { ACTIVITY_STATE_META } from '@/modules/activity/utils/activityPhase'
import { formatPrice } from '@/shared/utils/money'
import { formatCountdown, formatShortDateTime, parseActivityTime } from '@/shared/utils/time'

const props = defineProps<{
  activities: SpotlightActivity[]
  loading: boolean
  failed: boolean
  now: number
}>()

function countdown(item: SpotlightActivity): string {
  const target =
    item.state === 'NOT_STARTED'
      ? parseActivityTime(item.activity.startTime)
      : item.state === 'RUNNING'
        ? parseActivityTime(item.activity.endTime)
        : null
  if (!target) return ''
  return formatCountdown(target.getTime() - props.now)
}

function countdownLabel(item: SpotlightActivity): string {
  if (item.state === 'NOT_STARTED') return '距开抢'
  if (item.state === 'RUNNING') return '距结束'
  return '尚未开放'
}

function progress(item: SpotlightActivity): number {
  const { stock, totalStock } = item.activity
  if (stock === null || totalStock <= 0) return 0
  return Math.min(100, Math.max(0, Math.round(((totalStock - stock) / totalStock) * 100)))
}

function stockText(item: SpotlightActivity): string {
  const { stock, totalStock } = item.activity
  if (stock === null) return '库存待预热'
  return `剩余 ${stock} / ${totalStock} 件`
}

function stateDot(state: SpotlightActivity['state']): string {
  if (state === 'RUNNING') return 'bg-brand'
  if (state === 'NOT_STARTED') return 'bg-ink-300'
  return 'bg-ink-500/60'
}

const gridClass = computed(() => {
  if (props.activities.length === 1) return 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
  if (props.activities.length === 2) return 'mx-auto grid max-w-4xl gap-4 sm:grid-cols-2'
  return 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
})

</script>

<template>
  <section class="relative overflow-hidden bg-[#F6EBE1] text-ink-900" aria-labelledby="seckill-heading">
    <div
      class="pointer-events-none absolute right-0 top-0 h-[34rem] w-[34rem] translate-x-1/3 -translate-y-1/3 rounded-full opacity-60 blur-[120px]"
      style="background: radial-gradient(circle, rgba(184, 84, 58, 0.14), transparent 68%)"
      aria-hidden="true"
    />

    <div class="page-container relative py-20 lg:py-28">
      <div class="reveal flex flex-wrap items-end justify-between gap-6" data-reveal>
        <div class="max-w-2xl">
          <p class="text-[10px] uppercase tracking-[0.34em] text-brand-dark">Live / 02</p>
          <h2 id="seckill-heading" class="mt-4 font-display text-[26px] leading-tight text-ink-900 sm:text-4xl">
            限时秒杀，<span class="italic text-brand">此刻正在发生</span>
          </h2>
          <p class="mt-3 max-w-xl text-sm leading-7 text-ink-500">
            进行中的场次优先展示，其次是即将开始的场次。倒计时、库存与状态均由活动接口驱动，
            售罄或结束的场次不会继续占据首屏。
          </p>
        </div>
        <RouterLink
          :to="{ name: 'activities' }"
          class="group inline-flex min-h-11 items-center gap-2 border-b border-line pb-1 text-sm text-ink-700 transition-colors duration-200 hover:border-brand hover:text-brand-dark"
        >
          全部场次
          <ArrowRight :size="15" class="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </RouterLink>
      </div>

      <div v-if="loading" class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        <div v-for="index in 3" :key="index" class="surface-card rounded-2xl p-6">
          <div class="h-3 w-20 animate-pulse rounded-full bg-ink-900/10" />
          <div class="mt-6 h-6 w-3/4 animate-pulse rounded-lg bg-ink-900/10" />
          <div class="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-ink-900/[0.06]" />
          <div class="mt-8 h-12 w-full animate-pulse rounded-xl bg-ink-900/[0.06]" />
          <div class="mt-6 h-2 w-full animate-pulse rounded-full bg-ink-900/[0.06]" />
        </div>
      </div>

      <div v-else-if="activities.length" class="mt-12" :class="gridClass">
        <article
          v-for="(item, index) in activities"
          :key="item.activity.activityId"
          class="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lift"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="inline-flex items-center gap-2 rounded-full border border-line bg-muted/60 px-3 py-1 text-[11px] text-ink-700">
              <span class="h-1.5 w-1.5 rounded-full" :class="stateDot(item.state)" aria-hidden="true" />
              {{ ACTIVITY_STATE_META[item.state].label }}
            </span>
            <span class="num text-[11px] tracking-[0.2em] text-ink-500">0{{ index + 1 }}</span>
          </div>

          <p class="mt-7 text-xs text-ink-500">{{ item.activity.productName || '关联商品' }}</p>
          <h3 class="mt-1.5 font-display text-[22px] leading-snug text-ink-900">
            {{ item.activity.activityName }}
          </h3>

          <div class="mt-4 flex items-end gap-2">
            <span class="num text-xl leading-none text-price">
              {{ formatPrice(item.activity.seckillPrice) }}
            </span>
            <span
              v-if="item.activity.originalPrice > item.activity.seckillPrice"
              class="num text-xs leading-none text-ink-500 line-through"
            >
              {{ formatPrice(item.activity.originalPrice) }}
            </span>
          </div>

          <div class="mt-6 flex items-center justify-between gap-3 rounded-xl border border-line/80 bg-muted/60 px-4 py-3">
            <span class="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
              <Clock3 :size="13" aria-hidden="true" />
              {{ countdownLabel(item) }}
            </span>
            <span v-if="countdown(item)" class="num text-sm text-ink-900">{{ countdown(item) }}</span>
            <span v-else class="text-[11px] text-ink-500">{{ formatShortDateTime(item.activity.startTime) }}</span>
          </div>

          <div class="mt-5">
            <div class="flex items-center justify-between text-[11px] text-ink-500">
              <span class="num">{{ stockText(item) }}</span>
              <span class="num">{{ progress(item) }}%</span>
            </div>
            <div
              class="mt-2 h-1 w-full overflow-hidden rounded-full bg-line/70"
              role="progressbar"
              :aria-valuenow="progress(item)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${item.activity.activityName} 抢购进度`"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-brand to-atelier-gold transition-all duration-500 ease-out"
                :style="{ width: `${progress(item)}%` }"
              />
            </div>
          </div>

          <RouterLink
            :to="{ name: 'activity-detail', params: { id: item.activity.activityId } }"
            class="mt-auto flex min-h-11 items-center justify-between border-t border-line/80 pt-5 text-sm text-ink-700 transition-colors duration-200 hover:text-brand-dark"
          >
            {{ item.state === 'RUNNING' ? '进入抢购' : '查看场次' }}
            <ArrowRight :size="15" class="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </RouterLink>
        </article>

        <RouterLink
          v-if="activities.length === 1"
          :to="{ name: 'activities' }"
          class="group relative flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-7 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift sm:col-span-1 lg:col-span-2"
        >
          <div
            class="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-70 blur-[60px]"
            style="background: radial-gradient(circle, rgba(184, 84, 58, 0.18), transparent 68%)"
            aria-hidden="true"
          />
          <div class="relative">
            <p class="text-[10px] uppercase tracking-[0.3em] text-brand-dark">More drops</p>
            <h3 class="mt-4 max-w-sm font-display text-[26px] leading-snug text-ink-900">
              把下一场，留给日历
            </h3>
            <p class="mt-3 max-w-md text-sm leading-7 text-ink-500">
              活动大厅保留进行中、未开始与已结束的场次，时间窗、库存与状态都可以追溯。
            </p>
          </div>
          <span class="relative mt-8 inline-flex min-h-11 items-center gap-2 text-sm text-brand-dark">
            浏览全部场次
            <ArrowRight :size="16" class="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </RouterLink>
      </div>

      <div v-else class="mt-12 rounded-2xl border border-line bg-surface px-8 py-14 text-center shadow-card sm:px-14">
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-full border border-line bg-brand-soft text-brand">
          <Flame :size="20" :stroke-width="1.6" aria-hidden="true" />
        </span>
        <p class="mt-6 font-display text-2xl text-ink-900">
          {{ failed ? '活动服务暂时不可用' : '下一场，正在筹备' }}
        </p>
        <p class="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
          {{
            failed
              ? '活动接口未返回数据，首屏其余内容不受影响。可以稍后重试，或直接前往活动大厅。'
              : '当前没有进行中或即将开始的场次。活动大厅会展示已排期的时间窗，开始前可先浏览在售商品。'
          }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <RouterLink :to="{ name: 'activities' }" class="luxury-cta">前往活动大厅</RouterLink>
          <RouterLink :to="{ name: 'products' }" class="luxury-ghost">浏览商品</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
