<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowUp, Menu, Search } from 'lucide-vue-next'
import { useAuthStore } from '@/modules/auth/store'
import { primaryNav, type NavItem } from '@/router/nav'
import ParticleField from '@/shared/components/ParticleField.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const drawerOpen = ref(false)
const keyword = ref('')
const scrolled = ref(false)

const isImmersive = computed(() => route.meta.transparentHeader === true)
const transparent = computed(() => isImmersive.value && !scrolled.value)

const headerClass = computed(() => {
  const paint = transparent.value
    ? 'border-transparent bg-transparent'
    : 'border-line/70 bg-surface/90 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur-xl backdrop-saturate-150'
  return `fixed inset-x-0 top-0 ${paint}`
})

function hasRoute(name: string): boolean {
  return router.hasRoute(name)
}

const visibleNav = computed<NavItem[]>(() =>
  primaryNav.filter((item) => hasRoute(item.name) && (!item.requiresAuth || auth.isLoggedIn)),
)

const canSearch = computed(() => hasRoute('products'))
const initial = computed(() => (auth.displayName || '用').slice(0, 1).toUpperCase())

function isNavActive(name: string): boolean {
  if (name === 'products') return route.name === 'products' || route.name === 'product-detail'
  if (name === 'activities') return route.name === 'activities' || route.name === 'activity-detail'
  return route.name === name
}

function onScroll(): void {
  scrolled.value = window.scrollY > 24
}

