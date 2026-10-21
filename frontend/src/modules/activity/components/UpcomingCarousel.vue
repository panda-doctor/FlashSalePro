<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-vue-next'
import CountdownText from '@/modules/activity/components/CountdownText.vue'
import ProductMedia from '@/modules/product/components/ProductMedia.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import type { ActivityEntry } from '@/modules/activity/utils/grouping'
import { PRODUCT_COLORWAYS } from '@/modules/product/utils/colorways'
import { formatPrice } from '@/shared/utils/money'
import { formatShortDateTime } from '@/shared/utils/time'

const props = defineProps<{ items: ActivityEntry[]; now: number }>()

const active = ref(0)
const hoverPaused = ref(false)
const userPaused = ref(false)
const reduceMotion = ref(false)

let timer: number | null = null
let media: MediaQueryList | null = null
let touchStartX = 0

const count = computed(() => props.items.length)
const hasMultiple = computed(() => count.value > 1)
const trackStyle = computed(() => ({
  transform: `translateX(-${active.value * 100}%)`,
}))
const counter = computed(() => ({
  current: String(active.value + 1).padStart(2, '0'),
  total: String(count.value).padStart(2, '0'),
}))

function colorwayFor(entry: ActivityEntry) {
  return PRODUCT_COLORWAYS[Math.abs(entry.item.productId) % PRODUCT_COLORWAYS.length]
}

function stop(): void {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}

function canAutoPlay(): boolean {
  return (
    hasMultiple.value && !userPaused.value && !hoverPaused.value && !reduceMotion.value && !document.hidden
  )
}

function start(): void {
  stop()
  if (!canAutoPlay()) return
  timer = window.setInterval(() => {
    active.value = (active.value + 1) % count.value
  }, 5000)
}

function goTo(index: number): void {
  if (!count.value) return
  active.value = (index + count.value) % count.value
  start()
}

function step(direction: 1 | -1): void {
  goTo(active.value + direction)
}

function toggleAutoplay(): void {
  userPaused.value = !userPaused.value
  if (userPaused.value) stop()
  else start()
}

function onPointerEnter(): void {
  hoverPaused.value = true
  stop()
}

function onPointerLeave(): void {
  hoverPaused.value = false
  start()
}

function onVisibilityChange(): void {
  if (document.hidden) stop()
  else start()
}

function onMotionChange(event: MediaQueryListEvent): void {
  reduceMotion.value = event.matches
  start()
}

function onTouchStart(event: TouchEvent): void {
  touchStartX = event.changedTouches[0].clientX
}

function onTouchEnd(event: TouchEvent): void {
  const delta = event.changedTouches[0].clientX - touchStartX
  if (Math.abs(delta) < 48) return
  step(delta > 0 ? -1 : 1)
}

onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduceMotion.value = media.matches
  media.addEventListener('change', onMotionChange)
  document.addEventListener('visibilitychange', onVisibilityChange)
  start()
})

