<script setup lang="ts">
import { BookOpen, Bot, ShieldAlert } from 'lucide-vue-next'
import ChatPanel from '@/modules/ai/components/ChatPanel.vue'
</script>

<template>
  <div class="pb-16">
    <section
      class="relative isolate overflow-hidden bg-gradient-to-br from-[#FBF0E6] via-[#F8EADD] to-[#FAF6F1] text-ink-900"
      aria-label="AI 客服横幅"
    >
      <div
        class="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-brand/25 blur-[90px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-[#FFB266]/20 blur-[110px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.12]"
        style="background-image: radial-gradient(rgba(184, 132, 102, 0.38) 1px, transparent 1px); background-size: 22px 22px"
        aria-hidden="true"
      />
      <div class="page-container relative py-10 sm:py-12">
        <header class="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-dark">
              <span class="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              Concierge / 03
            </p>
            <h1 class="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-bold leading-tight tracking-tight">
              AI 客服
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-7 text-ink-500">
              由后端调用 OpenAI 兼容模型生成回答，公开接口无需登录；商品与活动信息来自实时目录。
            </p>
          </div>
          <span class="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-2 text-xs font-medium text-ink-700 backdrop-blur-sm">
            <Bot :size="14" aria-hidden="true" />
            公开 · 无需登录
          </span>
        </header>
      </div>
    </section>

    <div class="page-container py-8 sm:py-10">
      <div class="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <ChatPanel />

        <aside class="space-y-4">
          <section class="surface-card p-5">
            <h2 class="flex items-center gap-2.5 text-[15px] font-semibold">
              <span class="grid h-8 w-8 place-items-center rounded-xl bg-brand-soft text-brand-dark">
                <BookOpen :size="15" aria-hidden="true" />
              </span>
              回答范围
            </h2>
            <ul class="mt-4 space-y-2.5 text-sm leading-6 text-ink-700">
              <li class="flex gap-2">
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                当前上架商品与进行中的秒杀活动
              </li>
              <li class="flex gap-2">
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                活动时间窗、秒杀价与配置库存
              </li>
              <li class="flex gap-2">
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                抢购规则：一人一单、限流与售罄提示
              </li>
            </ul>
            <p class="mt-4 rounded-xl border border-line/70 bg-muted/60 px-3.5 py-2.5 text-xs leading-5 text-ink-500">
              客服不读取你的会话，无法查询个人订单；订单问题请前往“我的订单”。
            </p>
          </section>

          <section class="surface-card p-5">
            <h2 class="flex items-center gap-2.5 text-[15px] font-semibold">
              <span class="grid h-8 w-8 place-items-center rounded-xl bg-warning/10 text-warning">
                <ShieldAlert :size="15" aria-hidden="true" />
              </span>
              使用须知
            </h2>
            <ul class="mt-4 space-y-2.5 text-sm leading-6 text-ink-700">
              <li class="flex gap-2">
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                单条问题最多 500 字，历史最多保留 10 轮
              </li>
              <li class="flex gap-2">
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                未配置模型密钥时返回 50300，调用失败返回 50301
              </li>
              <li class="flex gap-2">
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                后端未对该公开接口做限流，请勿高频调用
              </li>
              <li class="flex gap-2">
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                请勿输入密码、手机号等敏感信息
              </li>
            </ul>
          </section>

          <section class="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft via-[#FBEFE7] to-surface p-5">
            <div class="flex items-start gap-3">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark shadow-sm">
                <Bot :size="16" aria-hidden="true" />
              </span>
              <p class="text-xs leading-5 text-brand-dark">
                回答由模型生成，可能滞后于 Redis 实时库存；下单前请以活动详情页的实时数据为准。
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>
