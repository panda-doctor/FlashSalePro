<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  remaining: number | null
}>()

const sold = computed(() => {
  if (props.remaining === null) return 0
  return Math.max(0, props.total - props.remaining)
})

const percent = computed(() => {
  if (props.remaining === null || props.total <= 0) return 0
  return Math.min(100, Math.round((sold.value / props.total) * 100))
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between text-xs text-ink-500">
      <span v-if="remaining === null">未预热，暂无实时库存</span>
      <span v-else>
        已抢
        <b class="num font-semibold text-ink-900">{{ sold }}</b>
        / {{ total }}
      </span>
      <span class="num">{{ percent }}%</span>
    </div>

    <div
      class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line/60"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="秒杀进度"
    >
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="percent >= 100 ? 'bg-danger' : 'bg-brand'"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
