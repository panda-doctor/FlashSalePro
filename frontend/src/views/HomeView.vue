<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  ShieldCheck,
  Terminal,
  UserCheck,
  Workflow,
} from 'lucide-vue-next'
import { primaryNav, type NavItem } from '@/router/nav'

const router = useRouter()
const proxyTarget = import.meta.env.VITE_PROXY_TARGET || '由 Nginx 同源反向代理'

const MODULE_COPY: Record<string, string> = {
  products: '上架商品的关键字检索、分页浏览与详情，价格与库存在同一视图内可读。',
  activities: '活动大厅与详情：时间窗倒计时、实时库存进度、抢购榜 Top10。',
  orders: '秒杀单号轮询到终态，历史订单按活动筛选查看。',
  profile: '账号资料与登录态管理。',
  'ai-support': '基于商品与活动上下文的问答，公开接口，无需登录。',
  admin: '商品维护、活动预热与重置、实时指标、快照与死信重放。',
}

const entries = computed<Array<NavItem & { description: string }>>(() =>
  primaryNav
    .filter((item) => router.hasRoute(item.name))
    .map((item) => ({ ...item, description: MODULE_COPY[item.name] ?? '' })),
)

const hasActivities = computed(() => router.hasRoute('activities'))
const hasProducts = computed(() => router.hasRoute('products'))

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'Lua 原子预扣',
    desc: '令牌检查、库存判断与扣减在同一段脚本内完成，避免“先查后扣”的竞态。',
  },
  {
    icon: UserCheck,
    title: '一人一单',
    desc: 'Redis 幂等令牌与 seckill_order 唯一键 (activity_id, user_id) 双重约束。',
  },
  {
    icon: Workflow,
    title: '异步落单',
    desc: '扣减成功立即入 Redis Stream，订单服务按消费组落库，前端只轮询订单状态。',
  },
  {
    icon: Gauge,
    title: '活动级指标',
    desc: '实时库存、订单数、重复、限流、售罄拒绝计数，运营台按活动维度查看。',
  },
]

const steps = [
  { title: '网关鉴权', desc: '校验会话凭证与 CSRF，统一注入 traceId' },
  { title: '资格校验', desc: '时间窗、活动状态与滑动窗口限流' },
  { title: 'Lua 扣减', desc: '原子占用库存并写入幂等令牌' },
  { title: '异步建单', desc: 'Stream 消费落库，回写榜单与消息日志' },
]

