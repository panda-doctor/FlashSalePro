<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'
import type { ActivityGroupCounts } from '@/modules/activity/utils/grouping'

const props = defineProps<{ keyword: string; counts: ActivityGroupCounts }>()

const emit = defineEmits<{ 'update:keyword': [value: string]; jump: [id: string] }>()

const anchors = computed(() => [
  { id: 'upcoming-section', label: '即将开场', count: props.counts.UPCOMING, dot: 'bg-brand' },
  { id: 'live-section', label: '进行中', count: props.counts.LIVE, dot: 'bg-flash' },
  { id: 'ended-section', label: '已结束', count: props.counts.ENDED, dot: 'bg-ink-300' },
])
</script>

<template>
  <section class="surface-card mt-6 p-4 sm:p-5">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div class="w-full lg:max-w-sm">
        <label for="activity-keyword" class="mb-1.5 block text-xs font-medium text-ink-700">活动 / 商品名称</label>
        <el-input
          id="activity-keyword"
          :model-value="keyword"
          placeholder="输入名称筛选全部场次"
          clearable
          @update:model-value="emit('update:keyword', $event)"
        >
          <template #prefix>
            <Search :size="15" aria-hidden="true" />
          </template>
        </el-input>
      </div>

      <nav class="flex flex-wrap gap-2 lg:ml-auto" aria-label="活动区块导航">
        <a
          v-for="anchor in anchors"
          :key="anchor.id"
          :href="`#${anchor.id}`"
          class="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-ink-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:text-brand-dark hover:shadow-card"
          @click.prevent="emit('jump', anchor.id)"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="anchor.dot" aria-hidden="true" />
          {{ anchor.label }}
          <span class="num rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-ink-700">{{ anchor.count }}</span>
        </a>
      </nav>
    </div>
    <p class="mt-3 text-xs leading-5 text-ink-500">
      关键字同时筛选三个区块，匹配
      <span class="num font-semibold text-ink-900">{{ counts.ALL }}</span>
      场；清空后恢复完整列表。
    </p>
  </section>
</template>
