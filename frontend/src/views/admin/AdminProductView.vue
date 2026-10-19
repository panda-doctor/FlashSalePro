<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit3, Plus, Search } from 'lucide-vue-next'
import ProductForm from '@/components/product/ProductForm.vue'
import ProductImage from '@/components/product/ProductImage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getAdminProduct, saveAdminProduct } from '@/api/product'
import { ApiError } from '@/types/common'
import type { ProductRequest, ProductVO } from '@/types/product'
import { formatPrice } from '@/utils/money'

const searchId = ref('')
const product = ref<ProductVO | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const dialogOpen = ref(false)
const editing = ref<ProductVO | null>(null)
const saving = ref(false)

function loadProduct(): void {
  const id = searchId.value.trim()
  if (!id) {
    product.value = null
    errorMessage.value = '请输入商品 ID'
    return
  }

  loading.value = true
  errorMessage.value = ''

  getAdminProduct(id)
    .then((data) => {
      product.value = data
    })
    .catch((error: unknown) => {
      product.value = null
      errorMessage.value = error instanceof ApiError ? error.message : '商品查询失败'
    })
    .finally(() => {
      loading.value = false
    })
}

function openCreate(): void {
  editing.value = null
  dialogOpen.value = true
}

function openEdit(): void {
  if (!product.value) return
  editing.value = product.value
  dialogOpen.value = true
}

function onSubmit(payload: ProductRequest): void {
  saving.value = true

  saveAdminProduct(payload)
    .then((result) => {
      ElMessage.success(payload.productId ? '商品已更新' : '商品已创建')
      // 该接口是唯一返回字符串 productId 的端点
      searchId.value = String(result.productId)
      dialogOpen.value = false
      loadProduct()
    })
    .catch((error: unknown) => {
      ElMessage.error(error instanceof ApiError ? error.message : '保存失败')
    })
    .finally(() => {
      saving.value = false
    })
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">商品管理</h2>
        <p class="mt-1 text-sm text-ink-500">
          管理端仅提供「按 ID 查询」与「创建/更新」接口，没有商品列表接口；浏览全量商品请前往商城货架。
        </p>
      </div>
      <el-button type="primary" @click="openCreate">
        <Plus :size="15" class="mr-1.5" aria-hidden="true" />
        新建商品
      </el-button>
    </header>

    <section class="surface-card mt-5 p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="loadProduct">
        <div class="w-full sm:w-64">
          <label for="admin-product-id" class="mb-1 block text-xs text-ink-500">商品 ID</label>
          <el-input id="admin-product-id" v-model="searchId" placeholder="输入商品 ID 后查询" clearable>
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>
        <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
        <RouterLink :to="{ name: 'products' }" class="ml-auto text-sm">
          <el-button text type="primary">去商城货架浏览</el-button>
        </RouterLink>
      </form>
    </section>

    <section class="mt-5">
      <div v-if="loading" class="surface-card flex gap-6 p-6">
        <div class="h-40 w-40 animate-pulse rounded-lg bg-muted" />
        <div class="flex-1 space-y-3">
          <div class="h-6 w-1/2 animate-pulse rounded bg-muted" />
          <div class="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div class="h-16 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <EmptyState
        v-else-if="errorMessage"
        title="未查询到商品"
        :description="errorMessage"
        action-text="重新查询"
        @action="loadProduct"
      />

      <div v-else-if="product" class="surface-card p-6">
        <div class="flex flex-col gap-6 sm:flex-row">
          <div class="h-40 w-full shrink-0 overflow-hidden rounded-lg border border-line sm:w-40">
            <ProductImage :src="product.imageUrl" :alt="product.name" eager />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-semibold">{{ product.name }}</h3>
              <el-tag :type="product.status === 'ON_SHELF' ? 'success' : 'info'" size="small" effect="light">
                {{ product.status === 'ON_SHELF' ? '上架' : '下架' }}
              </el-tag>
            </div>

            <p class="num mt-2 text-2xl font-semibold text-price">{{ formatPrice(product.originalPrice) }}</p>
            <p class="mt-1 text-sm text-ink-500">
              总库存
              <span class="num text-ink-900">{{ product.totalStock }}</span>
              ｜ 可用库存
              <span class="num text-ink-900">{{ product.availableStock }}</span>
              ｜ 商品 ID
              <span class="num text-ink-900">{{ product.productId }}</span>
            </p>
            <p class="mt-3 line-clamp-3 text-sm leading-6 text-ink-500">
              {{ product.description || '商家未填写商品描述。' }}
            </p>

            <div class="mt-5 flex flex-wrap gap-2">
              <el-button type="primary" plain @click="openEdit">
                <Edit3 :size="14" class="mr-1.5" aria-hidden="true" />
                编辑商品
              </el-button>
              <RouterLink :to="{ name: 'product-detail', params: { id: product.productId } }">
                <el-button text type="primary">在商城中查看</el-button>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="surface-card p-10 text-center">
        <p class="text-[15px] font-medium text-ink-900">输入商品 ID 开始编辑</p>
        <p class="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ink-500">
          也可以直接新建商品。保存后会返回真实 productId，并自动回填到查询框。
        </p>
      </div>
    </section>

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑商品' : '新建商品'" width="min(560px, 92vw)" destroy-on-close>
      <ProductForm :initial="editing" :submitting="saving" @submit="onSubmit" @cancel="dialogOpen = false" />
    </el-dialog>
  </div>
</template>
