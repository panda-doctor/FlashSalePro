<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, RefreshCw, Search, Settings2 } from 'lucide-vue-next'
import ActivityOpsDrawer from '@/modules/admin/components/ActivityOpsDrawer.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { pageAdminActivities } from '@/modules/activity/api'
import { usePagedQuery } from '@/shared/composables/usePagedQuery'
import { formatPrice } from '@/shared/utils/money'
import type { ActivityItemVO, ActivityStatus } from '@/modules/activity/types'

type ActivityQuery = { keyword: string; status: ActivityStatus | 'ALL' }

const route = useRoute()
const router = useRouter()

const { items, total, page, pageSize, query, loading, error, search, reset, setPage, setPageSize, refresh } =
  usePagedQuery<ActivityItemVO, ActivityQuery>({
    fetcher: pageAdminActivities,
    initialQuery: { keyword: '', status: 'ALL' },
    pageSize: 10,
  })

const drawerOpen = ref(false)
const drawerActivityId = ref<number | null>(null)

const statusOptions: Array<{ value: ActivityStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部状态' },
  { value: 'NOT_STARTED', label: '未开始' },
  { value: 'RUNNING', label: '进行中' },
  { value: 'ENDED', label: '已结束' },
  { value: 'SOLD_OUT', label: '已售罄' },
  { value: 'CANCELLED', label: '已取消' },
]

const statusMeta: Record<ActivityStatus, { label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = {
  NOT_STARTED: { label: '未开始', type: 'info' },
  RUNNING: { label: '进行中', type: 'success' },
  ENDED: { label: '已结束', type: 'info' },
  SOLD_OUT: { label: '已售罄', type: 'warning' },
  CANCELLED: { label: '已取消', type: 'danger' },
}

function asActivity(row: unknown): ActivityItemVO {
  return row as ActivityItemVO
}

function openOps(row?: ActivityItemVO): void {
  drawerActivityId.value = row ? row.activityId : null
  drawerOpen.value = true
  if (row) {
    void router.replace({ query: { ...route.query, id: String(row.activityId) } })
  }
}

function onDrawerVisible(value: boolean): void {
  drawerOpen.value = value
  if (!value) {
    const { id: _ignored, ...rest } = route.query
    void router.replace({ query: rest })
  }
}

function onSaved(activityId: number): void {
  drawerActivityId.value = activityId
  void router.replace({ query: { ...route.query, id: String(activityId) } })
  refresh()
}

onMounted(() => {
  const routeId = Number(route.query.id)
  const remembered = Number(sessionStorage.getItem('flash.admin.activityId'))
  const initialId = Number.isFinite(routeId) && routeId > 0 ? routeId : remembered
  if (Number.isFinite(initialId) && initialId > 0) {
    drawerActivityId.value = initialId
    drawerOpen.value = true
  }
})
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">活动运维</h2>
        <p class="mt-1 text-sm text-ink-500">
          按关键字与状态筛选活动，行内进入运维抽屉完成配置、预热、库存重置与指标查看。
        </p>
      </div>
      <el-button type="primary" @click="openOps()">
        <Plus :size="15" class="mr-1.5" aria-hidden="true" />
        新建活动
      </el-button>
    </header>

    <section class="surface-card mt-5 p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="search">
        <div class="w-full sm:w-64">
          <label for="admin-activity-keyword" class="mb-1 block text-xs text-ink-500">活动名称</label>
          <el-input
            id="admin-activity-keyword"
            v-model="query.keyword"
            placeholder="输入活动名称关键字"
            clearable
            @clear="search"
          >
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>

        <div class="w-full sm:w-40">
          <label for="admin-activity-status" class="mb-1 block text-xs text-ink-500">状态</label>
          <el-select id="admin-activity-status" v-model="query.status" class="w-full" @change="search">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
        <el-button :disabled="loading" @click="reset">重置</el-button>
        <el-button class="ml-auto" text :disabled="loading" @click="refresh">
          <RefreshCw :size="14" class="mr-1" aria-hidden="true" />
          刷新
        </el-button>
      </form>
    </section>

    <section class="mt-5">
      <div v-if="loading && !items.length" class="surface-card space-y-3 p-5">
        <SkeletonBlock v-for="index in 5" :key="index" class="h-9" />
      </div>

      <EmptyState
        v-else-if="error"
        title="活动加载失败"
        :description="error"
        action-text="重新加载"
        @action="refresh"
      />

      <template v-else>
        <div class="surface-card overflow-hidden">
          <el-table :data="items" row-key="activityId" class="w-full" table-layout="fixed">
            <el-table-column label="ID" width="86">
              <template #default="{ row }">
                <span class="num text-xs text-ink-500">#{{ asActivity(row).activityId }}</span>
              </template>
            </el-table-column>

            <el-table-column label="活动 / 商品" min-width="200">
              <template #default="{ row }">
                <p class="truncate text-sm font-medium text-ink-900">{{ asActivity(row).activityName }}</p>
                <p class="mt-0.5 truncate text-xs text-ink-500">
                  {{ asActivity(row).productName || `商品 #${asActivity(row).productId}` }}
                </p>
              </template>
            </el-table-column>

            <el-table-column label="时间窗" min-width="190">
              <template #default="{ row }">
                <p class="num text-xs text-ink-700">{{ asActivity(row).startTime }}</p>
                <p class="num text-xs text-ink-500">至 {{ asActivity(row).endTime }}</p>
              </template>
            </el-table-column>

            <el-table-column label="秒杀价" width="110" align="right">
              <template #default="{ row }">
                <span class="num text-sm font-medium text-price">{{ formatPrice(asActivity(row).seckillPrice) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="库存" width="100" align="right">
              <template #default="{ row }">
                <span class="num text-sm text-ink-900">{{ asActivity(row).stock ?? '—' }}</span>
                <span class="num text-xs text-ink-500"> / {{ asActivity(row).totalStock }}</span>
              </template>
            </el-table-column>

            <el-table-column label="预热" width="88" align="center">
              <template #default="{ row }">
                <el-tag :type="asActivity(row).preheated ? 'success' : 'info'" size="small" effect="light">
                  {{ asActivity(row).preheated ? '已预热' : '未预热' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="92" align="center">
              <template #default="{ row }">
                <el-tag :type="statusMeta[asActivity(row).status].type" size="small" effect="light">
                  {{ statusMeta[asActivity(row).status].label }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="96" align="right">
              <template #default="{ row }">
                <el-button text type="primary" @click="openOps(asActivity(row))">
                  <Settings2 :size="14" class="mr-1" aria-hidden="true" />
                  运维
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <EmptyState
            v-if="!items.length"
            title="没有符合条件的活动"
            description="调整关键字或状态后重试，也可以直接新建活动。"
            action-text="新建活动"
            @action="openOps()"
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

    <ActivityOpsDrawer
      :model-value="drawerOpen"
      :activity-id="drawerActivityId"
      @update:model-value="onDrawerVisible"
      @saved="onSaved"
      @changed="refresh"
    />
  </div>
</template>
