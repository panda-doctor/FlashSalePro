<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, User } from 'lucide-vue-next'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/types/common'
import { createStringValidator, resolveRedirect, validateAccountName } from '@/utils/validators'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({ accountName: '', password: '' })

const rules: FormRules = {
  accountName: [{ validator: createStringValidator(validateAccountName), trigger: 'blur' }],
  password: [
    {
      validator: createStringValidator((value) => {
        if (!value) return '请输入密码'
        if (value.length > 72) return '密码最多 72 位'
        return null
      }),
      trigger: 'blur',
    },
  ],
}

function onSubmit(): void {
  if (!formRef.value || submitting.value) return

  formRef.value.validate((valid) => {
    if (!valid) return

    submitting.value = true
    auth
      .login({ accountName: form.accountName.trim(), password: form.password })
      .then(() => {
        ElMessage.success('登录成功')
        router.replace(resolveRedirect(route.query.redirect))
      })
      .catch((error: unknown) => {
        const message = error instanceof ApiError ? error.message : '登录失败，请稍后重试'
        ElMessage.error(message)
      })
      .finally(() => {
        submitting.value = false
      })
  })
}
</script>

<template>
  <AuthShell>
    <div class="mx-auto w-full max-w-sm">
      <h1 class="text-2xl font-semibold">登录</h1>
      <p class="mt-2 text-sm text-ink-500">使用账号密码登录，成功后自动获取 CSRF 令牌。</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="mt-8"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="账号" prop="accountName">
          <el-input
            v-model="form.accountName"
            size="large"
            placeholder="例如 flash_user"
            autocomplete="username"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="请输入密码"
            autocomplete="current-password"
            :prefix-icon="Lock"
            @keyup.enter="onSubmit"
          />
        </el-form-item>

        <el-button type="primary" size="large" class="mt-2 w-full" native-type="submit" :loading="submitting">
          {{ submitting ? '登录中…' : '登录' }}
        </el-button>
      </el-form>

      <p class="mt-6 text-center text-sm text-ink-500">
        还没有账号？
        <RouterLink :to="{ name: 'register' }" class="link-underline">立即注册</RouterLink>
      </p>

      <p class="mt-8 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
        连续 5 次密码错误会锁定该账号 15 分钟，这是后端登录保护策略，前端不做绕过。
      </p>
    </div>
  </AuthShell>
</template>
