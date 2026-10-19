<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { AdminUserFormPayload, UserProfile, UserStatus } from '@/types/auth'
import {
  createStringValidator,
  validateAccountName,
  validateDisplayName,
  validatePassword,
} from '@/utils/validators'

const props = withDefaults(
  defineProps<{ initial?: UserProfile | null; submitting?: boolean }>(),
  { initial: null, submitting: false },
)

const emit = defineEmits<{ submit: [AdminUserFormPayload]; cancel: [] }>()

const isEdit = Boolean(props.initial)
const formRef = ref<FormInstance>()

const form = reactive({
  accountName: props.initial?.accountName ?? '',
  displayName: props.initial?.displayName ?? '',
  password: '',
  status: (props.initial?.status === 0 ? 0 : 1) as UserStatus,
})

const rules: FormRules = {
  accountName: [
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        if (isEdit) return callback()
        const message = validateAccountName(typeof value === 'string' ? value : '')
        if (message) return callback(new Error(message))
        return callback()
      },
      trigger: 'blur',
    },
  ],
  displayName: [{ validator: createStringValidator(validateDisplayName), trigger: 'blur' }],
  password: [
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        const text = typeof value === 'string' ? value : ''
        if (!text) {
          if (isEdit) return callback()
          return callback(new Error('请输入初始密码'))
        }
        const message = validatePassword(text, { min: 10 })
        if (message) return callback(new Error(message))
        return callback()
      },
      trigger: 'blur',
    },
  ],
}

function onSubmit(): void {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (!valid) return

    emit('submit', {
      accountName: form.accountName.trim(),
      password: form.password || undefined,
      displayName: form.displayName.trim() || undefined,
      status: isEdit ? form.status : undefined,
    })
  })
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="账号" prop="accountName">
      <el-input
        v-model="form.accountName"
        :disabled="isEdit"
        placeholder="3-32 位字母、数字、点、下划线或短横线"
        autocomplete="off"
      />
      <p v-if="isEdit" class="mt-1 text-xs text-ink-500">账号创建后不可修改（后端 PUT 不接收 accountName）。</p>
    </el-form-item>

    <el-form-item label="昵称" prop="displayName">
      <el-input v-model="form.displayName" placeholder="最多 64 个字符，可留空" />
    </el-form-item>

    <el-form-item :label="isEdit ? '重置密码（可选）' : '初始密码'" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        autocomplete="new-password"
        :placeholder="isEdit ? '留空表示不修改密码' : '至少 10 位，最多 72 位'"
      />
    </el-form-item>

    <el-form-item v-if="isEdit" label="账号状态">
      <el-radio-group v-model="form.status">
        <el-radio :value="1">正常</el-radio>
        <el-radio :value="0">禁用</el-radio>
      </el-radio-group>
    </el-form-item>

    <p class="mb-4 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
      删除为软删除（写入 deleted_at），账号名不会被释放。
    </p>

    <div class="flex justify-end gap-2">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">
        {{ isEdit ? '保存修改' : '创建用户' }}
      </el-button>
    </div>
  </el-form>
</template>
