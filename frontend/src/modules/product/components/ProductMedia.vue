<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProductHeadphoneArt from '@/modules/product/components/ProductHeadphoneArt.vue'
import type { ProductColorway } from '@/modules/product/utils/colorways'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    colorway: ProductColorway
    eager?: boolean
    fit?: 'cover' | 'contain'
    hero?: boolean
  }>(),
  { src: null, eager: false, fit: 'contain', hero: false },
)

const emit = defineEmits<{ 'update:usingArt': [boolean] }>()

const failed = ref(false)
const degraded = ref(false)
const showImage = computed(() => Boolean(props.src) && !failed.value && !degraded.value)

watch(showImage, (value) => emit('update:usingArt', !value), { immediate: true })

watch(
  () => props.src,
  () => {
    failed.value = false
    degraded.value = false
  },
)

/** 后端存在 1×1 退化图片，按无图处理，避免整块纯色 */
function onLoad(event: Event): void {
  const image = event.target as HTMLImageElement
  if (image.naturalWidth < 8 || image.naturalHeight < 8) degraded.value = true
}

const imageClass = computed(() =>
  props.fit === 'cover'
    ? 'h-full w-full object-cover'
    : 'h-full w-full object-contain p-6 sm:p-8',
)
</script>

<template>
  <div
    class="product-stage relative h-full w-full overflow-hidden"
    :class="{ 'product-stage--hero': hero }"
  >
    <img
      v-if="showImage"
      :src="src ?? undefined"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="transition-transform duration-500 ease-out"
      :class="imageClass"
      @load="onLoad"
      @error="failed = true"
    />
    <div v-else class="flex h-full w-full items-center justify-center p-5 sm:p-8">
      <ProductHeadphoneArt
        :colorway="colorway"
        class="max-h-[92%] max-w-[92%] drop-shadow-[0_20px_26px_rgba(74,43,24,0.16)]"
      />
    </div>
  </div>
</template>
