<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bot, Send, Sparkles, User } from 'lucide-vue-next'
import { sendChat, type ChatTurn } from '@/modules/ai/api'
import { ApiError, RESULT_CODE } from '@/shared/types/common'

interface ChatMessage extends ChatTurn {
  id: number
  failed?: boolean
}

const MAX_LENGTH = 500
const MAX_HISTORY = 10
/** 两次提交最小间隔：公开接口无限流，前端自行节流 */
const SEND_INTERVAL_MS = 1500

const messages = ref<ChatMessage[]>([])
const input = ref('')
const sending = ref(false)
const scrollRef = ref<HTMLElement | null>(null)
let messageId = 0
let lastSentAt = 0
let controller: AbortController | null = null

function isCanceled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as { code?: string }).code === 'ERR_CANCELED' ||
      (error as { name?: string }).name === 'CanceledError')
  )
}

onBeforeUnmount(() => controller?.abort())

const suggestions = ['现在有哪些秒杀活动？', '秒杀订单一直显示排队中怎么办？', '每个人最多能买几件？']

function scrollToBottom(): void {
  nextTick(() => {
    const element = scrollRef.value
    if (element) element.scrollTop = element.scrollHeight
  })
}

function pushMessage(role: ChatTurn['role'], content: string, failed = false): void {
  messageId += 1
  messages.value.push({ id: messageId, role, content, failed })
  scrollToBottom()
}

function buildHistory(): ChatTurn[] {
  return messages.value
    .slice(-MAX_HISTORY)
    .map((message) => ({ role: message.role, content: message.content }))
}

function send(text?: string): void {
  const content = (text ?? input.value).trim()
  if (!content || sending.value) return

  if (content.length > MAX_LENGTH) {
    ElMessage.warning(`问题最多 ${MAX_LENGTH} 字`)
    return
  }

  const now = Date.now()
  if (now - lastSentAt < SEND_INTERVAL_MS) {
    ElMessage.warning('请稍候再发送下一条')
    return
  }
  lastSentAt = now

  const history = buildHistory()
  pushMessage('user', content)
  input.value = ''
  sending.value = true

  controller?.abort()
  controller = new AbortController()

  sendChat({ message: content, history }, controller.signal)
    .then((result) => {
      pushMessage('assistant', result.reply)
    })
    .catch((error: unknown) => {
      if (isCanceled(error)) return
      const code = error instanceof ApiError ? error.code : 0
      const message =
        code === RESULT_CODE.AI_SERVICE_UNCONFIGURED
          ? 'AI 客服尚未配置模型密钥（后端返回 50300），请联系管理员配置 AI_LLM_API_KEY。'
          : error instanceof ApiError
            ? error.message
            : 'AI 客服暂时不可用，请稍后再试。'
      pushMessage('assistant', message, true)
    })
    .finally(() => {
      sending.value = false
    })
}

function onKeydown(event: Event | KeyboardEvent): void {
  // el-input 透传的原生事件类型是 Event | KeyboardEvent，这里显式收窄
  if (!(event instanceof KeyboardEvent)) return
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  send()
}
</script>

<template>
  <section class="surface-card flex h-[560px] flex-col overflow-hidden">
    <header class="flex items-center gap-3 border-b border-line/70 px-4 py-3">
      <span class="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand-dark">
        <Bot :size="18" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <p class="text-sm font-semibold">智能客服</p>
        <p class="text-xs text-ink-500">基于商品与活动目录回答，不涉及账号密码</p>
      </div>
      <span class="ml-auto flex items-center gap-1.5 text-xs text-ink-500">
        <span class="h-1.5 w-1.5 rounded-full bg-success" />
        在线
      </span>
    </header>

    <div ref="scrollRef" class="flex-1 space-y-4 overflow-y-auto bg-muted/40 px-4 py-5" aria-live="polite">
      <div v-if="!messages.length" class="mx-auto max-w-md py-6 text-center">
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles :size="22" aria-hidden="true" />
        </span>
        <p class="mt-4 text-[15px] font-medium">可以问我这些</p>
        <p class="mt-1 text-sm leading-6 text-ink-500">
          活动时间、库存与价格、订单状态、抢购规则。回答由后端调用模型生成，可能不含最新库存。
        </p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button
            v-for="item in suggestions"
            :key="item"
            type="button"
            class="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-700 transition-colors hover:border-brand/50 hover:text-brand"
            @click="send(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        class="flex gap-2.5"
        :class="message.role === 'user' ? 'flex-row-reverse' : ''"
      >
        <span
          class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
          :class="message.role === 'user' ? 'bg-brand text-white' : 'bg-surface text-brand-dark border border-line'"
        >
          <User v-if="message.role === 'user'" :size="15" aria-hidden="true" />
          <Bot v-else :size="15" aria-hidden="true" />
        </span>

        <div
          class="max-w-[78%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-6"
          :class="
            message.role === 'user'
              ? 'rounded-tr-sm bg-brand text-white'
              : message.failed
                ? 'rounded-tl-sm border border-danger/30 bg-[#FEF0F0] text-ink-900'
                : 'rounded-tl-sm border border-line bg-surface text-ink-900'
          "
        >
          {{ message.content }}
        </div>
      </div>

      <div v-if="sending" class="flex items-center gap-2 text-xs text-ink-500">
        <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
        <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:120ms]" />
        <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:240ms]" />
        正在生成回复
      </div>
    </div>

    <form class="border-t border-line/70 bg-surface p-3" @submit.prevent="send()">
      <label for="ai-input" class="sr-only">输入问题</label>
      <el-input
        id="ai-input"
        v-model="input"
        type="textarea"
        :rows="2"
        resize="none"
        :maxlength="MAX_LENGTH"
        show-word-limit
        placeholder="输入问题，Enter 发送，Shift + Enter 换行"
        @keydown="onKeydown"
      />
      <div class="mt-2 flex items-center justify-between gap-3">
        <p class="text-xs text-ink-500">公开接口，请勿输入密码、手机号等敏感信息。</p>
        <el-button type="primary" native-type="submit" :loading="sending" :disabled="!input.trim()">
          <Send :size="14" class="mr-1.5" aria-hidden="true" />
          发送
        </el-button>
      </div>
    </form>
  </section>
</template>
