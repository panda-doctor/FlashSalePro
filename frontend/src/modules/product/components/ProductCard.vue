<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import ProductMedia from '@/modules/product/components/ProductMedia.vue'
import type { ProductVO } from '@/modules/product/types'
import { PRODUCT_COLORWAYS } from '@/modules/product/utils/colorways'
import { resolveStockState } from '@/modules/product/utils/presentation'
import { formatPrice } from '@/shared/utils/money'

const props = defineProps<{ product: ProductVO }>()

const usingArt = ref(!props.product.imageUrl)
const colorway = computed(() => PRODUCT_COLORWAYS[Math.abs(props.product.productId) % PRODUCT_COLORWAYS.length])
const stock = computed(() => resolveStockState(props.product.availableStock))

watch(
  () => props.product.imageUrl,
  (value) => {
    usingArt.value = !value
  },
)

const stockClass = computed(() => {
  if (stock.value.tone === 'out') return 'border-danger/30 bg-danger/10 text-danger'
  if (stock.value.tone === 'low') return 'border-warning/35 bg-warning/10 text-warning'
  return 'border-success/30 bg-success/10 text-success'
})
</script>

<template>
  <RouterLink
    :to="{ name: 'product-detail', params: { id: product.productId } }"
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 hover:border-brand/25 hover:shadow-lift"
    :aria-label="`查看商品 ${product.name}`"
  >
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <ProductMedia
        :src="product.imageUrl"
        :alt="product.name"
        :colorway="colorway"
        fit="cover"
        class="transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
        @update:using-art="usingArt = $event"
      />
      <span
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent"
        aria-hidden="true"
      />
      <span
        class="absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide shadow-sm backdrop-blur-sm"
        :class="stockClass"
      >
        {{ stock.label }}
      </span>
      <span
        v-if="usingArt"
        class="absolute right-3 top-3 rounded-full border border-line bg-surface/90 px-2.5 py-1 text-[10px] font-medium tracking-wide text-ink-500 backdrop-blur-sm"
      >
        示意图
      </span>
    </div>

    <div class="flex flex-1 flex-col p-4 sm:p-5">
      <p class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
        <span class="h-1 w-1 rounded-full bg-brand" aria-hidden="true" />
        Selected goods
      </p>
      <h3 class="mt-1.5 truncate text-[15px] font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-brand-dark">
        {{ product.name }}
      </h3>
      <p v-if="product.description" class="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">
        {{ product.description }}
      </p>

      <div class="mt-auto flex items-end justify-between gap-3 border-t border-line/80 pt-4">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">售价</p>
          <p class="num mt-1 text-[22px] font-semibold leading-none text-price">
            {{ formatPrice(product.originalPrice) }}
          </p>
        </div>
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink-500 transition-all duration-200 group-hover:border-brand group-hover:bg-brand group-hover:text-white">
          <ArrowUpRight :size="16" aria-hidden="true" />
        </span>
      </div>
    </div>
  </RouterLink>
</template>
