<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RotateCcw, Search } from 'lucide-vue-next'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { pageAdminDeadLetters, replayDeadLetter, replayDeadLetterBatch } from '@/modules/order/api'
import { usePagedQuery } from '@/shared/composables/usePagedQuery'
import { ApiError } from '@/shared/types/common'
import { formatDateTime } from '@/shared/utils/time'
import type { DeadLetterBatchReplayResult, DeadLetterItemVO, DeadLetterQuery } from '@/modules/order/types'

type DeadLetterQueryForm = { keyword: string; activityId: string }

/** 非数字输入不发送给后端，避免 NaN 序列化成 "?activityId=NaN" */
function toOptionalId(value: string): number | undefined {
  const numeric = Number(value.trim())
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

function fetchDeadLetters(
  params: DeadLetterQueryForm & { page: number; pageSize: number },
  signal?: AbortSignal,
) {
  return pageAdminDeadLetters(
    {
      page: params.page,
      pageSize: params.pageSize,
      keyword: params.keyword || undefined,
      activityId: toOptionalId(params.activityId),
    } satisfies DeadLetterQuery,
    signal,
  )
}

const { items, total, page, pageSize, query, loading, error, search, reset, setPage, setPageSize, refresh } =
  usePagedQuery<DeadLetterItemVO, DeadLetterQueryForm>({
    fetcher: fetchDeadLetters,
    initialQuery: { keyword: '', activityId: '' },
    pageSize: 10,
  })

const selected = ref<DeadLetterItemVO[]>([])
const working = ref(false)
const batchResult = ref<DeadLetterBatchReplayResult | null>(null)

const selectedIds = computed(() => selected.value.map((item) => item.streamMessageId))

function onSelectionChange(rows: DeadLetterItemVO[]): void {
  selected.value = rows
}

/** el-table 插槽 row 类型是 DefaultRow，统一收窄为业务类型 */
function asDead(row: unknown): DeadLetterItemVO {
  return row as DeadLetterItemVO
}

function replayOne(row: DeadLetterItemVO): void {
  if (working.value) return

  ElMessageBox.confirm(
    `确认重放死信 ${row.streamMessageId}？重放会重新占用库存并投递新消息。`,
    '死信重放',
    { confirmButtonText: '确认重放', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => {
      working.value = true
      return replayDeadLetter({ originalMessageId: row.streamMessageId })
        .then(() => {
          ElMessage.success('重放成功')
          refresh()
        })
        .catch((err: unknown) => {
          ElMessage.error(err instanceof ApiError ? err.message : '重放失败')
        })
        .finally(() => {
          working.value = false
        })
    })
    .catch(() => {
      // 用户取消
    })
}

function replaySelected(): void {
  if (working.value || !selectedIds.value.length) return

  ElMessageBox.confirm(
    `确认重放选中的 ${selectedIds.value.length} 条死信？失败的条目会在结果中列出原因。`,
    '批量重放',
    { confirmButtonText: '确认重放', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => {
      working.value = true
      return replayDeadLetterBatch(selectedIds.value)
        .then((result) => {
          batchResult.value = result
          ElMessage.success(`重放完成：成功 ${result.succeeded} / ${result.attempted}`)
          refresh()
        })
        .catch((err: unknown) => {
          ElMessage.error(err instanceof ApiError ? err.message : '批量重放失败')
        })
        .finally(() => {
          working.value = false
        })
    })
    .catch(() => {
      // 用户取消
    })
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">死信管理</h2>
        <p class="mt-1 text-sm text-ink-500">
          列出 status=DEAD 的消息日志，勾选后批量重放；重放仍从死信流读取完整消息体。
        </p>
      </div>
      <el-button
        type="primary"
        :disabled="!selectedIds.length || working"
        :loading="working"
        @click="replaySelected"
      >
        <RotateCcw :size="15" class="mr-1.5" aria-hidden="true" />
        批量重放{{ selectedIds.length ? `（${selectedIds.length}）` : '' }}
      </el-button>
    </header>

    <section class="surface-card mt-5 p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="search">
        <div class="w-full sm:w-72">
          <label for="admin-dead-keyword" class="mb-1 block text-xs text-ink-500">订单号 / 消息 ID</label>
          <el-input
            id="admin-dead-keyword"
            v-model="query.keyword"
            placeholder="支持模糊匹配"
            clearable
            @clear="search"
          >
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>

        <div class="w-full sm:w-40">
          <label for="admin-dead-activity" class="mb-1 block text-xs text-ink-500">活动 ID</label>
          <el-input id="admin-dead-activity" v-model="query.activityId" placeholder="可选" clearable />
        </div>

        <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
        <el-button :disabled="loading" @click="reset">重置</el-button>
      </form>
    </section>

    <div v-if="batchResult" class="mt-4 rounded-lg border border-line/70 bg-surface p-4 text-sm">
      <p>
        尝试 <b class="num">{{ batchResult.attempted }}</b> ｜ 成功
        <b class="num text-success">{{ batchResult.succeeded }}</b> ｜ 失败
        <b class="num text-danger">{{ batchResult.failed }}</b>
      </p>
      <ul v-if="batchResult.failures.length" class="mt-2 space-y-1 text-xs text-danger">
        <li v-for="failure in batchResult.failures" :key="failure" class="break-all">{{ failure }}</li>
      </ul>
    </div>

    <section class="mt-5">
      <div v-if="loading && !items.length" class="surface-card space-y-3 p-5">
        <SkeletonBlock v-for="index in 5" :key="index" class="h-10" />
      </div>

      <EmptyState
        v-else-if="error"
        title="死信加载失败"
        :description="error"
        action-text="重新加载"
        @action="search"
      />

      <template v-else>
        <div class="surface-card overflow-hidden">
          <el-table
            :data="items"
            row-key="streamMessageId"
            class="w-full"
            table-layout="fixed"
            @selection-change="onSelectionChange"
          >
            <el-table-column type="selection" width="46" />

            <el-table-column label="消息 ID" min-width="170">
              <template #default="{ row }">
                <p class="num truncate text-xs text-ink-900">{{ asDead(row).streamMessageId }}</p>
                <p class="num mt-0.5 text-xs text-ink-500">
                  {{ formatDateTime(asDead(row).updatedAt) }}
                </p>
              </template>
            </el-table-column>

            <el-table-column label="订单号" min-width="170">
              <template #default="{ row }">
                <span class="num text-xs text-ink-700">{{ asDead(row).orderNo || '—' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="活动 / 用户" width="130">
              <template #default="{ row }">
                <p class="num text-xs text-ink-700">
                  活动 {{ asDead(row).activityId ?? '—' }}
                </p>
                <p class="num mt-0.5 text-xs text-ink-500">
                  用户 {{ asDead(row).userId ?? '—' }}
                </p>
              </template>
            </el-table-column>

            <el-table-column label="重试" width="72" align="center">
              <template #default="{ row }">
                <span class="num text-sm">{{ asDead(row).retryCount ?? 0 }}</span>
              </template>
            </el-table-column>

            <el-table-column label="失败原因" min-width="200">
              <template #default="{ row }">
                <span class="line-clamp-2 text-xs text-ink-500">
                  {{ asDead(row).errorMessage || '—' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="88" align="right">
              <template #default="{ row }">
                <el-button text type="primary" :disabled="working" @click="replayOne(asDead(row))">
                  重放
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <EmptyState
            v-if="!items.length"
            title="没有死信消息"
            description="当前筛选条件下没有 status=DEAD 的消息，说明消费链路正常。"
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
  </div>
</template>
