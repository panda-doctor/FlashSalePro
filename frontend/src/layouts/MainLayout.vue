<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Menu, Search, Zap } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { primaryNav, type NavItem } from '@/router/nav'

const router = useRouter()
const auth = useAuthStore()

const drawerOpen = ref(false)
const keyword = ref('')

function hasRoute(name: string): boolean {
  return router.hasRoute(name)
}

const visibleNav = computed<NavItem[]>(() =>
  primaryNav.filter((item) => hasRoute(item.name) && (!item.requiresAuth || auth.isLoggedIn)),
)

const canSearch = computed(() => hasRoute('products'))
const initial = computed(() => (auth.displayName || '用').slice(0, 1).toUpperCase())

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
</script>

<template>
  <div class="flex min-h-screen flex-col bg-canvas">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow-lift"
    >
      跳转到主内容
    </a>

    <header class="fixed inset-x-0 top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur">
      <div class="page-container flex h-16 items-center gap-4 sm:gap-6">
        <RouterLink to="/" class="group flex shrink-0 items-center gap-2" aria-label="秒杀商城首页">
          <span
            class="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
          >
            <Zap :size="18" :stroke-width="2.4" />
          </span>
          <span class="text-[17px] font-semibold tracking-tight">秒杀商城</span>
        </RouterLink>

        <nav class="hidden items-center gap-1 md:flex" aria-label="主导航">
          <RouterLink
            v-for="item in visibleNav"
            :key="item.name"
            :to="{ name: item.name }"
            class="nav-link"
            active-class="nav-link-active"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <form v-if="canSearch" class="hidden lg:block" role="search" @submit.prevent="submitSearch">
            <label class="sr-only" for="global-search">搜索商品</label>
            <div
              class="flex h-9 w-64 items-center gap-2 rounded-full border border-line bg-muted/70 px-3 transition-colors focus-within:border-brand focus-within:bg-surface"
            >
              <Search :size="15" class="shrink-0 text-ink-500" aria-hidden="true" />
              <input
                id="global-search"
                v-model="keyword"
                type="search"
                placeholder="搜索商品名称"
                class="h-full w-full border-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
              />
            </div>
          </form>

          <template v-if="auth.isLoggedIn">
            <el-dropdown trigger="click" @command="onUserCommand">
              <button
                type="button"
                class="flex items-center gap-2 rounded-full border border-line/80 bg-surface py-1 pl-1 pr-3 text-sm text-ink-700 transition-colors hover:border-brand/50 hover:text-brand"
              >
                <span
                  class="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark"
                >
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
              class="hidden rounded-lg px-3 py-2 text-sm text-ink-700 transition-colors hover:text-brand sm:block"
            >
              登录
            </RouterLink>
            <RouterLink
              v-if="hasRoute('register')"
              :to="{ name: 'register' }"
              class="rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              注册
            </RouterLink>
          </template>

          <button
            type="button"
            class="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-700 transition-colors hover:border-brand/50 hover:text-brand md:hidden"
            aria-label="打开导航菜单"
            @click="drawerOpen = true"
          >
            <Menu :size="18" />
          </button>
        </div>
      </div>
    </header>

    <main id="main-content" class="flex-1 pt-16">
      <RouterView />
    </main>

    <footer class="border-t border-line/70 bg-surface">
      <div class="page-container flex flex-col gap-2 py-6 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <p>秒杀商城 · Vue 3 + Element Plus · 接口事实源来自 Spring Cloud 后端</p>
        <p class="num">网关 :8090 ｜ 同源代理 ｜ Cookie SameSite=Strict</p>
      </div>
    </footer>

    <el-drawer v-model="drawerOpen" direction="rtl" size="268px" :with-header="false">
      <div class="flex h-full flex-col gap-2 pt-2">
        <p class="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-ink-500">导航</p>
        <RouterLink
          v-for="item in visibleNav"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-link flex items-center gap-3"
          active-class="nav-link-active"
          @click="drawerOpen = false"
        >
          <component :is="item.icon" :size="17" />
          {{ item.label }}
        </RouterLink>
        <div class="mt-auto flex flex-col gap-2 border-t border-line/70 pt-4">
          <button v-if="!auth.isLoggedIn" type="button" class="nav-link text-left" @click="go('login')">登录</button>
          <button v-if="!auth.isLoggedIn" type="button" class="nav-link text-left" @click="go('register')">
            注册
          </button>
          <button v-else type="button" class="nav-link text-left" @click="onUserCommand('logout')">退出登录</button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
