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
  <div class="min-h-screen bg-canvas">
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col bg-[#1f2d3d] text-white/80 lg:flex">
      <RouterLink :to="{ name: 'home' }" class="flex items-center gap-2 px-5 py-5 text-white">
        <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand">
          <LayoutDashboard :size="16" aria-hidden="true" />
        </span>
        <span class="text-[15px] font-semibold">管理台</span>
      </RouterLink>

      <nav class="mt-2 flex flex-1 flex-col gap-1 px-3" aria-label="管理导航">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/10 hover:text-white"
          active-class="bg-brand text-white"
        >
          <component :is="item.icon" :size="16" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-white/10 p-3">
        <RouterLink
          :to="{ name: 'home' }"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10 hover:text-white"
        >
          <Store :size="16" aria-hidden="true" />
          返回商城
        </RouterLink>
        <button
          type="button"
          class="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10 hover:text-white"
          @click="exitAdmin"
        >
          <LogOut :size="16" aria-hidden="true" />
          退出管理台
        </button>
      </div>
    </aside>

    <div class="lg:pl-[220px]">
      <header class="sticky top-0 z-30 border-b border-line/70 bg-surface/95 backdrop-blur">
        <div class="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            class="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-700 lg:hidden"
            aria-label="打开管理导航"
            @click="sidebarOpen = true"
          >
            <LayoutDashboard :size="16" />
          </button>

          <h1 class="text-[15px] font-semibold">{{ pageTitle }}</h1>

          <div class="ml-auto flex items-center gap-2">
            <span
              class="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:inline-flex"
              :class="adminToken.verifiedAt > 0 ? 'bg-[#F0F9EB] text-success' : 'bg-[#FDF6EC] text-warning'"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-current" />
              {{ adminToken.verifiedAt > 0 ? '令牌已校验' : '令牌未校验' }}
            </span>
            <el-button text size="small" @click="exitAdmin">退出</el-button>
          </div>
        </div>
      </header>

      <main class="p-4 sm:p-6">
        <AdminTokenGate>
          <RouterView />
        </AdminTokenGate>
      </main>
    </div>

    <el-drawer v-model="sidebarOpen" direction="ltr" size="240px" :with-header="false">
      <nav class="flex flex-col gap-1 pt-2" aria-label="管理导航">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-soft hover:text-brand-dark"
          active-class="bg-brand-soft font-medium text-brand-dark"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" :size="16" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </el-drawer>
  </div>
</template>
