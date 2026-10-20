<script setup lang="ts">
import { computed } from 'vue'
import { orderStatusLabel, orderStatusTagType } from '@/modules/order/utils/orderStatus'

const props = withDefaults(
  defineProps<{
    status: string | null | undefined
    statusDesc?: string
    size?: 'small' | 'default'
  }>(),
  { statusDesc: '', size: 'small' },
)

const label = computed(() => orderStatusLabel(props.status, props.statusDesc))
const tagType = computed(() => orderStatusTagType(props.status))
</script>

<template>
  <el-tag :type="tagType" :size="size" effect="light">{{ label }}</el-tag>
</template>
