<script setup lang="ts">
import { computed } from 'vue'
import { Timer } from 'lucide-vue-next'
import type { ActivityDisplayState } from '@/modules/activity/utils/activityPhase'
import { formatCountdown, parseActivityTime } from '@/shared/utils/time'

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
  <span
    v-if="target !== null"
    class="inline-flex items-center gap-1.5 rounded-full border border-flash/20 bg-flash-soft px-2.5 py-1 text-[11px] text-flash-dark"
  >
    <Timer :size="12" aria-hidden="true" />
    {{ prefix }}
    <span class="num font-semibold tracking-wide text-flash">{{ text }}</span>
  </span>
</template>
