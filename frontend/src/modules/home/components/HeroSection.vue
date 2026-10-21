<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Clock3, Flame, ShieldCheck, Sparkles } from 'lucide-vue-next'
import type { SpotlightActivity } from '@/modules/home/utils/spotlight'
import { ACTIVITY_STATE_META } from '@/modules/activity/utils/activityPhase'
import { formatPrice } from '@/shared/utils/money'
import { formatShortDateTime, parseActivityTime } from '@/shared/utils/time'

const props = defineProps<{
  activity: SpotlightActivity | null
  loading: boolean
  failed: boolean
  now: number
}>()

const meta = computed(() =>
  props.activity ? ACTIVITY_STATE_META[props.activity.state] : null,
)

const remaining = computed(() => {
  if (!props.activity) return null
  const { state, activity } = props.activity
  if (state === 'RUNNING') {
    const end = parseActivityTime(activity.endTime)
    return end ? Math.max(0, end.getTime() - props.now) : null
  }
  if (state === 'NOT_STARTED') {
    const start = parseActivityTime(activity.startTime)
    return start ? Math.max(0, start.getTime() - props.now) : null
  }
  return null
})

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

const units = computed(() => {
  if (remaining.value === null) return []
  const total = Math.floor(remaining.value / 1000)
  const days = Math.floor(total / 86400)
  const cells = [
    { label: '时', value: pad(Math.floor((total % 86400) / 3600)) },
    { label: '分', value: pad(Math.floor((total % 3600) / 60)) },
    { label: '秒', value: pad(total % 60) },
  ]
  return days > 0 ? [{ label: '天', value: String(days) }, ...cells] : cells
})

const countdownLabel = computed(() => {
  if (!props.activity) return ''
  return props.activity.state === 'NOT_STARTED' ? '距开抢' : '距结束'
})

const schedule = computed(() => {
  if (!props.activity) return ''
  const { activity } = props.activity
  return props.activity.state === 'NOT_STARTED'
    ? `${formatShortDateTime(activity.startTime)} 开抢`
    : `${formatShortDateTime(activity.endTime)} 结束`
})

const stockText = computed(() => {
  const activity = props.activity?.activity
  if (!activity) return ''
  if (activity.stock === null) return '库存待预热'
  return `实时剩余 ${activity.stock} 件`
})

const progress = computed(() => {
  const activity = props.activity?.activity
  if (!activity || activity.stock === null || activity.totalStock <= 0) return 0
  const used = activity.totalStock - activity.stock
  return Math.min(100, Math.max(0, Math.round((used / activity.totalStock) * 100)))
})

const trust = [
  { icon: Clock3, label: '限时秒杀', note: '时间窗实时判定' },
  { icon: ShieldCheck, label: '一人一单', note: '唯一键约束' },
  { icon: Flame, label: '实时榜单', note: '抢购结果可追溯' },
]
</script>

