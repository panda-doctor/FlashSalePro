<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowUpRight, Bot, Send, Sparkles, User } from 'lucide-vue-next'
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

interface MessageSegment {
  text: string
  bold: boolean
}

/** 把模型常见的 Markdown 表格压成可读的「 · 」行，避免原始竖线铺满气泡 */
function normalizeContent(content: string): string {
  return content
    .split('\n')
    .filter((line) => !/^\s*\|?[\s:|-]{3,}\|?\s*$/.test(line))
    .map((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        return trimmed
          .slice(1, -1)
          .split('|')
          .map((cell) => cell.trim())
          .filter(Boolean)
          .join('  ·  ')
      }
      return line.replace(/^#{1,6}\s+/, '')
    })
    .join('\n')
}

/** 仅解析 **加粗**，不执行 HTML，避免模型输出被当作标记渲染 */
function segments(content: string): MessageSegment[] {
  return normalizeContent(content)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    )
}

function scrollToBottom(): void {
  nextTick(() => {
    const element = scrollRef.value
    if (!element) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollTo({ top: element.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
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
  <section class="surface-card flex h-[calc(100dvh-18rem)] min-h-[420px] flex-col overflow-hidden sm:h-[min(68vh,640px)]">
    <header class="flex items-center gap-3 border-b border-line/70 bg-gradient-to-r from-brand-soft via-surface to-surface px-4 py-4 sm:px-5">
      <span class="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] text-white shadow-[0_8px_18px_rgba(0,0,0,0.42)]">
        <Bot :size="19" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-sm font-semibold text-ink-900">
          智能客服
          <span class="hidden rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-normal text-success sm:inline">在线</span>
        </p>
        <p class="mt-0.5 truncate text-xs text-ink-500">基于商品与活动目录回答，不读取账号密码</p>
      </div>
      <span class="ml-auto hidden text-[10px] uppercase tracking-[0.2em] text-ink-500 sm:block">Concierge</span>
    </header>

    <div
      ref="scrollRef"
      class="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(ellipse_at_20%_0%,rgba(29,78,216,0.06),transparent_55%)] px-4 py-5 sm:px-5"
      aria-live="polite"
    >
      <div v-if="!messages.length" class="mx-auto max-w-md py-4 text-center sm:py-8">
        <span class="mx-auto grid h-14 w-14 place-items-center rounded-3xl border border-brand/20 bg-brand-soft text-brand-dark">
          <Sparkles :size="24" aria-hidden="true" />
        </span>
        <p class="mt-5 font-display text-xl font-bold text-ink-900">可以问我这些</p>
        <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
          活动时间、库存与价格、订单状态、抢购规则。回答由后端调用模型生成，可能不含最新库存。
        </p>
        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <button
            v-for="item in suggestions"
            :key="item"
            type="button"
            class="group inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-left text-xs text-ink-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand-soft/40 hover:text-brand-dark"
            @click="send(item)"
          >
            {{ item }}
            <ArrowUpRight :size="12" class="text-ink-300 transition-colors group-hover:text-brand" aria-hidden="true" />
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
          :class="
            message.role === 'user'
              ? 'border border-brand/15 bg-brand-soft text-brand'
              : 'bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] text-white'
          "
        >
          <User v-if="message.role === 'user'" :size="15" aria-hidden="true" />
          <Bot v-else :size="15" aria-hidden="true" />
        </span>

        <div
          class="max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6"
          :class="
            message.role === 'user'
              ? 'rounded-tr-sm bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] text-white shadow-[0_8px_18px_rgba(15,23,42,0.16)]'
              : message.failed
                ? 'rounded-tl-sm border border-danger/25 bg-danger/10 text-ink-900'
                : 'rounded-tl-sm border border-line bg-surface text-ink-900 shadow-sm'
          "
        >
          <template v-for="(segment, index) in segments(message.content)" :key="index">
            <strong v-if="segment.bold" class="font-semibold">{{ segment.text }}</strong>
            <template v-else>{{ segment.text }}</template>
          </template>
        </div>
      </div>

      <div v-if="sending" class="flex items-center gap-2.5">
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] text-white">
          <Bot :size="15" aria-hidden="true" />
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-3">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/60" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/60 [animation-delay:120ms]" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/60 [animation-delay:240ms]" />
          <span class="sr-only">正在生成回复</span>
        </span>
      </div>
    </div>

    <form class="border-t border-line/70 bg-surface/95 p-3 sm:p-4" @submit.prevent="send()">
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
        <p class="text-[11px] leading-5 text-ink-500">公开接口，请勿输入密码、手机号等敏感信息。</p>
        <el-button type="primary" native-type="submit" :loading="sending" :disabled="!input.trim()">
          <Send :size="14" class="mr-1.5" aria-hidden="true" />
          发送
        </el-button>
      </div>
    </form>
  </section>
</template>
