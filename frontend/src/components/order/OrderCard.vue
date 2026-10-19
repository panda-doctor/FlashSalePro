<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import OrderStatusTag from '@/components/order/OrderStatusTag.vue'
import type { OrderListItemVO } from '@/types/order'
import { formatDateTime } from '@/utils/time'

defineProps<{ order: OrderListItemVO; activityName: string }>()
defineEmits<{ select: [OrderListItemVO] }>()
</script>

<template>
  <button
    type="button"
    class="surface-card surface-card-hover flex w-full items-center gap-4 p-4 text-left"
    @click="$emit('select', order)"
  >
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="num truncate text-sm font-medium text-ink-900">{{ order.orderNo }}</span>
        <OrderStatusTag :status="order.status" />
      </div>
      <p class="mt-1.5 truncate text-sm text-ink-500">
        {{ activityName }}
      </p>
      <p class="num mt-1 text-xs text-ink-500">下单时间 {{ formatDateTime(order.createdAt) }}</p>
    </div>
    <ChevronRight :size="18" class="shrink-0 text-ink-300" aria-hidden="true" />
  </button>
</template>
