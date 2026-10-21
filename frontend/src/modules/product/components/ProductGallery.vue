<script setup lang="ts">
import { ref, watch } from 'vue'
import ProductHeadphoneArt from '@/modules/product/components/ProductHeadphoneArt.vue'
import ProductMedia from '@/modules/product/components/ProductMedia.vue'
import type { ProductVO } from '@/modules/product/types'
import {
  PRODUCT_COLORWAYS,
  type ColorwayId,
  type ProductColorway,
} from '@/modules/product/utils/colorways'

const props = defineProps<{
  product: ProductVO
  colorway: ProductColorway
}>()

const emit = defineEmits<{
  'update:colorway': [ColorwayId]
  'update:usingArt': [boolean]
}>()

const usingArt = ref(!props.product.imageUrl)

watch(
  () => props.product.productId,
  () => {
    usingArt.value = !props.product.imageUrl
  },
)

function onUsingArt(value: boolean): void {
  usingArt.value = value
  emit('update:usingArt', value)
}
</script>

<template>
  <div>
    <div
      class="relative overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-tech-panel"
      data-testid="product-gallery-stage"
    >
      <div class="aspect-[4/3] w-full min-[960px]:aspect-square">
        <ProductMedia
          :src="product.imageUrl"
          :alt="product.name"
          :colorway="colorway"
          fit="contain"
          eager
          hero
          @update:using-art="onUsingArt"
        />
      </div>

      <span class="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-surface/90 px-3 py-1.5 text-[11px] font-semibold text-success shadow-sm backdrop-blur-sm">
        <span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        在售
      </span>
      <span
        v-if="usingArt"
        class="absolute right-4 top-4 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-[10px] font-medium tracking-wide text-ink-500 backdrop-blur-sm"
      >
        商品示意图
      </span>
      <span class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/45 to-transparent" aria-hidden="true" />
    </div>

    <div class="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
      <template v-if="usingArt">
        <button
          v-for="item in PRODUCT_COLORWAYS"
          :key="item.id"
          type="button"
          class="grid h-16 w-16 shrink-0 place-items-center rounded-xl border bg-surface p-1.5 transition-all duration-200"
          :class="
            colorway.id === item.id
              ? 'border-brand shadow-[0_0_0_3px_rgba(29,78,216,0.18)]'
              : 'border-line hover:border-brand/35'
          "
          :aria-label="`切换到${item.label}配色预览`"
          :aria-pressed="colorway.id === item.id"
          @click="emit('update:colorway', item.id)"
        >
          <ProductHeadphoneArt :colorway="item" decorative class="h-full w-full" />
        </button>
      </template>

      <div
        v-else-if="product.imageUrl"
        class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand bg-surface p-1 shadow-[0_0_0_3px_rgba(29,78,216,0.18)]"
        aria-hidden="true"
      >
        <img :src="product.imageUrl" :alt="product.name" class="h-full w-full rounded-lg object-cover" />
      </div>
    </div>

    <p v-if="usingArt" class="mt-2.5 text-xs leading-5 text-ink-500">
      配色仅用于商品示意图预览，不代表实际 SKU、价格或库存。
    </p>
  </div>
</template>
