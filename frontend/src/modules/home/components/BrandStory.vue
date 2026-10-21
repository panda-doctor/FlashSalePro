<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import type { FeaturedProduct } from '@/modules/home/utils/featured'

defineProps<{
  products: FeaturedProduct[]
}>()

const chapters = [
  {
    no: '01',
    kicker: 'Curation',
    title: '从货架开始，先看清一件物品',
    paragraphs: [
      '商品页只展示已上架的条目，名称、图片、价格与普通可用库存来自同一次查询。',
      '首页从这批真实条目里取前四件作为甄选，不做虚构定价，也不以装饰性文案替代商品信息。',
    ],
    route: 'products',
    action: '浏览在售商品',
  },
  {
    no: '02',
    kicker: 'Timed release',
    title: '倒计时不是装饰，是准入条件',
    paragraphs: [
      '活动状态由时间窗、预热情况与实时库存共同决定。未开始、进行中、售罄与结束，各自对应明确的入口。',
      'Lua 脚本在同一段执行里完成令牌检查、库存判断与扣减，一人一单由幂等令牌与唯一键共同保证。',
    ],
    route: 'activities',
    action: '查看活动场次',
  },
  {
    no: '03',
    kicker: 'Fulfilment',
    title: '结果可查，问题有人应答',
    paragraphs: [
      '抢购成功只代表请求已入队，订单状态仍需轮询至创建完成。历史订单按活动归档，可以重新回看每一次结果。',
      'AI 客服基于商品与活动的公开信息回答问题，账单与库存的最终判断仍以订单和活动接口为准。',
    ],
    route: 'orders',
    action: '查看我的订单',
  },
]
</script>

<template>
  <section id="story" class="bg-[#F8FAFC]" aria-labelledby="story-heading">
    <div class="page-container py-20 lg:py-28">
      <div class="reveal flex flex-wrap items-end justify-between gap-6" data-reveal>
        <div>
          <p class="text-[10px] uppercase tracking-[0.34em] text-brand-dark">Story / 04</p>
          <h2 id="story-heading" class="mt-4 font-display text-[26px] leading-tight text-ink-900 sm:text-4xl">
            三章，讲清一次<span class="italic text-brand">相遇</span>
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-7 text-ink-500">
          从浏览到履约，每一步都对应一个已经上线的模块。没有演示数据，也没有提前写好的结局。
        </p>
      </div>

      <div class="relative mt-14">
        <div
          class="pointer-events-none absolute left-[1.6rem] top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-brand/30 via-line to-transparent sm:block"
          aria-hidden="true"
        />
        <ol class="space-y-4">
        <li
          v-for="(chapter, index) in chapters"
          :key="chapter.no"
          class="reveal group relative grid gap-6 rounded-2xl border border-line bg-surface p-6 transition-all duration-300 ease-out hover:border-brand/30 hover:shadow-card sm:grid-cols-[auto_1fr] sm:p-8 lg:grid-cols-[auto_1fr_15rem] lg:items-center"
          data-reveal
          :data-reveal-delay="index * 60"
        >
          <div class="flex items-center gap-4">
            <span
              class="num grid h-11 w-11 shrink-0 place-items-center rounded-full border border-brand/20 bg-brand-soft text-[13px] font-semibold text-brand-dark"
            >
              {{ chapter.no }}
            </span>
            <span class="text-[10px] uppercase tracking-[0.28em] text-ink-500 sm:hidden">{{ chapter.kicker }}</span>
          </div>

          <div class="min-w-0">
            <p class="hidden text-[10px] uppercase tracking-[0.28em] text-ink-500 sm:block">{{ chapter.kicker }}</p>
            <h3 class="mt-2 font-display text-xl leading-snug text-ink-900 sm:text-2xl">
              {{ chapter.title }}
            </h3>
            <p
              v-for="paragraph in chapter.paragraphs"
              :key="paragraph"
              class="mt-3 max-w-2xl text-sm leading-8 text-ink-500"
            >
              {{ paragraph }}
            </p>
            <RouterLink
              :to="{ name: chapter.route }"
              class="group/link mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-ink-700 transition-colors duration-200 hover:text-brand-dark"
            >
              {{ chapter.action }}
              <ArrowRight :size="15" class="transition-transform duration-200 group-hover/link:translate-x-1" aria-hidden="true" />
            </RouterLink>
          </div>

          <div class="relative hidden aspect-[4/3] overflow-hidden rounded-xl border border-line bg-muted lg:block">
            <ProductImage
              v-if="products[index]?.imageUrl"
              :src="products[index].imageUrl"
              :alt="products[index].name"
              class="h-full w-full"
            />
            <div v-else class="flex h-full w-full flex-col justify-between bg-muted/70 p-5">
              <span class="text-[10px] uppercase tracking-[0.3em] text-brand-dark">{{ chapter.kicker }}</span>
              <span class="max-w-[9rem] font-display text-base leading-snug text-ink-500">
                这一章，由真实的业务数据展开
              </span>
              <span class="num pointer-events-none absolute bottom-1 right-2 font-display text-[4rem] leading-none text-brand/10" aria-hidden="true">
                {{ chapter.no }}
              </span>
            </div>
          </div>
        </li>
        </ol>
      </div>
    </div>
  </section>
</template>
