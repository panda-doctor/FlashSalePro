<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@/shared/composables/useNow'
import { useCuratedProducts } from '@/modules/home/composables/useCuratedProducts'
import { useHomeActivities } from '@/modules/home/composables/useHomeActivities'
import { useScrollReveal } from '@/modules/home/composables/useScrollReveal'
import HeroSection from '@/modules/home/components/HeroSection.vue'
import CuratedCollection from '@/modules/home/components/CuratedCollection.vue'
import LiveSeckill from '@/modules/home/components/LiveSeckill.vue'
import BrandStory from '@/modules/home/components/BrandStory.vue'
import ValuePillars from '@/modules/home/components/ValuePillars.vue'
import MembershipCta from '@/modules/home/components/MembershipCta.vue'

const now = useNow(1000)
const { products, loading: productsLoading, failed: productsFailed } = useCuratedProducts()
const { activities, pipeline, loading: activitiesLoading, failed: activitiesFailed } = useHomeActivities(now)

const spotlight = computed(() => activities.value[0] ?? null)

useScrollReveal()
</script>

<template>
  <div>
    <HeroSection :activity="spotlight" :loading="activitiesLoading" :failed="activitiesFailed" :now="now" />
    <CuratedCollection :products="products" :loading="productsLoading" :failed="productsFailed" />
    <LiveSeckill
      :activities="activities"
      :pipeline="pipeline"
      :loading="activitiesLoading"
      :failed="activitiesFailed"
      :now="now"
    />
    <ValuePillars />
    <BrandStory :products="products" />
    <MembershipCta />
  </div>
</template>
