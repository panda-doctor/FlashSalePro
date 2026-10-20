<script setup lang="ts">
/**
 * 骨架占位块：尺寸由调用方通过 class 传入（如 h-4 w-3/4），
 * 内部只负责统一的底色、圆角与动画，避免各页面重复写 animate-pulse。
 */
withDefaults(defineProps<{ rounded?: 'sm' | 'md' | 'full' }>(), { rounded: 'md' })

const radius: Record<'sm' | 'md' | 'full', string> = {
  sm: 'rounded',
  md: 'rounded-md',
  full: 'rounded-full',
}
</script>

<template>
  <div class="animate-pulse bg-muted" :class="radius[rounded]" aria-hidden="true" />
</template>
