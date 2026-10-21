<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Bot, CornerDownRight, Database, RotateCcw, Sparkles } from 'lucide-vue-next'
import { listActivities } from '@/modules/activity/api'
import { resolveActivityState } from '@/modules/activity/utils/activityPhase'
import { isLiveState } from '@/modules/activity/utils/grouping'
import type { ActivityItemVO } from '@/modules/activity/types'
import { buildPreviewReply } from '@/modules/ai/utils/previewReply'
import { useTypewriter } from '@/modules/ai/composables/useTypewriter'

const rootRef = ref<HTMLElement | null>(null)

const previewActivity = ref<ActivityItemVO | null>(null)
const ready = ref(false)
const inView = ref(false)

let observer: IntersectionObserver | null = null

const reply = computed(() => buildPreviewReply(previewActivity.value))
const source = computed(() => reply.value.text)
const { visible, done, start, restart, skip } = useTypewriter(source, { interval: 24, chunk: 2 })

function pickLiveActivity(items: ActivityItemVO[]): ActivityItemVO | null {
  const now = Date.now()
  const live = items
    .map((item) => ({
      item,
      state: resolveActivityState({
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        stock: item.stock,
        preheated: item.preheated,
        now,
      }),
    }))
    .filter((entry) => isLiveState(entry.state) && (entry.item.stock ?? 0) > 0)

  live.sort((a, b) => Number(a.state !== 'RUNNING') - Number(b.state !== 'RUNNING'))
  return live[0]?.item ?? null
}

function maybeStart(): void {
  if (!ready.value || !inView.value) return
  start()
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  listActivities()
    .then((items) => {
      previewActivity.value = pickLiveActivity(items)
    })
    .catch((error: unknown) => {
      console.error('[ai-preview] 活动数据加载失败，预览降级为通用说明', error)
    })
    .finally(() => {
      ready.value = true
      maybeStart()
    })

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      inView.value = true
      maybeStart()
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.2 },
  )

  if (rootRef.value) observer.observe(rootRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <aside ref="rootRef" class="relative" aria-label="AI 客服对话示例">
    <div
      class="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-soft via-[#DBEAFE]/50 to-transparent blur-2xl"
      aria-hidden="true"
    />

    <div class="overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-lift">
      <header class="flex items-center gap-3 border-b border-line/70 bg-gradient-to-r from-brand-soft/80 via-surface to-surface px-4 py-3.5 sm:px-5">
        <span class="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white">
          <Bot :size="18" aria-hidden="true" />
          <span class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-ink-900">智能客服</p>
          <p class="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500">
            <span class="h-1 w-1 rounded-full bg-success" aria-hidden="true" />
            在线 · 回答秒杀相关问题
          </p>
        </div>
        <span class="ml-auto shrink-0 rounded-full border border-line bg-surface/90 px-2.5 py-1 text-[10px] font-medium tracking-wide text-ink-500">
          示例对话
        </span>
      </header>

      <div class="min-h-[236px] space-y-3.5 px-4 py-5 sm:px-5">
        <div class="flex justify-end">
          <p class="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-brand to-brand-dark px-4 py-2.5 text-sm leading-6 text-white shadow-[0_8px_18px_rgba(15,23,42,0.16)]">
            现在有哪些秒杀活动？
          </p>
        </div>

        <div class="flex gap-2.5">
          <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white">
            <Bot :size="14" aria-hidden="true" />
          </span>
          <div class="min-w-0 max-w-[88%] rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-3 shadow-sm">
            <p class="min-h-[108px] text-sm leading-6 text-ink-900" aria-hidden="true">
              {{ visible }}<span
                v-if="!done"
                class="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-brand motion-reduce:hidden"
              />
            </p>
            <p class="sr-only">{{ reply.text }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 pl-[42px] text-[11px] text-ink-500">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
            <Database v-if="reply.live" :size="11" aria-hidden="true" />
            <Sparkles v-else :size="11" aria-hidden="true" />
            {{ reply.live ? '数据来自活动接口' : '通用能力示例' }}
          </span>
          <span>回答由模型生成，库存以下单页为准</span>
        </div>
      </div>

      <footer class="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 bg-muted/30 px-4 py-2.5 sm:px-5">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink-700 transition-colors hover:bg-brand-soft hover:text-brand-dark"
            @click="restart"
          >
            <RotateCcw :size="13" aria-hidden="true" />
            重新播放
          </button>
          <button
            v-if="!done"
            type="button"
            class="inline-flex min-h-11 items-center rounded-full px-3 text-xs text-ink-500 transition-colors hover:text-brand-dark"
            @click="skip"
          >
            跳过动画
          </button>
        </div>
        <p class="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
          <CornerDownRight :size="12" aria-hidden="true" />
          输入框在下方对话区
        </p>
      </footer>
    </div>
  </aside>
</template>
