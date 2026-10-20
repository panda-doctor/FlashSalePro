<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from 'lucide-vue-next'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import { uploadProductImage } from '@/modules/product/api'
import { ApiError } from '@/shared/types/common'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

/** 与后端 AbstractImageStorage.ALLOWED_EXT 对齐（按扩展名校验） */
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jfif',
  'image/gif',
  'image/webp',
  'image/bmp',
]
/** product 服务 multipart 已配置为 5MB，与业务层 MAX_IMAGE_SIZE 保持一致 */
const MAX_SIZE = 5 * 1024 * 1024

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
    ElMessage.error('仅支持 PNG / JPEG / GIF / WebP / BMP')
    return
  }
  if (file.size > MAX_SIZE) {
    ElMessage.error('图片不能超过 5MB')
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
          accept=".png,.jpg,.jpeg,.jfif,.gif,.webp,.bmp,image/png,image/jpeg,image/gif,image/webp,image/bmp"
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
          支持 PNG / JPEG / GIF / WebP / BMP，单张 ≤5MB；超出会被服务端以 413 拒绝。
        </p>
      </div>
    </div>
  </div>
</template>
