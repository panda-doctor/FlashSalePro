<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  MessagesSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-vue-next'
import AiCapabilityGrid from '@/modules/ai/components/AiCapabilityGrid.vue'
import AiChatPreview from '@/modules/ai/components/AiChatPreview.vue'
import ChatPanel from '@/modules/ai/components/ChatPanel.vue'

const chatRef = ref<InstanceType<typeof ChatPanel> | null>(null)

const trustPoints = [
  { icon: ShieldCheck, label: '公开 · 无需登录' },
  { icon: Boxes, label: '实时商品与活动目录' },
  { icon: Sparkles, label: '模型生成 · 下单前核对' },
]

function scrollToSection(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

function startChat(): void {
  scrollToSection('ai-chat')
  chatRef.value?.focusInput()
}
</script>

<template>
  <div class="pb-16">
    <section
      class="relative isolate overflow-hidden bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white text-ink-900"
      aria-label="AI 客服介绍"
    >
      <div
        class="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-brand/25 blur-[90px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-[#BFDBFE]/35 blur-[110px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.12]"
        style="background-image: radial-gradient(rgba(15, 23, 42, 0.28) 1px, transparent 1px); background-size: 22px 22px"
        aria-hidden="true"
      />

      <div class="page-container relative py-12 sm:py-16">
        <div class="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div class="min-w-0">
            <p class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-dark">
              <span class="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              AI Concierge / 03
            </p>

            <h1 class="mt-4 font-display text-[clamp(32px,4vw,44px)] font-bold leading-[1.15] tracking-tight text-ink-900">
              秒杀问题，<span class="text-brand-dark">问 AI 客服</span>
            </h1>

            <p class="mt-4 max-w-xl text-sm leading-7 text-ink-500 sm:text-[15px]">
              查秒杀时间、价格与配置库存，确认一人一单、限流与售罄规则。公开接口无需登录，回答由后端模型生成，并以实时活动数据为准。
            </p>

            <div class="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 text-sm font-medium text-white shadow-[0_14px_30px_rgba(29,78,216,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(29,78,216,0.32)]"
                @click="startChat"
              >
                立即体验
                <ArrowRight :size="16" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-surface px-6 text-sm font-medium text-ink-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand-dark hover:shadow-card"
                @click="scrollToSection('ai-capabilities')"
              >
                查看能力
              </button>
            </div>

            <ul class="mt-7 flex flex-wrap gap-2" aria-label="服务特性">
              <li
                v-for="point in trustPoints"
                :key="point.label"
                class="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 text-[11px] text-ink-700 backdrop-blur-sm"
              >
                <component :is="point.icon" :size="13" class="text-brand" aria-hidden="true" />
                {{ point.label }}
              </li>
            </ul>

            <p class="mt-5 flex items-center gap-2 text-[11px] text-ink-500">
              <MessagesSquare :size="13" aria-hidden="true" />
              示例对话使用活动接口的真实字段，无进行中场次时展示通用能力说明。
            </p>
          </div>

          <AiChatPreview />
        </div>
      </div>
    </section>

    <div class="page-container py-10 sm:py-14">
      <AiCapabilityGrid />
    </div>

    <section
      id="ai-chat"
      class="section-anchor border-t border-line/70 bg-gradient-to-b from-surface via-canvas to-canvas"
      aria-labelledby="ai-chat-heading"
    >
      <div class="page-container py-10 sm:py-14">
        <header class="flex flex-wrap items-end justify-between gap-4">
          <div class="max-w-2xl">
            <p class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-dark">
              <span class="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              Live Chat / 05
            </p>
            <h2 id="ai-chat-heading" class="mt-3 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">
              开始对话
            </h2>
            <p class="mt-2 text-sm leading-7 text-ink-500">
              输入问题或点击示例，Enter 发送、Shift + Enter 换行；单条最多 500 字，前端保留最近 10 轮。
            </p>
          </div>
          <span class="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-ink-700">
            <Bot :size="14" class="text-brand" aria-hidden="true" />
            公开 · 无需登录
          </span>
        </header>

        <div class="mt-6 grid gap-5 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <ChatPanel ref="chatRef" />

          <aside class="space-y-4 lg:sticky lg:top-24" aria-label="使用说明">
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

            <section class="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft via-[#DBEAFE] to-surface p-5">
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
    </section>
  </div>
</template>