function scrollToTop(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

function submitSearch(): void {
  const value = keyword.value.trim()
  if (!value) return
  router.push({ name: 'products', query: { keyword: value } })
}

function go(name: string): void {
  drawerOpen.value = false
  if (hasRoute(name)) router.push({ name })
}

function onUserCommand(command: string | number | object): void {
  if (command === 'logout') {
    auth.logout().then(() => {
      ElMessage.success('已退出登录')
      router.push({ name: 'home' })
    })
    return
  }
  if (typeof command === 'string' && hasRoute(command)) router.push({ name: command })
}

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
    onScroll()
  },
)

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="relative isolate flex min-h-screen flex-col bg-canvas">
    <ParticleField />

    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow-lift"
    >
      跳转到主内容
    </a>

    <header
      class="z-40 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-[220ms] ease-out"
      :class="headerClass"
    >
      <div class="page-container flex h-16 items-center gap-4 sm:gap-6">
        <RouterLink to="/" class="group flex shrink-0 items-center gap-2.5" aria-label="秒杀商城首页">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-brand text-white shadow-[0_6px_18px_rgba(29,78,216,0.24)] ring-1 ring-inset ring-white/25">
            <span class="text-[15px] font-bold leading-none">F</span>
          </span>
          <span class="flex flex-col leading-none">
            <span class="text-[18px] font-semibold tracking-tight text-ink-900">秒杀商城</span>
            <span class="mt-1 hidden text-[9px] uppercase tracking-[0.3em] text-ink-500 sm:block">Flash Sale</span>
          </span>
        </RouterLink>

        <nav class="hidden items-center gap-1 md:flex" aria-label="主导航">
          <RouterLink
            v-for="item in visibleNav"
            :key="item.name"
            :to="{ name: item.name }"
            class="rounded-full px-3.5 py-2 text-[13px] tracking-wide text-ink-700 transition-colors duration-200 hover:bg-brand-soft hover:text-brand-dark"
            :class="isNavActive(item.name) ? '!bg-brand-soft !font-medium !text-brand-dark' : ''"
            :aria-current="isNavActive(item.name) ? 'page' : undefined"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <form v-if="canSearch" class="hidden lg:block" role="search" @submit.prevent="submitSearch">
            <label class="sr-only" for="global-search">搜索商品</label>
            <div
              class="flex h-10 w-56 items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 transition-colors duration-200 focus-within:border-brand/45 focus-within:bg-surface"
            >
              <Search :size="15" class="shrink-0 text-ink-500" aria-hidden="true" />
              <input
                id="global-search"
                v-model="keyword"
                type="search"
                placeholder="搜索商品名称"
                class="h-full w-full border-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
              />
            </div>
          </form>

          <template v-if="auth.isLoggedIn">
            <el-dropdown trigger="click" @command="onUserCommand">
              <button
                type="button"
                class="flex items-center gap-2 rounded-full border border-line/80 bg-surface py-1 pl-1 pr-3 text-sm text-ink-700 transition-colors duration-200 hover:border-brand/40 hover:text-ink-900"
              >
                <span class="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">
                  {{ initial }}
                </span>
                <span class="max-w-28 truncate">{{ auth.displayName }}</span>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile" :disabled="!hasRoute('profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item command="orders" :disabled="!hasRoute('orders')">我的订单</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <RouterLink
              v-if="hasRoute('login')"
              :to="{ name: 'login' }"
              class="hidden min-h-11 items-center rounded-full px-3 text-sm text-ink-700 transition-colors hover:text-brand-dark sm:inline-flex"
            >
              登录
            </RouterLink>
            <RouterLink
              v-if="hasRoute('register')"
              :to="{ name: 'register' }"
              class="inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-xs font-medium tracking-wide text-white shadow-[0_8px_18px_rgba(29,78,216,0.24)] transition-all duration-200 hover:bg-brand-dark active:scale-[0.98]"
            >
              注册
            </RouterLink>
          </template>

          <button
            type="button"
            class="grid h-11 w-11 place-items-center rounded-full border border-line text-ink-700 transition-colors duration-200 hover:bg-brand-soft md:hidden"
            aria-label="打开导航菜单"
            @click="drawerOpen = true"
          >
            <Menu :size="18" />
          </button>
        </div>
      </div>
    </header>

    <main id="main-content" class="relative z-10 flex-1" :class="isImmersive ? '' : 'pt-16'">
      <RouterView />
    </main>

    <footer class="relative z-10 overflow-hidden border-t border-line bg-[#F8FAFC]/90 text-ink-500 backdrop-blur-xl">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-24 -top-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-[110px]"
        style="background: radial-gradient(circle, rgba(29, 78, 216, 0.14), rgba(29, 78, 216, 0) 68%)"
        aria-hidden="true"
      />
      <div class="page-container relative grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <RouterLink to="/" class="inline-flex items-center gap-2.5" aria-label="秒杀商城首页">
            <span class="grid h-10 w-10 place-items-center rounded-full border border-line text-brand-dark">
              <span class="font-display text-[15px] leading-none font-bold">F</span>
            </span>
            <span class="font-display text-lg font-bold tracking-wide text-ink-900">秒杀商城</span>
          </RouterLink>
          <p class="mt-5 max-w-xs text-xl font-bold leading-8 text-ink-900">为稀缺时刻而生。</p>
          <p class="mt-3 max-w-xs text-sm leading-6 text-ink-500">
            真实商品、限时活动与可追溯的订单轨迹，克制的界面只保留必要的信息。
          </p>
        </div>

        <div>
          <h3 class="text-[11px] uppercase tracking-[0.24em] text-brand-dark">探索</h3>
          <ul class="mt-4 space-y-3 text-sm">
            <li v-if="hasRoute('products')">
              <RouterLink to="/products" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">在售商品</RouterLink>
            </li>
            <li v-if="hasRoute('activities')">
              <RouterLink to="/activities" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">限时活动</RouterLink>
            </li>
            <li v-if="hasRoute('ai-support')">
              <RouterLink to="/ai-support" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">AI 客服</RouterLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-[11px] uppercase tracking-[0.24em] text-brand-dark">账户</h3>
          <ul class="mt-4 space-y-3 text-sm">
            <template v-if="auth.isLoggedIn">
              <li><RouterLink to="/orders" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">我的订单</RouterLink></li>
              <li><RouterLink to="/profile" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">个人中心</RouterLink></li>
            </template>
            <template v-else>
              <li><RouterLink to="/login" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">登录</RouterLink></li>
              <li><RouterLink to="/register" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">创建账户</RouterLink></li>
            </template>
          </ul>
        </div>

        <div>
          <h3 class="text-[11px] uppercase tracking-[0.24em] text-brand-dark">服务</h3>
          <ul class="mt-4 space-y-3 text-sm">
            <li v-if="hasRoute('admin')">
              <RouterLink to="/admin" class="inline-flex min-h-11 items-center text-ink-500 transition-colors hover:text-brand-dark">管理台</RouterLink>
            </li>
            <li>
              <button type="button" class="inline-flex min-h-11 items-center gap-1.5 transition-colors hover:text-brand-dark" @click="scrollToTop">
                <ArrowUp :size="13" aria-hidden="true" />
                返回顶部
              </button>
            </li>
          </ul>
          <p class="mt-5 text-xs leading-5 text-ink-500">商品价格、库存与活动时间以页面实时数据为准。</p>
        </div>
      </div>

      <div class="relative border-t border-line/80">
        <div class="page-container flex flex-col gap-2 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 秒杀商城 · FlashSale</p>
          <p class="uppercase tracking-[0.2em]">Warm drops, precise execution.</p>
        </div>
      </div>
    </footer>

    <el-drawer
      v-model="drawerOpen"
      direction="rtl"
      size="300px"
      :with-header="false"
      class="!bg-surface"
    >
      <div class="flex h-full flex-col gap-2 pt-2">
        <p class="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-ink-500">导航</p>
        <RouterLink
          v-for="item in visibleNav"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
          :active-class="'bg-brand-soft font-medium text-brand-dark'"
          @click="drawerOpen = false"
        >
          <component :is="item.icon" :size="17" />
          {{ item.label }}
        </RouterLink>
        <div class="mt-auto flex flex-col gap-2 border-t border-line/70 pt-4">
          <button
            v-if="!auth.isLoggedIn"
            type="button"
            class="min-h-11 rounded-xl px-3 text-left text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
            @click="go('login')"
          >
            登录
          </button>
          <button
            v-if="!auth.isLoggedIn"
            type="button"
            class="min-h-11 rounded-xl bg-brand px-3 text-left text-sm font-medium text-white"
            @click="go('register')"
          >
            注册
          </button>
          <button
            v-else
            type="button"
            class="min-h-11 rounded-xl px-3 text-left text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
            @click="onUserCommand('logout')"
          >
            退出登录
          </button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
