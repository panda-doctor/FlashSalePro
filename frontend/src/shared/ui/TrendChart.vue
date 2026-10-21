<script setup lang="ts">
import { computed } from 'vue'

export interface TrendPoint {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    points: TrendPoint[]
    height?: number
    valueFormatter?: (value: number) => string
    ariaLabel?: string
  }>(),
  {
    height: 220,
    valueFormatter: (value: number) => String(value),
    ariaLabel: '趋势图',
  },
)

const width = 720
const padding = { top: 18, right: 18, bottom: 32, left: 48 }
const innerWidth = width - padding.left - padding.right
const innerHeight = computed(() => props.height - padding.top - padding.bottom)

const maxValue = computed(() => Math.max(1, ...props.points.map((point) => point.value)))
const stepX = computed(() =>
  props.points.length > 1 ? innerWidth / (props.points.length - 1) : innerWidth,
)

const coords = computed(() =>
  props.points.map((point, index) => ({
    ...point,
    x:
      props.points.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + index * stepX.value,
    y: padding.top + innerHeight.value * (1 - point.value / maxValue.value),
  })),
)

const linePoints = computed(() => coords.value.map((point) => `${point.x},${point.y}`).join(' '))

const areaPath = computed(() => {
  if (!coords.value.length) return ''
  const baseline = padding.top + innerHeight.value
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  const body = coords.value.map((point) => `L ${point.x},${point.y}`).join(' ')
  return `M ${first.x},${baseline} ${body} L ${last.x},${baseline} Z`
})

const yTicks = computed(() =>
  [0, 0.5, 1].map((ratio) => ({
    value: Math.round(maxValue.value * ratio),
    y: padding.top + innerHeight.value * (1 - ratio),
  })),
)

const xLabelStep = computed(() => Math.max(1, Math.ceil(props.points.length / 7)))
const gradientId = `trend-fill-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
  <div class="w-full">
    <div
      v-if="!points.length"
      class="flex items-center justify-center rounded-lg border border-dashed border-line text-sm text-ink-500"
      :style="{ height: `${height}px` }"
    >
      暂无趋势数据
    </div>

    <svg
      v-else
      :viewBox="`0 0 ${width} ${height}`"
      :style="{ height: `${height}px` }"
      class="w-full overflow-visible"
      role="img"
      :aria-label="ariaLabel"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color: var(--nocturne-brand); stop-opacity: 0.2" />
          <stop offset="100%" style="stop-color: var(--nocturne-brand); stop-opacity: 0.02" />
        </linearGradient>
      </defs>

      <g v-for="tick in yTicks" :key="tick.y">
        <line
          :x1="padding.left"
          :x2="width - padding.right"
          :y1="tick.y"
          :y2="tick.y"
          class="stroke-line"
          stroke-dasharray="4 6"
        />
        <text
          :x="padding.left - 10"
          :y="tick.y + 4"
          text-anchor="end"
          class="fill-ink-500 text-[11px]"
        >
          {{ valueFormatter(tick.value) }}
        </text>
      </g>

      <path :d="areaPath" :fill="`url(#${gradientId})`" />
      <polyline
        :points="linePoints"
        class="stroke-brand-light"
        fill="none"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <g v-for="(point, index) in coords" :key="point.label">
        <circle :cx="point.x" :cy="point.y" r="8" fill="transparent">
          <title>{{ point.label }}：{{ valueFormatter(point.value) }}</title>
        </circle>
        <circle
          :cx="point.x"
          :cy="point.y"
          r="3.5"
          class="fill-surface stroke-brand"
          stroke-width="2"
        />
        <text
          v-if="index % xLabelStep === 0 || index === coords.length - 1"
          :x="point.x"
          :y="height - 10"
          text-anchor="middle"
          class="fill-ink-500 text-[11px]"
        >
          {{ point.label.slice(5) }}
        </text>
      </g>
    </svg>
  </div>
</template>
