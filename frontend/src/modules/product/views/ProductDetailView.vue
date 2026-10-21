<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, ArrowUpRight, Database, PackageX, ReceiptText, ShieldCheck } from 'lucide-vue-next'
import ColorSwatches from '@/modules/product/components/ColorSwatches.vue'
import ProductCard from '@/modules/product/components/ProductCard.vue'
import ProductGallery from '@/modules/product/components/ProductGallery.vue'
import ProductTabs from '@/modules/product/components/ProductTabs.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import { getProduct } from '@/modules/product/api'
import { useRelatedProducts } from '@/modules/product/composables/useRelatedProducts'
import { ApiError, RESULT_CODE } from '@/shared/types/common'
import type { ProductVO } from '@/modules/product/types'
import {
  DEFAULT_COLORWAY,
  findColorway,
  type ColorwayId,
} from '@/modules/product/utils/colorways'
import { resolveStockState, stockRatio } from '@/modules/product/utils/presentation'
import { formatPrice } from '@/shared/utils/money'

const route = useRoute()
const router = useRouter()

const product = ref<ProductVO | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const notFound = ref(false)
const selectedColorwayId = ref<ColorwayId>(DEFAULT_COLORWAY.id)
const usingArt = ref(true)

const productId = computed(() => String(route.params.id ?? ''))
const currentProductId = computed(() => product.value?.productId ?? null)
const selectedColorway = computed(() => findColorway(selectedColorwayId.value))
const stock = computed(() => resolveStockState(product.value?.availableStock ?? 0))
const ratio = computed(() => stockRatio(product.value?.availableStock ?? 0, product.value?.totalStock ?? 0))
const hasActivities = computed(() => router.hasRoute('activities'))

const { items: related, loading: relatedLoading } = useRelatedProducts(currentProductId)

function load(): void {
  loading.value = true
  errorMessage.value = ''
  notFound.value = false

  getProduct(productId.value)
    .then((data) => {
      product.value = data
      selectedColorwayId.value = DEFAULT_COLORWAY.id
      usingArt.value = !data.imageUrl
    })
    .catch((error: unknown) => {
      product.value = null
      if (error instanceof ApiError && error.code === RESULT_CODE.NOT_FOUND) {
        notFound.value = true
        return
      }
      errorMessage.value = error instanceof ApiError ? error.message : '加载失败，请稍后重试'
    })
    .finally(() => {
      loading.value = false
    })
}

watch(productId, load, { immediate: true })

/** 真实图加载失败回退到示意图时，回到默认配色，避免沿用上一次预览 */
watch(usingArt, (value) => {
  if (value) selectedColorwayId.value = DEFAULT_COLORWAY.id
})

const stockToneClass = computed(() => {
  if (stock.value.tone === 'out') return 'border-danger/30 bg-danger/10 text-danger'
  if (stock.value.tone === 'low') return 'border-warning/35 bg-warning/10 text-warning'
  return 'border-success/30 bg-success/10 text-success'
})
</script>

