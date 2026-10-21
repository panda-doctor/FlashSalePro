<script setup lang="ts">
import { Activity, ShieldCheck, UserCheck, Workflow } from 'lucide-vue-next'

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Lua 原子预扣',
    desc: '令牌校验、库存判断与扣减在同一段脚本内完成，避免“先查后扣”的竞态窗口。',
    note: '原子性',
    span: 'lg:col-span-2',
  },
  {
    icon: UserCheck,
    title: '一人一单',
    desc: 'Redis 幂等令牌与 (activity_id, user_id) 唯一键双重约束，重复请求在入口即被拒绝。',
    note: '确定性',
    span: '',
  },
  {
    icon: Workflow,
    title: '异步落单',
    desc: '扣减成功后写入 Redis Stream，消费组完成落库，前端只轮询订单状态直至终态。',
    note: '可恢复',
    span: '',
  },
  {
    icon: Activity,
    title: '实时榜单与指标',
    desc: '抢购榜与活动级计数随请求更新，运营台按活动维度查看库存、重复与限流数据。',
    note: '可观测',
    span: 'lg:col-span-2',
  },
]
</script>

<template>
  <section class="border-y border-line/70 bg-surface/60 backdrop-blur-sm" aria-labelledby="values-heading">
    <div class="page-container py-20 lg:py-28">
      <div class="reveal flex flex-wrap items-end justify-between gap-6" data-reveal>
        <div>
          <p class="text-[10px] uppercase tracking-[0.34em] text-brand-dark">Values / 03</p>
          <h2 id="values-heading" class="mt-4 font-display text-[26px] leading-tight text-ink-900 sm:text-4xl">
            克制的界面，<span class="italic text-brand">严谨的秩序</span>
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-7 text-ink-500">
          视觉只负责呈现，真正的确定性来自链路本身。以下四项均为已实现的机制，而非宣传语。
        </p>
      </div>

      <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(pillar, index) in pillars"
          :key="pillar.title"
          class="reveal group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift sm:p-7"
          :class="pillar.span"
          data-reveal
          :data-reveal-delay="index * 60"
        >
          <div
            class="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-0 blur-[60px] transition-opacity duration-300 group-hover:opacity-100"
            style="background: radial-gradient(circle, rgba(29, 78, 216, 0.12), transparent 68%)"
            aria-hidden="true"
          />

          <div class="relative flex items-start justify-between gap-4">
            <span class="grid h-12 w-12 place-items-center rounded-2xl border border-brand/15 bg-brand-soft text-brand">
              <component :is="pillar.icon" :size="22" :stroke-width="1.7" aria-hidden="true" />
            </span>
            <span class="rounded-full border border-line bg-muted/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-ink-500">
              {{ pillar.note }}
            </span>
          </div>

          <div class="relative mt-10">
            <span class="num text-[10px] tracking-[0.24em] text-ink-300">0{{ index + 1 }}</span>
            <h3 class="mt-2 font-display text-xl text-ink-900 sm:text-2xl">{{ pillar.title }}</h3>
            <p class="mt-3 max-w-lg text-sm leading-7 text-ink-500">{{ pillar.desc }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
