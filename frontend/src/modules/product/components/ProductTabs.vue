<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowUpRight, Boxes, FileText, Zap } from 'lucide-vue-next'
import { resolveStockState, stockRatio } from '@/modules/product/utils/presentation'

const props = defineProps<{
  description: string | null
  totalStock: number
  availableStock: number
}>()

type TabKey = 'description' | 'stock' | 'seckill'

const router = useRouter()
const active = ref<TabKey>('description')
const tablist = ref<HTMLElement | null>(null)

const tabs: Array<{ key: TabKey; label: string; icon: typeof FileText }> = [
  { key: 'description', label: '商品描述', icon: FileText },
  { key: 'stock', label: '库存说明', icon: Boxes },
  { key: 'seckill', label: '秒杀说明', icon: Zap },
]

const stock = computed(() => resolveStockState(props.availableStock))
const ratio = computed(() => stockRatio(props.availableStock, props.totalStock))
const hasActivities = computed(() => router.hasRoute('activities'))

function selectTab(key: TabKey): void {
  active.value = key
}

function onKeydown(event: KeyboardEvent, index: number): void {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return

  event.preventDefault()
  let next = index
  if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
  if (event.key === 'Home') next = 0
  if (event.key === 'End') next = tabs.length - 1

  active.value = tabs[next].key
  void nextTick(() => {
    const buttons = tablist.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons?.[next]?.focus()
  })
}
</script>

<template>
  <section class="mt-12 border-t border-line/80 pt-8">
    <div ref="tablist" class="flex gap-2 overflow-x-auto" role="tablist" aria-label="商品信息">
      <button
        v-for="(tab, index) in tabs"
        :id="`product-tab-${tab.key}`"
        :key="tab.key"
        type="button"
        role="tab"
        class="inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors duration-200 sm:px-4"
        :class="
          active === tab.key
            ? 'border-brand text-ink-900'
            : 'border-transparent text-ink-500 hover:text-brand-dark'
        "
        :aria-selected="active === tab.key"
        :aria-controls="`product-panel-${tab.key}`"
        :tabindex="active === tab.key ? 0 : -1"
        @click="selectTab(tab.key)"
        @keydown="onKeydown($event, index)"
      >
        <component :is="tab.icon" :size="15" aria-hidden="true" />
        {{ tab.label }}
      </button>
    </div>

    <div
      v-if="active === 'description'"
      id="product-panel-description"
      role="tabpanel"
      aria-labelledby="product-tab-description"
      tabindex="0"
      class="animate-fade-up pt-6"
    >
      <p class="max-w-3xl whitespace-pre-line text-[15px] leading-7 text-ink-700">
        {{ description || '商家未填写商品描述。' }}
      </p>
    </div>

    <div
      v-else-if="active === 'stock'"
      id="product-panel-stock"
      role="tabpanel"
      aria-labelledby="product-tab-stock"
      tabindex="0"
      class="animate-fade-up pt-6"
    >
      <dl class="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-line/80 bg-surface p-4">
          <dt class="text-xs text-ink-500">总库存</dt>
          <dd class="num mt-1.5 text-xl font-semibold text-ink-900">{{ totalStock }}</dd>
        </div>
        <div class="rounded-2xl border border-line/80 bg-surface p-4">
          <dt class="text-xs text-ink-500">可用库存</dt>
          <dd class="num mt-1.5 text-xl font-semibold" :class="stock.tone === 'out' ? 'text-danger' : 'text-ink-900'">
            {{ availableStock }}
          </dd>
        </div>
        <div class="col-span-2 rounded-2xl border border-line/80 bg-surface p-4 sm:col-span-1">
          <dt class="text-xs text-ink-500">库存状态</dt>
          <dd class="mt-1.5 text-sm font-medium text-ink-900">{{ stock.label }}</dd>
        </div>
      </dl>
      <div class="mt-5 max-w-2xl">
        <div class="h-2 overflow-hidden rounded-full bg-muted">
          <div class="h-full rounded-full bg-[linear-gradient(90deg,#c95b3f,#d9a15e)] transition-[width] duration-500" :style="{ width: `${ratio}%` }" />
        </div>
        <p class="mt-2 text-xs leading-5 text-ink-500">
          可用库存占总库存的 {{ ratio }}%。该比例仅展示普通库存，秒杀库存以活动预热后的 Redis 值为准。
        </p>
      </div>
    </div>

    <div
      v-else
      id="product-panel-seckill"
      role="tabpanel"
      aria-labelledby="product-tab-seckill"
      tabindex="0"
      class="animate-fade-up pt-6"
    >
      <p class="max-w-3xl text-[15px] leading-7 text-ink-700">
        秒杀库存由活动预热写入 Redis，和本页的普通可用库存是两套口径，不能相互换算。活动商品、价格、时间窗与限购规则以秒杀活动页为准。
      </p>
      <RouterLink
        v-if="hasActivities"
        :to="{ name: 'activities' }"
        class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-dark transition-colors hover:text-ink-900"
      >
        查看进行中的秒杀活动
        <ArrowUpRight :size="15" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>
</template>
