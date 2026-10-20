<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit3, Eye, Plus, RefreshCw, Search } from 'lucide-vue-next'
import ProductForm from '@/modules/admin/components/ProductForm.vue'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { getAdminProduct, pageAdminProducts, saveAdminProduct } from '@/modules/product/api'
import { usePagedQuery } from '@/shared/composables/usePagedQuery'
import { ApiError } from '@/shared/types/common'
import { formatPrice } from '@/shared/utils/money'
import type { ProductRequest, ProductStatus, ProductVO } from '@/modules/product/types'

type ProductQuery = { keyword: string; status: ProductStatus | 'ALL' }

const { items, total, page, pageSize, query, loading, error, search, reset, setPage, setPageSize, refresh } =
  usePagedQuery<ProductVO, ProductQuery>({
    fetcher: pageAdminProducts,
    initialQuery: { keyword: '', status: 'ALL' },
    pageSize: 10,
  })

const dialogOpen = ref(false)
const editing = ref<ProductVO | null>(null)
const saving = ref(false)
const togglingId = ref<number | null>(null)

const lookupId = ref('')
const lookupLoading = ref(false)

const statusOptions: Array<{ value: ProductStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部状态' },
  { value: 'ON_SHELF', label: '上架' },
  { value: 'OFF_SHELF', label: '下架' },
]

function asProduct(row: unknown): ProductVO {
  return row as ProductVO
}

function openCreate(): void {
  editing.value = null
  dialogOpen.value = true
}

function openEdit(product: ProductVO): void {
  editing.value = product
  dialogOpen.value = true
}

function openById(): void {
  const id = lookupId.value.trim()
  if (!id) {
    ElMessage.warning('请输入商品 ID')
    return
  }

  lookupLoading.value = true
  getAdminProduct(id)
    .then((data) => {
      openEdit(data)
    })
    .catch((err: unknown) => {
      ElMessage.error(err instanceof ApiError ? err.message : '商品查询失败')
    })
    .finally(() => {
      lookupLoading.value = false
    })
}

function onSubmit(payload: ProductRequest): void {
  saving.value = true

  saveAdminProduct(payload)
    .then((result) => {
      ElMessage.success(payload.productId ? '商品已更新' : '商品已创建')
      lookupId.value = String(result.productId)
      dialogOpen.value = false
      refresh()
    })
    .catch((err: unknown) => {
      ElMessage.error(err instanceof ApiError ? err.message : '保存失败')
    })
    .finally(() => {
      saving.value = false
    })
}

