<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ImageOff } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    /** 首屏图片可关闭懒加载 */
    eager?: boolean
  }>(),
  { src: null, eager: false },
)

const failed = ref(false)
const degraded = ref(false)

const showImage = computed(() => Boolean(props.src) && !failed.value && !degraded.value)

watch(
  () => props.src,
  () => {
    failed.value = false
    degraded.value = false
  },
)

/** 后端存在 1×1 退化图片，直接拉伸会变成整块纯色，按无图处理 */
function onLoad(event: Event): void {
  const image = event.target as HTMLImageElement
  if (image.naturalWidth < 8 || image.naturalHeight < 8) degraded.value = true
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-muted">
    <img
      v-if="showImage"
      :src="src ?? undefined"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="h-full w-full object-cover"
      @load="onLoad"
      @error="failed = true"
    />
    <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-300">
      <ImageOff :size="22" :stroke-width="1.6" aria-hidden="true" />
      <span class="text-xs">暂无图片</span>
    </div>
  </div>
</template>
