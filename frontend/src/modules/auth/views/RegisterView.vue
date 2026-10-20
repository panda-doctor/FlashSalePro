<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, User, UserRound } from 'lucide-vue-next'
import AuthShell from '@/modules/auth/components/AuthShell.vue'
import { useAuthStore } from '@/modules/auth/store'
import { ApiError } from '@/shared/types/common'
import {
  createStringValidator,
  validateAccountName,
  validateConfirmPassword,
  validateDisplayName,
  validatePassword,
} from '@/shared/utils/validators'

const router = useRouter()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({
  accountName: '',
  displayName: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  accountName: [{ validator: createStringValidator(validateAccountName), trigger: 'blur' }],
  displayName: [{ validator: createStringValidator(validateDisplayName), trigger: 'blur' }],
  password: [{ validator: createStringValidator((value) => validatePassword(value, { min: 10 })), trigger: 'blur' }],
  confirmPassword: [
    {
      validator: createStringValidator((value) => validateConfirmPassword(form.password, value)),
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
      .register({
        accountName: form.accountName.trim(),
        password: form.password,
        displayName: form.displayName.trim() || undefined,
      })
      .then(() => {
        ElMessage.success('注册成功，已自动登录')
        router.replace({ name: 'home' })
      })
      .catch((error: unknown) => {
        const message = error instanceof ApiError ? error.message : '注册失败，请稍后重试'
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
      <h1 class="text-2xl font-semibold">注册</h1>
      <p class="mt-2 text-sm text-ink-500">注册成功后会直接建立会话，无需再次登录。</p>

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
            placeholder="3-32 位字母、数字、点、下划线或短横线"
            autocomplete="username"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="昵称（可选）" prop="displayName">
          <el-input
            v-model="form.displayName"
            size="large"
            placeholder="展示在右上角，最多 64 个字符"
            autocomplete="nickname"
            :prefix-icon="UserRound"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="至少 10 位，最多 72 位"
            autocomplete="new-password"
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            size="large"
            type="password"
            show-password
            placeholder="请再次输入密码"
            autocomplete="new-password"
            :prefix-icon="Lock"
            @keyup.enter="onSubmit"
          />
        </el-form-item>

        <el-button type="primary" size="large" class="mt-2 w-full" native-type="submit" :loading="submitting">
          {{ submitting ? '注册中…' : '注册并登录' }}
        </el-button>
      </el-form>

      <p class="mt-6 text-center text-sm text-ink-500">
        已有账号？
        <RouterLink :to="{ name: 'login' }" class="link-underline">返回登录</RouterLink>
      </p>
    </div>
  </AuthShell>
</template>
