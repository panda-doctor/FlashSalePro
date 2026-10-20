<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, PackageX } from 'lucide-vue-next'
import ProductImage from '@/modules/product/components/ProductImage.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import { getProduct } from '@/modules/product/api'
import { ApiError, RESULT_CODE } from '@/shared/types/common'
import type { ProductVO } from '@/modules/product/types'
import { formatPrice } from '@/shared/utils/money'

const route = useRoute()
const router = useRouter()

const product = ref<ProductVO | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const notFound = ref(false)

const productId = computed(() => String(route.params.id ?? ''))
const hasActivities = computed(() => router.hasRoute('activities'))

function load(): void {
  loading.value = true
  errorMessage.value = ''
  notFound.value = false

  getProduct(productId.value)
    .then((data) => {
      product.value = data
    })
    .catch((error: unknown) => {
      product.value = null
      if (error instanceof ApiError && error.code === RESULT_CODE.NOT_FOUND) {
        notFound.value = true
        return
      }
      errorMessage.value = error instanceof ApiError ? error.message : '加载失败，请稍后重试'
    })
    .finally(() => {
      loading.value = false
    })
}

watch(productId, load, { immediate: true })
</script>

<template>
  <div class="page-container py-8">
    <nav class="mb-5 flex items-center gap-2 text-sm text-ink-500" aria-label="面包屑">
      <RouterLink :to="{ name: 'products' }" class="hover:text-brand">商品货架</RouterLink>
      <span aria-hidden="true">/</span>
      <span class="text-ink-900">商品详情</span>
    </nav>

    <div v-if="loading" class="grid gap-8 lg:grid-cols-[minmax(0,460px)_1fr]">
      <div class="surface-card aspect-square animate-pulse bg-muted" />
      <div class="space-y-4">
        <div class="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div class="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div class="h-24 animate-pulse rounded bg-muted" />
        <div class="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>

    <EmptyState
      v-else-if="notFound"
      title="商品不存在或已下架"
      description="该商品可能已被下架。公开接口只返回上架商品。"
      :icon="PackageX"
      action-text="返回商品列表"
      @action="router.push({ name: 'products' })"
    />

    <EmptyState
      v-else-if="errorMessage"
      title="商品加载失败"
      :description="errorMessage"
      action-text="重新加载"
      @action="load"
    />

    <article v-else-if="product" class="grid gap-8 lg:grid-cols-[minmax(0,460px)_1fr]">
      <div class="surface-card overflow-hidden">
        <div class="aspect-square w-full">
          <ProductImage :src="product.imageUrl" :alt="product.name" eager />
        </div>
      </div>

      <div>
        <h1 class="text-2xl font-semibold leading-snug">{{ product.name }}</h1>

        <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-500">
          <el-tag type="success" size="small" effect="light">在售</el-tag>
          <span class="num">商品 ID {{ product.productId }}</span>
        </div>

        <div class="mt-6 rounded-xl bg-brand-soft/60 px-5 py-4">
          <p class="text-xs text-brand-dark">当前售价</p>
          <p class="num mt-1 text-3xl font-semibold leading-tight text-price">
            {{ formatPrice(product.originalPrice) }}
          </p>
        </div>

        <dl class="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-ink-500">总库存</dt>
            <dd class="num mt-1 text-base font-medium text-ink-900">{{ product.totalStock }}</dd>
          </div>
          <div>
            <dt class="text-ink-500">可用库存</dt>
            <dd class="num mt-1 text-base font-medium text-ink-900">{{ product.availableStock }}</dd>
          </div>
        </dl>

        <section class="mt-6 border-t border-line/70 pt-5">
          <h2 class="text-sm font-semibold">商品描述</h2>
          <p class="mt-2 whitespace-pre-line text-sm leading-7 text-ink-700">
            {{ product.description || '商家未填写商品描述。' }}
          </p>
        </section>

        <div class="mt-8 flex flex-wrap gap-3">
          <el-button
            v-if="hasActivities"
            type="primary"
            @click="router.push({ name: 'activities' })"
          >
            查看秒杀活动
          </el-button>
          <el-button @click="router.back()">
            <ArrowLeft :size="15" class="mr-1.5" aria-hidden="true" />
            返回
          </el-button>
        </div>

        <p class="mt-4 text-xs leading-5 text-ink-500">
          商品库存为普通可用库存；秒杀库存以活动预热后的 Redis 值为准，两者口径不同，不能相互换算。
        </p>
      </div>
    </article>
  </div>
</template>
