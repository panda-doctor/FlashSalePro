<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search } from 'lucide-vue-next'
import ProductImage from '@/components/product/ProductImage.vue'
import { listProducts } from '@/api/product'
import { ApiError } from '@/types/common'
import type { ActivityRequest, SeckillActivityVO } from '@/types/activity'
import type { ProductVO } from '@/types/product'
import { fenToYuan, formatPrice, yuanToFen } from '@/utils/money'

const props = withDefaults(
  defineProps<{ initial?: SeckillActivityVO | null; productName?: string; submitting?: boolean }>(),
  { initial: null, productName: '', submitting: false },
)

const emit = defineEmits<{ submit: [ActivityRequest]; cancel: [] }>()

const formRef = ref<FormInstance>()
const form = reactive({
  productId: props.initial?.productId ?? null,
  activityName: props.initial?.activityName ?? '',
  startTime: props.initial?.startTime ?? '',
  endTime: props.initial?.endTime ?? '',
  priceYuan: props.initial ? fenToYuan(props.initial.seckillPrice) : '',
  seckillStock: props.initial?.totalStock ?? 1,
})

const selectedProductName = ref(props.productName)

const pickerOpen = ref(false)
const pickerKeyword = ref('')
const pickerLoading = ref(false)
const pickerItems = ref<ProductVO[]>([])

const rules: FormRules = {
  productId: [
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        const numeric = Number(value)
        if (!Number.isInteger(numeric) || numeric <= 0) return callback(new Error('请选择商品'))
        return callback()
      },
      trigger: 'change',
    },
  ],
  activityName: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        const end = typeof value === 'string' ? value : ''
        if (end && form.startTime && end <= form.startTime) {
          return callback(new Error('结束时间必须晚于开始时间'))
        }
        return callback()
      },
      trigger: 'change',
    },
  ],
  priceYuan: [
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        const text = typeof value === 'string' ? value.trim() : ''
        if (!text) return callback(new Error('请输入秒杀价'))
        const numeric = Number(text)
        if (!Number.isFinite(numeric) || numeric < 0) return callback(new Error('秒杀价必须为不小于 0 的数字'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
  seckillStock: [
    {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        const numeric = Number(value)
        if (!Number.isInteger(numeric) || numeric < 1) return callback(new Error('秒杀库存必须是大于 0 的整数'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
}

function searchProducts(): void {
  pickerLoading.value = true
  listProducts({ page: 1, pageSize: 20, keyword: pickerKeyword.value.trim() })
    .then((response) => {
      pickerItems.value = response.records
    })
    .catch((error: unknown) => {
      pickerItems.value = []
      ElMessage.error(error instanceof ApiError ? error.message : '商品查询失败')
    })
    .finally(() => {
      pickerLoading.value = false
    })
}

function openPicker(): void {
  pickerOpen.value = true
  searchProducts()
}

function selectProduct(product: ProductVO): void {
  form.productId = product.productId
  selectedProductName.value = product.name
  pickerOpen.value = false
  formRef.value?.validateField('productId').catch(() => undefined)
}

function onSubmit(): void {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (!valid) return

    emit('submit', {
      activityId: props.initial?.activityId,
      productId: Number(form.productId),
      activityName: form.activityName.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      seckillPrice: yuanToFen(form.priceYuan),
      seckillStock: form.seckillStock,
      // 后端 @Min(1) @Max(1)：一人一单是业务硬约束
      limitPerUser: 1,
    })
  })
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="关联商品" prop="productId">
      <div class="flex w-full flex-wrap items-center gap-2">
        <div class="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm">
          <span v-if="form.productId" class="truncate">
            {{ selectedProductName || `商品 ${form.productId}` }}
            <span class="num ml-1 text-xs text-ink-500">#{{ form.productId }}</span>
          </span>
          <span v-else class="text-ink-300">尚未选择商品</span>
        </div>
        <el-button @click="openPicker">选择商品</el-button>
      </div>
    </el-form-item>

    <el-form-item label="活动名称" prop="activityName">
      <el-input v-model="form.activityName" placeholder="例如 双十一 0 点场 · 冷萃咖啡礼盒" />
    </el-form-item>

    <div class="grid gap-4 sm:grid-cols-2">
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="form.startTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择开始时间"
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="form.endTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择结束时间"
          class="w-full"
        />
      </el-form-item>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <el-form-item label="秒杀价（元）" prop="priceYuan">
        <el-input v-model="form.priceYuan" placeholder="例如 79.90">
          <template #prefix>¥</template>
        </el-input>
      </el-form-item>
      <el-form-item label="秒杀库存" prop="seckillStock">
        <el-input-number v-model="form.seckillStock" :min="1" :step="1" class="w-full" />
      </el-form-item>
    </div>

    <el-form-item label="每人限购">
      <el-input model-value="1" disabled />
      <p class="mt-1 text-xs leading-5 text-ink-500">
        后端固定一人一单（@Min(1) @Max(1) + 订单唯一键），前端不允许修改。
      </p>
    </el-form-item>

    <p class="mb-4 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-ink-500">
      时间以 GMT+8 直传，格式固定为 yyyy-MM-dd HH:mm:ss；创建后需在“运维与指标”中预热才会写入 Redis 库存。
    </p>

    <div class="flex justify-end gap-2">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">
        {{ initial ? '保存修改' : '创建活动' }}
      </el-button>
    </div>
  </el-form>

  <el-dialog v-model="pickerOpen" title="选择商品" width="min(640px, 92vw)" destroy-on-close>
    <form class="flex gap-2" @submit.prevent="searchProducts">
      <el-input v-model="pickerKeyword" placeholder="按名称搜索上架商品">
        <template #prefix>
          <Search :size="15" aria-hidden="true" />
        </template>
      </el-input>
      <el-button native-type="submit" :loading="pickerLoading">搜索</el-button>
    </form>

    <div class="mt-3 max-h-80 overflow-auto">
      <div v-if="pickerLoading" class="space-y-2 p-2">
        <div v-for="index in 4" :key="index" class="h-14 animate-pulse rounded bg-muted" />
      </div>
      <ul v-else-if="pickerItems.length" class="divide-y divide-line/60">
        <li v-for="item in pickerItems" :key="item.productId" class="flex items-center gap-3 py-2.5">
          <div class="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-line">
            <ProductImage :src="item.imageUrl" :alt="item.name" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-ink-900">{{ item.name }}</p>
            <p class="num text-xs text-ink-500">
              {{ formatPrice(item.originalPrice) }} · 总库存 {{ item.totalStock }}
            </p>
          </div>
          <el-button size="small" @click="selectProduct(item)">选择</el-button>
        </li>
      </ul>
      <p v-else class="py-8 text-center text-sm text-ink-500">没有匹配的上架商品</p>
    </div>
  </el-dialog>
</template>
