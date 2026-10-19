<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera, Flame, Plus, RotateCcw, Search } from 'lucide-vue-next'
import ActivityForm from '@/components/admin/ActivityForm.vue'
import MetricsPanel from '@/components/admin/MetricsPanel.vue'
import DeadLetterPanel from '@/components/admin/DeadLetterPanel.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getActivity, preheatActivity, resetActivityStock, saveAdminActivity } from '@/api/activity'
import { getProduct } from '@/api/product'
import { captureSnapshot } from '@/api/order'
import { ApiError } from '@/types/common'
import type { ActivityRequest, SeckillActivityVO } from '@/types/activity'

type ActionKind = 'preheat' | 'reset' | 'snapshot'

const activeTab = ref('config')
const searchId = ref('')
const activity = ref<SeckillActivityVO | null>(null)
const productName = ref('')
const loadingActivity = ref(false)
const saving = ref(false)
const acting = ref<ActionKind | null>(null)

const formKey = computed(() => (activity.value ? `activity-${activity.value.activityId}` : 'activity-new'))

function resolveProductName(productId: number): void {
  getProduct(productId)
    .then((data) => {
      productName.value = data.name
    })
    .catch((error: unknown) => {
      productName.value = ''
      console.error('商品名称解析失败', error)
    })
}

function loadActivity(idText?: string): void {
  const id = (idText ?? searchId.value).trim()
  if (!id) {
    ElMessage.warning('请输入活动 ID')
    return
  }

  loadingActivity.value = true
  getActivity(id)
    .then((data) => {
      activity.value = data
      searchId.value = String(data.activityId)
      resolveProductName(data.productId)
    })
    .catch((error: unknown) => {
      activity.value = null
      ElMessage.error(error instanceof ApiError ? error.message : '活动查询失败')
    })
    .finally(() => {
      loadingActivity.value = false
    })
}

function startCreate(): void {
  activity.value = null
  productName.value = ''
  searchId.value = ''
  activeTab.value = 'config'
}

function onSubmit(payload: ActivityRequest): void {
  saving.value = true

  saveAdminActivity(payload)
    .then((result) => {
      ElMessage.success(payload.activityId ? '活动已更新' : '活动已创建，请先预热库存')
      activeTab.value = 'ops'
      loadActivity(String(result.activityId))
    })
    .catch((error: unknown) => {
      ElMessage.error(error instanceof ApiError ? error.message : '活动保存失败')
    })
    .finally(() => {
      saving.value = false
    })
}

function confirmThen(kind: ActionKind, title: string, message: string, run: (id: number) => Promise<string>): void {
  if (!activity.value) return

  ElMessageBox.confirm(message, title, {
    confirmButtonText: '确认执行',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      acting.value = kind
      const id = activity.value?.activityId
      if (!id) return
      return run(id)
        .then((successMessage) => {
          ElMessage.success(successMessage)
          loadActivity(String(id))
        })
        .catch((error: unknown) => {
          ElMessage.error(error instanceof ApiError ? error.message : '操作失败')
        })
        .finally(() => {
          acting.value = null
        })
    })
    .catch(() => {
      // 用户取消
    })
}

function onPreheat(): void {
  confirmThen(
    'preheat',
    '预热活动',
    '预热会写入活动缓存与 Redis 库存，并更新 preheat_status。活动已预热时会被拒绝。',
    (id) => preheatActivity(id).then((result) => `预热完成，Redis 库存 ${result.stock}`),
  )
}

function onReset(): void {
  confirmThen(
    'reset',
    '重置库存',
    '重置会把 Redis 库存恢复为活动配置库存。活动处于进行中时间窗时会被后端拒绝，避免“复活”已扣库存。',
    (id) => resetActivityStock(id).then((result) => `库存已重置为 ${result.stock}`),
  )
}

function onSnapshot(): void {
  confirmThen('snapshot', '抓取指标快照', '快照会写入订单库，用于后续对账与趋势分析。', (id) =>
    captureSnapshot(id).then(() => '指标快照已写入订单库'),
  )
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">活动运维</h2>
        <p class="mt-1 text-sm text-ink-500">
          管理端没有活动列表接口：按活动 ID 载入详情后编辑、预热、重置库存与查看指标。
        </p>
      </div>
      <el-button type="primary" @click="startCreate">
        <Plus :size="15" class="mr-1.5" aria-hidden="true" />
        新建活动
      </el-button>
    </header>

    <section class="surface-card mt-5 p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="loadActivity()">
        <div class="w-full sm:w-64">
          <label for="admin-activity-id" class="mb-1 block text-xs text-ink-500">活动 ID</label>
          <el-input id="admin-activity-id" v-model="searchId" placeholder="输入活动 ID 后载入" clearable>
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>
        <el-button type="primary" native-type="submit" :loading="loadingActivity">载入活动</el-button>
        <span v-if="activity" class="num ml-auto text-xs text-ink-500">
          当前：{{ activity.activityName }}（#{{ activity.activityId }}）
        </span>
      </form>
    </section>

    <el-tabs v-model="activeTab" class="mt-5">
      <el-tab-pane label="活动配置" name="config">
        <div class="surface-card p-5">
          <p v-if="activity" class="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand-dark">
            正在编辑活动 #{{ activity.activityId }}；修改时间窗或库存后，需要重新预热才会生效。
          </p>
          <ActivityForm
            :key="formKey"
            :initial="activity"
            :product-name="productName"
            :submitting="saving"
            @submit="onSubmit"
            @cancel="activity = null"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="运维与指标" name="ops">
        <EmptyState
          v-if="!activity"
          title="请先载入活动"
          description="在上方输入活动 ID 并载入，或先创建活动。运维动作均以活动 ID 为唯一入参。"
        />

        <div v-else class="space-y-5">
          <section class="surface-card p-5">
            <h3 class="text-[15px] font-semibold">运维动作</h3>
            <p class="mt-1 text-xs text-ink-500">
              预热/重置库存由 activity 服务执行，库存写入经单体内部接口完成；执行前会二次确认。
            </p>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg border border-line/70 p-4">
                <Flame :size="18" class="text-warning" aria-hidden="true" />
                <p class="mt-2 text-sm font-medium">预热库存</p>
                <p class="mt-1 text-xs leading-5 text-ink-500">写入活动缓存与 Redis 库存，必须成功后秒杀才可用。</p>
                <el-button class="mt-3" type="primary" plain :loading="acting === 'preheat'" @click="onPreheat">
                  执行预热
                </el-button>
              </div>

              <div class="rounded-lg border border-line/70 p-4">
                <RotateCcw :size="18" class="text-brand" aria-hidden="true" />
                <p class="mt-2 text-sm font-medium">重置库存</p>
                <p class="mt-1 text-xs leading-5 text-ink-500">按配置库存回填 Redis；进行中的活动会被拒绝。</p>
                <el-button class="mt-3" plain :loading="acting === 'reset'" @click="onReset">重置库存</el-button>
              </div>

              <div class="rounded-lg border border-line/70 p-4">
                <Camera :size="18" class="text-ink-500" aria-hidden="true" />
                <p class="mt-2 text-sm font-medium">指标快照</p>
                <p class="mt-1 text-xs leading-5 text-ink-500">把当前库存/订单/拒绝计数落库，供对账使用。</p>
                <el-button class="mt-3" plain :loading="acting === 'snapshot'" @click="onSnapshot">
                  抓取快照
                </el-button>
              </div>
            </div>
          </section>

          <MetricsPanel :activity-id="activity.activityId" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="死信重放" name="dead">
        <DeadLetterPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