<template>
  <div class="product-page min-h-[70vh] pb-16">
    <div class="page-container py-8 sm:py-10">
      <nav class="flex items-center gap-2 text-xs text-ink-500" aria-label="面包屑">
        <RouterLink :to="{ name: 'products' }" class="transition-colors hover:text-brand-dark">商品货架</RouterLink>
        <span aria-hidden="true" class="text-line">/</span>
        <span class="text-ink-900">商品详情</span>
        <span class="ml-auto hidden items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink-500 sm:inline-flex">
          <span class="h-1 w-1 animate-pulse rounded-full bg-brand motion-reduce:animate-none" aria-hidden="true" />
          Live catalog
        </span>
      </nav>

      <div v-if="loading" class="mt-6 grid gap-8 min-[960px]:grid-cols-[1.06fr_0.94fr]">
        <div class="product-stage aspect-[4/3] animate-pulse rounded-3xl border border-line/80 min-[960px]:aspect-square" />
        <div class="space-y-4 pt-2">
          <div class="h-3 w-24 animate-pulse rounded-full bg-muted" />
          <div class="h-11 w-4/5 animate-pulse rounded-2xl bg-line/70" />
          <div class="h-4 w-3/5 animate-pulse rounded-full bg-muted" />
          <div class="h-36 animate-pulse rounded-2xl bg-brand-soft/60" />
          <div class="h-12 w-2/3 animate-pulse rounded-full bg-line/70" />
        </div>
      </div>

      <EmptyState
        v-else-if="notFound"
        title="商品不存在或已下架"
        description="该商品可能已被下架。公开接口只返回上架商品。"
        :icon="PackageX"
        action-text="返回商品列表"
        @action="router.push({ name: 'products' })"
      />

      <EmptyState
        v-else-if="errorMessage"
        title="商品加载失败"
        :description="errorMessage"
        action-text="重新加载"
        @action="load"
      />

      <article v-else-if="product" class="mt-6">
        <div class="grid gap-8 min-[960px]:grid-cols-[1.06fr_0.94fr] min-[960px]:gap-12">
          <ProductGallery
            :product="product"
            :colorway="selectedColorway"
            @update:colorway="selectedColorwayId = $event"
            @update:using-art="usingArt = $event"
          />

          <div class="min-w-0">
            <p class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-dark">
              <span class="h-px w-6 bg-brand/50" aria-hidden="true" />
              Product / {{ product.productId }}
            </p>
            <h1 class="page-title mt-3">
              {{ product.name }}
            </h1>
            <p v-if="product.description" class="page-intro mt-3">
              {{ product.description }}
            </p>

            <div class="mt-4 flex flex-wrap items-center gap-2.5">
              <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold" :class="stockToneClass">
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ stock.label }}
              </span>
              <span class="text-xs text-ink-500">价格与库存来自公开商品接口</span>
            </div>

            <div class="product-price-card mt-6 rounded-2xl p-5 sm:p-6">
              <div class="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-dark">商品售价</p>
                  <p class="num mt-2 text-[40px] font-semibold leading-none tracking-[-0.03em] text-price sm:text-[46px]">
                    {{ formatPrice(product.originalPrice) }}
                  </p>
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-surface/80 px-3 py-1.5 text-[11px] font-medium text-brand-dark">
                  <span class="h-1 w-1 rounded-full bg-brand" aria-hidden="true" />
                  接口实时价
                </span>
              </div>
              <p class="mt-3 text-xs leading-5 text-ink-500">
                秒杀价、秒杀库存与时间窗以具体活动页为准；普通售价来自商品接口。
              </p>
            </div>

            <div v-if="usingArt" class="mt-6">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold tracking-wide text-ink-700">配色示意</p>
                <span class="text-xs text-ink-500">{{ selectedColorway.label }}</span>
              </div>
              <ColorSwatches v-model="selectedColorwayId" class="mt-2.5" />
              <p class="mt-2 text-xs leading-5 text-ink-500">
                仅用于商品示意图配色预览，不代表实际 SKU、价格或库存。
              </p>
            </div>

            <div class="mt-6 rounded-2xl border border-line/80 bg-surface p-4 shadow-card">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="font-medium text-ink-900">普通库存</span>
                <span class="num text-ink-500">{{ product.availableStock }} / {{ product.totalStock }}</span>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-[linear-gradient(90deg,#c95b3f,#d9a15e)] transition-[width] duration-500" :style="{ width: `${ratio}%` }" />
              </div>
              <p class="mt-2.5 text-xs leading-5 text-ink-500">
                普通可用库存占总库存的 {{ ratio }}%，秒杀库存以活动预热后的 Redis 值为准，两者不能相互换算。
              </p>
            </div>

            <div class="mt-7 flex flex-col gap-3 min-[600px]:flex-row">
              <RouterLink v-if="hasActivities" :to="{ name: 'activities' }" class="product-cta w-full min-[600px]:w-auto">
                查看秒杀活动
                <ArrowRight :size="16" aria-hidden="true" />
              </RouterLink>
              <RouterLink :to="{ name: 'products' }" class="product-ghost w-full min-[600px]:w-auto">
                浏览更多商品
                <ArrowUpRight :size="15" aria-hidden="true" />
              </RouterLink>
            </div>

            <ul class="mt-6 grid gap-2.5 text-xs leading-5 text-ink-500 sm:grid-cols-3">
              <li class="flex items-center gap-2">
                <Database :size="14" class="shrink-0 text-brand-dark" aria-hidden="true" />
                接口实时价格
              </li>
              <li class="flex items-center gap-2">
                <ShieldCheck :size="14" class="shrink-0 text-warning" aria-hidden="true" />
                普通库存口径
              </li>
              <li class="flex items-center gap-2">
                <ReceiptText :size="14" class="shrink-0 text-brand-dark" aria-hidden="true" />
                订单结果可追踪
              </li>
            </ul>
          </div>
        </div>

        <ProductTabs
          :description="product.description"
          :total-stock="product.totalStock"
          :available-stock="product.availableStock"
        />

        <section v-if="relatedLoading || related.length" class="mt-12 border-t border-line/70 pt-8" aria-labelledby="related-heading">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="eyebrow">More to explore</p>
              <h2 id="related-heading" class="mt-2 font-display text-[26px] font-medium tracking-tight text-ink-900">
                更多精选
              </h2>
            </div>
            <RouterLink :to="{ name: 'products' }" class="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-dark transition-colors hover:text-ink-900">
              查看全部商品
              <ArrowUpRight :size="15" aria-hidden="true" />
            </RouterLink>
          </div>

          <div v-if="relatedLoading" class="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="index in 4" :key="index" class="surface-card overflow-hidden">
              <div class="product-stage aspect-[4/3] animate-pulse" />
              <div class="space-y-3 p-5">
                <div class="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
                <div class="h-6 w-1/3 animate-pulse rounded-full bg-brand-soft" />
              </div>
            </div>
          </div>
          <div v-else class="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <ProductCard v-for="item in related" :key="item.productId" :product="item" />
          </div>
        </section>
      </article>
    </div>
  </div>
</template>