const checks = ['统一响应体按 code 判定', '40100 全局失效处理', '40301 自动刷新并重放一次']
const commands = ['pnpm dev', 'pnpm lint', 'pnpm type-check', 'pnpm test', 'pnpm build']
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-line/70">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-soft via-white to-white" aria-hidden="true" />
      <div
        class="absolute inset-0 opacity-40"
        aria-hidden="true"
        style="
          background-image: radial-gradient(#409eff 1px, transparent 1px);
          background-size: 24px 24px;
          mask-image: linear-gradient(to bottom right, black, transparent 68%);
        "
      />

      <div class="page-container relative grid gap-12 py-16 lg:grid-cols-[1.12fr_1fr] lg:items-center lg:py-20">
        <div class="animate-fade-up">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white/80 px-3 py-1 text-xs font-medium text-brand-dark"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-brand" />
            实时秒杀 · Redis Stream 驱动
          </span>

          <h1 class="mt-5 text-[34px] font-semibold leading-[1.18] tracking-tight sm:text-[44px]">
            把高并发抢购，<br class="hidden sm:block" />
            做成一次<span class="text-brand-dark">确定的交互</span>
          </h1>

          <p class="mt-4 max-w-xl text-[15px] leading-7 text-ink-700">
            商品货架、限时活动、抢购结果与订单轨迹，全部对齐后端真实契约。每一个按钮的结果都可预期：排队、售罄、重复、限流，各有明确出口。
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <el-button v-if="hasActivities" type="primary" size="large" @click="router.push({ name: 'activities' })">
              进入活动大厅
              <ArrowRight :size="16" class="ml-1.5" aria-hidden="true" />
            </el-button>
            <el-button v-if="hasProducts" size="large" @click="router.push({ name: 'products' })">
              浏览商品
            </el-button>
            <p
              v-if="!hasActivities && !hasProducts"
              class="rounded-lg border border-dashed border-line bg-white/70 px-4 py-3 text-sm text-ink-500"
            >
              基础设施已就绪，业务模块将按里程碑逐个接入。
            </p>
          </div>

          <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
            <li v-for="check in checks" :key="check" class="flex items-center gap-1.5">
              <CheckCircle2 :size="15" class="text-success" aria-hidden="true" />
              {{ check }}
            </li>
          </ul>
        </div>

        <div class="surface-card animate-fade-up p-6 sm:p-7">
          <div class="flex items-center justify-between">
            <h2 class="text-[15px] font-semibold">一次抢购的完整链路</h2>
            <span class="rounded-md bg-muted px-2 py-0.5 text-xs text-ink-500">同步扣减 + 异步落单</span>
          </div>

          <ol class="mt-6 space-y-5">
            <li v-for="(step, index) in steps" :key="step.title" class="relative flex gap-4">
              <div class="flex flex-col items-center">
                <span
                  class="num grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand/30 bg-brand-soft text-xs font-semibold text-brand-dark"
                >
                  {{ index + 1 }}
                </span>
                <span v-if="index < steps.length - 1" class="mt-1 h-full w-px flex-1 bg-line" aria-hidden="true" />
              </div>
              <div class="pb-1">
                <p class="text-sm font-medium text-ink-900">{{ step.title }}</p>
                <p class="mt-0.5 text-sm leading-6 text-ink-500">{{ step.desc }}</p>
              </div>
            </li>
          </ol>

          <p class="mt-6 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
            抢购成功仅代表已入队（result = QUEUED），订单状态需轮询至 CREATED 才算落库完成。
          </p>
        </div>
      </div>
    </section>

    <section class="page-container py-14">
      <h2 class="section-title">后端能力对齐</h2>
      <p class="mt-2 text-sm text-ink-500">以下机制直接决定前端的交互边界，页面不夸大、不臆造状态。</p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article v-for="item in capabilities" :key="item.title" class="surface-card p-5">
          <span class="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand-dark">
            <component :is="item.icon" :size="19" aria-hidden="true" />
          </span>
          <h3 class="mt-4 text-[15px] font-semibold">{{ item.title }}</h3>
          <p class="mt-1.5 text-sm leading-6 text-ink-500">{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section v-if="entries.length" class="page-container pb-14">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="section-title">模块导航</h2>
          <p class="mt-2 text-sm text-ink-500">只展示已接入的页面，未完成的模块不会以空壳形式出现。</p>
        </div>
        <RouterLink v-if="hasProducts" :to="{ name: 'products' }" class="link-underline text-sm">
          直接去商品列表
        </RouterLink>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="entry in entries"
          :key="entry.name"
          type="button"
          class="group surface-card surface-card-hover flex items-start gap-4 p-5 text-left"
          @click="router.push({ name: entry.name })"
        >
          <span
            class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark transition-colors duration-200 group-hover:bg-brand group-hover:text-white"
          >
            <component :is="entry.icon" :size="20" aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="flex items-center gap-1.5 text-[15px] font-semibold text-ink-900">
              {{ entry.label }}
              <ArrowRight
                :size="14"
                class="translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden="true"
              />
            </span>
            <span class="mt-1 block text-sm leading-6 text-ink-500">{{ entry.description }}</span>
          </span>
        </button>
      </div>
    </section>

    <section class="border-t border-line/70 bg-surface">
      <div class="page-container grid gap-8 py-12 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div>
          <h2 class="section-title">联调须知</h2>
          <dl class="mt-5 space-y-3 text-sm">
            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-ink-500">代理目标</dt>
              <dd class="num break-all text-ink-900">{{ proxyTarget }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-ink-500">会话 Cookie</dt>
              <dd class="text-ink-900">FLASH_SESSION（HttpOnly、SameSite=Strict、Path=/api）</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-ink-500">写请求</dt>
              <dd class="text-ink-900">X-CSRF-Token 与 FLASH_CSRF Cookie 必须一致</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-ink-500">管理端</dt>
              <dd class="text-ink-900">X-Admin-Token，页面令牌仅存 sessionStorage</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-xl bg-[#1f2d3d] p-5 text-[#d6e2f0] shadow-card">
          <div class="flex items-center gap-2 text-xs font-medium text-[#9db3cc]">
            <Terminal :size="14" aria-hidden="true" />
            本地命令
          </div>
          <pre class="mt-3 space-y-1 text-[13px] leading-6"><code># 需 Node 20+，本项目使用 nvm 中的 v24
{{ commands.join('\n') }}</code></pre>
          <p class="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-[#9db3cc]">
            所有业务请求都经 Vite 代理转发到网关，浏览器不直连 8084 / 8085。
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
