<script setup lang="ts">
import type { ProductColorway } from '@/modules/product/utils/colorways'

withDefaults(
  defineProps<{
    colorway: ProductColorway
    decorative?: boolean
  }>(),
  { decorative: false },
)
</script>

<template>
  <svg
    viewBox="0 0 420 360"
    class="product-art h-full w-full"
    :style="{
      '--art-shell': colorway.shell,
      '--art-pad': colorway.pad,
      '--art-accent': colorway.accent,
    }"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : `商品示意图：${colorway.label}配色头戴式耳机`"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <ellipse cx="210" cy="316" rx="96" ry="13" fill="#2c1e16" opacity="0.09" />

    <path
      d="M 104 224 C 104 98 316 98 316 224"
      fill="none"
      stroke="var(--art-shell)"
      stroke-width="22"
      stroke-linecap="round"
      class="art-stroke"
    />
    <path
      d="M 112 214 C 112 112 308 112 308 214"
      fill="none"
      stroke="var(--art-pad)"
      stroke-width="6"
      stroke-linecap="round"
      opacity="0.9"
      class="art-pad-stroke"
    />

    <rect x="104" y="154" width="34" height="32" rx="15" fill="var(--art-shell)" class="art-fill" />
    <rect x="282" y="154" width="34" height="32" rx="15" fill="var(--art-shell)" class="art-fill" />

    <rect x="72" y="168" width="88" height="122" rx="40" fill="var(--art-shell)" class="art-fill" />
    <rect x="260" y="168" width="88" height="122" rx="40" fill="var(--art-shell)" class="art-fill" />

    <rect x="88" y="184" width="56" height="90" rx="26" fill="var(--art-pad)" class="art-pad" />
    <rect x="276" y="184" width="56" height="90" rx="26" fill="var(--art-pad)" class="art-pad" />

    <path d="M 84 214 C 84 192 96 181 114 179" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.24" />
    <path d="M 272 214 C 272 192 284 181 302 179" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.24" />

    <circle cx="116" cy="262" r="3.5" fill="var(--art-accent)" class="art-accent-fill" />
    <circle cx="304" cy="262" r="3.5" fill="var(--art-accent)" class="art-accent-fill" />

    <path
      d="M 116 290 C 108 318 150 330 194 325"
      fill="none"
      stroke="var(--art-accent)"
      stroke-width="3"
      stroke-linecap="round"
      opacity="0.55"
      class="art-accent-stroke"
    />
    <rect x="190" y="319" width="18" height="10" rx="5" fill="var(--art-accent)" opacity="0.7" class="art-accent-fill" />

    <path d="M 126 104 C 166 84 254 84 294 104" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.18" />
  </svg>
</template>

<style scoped>
.art-fill {
  fill: var(--art-shell);
  transition: fill 250ms ease;
}

.art-pad {
  fill: var(--art-pad);
  transition: fill 250ms ease;
}

.art-stroke {
  stroke: var(--art-shell);
  transition: stroke 250ms ease;
}

.art-pad-stroke {
  stroke: var(--art-pad);
  transition: stroke 250ms ease;
}

.art-accent-fill {
  fill: var(--art-accent);
  transition: fill 250ms ease;
}

.art-accent-stroke {
  stroke: var(--art-accent);
  transition: stroke 250ms ease;
}
</style>
