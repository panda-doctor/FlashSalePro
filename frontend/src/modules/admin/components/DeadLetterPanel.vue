<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RotateCcw } from 'lucide-vue-next'
import { replayDeadLetter, replayDeadLetterBatch } from '@/modules/order/api'
import { ApiError } from '@/shared/types/common'
import type { DeadLetterBatchReplayResult, DeadLetterReplayResult } from '@/modules/order/types'

const singleId = ref('')
const batchText = ref('')
const working = ref(false)
const singleResult = ref<DeadLetterReplayResult | null>(null)
const batchResult = ref<DeadLetterBatchReplayResult | null>(null)

const batchIds = computed(() =>
  batchText.value
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean),
)

function replayOne(): void {
  if (!singleId.value.trim() || working.value) return

  ElMessageBox.confirm(
    `确认重放死信消息 ${singleId.value.trim()}？重放会重新占用库存并投递新消息。`,
    '死信重放',
    { confirmButtonText: '确认重放', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => {
      working.value = true
      return replayDeadLetter({ originalMessageId: singleId.value.trim() })
        .then((result) => {
          singleResult.value = result
          ElMessage.success('重放成功')
        })
        .catch((error: unknown) => {
          ElMessage.error(error instanceof ApiError ? error.message : '重放失败')
        })
        .finally(() => {
          working.value = false
        })
    })
    .catch(() => {
      // 用户取消
    })
}

function replayBatch(): void {
  if (!batchIds.value.length || working.value) return

  ElMessageBox.confirm(
    `确认重放 ${batchIds.value.length} 条死信消息？失败的条目会在结果中列出原因。`,
    '批量重放',
    { confirmButtonText: '确认重放', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => {
      working.value = true
      return replayDeadLetterBatch(batchIds.value)
        .then((result) => {
          batchResult.value = result
          ElMessage.success(`重放完成：成功 ${result.succeeded} / ${result.attempted}`)
        })
        .catch((error: unknown) => {
          ElMessage.error(error instanceof ApiError ? error.message : '批量重放失败')
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
  <section class="surface-card p-5">
    <h2 class="text-[15px] font-semibold">死信重放</h2>
    <p class="mt-1 text-sm leading-6 text-ink-500">
      仅状态为 DEAD 的消息可重放；重放会重新执行 Lua 占位并投递新消息，已落库的订单会被拒绝。
    </p>

    <div class="mt-5 grid gap-6 lg:grid-cols-2">
      <form @submit.prevent="replayOne">
        <label for="dead-letter-id" class="mb-1 block text-xs text-ink-500">单条重放</label>
        <el-input id="dead-letter-id" v-model="singleId" placeholder="输入原消息 ID（stream message id）" clearable />
        <el-button class="mt-3" type="primary" plain :loading="working" native-type="submit">
          <RotateCcw :size="14" class="mr-1.5" aria-hidden="true" />
          重放单条
        </el-button>

        <div v-if="singleResult" class="mt-4 rounded-lg bg-muted p-3 text-xs leading-6">
          <p>原消息：<span class="num">{{ singleResult.originalMessageId }}</span></p>
          <p>新消息：<span class="num">{{ singleResult.replayMessageId }}</span></p>
        </div>
      </form>

      <form @submit.prevent="replayBatch">
        <label for="dead-letter-batch" class="mb-1 block text-xs text-ink-500">
          批量重放（每行一个，或用逗号分隔）
        </label>
        <el-input
          id="dead-letter-batch"
          v-model="batchText"
          type="textarea"
          :rows="4"
          placeholder="1700000000000-0&#10;1700000000001-0"
        />
        <div class="mt-3 flex items-center gap-3">
          <el-button type="primary" plain :loading="working" native-type="submit">
            重放 {{ batchIds.length }} 条
          </el-button>
          <span class="text-xs text-ink-500">已识别 {{ batchIds.length }} 个 ID</span>
        </div>

        <div v-if="batchResult" class="mt-4 rounded-lg bg-muted p-3 text-xs leading-6">
          <p>
            尝试 <b class="num">{{ batchResult.attempted }}</b> ｜ 成功
            <b class="num text-success">{{ batchResult.succeeded }}</b> ｜ 失败
            <b class="num text-danger">{{ batchResult.failed }}</b>
          </p>
          <ul v-if="batchResult.failures.length" class="mt-2 space-y-1 text-danger">
            <li v-for="failure in batchResult.failures" :key="failure" class="break-all">{{ failure }}</li>
          </ul>
        </div>
      </form>
    </div>
  </section>
</template>
