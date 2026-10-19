<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { KeyRound, ShieldAlert } from 'lucide-vue-next'
import { listAdminUsers } from '@/api/auth'
import { useAdminTokenStore } from '@/stores/adminToken'
import { ApiError } from '@/types/common'

const adminToken = useAdminTokenStore()

const input = ref(adminToken.token)
const verifying = ref(false)
const errorMessage = ref('')

/** 用管理端用户列表做令牌探活：端点轻量且必然经过 X-Admin-Token 双重校验 */
function verify(): void {
  if (!input.value.trim() || verifying.value) return

  verifying.value = true
  errorMessage.value = ''
  adminToken.setToken(input.value)

  listAdminUsers({ page: 1, pageSize: 1 })
    .then(() => {
      adminToken.markVerified()
      ElMessage.success('管理端令牌校验通过')
    })
    .catch((error: unknown) => {
      adminToken.clear()
      errorMessage.value =
        error instanceof ApiError ? error.message : '无法连接后端，请确认网关 8090 已启动'
    })
    .finally(() => {
      verifying.value = false
    })
}

onMounted(() => {
  if (adminToken.hasToken && adminToken.verifiedAt === 0) verify()
})
</script>

<template>
  <slot v-if="adminToken.verifiedAt > 0" />

  <div v-else class="flex min-h-[60vh] items-center justify-center py-10">
    <div class="surface-card w-full max-w-md p-6 sm:p-8">
      <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-dark">
        <KeyRound :size="20" aria-hidden="true" />
      </span>

      <h1 class="mt-4 text-xl font-semibold">管理端访问令牌</h1>
      <p class="mt-2 text-sm leading-6 text-ink-500">
        管理接口需要在请求头携带 <code class="rounded bg-muted px-1 py-0.5 text-xs">X-Admin-Token</code>。
        令牌仅保存在当前标签页的 sessionStorage，关闭后失效。
      </p>

      <form class="mt-6" @submit.prevent="verify">
        <label for="admin-token" class="mb-1 block text-xs text-ink-500">令牌</label>
        <el-input
          id="admin-token"
          v-model="input"
          type="password"
          show-password
          size="large"
          placeholder="输入后端配置的 ADMIN_TOKEN"
          autocomplete="off"
        />
        <p v-if="errorMessage" class="mt-2 flex items-start gap-1.5 text-xs text-danger" role="alert">
          <ShieldAlert :size="14" class="mt-0.5 shrink-0" aria-hidden="true" />
          {{ errorMessage }}
        </p>
        <el-button
          type="primary"
          size="large"
          class="mt-4 w-full"
          native-type="submit"
          :loading="verifying"
        >
          {{ verifying ? '校验中…' : '校验并进入' }}
        </el-button>
      </form>

      <p class="mt-4 text-xs leading-5 text-ink-500">
        令牌由后端环境变量 ADMIN_TOKEN 配置；若后端未配置，所有管理接口都会返回“管理端访问令牌未配置”。
      </p>
    </div>
  </div>
</template>
