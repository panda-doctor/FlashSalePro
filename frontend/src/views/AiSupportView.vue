<script setup lang="ts">
import { BookOpen, Bot, ShieldAlert } from 'lucide-vue-next'
import ChatPanel from '@/components/ai/ChatPanel.vue'
</script>

<template>
  <div class="page-container py-8">
    <header>
      <h1 class="text-2xl font-semibold">AI 客服</h1>
      <p class="mt-1 text-sm text-ink-500">
        由后端调用 OpenAI 兼容模型生成回答，公开接口无需登录；商品与活动信息来自实时目录。
      </p>
    </header>

    <div class="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <ChatPanel />

      <aside class="space-y-4">
        <section class="surface-card p-5">
          <h2 class="flex items-center gap-2 text-[15px] font-semibold">
            <BookOpen :size="17" class="text-brand" aria-hidden="true" />
            回答范围
          </h2>
          <ul class="mt-3 space-y-2 text-sm leading-6 text-ink-700">
            <li>· 当前上架商品与进行中的秒杀活动</li>
            <li>· 活动时间窗、秒杀价与配置库存</li>
            <li>· 抢购规则：一人一单、限流与售罄提示</li>
          </ul>
          <p class="mt-3 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
            客服不读取你的会话，无法查询个人订单；订单问题请前往“我的订单”。
          </p>
        </section>

        <section class="surface-card p-5">
          <h2 class="flex items-center gap-2 text-[15px] font-semibold">
            <ShieldAlert :size="17" class="text-warning" aria-hidden="true" />
            使用须知
          </h2>
          <ul class="mt-3 space-y-2 text-sm leading-6 text-ink-700">
            <li>· 单条问题最多 500 字，历史最多保留 10 轮</li>
            <li>· 未配置模型密钥时返回 50300，调用失败返回 50301</li>
            <li>· 后端未对该公开接口做限流，请勿高频调用</li>
            <li>· 请勿输入密码、手机号等敏感信息</li>
          </ul>
        </section>

        <section class="rounded-xl border border-brand/15 bg-brand-soft/60 p-4">
          <div class="flex items-start gap-2.5">
            <Bot :size="18" class="mt-0.5 shrink-0 text-brand-dark" aria-hidden="true" />
            <p class="text-xs leading-5 text-brand-dark">
              回答由模型生成，可能滞后于 Redis 实时库存；下单前请以活动详情页的实时数据为准。
            </p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
