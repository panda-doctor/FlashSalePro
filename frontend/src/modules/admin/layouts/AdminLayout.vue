<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Store,
  Users,
  Zap,
} from 'lucide-vue-next'
import AdminTokenGate from '@/modules/admin/components/AdminTokenGate.vue'
import { useAdminTokenStore } from '@/modules/admin/store/adminToken'
import ParticleField from '@/shared/components/ParticleField.vue'

const route = useRoute()
const router = useRouter()
const adminToken = useAdminTokenStore()

const sidebarOpen = ref(false)

const items = [
  { name: 'admin-dashboard', label: '经营看板', icon: BarChart3 },
  { name: 'admin-activities', label: '活动运维', icon: Zap },
  { name: 'admin-products', label: '商品管理', icon: Package },
  { name: 'admin-orders', label: '订单管理', icon: Receipt },
  { name: 'admin-dead-letters', label: '死信管理', icon: AlertTriangle },
  { name: 'admin-users', label: '用户管理', icon: Users },
]

const visibleItems = computed(() => items.filter((item) => router.hasRoute(item.name)))
const pageTitle = computed(() => (route.meta.title as string | undefined) ?? '管理台')

function exitAdmin(): void {
  ElMessageBox.confirm('退出后需要重新输入管理端令牌，确认退出？', '退出管理台', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      adminToken.clear()
      router.push({ name: 'home' })
    })
    .catch(() => {
      // 用户取消，不处理
    })
}
</script>

<template>
  <div class="relative isolate min-h-screen bg-transparent">
    <ParticleField />

    <aside class="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col overflow-hidden border-r border-line/70 bg-[#FFFDFA] text-ink-700 lg:flex">
      <div
        class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-60 blur-[80px]"
        style="background: radial-gradient(circle, rgba(184, 84, 58, 0.16), transparent 68%)"
        aria-hidden="true"
      />

      <RouterLink :to="{ name: 'home' }" class="relative flex items-center gap-3 px-5 py-5 text-ink-900">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand text-[#FFFBF5] shadow-[0_8px_20px_rgba(184,84,58,0.24)]">
          <LayoutDashboard :size="16" aria-hidden="true" />
        </span>
        <span class="flex flex-col leading-tight">
          <span class="text-[15px] font-semibold">管理台</span>
          <span class="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-atelier-gold/80">Atelier Ops</span>
        </span>
      </RouterLink>

      <p class="relative px-5 pb-2 pt-3 text-[10px] uppercase tracking-[0.22em] text-ink-500">运营导航</p>
      <nav class="relative flex flex-1 flex-col gap-1 px-3" aria-label="管理导航">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
          active-class="!bg-brand-soft !font-medium !text-brand-dark"
        >
          <component :is="item.icon" :size="16" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="relative border-t border-line/70 p-3">
        <RouterLink
          :to="{ name: 'home' }"
          class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
        >
          <Store :size="16" aria-hidden="true" />
          返回商城
        </RouterLink>
        <button
          type="button"
          class="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
          @click="exitAdmin"
        >
          <LogOut :size="16" aria-hidden="true" />
          退出管理台
        </button>
      </div>
    </aside>

    <div class="relative z-10 lg:pl-[232px]">
      <header class="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
        <div class="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink-700 lg:hidden"
            aria-label="打开管理导航"
            @click="sidebarOpen = true"
          >
            <LayoutDashboard :size="16" />
          </button>

          <div>
            <p class="text-[10px] uppercase tracking-[0.2em] text-ink-500">Operations</p>
            <h1 class="mt-0.5 text-[15px] font-semibold">{{ pageTitle }}</h1>
          </div>

          <div class="ml-auto flex items-center gap-2">
            <span
              class="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:inline-flex"
              :class="adminToken.verifiedAt > 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-current" />
              {{ adminToken.verifiedAt > 0 ? '令牌已校验' : '令牌未校验' }}
            </span>
            <el-button text size="small" @click="exitAdmin">退出</el-button>
          </div>
        </div>
      </header>

      <main class="p-4 sm:p-6 lg:p-7">
        <AdminTokenGate>
          <RouterView />
        </AdminTokenGate>
      </main>
    </div>

    <el-drawer
      v-model="sidebarOpen"
      direction="ltr"
      size="248px"
      :with-header="false"
      class="!bg-surface"
    >
      <div class="flex min-h-[calc(100vh-40px)] flex-col">
        <div class="flex items-center gap-3 border-b border-line/70 pb-5">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand text-[#FFFBF5]">
            <LayoutDashboard :size="16" aria-hidden="true" />
          </span>
          <span class="flex flex-col leading-tight">
            <span class="text-sm font-semibold text-ink-900">管理台</span>
            <span class="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-atelier-gold/80">Atelier Ops</span>
          </span>
        </div>

        <nav class="flex flex-1 flex-col gap-1 pt-4" aria-label="管理导航">
          <RouterLink
            v-for="item in visibleItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
            active-class="bg-brand-soft font-medium text-brand-dark"
            @click="sidebarOpen = false"
          >
            <component :is="item.icon" :size="16" aria-hidden="true" />
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="mt-auto border-t border-line/70 pt-3">
          <RouterLink
            :to="{ name: 'home' }"
            class="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
            @click="sidebarOpen = false"
          >
            <Store :size="16" aria-hidden="true" />
            返回商城
          </RouterLink>
          <button
            type="button"
            class="mt-1 flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
            @click="exitAdmin"
          >
            <LogOut :size="16" aria-hidden="true" />
            退出管理台
          </button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
