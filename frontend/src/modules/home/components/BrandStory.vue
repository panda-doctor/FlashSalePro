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
    offset: '',
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
    offset: 'lg:mt-10',
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
    offset: 'lg:mt-16',
  },
]
</script>

<template>
  <section id="story" class="bg-atelier-sand/40" aria-labelledby="story-heading">
    <div class="page-container py-20 lg:py-28">
      <div class="reveal flex flex-wrap items-end justify-between gap-6" data-reveal>
        <div>
          <p class="text-[10px] uppercase tracking-[0.34em] text-brand-dark">Story / 03</p>
          <h2 id="story-heading" class="mt-4 font-display text-[26px] leading-tight text-ink-900 sm:text-4xl">
            三章，讲清一次<span class="italic text-brand">相遇</span>
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-7 text-ink-500">
          从浏览到履约，每一步都对应一个已经上线的模块。没有演示数据，也没有提前写好的结局。
        </p>
      </div>

      <div class="mt-14 space-y-16 lg:space-y-20">
        <article
          v-for="(chapter, index) in chapters"
          :key="chapter.no"
          class="reveal grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16"
          :class="chapter.offset"
          data-reveal
        >
          <div class="relative">
            <p class="num mb-4 font-display text-5xl leading-none text-brand/20" aria-hidden="true">
              {{ chapter.no }}
            </p>
            <div class="glass-panel relative aspect-[4/3] overflow-hidden rounded-2xl">
              <ProductImage
                v-if="products[index]?.imageUrl"
                :src="products[index].imageUrl"
                :alt="products[index].name"
                class="h-full w-full"
              />
              <div v-else class="relative flex h-full w-full flex-col justify-between bg-[#FBF4EC] p-7">
                <span class="text-[10px] uppercase tracking-[0.3em] text-brand-dark">{{ chapter.kicker }}</span>
                <span class="relative z-10 max-w-[9.5rem] font-display text-xl leading-snug text-ink-500">
                  这一章，由真实的业务数据展开
                </span>
                <span class="num pointer-events-none absolute bottom-2 right-3 font-display text-[6rem] leading-none text-brand/15" aria-hidden="true">
                  {{ chapter.no }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p class="text-[10px] uppercase tracking-[0.3em] text-ink-500">{{ chapter.kicker }}</p>
            <h3 class="mt-4 font-display text-2xl leading-snug text-ink-900 sm:text-[30px]">
              {{ chapter.title }}
            </h3>
            <p
              v-for="paragraph in chapter.paragraphs"
              :key="paragraph"
              class="mt-4 max-w-xl text-sm leading-8 text-ink-500"
            >
              {{ paragraph }}
            </p>
            <div class="mt-7 h-px w-16 bg-brand/50" aria-hidden="true" />
            <RouterLink
              :to="{ name: chapter.route }"
              class="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-ink-700 transition-colors duration-200 hover:text-brand-dark"
            >
              {{ chapter.action }}
              <ArrowRight :size="15" class="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
