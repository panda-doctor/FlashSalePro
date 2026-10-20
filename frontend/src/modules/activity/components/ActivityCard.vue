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

function open(): void {
  router.push({ name: 'activity-detail', params: { id: props.activity.activityId } })
}
</script>

<template>
  <article class="surface-card surface-card-hover flex flex-col overflow-hidden">
    <div class="relative aspect-[4/3] w-full overflow-hidden">
      <ProductImage :src="activity.productImage" :alt="activity.productName || activity.activityName" />
      <span class="absolute left-3 top-3">
        <el-tag :type="meta.tagType" effect="dark" size="small">{{ meta.label }}</el-tag>
      </span>
      <span
        v-if="saving !== null"
        class="num absolute right-3 top-3 rounded-md bg-price px-2 py-0.5 text-xs font-medium text-white"
      >
        省 {{ 100 - saving }}%
      </span>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <p class="truncate text-xs text-ink-500">{{ activity.productName || '商品信息缺失' }}</p>
      <h3 class="mt-1 truncate text-[15px] font-medium text-ink-900">{{ activity.activityName }}</h3>

      <div class="mt-3 flex items-end gap-2">
        <span class="num text-xl font-semibold leading-none text-price">
          {{ formatPrice(activity.seckillPrice) }}
        </span>
        <span
          v-if="activity.originalPrice > activity.seckillPrice"
          class="num text-xs leading-none text-ink-300 line-through"
        >
          {{ formatPrice(activity.originalPrice) }}
        </span>
      </div>

      <div class="mt-3">
        <StockProgress :total="activity.totalStock" :remaining="activity.stock" />
      </div>

      <div class="mt-auto flex items-center justify-between gap-2 pt-3">
        <CountdownText
          :start-time="activity.startTime"
          :end-time="activity.endTime"
          :now="now"
          :state="state"
        />
        <el-button size="small" :type="state === 'RUNNING' ? 'primary' : 'default'" @click="open">
          {{ cta }}
        </el-button>
      </div>
    </div>
  </article>
</template>
