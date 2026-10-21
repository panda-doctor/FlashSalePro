<script setup lang="ts">
import { Boxes, Lock, ShieldCheck, Tags } from 'lucide-vue-next'

const capabilities = [
  {
    icon: Boxes,
    title: '实时目录',
    description: '对接上架商品与秒杀活动，按时间窗区分进行中、未开始与已结束。',
  },
  {
    icon: Tags,
    title: '价格与库存',
    description: '回答秒杀价、原价与配置库存；最终库存以活动详情和下单结果为准。',
  },
  {
    icon: ShieldCheck,
    title: '抢购规则',
    description: '一人一单、限流、排队与售罄提示，常见错误码也能给出处理建议。',
  },
  {
    icon: Lock,
    title: '使用边界',
    description: '不读取账号与个人订单；公开接口未做服务端限流，请勿高频调用。',
  },
]
</script>

<template>
  <section id="ai-capabilities" class="section-anchor" aria-labelledby="ai-capabilities-heading">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="max-w-2xl">
        <p class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-dark">
          <span class="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          Capabilities / 04
        </p>
        <h2 id="ai-capabilities-heading" class="mt-3 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">
          不止问答，更懂秒杀现场
        </h2>
        <p class="mt-2 text-sm leading-7 text-ink-500">
          回答范围限定在商品、活动与抢购规则内，数据来自后端实时目录，不读取你的账号信息。
        </p>
      </div>
      <p class="hidden items-center gap-2 text-xs text-ink-500 sm:flex">
        <span class="h-px w-10 bg-gradient-to-r from-brand/50 to-transparent" aria-hidden="true" />
        4 项能力边界
      </p>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="item in capabilities"
        :key="item.title"
        class="group flex flex-col rounded-2xl border border-line/80 bg-surface p-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand/25 hover:shadow-lift"
      >
        <span class="grid h-10 w-10 place-items-center rounded-xl border border-brand/15 bg-brand-soft text-brand-dark transition-colors group-hover:border-brand/30">
          <component :is="item.icon" :size="17" aria-hidden="true" />
        </span>
        <h3 class="mt-4 text-[15px] font-semibold text-ink-900">{{ item.title }}</h3>
        <p class="mt-2 text-xs leading-6 text-ink-500">{{ item.description }}</p>
        <span class="mt-auto pt-4">
          <span class="block h-px w-full bg-gradient-to-r from-line via-line/70 to-transparent" aria-hidden="true" />
        </span>
      </article>
    </div>
  </section>
</template>
