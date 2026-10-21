<script setup lang="ts">
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import OrderStatusTag from '@/modules/order/components/OrderStatusTag.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { getAdminOrder, pageAdminOrders } from '@/modules/order/api'
import { usePagedQuery } from '@/shared/composables/usePagedQuery'
import { ApiError } from '@/shared/types/common'
import { formatDateTime } from '@/shared/utils/time'
import { formatPrice } from '@/shared/utils/money'
import type { AdminOrderVO, OrderStatus } from '@/modules/order/types'

type AdminOrderQueryForm = {
  orderNo: string
  activityId: string
  userId: string
  status: OrderStatus | 'ALL'
}

const statusOptions: Array<{ value: OrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部状态' },
  { value: 'QUEUING', label: '排队中' },
  { value: 'CREATED', label: '已创建' },
  { value: 'CREATE_FAILED', label: '创建失败' },
  { value: 'CANCELLED', label: '已取消' },
]

/** 非数字输入不发送给后端，避免 NaN 序列化成 "?activityId=NaN" */
function toOptionalId(value: string): number | undefined {
  const numeric = Number(value.trim())
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

function fetchOrders(
  params: AdminOrderQueryForm & { page: number; pageSize: number },
  signal?: AbortSignal,
) {
  return pageAdminOrders(
    {
      page: params.page,
      pageSize: params.pageSize,
      orderNo: params.orderNo || undefined,
      activityId: toOptionalId(params.activityId),
      userId: toOptionalId(params.userId),
      status: params.status,
    },
    signal,
  )
}

const { items, total, page, pageSize, query, loading, error, search, reset, setPage, setPageSize } =
  usePagedQuery<AdminOrderVO, AdminOrderQueryForm>({
    fetcher: fetchOrders,
    initialQuery: { orderNo: '', activityId: '', userId: '', status: 'ALL' },
    pageSize: 10,
  })

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<AdminOrderVO | null>(null)

function asOrder(row: unknown): AdminOrderVO {
  return row as AdminOrderVO
}

function openDetail(row: AdminOrderVO): void {
  detail.value = row
  detailOpen.value = true
  detailLoading.value = true
  getAdminOrder(row.orderNo)
    .then((data) => {
      detail.value = data
    })
    .catch((err: unknown) => {
      if (err instanceof ApiError) detail.value = row
    })
    .finally(() => {
      detailLoading.value = false
    })
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">订单管理</h2>
        <p class="mt-1 text-sm text-ink-500">
          按订单号、活动、用户与状态检索订单；订单号精确匹配，其余条件可组合。
        </p>
      </div>
    </header>

    <section class="surface-card mt-5 p-4">
      <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end" @submit.prevent="search">
        <div>
          <label for="admin-order-no" class="mb-1 block text-xs text-ink-500">订单号</label>
          <el-input id="admin-order-no" v-model="query.orderNo" placeholder="精确匹配" clearable @clear="search">
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>

        <div>
          <label for="admin-order-activity" class="mb-1 block text-xs text-ink-500">活动 ID</label>
          <el-input id="admin-order-activity" v-model="query.activityId" placeholder="例如 12" clearable />
        </div>

        <div>
          <label for="admin-order-user" class="mb-1 block text-xs text-ink-500">用户 ID</label>
          <el-input id="admin-order-user" v-model="query.userId" placeholder="例如 8" clearable />
        </div>

        <div>
          <label for="admin-order-status" class="mb-1 block text-xs text-ink-500">状态</label>
          <el-select id="admin-order-status" v-model="query.status" class="w-full">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div class="flex gap-2">
          <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
          <el-button :disabled="loading" @click="reset">重置</el-button>
        </div>
      </form>
    </section>

    <section class="mt-5">
      <div v-if="loading && !items.length" class="surface-card space-y-3 p-5">
        <SkeletonBlock v-for="index in 5" :key="index" class="h-10" />
      </div>

      <EmptyState
        v-else-if="error"
        title="订单加载失败"
        :description="error"
        action-text="重新加载"
        @action="search"
      />

      <template v-else>
        <div class="surface-card overflow-x-auto">
          <el-table :data="items" row-key="orderNo" class="w-full" table-layout="fixed">
            <el-table-column label="订单号" min-width="190">
              <template #default="{ row }">
                <button type="button" class="num text-left text-sm text-brand hover:underline" @click="openDetail(asOrder(row))">
                  {{ asOrder(row).orderNo }}
                </button>
                <p class="num mt-0.5 text-xs text-ink-500">{{ formatDateTime(asOrder(row).createdAt) }}</p>
              </template>
            </el-table-column>

            <el-table-column label="活动 / 商品" width="150">
              <template #default="{ row }">
                <p class="num text-xs text-ink-700">活动 #{{ asOrder(row).activityId }}</p>
                <p class="num mt-0.5 text-xs text-ink-500">商品 #{{ asOrder(row).productId }}</p>
              </template>
            </el-table-column>

            <el-table-column label="用户" width="100" align="right">
              <template #default="{ row }">
                <span class="num text-sm text-ink-900">#{{ asOrder(row).userId }}</span>
              </template>
            </el-table-column>

            <el-table-column label="金额" width="110" align="right">
              <template #default="{ row }">
                <span class="num text-sm font-medium text-price">{{ formatPrice(asOrder(row).seckillPrice) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <OrderStatusTag :status="asOrder(row).status" :status-desc="asOrder(row).statusDesc" />
              </template>
            </el-table-column>

            <el-table-column label="失败原因" min-width="160">
              <template #default="{ row }">
                <span class="line-clamp-2 text-xs text-ink-500">{{ asOrder(row).failureReason || '—' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="80" align="right">
              <template #default="{ row }">
                <el-button text type="primary" @click="openDetail(asOrder(row))">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <EmptyState
            v-if="!items.length"
            title="没有符合条件的订单"
            description="放宽筛选条件后重试；订单号必须完全一致。"
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

    <el-drawer v-model="detailOpen" title="订单详情" size="min(520px, 94vw)" destroy-on-close>
      <div v-loading="detailLoading" class="min-h-32 space-y-4">
        <template v-if="detail">
          <div class="flex items-center justify-between gap-3">
            <p class="num text-sm font-semibold text-ink-900">{{ detail.orderNo }}</p>
            <OrderStatusTag :status="detail.status" :status-desc="detail.statusDesc" size="default" />
          </div>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-lg bg-canvas p-3">
              <dt class="text-xs text-ink-500">活动</dt>
              <dd class="num mt-1 text-ink-900">#{{ detail.activityId }}</dd>
            </div>
            <div class="rounded-lg bg-canvas p-3">
              <dt class="text-xs text-ink-500">商品</dt>
              <dd class="num mt-1 text-ink-900">#{{ detail.productId }}</dd>
            </div>
            <div class="rounded-lg bg-canvas p-3">
              <dt class="text-xs text-ink-500">用户</dt>
              <dd class="num mt-1 text-ink-900">#{{ detail.userId }}</dd>
            </div>
            <div class="rounded-lg bg-canvas p-3">
              <dt class="text-xs text-ink-500">成交价</dt>
              <dd class="num mt-1 font-medium text-price">{{ formatPrice(detail.seckillPrice) }}</dd>
            </div>
          </dl>

          <div>
            <p class="text-xs text-ink-500">创建时间</p>
            <p class="num mt-1 text-sm">{{ formatDateTime(detail.createdAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500">更新时间</p>
            <p class="num mt-1 text-sm">{{ formatDateTime(detail.updatedAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500">消息 ID</p>
            <p class="num mt-1 break-all text-xs text-ink-700">{{ detail.streamMessageId || '—' }}</p>
          </div>
          <div v-if="detail.failureReason">
            <p class="text-xs text-ink-500">失败原因</p>
            <p class="mt-1 rounded-lg bg-danger/5 p-3 text-sm leading-6 text-danger">{{ detail.failureReason }}</p>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>
