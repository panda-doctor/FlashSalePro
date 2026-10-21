<script setup lang="ts">
import { computed } from 'vue'
import { pageRange } from '@/shared/utils/pagination'

const props = withDefaults(
  defineProps<{
    page: number
    pages: number
    total: number
    pageSize: number
    unit?: string
    tone?: 'brand' | 'flash'
    ariaLabel?: string
    disabled?: boolean
  }>(),
  {
    unit: '件',
    tone: 'brand',
    ariaLabel: '分页导航',
    disabled: false,
  },
)

const emit = defineEmits<{ change: [page: number] }>()

const range = computed(() => pageRange(props.page, props.pageSize, props.total))
</script>

<template>
  <nav
    :aria-label="ariaLabel"
    class="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:justify-between"
  >
    <p class="text-xs leading-6 text-ink-500">
      <template v-if="total">
        第
        <span class="num font-semibold text-ink-900">{{ range.start }}–{{ range.end }}</span>
        {{ unit }}
        <span class="mx-1 text-ink-300">/</span>
        共
        <span class="num font-semibold text-ink-900">{{ total }}</span>
        {{ unit }}
        <span class="ml-2 text-ink-300">·</span>
        <span class="ml-2">第 <span class="num font-medium text-ink-700">{{ page }}</span> / {{ pages }} 页</span>
      </template>
      <template v-else>暂无{{ unit }}</template>
    </p>

    <el-pagination
      v-if="pages > 1"
      background
      :class="tone === 'flash' ? 'pagination--flash' : ''"
      layout="prev, pager, next"
      :pager-count="5"
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      :disabled="disabled"
      @current-change="emit('change', $event)"
    />
  </nav>
</template>
