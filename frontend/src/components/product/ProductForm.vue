<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import ImageUploader from '@/components/admin/ImageUploader.vue'
import type { ProductRequest, ProductStatus, ProductVO } from '@/types/product'
import { fenToYuan, yuanToFen } from '@/utils/money'

const props = withDefaults(
  defineProps<{ initial?: ProductVO | null; submitting?: boolean }>(),
  { initial: null, submitting: false },
)

const emit = defineEmits<{ submit: [ProductRequest]; cancel: [] }>()

const formRef = ref<FormInstance>()

const form = reactive({
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
  imageUrl: props.initial?.imageUrl ?? '',
  priceYuan: props.initial ? fenToYuan(props.initial.originalPrice) : '',
  totalStock: props.initial?.totalStock ?? 1,
  status: (props.initial?.status ?? 'ON_SHELF') as ProductStatus,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  priceYuan: [
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        const text = typeof value === 'string' ? value.trim() : ''
        if (!text) return callback(new Error('请输入原价'))
        const numeric = Number(text)
        if (!Number.isFinite(numeric) || numeric < 0) return callback(new Error('原价必须为不小于 0 的数字'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
  totalStock: [
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        const numeric = Number(value)
        if (!Number.isInteger(numeric) || numeric < 1) return callback(new Error('总库存必须是大于 0 的整数'))
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
      productId: props.initial?.productId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      originalPrice: yuanToFen(form.priceYuan),
      totalStock: form.totalStock,
      status: form.status,
    })
  })
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="商品名称" prop="name">
      <el-input v-model="form.name" placeholder="例如 冷萃咖啡礼盒 12 瓶装" maxlength="120" show-word-limit />
    </el-form-item>

    <el-form-item label="商品描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        placeholder="描述卖点、规格或适用场景"
      />
    </el-form-item>

    <el-form-item prop="imageUrl">
      <ImageUploader v-model="form.imageUrl" />
    </el-form-item>

    <div class="grid gap-4 sm:grid-cols-2">
      <el-form-item label="原价（元）" prop="priceYuan">
        <el-input v-model="form.priceYuan" placeholder="例如 199.00">
          <template #prefix>¥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="总库存" prop="totalStock">
        <el-input-number v-model="form.totalStock" :min="1" :step="1" class="w-full" />
      </el-form-item>
    </div>

    <el-form-item label="上架状态" prop="status">
      <el-radio-group v-model="form.status">
        <el-radio value="ON_SHELF">上架</el-radio>
        <el-radio value="OFF_SHELF">下架</el-radio>
      </el-radio-group>
    </el-form-item>

    <p class="mb-4 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
      价格按「分」存储：填写 199.00 元，实际提交 originalPrice = 19900。
    </p>

    <div class="flex justify-end gap-2">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
    </div>
  </el-form>
</template>
