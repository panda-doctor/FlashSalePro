<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, ArrowUpRight, Bot, ReceiptText, Ticket } from 'lucide-vue-next'
import { useAuthStore } from '@/modules/auth/store'

const auth = useAuthStore()

const primary = computed(() =>
  auth.isLoggedIn
    ? { to: { name: 'profile' }, label: '进入个人中心' }
    : { to: { name: 'register' }, label: '创建账户' },
)

const secondary = computed(() =>
  auth.isLoggedIn
    ? { to: { name: 'orders' }, label: '查看我的订单' }
    : { to: { name: 'login' }, label: '已有账户，登录' },
)

const privileges = [
  {
    icon: Ticket,
    title: '活动资格',
    desc: '一人一单与限购校验绑定账户，换设备也不会重复占用名额。',
    route: 'activities',
    action: '查看场次',
  },
  {
    icon: ReceiptText,
    title: '订单轨迹',
    desc: '抢购结果从入队到落库，按活动归档，可随时回看。',
    route: 'orders',
    action: '我的订单',
  },
  {
    icon: Bot,
    title: '客服上下文',
    desc: 'AI 客服结合商品与活动信息回答，账户状态让上下文更完整。',
    route: 'ai-support',
    action: '咨询客服',
  },
]
</script>

<template>
  <section class="bg-transparent" aria-labelledby="membership-heading">
    <div class="page-container py-20 lg:py-28">
      <div class="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#1E40AF] via-[#1D4ED8] to-[#2563EB] px-7 py-14 text-white sm:px-12 lg:px-16 lg:py-20">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            class="absolute -right-24 -top-24 h-[30rem] w-[30rem] rounded-full opacity-60 blur-[110px]"
            style="background: radial-gradient(circle, rgba(191, 219, 254, 0.3), transparent 68%)"
          />
          <div
            class="absolute inset-0 opacity-20"
            style="
              background-image: linear-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px);
              background-size: 100% 72px;
              mask-image: linear-gradient(to bottom, black, transparent 80%);
            "
          />
        </div>

        <div class="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p class="text-[10px] uppercase tracking-[0.34em] text-[#BFDBFE]">Membership / 05</p>
            <h2
              id="membership-heading"
              class="mt-5 font-display text-[26px] leading-snug text-white sm:text-4xl sm:leading-snug"
            >
              专属会籍，<br class="hidden sm:block" />
              记录每一次<span class="italic text-[#BFDBFE]">郑重的选择</span>
            </h2>
            <p class="mt-6 max-w-md text-sm leading-8 text-white/85">
              这里的会籍不是付费墙，而是你的账户本身。登录之后，活动资格、订单归属与客服上下文都指向同一个人。
            </p>

            <div class="mt-9 flex flex-wrap items-center gap-4">
              <RouterLink
                :to="primary.to"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-medium tracking-wide text-[#1E40AF] shadow-[0_12px_28px_rgba(15,23,42,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EFF6FF] hover:shadow-[0_18px_36px_rgba(15,23,42,0.3)] active:scale-[0.98]"
              >
                {{ primary.label }}
                <ArrowRight :size="16" aria-hidden="true" />
              </RouterLink>
              <RouterLink
                :to="secondary.to"
                class="inline-flex min-h-11 items-center gap-2 text-sm text-white/80 transition-colors duration-200 hover:text-white"
              >
                {{ secondary.label }}
                <ArrowUpRight :size="14" aria-hidden="true" />
              </RouterLink>
            </div>

            <p class="mt-8 text-[11px] leading-5 text-white/75">
              不售卖会员等级，也不承诺额外权益；所有入口对应已上线的账户与业务模块。
            </p>
          </div>

          <ul class="self-start rounded-2xl border border-white/50 bg-white/95 px-6 py-3 shadow-[0_20px_48px_rgba(15,23,42,0.22)] backdrop-blur-xl">
            <li
              v-for="item in privileges"
              :key="item.title"
              class="border-b border-line/70 py-5 last:border-b-0"
            >
              <RouterLink
                :to="{ name: item.route }"
                class="group flex items-start gap-4"
              >
                <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-brand-soft text-brand">
                  <component :is="item.icon" :size="16" :stroke-width="1.7" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-center justify-between gap-3">
                    <span class="text-sm font-medium text-ink-900">{{ item.title }}</span>
                    <span class="inline-flex shrink-0 items-center gap-1 text-[11px] text-ink-500 transition-colors duration-200 group-hover:text-brand-dark">
                      {{ item.action }}
                      <ArrowUpRight :size="12" aria-hidden="true" />
                    </span>
                  </span>
                  <span class="mt-1.5 block text-xs leading-6 text-ink-500">{{ item.desc }}</span>
                </span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
