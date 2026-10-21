<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Boxes, Database, Layers, ReceiptText, RefreshCw, Search, X } from 'lucide-vue-next'
import ProductCard from '@/modules/product/components/ProductCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ListPagination from '@/shared/ui/ListPagination.vue'
import { listProducts } from '@/modules/product/api'
import { usePagedQuery } from '@/shared/composables/usePagedQuery'
import { debounce } from '@/shared/utils/debounce'
import { pageRange } from '@/shared/utils/pagination'
import type { ProductVO } from '@/modules/product/types'

const PAGE_SIZE = 4

const route = useRoute()
const router = useRouter()

const catalogRef = ref<HTMLElement | null>(null)

function initialKeyword(): string {
  return typeof route.query.keyword === 'string' ? route.query.keyword : ''
}

const { items, total, page, pages, query, loading, error, search, reset, setPage, refresh } =
  usePagedQuery<ProductVO, { keyword: string }>({
    fetcher: listProducts,
    initialQuery: { keyword: initialKeyword() },
    pageSize: PAGE_SIZE,
  })

const range = computed(() => pageRange(page.value, PAGE_SIZE, total.value))
const totalPages = computed(() => Math.max(1, pages.value))
const hasFilter = computed(() => query.keyword.trim().length > 0)

/**
 * 列数跟随当前页实际件数：不足 4 件时卡片自动放大铺满整行，
 * 避免末页或筛选结果只剩一两个商品时右侧出现大片空白。
 */
const gridClass = computed(() => {
  const count = items.value.length
  if (count <= 1) return 'mx-auto max-w-md grid-cols-1 lg:max-w-xl'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
})

