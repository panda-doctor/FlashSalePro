<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowUpRight, Bot, ReceiptText, ShoppingBag, Zap } from 'lucide-vue-next'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import type { FeaturedProduct } from '@/modules/home/utils/featured'
import { formatPrice } from '@/shared/utils/money'

defineProps<{
  products: FeaturedProduct[]
  loading: boolean
  failed: boolean
}>()

const curation = [
  {
    name: 'daily-shelf',
    title: '日常货架',
    note: '在售商品按上架时间陈列，价格与普通库存实时同步。',
    action: '浏览商品',
    route: 'products',
    icon: ShoppingBag,
  },
  {
    name: 'timed-floor',
    title: '限时专场',
    note: '活动大厅汇聚进行中与即将开始的场次，时间窗即准入条件。',
    action: '查看活动',
    route: 'activities',
    icon: Zap,
  },
  {
    name: 'order-trail',
    title: '抢购履历',
    note: '订单按活动归档，支付与状态变化都可以重新回看。',
    action: '我的订单',
    route: 'orders',
    icon: ReceiptText,
  },
  {
    name: 'concierge',
    title: '顾问问答',
    note: 'AI 客服基于商品与活动上下文回答，不替代真实库存判断。',
    action: '咨询客服',
    route: 'ai-support',
    icon: Bot,
  },
]

function cardClass(index: number): string {
  if (index === 0) {
    return 'min-h-[22rem] sm:min-h-[18rem] lg:col-span-2 lg:row-span-2 lg:min-h-[31rem]'
  }
  return index === 1
    ? 'min-h-[15rem] sm:min-h-[18rem] lg:col-span-2 lg:min-h-[15rem]'
    : 'min-h-[15rem] sm:min-h-[18rem]'
}
</script>

<template>
  <section class="bg-transparent" aria-labelledby="curated-heading">
    <div class="page-container py-20 lg:py-28">
      <div class="reveal flex flex-wrap items-end justify-between gap-6" data-reveal>
        <div class="max-w-2xl">
          <p class="text-[10px] uppercase tracking-[0.34em] text-brand-dark">Curated / 01</p>
          <h2 id="curated-heading" class="mt-4 font-display text-[26px] leading-tight text-ink-900 sm:text-4xl">
            高端甄选，<span class="italic text-brand">真实在售</span>
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-500">
            首页取自在售商品的前四件，图片、价格与可用库存均未做二次加工。
            当接口不可用或货架为空时，这里交给不含虚构信息的分区导览。
          </p>
        </div>
        <RouterLink
          :to="{ name: 'products' }"
          class="group inline-flex min-h-11 items-center gap-2 border-b border-line pb-1 text-sm text-ink-700 transition-colors duration-200 hover:border-brand hover:text-brand-dark"
        >
          查看全部商品
          <ArrowUpRight :size="15" class="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </RouterLink>
      </div>

      <div v-if="loading" class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2" aria-hidden="true">
        <div v-for="index in 4" :key="index" class="overflow-hidden rounded-2xl bg-atelier-sand/60" :class="cardClass(index - 1)">
          <div class="flex h-full flex-col justify-end gap-3 p-6">
            <div class="h-3 w-24 animate-pulse rounded-full bg-ink-900/10" />
            <div class="h-5 w-2/3 animate-pulse rounded-lg bg-ink-900/10" />
          </div>
        </div>
      </div>

      <div
        v-else-if="!products.length"
        class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2"
      >
        <RouterLink
          v-for="(item, index) in curation"
          :key="item.name"
          :to="{ name: item.route }"
          class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface/70 p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand/35 hover:bg-surface"
          :class="cardClass(index)"
        >
          <span class="grid h-11 w-11 place-items-center rounded-full border border-line bg-brand-soft/60 text-brand">
            <component :is="item.icon" :size="19" :stroke-width="1.6" aria-hidden="true" />
          </span>
          <span class="mt-10 block">
            <span class="block font-display text-2xl text-atelier-ink">{{ item.title }}</span>
            <span class="mt-3 block max-w-sm text-sm leading-7 text-ink-500">{{ item.note }}</span>
            <span class="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-dark">
              {{ item.action }}
              <ArrowUpRight :size="14" aria-hidden="true" />
            </span>
          </span>
        </RouterLink>
      </div>

      <div v-else class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <RouterLink
          v-for="(product, index) in products"
          :key="product.id"
          :to="{ name: 'product-detail', params: { id: product.id } }"
          class="group relative isolate overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift focus-visible:-translate-y-1"
          :class="cardClass(index)"
          :aria-label="`查看商品 ${product.name}`"
        >
          <div class="absolute inset-0 overflow-hidden">
            <ProductImage
              :src="product.imageUrl"
              :alt="product.name"
              :eager="index === 0"
              class="h-full w-full !bg-transparent transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </div>

          <div class="glass-panel glass-sheen absolute inset-x-3 bottom-3 rounded-xl bg-surface/92 px-4 py-3.5">
            <div class="flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm text-atelier-ink">{{ product.name }}</p>
                <p class="mt-1 text-[11px] tracking-wide text-ink-500">{{ product.stockLabel }}</p>
              </div>
              <span class="num shrink-0 text-[15px] text-atelier-ink">{{ formatPrice(product.price) }}</span>
            </div>
          </div>

          <span
            v-if="index === 0"
            class="absolute left-4 top-4 rounded-full border border-white/40 bg-brand px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#FFFBF5] shadow-sm"
          >
            Selected
          </span>
        </RouterLink>
      </div>

      <p v-if="!loading && failed" class="mt-5 text-xs leading-5 text-ink-500">
        商品服务暂时不可用，已切换为分区导览；不影响活动与账户入口。
      </p>
    </div>
  </section>
</template>
