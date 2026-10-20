<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera, Flame, RotateCcw } from 'lucide-vue-next'
import ActivityForm from '@/modules/admin/components/ActivityForm.vue'
import MetricsPanel from '@/modules/analytics/components/MetricsPanel.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import { getActivity, preheatActivity, resetActivityStock, saveAdminActivity } from '@/modules/activity/api'
import { getProduct } from '@/modules/product/api'
import { captureSnapshot } from '@/modules/order/api'
import { ApiError } from '@/shared/types/common'
import type { ActivityRequest, SeckillActivityVO } from '@/modules/activity/types'

type ActionKind = 'preheat' | 'reset' | 'snapshot'

const props = defineProps<{
  modelValue: boolean
  activityId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [activityId: number]
  changed: []
}>()

/** 记住最近一次运维的活动，刷新页面后仍可回到该对象 */
const LAST_ACTIVITY_KEY = 'flash.admin.activityId'

const activeTab = ref('config')
const activity = ref<SeckillActivityVO | null>(null)
const productName = ref('')
const loadingActivity = ref(false)
const saving = ref(false)
const acting = ref<ActionKind | null>(null)

const formKey = computed(() =>
  activity.value ? `activity-${activity.value.activityId}` : 'activity-new',
)

function visibleUpdate(value: boolean): void {
  emit('update:modelValue', value)
}

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

function loadActivity(id = props.activityId): void {
  if (!id) {
    activity.value = null
    productName.value = ''
    return
  }

  loadingActivity.value = true
  getActivity(String(id))
    .then((data) => {
      activity.value = data
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(data.activityId))
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

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    activeTab.value = 'config'
    loadActivity()
  },
  { immediate: true },
)

watch(
  () => props.activityId,
  () => {
    if (props.modelValue) loadActivity()
  },
)

function onSubmit(payload: ActivityRequest): void {
  saving.value = true

  saveAdminActivity(payload)
    .then((result) => {
      ElMessage.success(payload.activityId ? '活动已更新' : '活动已创建，请先预热库存')
      activeTab.value = 'ops'
      emit('saved', result.activityId)
      loadActivity(result.activityId)
      emit('changed')
    })
    .catch((error: unknown) => {
      ElMessage.error(error instanceof ApiError ? error.message : '活动保存失败')
    })
    .finally(() => {
      saving.value = false
    })
}

function confirmThen(
  kind: ActionKind,
  title: string,
  message: string,
  run: (id: number) => Promise<string>,
): void {
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
          loadActivity(id)
          emit('changed')
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
    '预热会写入活动缓存与 Redis 库存，并更新 preheat_status。已预热的活动会被拒绝。',
    (id) => preheatActivity(id).then((result) => `预热完成，Redis 库存 ${result.stock}`),
  )
}

function onReset(): void {
  confirmThen(
    'reset',
    '重置库存',
    '重置会把 Redis 库存恢复为活动配置库存。活动处于进行中时间窗时会被拒绝，避免“复活”已扣库存。',
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
  <el-drawer
    :model-value="modelValue"
    :title="activity ? `活动 #${activity.activityId}` : '新建活动'"
    size="min(760px, 96vw)"
    destroy-on-close
    @update:model-value="visibleUpdate"
  >
    <div v-loading="loadingActivity" class="min-h-40">
      <div class="mb-4 rounded-lg bg-canvas px-4 py-3">
        <p class="text-sm font-medium text-ink-900">
          {{ activity?.activityName || '新建活动' }}
        </p>
        <p class="mt-1 text-xs text-ink-500">
          {{ activity ? `商品：${productName || `#${activity.productId}`}` : '创建后会自动进入运维动作页，需预热后才能抢购。' }}
        </p>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="活动配置" name="config">
          <p v-if="activity" class="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand-dark">
            修改时间窗或库存后需要重新预热才会生效；进行中的活动不允许重置库存。
          </p>
          <ActivityForm
            :key="formKey"
            :initial="activity"
            :product-name="productName"
            :submitting="saving"
            @submit="onSubmit"
            @cancel="visibleUpdate(false)"
          />
        </el-tab-pane>

        <el-tab-pane label="运维动作" name="ops">
          <EmptyState
            v-if="!activity"
            title="先保存活动"
            description="新建活动保存后即可预热库存、重置库存与抓取快照。"
          />

          <section v-else class="surface-card p-5">
            <h3 class="text-[15px] font-semibold">运维动作</h3>
            <p class="mt-1 text-xs text-ink-500">
              预热与重置由 activity 服务执行，库存写入经内部接口完成；执行前会二次确认。
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
        </el-tab-pane>

        <el-tab-pane label="实时指标" name="metrics" :disabled="!activity">
          <MetricsPanel v-if="activity" :activity-id="activity.activityId" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>
