<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RefreshCw, Search } from 'lucide-vue-next'
import ProductCard from '@/modules/product/components/ProductCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { listProducts } from '@/modules/product/api'
import { usePagedQuery } from '@/shared/composables/usePagedQuery'
import { debounce } from '@/shared/utils/debounce'
import type { ProductVO } from '@/modules/product/types'

const route = useRoute()
const router = useRouter()

const pageSizes = [12, 24, 48]

function initialKeyword(): string {
  return typeof route.query.keyword === 'string' ? route.query.keyword : ''
}

const { items, total, page, pageSize, query, loading, error, search, reset, setPage, setPageSize, refresh } =
  usePagedQuery<ProductVO, { keyword: string }>({
    fetcher: listProducts,
    initialQuery: { keyword: initialKeyword() },
    pageSize: 12,
  })

function syncUrl(): void {
  const keyword = query.keyword.trim()
  router.replace({ query: keyword ? { keyword } : {} })
}

function onSubmit(): void {
  query.keyword = query.keyword.trim()
  syncUrl()
  void search()
}

function onReset(): void {
  onKeywordInput.cancel()
  router.replace({ query: {} })
  void reset()
}

/** 输入即搜：300ms 防抖，避免逐字符打请求；回车/点击查询会先取消防抖 */
const onKeywordInput = debounce(() => onSubmit(), 300)

function onClear(): void {
  onKeywordInput.cancel()
  onSubmit()
}

onBeforeUnmount(() => onKeywordInput.cancel())

watch(
  () => route.query.keyword,
  (value) => {
    const next = typeof value === 'string' ? value : ''
    if (next === query.keyword) return
    query.keyword = next
    void search()
  },
)
</script>

<template>
  <div class="page-container py-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">商品货架</h1>
        <p class="mt-1 text-sm text-ink-500">
          仅展示上架商品，共
          <span class="num font-medium text-ink-900">{{ total }}</span>
          件
        </p>
      </div>
      <el-button plain :loading="loading" @click="refresh">
        <RefreshCw :size="14" class="mr-1.5" aria-hidden="true" />
        刷新
      </el-button>
    </header>

    <section class="surface-card mt-6 p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="onSubmit">
        <div class="w-full sm:w-80">
          <label for="product-keyword" class="mb-1 block text-xs text-ink-500">商品关键字</label>
          <el-input
            id="product-keyword"
            v-model="query.keyword"
            placeholder="输入商品名称后回车或点击查询"
            clearable
            @input="onKeywordInput"
            @clear="onClear"
          >
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>

        <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
        <el-button @click="onReset">重置</el-button>

        <div class="ml-auto flex items-center gap-2 text-sm text-ink-500">
          <label for="product-page-size">每页</label>
          <el-select
            id="product-page-size"
            :model-value="pageSize"
            class="w-20"
            @update:model-value="setPageSize"
          >
            <el-option v-for="size in pageSizes" :key="size" :label="String(size)" :value="size" />
          </el-select>
        </div>
      </form>
    </section>

    <section class="mt-6">
      <div v-if="loading && !items.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div v-for="index in 8" :key="index" class="surface-card overflow-hidden">
          <SkeletonBlock class="aspect-square" rounded="sm" />
          <div class="space-y-2 p-4">
            <SkeletonBlock class="h-4 w-3/4" />
            <SkeletonBlock class="h-3 w-1/2" />
            <SkeletonBlock class="h-5 w-1/3" />
          </div>
        </div>
      </div>

      <EmptyState
        v-else-if="error"
        title="商品加载失败"
        :description="error"
        action-text="重新加载"
        @action="refresh"
      />

      <EmptyState
        v-else-if="!items.length"
        title="没有找到匹配的商品"
        description="换一个关键字，或清空筛选条件后再试。"
        action-text="重置筛选"
        @action="onReset"
      />

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProductCard v-for="product in items" :key="product.productId" :product="product" />
      </div>
    </section>

    <div v-if="items.length" class="mt-8 flex justify-center">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="setPage"
      />
    </div>
  </div>
</template>
