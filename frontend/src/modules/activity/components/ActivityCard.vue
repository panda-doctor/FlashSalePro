<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import CountdownText from '@/modules/activity/components/CountdownText.vue'
import StockProgress from '@/modules/activity/components/StockProgress.vue'
import type { ActivityItemVO } from '@/modules/activity/types'
import { ACTIVITY_STATE_META, resolveActivityState } from '@/modules/activity/utils/activityPhase'
import { discountRate, formatPrice } from '@/shared/utils/money'

const props = defineProps<{ activity: ActivityItemVO; now: number }>()

const router = useRouter()

const state = computed(() =>
  resolveActivityState({
    startTime: props.activity.startTime,
    endTime: props.activity.endTime,
    status: props.activity.status,
    stock: props.activity.stock,
    preheated: props.activity.preheated,
    now: props.now,
  }),
)

const meta = computed(() => ACTIVITY_STATE_META[state.value])
const saving = computed(() => discountRate(props.activity.originalPrice, props.activity.seckillPrice))
const cta = computed(() => (state.value === 'RUNNING' ? '立即抢购' : '查看详情'))

const stateClass: Record<string, string> = {
  RUNNING: 'border-brand bg-brand text-[#FFFBF5]',
  NOT_STARTED: 'border-warning/25 bg-warning/10 text-warning',
  NOT_PREHEATED: 'border-warning/25 bg-warning/10 text-warning',
  SOLD_OUT: 'border-danger/25 bg-danger/10 text-danger',
  ENDED: 'border-line bg-surface/90 text-ink-700',
  CANCELLED: 'border-danger/25 bg-danger/10 text-danger',
}

function open(): void {
  router.push({ name: 'activity-detail', params: { id: props.activity.activityId } })
}
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
  >
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-atelier-sand/40">
      <ProductImage
        :src="activity.productImage"
        :alt="activity.productName || activity.activityName"
        class="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900/15 to-transparent" aria-hidden="true" />
      <span
        class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide backdrop-blur-sm"
        :class="stateClass[state]"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ meta.label }}
      </span>
      <span
        v-if="saving !== null"
        class="num absolute right-3 top-3 rounded-full border border-line/80 bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-price shadow-sm backdrop-blur-sm"
      >
        省 {{ 100 - saving }}%
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <p class="truncate text-[11px] uppercase tracking-[0.16em] text-ink-500">
        {{ activity.productName || '商品信息缺失' }}
      </p>
      <h3 class="mt-1.5 truncate text-[19px] font-bold leading-snug text-ink-900">
        {{ activity.activityName }}
      </h3>

      <div class="mt-4 flex items-end gap-2">
        <span class="num text-[22px] font-semibold leading-none text-price">
          {{ formatPrice(activity.seckillPrice) }}
        </span>
        <span
          v-if="activity.originalPrice > activity.seckillPrice"
          class="num pb-0.5 text-xs leading-none text-ink-500 line-through"
        >
          {{ formatPrice(activity.originalPrice) }}
        </span>
      </div>

      <div class="mt-4">
        <StockProgress :total="activity.totalStock" :remaining="activity.stock" />
      </div>

      <div class="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-4">
        <CountdownText
          :start-time="activity.startTime"
          :end-time="activity.endTime"
          :now="now"
          :state="state"
        />
        <el-button
          round
          size="small"
          :type="state === 'RUNNING' ? 'primary' : 'default'"
          @click="open"
        >
          {{ cta }}
        </el-button>
      </div>
    </div>
  </article>
</template>