function scrollToCatalog(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  catalogRef.value?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

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

function onPageChange(next: number): void {
  if (next === page.value) return
  void setPage(next)
  scrollToCatalog()
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

// 刷新或筛选导致总页数变少时，把越界页码夹回最后一页
watch(pages, (value) => {
  if (value > 0 && page.value > value) void setPage(value)
})
</script>

<template>
  <div class="product-page min-h-[70vh] pb-16">
    <section
      class="relative isolate overflow-hidden bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white text-ink-900"
      aria-label="限时秒杀横幅"
    >
      <div
        class="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-brand/25 blur-[90px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-[#BFDBFE]/35 blur-[110px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.12]"
        style="background-image: radial-gradient(rgba(15, 23, 42, 0.28) 1px, transparent 1px); background-size: 22px 22px"
        aria-hidden="true"
      />
      <div class="page-container relative py-10 sm:py-12">
        <header class="flex flex-wrap items-end justify-between gap-5">
          <div class="min-w-0">
            <p class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-dark">
              <span class="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              Limited Deal / 01
            </p>
            <h1 class="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-bold leading-tight tracking-tight">
              商品货架
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-7 text-ink-500">
              仅展示上架商品，共
              <span class="num font-semibold text-price">{{ total }}</span>
              件。价格与普通库存来自实时接口，秒杀库存以活动预热为准。
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <span
              class="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface/80 px-4 text-xs text-ink-700 backdrop-blur-sm"
            >
              <Layers :size="14" class="text-brand" aria-hidden="true" />
              每页 <span class="num font-semibold text-ink-900">{{ PAGE_SIZE }}</span> 件
            </span>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface/80 px-6 py-3 text-sm font-medium tracking-wide text-ink-700 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface hover:text-brand-dark hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
              :disabled="loading"
              @click="refresh"
            >
              <RefreshCw :size="15" :class="{ 'animate-spin': loading }" aria-hidden="true" />
              刷新
            </button>
          </div>
        </header>
      </div>
    </section>

    <div class="page-container py-8 sm:py-10">
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[11px] font-medium text-ink-700 shadow-card sm:text-xs">
          <span class="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-50 motion-reduce:hidden" />
            <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
          </span>
          <span class="grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-brand-dark">
            <Database :size="13" aria-hidden="true" />
          </span>
          接口实时价格
        </span>
        <span class="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[11px] font-medium text-ink-700 shadow-card sm:text-xs">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-warning/15 text-warning">
            <Boxes :size="13" aria-hidden="true" />
          </span>
          在售目录
          <span class="num font-semibold text-brand-dark">{{ total }}</span>
        </span>
        <span class="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[11px] font-medium text-ink-700 shadow-card sm:text-xs">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-warning/15 text-warning">
            <ReceiptText :size="13" aria-hidden="true" />
          </span>
          订单可追踪
        </span>
      </div>

      <section class="surface-card relative mt-5 overflow-hidden p-4 sm:mt-6 sm:p-5">
        <div class="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" aria-hidden="true" />
        <form class="flex flex-col gap-4 lg:flex-row lg:items-end" role="search" @submit.prevent="onSubmit">
          <div class="min-w-0 flex-1">
            <label for="product-keyword" class="text-xs font-medium tracking-wide text-ink-700">商品关键字</label>
            <div class="relative mt-1.5">
              <Search class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" :size="16" aria-hidden="true" />
              <input
                id="product-keyword"
                v-model="query.keyword"
                type="search"
                placeholder="输入商品名称后回车或点击查询"
                class="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-11 text-sm text-ink-900 outline-none transition-all duration-200 placeholder:text-ink-500 focus:border-brand-light/60 focus:shadow-[0_0_0_4px_rgba(29,78,216,0.16)] [&::-webkit-search-cancel-button]:hidden"
                @input="onKeywordInput"
              />
              <button
                v-if="query.keyword"
                type="button"
                class="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-ink-500 transition-colors hover:bg-brand-soft hover:text-brand-dark"
                aria-label="清空搜索"
                @click="query.keyword = ''; onClear()"
              >
                <X :size="15" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="submit" class="product-cta h-12" :disabled="loading">查询</button>
            <button type="button" class="product-ghost h-12" @click="onReset">重置</button>
          </div>
        </form>
        <p class="mt-3 hidden text-xs leading-5 text-ink-500 sm:block">
          输入即搜，停顿 300ms 后自动更新结果；固定每页 {{ PAGE_SIZE }} 件，翻页后自动回到目录顶部。
        </p>
      </section>

      <div class="mt-5 flex flex-wrap items-end justify-between gap-3 sm:mt-6">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-dark">Catalog / 目录</p>
          <p class="mt-1 text-xs leading-6 tracking-wide text-ink-500">
            找到
            <span class="num font-semibold text-ink-900">{{ total }}</span>
            件商品
            <span v-if="hasFilter" class="ml-2 rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand-dark">
              “{{ query.keyword.trim() }}”
            </span>
          </p>
        </div>
        <p class="hidden items-center gap-2 text-xs text-ink-500 sm:flex">
          <span class="h-px w-8 bg-gradient-to-r from-brand/50 to-transparent" aria-hidden="true" />
          第 <span class="num font-medium text-ink-700">{{ range.start }}–{{ range.end }}</span> 件 · 共
          <span class="num font-medium text-ink-700">{{ totalPages }}</span> 页
        </p>
      </div>

      <section ref="catalogRef" class="section-anchor mt-4" :aria-busy="loading">
        <div v-if="loading && !items.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="index in PAGE_SIZE" :key="index" class="surface-card overflow-hidden">
            <div class="product-stage aspect-[4/3] animate-pulse" />
            <div class="space-y-3 p-5">
              <div class="h-2.5 w-1/3 animate-pulse rounded-full bg-muted" />
              <div class="h-4 w-3/4 animate-pulse rounded-full bg-line/70" />
              <div class="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
              <div class="h-6 w-1/3 animate-pulse rounded-full bg-brand-soft" />
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

        <div
          v-else
          class="grid gap-5 transition-opacity duration-200"
          :class="[gridClass, { 'pointer-events-none opacity-50': loading }]"
        >
          <ProductCard v-for="product in items" :key="product.productId" :product="product" />
        </div>
      </section>

      <div
        v-if="items.length || total > 0"
        class="mt-9 rounded-2xl border border-line/80 bg-surface/85 px-4 py-3.5 shadow-card backdrop-blur-xl sm:px-5"
      >
        <ListPagination
          :page="page"
          :pages="totalPages"
          :total="total"
          :page-size="PAGE_SIZE"
          unit="件"
          aria-label="商品分页"
          :disabled="loading"
          @change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>
