<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import ProductImage from '@/components/product/ProductImage.vue'
import type { ProductVO } from '@/types/product'
import { formatPrice } from '@/utils/money'

defineProps<{ product: ProductVO }>()
</script>

<template>
  <RouterLink
    :to="{ name: 'product-detail', params: { id: product.productId } }"
    class="group surface-card surface-card-hover block overflow-hidden"
    :aria-label="`查看商品 ${product.name}`"
  >
    <div class="aspect-square w-full overflow-hidden">
      <ProductImage
        :src="product.imageUrl"
        :alt="product.name"
        class="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      />
    </div>

    <div class="p-4">
      <h3 class="truncate text-[15px] font-medium text-ink-900 transition-colors group-hover:text-brand">
        {{ product.name }}
      </h3>
      <p v-if="product.description" class="mt-1 truncate text-xs text-ink-500">
        {{ product.description }}
      </p>

      <div class="mt-3 flex items-end justify-between gap-2">
        <div>
          <p class="text-xs text-ink-500">售价</p>
          <p class="num text-lg font-semibold leading-tight text-price">{{ formatPrice(product.originalPrice) }}</p>
        </div>
        <div class="flex items-center gap-1 text-xs text-ink-500">
          <span class="num">库存 {{ product.availableStock }}</span>
          <ArrowRight
            :size="13"
            class="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </RouterLink>
</template>
