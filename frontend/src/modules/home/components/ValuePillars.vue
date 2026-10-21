<script setup lang="ts">
import { Activity, ShieldCheck, UserCheck, Workflow } from 'lucide-vue-next'

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Lua 原子预扣',
    desc: '令牌校验、库存判断与扣减在同一段脚本内完成，避免“先查后扣”的竞态窗口。',
    note: '原子性',
  },
  {
    icon: UserCheck,
    title: '一人一单',
    desc: 'Redis 幂等令牌与 (activity_id, user_id) 唯一键双重约束，重复请求在入口即被拒绝。',
    note: '确定性',
  },
  {
    icon: Workflow,
    title: '异步落单',
    desc: '扣减成功后写入 Redis Stream，消费组完成落库，前端只轮询订单状态直至终态。',
    note: '可恢复',
  },
  {
    icon: Activity,
    title: '实时榜单与指标',
    desc: '抢购榜与活动级计数随请求更新，运营台按活动维度查看库存、重复与限流数据。',
    note: '可观测',
  },
]
</script>

<template>
  <section class="border-y border-line/60 bg-surface/40 backdrop-blur-sm" aria-labelledby="values-heading">
    <div class="page-container py-20 lg:py-28">
      <div class="reveal flex flex-wrap items-end justify-between gap-6" data-reveal>
        <div>
          <p class="text-[10px] uppercase tracking-[0.34em] text-brand-dark">Values / 04</p>
          <h2 id="values-heading" class="mt-4 font-display text-[26px] leading-tight text-ink-900 sm:text-4xl">
            克制的界面，<span class="italic text-brand">严谨的秩序</span>
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-7 text-ink-500">
          视觉只负责呈现，真正的确定性来自链路本身。以下四项均为已实现的机制，而非宣传语。
        </p>
      </div>

      <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="(pillar, index) in pillars"
          :key="pillar.title"
          class="reveal glass-panel group flex flex-col rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-glass"
          data-reveal
          :data-reveal-delay="index * 60"
        >
          <div class="flex items-center justify-between">
            <span class="grid h-10 w-10 place-items-center rounded-full border border-line bg-brand-soft/60 text-brand">
              <component :is="pillar.icon" :size="18" :stroke-width="1.7" aria-hidden="true" />
            </span>
            <span class="text-[10px] uppercase tracking-[0.2em] text-ink-500">{{ pillar.note }}</span>
          </div>
          <h3 class="mt-8 font-display text-xl text-ink-900">{{ pillar.title }}</h3>
          <p class="mt-3 text-sm leading-7 text-ink-500">{{ pillar.desc }}</p>
          <span class="num mt-6 text-[10px] tracking-[0.24em] text-ink-500">0{{ index + 1 }}</span>
        </article>
      </div>
    </div>
  </section>
</template>
