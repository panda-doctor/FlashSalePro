<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: Component
    actionText?: string
    compact?: boolean
  }>(),
  {
    description: '',
    icon: undefined,
    actionText: '',
    compact: false,
  },
)

defineEmits<{ action: [] }>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="compact ? 'py-8' : 'py-16'"
  >
    <span class="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-dark">
      <component :is="icon || Inbox" :size="22" :stroke-width="1.8" aria-hidden="true" />
    </span>
    <p class="mt-4 text-[15px] font-medium text-ink-900">{{ title }}</p>
    <p v-if="description" class="mt-1.5 max-w-sm text-sm leading-6 text-ink-500">
      {{ description }}
    </p>
    <el-button v-if="actionText" class="mt-5" plain @click="$emit('action')">{{ actionText }}</el-button>
  </div>
</template>