function toggleShelf(product: ProductVO): void {
  const next: ProductStatus = product.status === 'ON_SHELF' ? 'OFF_SHELF' : 'ON_SHELF'
  const action = next === 'ON_SHELF' ? '上架' : '下架'

  ElMessageBox.confirm(`确认${action}「${product.name}」？`, `${action}商品`, {
    confirmButtonText: `确认${action}`,
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      togglingId.value = product.productId
      return saveAdminProduct({
        productId: product.productId,
        name: product.name,
        description: product.description ?? undefined,
        imageUrl: product.imageUrl ?? undefined,
        originalPrice: product.originalPrice,
        totalStock: product.totalStock,
        status: next,
      }).then(() => {
        ElMessage.success(`已${action}`)
        refresh()
      })
    })
    .catch((err: unknown) => {
      if (err instanceof ApiError) ElMessage.error(err.message)
    })
    .finally(() => {
      togglingId.value = null
    })
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">商品管理</h2>
        <p class="mt-1 text-sm text-ink-500">
          全量商品（含已下架）分页浏览，支持关键字与状态筛选、编辑与一键上下架。
        </p>
      </div>
      <el-button type="primary" @click="openCreate">
        <Plus :size="15" class="mr-1.5" aria-hidden="true" />
        新建商品
      </el-button>
    </header>

    <section class="surface-card mt-5 p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="search">
        <div class="w-full sm:w-60">
          <label for="admin-product-keyword" class="mb-1 block text-xs text-ink-500">商品名称</label>
          <el-input
            id="admin-product-keyword"
            v-model="query.keyword"
            placeholder="输入商品名称关键字"
            clearable
            @clear="search"
          >
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>

        <div class="w-full sm:w-36">
          <label for="admin-product-status" class="mb-1 block text-xs text-ink-500">状态</label>
          <el-select id="admin-product-status" v-model="query.status" class="w-full" @change="search">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
        <el-button :disabled="loading" @click="reset">重置</el-button>

        <div class="ml-auto flex items-end gap-2">
          <div class="w-32">
            <label for="admin-product-lookup" class="mb-1 block text-xs text-ink-500">按 ID 打开</label>
            <el-input
              id="admin-product-lookup"
              v-model="lookupId"
              placeholder="商品 ID"
              clearable
              @keyup.enter="openById"
            />
          </div>
          <el-button :loading="lookupLoading" @click="openById">打开</el-button>
          <el-button text :disabled="loading" @click="refresh">
            <RefreshCw :size="14" class="mr-1" aria-hidden="true" />
            刷新
          </el-button>
        </div>
      </form>
    </section>

    <section class="mt-5">
      <div v-if="loading && !items.length" class="surface-card space-y-3 p-5">
        <SkeletonBlock v-for="index in 5" :key="index" class="h-12" />
      </div>

      <EmptyState
        v-else-if="error"
        title="商品加载失败"
        :description="error"
        action-text="重新加载"
        @action="refresh"
      />

      <template v-else>
        <div class="surface-card overflow-hidden">
          <el-table :data="items" row-key="productId" class="w-full" table-layout="fixed">
            <el-table-column label="商品" min-width="240">
              <template #default="{ row }">
                <div class="flex items-center gap-3">
                  <div class="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-line/70">
                    <ProductImage :src="asProduct(row).imageUrl" :alt="asProduct(row).name" eager />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-ink-900">{{ asProduct(row).name }}</p>
                    <p class="num mt-0.5 text-xs text-ink-500">#{{ asProduct(row).productId }}</p>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="原价" width="110" align="right">
              <template #default="{ row }">
                <span class="num text-sm font-medium text-price">{{ formatPrice(asProduct(row).originalPrice) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="库存（可用/总）" width="140" align="right">
              <template #default="{ row }">
                <span class="num text-sm text-ink-900">{{ asProduct(row).availableStock }}</span>
                <span class="num text-xs text-ink-500"> / {{ asProduct(row).totalStock }}</span>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="92" align="center">
              <template #default="{ row }">
                <el-tag :type="asProduct(row).status === 'ON_SHELF' ? 'success' : 'info'" size="small" effect="light">
                  {{ asProduct(row).status === 'ON_SHELF' ? '上架' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="230" align="right">
              <template #default="{ row }">
                <el-button text type="primary" @click="openEdit(asProduct(row))">
                  <Edit3 :size="14" class="mr-1" aria-hidden="true" />
                  编辑
                </el-button>
                <el-button
                  text
                  :type="asProduct(row).status === 'ON_SHELF' ? 'warning' : 'success'"
                  :loading="togglingId === asProduct(row).productId"
                  @click="toggleShelf(asProduct(row))"
                >
                  {{ asProduct(row).status === 'ON_SHELF' ? '下架' : '上架' }}
                </el-button>
                <RouterLink :to="{ name: 'product-detail', params: { id: asProduct(row).productId } }">
                  <el-button text>
                    <Eye :size="14" class="mr-1" aria-hidden="true" />
                    查看
                  </el-button>
                </RouterLink>
              </template>
            </el-table-column>
          </el-table>

          <EmptyState
            v-if="!items.length"
            title="没有符合条件的商品"
            description="调整关键字或状态后重试，也可以直接新建商品。"
            action-text="新建商品"
            @action="openCreate"
          />
        </div>

        <div class="mt-4 flex justify-end">
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next"
            @current-change="setPage"
            @size-change="setPageSize"
          />
        </div>
      </template>
    </section>

    <el-dialog
      v-model="dialogOpen"
      :title="editing ? '编辑商品' : '新建商品'"
      width="min(560px, 92vw)"
      destroy-on-close
    >
      <ProductForm :initial="editing" :submitting="saving" @submit="onSubmit" @cancel="dialogOpen = false" />
    </el-dialog>
  </div>
</template>
