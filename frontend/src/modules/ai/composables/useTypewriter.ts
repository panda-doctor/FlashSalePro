import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export interface TypewriterOptions {
  /** 每个 tick 的间隔，毫秒 */
  interval?: number
  /** 每个 tick 追加的字符数 */
  chunk?: number
}

/**
 * 轻量打字机：只用于展示型文案，不参与真实聊天请求。
 * 调用方通过 start() 控制首次播放时机（例如进入视口后再开始）。
 */
export function useTypewriter(source: Ref<string>, options: TypewriterOptions = {}) {
  const interval = Math.max(8, options.interval ?? 26)
  const chunk = Math.max(1, options.chunk ?? 2)

  const visible = ref('')
  const done = ref(true)

  let timer: number | null = null
  let media: MediaQueryList | null = null
  let reduceMotion = false
  let started = false

  function stop(): void {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  function finish(): void {
    stop()
    visible.value = source.value
    done.value = true
  }

  function run(): void {
    stop()
    const text = source.value

    if (!text) {
      visible.value = ''
      done.value = true
      return
    }

    if (reduceMotion) {
      finish()
      return
    }

    visible.value = ''
    done.value = false

    timer = window.setInterval(() => {
      const next = text.slice(0, visible.value.length + chunk)
      visible.value = next
      if (next.length >= text.length) finish()
    }, interval)
  }

  function start(): void {
    started = true
    run()
  }

  function restart(): void {
    started = true
    run()
  }

  function skip(): void {
    started = true
    finish()
  }

  function onMotionChange(event: MediaQueryListEvent): void {
    reduceMotion = event.matches
    if (reduceMotion) finish()
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion = media.matches
    if (reduceMotion && started) finish()
    media.addEventListener('change', onMotionChange)
  })

  onBeforeUnmount(() => {
    stop()
    media?.removeEventListener('change', onMotionChange)
  })

  // 数据到达后重播，避免先播空文本
  watch(source, () => {
    if (started) run()
  })

  return { visible, done, start, restart, skip }
}
