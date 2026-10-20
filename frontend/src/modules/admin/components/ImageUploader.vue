<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from 'lucide-vue-next'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import { uploadProductImage } from '@/modules/product/api'
import { ApiError } from '@/shared/types/common'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
/** product 服务未配置 spring.servlet.multipart，Boot 默认 1MB；异常提示里的 6MB 与实际不符 */
const MAX_SIZE = 1024 * 1024

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const url = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    ElMessage.error('仅支持 PNG / JPEG / WebP')
    return
  }
  if (file.size > MAX_SIZE) {
    ElMessage.error('图片不能超过 1MB：后端 product 服务使用 Boot 默认 multipart 限制')
    return
  }

  uploading.value = true
  uploadProductImage(file)
    .then((result) => {
      url.value = result.url
      ElMessage.success(result.storageType === 'oss' ? '已上传到 OSS' : '已保存到本地 uploads')
    })
    .catch((error: unknown) => {
      ElMessage.error(error instanceof ApiError ? error.message : '图片上传失败')
    })
    .finally(() => {
      uploading.value = false
    })
}
</script>

<template>
  <div>
    <label class="mb-1 block text-xs text-ink-500" for="product-image-url">商品图片</label>

    <div class="flex gap-3">
      <div class="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line">
        <ProductImage :src="modelValue" alt="商品图片预览" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <el-button size="small" :loading="uploading" @click="fileInput?.click()">
            <Upload :size="13" class="mr-1" aria-hidden="true" />
            {{ uploading ? '上传中…' : '选择图片' }}
          </el-button>
          <el-button v-if="modelValue" size="small" text @click="url = ''">清除</el-button>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="hidden"
          @change="onFileChange"
        />

        <el-input
          id="product-image-url"
          v-model="url"
          size="small"
          class="mt-2"
          placeholder="也可直接填写图片地址，如 /uploads/xxx.png"
        />

        <p class="mt-1 text-xs leading-5 text-ink-500">
          支持 PNG / JPEG / WebP，单张 ≤1MB；超出会被服务端以 413 拒绝。
        </p>
      </div>
    </div>
  </div>
</template>
