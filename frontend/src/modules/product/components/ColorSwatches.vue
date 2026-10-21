<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { PRODUCT_COLORWAYS, type ColorwayId } from '@/modules/product/utils/colorways'

defineProps<{ modelValue: ColorwayId }>()
const emit = defineEmits<{ 'update:modelValue': [ColorwayId] }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="group" aria-label="配色示意">
    <button
      v-for="colorway in PRODUCT_COLORWAYS"
      :key="colorway.id"
      type="button"
      class="product-swatch grid h-11 w-11 place-items-center rounded-full border bg-surface"
      :class="
        modelValue === colorway.id
          ? 'border-brand shadow-[0_0_0_4px_rgba(240,185,141,0.2)]'
          : 'border-line hover:border-brand/35'
      "
      :aria-label="`${colorway.label}配色预览`"
      :aria-pressed="modelValue === colorway.id"
      @click="emit('update:modelValue', colorway.id)"
    >
      <span
        class="grid h-6 w-6 place-items-center rounded-full ring-1 ring-inset ring-black/5"
        :style="{ backgroundColor: colorway.swatch }"
      >
        <Check
          v-if="modelValue === colorway.id"
          :size="13"
          :class="colorway.id === 'graphite' ? 'text-atelier-ivory' : 'text-ink-900'"
          aria-hidden="true"
        />
      </span>
    </button>
  </div>
</template>
