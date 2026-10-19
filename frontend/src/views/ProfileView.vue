<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { LogOut, ReceiptText, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/time'
import { userStatusLabel, userStatusTagType } from '@/utils/dict'

const router = useRouter()
const auth = useAuthStore()
const signingOut = ref(false)

const profile = computed(() => auth.user)
const initial = computed(() => (auth.displayName || '用').slice(0, 1).toUpperCase())
const canViewOrders = computed(() => router.hasRoute('orders'))

function onLogout(): void {
  signingOut.value = true
  auth
    .logout()
    .then(() => {
      ElMessage.success('已退出登录')
      router.push({ name: 'home' })
    })
    .finally(() => {
      signingOut.value = false
    })
}
</script>

<template>
  <div class="page-container py-10">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">个人中心</h1>
      <p class="mt-1 text-sm text-ink-500">账号信息来自 GET /api/auth/me，退出后会话立即撤销。</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
      <section class="surface-card p-6">
        <div class="flex items-center gap-4">
          <span class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-xl font-semibold text-brand-dark">
            {{ initial }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold">{{ auth.displayName }}</p>
            <p class="mt-0.5 truncate text-sm text-ink-500">@{{ profile?.accountName }}</p>
          </div>
        </div>

        <el-tag
          v-if="profile"
          class="mt-5"
          :type="userStatusTagType(profile.status)"
          size="small"
          effect="light"
        >
          {{ userStatusLabel(profile.status) }}
        </el-tag>

        <div class="mt-6 flex flex-col gap-2">
          <el-button v-if="canViewOrders" @click="router.push({ name: 'orders' })">
            <ReceiptText :size="15" class="mr-1.5" aria-hidden="true" />
            我的订单
          </el-button>
          <el-button :loading="signingOut" @click="onLogout">
            <LogOut :size="15" class="mr-1.5" aria-hidden="true" />
            退出登录
          </el-button>
        </div>
      </section>

      <section class="surface-card p-6">
        <h2 class="flex items-center gap-2 text-[15px] font-semibold">
          <ShieldCheck :size="17" class="text-brand" aria-hidden="true" />
          账号资料
        </h2>

        <dl v-if="profile" class="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-ink-500">用户 ID</dt>
            <dd class="num mt-1 text-sm text-ink-900">{{ profile.id }}</dd>
          </div>
          <div>
            <dt class="text-xs text-ink-500">账号</dt>
            <dd class="mt-1 text-sm text-ink-900">{{ profile.accountName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-ink-500">昵称</dt>
            <dd class="mt-1 text-sm text-ink-900">{{ profile.displayName || '未设置' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-ink-500">注册时间</dt>
            <dd class="num mt-1 text-sm text-ink-900">{{ formatDateTime(profile.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-ink-500">账号状态</dt>
            <dd class="mt-1 text-sm text-ink-900">{{ userStatusLabel(profile.status) }}</dd>
          </div>
        </dl>

        <el-empty v-else description="未获取到账号信息" />

        <p class="mt-6 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
          密码修改不在用户端开放：后端仅提供管理端 PUT /api/admin/users/{userId}，用户端没有改密接口。
        </p>
      </section>
    </div>
  </div>
</template>