<template>
  <section class="relative isolate overflow-hidden bg-transparent text-ink-900 lg:flex lg:min-h-[100svh] lg:items-center">
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        class="ambient-orb absolute -left-[18%] -top-[28%] h-[58vw] w-[58vw] rounded-full blur-[90px]"
        style="background: radial-gradient(circle, rgba(147, 197, 253, 0.32) 0%, rgba(147, 197, 253, 0) 68%)"
      />
      <div
        class="ambient-orb absolute -right-[12%] top-[18%] h-[46vw] w-[46vw] rounded-full blur-[110px]"
        style="background: radial-gradient(circle, rgba(199, 210, 254, 0.3) 0%, rgba(199, 210, 254, 0) 70%)"
      />
      <div
        class="absolute inset-0 opacity-70"
        style="
          background-image: linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
          background-size: 96px 96px;
          mask-image: radial-gradient(ellipse at 46% 0%, black 8%, transparent 70%);
        "
      />
    </div>

    <div
      class="page-container relative grid gap-14 pb-20 pt-32 sm:pt-36 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-44"
    >
      <div class="max-w-2xl">
        <p class="flex items-center gap-3 text-[11px] uppercase tracking-[0.36em] text-brand-dark">
          <Sparkles :size="14" aria-hidden="true" />
          FlashSale Atelier
        </p>

        <ul class="mt-6 flex flex-wrap gap-2">
          <li
            v-for="item in trust"
            :key="item.label"
            class="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[11px] font-medium text-ink-700 shadow-sm backdrop-blur-sm"
          >
            <component :is="item.icon" :size="13" class="text-brand" aria-hidden="true" />
            {{ item.label }}
          </li>
        </ul>

        <h1
          class="mt-7 font-display font-medium leading-[1.08] tracking-[-0.01em] text-ink-900"
          style="font-size: clamp(2.5rem, 5.6vw, 4.5rem)"
        >
          稀缺之物，<br />
          值得一次<br />
          <span class="italic text-brand">郑重的相遇</span>。
        </h1>

        <p class="mt-7 max-w-xl text-[15px] leading-8 text-ink-500 sm:text-base">
          以克制的编辑视角陈列在售商品，以真实的活动时间窗承载每一次抢购。
          价格、库存与场次状态全部来自后端，页面不修饰结果，只把过程呈现得足够清晰。
        </p>

        <div class="mt-10 flex flex-wrap items-center gap-3">
          <RouterLink :to="{ name: 'activities' }" class="luxury-cta">
            进入活动大厅
            <ArrowRight :size="16" aria-hidden="true" />
          </RouterLink>
          <a href="#story" class="luxury-outline">阅读品牌故事</a>
        </div>

        <dl class="mt-14 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
          <div v-for="item in trust" :key="item.label" class="flex items-start gap-3">
            <component :is="item.icon" :size="16" class="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <dt class="text-sm font-medium text-ink-700">{{ item.label }}</dt>
              <dd class="mt-0.5 text-xs leading-5 text-ink-500">{{ item.note }}</dd>
            </div>
          </div>
        </dl>
      </div>

      <div class="relative">
        <div
          class="pointer-events-none absolute -inset-6 rounded-[2rem] border border-brand/15 bg-gradient-to-br from-brand/[0.08] to-transparent"
          aria-hidden="true"
        />
        <div class="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface/95 shadow-glass backdrop-blur-xl">
          <div class="flex items-center justify-between gap-3 border-b border-line/80 bg-muted/50 px-5 py-3 sm:px-7">
            <div class="flex items-center gap-2" aria-hidden="true">
              <span class="h-2 w-2 rounded-full bg-line" />
              <span class="h-2 w-2 rounded-full bg-line" />
              <span class="h-2 w-2 rounded-full bg-line" />
            </div>
            <p class="text-[10px] uppercase tracking-[0.3em] text-ink-500">实时控制台</p>
            <span
              v-if="meta"
              class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
              :class="
                activity?.state === 'RUNNING'
                  ? 'border-flash/25 bg-flash-soft text-flash-dark'
                  : 'border-line bg-surface text-ink-700'
              "
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="activity?.state === 'RUNNING' ? 'animate-pulse bg-flash' : 'bg-ink-300'"
                aria-hidden="true"
              />
              {{ meta.label }}
            </span>
          </div>

          <div class="p-7 sm:p-9">
            <template v-if="loading">
              <div class="space-y-4" aria-hidden="true">
                <div class="h-3 w-24 animate-pulse rounded-full bg-ink-900/10" />
                <div class="h-7 w-4/5 animate-pulse rounded-lg bg-ink-900/[0.12]" />
                <div class="h-14 w-full animate-pulse rounded-xl bg-ink-900/[0.07]" />
                <div class="h-3 w-1/2 animate-pulse rounded-full bg-ink-900/10" />
              </div>
            </template>

            <template v-else-if="activity && meta">
              <p class="text-xs text-ink-500">{{ activity.activity.productName || '关联商品' }}</p>
              <h2 class="mt-2 font-display text-[26px] leading-snug text-ink-900 sm:text-[30px]">
                {{ activity.activity.activityName }}
              </h2>

              <div class="mt-6 flex items-end gap-3">
                <span class="num text-[28px] font-semibold leading-none text-price">
                  {{ formatPrice(activity.activity.seckillPrice) }}
                </span>
                <span
                  v-if="activity.activity.originalPrice > activity.activity.seckillPrice"
                  class="num text-sm leading-none text-ink-500 line-through"
                >
                  {{ formatPrice(activity.activity.originalPrice) }}
                </span>
              </div>

              <div class="mt-7 rounded-2xl border border-line bg-muted/40 px-5 py-4">
                <p class="text-[10px] uppercase tracking-[0.24em] text-ink-500">{{ countdownLabel }}</p>
                <div v-if="units.length" class="num mt-2 flex items-baseline gap-3 text-flash">
                  <span v-for="unit in units" :key="unit.label" class="flex items-baseline gap-1">
                    <span class="text-[30px] font-semibold leading-none tracking-tight">{{ unit.value }}</span>
                    <span class="text-[11px] text-flash/70">{{ unit.label }}</span>
                  </span>
                </div>
                <p v-else class="mt-2 text-sm text-ink-500">等待库存预热后开放</p>
                <div class="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span class="text-xs text-ink-500">{{ schedule }}</span>
                  <span class="num text-xs font-medium text-ink-700">{{ stockText }}</span>
                </div>
              </div>

              <div class="mt-5">
                <div class="flex items-center justify-between text-[11px] text-ink-500">
                  <span>抢购进度</span>
                  <span class="num text-flash">{{ progress }}%</span>
                </div>
                <div
                  class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/70"
                  role="progressbar"
                  :aria-valuenow="progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="`${activity.activity.activityName} 抢购进度`"
                >
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-flash to-flash-dark transition-all duration-500 ease-out"
                    :style="{ width: `${progress}%` }"
                  />
                </div>
              </div>

              <RouterLink
                :to="{ name: 'activity-detail', params: { id: activity.activity.activityId } }"
                class="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-brand/25 bg-brand-soft text-sm font-medium text-brand-dark transition-all duration-200 hover:border-brand/50 hover:bg-brand/10"
              >
                查看本场活动
                <ArrowRight :size="15" aria-hidden="true" />
              </RouterLink>
            </template>

            <template v-else>
              <p class="mt-2 font-display text-2xl leading-snug text-ink-900">
                {{ failed ? '活动信息暂时不可用' : '此刻暂无进行中的场次' }}
              </p>
              <p class="mt-3 text-sm leading-6 text-ink-500">
                {{
                  failed
                    ? '活动接口未返回数据。可以稍后重试，或先浏览在售商品。'
                    : '活动大厅会同步最新的时间窗与库存状态。下一场开始前，可以先浏览在售商品。'
                }}
              </p>
              <div class="mt-8 flex flex-wrap gap-3">
                <RouterLink :to="{ name: 'activities' }" class="luxury-cta">查看活动大厅</RouterLink>
                <RouterLink :to="{ name: 'products' }" class="luxury-outline">浏览商品</RouterLink>
              </div>
            </template>

            <p class="mt-7 border-t border-line pt-4 text-[11px] leading-5 text-ink-500">
              场次状态、倒计时与库存均以活动接口返回为准。
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
