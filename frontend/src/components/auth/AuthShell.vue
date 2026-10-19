<script setup lang="ts">
import { ShieldCheck, Timer, Zap } from 'lucide-vue-next'

const points = [
  { icon: Timer, text: '扣减成功后订单异步落库，前端轮询到 CREATED 才算完成' },
  { icon: ShieldCheck, text: '会话 Cookie 为 HttpOnly，写请求强制校验 CSRF 令牌' },
]
</script>

<template>
  <div class="page-container py-10 lg:py-16">
    <div class="grid overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card lg:grid-cols-[1.02fr_1fr]">
      <aside class="relative hidden flex-col overflow-hidden bg-[#16233a] p-10 text-white lg:flex">
        <div
          class="absolute inset-0 opacity-70"
          aria-hidden="true"
          style="
            background:
              radial-gradient(circle at 18% 8%, rgba(64, 158, 255, 0.55), transparent 46%),
              radial-gradient(circle at 88% 88%, rgba(103, 194, 58, 0.25), transparent 52%);
          "
        />
        <div class="relative">
          <div class="flex items-center gap-2 text-sm text-white/70">
            <Zap :size="16" aria-hidden="true" />
            秒杀商城
          </div>
          <h2 class="mt-10 text-[30px] font-semibold leading-snug">
            登录之后，<br />
            抢购结果才有归属
          </h2>
          <p class="mt-4 max-w-sm text-sm leading-7 text-white/70">
            账号态在服务端保存，退出即撤销；所有页面共享同一份会话，不会出现“页面看似已登录、下单却 40100”的错位。
          </p>

          <ul class="mt-10 space-y-4 text-sm leading-6 text-white/80">
            <li v-for="point in points" :key="point.text" class="flex gap-3">
              <component :is="point.icon" :size="18" class="mt-0.5 shrink-0 text-brand-light" aria-hidden="true" />
              <span>{{ point.text }}</span>
            </li>
          </ul>
        </div>

        <p class="relative mt-auto pt-12 text-xs text-white/40">Redis Lua + Streams · Spring Cloud Gateway</p>
      </aside>

      <section class="p-6 sm:p-10">
        <slot />
      </section>
    </div>
  </div>
</template>