onBeforeUnmount(() => {
  stop()
  media?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

// 只跟随数量变化夹取下标，避免倒计时每秒重算数组时重启定时器
watch(
  () => props.items.length,
  (length) => {
    if (!length) active.value = 0
    else if (active.value >= length) active.value = 0
    start()
  },
)
</script>

<template>
  <section
    id="upcoming-section"
    class="section-anchor overflow-hidden rounded-3xl border border-brand/15 bg-gradient-to-b from-brand-soft/70 via-surface to-surface p-5 sm:p-7"
    aria-labelledby="upcoming-heading"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @focusin="onPointerEnter"
    @focusout="onPointerLeave"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-3.5">
        <span class="num grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand-soft text-[12px] font-semibold text-brand-dark">
          01
        </span>
        <div class="min-w-0">
          <h2 id="upcoming-heading" class="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink-900">
            即将开场
            <span class="num rounded-full border border-brand/20 bg-surface px-2 py-0.5 text-[11px] font-medium text-brand-dark">
              {{ count }} 场
            </span>
          </h2>
          <p class="mt-1 max-w-xl text-xs leading-5 text-ink-500">
            未开始的场次按开场时间排队，倒计时结束即进入抢购。自动轮播每 5 秒切换，可随时暂停。
          </p>
        </div>
      </div>

      <button
        v-if="hasMultiple && !reduceMotion"
        type="button"
        class="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs text-ink-700 transition-colors hover:border-brand/40 hover:text-brand-dark"
        :aria-pressed="userPaused"
        @click="toggleAutoplay"
      >
        <component :is="userPaused ? Play : Pause" :size="13" aria-hidden="true" />
        {{ userPaused ? '开始轮播' : '暂停轮播' }}
      </button>
    </div>

    <EmptyState
      v-if="!count"
      compact
      title="暂无即将开场的场次"
      description="新活动创建并预热后会出现在这里，先去进行中或已结束区块看看。"
      class="!py-6"
    />

    <div v-else class="mt-5 overflow-hidden rounded-2xl border border-line/80 bg-surface">
      <div
        class="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        :style="trackStyle"
        role="region"
        aria-roledescription="carousel"
        aria-label="即将开场的秒杀活动"
        aria-live="off"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <article
          v-for="(entry, index) in items"
          :key="entry.item.activityId"
          class="w-full shrink-0"
          :aria-hidden="index !== active ? 'true' : undefined"
          :inert="index !== active"
        >
          <div class="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div class="order-2 flex flex-col justify-center gap-4 p-5 sm:p-7 lg:order-1 lg:p-8">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-dark">
                  <span class="h-1 w-1 rounded-full bg-brand" aria-hidden="true" />
                  未开始
                </span>
                <span class="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
                  <CalendarClock :size="12" aria-hidden="true" />
                  {{ formatShortDateTime(entry.item.startTime) }} 开场
                </span>
              </div>

              <div class="min-w-0">
                <p class="truncate text-[11px] uppercase tracking-[0.18em] text-ink-500">
                  {{ entry.item.productName || '商品信息待同步' }}
                </p>
                <h3 class="mt-1.5 text-xl font-bold leading-snug tracking-tight text-ink-900 sm:text-2xl">
                  {{ entry.item.activityName }}
                </h3>
              </div>

              <div class="flex flex-wrap items-end gap-x-4 gap-y-2">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">秒杀价</p>
                  <p class="num mt-1 text-[26px] font-semibold leading-none text-price">
                    {{ formatPrice(entry.item.seckillPrice) }}
                  </p>
                </div>
                <p
                  v-if="entry.item.originalPrice > entry.item.seckillPrice"
                  class="num pb-1 text-xs text-ink-500 line-through"
                >
                  {{ formatPrice(entry.item.originalPrice) }}
                </p>
                <CountdownText
                  class="ml-auto"
                  :start-time="entry.item.startTime"
                  :end-time="entry.item.endTime"
                  :now="now"
                  :state="entry.state"
                />
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <RouterLink
                  :to="{ name: 'activity-detail', params: { id: entry.item.activityId } }"
                  :aria-label="`查看即将开场活动 ${entry.item.activityName}`"
                  class="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-white shadow-[0_10px_22px_rgba(29,78,216,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_14px_30px_rgba(29,78,216,0.3)]"
                >
                  查看详情
                  <ArrowRight :size="15" aria-hidden="true" />
                </RouterLink>
                <span class="text-[11px] text-ink-500">
                  备货 {{ entry.item.stock }} 件 · 每人限 {{ entry.item.limitPerUser }} 件
                </span>
              </div>
            </div>

            <div class="relative order-1 min-h-[200px] overflow-hidden bg-muted lg:order-2 lg:min-h-[300px]">
              <ProductMedia
                :src="entry.item.productImage"
                :alt="entry.item.productName || entry.item.activityName"
                :colorway="colorwayFor(entry)"
                fit="cover"
                class="h-full w-full"
              />
              <span
                class="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-surface to-transparent lg:block"
                aria-hidden="true"
              />

              <template v-if="hasMultiple">
                <button
                  type="button"
                  class="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/85 text-ink-700 shadow-card backdrop-blur transition-colors hover:bg-white hover:text-brand-dark"
                  aria-label="上一场即将开场活动"
                  @click="step(-1)"
                >
                  <ChevronLeft :size="18" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/85 text-ink-700 shadow-card backdrop-blur transition-colors hover:bg-white hover:text-brand-dark"
                  aria-label="下一场即将开场活动"
                  @click="step(1)"
                >
                  <ChevronRight :size="18" aria-hidden="true" />
                </button>
              </template>
            </div>
          </div>
        </article>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-line/70 px-4 py-2 sm:px-6">
        <div v-if="hasMultiple && count <= 8" class="flex items-center gap-0.5">
          <button
            v-for="(entry, index) in items"
            :key="entry.item.activityId"
            type="button"
            class="group grid h-11 w-6 place-items-center"
            :aria-label="`跳转到第 ${index + 1} 个即将开场活动`"
            :aria-current="index === active ? 'true' : undefined"
            @click="goTo(index)"
          >
            <span
              class="h-1.5 rounded-full transition-all duration-200"
              :class="index === active ? 'w-5 bg-brand' : 'w-1.5 bg-ink-300/60 group-hover:bg-brand/50'"
            />
          </button>
        </div>
        <p v-else class="text-[11px] text-ink-500">共 {{ count }} 场即将开场</p>

        <p class="num text-[11px] tracking-[0.18em] text-ink-500">
          {{ counter.current }} / {{ counter.total }}
        </p>
      </div>
    </div>
  </section>
</template>
