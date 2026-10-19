<script setup lang="ts">
import { computed } from 'vue'
import { Timer } from 'lucide-vue-next'
import type { ActivityDisplayState } from '@/utils/activityPhase'
import { formatCountdown, parseActivityTime } from '@/utils/time'

const props = defineProps<{
  startTime: string
  endTime: string
  now: number
  state: ActivityDisplayState
}>()

const target = computed<number | null>(() => {
  if (props.state === 'NOT_STARTED') return parseActivityTime(props.startTime)?.getTime() ?? null
  if (props.state === 'RUNNING') return parseActivityTime(props.endTime)?.getTime() ?? null
  return null
})

const prefix = computed(() => (props.state === 'NOT_STARTED' ? '距开始' : '距结束'))

const text = computed(() => {
  if (target.value === null) return ''
  return formatCountdown(target.value - props.now)
})
</script>

<template>
  <span v-if="target !== null" class="inline-flex items-center gap-1.5 text-xs text-ink-500">
    <Timer :size="13" aria-hidden="true" />
    {{ prefix }}
    <span class="num font-medium text-brand-dark">{{ text }}</span>
  </span>
</template>
